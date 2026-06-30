# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Educational web app demonstrating 13 security vulnerabilities side-by-side (vulnerable vs. secure implementations): OWASP Top 10 (2021) plus three AI security issues — Indirect Prompt Injection via Malicious Markdown (LLM01, "The Phantom Dependency"), Data and Model Poisoning (LLM04, "The Trojan Trigger"), and Sensitive Information Disclosure (LLM02, "The Leaky Reviewer").

**The intentionally vulnerable routes are not bugs — they are the product.** Do not "fix" vulnerabilities in `backend/routes/vulnerable/`.

## Commands

```bash
npm install          # install dependencies
npm run init-db      # initialize SQLite database (run once)
npm run seed-db      # seed database with sample data
npm start            # production server on :3000
npm run dev          # development server with nodemon auto-reload
```

No test runner is configured.

## Architecture

**Backend**: Express (`backend/server.js`) serves both the API and static frontend files.

Route pairs exist for every vulnerability — each category has two mirrors:
- `backend/routes/vulnerable/aNN-*.js` — intentionally insecure, mounted at `/api/vulnerable/aNN`
- `backend/routes/secure/aNN-*.js` — the hardened version, mounted at `/api/secure/aNN`

The AI use cases follow the same pattern:
- `backend/routes/vulnerable/ai01-malicious-markdown.js` → `/api/vulnerable/ai01`
- `backend/routes/secure/ai01-malicious-markdown.js` → `/api/secure/ai01`
- `backend/routes/vulnerable/ai02-model-poisoning.js` → `/api/vulnerable/ai02`
- `backend/routes/secure/ai02-model-poisoning.js` → `/api/secure/ai02`
- `backend/routes/vulnerable/ai03-sensitive-disclosure.js` → `/api/vulnerable/ai03`
- `backend/routes/secure/ai03-sensitive-disclosure.js` → `/api/secure/ai03`

These routes are pure mock — no external LLM calls, no API keys required.

**AI01 demo flow ("The Phantom Dependency")**:
- `GET /skill` — returns the raw `SKILL.md` containing a hidden HTML comment with an injected phishing command
- `POST /review` — simulates an AI code review; vulnerable version appends the injected text, secure version strips HTML comments first

**AI02 demo flow ("The Trojan Trigger")**:
- `GET /training-data` — returns the fine-tuning dataset including three poisoned samples
- `POST /review` — vulnerable version fires the backdoor when the `// VERIFIED-SAFE` trigger is present; secure version strips the trigger before analysis
- `POST /validate-training` (secure only) — runs anomaly detection over the dataset, quarantining samples where labels conflict with static analysis

**AI03 demo flow ("The Leaky Reviewer")**:
- `GET /sample-code` — returns mock payment code containing a Stripe key, DB credentials, and a credit card number
- `POST /review` — vulnerable version logs and reflects raw secrets; secure version redacts all secrets before processing
- `GET /logs` — shows the server-side log; vulnerable version contains raw secrets, secure version contains only redacted placeholders

**Database**: SQLite via `sql.js`. Initialized by `backend/db/init.js` using `backend/db/schema.sql`; seeded by `backend/db/seed.js`. The AI demo routes do not use the database.

**Frontend**: Vanilla JS + HTML + Tailwind CSS (CDN). Entry point is `frontend/index.html`; vulnerability detail pages use `frontend/pages/vulnerability.html`. The AI demo UI lives in `frontend/js/aiDemos.js`.

## Environment Setup

Copy `.env.example` to `.env`. No API keys are needed — the AI demo is fully self-contained.

## API Reference

Full endpoint docs are in [API.md](./API.md). A Postman collection is at `postman/owasp-collection.json`.
