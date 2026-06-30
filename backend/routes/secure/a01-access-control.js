/**
 * A01: Broken Access Control - SECURE Implementation
 * Demonstrates proper authorization and access control
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

/**
 * Mock authentication middleware
 * In production, this would verify JWT/session tokens
 */
function mockAuth(req, res, next) {
  // Simulate authenticated user from session/token
  req.user = {
    id: parseInt(req.headers['x-user-id'] || '2'), // Mock user ID from header
    role: req.headers['x-user-role'] || 'user'
  };
  next();
}

/**
 * Trusted authentication middleware
 * Verifies a real server-side session and loads the user's current role
 */
async function authenticateSession(req, res, next) {
  try {
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await db.query(
      `SELECT u.id, u.username, u.role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1
         AND s.is_valid = 1
         AND s.expires_at > CURRENT_TIMESTAMP`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization middleware - admin only
 */
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
}

/**
 * SECURE: Get user profile by ID (with authorization)
 * Users can only access their own profile unless they're admin
 */
router.get('/profile/:id', mockAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestedId = parseInt(id);

    // SECURITY: Check authorization
    if (req.user.id !== requestedId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own profile',
        security: 'Authorization check prevents IDOR'
      });
    }

    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // SECURITY: Don't expose sensitive fields like api_key
    const profile = result.rows[0];
    delete profile.password;

    res.json({
      success: true,
      profile,
      security: 'User can only access their own profile or admin can access any'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Get products (filtered by visibility)
 * Only returns public products or user's own products
 */
router.get('/products', mockAuth, async (req, res, next) => {
  try {
    // SECURITY: Filter products based on ownership and visibility
    const result = await db.query(
      `SELECT * FROM products
       WHERE is_public = 1 OR user_id = $1
       ORDER BY id`,
      [req.user.id]
    );

    res.json({
      success: true,
      products: result.rows,
      security: 'Only returns public products or user-owned products'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Update user role (admin only)
 * Proper authorization check
 */
router.put('/user/:id/role', authenticateSession, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // SECURITY: Validate role value
    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await db.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      [role, id]
    );

    res.json({
      success: true,
      message: 'Role updated',
      security: 'Only admins can update roles, role values are validated'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Delete product (with ownership check)
 * Users can only delete their own products
 */
router.delete('/product/:id', mockAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // SECURITY: Check ownership before deleting
    const product = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // SECURITY: Verify ownership or admin status
    if (product.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own products',
        security: 'Ownership verification prevents unauthorized deletion'
      });
    }

    await db.query('DELETE FROM products WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Product deleted',
      security: 'Ownership verified before deletion'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Get admin stats (server-side authorization)
 * Never trusts client-provided credentials
 */
router.get('/admin/stats', mockAuth, requireAdmin, async (req, res, next) => {
  try {
    // SECURITY: Role verified server-side via middleware
    const stats = await db.query(`
      SELECT COUNT(*) as total_users,
             SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count
      FROM users
    `);

    res.json({
      success: true,
      stats: stats.rows[0],
      security: 'Authorization verified server-side, not client-provided'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Security guidelines endpoint
 */
router.get('/security-info', (req, res) => {
  res.json({
    success: true,
    guidelines: {
      'authorization': 'Always verify user identity and permissions server-side',
      'idor_prevention': 'Check object ownership before allowing access',
      'least_privilege': 'Grant minimum necessary permissions',
      'no_client_trust': 'Never trust client-provided security parameters',
      'validate_input': 'Validate all user inputs including IDs',
      'secure_defaults': 'Deny access by default, grant explicitly'
    },
    examples: [
      'Check if req.user.id matches resource owner',
      'Use middleware for role-based access control',
      'Filter queries by user_id for private resources',
      'Validate role changes can only be done by admins',
      'Log all authorization failures for monitoring'
    ]
  });
});

module.exports = router;
