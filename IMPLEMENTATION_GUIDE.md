# OWASP Examples Implementation Guide

## Current Status
- ✅ AI01: Prompt Injection - COMPLETE
- ✅ AI02: Improper Output Handling - COMPLETE
- ✅ A01: Broken Access Control - Backend COMPLETE (needs seed data)
- ❌ A02-A10: Need implementation

## Quick Implementation Checklist

For each OWASP example, you need to create:
1. ✅ Vulnerable route file: `backend/routes/vulnerable/aXX-name.js`
2. ✅ Secure route file: `backend/routes/secure/aXX-name.js`
3. ✅ Add routes to `backend/server.js`
4. ✅ Add seed data to `backend/db/seed.js`
5. ✅ Test endpoints with curl
6. ⚠️ Frontend demo page (optional - can reuse vulnerability.html pattern)

---

## A02: Cryptographic Failures

### Vulnerable Implementation Pattern
```javascript
// backend/routes/vulnerable/a02-crypto-failures.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// VULNERABLE: Store password in plaintext
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, email } = req.body;

    // VULNERABILITY: Storing password as plaintext!
    await db.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3)',
      [username, password, email] // password stored directly!
    );

    res.json({
      success: true,
      vulnerability: 'Password stored in plaintext - major security risk!'
    });
  } catch (error) {
    next(error);
  }
});

// VULNERABLE: Login with plaintext comparison
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### Secure Implementation Pattern
```javascript
// backend/routes/secure/a02-crypto-failures.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const bcrypt = require('bcrypt');

// SECURE: Hash password before storing
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, email } = req.body;

    // SECURITY: Hash password with bcrypt (cost factor 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3)',
      [username, hashedPassword, email]
    );

    res.json({
      success: true,
      security: 'Password securely hashed with bcrypt'
    });
  } catch (error) {
    next(error);
  }
});

// SECURE: Compare hashed passwords
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
      // Don't send password hash in response
      delete user.password;
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## A03: Injection (SQL Injection)

