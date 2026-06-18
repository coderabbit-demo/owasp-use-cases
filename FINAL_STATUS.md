# Final Status

## ✅ All 11 Examples Complete and Functional

| # | ID | Title | Status |
|---|----|-------|--------|
| 1 | A01 | Broken Access Control | ✅ Complete |
| 2 | A02 | Cryptographic Failures | ✅ Complete |
| 3 | A03 | Injection (SQL) | ✅ Complete |
| 4 | A04 | Insecure Design | ✅ Complete |
| 5 | A05 | Security Misconfiguration | ✅ Complete |
| 6 | A06 | Vulnerable Components | ✅ Complete |
| 7 | A07 | Authentication Failures | ✅ Complete |
| 8 | A08 | Data Integrity Failures | ✅ Complete |
| 9 | A09 | Logging Failures | ✅ Complete |
| 10 | A10 | Server-Side Request Forgery | ✅ Complete |
| 11 | LLM01 | Indirect Prompt Injection via Malicious Markdown | ✅ Complete |

---

## What "Complete" Means

For each example:
- ✅ Vulnerable route (`/api/vulnerable/aNN/*`) — demonstrates the attack
- ✅ Secure route (`/api/secure/aNN/*`) — demonstrates the defense
- ✅ Database seed data — metadata, test cases, remediation steps
- ✅ Frontend demo page — interactive vulnerable/secure/info tabs

---

## AI Security Demo — "The Phantom Dependency"

The LLM01 demo replaced the previous two-scenario AI section (prompt injection + improper output handling). It demonstrates **indirect prompt injection via a malicious markdown file**:

1. A third-party `SKILL.md` contains a hidden HTML comment with a phishing install command.
2. The **vulnerable** AI agent reads the raw file, interprets the comment as a system directive, and appends the phishing command to an otherwise legitimate code review.
3. The **secure** implementation strips HTML comments before passing the file to the AI — the injected directive is never seen.

This demo requires **no external LLM API or API keys**. It is entirely self-contained.

---

## Running the Application

```bash
npm install
npm run init-db
npm run seed-db
npm run dev
```

Open **http://localhost:3000**.

- No API keys needed
- No external services
- SQLite database bundled (sql.js — no native compilation)

---

## Quick API Test

```bash
# Health
curl http://localhost:3000/api/health

# Confirm 11 examples
curl http://localhost:3000/api/examples/stats

# AI01 — see the injected phishing command
curl -X POST http://localhost:3000/api/vulnerable/ai01/review \
  -H "Content-Type: application/json" \
  -d '{"code": "for (let i = 0; i < 10; i++) console.log(i)"}'

# AI01 secure — clean output
curl -X POST http://localhost:3000/api/secure/ai01/review \
  -H "Content-Type: application/json" \
  -d '{"code": "for (let i = 0; i < 10; i++) console.log(i)"}'
```
