/**
 * A05: Security Misconfiguration - VULNERABLE Implementation
 * Demonstrates exposed debug endpoints, verbose errors, and insecure defaults
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

/**
 * VULNERABLE: Debug endpoint exposed in production
 * Leaks sensitive system information
 */
router.get('/debug/info', async (req, res, next) => {
  try {
    // VULNERABILITY: Exposing debug information in production
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      env: process.env, // CRITICAL: Exposes all environment variables including secrets
      cwd: process.cwd(),
      pid: process.pid
    };

    res.json({
      success: true,
      debug: systemInfo,
      vulnerability: 'Debug endpoint exposed - leaks sensitive system information and secrets'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Verbose error messages
 * Exposes stack traces and internal details
 */
router.get('/user/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // VULNERABILITY: Detailed error messages expose database structure
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      // VULNERABILITY: Exposing database query details
      return res.status(404).json({
        error: 'User not found',
        query: 'SELECT * FROM users WHERE id = $1',
        params: [id],
        database: 'SQLite',
        table: 'users'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    // VULNERABILITY: Exposing full stack trace to client
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      vulnerability: 'Verbose error messages expose internal implementation details'
    });
  }
});

/**
 * VULNERABLE: Default credentials still enabled
 * Allows access with well-known default credentials
 */
router.post('/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // VULNERABILITY: Default admin credentials not changed
    if (username === 'admin' && password === 'admin123') {
      return res.json({
        success: true,
        token: 'default-admin-token-12345',
        role: 'admin',
        vulnerability: 'Default credentials still enabled (admin/admin123)'
      });
    }

    res.status(401).json({ error: 'Invalid credentials' });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Directory listing enabled
 * Exposes file structure and sensitive files
 */
router.get('/files', async (req, res, next) => {
  try {
    const fs = require('fs');
    const path = require('path');

    // VULNERABILITY: Exposing directory structure
    const files = fs.readdirSync(path.join(__dirname, '../../'));

    res.json({
      success: true,
      files: files,
      vulnerability: 'Directory listing enabled - exposes application structure'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Unnecessary services enabled
 * Legacy/debug endpoints still accessible
 */
router.get('/legacy/backup', async (req, res, next) => {
  try {
    // VULNERABILITY: Legacy endpoint not removed
    const result = await db.query(
      'SELECT username, email, password FROM users'
    );

    res.json({
      success: true,
      backup: result.rows,
      vulnerability: 'Legacy backup endpoint exposes plaintext passwords'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: CORS misconfiguration
 * Allows requests from any origin
 */
router.get('/api/sensitive-data', async (req, res, next) => {
  try {
    // VULNERABILITY: Overly permissive CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    const result = await db.query(
      'SELECT * FROM users LIMIT 5'
    );

    res.json({
      success: true,
      data: result.rows,
      vulnerability: 'CORS allows any origin with credentials'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
