/**
 * AI03 - Sensitive Information Disclosure (Secure)
 * Demonstrates the defensive mitigation: scan submitted code for secrets
 * before processing. Detected values are redacted in place; only the
 * sanitized code enters the AI context and the log store.
 */

const express = require('express');
const router = express.Router();

const requestLog = [];

// Patterns that identify common secret types.
// Each entry: { name, regex, replacement }
const SECRET_PATTERNS = [
  {
    name: 'Stripe Live Key',
    regex: /sk_live_[A-Za-z0-9]{20,}/g,
    replacement: '[REDACTED:STRIPE_LIVE_KEY]',
  },
  {
    name: 'Stripe Test Key',
    regex: /sk_test_[A-Za-z0-9]{20,}/g,
    replacement: '[REDACTED:STRIPE_TEST_KEY]',
  },
  {
    name: 'AWS Access Key',
    regex: /AKIA[A-Z0-9]{16}/g,
    replacement: '[REDACTED:AWS_ACCESS_KEY]',
  },
  {
    name: 'Generic API Key (Bearer / token = ...)',
    regex: /(?:api[_-]?key|token|secret)['":\s=]+[A-Za-z0-9_\-\.]{16,}/gi,
    replacement: '[REDACTED:API_KEY]',
  },
  {
    name: 'Credit Card Number',
    // Matches common 16-digit card formats with optional separators
    regex: /\b(?:\d[ -]?){13,15}\d\b/g,
    replacement: '[REDACTED:CREDIT_CARD]',
  },
  {
    name: 'Database Connection String with Password',
    regex: /(?:postgresql|mysql|mongodb|redis):\/\/[^:]+:[^@\s'"]+@[^\s'"]+/gi,
    replacement: '[REDACTED:DB_CONNECTION_STRING]',
  },
  {
    name: 'Private Key / PEM Block',
    regex: /-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g,
    replacement: '[REDACTED:PRIVATE_KEY]',
  },
];

/**
 * Scan text for secrets. Returns { sanitized, findings }.
 */
function redactSecrets(text) {
  let sanitized = text;
  const findings = [];

  for (const pattern of SECRET_PATTERNS) {
    const matches = [...sanitized.matchAll(pattern.regex)];
    if (matches.length > 0) {
      findings.push({
        type: pattern.name,
        count: matches.length,
        // Show only first 6 chars of the secret so reviewers can identify which
        // credential was found without exposing the full value.
        preview: matches.map(m => m[0].slice(0, 6) + '…').join(', '),
      });
      sanitized = sanitized.replace(pattern.regex, pattern.replacement);
    }
  }

  return { sanitized, findings };
}

/**
 * GET /api/secure/ai03/sample-code
 * Returns the same sample code as the vulnerable route.
 */
router.get('/sample-code', (req, res) => {
  const SAMPLE_CODE = `// Payment processing module
const stripe = require('stripe');

const STRIPE_SECRET_KEY = 'sk_live_4eC39HqLyjWDarjtT1zdp7dc';
const DB_URL = 'postgresql://admin:Sup3rS3cr3tP@ss!@prod-db.internal/payments';

async function chargeCard(amount) {
  const client = stripe(STRIPE_SECRET_KEY);

  // Hardcoded test card — do not commit!
  const card = {
    number: '4532-1234-5678-9010',
    exp_month: 12,
    exp_year: 2025,
    cvc: '123',
  };

  return client.charges.create({ amount, currency: 'usd', source: card });
}`;
  res.json({ success: true, code: SAMPLE_CODE });
});

/**
 * GET /api/secure/ai03/logs
 * SECURE: Log contains only redacted previews — no raw secrets.
 */
router.get('/logs', (req, res) => {
  res.json({ success: true, logs: requestLog });
});

/**
 * POST /api/secure/ai03/review
 * SECURE: Secrets are detected and redacted before the code is processed
 * or logged. The AI context and log store never see the raw secret values.
 */
router.post('/review', (req, res) => {
  const { code } = req.body;

  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: { message: 'code is required', status: 400 } });
  }

  // SECURE: redact before anything else touches the input
  const { sanitized, findings } = redactSecrets(code);

  // Log only the sanitized version
  requestLog.push({
    timestamp: new Date().toISOString(),
    inputLength: code.length,
    preview: sanitized.slice(0, 300),   // secrets already replaced
    redacted: true,
    secretsFound: findings.length,
  });

  res.json({
    success: true,
    review: generateReview(sanitized),
    secretsDetected: findings,          // report what was found (type + safe preview)
    sanitizedCode: sanitized,           // show the cleaned version
    logged: true,
    security:
      findings.length > 0
        ? `${findings.length} secret type(s) detected and redacted before processing. ` +
          'Neither the AI context nor the log store ever saw the raw values.'
        : 'No secrets detected. Code processed normally.',
  });
});

function generateReview(code) {
  const lines = code.split('\n').filter(l => l.trim()).length;
  return [
    `Code Review Summary`,
    '─'.repeat(40),
    `✓ Analyzed ${lines} lines of code.`,
    '✓ No syntax errors detected.',
    '',
    'Suggestions:',
    '  • Avoid hardcoding credentials — use environment variables.',
    '  • Move secrets to a vault (AWS Secrets Manager, HashiCorp Vault).',
    '  • Rotate any keys that have been committed to version control.',
  ].join('\n');
}

module.exports = router;
