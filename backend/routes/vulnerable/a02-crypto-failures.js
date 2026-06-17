/**
 * A02: Cryptographic Failures - VULNERABLE Implementation
 * Demonstrates weak encryption, plaintext storage, and insecure hashing
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const crypto = require('crypto');

/**
 * VULNERABLE: Store password in plaintext
 * No encryption or hashing
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, email } = req.body;

    // VULNERABILITY: Storing password in plaintext
    await db.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3)',
      [username, password, email]
    );

    res.json({
      success: true,
      message: 'User registered',
      vulnerability: 'Password stored in plaintext - anyone with database access can read it',
      warning: 'In a real breach, this password is immediately compromised'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Use weak MD5 hashing
 * MD5 is cryptographically broken and unsuitable for passwords
 */
router.post('/register-md5', async (req, res, next) => {
  try {
    const { username, password, email } = req.body;

    // VULNERABILITY: MD5 is broken and can be cracked quickly
    const md5Hash = crypto.createHash('md5').update(password).digest('hex');

    await db.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3)',
      [username, md5Hash, email]
    );

    res.json({
      success: true,
      message: 'User registered with MD5',
      hash: md5Hash,
      vulnerability: 'MD5 hashing is broken - rainbow tables can crack these instantly',
      attack_example: 'Tools like hashcat can crack MD5 hashes in seconds'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Use weak encryption (DES)
 * DES has only 56-bit key strength
 */
router.post('/encrypt-data', (req, res) => {
  try {
    const { data } = req.body;
    const key = 'weakkey1'; // VULNERABILITY: Hardcoded weak key

    // VULNERABILITY: Using weak DES encryption
    const cipher = crypto.createCipher('des', key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    res.json({
      success: true,
      encrypted,
      vulnerability: 'DES encryption is obsolete and easily broken',
      attack: 'DES can be brute-forced in hours with modern hardware',
      additional_issues: [
        'Hardcoded encryption key',
        'Key reused across all encryptions',
        'No salt or IV used'
      ]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * VULNERABLE: Transmit sensitive data unencrypted
 * Returns API key and credentials in plaintext
 */
router.get('/user/:id/credentials', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT username, password, email, api_key FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // VULNERABILITY: Returning sensitive data in plaintext
    res.json({
      success: true,
      credentials: result.rows[0],
      vulnerability: 'Sensitive credentials transmitted without encryption',
      risk: 'Data can be intercepted in transit or logged in plaintext'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Use predictable random values
 * Math.random() is not cryptographically secure
 */
router.get('/generate-token', (req, res) => {
  // VULNERABILITY: Using Math.random() for security-sensitive token
  const token = Math.random().toString(36).substring(2);

  res.json({
    success: true,
    token,
    vulnerability: 'Math.random() is predictable and not cryptographically secure',
    attack: 'Attacker can predict token values and hijack sessions',
    proper_method: 'Use crypto.randomBytes() for security tokens'
  });
});

/**
 * VULNERABLE: Store credit card in plaintext
 * PCI-DSS violation
 */
router.post('/save-payment', async (req, res, next) => {
  try {
    const { userId, creditCard, cvv, expiry } = req.body;

    // VULNERABILITY: Storing payment info in plaintext
    await db.query(
      `INSERT INTO payment_info (user_id, credit_card, cvv, expiry)
       VALUES ($1, $2, $3, $4)`,
      [userId, creditCard, cvv, expiry]
    );

    res.json({
      success: true,
      message: 'Payment info saved',
      vulnerability: 'Credit card data stored in plaintext violates PCI-DSS',
      consequences: [
        'Regulatory fines',
        'Loss of payment processing license',
        'Customer data breach',
        'Legal liability'
      ]
    });

  } catch (error) {
    // Table may not exist - that's OK for demo
    res.json({
      success: true,
      message: 'Demo only - table not created',
      vulnerability: 'Would store credit card in plaintext'
    });
  }
});

/**
 * VULNERABLE: Use simple XOR encryption
 * XOR is easily reversible
 */
router.post('/xor-encrypt', (req, res) => {
  const { data, key } = req.body;

  // VULNERABILITY: XOR "encryption" is trivially broken
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }

  const base64Encrypted = Buffer.from(encrypted).toString('base64');

  res.json({
    success: true,
    encrypted: base64Encrypted,
    vulnerability: 'XOR is not real encryption - easily broken with known plaintext',
    attack: 'If attacker knows any plaintext, they can recover the key'
  });
});

/**
 * VULNERABLE: No certificate validation
 * Returns info about insecure HTTPS configuration
 */
router.get('/ssl-info', (req, res) => {
  res.json({
    success: true,
    configuration: {
      certificate_validation: false,
      accept_self_signed: true,
      min_tls_version: 'TLSv1.0',
      allowed_ciphers: 'ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv2:+EXP'
    },
    vulnerability: 'Insecure TLS/SSL configuration',
    risks: [
      'Accepts weak TLS 1.0 protocol',
      'Allows weak cipher suites',
      'No certificate validation enables MITM attacks',
      'Accepts self-signed certificates'
    ],
    attack: 'Attacker can intercept and decrypt traffic via MITM attack'
  });
});

module.exports = router;
