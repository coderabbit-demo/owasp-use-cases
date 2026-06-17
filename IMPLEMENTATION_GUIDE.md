# Implementation Guide

This guide explains the architecture and patterns used across the codebase so you can extend or adapt examples.

## Route Pair Pattern

Every vulnerability has two mirrored route files:

```
backend/routes/vulnerable/aNN-name.js   →  /api/vulnerable/aNN/*
backend/routes/secure/aNN-name.js       →  /api/secure/aNN/*
```

Both files use the same endpoint paths; only the implementation differs. To add a new example, create both files and register them in `backend/server.js`.

---

## OWASP Example Patterns

### Broken Access Control (A01) — IDOR

```javascript
// VULNERABLE: no ownership check
router.get('/profile/:id', async (req, res) => {
  const result = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(result.rows[0]);
});

// SECURE: verify caller owns the resource
router.get('/profile/:id', async (req, res) => {
  const requesterId = req.headers['x-user-id'];
  if (String(requesterId) !== String(req.params.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const result = await db.query(
    'SELECT id, username, email FROM users WHERE id = ?', [req.params.id]
  );
  res.json(result.rows[0]);
});
```

### Cryptographic Failures (A02)

```javascript
// VULNERABLE: plaintext storage
await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);

// SECURE: bcrypt hashing
const hash = await bcrypt.hash(password, 10);
await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
```

### SQL Injection (A03)

```javascript
// VULNERABLE: string concatenation
const query = `SELECT * FROM users WHERE username = '${username}'`;
await db.query(query);

// SECURE: parameterized query
await db.query('SELECT id, username, email FROM users WHERE username = ?', [username]);
```

### Authentication Failures (A07)

```javascript
// VULNERABLE: no rate limiting
router.post('/login', async (req, res) => {
  const result = await db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password]   // plaintext comparison!
  );
  ...
});

// SECURE: rate limiting + bcrypt
const loginAttempts = new Map();
router.post('/login', async (req, res) => {
  const key = `${req.ip}-${username}`;
  const attempts = loginAttempts.get(key) || { count: 0, lockedUntil: null };
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return res.status(429).json({ error: 'Too many attempts' });
  }
  const user = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  const valid = user && await bcrypt.compare(password, user.password);
  if (!valid) {
    attempts.count++;
    if (attempts.count >= 5) attempts.lockedUntil = Date.now() + 15 * 60 * 1000;
    loginAttempts.set(key, attempts);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  loginAttempts.delete(key);
  res.json({ success: true });
});
```

### SSRF (A10)

```javascript
// VULNERABLE: fetch any URL
const response = await axios.get(req.query.url);

// SECURE: validate against allowlist, block private IPs
const ALLOWED = ['example.com', 'api.example.com'];
const parsed = new URL(req.query.url);
if (parsed.hostname === 'localhost' || parsed.hostname.startsWith('192.168.')) {
  return res.status(403).json({ error: 'Internal resources blocked' });
}
if (!ALLOWED.includes(parsed.hostname)) {
  return res.status(403).json({ error: 'Domain not in allowlist' });
}
const response = await axios.get(req.query.url, { timeout: 5000 });
```

---

## AI Security Pattern — Malicious Markdown (LLM01)

The AI01 demo has no external dependencies. Both routes are pure mocks.

```javascript
// VULNERABLE: AI reads raw SKILL.md — hidden comment is obeyed
router.post('/review', (req, res) => {
  const { code } = req.body;
  const skillContent = SKILL_MD;  // contains hidden HTML comment with injected command
  const review = generateCodeReview(code);
  res.json({ review: review + INJECTED_TEXT });  // phishing command appended
});

// SECURE: strip HTML comments before AI context is built
router.post('/review', (req, res) => {
  const { code } = req.body;
  const sanitized = SKILL_MD_RAW.replace(/<!--[\s\S]*?-->/g, '').trim();
  const review = generateCodeReview(code);
  res.json({ review, sanitizedSkillContent: sanitized });  // clean output
});
```

---

## Adding a New Example

1. Create `backend/routes/vulnerable/aNN-name.js` and `backend/routes/secure/aNN-name.js`
2. Register both in `backend/server.js`:
   ```javascript
   app.use('/api/vulnerable/aNN', require('./routes/vulnerable/aNN-name'));
   app.use('/api/secure/aNN',     require('./routes/secure/aNN-name'));
   ```
3. Add seed data in `backend/db/seed.js` (examples, test_cases, remediation_steps tables)
4. Run `npm run init-db && npm run seed-db` to refresh the database

The frontend automatically renders detail pages using the `examples` API — no frontend code change needed for OWASP examples.

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `examples` | Vulnerability metadata, code snippets, descriptions |
| `test_cases` | Per-example test cases with endpoints and payloads |
| `remediation_steps` | Numbered fix steps per example |
| `users` | Demo users for auth/access-control examples |
| `products` | Demo resources for IDOR examples |
| `sessions` | Demo sessions for auth examples |
| `ai_conversations` | Available for logging AI interactions (unused by current routes) |

---

## Testing Endpoints

```bash
# OWASP examples
curl "http://localhost:3000/api/vulnerable/a03/search?username=admin'--"
curl "http://localhost:3000/api/secure/a03/search?username=admin"

# AI01 malicious markdown
curl http://localhost:3000/api/vulnerable/ai01/skill
curl -X POST http://localhost:3000/api/vulnerable/ai01/review \
  -H "Content-Type: application/json" \
  -d '{"code": "for(let i=0;i<10;i++) console.log(i)"}'

# Examples API
curl http://localhost:3000/api/examples/a01
curl http://localhost:3000/api/examples/stats
```
