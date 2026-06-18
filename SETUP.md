# OWASP Security Education — Setup Guide

## Prerequisites

- **Node.js 16+** and npm
- No database installation required — SQLite is bundled via `sql.js`
- No API keys required — the AI demo is a self-contained mock

## Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Initialize the database

```bash
npm run init-db    # creates the SQLite file at data/owasp_education.db
npm run seed-db    # populates all 11 vulnerability examples
```

### 3. Configure environment (optional)

Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

The only variables you might change:

```env
PORT=3000          # change if 3000 is in use
NODE_ENV=development
```

No LLM API keys are needed. The AI security demo (LLM01) runs entirely as a server-side mock.

### 4. Start the server

```bash
npm run dev    # development — auto-reloads on file changes
npm start      # production
```

The server starts at **http://localhost:3000**.

## Verify Installation

```bash
# Health check
curl http://localhost:3000/api/health

# List all examples (should return 11)
curl http://localhost:3000/api/examples/stats
```

Open http://localhost:3000 — you should see 10 OWASP cards and 1 AI Security card.

## Testing the AI Demo (LLM01)

1. Click **"Indirect Prompt Injection via Malicious Markdown"** on the home page.
2. **Vulnerable tab** — paste any JavaScript code and click "Run Vulnerable Review". The AI review will include a phishing `curl` command appended at the bottom (highlighted in red).
3. **Secure tab** — same input. The server strips HTML comments from `SKILL.md` before the AI sees it; the review is clean.

### cURL equivalents

```bash
# View the malicious SKILL.md
curl http://localhost:3000/api/vulnerable/ai01/skill

# Vulnerable review — notice the injected command at the end
curl -X POST http://localhost:3000/api/vulnerable/ai01/review \
  -H "Content-Type: application/json" \
  -d '{"code": "for (let i = 0; i < 10; i++) console.log(i)"}'

# Secure review — clean output, commentsStripped: true
curl -X POST http://localhost:3000/api/secure/ai01/review \
  -H "Content-Type: application/json" \
  -d '{"code": "for (let i = 0; i < 10; i++) console.log(i)"}'
```

## Testing OWASP Examples

Each OWASP example exposes endpoints at `/api/vulnerable/aNN/*` and `/api/secure/aNN/*`. Examples:

```bash
# A01 — IDOR (Broken Access Control)
curl http://localhost:3000/api/vulnerable/a01/profile/2

# A03 — SQL Injection
curl "http://localhost:3000/api/vulnerable/a03/search?username=admin'--"
curl "http://localhost:3000/api/secure/a03/search?username=admin"

# A02 — Crypto Failures (plaintext vs bcrypt)
curl -X POST http://localhost:3000/api/vulnerable/a02/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret","email":"alice@example.com"}'
```

Full endpoint reference: [API.md](./API.md). Postman collection: `postman/owasp-collection.json`.

## Troubleshooting

### Port already in use

```bash
lsof -ti:3000 | xargs kill    # macOS / Linux
# or change PORT in .env
```

### Database needs a clean reset

```bash
rm -f data/owasp_education.db
npm run init-db
npm run seed-db
```

### Examples show "Failed to load example"

The database is empty — run `npm run seed-db`.

## Development Notes

- `npm run dev` uses nodemon; the server restarts automatically on file changes.
- Route pairs live in `backend/routes/vulnerable/` and `backend/routes/secure/`. Each file is self-contained.
- The AI demo routes (`ai01-malicious-markdown.js`) have no external dependencies — no network calls, no API keys.
