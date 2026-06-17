/**
 * A07: Identification and Authentication Failures - VULNERABLE Implementation
 * Demonstrates weak authentication mechanisms and brute force vulnerabilities
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// In-memory storage for demo (vulnerable - no persistence)
const sessions = new Map();
let loginAttempts = new Map();

/**
 * VULNERABLE: No rate limiting on login
 * Allows unlimited brute force attempts
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // VULNERABILITY: No rate limiting - unlimited attempts
    const result = await db.query(
      'SELECT id, username, email, role, password FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        vulnerability: 'No rate limiting - brute force attacks possible'
      });
    }

    const user = result.rows[0];

    // VULNERABILITY: Plaintext password comparison (weak crypto)
    if (password === user.password) {
      // VULNERABILITY: Weak session ID generation
      const sessionId = Date.now().toString(); // Predictable session ID

      sessions.set(sessionId, {
        userId: user.id,
        username: user.username,
        role: user.role,
        createdAt: Date.now()
      });

      return res.json({
        success: true,
        sessionId: sessionId,
        user: { id: user.id, username: user.username, role: user.role },
        vulnerability: 'Weak session ID (predictable), no brute force protection'
      });
    }

    res.status(401).json({
      error: 'Invalid credentials',
      vulnerability: 'No rate limiting - brute force attacks possible'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Weak password policy
 * Allows simple passwords like "password123"
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // VULNERABILITY: No password strength validation
    // Accepts weak passwords like "123", "password", "abc"

    // Check if user exists
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // VULNERABILITY: Storing plaintext password
    const result = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
      [username, email, password, 'user']
    );

    res.json({
      success: true,
      message: 'User registered',
      vulnerability: 'Weak password policy - no complexity requirements, plaintext storage'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Session never expires
 * Long-lived sessions increase attack window
 */
router.get('/profile', async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(401).json({ error: 'No session provided' });
    }

    // VULNERABILITY: No session expiration check
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get user data
    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [session.userId]
    );

    res.json({
      success: true,
      user: result.rows[0],
      sessionAge: Date.now() - session.createdAt,
      vulnerability: 'Sessions never expire - old sessions remain valid indefinitely'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Password reset without verification
 * Allows password reset with just username
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({ error: 'Username and new password required' });
    }

    // VULNERABILITY: No identity verification (no email, no token, no old password)
    const result = await db.query(
      'UPDATE users SET password = $1 WHERE username = $2',
      [newPassword, username]
    );

    res.json({
      success: true,
      message: 'Password reset successful',
      vulnerability: 'Password reset without identity verification - account takeover risk'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Permits default/common passwords
 * No check against common password lists
 */
router.post('/change-password', async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password required' });
    }

    // VULNERABILITY: Allows common passwords
    const commonPasswords = ['password', '123456', 'admin', 'password123', 'qwerty'];
    const isCommon = commonPasswords.includes(newPassword.toLowerCase());

    // Update anyway (vulnerable)
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [newPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password changed',
      warning: isCommon ? 'Common password detected but allowed' : null,
      vulnerability: 'Permits common passwords - no validation against breach databases'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Missing multi-factor authentication
 * Single factor authentication only
 */
router.post('/sensitive-action', async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];

    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // VULNERABILITY: No MFA for sensitive operations
    res.json({
      success: true,
      message: 'Sensitive action completed',
      vulnerability: 'No multi-factor authentication for sensitive operations'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Username enumeration
 * Different responses for existing vs non-existing users
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const result = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    // VULNERABILITY: Different responses reveal if user exists
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        vulnerability: 'Username enumeration - reveals if email exists'
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent',
      vulnerability: 'Username enumeration - attackers can build user lists'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
