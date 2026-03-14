"""
scraper.py
----------
Scrapes job posting pages to extract:
  - Company name
  - Job title
  - Recruiter / contact email (best-effort)

Strategy
────────
1. Attempt a lightweight requests + BeautifulSoup fetch first.
2. If the page appears to require JavaScript (empty body / bot-wall detected),
   fall back to Playwright for full browser rendering.
3. Heuristic email extraction scans visible text and mailto: links.

All public functions are async so they integrate seamlessly with FastAPI.
"""

from __future__ import annotations

import asyncio
import re
from typing import TypedDict
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from utils import is_valid_email, logger, truncate


# ── Return type ───────────────────────────────────────────────────────────────

class ScrapedJob(TypedDict):
    company_name: str
    job_title: str
    email: str       # Empty string when not found
    job_url: str


# ── Constants ─────────────────────────────────────────────────────────────────

_REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}
_TIMEOUT = 20  # seconds

# Signals that a page is JavaScript-rendered and we need Playwright
_JS_WALL_SIGNALS = ["enable javascript", "please enable js", "loading...", "checking your browser"]


# ── Public entry point ────────────────────────────────────────────────────────

async def scrape_job(url: str) -> ScrapedJob:
    """
    Scrape *url* and return a ScrapedJob dict.

    Tries static fetch first; falls back to Playwright on JS-walled pages or
    on HTTP errors.  Raises RuntimeError if scraping fails completely.
    """
    logger.info(f"[Scraper] Scraping {url}")

    html = await _fetch_static(url)

    if html and not _is_js_walled(html):
        result = _parse_html(html, url)
    else:
        logger.info("[Scraper] Static fetch insufficient — switching to Playwright.")
        html = await _fetch_playwright(url)
        result = _parse_html(html, url)

    logger.info(
        f"[Scraper] Done — company={result['company_name']!r} "
        f"title={result['job_title']!r} email={result['email']!r}"
    )
    return result


# ── Static fetch ──────────────────────────────────────────────────────────────

