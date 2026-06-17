/**
 * Examples API Routes
 * Provides metadata about all vulnerability examples
 */

const express = require('express');
const router = express.Router();
const db = require('../db/connection');

/**
 * GET /api/examples
 * Get all vulnerability examples
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, category, owasp_category, title, description, severity, created_at
      FROM examples
      ORDER BY
        CASE category
          WHEN 'owasp' THEN 1
          WHEN 'ai-security' THEN 2
          ELSE 3
        END,
        owasp_category
    `);

    res.json({
      success: true,
      count: result.rows.length,
      examples: result.rows
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/examples/stats
 * Get statistics about vulnerabilities
 * MUST be before /:id route to prevent "stats" from being treated as an ID
 */
router.get('/stats', async (req, res, next) => {
  try {
    // SQLite-compatible stats queries (using SUM and CASE instead of FILTER)
    const stats = await db.query(`
      SELECT
        COUNT(*) as total_examples,
        SUM(CASE WHEN category = 'owasp' THEN 1 ELSE 0 END) as owasp_count,
        SUM(CASE WHEN category = 'ai-security' THEN 1 ELSE 0 END) as ai_security_count,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_count,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium_count,
        SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low_count
      FROM examples
    `);

    const testCaseStats = await db.query(`
      SELECT
        COUNT(*) as total_test_cases,
        SUM(CASE WHEN test_type = 'vulnerable' THEN 1 ELSE 0 END) as vulnerable_tests,
        SUM(CASE WHEN test_type = 'secure' THEN 1 ELSE 0 END) as secure_tests
      FROM test_cases
    `);

    res.json({
      success: true,
      stats: {
        ...stats.rows[0],
        ...testCaseStats.rows[0]
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/examples/category/:category
 * Get examples by category
 * MUST be before /:id route to prevent "category" from being treated as an ID
 */
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;

    const result = await db.query(
      `SELECT id, category, owasp_category, title, description, severity
       FROM examples
       WHERE category = $1
       ORDER BY owasp_category`,
      [category]
    );

    res.json({
      success: true,
      category,
      count: result.rows.length,
      examples: result.rows
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/examples/:id
 * Get specific example by ID or OWASP category code (e.g., 'a01', 'ai01')
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if ID is numeric or a category code
    let example;
    if (/^\d+$/.test(id)) {
      // Numeric ID
      example = await db.query(
        'SELECT * FROM examples WHERE id = $1',
        [id]
      );
    } else {
      // Category code (e.g., 'a01', 'ai01')
      const categoryCode = id.toUpperCase();
      example = await db.query(
        'SELECT * FROM examples WHERE UPPER(owasp_category) = $1',
        [categoryCode]
      );
    }

    if (example.rows.length === 0) {
      return res.status(404).json({
        error: 'Example not found'
      });
    }

    const exampleId = example.rows[0].id;

    // Get test cases
    const testCases = await db.query(
      'SELECT * FROM test_cases WHERE example_id = $1 ORDER BY test_type, id',
      [exampleId]
    );

    // Get remediation steps
    const remediation = await db.query(
      'SELECT * FROM remediation_steps WHERE example_id = $1 ORDER BY step_number',
      [exampleId]
    );

    res.json({
      success: true,
      example: example.rows[0],
      testCases: testCases.rows,
      remediation: remediation.rows
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
