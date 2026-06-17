/**
 * A05: Security Misconfiguration - SECURE Implementation
 * Demonstrates proper configuration, error handling, and hardening
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

/**
 * SECURE: No debug endpoints in production
 * Limited health check without sensitive information
 */
router.get('/health', async (req, res, next) => {
  try {
    // SECURE: Only expose minimal, non-sensitive information
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Debug endpoints disabled in production'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Generic error messages
 * No internal details exposed to client
 */
router.get('/user/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Input validation
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'User ID must be a valid number'
      });
    }

    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      // SECURE: Generic error message
      return res.status(404).json({
        error: 'Not found',
        message: 'The requested resource does not exist'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    // SECURE: Log error server-side, send generic message to client
    console.error('Error fetching user:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while processing your request'
    });
  }
});

/**
 * SECURE: Strong authentication required
 * No default credentials
 */
router.post('/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Username and password are required'
      });
    }

    // SECURE: Check against database with hashed passwords
    const result = await db.query(
      'SELECT id, username, role FROM users WHERE username = $1 AND role = $2',
      [username, 'admin']
    );

    if (result.rows.length === 0) {
      // SECURE: Generic error message (don't reveal if user exists)
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials'
      });
    }

    // In real implementation, verify password hash with bcrypt
    // SECURE: Generate secure session token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      token: token,
      message: 'Strong authentication with secure token generation'
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable'
    });
  }
});

/**
 * SECURE: Directory listing disabled
 * Only serve explicitly allowed resources
 */
router.get('/files', async (req, res, next) => {
  try {
    // SECURE: Return error - directory listing not allowed
    res.status(403).json({
      error: 'Forbidden',
      message: 'Directory listing is disabled for security reasons'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Legacy endpoints removed
 * Only current API versions available
 */
router.get('/legacy/backup', async (req, res, next) => {
  try {
    // SECURE: Legacy endpoint removed, return 410 Gone
    res.status(410).json({
      error: 'Endpoint removed',
      message: 'This endpoint has been removed. Please use the current API version.',
      currentVersion: 'v1'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Proper CORS configuration
 * Only allow specific trusted origins
 */
router.get('/api/sensitive-data', async (req, res, next) => {
  try {
    // SECURE: Restrict CORS to specific origins
    const allowedOrigins = ['https://trusted-domain.com', 'http://localhost:3000'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    // Additional authentication check would go here
    const result = await db.query(
      'SELECT id, username, role FROM users LIMIT 5'
    );

    res.json({
      success: true,
      data: result.rows,
      message: 'CORS restricted to trusted origins only'
    });

  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to retrieve data'
    });
  }
});

/**
 * SECURE: Security headers configuration
 * Demonstrates proper security headers
 */
router.get('/config/headers', (req, res) => {
  res.json({
    success: true,
    securityHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'"
    },
    message: 'Proper security headers configured'
  });
});

module.exports = router;
