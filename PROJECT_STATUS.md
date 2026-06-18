# Project Status

## ✅ Complete — 11/11 Examples Implemented

All 11 security examples are fully functional end-to-end: backend routes, database seed data, frontend demo pages, and interactive UI.

---

## OWASP Top 10 (2021) — All Complete

| ID  | Title | Vulnerable Routes | Secure Routes |
|-----|-------|------------------|---------------|
| A01 | Broken Access Control | `/api/vulnerable/a01/*` | `/api/secure/a01/*` |
| A02 | Cryptographic Failures | `/api/vulnerable/a02/*` | `/api/secure/a02/*` |
| A03 | Injection (SQL) | `/api/vulnerable/a03/*` | `/api/secure/a03/*` |
| A04 | Insecure Design | `/api/vulnerable/a04/*` | `/api/secure/a04/*` |
| A05 | Security Misconfiguration | `/api/vulnerable/a05/*` | `/api/secure/a05/*` |
| A06 | Vulnerable Components | `/api/vulnerable/a06/*` | `/api/secure/a06/*` |
| A07 | Authentication Failures | `/api/vulnerable/a07/*` | `/api/secure/a07/*` |
| A08 | Data Integrity Failures | `/api/vulnerable/a08/*` | `/api/secure/a08/*` |
| A09 | Logging Failures | `/api/vulnerable/a09/*` | `/api/secure/a09/*` |
| A10 | Server-Side Request Forgery | `/api/vulnerable/a10/*` | `/api/secure/a10/*` |

## AI Security (OWASP Top 10 for LLMs) — Complete

| ID    | Title | Vulnerable | Secure |
|-------|-------|------------|--------|
| LLM01 | Indirect Prompt Injection via Malicious Markdown | `/api/vulnerable/ai01/*` | `/api/secure/ai01/*` |

**Demo concept — "The Phantom Dependency":** A hidden HTML comment in a third-party `SKILL.md` file hijacks an AI agent's code review output, appending a social-engineering phishing command. The secure route strips HTML comments before the AI processes the file. Fully self-contained — no external LLM calls or API keys required.

---

## Infrastructure

✅ **Backend** — Express server with CORS, Helmet, error handling  
✅ **Database** — SQLite via sql.js (pure JavaScript, no native compilation)  
✅ **Frontend** — Vanilla JS + Tailwind CSS + Font Awesome (all CDN)  
✅ **AI demo** — Self-contained mock routes; no API keys, no network calls  

---

## Project Structure

```
owasp-use-cases/
├── backend/
│   ├── server.js
│   ├── db/
│   │   ├── schema.sql
│   │   ├── init.js
│   │   ├── seed.js
│   │   └── connection.js
│   ├── routes/
│   │   ├── examples.js
│   │   ├── vulnerable/
│   │   │   ├── a01-access-control.js  … a10-ssrf.js
│   │   │   └── ai01-malicious-markdown.js
│   │   └── secure/
│   │       ├── a01-access-control.js  … a10-ssrf.js
│   │       └── ai01-malicious-markdown.js
│   └── middleware/
│       └── errorHandler.js
├── frontend/
│   ├── index.html
│   ├── pages/vulnerability.html
│   └── js/
│       ├── app.js
│       └── aiDemos.js
├── postman/
│   └── owasp-collection.json
├── data/
│   └── owasp_education.db     (created by npm run init-db)
├── .env.example
├── CLAUDE.md
└── API.md
```

---

## API Endpoints

- `GET  /api/health` — server health check
- `GET  /api/examples` — list all examples
- `GET  /api/examples/:id` — example detail (used by frontend)
- `GET  /api/examples/stats` — counts by category/severity
- `GET/POST /api/vulnerable/aNN/*` — vulnerable OWASP implementations (×10)
- `GET/POST /api/secure/aNN/*` — secure OWASP implementations (×10)
- `GET/POST /api/vulnerable/ai01/*` — vulnerable AI demo
- `GET/POST /api/secure/ai01/*` — secure AI demo

---

## How to Run

```bash
npm install
npm run init-db
npm run seed-db
npm run dev          # http://localhost:3000
```

No API keys needed. No external services required.
