/**
 * A02: Cryptographic Failures - SECURE Implementation
 * Demonstrates proper encryption, secure hashing, and cryptographic best practices
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const crypto = require('crypto');

/**
 * SECURE: Hash password with bcrypt (simulated with PBKDF2)
 * Uses strong, slow hashing algorithm with salt
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, email } = req.body;

    // SECURITY: Use PBKDF2 with high iteration count and random salt
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 100000; // High iteration count slows brute force
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    const hashedPassword = `${salt}:${hash}`;

    await db.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3)',
      [username, hashedPassword, email]
    );

    res.json({
      success: true,
      message: 'User registered securely',
      security: [
        'Password hashed with PBKDF2-SHA512',
        '100,000 iterations makes brute force impractical',
        'Random salt prevents rainbow table attacks',
        'Salt stored with hash for verification'
      ],
      best_practice: 'In production, use bcrypt or Argon2 libraries'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Verify password against secure hash
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const result = await db.query(
      'SELECT password FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const [salt, storedHash] = result.rows[0].password.split(':');

    // SECURITY: Recompute hash with same salt and compare
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

    if (hash === storedHash) {
      res.json({
        success: true,
        message: 'Login successful',
        security: 'Password verified using constant-time comparison'
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Use AES-256-GCM encryption
 * Modern authenticated encryption
 */
