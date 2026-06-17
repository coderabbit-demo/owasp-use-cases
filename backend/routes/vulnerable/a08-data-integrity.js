/**
 * A08: Software and Data Integrity Failures - VULNERABLE Implementation
 * Demonstrates insecure deserialization, unsigned data, and integrity violations
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const crypto = require('crypto');

/**
 * VULNERABLE: Insecure deserialization
 * Accepts and deserializes untrusted data without validation
 */
router.post('/import-user', async (req, res, next) => {
  try {
    const { serializedUser } = req.body;

    if (!serializedUser) {
      return res.status(400).json({ error: 'Serialized user data required' });
    }

    // VULNERABILITY: Unsafe deserialization using eval
    let userData;
    try {
      // CRITICAL: Using eval on untrusted input
      userData = eval('(' + serializedUser + ')');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid serialized data' });
    }

    // Directly use deserialized data without validation
    const result = await db.query(
      'INSERT INTO users (username, email, role) VALUES ($1, $2, $3)',
      [userData.username, userData.email, userData.role || 'user']
    );

    res.json({
      success: true,
      user: userData,
      vulnerability: 'Insecure deserialization using eval() - allows code execution'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: No integrity verification for updates
 * Accepts software updates without signature verification
 */
router.post('/software-update', async (req, res, next) => {
  try {
    const { updatePackage, version } = req.body;

    if (!updatePackage || !version) {
      return res.status(400).json({ error: 'Update package and version required' });
    }

    // VULNERABILITY: No signature verification
    // No checksum validation
    // Accepts updates from any source

    res.json({
      success: true,
      message: 'Update accepted and installed',
      version: version,
      vulnerability: 'No signature verification - accepts malicious updates'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Unsigned JWT tokens
 * Allows token tampering
 */
router.post('/create-token', async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    // VULNERABILITY: Creating unsigned JWT-like token
    const payload = {
      userId: userId,
      role: role,
      iat: Date.now()
    };

    // Base64 encode without signing
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');

    res.json({
      success: true,
      token: token,
      vulnerability: 'Unsigned token - can be tampered by attacker'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Accepting tampered tokens
 * No signature validation
 */
router.get('/verify-token', async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // VULNERABILITY: Decoding without signature verification
    let payload;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Using payload without verifying integrity
    res.json({
      success: true,
      payload: payload,
      vulnerability: 'Token accepted without signature verification - attacker can modify role'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: CI/CD without integrity checks
 * Executes code without verifying source
 */
router.post('/deploy-code', async (req, res, next) => {
  try {
    const { repository, branch, commit } = req.body;

    // VULNERABILITY: No verification of code source
    // No checksum of artifacts
    // No signature verification of commits

    res.json({
      success: true,
      message: 'Code deployed',
      repository: repository,
      branch: branch,
      commit: commit,
      vulnerability: 'CI/CD pipeline without integrity verification - supply chain attack risk'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Auto-update without verification
 * Automatically downloads and executes updates
 */
router.get('/check-updates', async (req, res, next) => {
  try {
    // VULNERABILITY: Auto-update from untrusted source
    const update = {
      available: true,
      version: '2.0.0',
      downloadUrl: 'http://updates.example.com/update.exe', // HTTP, not HTTPS
      autoInstall: true,
      vulnerability: 'Auto-update over HTTP without signature verification'
    };

    res.json(update);

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Accepting data without HMAC
 * No message authentication code
 */
router.post('/webhook', async (req, res, next) => {
  try {
    const { event, data } = req.body;

    // VULNERABILITY: No HMAC verification
    // Cannot verify the webhook actually came from trusted source

    // Process webhook without verification
    console.log(`Processing webhook: ${event}`);

    res.json({
      success: true,
      message: 'Webhook processed',
      vulnerability: 'Webhook without HMAC - can be spoofed by attacker'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Storing configuration without integrity protection
 * No checksum or signature for config files
 */
router.post('/update-config', async (req, res, next) => {
  try {
    const { config } = req.body;

    // VULNERABILITY: Accepting config without integrity check
    // No validation of config source
    // No rollback mechanism

    res.json({
      success: true,
      message: 'Configuration updated',
      config: config,
      vulnerability: 'Configuration changes without integrity verification'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Object injection
 * Unsafe object merging allows prototype pollution
 */
router.post('/merge-config', async (req, res, next) => {
  try {
    const { userConfig } = req.body;

    // VULNERABILITY: Unsafe object merge
    const defaultConfig = { theme: 'light', language: 'en' };

    // Dangerous merge that allows __proto__ pollution
    function merge(target, source) {
      for (let key in source) {
        if (typeof source[key] === 'object' && source[key] !== null) {
          target[key] = target[key] || {};
          merge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    }

    const mergedConfig = merge(defaultConfig, userConfig);

    res.json({
      success: true,
      config: mergedConfig,
      vulnerability: 'Unsafe object merge allows prototype pollution'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
