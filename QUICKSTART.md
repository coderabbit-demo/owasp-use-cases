# Quick Start

Get the app running in under 2 minutes.

## Prerequisites

```bash
node --version   # need 16+
npm --version
```

No database installation and no API keys required.

## Setup

```bash
npm install
npm run init-db
npm run seed-db
npm run dev
```

Open **http://localhost:3000**. You'll see 10 OWASP Top 10 cards and 1 AI Security card.

## Try the AI Demo — "The Phantom Dependency"

1. Click **"Indirect Prompt Injection via Malicious Markdown"**
2. **Vulnerable tab** — click "Run Vulnerable Review" with any code. Observe the phishing `curl` command silently appended at the bottom of an otherwise legitimate code review.
3. **Secure tab** — same code. The injected command is gone because HTML comments are stripped from `SKILL.md` before the AI sees it.

## Try an OWASP Demo — SQL Injection (A03)

```bash
# Attack: dump all users via SQL injection
curl "http://localhost:3000/api/vulnerable/a03/search?username=admin'%20OR%20'1'='1"

# Same input on secure endpoint — parameterized query, safe
curl "http://localhost:3000/api/secure/a03/search?username=admin'%20OR%20'1'='1"
```

## Explore More

| What | Where |
|------|-------|
| All 11 vulnerability demos | http://localhost:3000 |
| AI demo detail page | http://localhost:3000/pages/vulnerability.html?id=ai01 |
| Any OWASP detail page | http://localhost:3000/pages/vulnerability.html?id=a01 |
| Full API reference | [API.md](API.md) |
| Postman collection | `postman/owasp-collection.json` |
| Detailed setup | [SETUP.md](SETUP.md) |

## Troubleshooting

**Port in use:** `lsof -ti:3000 | xargs kill` (macOS/Linux) or set `PORT=3001` in `.env`

**Examples not loading:** Run `npm run seed-db` — the database needs to be seeded.

**Reset database:** `rm -f data/owasp_education.db && npm run init-db && npm run seed-db`

---

⚠️ **Educational use only. Do not deploy to production.**
