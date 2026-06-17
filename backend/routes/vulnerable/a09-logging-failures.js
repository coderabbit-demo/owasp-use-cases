/**
 * A09: Security Logging and Monitoring Failures - VULNERABLE Implementation
 * Demonstrates missing logs, insufficient monitoring, and poor incident response
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

/**
 * VULNERABLE: Login without logging
 * No audit trail of authentication attempts
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // VULNERABILITY: No logging of login attempts
    // No record of failed authentications
    // Cannot detect brute force attacks

    const result = await db.query(
      'SELECT id, username, role FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        vulnerability: 'Failed login not logged - brute force attacks go undetected'
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
      vulnerability: 'Successful login not logged - no audit trail'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Data access without logging
 * No record of who accessed sensitive data
 */
router.get('/sensitive-data/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // VULNERABILITY: No logging of data access
    // Cannot detect unauthorized access
    // No audit trail for compliance

    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      vulnerability: 'Sensitive data access not logged - no audit trail'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Security errors not logged
 * Failed authorization attempts go unnoticed
 */
router.get('/admin/panel', async (req, res, next) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'admin') {
      // VULNERABILITY: Authorization failure not logged
      return res.status(403).json({
        error: 'Forbidden',
        vulnerability: 'Authorization failure not logged - attacks go undetected'
      });
    }

    res.json({
      success: true,
      message: 'Admin panel access granted'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: No alerting on suspicious activity
 * Multiple failed attempts don't trigger alerts
 */
router.post('/verify-code', async (req, res, next) => {
  try {
    const { code } = req.body;
    const correctCode = '123456';

    // VULNERABILITY: No tracking or alerting on multiple failures
    // No rate limiting or account lockout
    // Allows unlimited brute force attempts

    if (code !== correctCode) {
      return res.status(401).json({
        error: 'Invalid code',
        vulnerability: 'No alerting on suspicious activity - brute force undetected'
      });
    }

    res.json({
      success: true,
      message: 'Code verified'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Logs stored insecurely
 * Log files world-readable and unprotected
 */
router.get('/logs', async (req, res, next) => {
  try {
    // VULNERABILITY: Logs accessible without authentication
    // Logs contain sensitive information
    // No log rotation or retention policy

    const fakeLogs = [
      'User admin logged in with password: Admin123!',
      'Database query: SELECT * FROM users WHERE email = "user@example.com"',
      'API Key: sk-abc123xyz789',
      'Payment processed: Card 1234-5678-9012-3456'
    ];

    res.json({
      success: true,
      logs: fakeLogs,
      vulnerability: 'Logs exposed without authentication - contain sensitive data'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: No monitoring of critical operations
 * Privilege escalation attempts not detected
 */
router.post('/change-role', async (req, res, next) => {
  try {
    const { userId, newRole } = req.body;

    // VULNERABILITY: No logging of privilege changes
    // No approval workflow
    // No monitoring for unauthorized escalation

    await db.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      [newRole, userId]
    );

    res.json({
      success: true,
      message: 'Role changed',
      vulnerability: 'Privilege escalation not logged or monitored'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Generic error messages with no logging
 * Errors disappear without investigation
 */
router.get('/process/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Simulate an error condition
    if (id === '999') {
      throw new Error('Database connection failed');
    }

    res.json({
      success: true,
      data: { id: id }
    });

  } catch (error) {
    // VULNERABILITY: Error not logged
    // No alerting on repeated errors
    // Root cause analysis impossible
    res.status(500).json({
      error: 'An error occurred',
      vulnerability: 'Errors not logged - incidents cannot be investigated'
    });
  }
});

/**
 * VULNERABLE: No log integrity protection
 * Logs can be tampered with
 */
router.post('/tamper-logs', async (req, res, next) => {
  try {
    const { logEntry } = req.body;

    // VULNERABILITY: Logs can be modified or deleted
    // No integrity verification
    // No append-only storage

    res.json({
      success: true,
      message: 'Log modified',
      vulnerability: 'Logs can be tampered - no integrity protection'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Insufficient log detail
 * Missing context for security investigation
 */
router.post('/transfer', async (req, res, next) => {
  try {
    const { amount, recipient } = req.body;

    // VULNERABILITY: Minimal logging - missing critical details
    // No IP address, user agent, session ID
    // No geolocation or device fingerprint
    console.log('Transfer made');

    res.json({
      success: true,
      message: 'Transfer completed',
      vulnerability: 'Insufficient log detail - cannot investigate incidents'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: No real-time monitoring
 * Security events detected only after damage
 */
router.get('/monitoring-status', async (req, res, next) => {
  try {
    res.json({
      success: true,
      monitoring: {
        enabled: false,
        realTimeAlerts: false,
        logAggregation: false,
        securityDashboard: false,
        incidentResponse: 'None'
      },
      vulnerability: 'No real-time monitoring - attacks detected too late'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