async def _fetch_static(url: str) -> str | None:
    """Return raw HTML via httpx, or None on failure."""
    try:
        async with httpx.AsyncClient(
            headers=_REQUEST_HEADERS,
            follow_redirects=True,
            timeout=_TIMEOUT,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.text
    except Exception as exc:
        logger.warning(f"[Scraper] Static fetch failed: {exc}")
        return None


def _is_js_walled(html: str) -> bool:
    """Heuristic: return True if the page appears to block non-JS clients."""
    lower = html.lower()
    return any(signal in lower for signal in _JS_WALL_SIGNALS) or len(html.strip()) < 500


# ── Playwright fetch ──────────────────────────────────────────────────────────

async def _fetch_playwright(url: str) -> str:
    """
    Render *url* with a headless Chromium browser via Playwright.

    Returns the fully rendered HTML.  Raises RuntimeError on failure.
    """
    try:
        from playwright.async_api import async_playwright  # local import to keep startup fast
    except ImportError as exc:
        raise RuntimeError(
            "Playwright is not installed. Run: pip install playwright && playwright install chromium"
        ) from exc

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page(extra_http_headers=_REQUEST_HEADERS)
        try:
            await page.goto(url, wait_until="networkidle", timeout=_TIMEOUT * 1000)
            # Give dynamic content a moment to settle
            await asyncio.sleep(2)
            html = await page.content()
        except Exception as exc:
            raise RuntimeError(f"Playwright navigation failed: {exc}") from exc
        finally:
            await browser.close()

    return html


# ── HTML parsing ──────────────────────────────────────────────────────────────

def _parse_html(html: str, url: str) -> ScrapedJob:
    """Extract structured job info from raw HTML."""
    soup = BeautifulSoup(html, "html.parser")

    company_name = _extract_company(soup, url)
    job_title = _extract_job_title(soup)
    email = _extract_email(soup, html)

    return ScrapedJob(
        company_name=company_name,
        job_title=job_title,
        email=email,
        job_url=url,
    )


def _extract_company(soup: BeautifulSoup, url: str) -> str:
    """
    Try several heuristics to derive the company name:
      1. JSON-LD structured data
      2. Common meta tags
      3. OpenGraph site_name
      4. Fallback: hostname
    """
    # JSON-LD — many job boards embed schema.org/JobPosting
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            import json
            data = json.loads(script.string or "")
            # Handle list of schemas
            schemas = data if isinstance(data, list) else [data]
            for schema in schemas:
                if schema.get("@type") == "JobPosting":
                    org = schema.get("hiringOrganization", {})
                    name = org.get("name", "") if isinstance(org, dict) else ""
                    if name:
                        return name.strip()
        except Exception:
            pass

    # Meta tag: og:site_name
    og = soup.find("meta", property="og:site_name")
    if og and og.get("content"):
        return og["content"].strip()

    # Meta tag: application-name
    app_name = soup.find("meta", attrs={"name": "application-name"})
    if app_name and app_name.get("content"):
        return app_name["content"].strip()

    # Fallback: extract readable hostname (e.g. "acme" from "jobs.acme.com")
    hostname = urlparse(url).hostname or url
    parts = hostname.split(".")
    # Drop common prefixes/suffixes
    skip = {"www", "jobs", "careers", "apply", "com", "org", "io", "co", "net"}
    meaningful = [p for p in parts if p.lower() not in skip]
    return meaningful[0].capitalize() if meaningful else hostname


def _extract_job_title(soup: BeautifulSoup) -> str:
    """
    Extract the job title using:
      1. JSON-LD schema.org/JobPosting
      2. Common HTML patterns (h1, title tag, og:title)
    """
    # JSON-LD
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            import json
            data = json.loads(script.string or "")
            schemas = data if isinstance(data, list) else [data]
            for schema in schemas:
                if schema.get("@type") == "JobPosting":
                    title = schema.get("title", "")
                    if title:
                        return title.strip()
        except Exception:
            pass

    # <h1> — most job pages put the title in the first h1
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return truncate(h1.get_text(strip=True), 120)

    # og:title
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        return truncate(og_title["content"].strip(), 120)

    # <title> tag (often contains "Job Title | Company")
    title_tag = soup.find("title")
    if title_tag:
        raw = title_tag.get_text(strip=True)
        # Keep the part before the first separator
        for sep in ["|", "–", "-", "—", "·", ":"]:
            if sep in raw:
                return raw.split(sep)[0].strip()
        return truncate(raw, 120)

    return "Unknown Position"


_EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
)

# Domains to skip (image CDNs, no-reply patterns, sentry, etc.)
_SKIP_EMAIL_PATTERNS = re.compile(
    r"(noreply|no-reply|donotreply|example|sentry|wixpress|"
    r"amazonaws|cloudfront|@\d)",
    re.IGNORECASE,
)


def _extract_email(soup: BeautifulSoup, raw_html: str) -> str:
    """
    Best-effort recruiter email extraction:
      1. mailto: links
      2. Regex scan of visible text and raw HTML
    Returns the first plausible address, or empty string.
    """
    candidates: list[str] = []

    # mailto: links are the most reliable signal
    for a in soup.find_all("a", href=True):
        href: str = a["href"]
        if href.startswith("mailto:"):
            addr = href[7:].split("?")[0].strip()
            if addr:
                candidates.append(addr)

    # Regex scan of all text content
    text = soup.get_text(separator=" ")
    candidates.extend(_EMAIL_REGEX.findall(text))

    # Fallback: scan raw HTML (catches obfuscated-but-parseable addresses)
    if not candidates:
        candidates.extend(_EMAIL_REGEX.findall(raw_html))

    for addr in candidates:
        addr = addr.strip().lower()
        if is_valid_email(addr) and not _SKIP_EMAIL_PATTERNS.search(addr):
            return addr

    return ""
