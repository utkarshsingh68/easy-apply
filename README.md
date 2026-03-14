# AI Job Application Agent

A production-ready Python system that automatically scrapes job postings, generates personalised outreach emails with an LLM, and sends them via Gmail — with full persistence in Supabase.

---

## Project Structure

```
ai_job_agent/
├── main.py                 # FastAPI app & all endpoints
├── scraper.py              # Job page scraper (requests + Playwright fallback)
├── ai_email_generator.py   # LLM email generation (Groq / OpenAI)
├── email_sender.py         # Gmail SMTP sender with rate limiting
├── supabase_client.py      # Supabase CRUD helpers
├── config.py               # Pydantic-settings config loader
├── utils.py                # Logger, rate limiter, helpers
├── requirements.txt
├── .env                    # Your secrets (never commit this)
├── resume/
│   └── resume.pdf          # Put your resume here
└── logs/
    └── app.log             # Auto-created by the application
```

---

## Supabase Setup

Run this SQL in the **Supabase SQL Editor** to create the required tables:

```sql
-- Companies table
CREATE TABLE companies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  job_title    text,
  email        text,
  job_url      text UNIQUE NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- Email logs table
CREATE TABLE email_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid REFERENCES companies(id) ON DELETE CASCADE,
  email_subject  text,
  email_body     text,
  status         text DEFAULT 'pending',   -- pending | sent | failed
  sent_at        timestamptz
);
```

---

## Environment Variables

Copy `.env` and fill in your values:

| Variable                      | Description                                     |
|-------------------------------|-------------------------------------------------|
| `SUPABASE_URL`                | Your Supabase project URL                       |
| `SUPABASE_KEY`                | Supabase anon or service-role key               |
| `LLM_PROVIDER`                | `groq` or `openai`                              |
| `GROQ_API_KEY`                | Groq API key (if using Groq)                    |
| `OPENAI_API_KEY`              | OpenAI API key (if using OpenAI)                |
| `GMAIL_ADDRESS`               | Your Gmail address                              |
| `GMAIL_APP_PASSWORD`          | [Gmail App Password](https://myaccount.google.com/apppasswords) |
| `CANDIDATE_NAME`              | Your full name                                  |
| `CANDIDATE_SKILLS`            | Comma-separated list of skills                  |
| `CANDIDATE_RESUME_PATH`       | Path to your resume PDF (default: `./resume/resume.pdf`) |
| `EMAIL_RATE_LIMIT_PER_MINUTE` | Max emails per minute (default: `2`)            |

> **Gmail note:** Enable **2-Step Verification** on your Google Account, then generate a 16-character **App Password** at https://myaccount.google.com/apppasswords. Use that password — not your main account password.

---

## Installation

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Install Playwright browser (for JS-rendered job pages)
playwright install chromium

# 4. Add your resume PDF
copy your_resume.pdf resume\resume.pdf

# 5. Fill in your .env values
notepad .env
```

---

## Running the Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API docs: http://localhost:8000/docs

---

## API Usage

### 1 — Add a job URL

```bash
curl -X POST http://localhost:8000/add-job \
  -H "Content-Type: application/json" \
  -d '{"job_url": "https://careers.example.com/jobs/software-engineer"}'
```

Response includes the `id` (company_id) you'll need for the next steps.

### 2 — Generate a personalised email

```bash
curl -X POST http://localhost:8000/generate-email/<company_id>
```

### 3 — Send the email

```bash
curl -X POST http://localhost:8000/send-email/<company_id>
```

### 4 — View all sent emails

```bash
curl http://localhost:8000/emails
```

### 5 — View all companies

```bash
curl http://localhost:8000/companies
```

---

## Key Design Decisions

| Feature | Implementation |
|---|---|
| **Duplicate prevention** | `job_url` UNIQUE constraint + pre-insert check; `get_email_log_by_company` guards against re-sending |
| **JS-rendered pages** | Requests → BeautifulSoup first; Playwright fallback on bot-wall detection |
| **Rate limiting** | Token-bucket limiter (thread-safe) — default 2 emails/min |
| **Resume attachment** | MIME multipart with Base64 encoding; graceful skip if file missing |
| **LLM abstraction** | Single `generate_email()` function; swap provider via `LLM_PROVIDER` env var |
| **Config validation** | Pydantic `Settings` validates all env vars at startup |
| **Async SMTP** | Blocking SMTP calls run in `asyncio.to_thread()` to keep FastAPI responsive |
| **Logging** | Loguru — coloured stderr + rotating file in `logs/app.log` |

---

## Security Notes

- Never commit `.env` to version control. Add it to `.gitignore`.
- Use a **service-role key** only server-side; never expose it to clients.
- Use Gmail **App Passwords** — never store your main account password.
- Tighten CORS origins (`allow_origins`) before deploying to production.

---

## Deploy (Render / Railway with Docker)

This repo includes production deployment files:

- `Dockerfile`
- `.dockerignore`
- `.env.example`
- `render.yaml`

### 1. Push code to GitHub

```bash
git add .
git commit -m "Prepare production deployment"
git push
```

### 2. Deploy on Render

1. Open Render dashboard.
2. Create a new **Web Service** from your GitHub repo.
3. Render auto-detects `render.yaml` + `Dockerfile`.
4. Add environment variables from `.env.example`.
5. Deploy.

### 3. Deploy on Railway

1. New Project -> Deploy from GitHub repo.
2. Railway detects the `Dockerfile`.
3. Add environment variables from `.env.example`.
4. Set Healthcheck path to `/` (optional).
5. Deploy.

### Required env vars in production

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `LLM_PROVIDER`
- `GROQ_API_KEY` or `OPENAI_API_KEY`
- `GMAIL_ADDRESS`
- `GMAIL_APP_PASSWORD`
- `CANDIDATE_NAME`
- `CANDIDATE_SKILLS`
- `CANDIDATE_RESUME_PATH`
- `EMAIL_RATE_LIMIT_PER_MINUTE`
- `PUBLIC_SEND_ENABLED`
- `SEND_ADMIN_TOKEN`

### Recommended live setup

- `PUBLIC_SEND_ENABLED=false`
- Set a strong `SEND_ADMIN_TOKEN`
- In dashboard Settings -> Security, save the same owner token in your browser.
