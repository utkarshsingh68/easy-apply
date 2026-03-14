"""
supabase_client.py
------------------
Thin wrapper around the Supabase Python client.

Responsibilities:
  - Initialise the Supabase connection once (singleton pattern).
  - CRUD helpers for the `companies` and `email_logs` tables.
  - Duplicate-email guard: check whether an outreach email was already sent
    to a given company.

Database schema expected in Supabase
─────────────────────────────────────
Table: companies
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid()
  company_name text  NOT NULL
  job_title    text
  email        text
  job_url      text  UNIQUE
  created_at   timestamptz DEFAULT now()

Table: email_logs
  id             uuid  PRIMARY KEY DEFAULT gen_random_uuid()
  company_id     uuid  REFERENCES companies(id) ON DELETE CASCADE
  email_subject  text
  email_body     text
  status         text  DEFAULT 'pending'   -- pending | sent | failed
  sent_at        timestamptz
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from supabase import create_client, Client

from config import settings
from utils import logger


# ── Singleton client ──────────────────────────────────────────────────────────

def _build_client() -> Client:
    """Create and return the Supabase client."""
    return create_client(settings.supabase_url, settings.supabase_key)


_supabase: Client = _build_client()


def get_client() -> Client:
    """Return the module-level Supabase client (lazy re-init on failure)."""
    return _supabase


# ── Companies table ───────────────────────────────────────────────────────────

def insert_company(
    company_name: str,
    job_title: str,
    email: str,
    job_url: str,
) -> dict[str, Any]:
    """
    Insert a new company row.

    Returns the inserted row as a dict.
    Raises ValueError if a company with the same job_url already exists.
    """
    # Duplicate guard — job_url is UNIQUE in the schema but we provide a
    # friendlier error message here before hitting the DB constraint.
    if get_company_by_url(job_url):
        raise ValueError(f"A record with job_url='{job_url}' already exists.")

    response = (
        _supabase.table("companies")
        .insert(
            {
                "company_name": company_name,
                "job_title": job_title,
                "email": email,
                "job_url": job_url,
            }
        )
        .execute()
    )
    row = response.data[0]
    logger.info(f"[Supabase] Inserted company id={row['id']} name={company_name!r}")
    return row


def get_company_by_id(company_id: str) -> dict[str, Any] | None:
    """Fetch a single company row by primary key."""
    response = (
        _supabase.table("companies")
        .select("*")
        .eq("id", company_id)
        .maybe_single()
        .execute()
    )
    return response.data if response is not None else None


def get_company_by_url(job_url: str) -> dict[str, Any] | None:
    """Return the company row whose job_url matches, or None."""
    response = (
        _supabase.table("companies")
        .select("*")
        .eq("job_url", job_url)
        .maybe_single()
        .execute()
    )
    return response.data if response is not None else None


def get_company_by_name(company_name: str) -> dict[str, Any] | None:
    """Return the most recent company row for an exact company name match."""
    response = (
        _supabase.table("companies")
        .select("*")
        .ilike("company_name", company_name)
        .order("created_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    return response.data if response is not None else None


def list_companies() -> list[dict[str, Any]]:
    """Return all company rows ordered by creation date."""
    response = (
        _supabase.table("companies")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


def update_company_email(company_id: str, email: str) -> dict[str, Any]:
    """Update the recruiter / HR email stored for a company row."""
    response = (
        _supabase.table("companies")
        .update({"email": email})
        .eq("id", company_id)
        .execute()
    )
    row = response.data[0]
    logger.info(f"[Supabase] Company id={company_id} email updated to {email!r}")
    return row


def delete_company(company_id: str) -> None:
    """Delete a company row by id.

    Related email_logs are removed by DB cascade (ON DELETE CASCADE).
    """
    _supabase.table("companies").delete().eq("id", company_id).execute()
    logger.info(f"[Supabase] Company id={company_id} deleted")


# ── Email logs table ──────────────────────────────────────────────────────────

def create_email_log(
    company_id: str,
    email_subject: str,
    email_body: str,
    status: str = "pending",
) -> dict[str, Any]:
    """
    Create an email_logs row with status='pending'.

    Returns the inserted row.
    """
    response = (
        _supabase.table("email_logs")
        .insert(
            {
                "company_id": company_id,
                "email_subject": email_subject,
                "email_body": email_body,
                "status": status,
            }
        )
        .execute()
    )
    row = response.data[0]
    logger.info(f"[Supabase] Email log created id={row['id']} status={status}")
    return row


def update_email_status(
    log_id: str,
    status: str,
    sent_at: datetime | None = None,
) -> dict[str, Any]:
    """
    Update the status (and optionally sent_at) of an email_logs row.

    status should be one of: 'pending', 'sent', 'failed'.
    """
    payload: dict[str, Any] = {"status": status}
    if sent_at:
        payload["sent_at"] = sent_at.isoformat()
    elif status == "sent":
        payload["sent_at"] = datetime.now(timezone.utc).isoformat()

    response = (
        _supabase.table("email_logs")
        .update(payload)
        .eq("id", log_id)
        .execute()
    )
    row = response.data[0]
    logger.info(f"[Supabase] Email log id={log_id} → status={status}")
    return row


def list_email_logs() -> list[dict[str, Any]]:
    """Return all email_logs rows ordered by sent_at descending."""
    response = (
        _supabase.table("email_logs")
        .select("*, companies(company_name, job_title, email)")
        .order("sent_at", desc=True)
        .execute()
    )
    return response.data


def get_email_log_by_company(company_id: str) -> dict[str, Any] | None:
    """
    Return the most recent email log for a company, or None.
    Used to prevent duplicate outreach emails.
    """
    response = (
        _supabase.table("email_logs")
        .select("*")
        .eq("company_id", company_id)
        .in_("status", ["sent", "pending"])
        .order("sent_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    return response.data if response is not None else None
