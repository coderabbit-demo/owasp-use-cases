/**
 * A01: Broken Access Control - VULNERABLE Implementation
 * Demonstrates IDOR (Insecure Direct Object Reference) and unauthorized access
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

/**
 * VULNERABLE: Get user profile by ID (IDOR vulnerability)
 * No authorization check - any user can access any profile
 */
router.get('/profile/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // VULNERABILITY: No check if the requesting user owns this profile
    const result = await db.query(
      'SELECT id, username, email, role, api_key FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      profile: result.rows[0],
      vulnerability: 'IDOR: Any user can access any profile by changing the ID'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Get all products (including private ones)
 * No access control check
 */
router.get('/products', async (req, res, next) => {
  try {
    // VULNERABILITY: Returns ALL products, including private ones
    const result = await db.query(
      'SELECT * FROM products ORDER BY id'
    );

    res.json({
      success: true,
      products: result.rows,
      vulnerability: 'No access control - returns private products'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Update any user's role
 * No authorization check for admin actions
 */
router.put('/user/:id/role', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // VULNERABILITY: Anyone can elevate themselves to admin
    await db.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      [role, id]
    );

    res.json({
      success: true,
      message: 'Role updated',
      vulnerability: 'Privilege escalation: Any user can become admin'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Delete any product
 * No ownership verification
 */
router.delete('/product/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // VULNERABILITY: No check if user owns the product
    await db.query('DELETE FROM products WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Product deleted',
      vulnerability: 'Can delete products owned by other users'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Get admin-only data
 * Uses client-provided role instead of server-side check
 */
router.get('/admin/stats', async (req, res, next) => {
  try {
    const { userRole } = req.query; // VULNERABILITY: Client-provided role

    // VULNERABILITY: Trusting client data for authorization
    if (userRole === 'admin') {
      const stats = await db.query(`
        SELECT COUNT(*) as total_users,
               SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count
        FROM users
      `);

      res.json({
        success: true,
        stats: stats.rows[0],
        vulnerability: 'Trusts client-provided role parameter'
      });
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }

  } catch (error) {
    next(error);
  }
});

module.exports = router;
