"""
ai_email_generator.py
---------------------
Generates personalised outreach emails using an LLM.

Supports two providers (controlled by LLM_PROVIDER in .env):
  - "groq"   → Groq API  (llama-3.3-70b-versatile or similar)
  - "openai" → OpenAI API (gpt-4o-mini by default)

The module exposes a single async function:
    generate_email(company_name, job_title, recipient_email) -> EmailDraft
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from config import settings
from utils import logger


# ── Return type ───────────────────────────────────────────────────────────────

@dataclass
class EmailDraft:
    subject: str
    body: str


# ── Prompt template ───────────────────────────────────────────────────────────

_SYSTEM_PROMPT = (
    "You are an expert career coach who writes concise, professional, and "
    "highly personalised job outreach emails. "
    "The email must feel human and genuine — never robotic or generic. "
    "Do NOT include placeholder text like [Your Name] in the output. "
    "Return ONLY the email text, starting with 'Subject: <subject line>' on "
    "the first line, followed by a blank line and then the email body."
)

_USER_PROMPT_TEMPLATE = """
Write a professional outreach email for a job application with these details:

Candidate name   : {candidate_name}
Candidate skills : {candidate_skills}
Company name     : {company_name}
Job title        : {job_title}
Recipient email  : {recipient_email}

Requirements:
- Subject line should be attention-grabbing and relevant to the role.
- Opening paragraph: mention the specific role and why this company excites the candidate.
- Middle paragraph: highlight 2-3 most relevant skills with a brief proof point.
- Closing paragraph: polite call-to-action (request a call or meeting).
- Keep total length under 200 words.
- Sign off with the candidate's name.
"""

_TEMPLATE_HINTS = {
    "default": "Balanced and professional tone.",
    "value-first": "Lead with impact and measurable outcomes in first paragraph.",
    "story": "Use a short narrative arc: motivation, relevant experience, clear ask.",
}


def _build_prompt(
    company_name: str,
    job_title: str,
    recipient_email: str,
    template_name: str = "default",
    jd_signals: dict[str, Any] | None = None,
) -> str:
    signals = jd_signals or {}
    signal_lines = [
        f"Matched skills    : {', '.join(signals.get('matched_skills', [])) or 'n/a'}",
        f"Responsibilities  : {', '.join(signals.get('responsibilities', [])) or 'n/a'}",
        f"Seniority level   : {signals.get('seniority') or 'n/a'}",
        f"Location hint     : {signals.get('location') or 'n/a'}",
    ]
    template_hint = _TEMPLATE_HINTS.get(template_name, _TEMPLATE_HINTS["default"])
    base = _USER_PROMPT_TEMPLATE.format(
        candidate_name=settings.candidate_name,
        candidate_skills=settings.candidate_skills,
        company_name=company_name,
        job_title=job_title,
        recipient_email=recipient_email,
    )
    return (
        base
        + "\nAdditional context:\n"
        + f"Template style    : {template_name}\n"
        + f"Template guidance : {template_hint}\n"
        + "\n".join(signal_lines)
    )


# ── LLM call helpers ──────────────────────────────────────────────────────────

async def _call_groq(prompt: str) -> str:
    """Send the prompt to Groq and return the raw text response."""
    from groq import AsyncGroq  # imported here to keep startup fast

    client = AsyncGroq(api_key=settings.groq_api_key)
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=512,
    )
    return response.choices[0].message.content.strip()


async def _call_openai(prompt: str) -> str:
    """Send the prompt to OpenAI and return the raw text response."""
    from openai import AsyncOpenAI  # imported here to keep startup fast

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=512,
    )
    return response.choices[0].message.content.strip()


# ── Response parser ───────────────────────────────────────────────────────────

def _parse_llm_response(raw: str, company_name: str, job_title: str) -> EmailDraft:
    """
    Split the LLM response into subject and body.

    Expected format:
        Subject: <subject line>
        <blank line>
        <email body…>
    """
    lines = raw.splitlines()
    subject = f"Application for {job_title} at {company_name}"  # fallback
    body_start = 0

    for i, line in enumerate(lines):
        if line.lower().startswith("subject:"):
            subject = line.split(":", 1)[1].strip()
            body_start = i + 1
            break

    # Skip any blank lines directly after the subject
    while body_start < len(lines) and not lines[body_start].strip():
        body_start += 1

    body = "\n".join(lines[body_start:]).strip()

    if not body:
        # If parsing failed, use the full raw text as the body
        body = raw.strip()

    return EmailDraft(subject=subject, body=body)


# ── Public API ────────────────────────────────────────────────────────────────

async def generate_email(
    company_name: str,
    job_title: str,
    recipient_email: str = "",
    template_name: str = "default",
    jd_signals: dict[str, Any] | None = None,
) -> EmailDraft:
    """
    Generate a personalised outreach email using the configured LLM.

    Args:
        company_name:     Target company name.
        job_title:        Job role being applied for.
        recipient_email:  Recipient address (used as context for tone only).

    Returns:
        EmailDraft with `.subject` and `.body` fields.

    Raises:
        RuntimeError: if the LLM provider is misconfigured or the API call fails.
    """
    prompt = _build_prompt(
        company_name=company_name,
        job_title=job_title,
        recipient_email=recipient_email,
        template_name=template_name,
        jd_signals=jd_signals,
    )
    provider = settings.llm_provider

    logger.info(f"[AI] Generating email via {provider.upper()} for {company_name!r} / {job_title!r}")

    try:
        if provider == "groq":
            if not settings.groq_api_key:
                raise RuntimeError("GROQ_API_KEY is not set in .env")
            raw = await _call_groq(prompt)
        elif provider == "openai":
            if not settings.openai_api_key:
                raise RuntimeError("OPENAI_API_KEY is not set in .env")
            raw = await _call_openai(prompt)
        else:
            raise RuntimeError(f"Unknown LLM_PROVIDER: {provider!r}")
    except Exception as exc:
        logger.error(f"[AI] LLM call failed: {exc}")
        raise RuntimeError(f"Email generation failed: {exc}") from exc

    draft = _parse_llm_response(raw, company_name, job_title)
    logger.info(f"[AI] Email draft ready — subject: {draft.subject!r}")
    return draft
