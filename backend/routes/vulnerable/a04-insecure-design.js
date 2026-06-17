/**
 * A04: Insecure Design - VULNERABLE Implementation
 * Demonstrates weak password reset flow and business logic flaws
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const crypto = require('crypto');

/**
 * VULNERABLE: Password reset with predictable token
 * Uses sequential or simple tokens
 */
router.post('/reset-password-request', async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await db.query(
      'SELECT id, username FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // VULNERABILITY: Confirms email doesn't exist (user enumeration)
      return res.status(404).json({ error: 'Email not found' });
    }

    const user = result.rows[0];

    // VULNERABILITY: Predictable reset token (sequential or simple)
    const resetToken = `reset_${user.id}_${Date.now()}`;

    // VULNERABILITY: Token doesn't expire or has very long expiration
    await db.query(
      'UPDATE users SET reset_token = $1 WHERE id = $2',
      [resetToken, user.id]
    );

    res.json({
      success: true,
      message: 'Reset link sent',
      reset_link: `/reset-password?token=${resetToken}`,
      vulnerability: [
        'Predictable token format: reset_[userId]_[timestamp]',
        'Token never expires or expires too slowly',
        'User enumeration via different error messages',
        'No rate limiting on reset requests'
      ],
      attack: 'Attacker can guess tokens or enumerate users'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Reset password without proper validation
 * No token verification, accepts any token
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // VULNERABILITY: No token validation
    const result = await db.query(
      'SELECT id FROM users WHERE reset_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // VULNERABILITY: No password strength requirements
    // VULNERABILITY: No check if token is expired
    await db.query(
      'UPDATE users SET password = $1, reset_token = NULL WHERE id = $2',
      [newPassword, result.rows[0].id]
    );

    res.json({
      success: true,
      message: 'Password reset successful',
      vulnerability: [
        'No password strength validation',
        'Token doesn\'t expire',
        'No notification sent to user',
        'Old password not required'
      ]
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Excessive data exposure in API
 * Returns unnecessary sensitive fields
 */
router.get('/user-profile/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // VULNERABILITY: Returns ALL user data including sensitive fields
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0], // Exposes password, api_key, reset_token, etc.
      vulnerability: [
        'Exposes password hash',
        'Exposes API keys',
        'Exposes reset tokens',
        'Returns internal fields (created_at, login_attempts)',
        'More data = more attack surface'
      ]
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: No business logic validation
 * Allows negative quantities and prices
 */
router.post('/purchase', async (req, res, next) => {
  try {
    const { productId, quantity, price } = req.body;

    // VULNERABILITY: No validation of business rules
    // Accepts negative quantities (refunds without authorization)
    // Accepts manipulated prices

    const total = quantity * price;

    res.json({
      success: true,
      message: 'Purchase processed',
      order: {
        productId,
        quantity,
        price,
        total
      },
      vulnerability: [
        'No validation: quantity can be negative',
        'Price from client, not server',
        'Can set price to $0.01',
        'No inventory check',
        'No authorization check'
      ],
      attack: 'Send quantity: -1 to get money back, or price: 0.01 to buy cheap'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Unlimited trial accounts
 * No tracking of email/IP for trial abuse
 */
router.post('/create-trial', async (req, res, next) => {
  try {
    const { email } = req.body;

    // VULNERABILITY: No check for existing trials
    // User can create unlimited trials with different emails
    await db.query(
      'INSERT INTO users (username, email, role) VALUES ($1, $2, $3)',
      [email.split('@')[0], email, 'trial']
    );

    res.json({
      success: true,
      message: 'Trial account created',
      trial_days: 30,
      vulnerability: [
        'No verification of email ownership',
        'No limit on trials per IP',
        'No device fingerprinting',
        'Can create infinite trials with temp emails'
      ],
      attack: 'Use disposable email services to get unlimited trials'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: No rate limiting
 * Allows brute force attacks
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // VULNERABILITY: No rate limiting or account lockout
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({
        success: true,
        message: 'Login successful',
        user: result.rows[0]
      });
    } else {
      res.status(401).json({
        error: 'Invalid credentials',
        vulnerability: [
          'No rate limiting - unlimited attempts',
          'No account lockout after failed attempts',
          'No CAPTCHA after multiple failures',
          'No delay between attempts'
        ],
        attack: 'Brute force attack with common password lists'
      });
    }

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Insecure workflow design
 * Can skip payment step in checkout flow
 */
let orderState = {};

router.post('/checkout/start', (req, res) => {
  const orderId = Date.now().toString();
  orderState[orderId] = {
    step: 'cart',
    items: req.body.items,
    total: req.body.total,
    paid: false
  };

  res.json({
    success: true,
    orderId,
    nextStep: '/checkout/payment'
  });
});

router.post('/checkout/confirm', (req, res) => {
  const { orderId } = req.body;

  // VULNERABILITY: No validation that payment was completed
  // Can skip directly to confirmation without paying

  if (orderState[orderId]) {
    res.json({
      success: true,
      message: 'Order confirmed',
      vulnerability: [
        'Can skip payment step entirely',
        'No verification of payment completion',
        'Workflow steps not enforced',
        'State stored in memory (lost on restart)'
      ],
      attack: 'POST to /checkout/confirm without calling /checkout/payment'
    });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

/**
 * VULNERABLE: Insufficient anti-automation
 * No CAPTCHA or bot detection
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // VULNERABILITY: No CAPTCHA, can be automated
    await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
      [username, email, password]
    );

    res.json({
      success: true,
      message: 'User registered',
      vulnerability: [
        'No CAPTCHA or bot detection',
        'Can create thousands of accounts via automation',
        'No email verification',
        'No rate limiting on registration'
      ],
      attack: 'Bot creates spam accounts for abuse'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
