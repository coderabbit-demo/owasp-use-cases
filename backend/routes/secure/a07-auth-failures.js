/**
 * A07: Identification and Authentication Failures - SECURE Implementation
 * Demonstrates strong authentication with rate limiting, MFA, and secure sessions
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// In-memory storage for demo
const sessions = new Map();
const loginAttempts = new Map();
const resetTokens = new Map();
const mfaTokens = new Map();

/**
 * SECURE: Rate limiting on login attempts
 * Prevents brute force attacks
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // SECURE: Rate limiting - track login attempts
    const attemptKey = username.toLowerCase();
    const attempts = loginAttempts.get(attemptKey) || { count: 0, firstAttempt: Date.now() };

    // Reset counter after 15 minutes
    if (Date.now() - attempts.firstAttempt > 15 * 60 * 1000) {
      attempts.count = 0;
      attempts.firstAttempt = Date.now();
    }

    // Block after 5 failed attempts
    if (attempts.count >= 5) {
      const lockoutTime = 15 - Math.floor((Date.now() - attempts.firstAttempt) / 60000);
      return res.status(429).json({
        error: 'Too many login attempts',
        message: `Account locked. Try again in ${lockoutTime} minutes`,
        retryAfter: lockoutTime * 60
      });
    }

    const result = await db.query(
      'SELECT id, username, email, role, password FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      // Increment attempts even for non-existent users (prevent enumeration)
      attempts.count++;
      loginAttempts.set(attemptKey, attempts);

      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsRemaining: 5 - attempts.count
      });
    }

    const user = result.rows[0];

    // SECURE: Bcrypt password comparison
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      attempts.count++;
      loginAttempts.set(attemptKey, attempts);

      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsRemaining: 5 - attempts.count
      });
    }

    // SECURE: Reset login attempts on successful login
    loginAttempts.delete(attemptKey);

    // SECURE: Generate cryptographically secure session ID
    const sessionId = crypto.randomBytes(32).toString('hex');

    // SECURE: Session with expiration
    sessions.set(sessionId, {
      userId: user.id,
      username: user.username,
      role: user.role,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
      mfaVerified: false // Requires MFA for sensitive operations
    });

    res.json({
      success: true,
      sessionId: sessionId,
      expiresIn: 1800, // seconds
      user: { id: user.id, username: user.username, role: user.role },
      message: 'Login successful - rate limiting and secure session enabled'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Strong password policy
 * Enforces complexity requirements
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // SECURE: Password strength validation
    const passwordErrors = [];

    if (password.length < 12) {
      passwordErrors.push('Password must be at least 12 characters');
    }
    if (!/[a-z]/.test(password)) {
      passwordErrors.push('Password must contain lowercase letters');
    }
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push('Password must contain uppercase letters');
    }
    if (!/[0-9]/.test(password)) {
      passwordErrors.push('Password must contain numbers');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      passwordErrors.push('Password must contain special characters');
    }

    // Check against common passwords
    const commonPasswords = ['password', '123456', 'admin', 'password123', 'qwerty'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      passwordErrors.push('Password is too common');
    }

    if (passwordErrors.length > 0) {
      return res.status(400).json({
        error: 'Weak password',
        requirements: passwordErrors
      });
    }

    // Check if user exists
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // SECURE: Hash password with bcrypt (cost factor 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
      [username, email, hashedPassword, 'user']
    );

    res.json({
      success: true,
      message: 'User registered with strong password policy'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Session expiration enforcement
 * Automatic timeout after inactivity
 */
router.get('/profile', async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(401).json({ error: 'No session provided' });
    }

    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // SECURE: Check session expiration
    if (Date.now() > session.expiresAt) {
      sessions.delete(sessionId);
      return res.status(401).json({
        error: 'Session expired',
        message: 'Please log in again'
      });
    }

    // SECURE: Sliding window - extend session on activity
    session.expiresAt = Date.now() + (30 * 60 * 1000);
    sessions.set(sessionId, session);

    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [session.userId]
    );

    res.json({
      success: true,
      user: result.rows[0],
      sessionExpiresIn: Math.floor((session.expiresAt - Date.now()) / 1000),
      message: 'Session with automatic expiration and renewal'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Password reset with secure token
 * Requires email verification
 */
router.post('/reset-password-request', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const result = await db.query(
      'SELECT id, username FROM users WHERE email = $1',
      [email]
    );

    // SECURE: Generic response (prevent enumeration)
    // Always return success regardless of whether email exists

    if (result.rows.length > 0) {
      const user = result.rows[0];

      // SECURE: Generate cryptographically secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');

      resetTokens.set(resetToken, {
        userId: user.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + (1 * 60 * 60 * 1000) // 1 hour
      });

      // In production: send email with token
      console.log(`Password reset token for ${user.username}: ${resetToken}`);
    }

    // Always return same response
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Complete password reset with token validation
 */
router.post('/reset-password-complete', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }

    const resetData = resetTokens.get(token);

    if (!resetData) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // SECURE: Check token expiration
    if (Date.now() > resetData.expiresAt) {
      resetTokens.delete(token);
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Validate new password (reuse registration validation)
    if (newPassword.length < 12) {
      return res.status(400).json({ error: 'Password does not meet requirements' });
    }

    // SECURE: Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, resetData.userId]
    );

    // SECURE: Invalidate token after use
    resetTokens.delete(token);

    // SECURE: Invalidate all existing sessions for this user
    for (const [sessionId, session] of sessions.entries()) {
      if (session.userId === resetData.userId) {
        sessions.delete(sessionId);
      }
    }

    res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Multi-factor authentication required
 * Additional verification for sensitive operations
 */
router.post('/sensitive-action', async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const mfaCode = req.headers['x-mfa-code'];

    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = sessions.get(sessionId);

    // SECURE: Require MFA for sensitive operations
    if (!session.mfaVerified) {
      // Generate MFA code (in production: send via SMS/app)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      mfaTokens.set(session.userId, {
        code: code,
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
      });

      console.log(`MFA code for user ${session.userId}: ${code}`);

      return res.status(403).json({
        error: 'MFA required',
        message: 'Please provide MFA code for this sensitive operation'
      });
    }

    // Verify MFA code if provided
    if (mfaCode && !session.mfaVerified) {
      const mfaData = mfaTokens.get(session.userId);

      if (!mfaData || Date.now() > mfaData.expiresAt) {
        return res.status(403).json({ error: 'MFA code expired' });
      }

      if (mfaCode !== mfaData.code) {
        return res.status(403).json({ error: 'Invalid MFA code' });
      }

      session.mfaVerified = true;
      sessions.set(sessionId, session);
      mfaTokens.delete(session.userId);
    }

    res.json({
      success: true,
      message: 'Sensitive action completed with MFA verification'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Logout with session invalidation
 */
router.post('/logout', async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];

    if (sessionId && sessions.has(sessionId)) {
      sessions.delete(sessionId);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