### Vulnerable Implementation Pattern
```javascript
// backend/routes/vulnerable/a03-injection.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// VULNERABLE: SQL Injection via string concatenation
router.get('/search', async (req, res, next) => {
  try {
    const { username } = req.query;

    // VULNERABILITY: Direct string concatenation = SQL Injection!
    const query = `SELECT * FROM users WHERE username = '${username}'`;
    const result = await db.query(query);

    res.json({
      success: true,
      users: result.rows,
      vulnerability: 'SQL Injection via string concatenation'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### Secure Implementation Pattern
```javascript
// backend/routes/secure/a03-injection.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// SECURE: Use parameterized queries
router.get('/search', async (req, res, next) => {
  try {
    const { username } = req.query;

    // SECURITY: Parameterized query prevents SQL injection
    const result = await db.query(
      'SELECT id, username, email FROM users WHERE username = $1',
      [username]
    );

    res.json({
      success: true,
      users: result.rows,
      security: 'Parameterized queries prevent SQL injection'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## A07: Authentication Failures

### Vulnerable Implementation Pattern
```javascript
// backend/routes/vulnerable/a07-auth-failures.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// VULNERABLE: No rate limiting
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // VULNERABILITY: No rate limiting - allows brute force attacks
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, token: 'fake-token-123' });
    } else {
      // VULNERABILITY: Reveals which field is wrong
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    next(error);
  }
});

// VULNERABLE: Weak password requirements
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // VULNERABILITY: No password strength validation
    await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, password]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### Secure Implementation Pattern
```javascript
// backend/routes/secure/a07-auth-failures.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const bcrypt = require('bcrypt');

// Simple in-memory rate limiter (use redis-rate-limiter in production)
const loginAttempts = new Map();

// SECURE: Rate limiting and account lockout
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip;
    const key = `${ip}-${username}`;

    // SECURITY: Check rate limit
    const attempts = loginAttempts.get(key) || { count: 0, lockedUntil: null };

    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      return res.status(429).json({
        error: 'Too many failed attempts. Try again later.',
        security: 'Account temporarily locked after failed attempts'
      });
    }

    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      attempts.count++;
      loginAttempts.set(key, attempts);

      if (attempts.count >= 5) {
        attempts.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
      }

      // SECURITY: Generic error message
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      attempts.count++;
      loginAttempts.set(key, attempts);

      if (attempts.count >= 5) {
        attempts.lockedUntil = Date.now() + 15 * 60 * 1000;
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // SECURITY: Clear attempts on successful login
    loginAttempts.delete(key);

    res.json({
      success: true,
      token: 'secure-jwt-token-here',
      security: 'Rate limiting prevents brute force attacks'
    });
  } catch (error) {
    next(error);
  }
});

// SECURE: Strong password requirements
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // SECURITY: Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain uppercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain number' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    res.json({
      success: true,
      security: 'Password meets security requirements'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## A10: SSRF (Server-Side Request Forgery)

### Vulnerable Implementation Pattern
```javascript
// backend/routes/vulnerable/a10-ssrf.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// VULNERABLE: Unvalidated URL fetching
router.get('/fetch-url', async (req, res, next) => {
  try {
    const { url } = req.query;

    // VULNERABILITY: Fetches any URL without validation!
    const response = await axios.get(url);

    res.json({
      success: true,
      data: response.data,
      vulnerability: 'Can access internal services, cloud metadata, etc.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Secure Implementation Pattern
```javascript
// backend/routes/secure/a10-ssrf.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { URL } = require('url');

// Whitelist of allowed domains
const ALLOWED_DOMAINS = ['example.com', 'api.example.com'];

// SECURE: URL validation and allowlist
router.get('/fetch-url', async (req, res, next) => {
  try {
    const { url } = req.query;

    // SECURITY: Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // SECURITY: Block internal/private IPs
    const hostname = parsedUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return res.status(403).json({
        error: 'Access to internal resources is forbidden',
        security: 'Blocked attempt to access internal network'
      });
    }

    // SECURITY: Check domain allowlist
    if (!ALLOWED_DOMAINS.includes(hostname)) {
      return res.status(403).json({
        error: 'Domain not in allowlist',
        security: 'Only whitelisted domains are allowed'
      });
    }

    // SECURITY: Fetch with timeout
    const response = await axios.get(url, { timeout: 5000 });

    res.json({
      success: true,
      data: response.data,
      security: 'URL validated against allowlist and internal IP ranges'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch URL' });
  }
});

module.exports = router;
```

---

## Adding Routes to server.js

After creating route files, add them to `backend/server.js`:

```javascript
// OWASP Top 10 routes
app.use('/api/vulnerable/a01', require('./routes/vulnerable/a01-access-control'));
app.use('/api/secure/a01', require('./routes/secure/a01-access-control'));
app.use('/api/vulnerable/a02', require('./routes/vulnerable/a02-crypto-failures'));
app.use('/api/secure/a02', require('./routes/secure/a02-crypto-failures'));
app.use('/api/vulnerable/a03', require('./routes/vulnerable/a03-injection'));
app.use('/api/secure/a03', require('./routes/secure/a03-injection'));
// ... continue for a04-a10
```

---

## Testing Examples

```bash
# Test vulnerable endpoint
curl -X GET "http://localhost:3000/api/vulnerable/a03/search?username=admin'--"

# Test secure endpoint
curl -X GET "http://localhost:3000/api/secure/a03/search?username=admin"

# Test authentication
curl -X POST http://localhost:3000/api/vulnerable/a07/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

---

## Remaining Examples (Simpler Patterns)

### A04: Insecure Design
- Vulnerable: Password reset with security questions
- Secure: Email-based reset with time-limited tokens

### A05: Security Misconfiguration
- Vulnerable: Exposed debug endpoints, error details
- Secure: Disabled debug mode, generic error messages

### A06: Vulnerable Components
- Informational endpoint showing dependency versions
- Recommendations for keeping dependencies updated

### A08: Data Integrity Failures
- Vulnerable: Unsafe JSON deserialization
- Secure: Schema validation before processing

### A09: Logging Failures
- Vulnerable: No audit logging
- Secure: Comprehensive security event logging

---

## Priority Implementation Order

1. ✅ A01: Access Control (DONE)
2. **A03: SQL Injection** (Most critical)
3. **A07: Authentication** (Very common)
4. **A02: Crypto Failures** (Common mistake)
5. A10: SSRF
6. A05: Misconfiguration
7. A04, A06, A08, A09 (Lower priority)

This guide provides the complete patterns needed to implement all remaining examples!
