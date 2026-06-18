# OWASP Security Education Web Application

An interactive educational platform demonstrating 11 security vulnerabilities side-by-side: the OWASP Top 10 (2021) plus one AI security scenario.

## Features

- **10 OWASP Top 10 (2021) vulnerabilities** — each with vulnerable and secure implementations
- **1 AI Security scenario** — Indirect Prompt Injection via Malicious Markdown ("The Phantom Dependency")
- Interactive side-by-side demos (vulnerable vs. secure)
- Real-world attack scenarios and remediation steps
- Postman API collection for endpoint testing
- No external API keys required — all AI demos are self-contained mocks

## Technology Stack

- **Frontend**: HTML, Tailwind CSS (CDN), Vanilla JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite (via sql.js — no installation required)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Initialize and seed the database
npm run init-db
npm run seed-db

# 3. Start the server
npm run dev        # development (auto-reload)
npm start          # production
```

Open **http://localhost:3000** in your browser.

## Vulnerability Examples

### OWASP Top 10 (2021)

| ID  | Vulnerability |
|-----|---------------|
| A01 | Broken Access Control |
| A02 | Cryptographic Failures |
| A03 | Injection (SQL) |
| A04 | Insecure Design |
| A05 | Security Misconfiguration |
| A06 | Vulnerable Components |
| A07 | Authentication Failures |
| A08 | Data Integrity Failures |
| A09 | Logging Failures |
| A10 | Server-Side Request Forgery (SSRF) |

### AI Security (OWASP Top 10 for LLMs)

| ID    | Vulnerability |
|-------|---------------|
| LLM01 | Indirect Prompt Injection via Malicious Markdown — "The Phantom Dependency" |

**Demo flow:** A hidden HTML comment inside a third-party `SKILL.md` file hijacks an AI agent's code review, silently appending a phishing install command. The secure implementation strips HTML comments before the AI processes the file.

## API Documentation

See [API.md](./API.md) for endpoint reference. Import `postman/owasp-collection.json` to test interactively.

## Project Structure

```
owasp-use-cases/
├── backend/
│   ├── server.js
│   ├── db/                    # SQLite schema, init, seed
│   ├── routes/
│   │   ├── vulnerable/        # aNN-*.js  and  ai01-*.js
│   │   └── secure/            # aNN-*.js  and  ai01-*.js
│   └── middleware/
├── frontend/
│   ├── index.html
│   ├── pages/vulnerability.html
│   └── js/
├── postman/
└── CLAUDE.md
```

## Security Notice

⚠️ **This application intentionally contains security vulnerabilities for educational purposes. Do NOT deploy to production or expose to the internet.**
