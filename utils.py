"""
utils.py
--------
Shared utilities used across the project:
  - Structured logger (loguru)
  - Token-bucket rate limiter for email sending
  - Miscellaneous helpers (email validation, safe filename, etc.)
"""

from __future__ import annotations

import re
import sys
import time
import threading
from pathlib import Path

from loguru import logger as _logger


# ── Logger setup ──────────────────────────────────────────────────────────────

# Remove the default loguru handler and replace with a cleaner format.
_logger.remove()
_logger.add(
    sys.stderr,
    level="INFO",
    format=(
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    ),
    colorize=True,
)
_logger.add(
    "logs/app.log",
    level="DEBUG",
    rotation="10 MB",
    retention="14 days",
    compression="zip",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{line} - {message}",
)

# Public logger imported by all other modules
logger = _logger


# ── Token-bucket rate limiter ─────────────────────────────────────────────────

class TokenBucketRateLimiter:
    """
    Thread-safe token-bucket rate limiter.

    Usage:
        limiter = TokenBucketRateLimiter(rate=2, period=60)   # 2 per minute
        limiter.acquire()   # blocks until a token is available
    """

    def __init__(self, rate: int, period: float = 60.0) -> None:
        """
        Args:
            rate:   Number of tokens (calls) allowed per `period`.
            period: Length of the time window in seconds (default 60s).
        """
        self._rate = rate
        self._period = period
        self._tokens = float(rate)
        self._last_refill = time.monotonic()
        self._lock = threading.Lock()

    def _refill(self) -> None:
        """Refill tokens proportionally to elapsed time."""
        now = time.monotonic()
        elapsed = now - self._last_refill
        self._tokens = min(
            self._rate,
            self._tokens + elapsed * (self._rate / self._period),
        )
        self._last_refill = now

    def acquire(self, block: bool = True) -> bool:
        """
        Consume one token.

        If `block=True` (default), sleeps until a token is available.
        If `block=False`, returns False immediately when no token is available.
        """
        while True:
            with self._lock:
                self._refill()
                if self._tokens >= 1.0:
                    self._tokens -= 1.0
                    return True
            if not block:
                return False
            # Wait for roughly the time needed to accumulate one token.
            time.sleep(self._period / self._rate)


# ── Email validation ──────────────────────────────────────────────────────────

_EMAIL_RE = re.compile(
    r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
)


def is_valid_email(address: str) -> bool:
    """Return True if *address* looks like a valid email address."""
    return bool(_EMAIL_RE.match(address.strip()))


# ── File helpers ──────────────────────────────────────────────────────────────

def safe_filename(name: str) -> str:
    """Strip characters that are unsafe in file names."""
    return re.sub(r'[\\/*?:"<>|]', "_", name)


def resolve_resume_path(path: str) -> Path | None:
    """
    Return a resolved Path for the resume file, or None if it doesn't exist.
    Logs a warning when the file is missing so the caller can decide whether
    to abort or send the email without an attachment.
    """
    p = Path(path).resolve()
    if not p.exists():
        logger.warning(f"Resume not found at {p} — email will be sent without attachment.")
        return None
    if not p.is_file():
        logger.warning(f"Resume path {p} is not a file — email will be sent without attachment.")
        return None
    return p


# ── Text helpers ──────────────────────────────────────────────────────────────

def truncate(text: str, max_chars: int = 500) -> str:
    """Truncate *text* to *max_chars* characters, appending '…' if needed."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "…"
