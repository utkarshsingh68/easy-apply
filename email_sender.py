"""
email_sender.py
---------------
Sends outreach emails via Gmail SMTP (TLS on port 587).

Features
────────
- Attaches a resume PDF automatically when the file exists.
- Rate-limits sending using the TokenBucketRateLimiter from utils.py
  (default: max 2 emails per minute, configurable via EMAIL_RATE_LIMIT_PER_MINUTE).
- Returns a SendResult indicating success or failure.
- All blocking SMTP I/O runs in a thread pool so it doesn't block the
  FastAPI event loop.
"""

from __future__ import annotations

import asyncio
import smtplib
from dataclasses import dataclass
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from config import settings
from utils import TokenBucketRateLimiter, logger, resolve_resume_path


# ── Module-level rate limiter (shared across all calls) ───────────────────────

_rate_limiter = TokenBucketRateLimiter(
    rate=settings.email_rate_limit_per_minute,
    period=60.0,
)


# ── Return type ───────────────────────────────────────────────────────────────

@dataclass
class SendResult:
    success: bool
    message: str   # Human-readable explanation


# ── Internal SMTP logic (blocking, runs in thread pool) ───────────────────────

def _smtp_send(
    to_address: str,
    subject: str,
    body: str,
    resume_path: Path | None,
) -> SendResult:
    """
    Blocking function that opens an SMTP connection and sends one email.
    Called via asyncio.to_thread() to avoid blocking the event loop.
    """
    msg = MIMEMultipart()
    msg["From"] = settings.gmail_address
    msg["To"] = to_address
    msg["Subject"] = subject

    # Plain-text body (add HTML alternative here if desired)
    msg.attach(MIMEText(body, "plain", "utf-8"))

    # Attach resume if available
    if resume_path:
        try:
            with open(resume_path, "rb") as fp:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(fp.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f'attachment; filename="{resume_path.name}"',
            )
            msg.attach(part)
            logger.debug(f"[SMTP] Resume attached: {resume_path.name}")
        except OSError as exc:
            logger.warning(f"[SMTP] Could not attach resume: {exc}")

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.gmail_address, settings.gmail_app_password)
            server.sendmail(
                settings.gmail_address,
                to_address,
                msg.as_string(),
            )
        return SendResult(success=True, message=f"Email delivered to {to_address}")
    except smtplib.SMTPAuthenticationError:
        return SendResult(
            success=False,
            message=(
                "SMTP authentication failed. "
                "Verify GMAIL_ADDRESS and GMAIL_APP_PASSWORD in .env. "
                "Ensure 2FA is enabled and you are using an App Password."
            ),
        )
    except smtplib.SMTPRecipientsRefused as exc:
        return SendResult(success=False, message=f"Recipient refused: {exc}")
    except smtplib.SMTPException as exc:
        return SendResult(success=False, message=f"SMTP error: {exc}")
    except OSError as exc:
        return SendResult(success=False, message=f"Network error: {exc}")


# ── Public async API ──────────────────────────────────────────────────────────

async def send_email(
    to_address: str,
    subject: str,
    body: str,
    attach_resume: bool = True,
    resume_path_override: str | None = None,
) -> SendResult:
    """
    Send an outreach email asynchronously.

    Steps:
      1. Wait for a rate-limit token (blocks in a thread so the event loop
         stays free to handle other requests).
      2. Optionally locate and attach the resume.
      3. Open Gmail SMTP over TLS and deliver the message.

    Args:
        to_address:    Recipient email address.
        subject:       Email subject line.
        body:          Plain-text email body.
        attach_resume: Whether to attach the resume from CANDIDATE_RESUME_PATH.

    Returns:
        SendResult(success, message)
    """
    if not to_address or "@" not in to_address:
        return SendResult(
            success=False,
            message=f"Invalid recipient address: {to_address!r}",
        )

    logger.info(f"[SMTP] Acquiring rate-limit token for {to_address!r} …")
    # Run the blocking rate-limit acquire in a thread pool
    await asyncio.to_thread(_rate_limiter.acquire)

    resume_path: Path | None = None
    if attach_resume:
        if resume_path_override:
            resume_path = resolve_resume_path(resume_path_override)
        else:
            resume_path = resolve_resume_path(settings.candidate_resume_path)

    logger.info(f"[SMTP] Sending to {to_address!r} | subject={subject!r}")
    result: SendResult = await asyncio.to_thread(
        _smtp_send, to_address, subject, body, resume_path
    )

    if result.success:
        logger.info(f"[SMTP] ✓ {result.message}")
    else:
        logger.error(f"[SMTP] ✗ {result.message}")

    return result
