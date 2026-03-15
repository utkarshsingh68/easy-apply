"""
config.py
---------
Centralised configuration loaded from environment variables via pydantic-settings.
All modules import from here — no direct os.getenv() calls elsewhere.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AliasChoices, Field, field_validator


class Settings(BaseSettings):
    """Application settings validated at startup."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Supabase ──────────────────────────────────────────────────────────────
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_key: str = Field(..., description="Supabase anon or service-role key")

    # ── LLM ───────────────────────────────────────────────────────────────────
    llm_provider: str = Field("groq", description="LLM backend: 'openai' or 'groq'")
    openai_api_key: str = Field("", description="OpenAI API key")
    groq_api_key: str = Field("", description="Groq API key")

    # ── Gmail SMTP ────────────────────────────────────────────────────────────
    gmail_address: str = Field("", description="Sender Gmail address")
    gmail_app_password: str = Field("", description="Gmail App Password (16 chars)")

    # ── Candidate ─────────────────────────────────────────────────────────────
    candidate_name: str = Field("Candidate", description="Your full name")
    candidate_skills: str = Field("", description="Comma-separated skills")
    candidate_resume_path: str = Field(
        "./resume/resume.pdf", description="Local path to resume PDF"
    )

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    email_rate_limit_per_minute: int = Field(
        2, ge=1, le=10, description="Max emails sent per minute"
    )

    # ── Live-deploy safety gate ───────────────────────────────────────────────
    public_send_enabled: bool = Field(
        False,
        description="If true, anyone can trigger send endpoints without owner token.",
    )
    send_admin_token: str = Field(
        "",
        validation_alias=AliasChoices("SEND_ADMIN_TOKEN", "OWNER_TOKEN"),
        description=(
            "Owner token required in X-Admin-Token when public_send_enabled is false. "
            "Also supports legacy OWNER_TOKEN env var."
        ),
    )

    @field_validator("llm_provider")
    @classmethod
    def validate_llm_provider(cls, v: str) -> str:
        allowed = {"openai", "groq"}
        if v.lower() not in allowed:
            raise ValueError(f"llm_provider must be one of {allowed}")
        return v.lower()

    @field_validator("supabase_url")
    @classmethod
    def validate_supabase_url(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("SUPABASE_URL must start with 'https://'")
        return v


# Singleton — all modules import this object
settings = Settings()