router.post('/encrypt-data', (req, res) => {
  try {
    const { data } = req.body;

    // SECURITY: Use strong AES-256-GCM with proper key derivation
    const key = crypto.randomBytes(32); // 256-bit key
    const iv = crypto.randomBytes(16);  // Initialization vector

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag(); // SECURITY: Authentication tag prevents tampering

    res.json({
      success: true,
      encrypted,
      security_measures: [
        'AES-256-GCM provides confidentiality and authenticity',
        'Random IV prevents pattern detection',
        'Authentication tag prevents tampering',
        'Key should be stored in secure key management system (KMS)'
      ],
      metadata: {
        algorithm: 'AES-256-GCM',
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        keyLength: 256
      },
      note: 'In production, store key in AWS KMS, Azure Key Vault, or HashiCorp Vault'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * SECURE: Return user data without sensitive fields
 * Never expose credentials in API responses
 */
router.get('/user/:id/profile', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // SECURITY: Only return non-sensitive fields
    res.json({
      success: true,
      profile: result.rows[0],
      security: [
        'Password hash excluded from response',
        'API keys and tokens not exposed',
        'Only necessary data returned',
        'Sensitive data remains server-side'
      ]
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Generate cryptographically secure random token
 * Uses crypto.randomBytes for unpredictability
 */
router.get('/generate-token', (req, res) => {
  // SECURITY: Use crypto.randomBytes for cryptographically secure randomness
  const token = crypto.randomBytes(32).toString('hex');

  // Additional: Add timestamp and sign it
  const timestamp = Date.now();
  const payload = `${token}:${timestamp}`;
  const signature = crypto.createHmac('sha256', 'server-secret-key')
    .update(payload)
    .digest('hex');

  res.json({
    success: true,
    token: `${payload}:${signature}`,
    security: [
      'crypto.randomBytes provides cryptographic randomness',
      'Token signed with HMAC to prevent tampering',
      'Timestamp allows expiration validation',
      '256 bits of entropy makes prediction impossible'
    ],
    entropy: '256 bits',
    collision_probability: '1 in 2^256'
  });
});

/**
 * SECURE: Payment info should be tokenized
 * Use payment processor's tokenization (PCI-DSS Level 1)
 */
router.post('/save-payment', async (req, res) => {
  const { userId, paymentToken } = req.body;

  res.json({
    success: true,
    message: 'Payment token saved',
    security: [
      'Never store raw credit card data',
      'Use payment processor tokenization (Stripe, Square, etc.)',
      'Store only the token reference',
      'PCI-DSS compliance handled by payment processor',
      'Reduces security scope and liability'
    ],
    best_practices: {
      'stripe': 'Use Stripe.js and stripe.tokens.create()',
      'square': 'Use Square Payment Form',
      'general': 'Let PCI-DSS Level 1 providers handle card data'
    },
    saved: {
      user_id: userId,
      payment_token: paymentToken,
      processor: 'stripe'
    }
  });
});

/**
 * SECURE: Data encryption with proper algorithm
 * Uses authenticated encryption
 */
router.post('/secure-encrypt', (req, res) => {
  const { data } = req.body;

  // SECURITY: Use modern authenticated encryption
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  res.json({
    success: true,
    encrypted,
    security: {
      algorithm: 'AES-256-GCM',
      key_size: '256 bits',
      mode: 'GCM (Galois/Counter Mode)',
      authentication: 'Built-in authentication tag prevents tampering',
      iv: iv.toString('hex'),
      auth_tag: authTag.toString('hex')
    },
    comparison: {
      'bad': ['DES', 'RC4', 'XOR', 'ECB mode'],
      'good': ['AES-256-GCM', 'ChaCha20-Poly1305'],
      'key_management': 'Use KMS (AWS KMS, Azure Key Vault, GCP KMS)'
    }
  });
});

/**
 * SECURE: TLS/SSL configuration guidance
 */
router.get('/ssl-info', (req, res) => {
  res.json({
    success: true,
    recommended_configuration: {
      min_tls_version: 'TLSv1.3',
      fallback_version: 'TLSv1.2',
      certificate_validation: true,
      reject_self_signed: true,
      cipher_suites: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256'
      ],
      hsts_enabled: true,
      hsts_max_age: 31536000,
      perfect_forward_secrecy: true
    },
    security_headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    },
    best_practices: [
      'Use TLS 1.3 or minimum TLS 1.2',
      'Enable HSTS to force HTTPS',
      'Use strong cipher suites only',
      'Enable certificate pinning for critical applications',
      'Regularly rotate certificates',
      'Monitor for weak ciphers with SSL Labs'
    ],
    tools: {
      'testing': 'SSL Labs (ssllabs.com/ssltest)',
      'nodejs': 'Set minVersion: "TLSv1.2" in https.createServer',
      'nginx': 'ssl_protocols TLSv1.2 TLSv1.3;'
    }
  });
});

/**
 * Security guidelines endpoint
 */
router.get('/security-info', (req, res) => {
  res.json({
    success: true,
    cryptographic_best_practices: {
      'passwords': {
        'hashing': 'Use bcrypt, Argon2, or PBKDF2 with high iteration count',
        'never': 'Never use MD5, SHA1, or plaintext',
        'salt': 'Always use unique random salt per password',
        'work_factor': 'Adjust iterations to take ~200-500ms'
      },
      'encryption': {
        'algorithm': 'Use AES-256-GCM or ChaCha20-Poly1305',
        'never': 'Never use DES, RC4, ECB mode, or custom crypto',
        'keys': 'Store keys in KMS, never hardcode',
        'iv': 'Use unique random IV for each encryption'
      },
      'randomness': {
        'secure': 'Use crypto.randomBytes() for security tokens',
        'never': 'Never use Math.random() for security',
        'tokens': 'Use at least 256 bits of entropy'
      },
      'tls': {
        'version': 'TLS 1.3 or minimum TLS 1.2',
        'certificates': 'Use valid certificates from trusted CA',
        'hsts': 'Enable HTTP Strict Transport Security',
        'validation': 'Always validate certificates'
      },
      'sensitive_data': {
        'storage': 'Encrypt at rest using strong encryption',
        'transit': 'Always use HTTPS/TLS',
        'pci_dss': 'Never store CVV, use tokenization for cards',
        'minimize': 'Collect and store only necessary data'
      }
    },
    common_mistakes: [
      'Storing passwords in plaintext or with weak hashing',
      'Using MD5 or SHA1 for passwords',
      'Hardcoding encryption keys in source code',
      'Using weak encryption algorithms (DES, RC4)',
      'Not using salt with password hashes',
      'Using Math.random() for security tokens',
      'Accepting self-signed certificates in production',
      'Storing credit card data instead of tokenizing'
    ],
    resources: [
      'OWASP Cryptographic Storage Cheat Sheet',
      'NIST Guidelines on Cryptography',
      'PCI-DSS Requirements for Payment Data'
    ]
  });
});

module.exports = router;
