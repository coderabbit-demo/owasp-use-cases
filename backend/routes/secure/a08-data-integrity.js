/**
 * A08: Software and Data Integrity Failures - SECURE Implementation
 * Demonstrates secure deserialization, signed data, and integrity verification
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const crypto = require('crypto');

// Secret key for HMAC (in production: use environment variable)
const SECRET_KEY = process.env.HMAC_SECRET || 'secure-secret-key-change-in-production';

/**
 * SECURE: Safe deserialization with validation
 * Uses JSON.parse with input validation
 */
router.post('/import-user', async (req, res, next) => {
  try {
    const { serializedUser } = req.body;

    if (!serializedUser) {
      return res.status(400).json({ error: 'Serialized user data required' });
    }

    // SECURE: Safe deserialization using JSON.parse
    let userData;
    try {
      userData = JSON.parse(serializedUser);
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid JSON format',
        message: 'Data must be valid JSON'
      });
    }

    // SECURE: Validate deserialized data structure
    const requiredFields = ['username', 'email'];
    for (let field of requiredFields) {
      if (!userData[field] || typeof userData[field] !== 'string') {
        return res.status(400).json({
          error: 'Invalid data structure',
          message: `Field '${field}' is required and must be a string`
        });
      }
    }

    // SECURE: Whitelist allowed fields
    const allowedFields = ['username', 'email'];
    const sanitizedData = {};
    for (let field of allowedFields) {
      sanitizedData[field] = userData[field];
    }

    // SECURE: Force role to 'user' (don't trust deserialized role)
    const result = await db.query(
      'INSERT INTO users (username, email, role) VALUES ($1, $2, $3)',
      [sanitizedData.username, sanitizedData.email, 'user']
    );

    res.json({
      success: true,
      user: sanitizedData,
      message: 'Safe deserialization with JSON.parse and validation'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Software update with signature verification
 * Verifies digital signature before accepting updates
 */
router.post('/software-update', async (req, res, next) => {
  try {
    const { updatePackage, version, signature, checksum } = req.body;

    if (!updatePackage || !version || !signature || !checksum) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Update package, version, signature, and checksum are required'
      });
    }

    // SECURE: Verify digital signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(updatePackage + version)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(403).json({
        error: 'Invalid signature',
        message: 'Update package signature verification failed'
      });
    }

    // SECURE: Verify checksum
    const calculatedChecksum = crypto
      .createHash('sha256')
      .update(updatePackage)
      .digest('hex');

    if (checksum !== calculatedChecksum) {
      return res.status(403).json({
        error: 'Checksum mismatch',
        message: 'Update package integrity verification failed'
      });
    }

    res.json({
      success: true,
      message: 'Update verified and accepted',
      version: version,
      verifiedSignature: true,
      verifiedChecksum: true
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Signed JWT tokens with HMAC
 * Creates cryptographically signed tokens
 */
router.post('/create-token', async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // SECURE: Create signed token
    const payload = {
      userId: userId,
      role: role || 'user', // Default to 'user' role
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');

    // SECURE: Sign with HMAC
    const signature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payloadBase64)
      .digest('base64');

    const token = `${payloadBase64}.${signature}`;

    res.json({
      success: true,
      token: token,
      expiresIn: 3600,
      message: 'Token signed with HMAC-SHA256'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Token verification with signature validation
 * Verifies HMAC signature before trusting payload
 */
router.get('/verify-token', async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // SECURE: Split token and verify structure
    const parts = token.split('.');
    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const [payloadBase64, providedSignature] = parts;

    // SECURE: Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payloadBase64)
      .digest('base64');

    if (providedSignature !== expectedSignature) {
      return res.status(401).json({
        error: 'Invalid signature',
        message: 'Token signature verification failed'
      });
    }

    // SECURE: Decode payload after verification
    let payload;
    try {
      const decoded = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // SECURE: Verify expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please obtain a new token'
      });
    }

    res.json({
      success: true,
      payload: payload,
      verified: true,
      message: 'Token signature verified successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: CI/CD with integrity verification
 * Verifies code signatures and checksums
 */
router.post('/deploy-code', async (req, res, next) => {
  try {
    const { repository, branch, commit, signature } = req.body;

    if (!repository || !branch || !commit || !signature) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Repository, branch, commit, and signature are required'
      });
    }

    // SECURE: Verify commit signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${repository}:${branch}:${commit}`)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(403).json({
        error: 'Invalid commit signature',
        message: 'Code integrity verification failed'
      });
    }

    // In production: Additional checks
    // - Verify commit is signed by authorized developer
    // - Verify all dependencies have integrity checksums
    // - Run security scans before deployment

    res.json({
      success: true,
      message: 'Code signature verified and deployed',
      repository: repository,
      branch: branch,
      commit: commit,
      verified: true
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Manual update with verification
 * User-controlled updates with signature checks
 */
router.get('/check-updates', async (req, res, next) => {
  try {
    // SECURE: Manual updates only, HTTPS, signature verification required
    const update = {
      available: true,
      version: '2.0.0',
      downloadUrl: 'https://secure-updates.example.com/update.exe', // HTTPS
      signature: 'abc123...', // Digital signature
      checksum: 'sha256:def456...',
      autoInstall: false, // Manual installation
      releaseNotes: 'https://secure-updates.example.com/release-notes',
      signatureVerification: 'Required before installation'
    };

    res.json({
      success: true,
      update: update,
      message: 'Updates delivered over HTTPS with signature verification'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Webhook with HMAC verification
 * Verifies webhook authenticity
 */
router.post('/webhook', async (req, res, next) => {
  try {
    const { event, data } = req.body;
    const providedSignature = req.headers['x-webhook-signature'];

    if (!providedSignature) {
      return res.status(401).json({
        error: 'Missing signature',
        message: 'Webhook signature required'
      });
    }

    // SECURE: Verify HMAC signature
    const payload = JSON.stringify({ event, data });
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payload)
      .digest('hex');

    if (providedSignature !== expectedSignature) {
      return res.status(403).json({
        error: 'Invalid signature',
        message: 'Webhook signature verification failed'
      });
    }

    // Process webhook after verification
    console.log(`Verified webhook: ${event}`);

    res.json({
      success: true,
      message: 'Webhook verified and processed',
      verified: true
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Configuration with integrity protection
 * Signed configurations with rollback capability
 */
router.post('/update-config', async (req, res, next) => {
  try {
    const { config, signature } = req.body;

    if (!config || !signature) {
      return res.status(400).json({
        error: 'Configuration and signature required'
      });
    }

    // SECURE: Verify configuration signature
    const configString = JSON.stringify(config);
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(configString)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(403).json({
        error: 'Invalid configuration signature'
      });
    }

    // SECURE: Validate configuration schema
    const allowedKeys = ['theme', 'language', 'notifications'];
    for (let key in config) {
      if (!allowedKeys.includes(key)) {
        return res.status(400).json({
          error: 'Invalid configuration key',
          message: `Key '${key}' is not allowed`
        });
      }
    }

    res.json({
      success: true,
      message: 'Configuration updated with integrity verification',
      config: config,
      verified: true
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Safe object merging
 * Protection against prototype pollution
 */
router.post('/merge-config', async (req, res, next) => {
  try {
    const { userConfig } = req.body;

    if (!userConfig || typeof userConfig !== 'object') {
      return res.status(400).json({ error: 'Valid configuration object required' });
    }

    const defaultConfig = { theme: 'light', language: 'en' };

    // SECURE: Safe merge with prototype pollution protection
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    const allowedKeys = ['theme', 'language', 'notifications'];

    const mergedConfig = { ...defaultConfig };

    for (let key in userConfig) {
      // Check for dangerous keys
      if (dangerousKeys.includes(key)) {
        return res.status(400).json({
          error: 'Invalid configuration key',
          message: 'Dangerous key detected'
        });
      }

      // Check against whitelist
      if (allowedKeys.includes(key) && userConfig.hasOwnProperty(key)) {
        mergedConfig[key] = userConfig[key];
      }
    }

    res.json({
      success: true,
      config: mergedConfig,
      message: 'Safe object merge with prototype pollution protection'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
