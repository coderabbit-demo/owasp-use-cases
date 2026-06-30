/**
 * AI03 - Sensitive Information Disclosure (Vulnerable)
 * Demonstrates "The Leaky Reviewer" attack: an AI code-review service
 * processes submitted code without scanning for secrets. Credit card
 * numbers, API keys, and tokens are reflected verbatim in the response
 * and persisted unredacted in the server-side request log.
 */

const express = require('express');
const router = express.Router();

// In-memory log — simulates what gets written to disk / shipped to a
// logging service such as Datadog, Splunk, or CloudWatch.
const requestLog = [];

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

/**
 * GET /api/vulnerable/ai03/sample-code
 * Returns a code snippet containing embedded secrets for the demo.
 */
router.get('/sample-code', (req, res) => {
  res.json({ success: true, code: SAMPLE_CODE });
});

/**
 * GET /api/vulnerable/ai03/logs
 * VULNERABLE: Returns the raw request log — secrets included.
 */
router.get('/logs', (req, res) => {
  res.json({ success: true, logs: requestLog });
});

/**
 * POST /api/vulnerable/ai03/review
 * VULNERABLE: Code is processed and summarised with no secret scanning.
 * Secrets are reflected in the response and logged unredacted.
 */
router.post('/review', (req, res) => {
  const { code } = req.body;

  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: { message: 'code is required', status: 400 } });
  }

  // VULNERABLE: log raw input — secrets land in the log store
  const logEntry = {
    timestamp: new Date().toISOString(),
    inputLength: code.length,
    preview: code.slice(0, 300),   // secrets fully visible in logs
    redacted: false,
  };
  requestLog.push(logEntry);

  // VULNERABLE: extract and echo back whatever strings look interesting —
  // including any secrets the developer accidentally included
  const lines = code.split('\n');
  const stringLiterals = lines
    .map(l => { const m = l.match(/['"`]([^'"`]{8,})['"` ]/); return m ? m[1] : null; })
    .filter(Boolean);

  res.json({
    success: true,
    review: generateReview(code),
    extractedStrings: stringLiterals,   // <-- leaks secrets back to caller
    linesAnalyzed: lines.length,
    logged: true,
    vulnerability:
      'Submitted code was processed and logged without any secret scanning. ' +
      'Secrets in extractedStrings above were reflected to the caller and are ' +
      'now stored unredacted in the server log.',
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
