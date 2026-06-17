/**
 * A03: Injection - VULNERABLE Implementation
 * Demonstrates SQL Injection vulnerabilities
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

/**
 * VULNERABLE: SQL Injection in login
 * User input directly concatenated into SQL query
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // VULNERABILITY: Direct string concatenation - SQL Injection!
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    const result = await db.query(query);

    if (result.rows.length > 0) {
      res.json({
        success: true,
        message: 'Login successful',
        user: result.rows[0],
        vulnerability: 'SQL Injection via string concatenation',
        attack_examples: [
          "username: admin' OR '1'='1",
          "password: anything",
          "Result: Bypasses authentication"
        ]
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }

  } catch (error) {
    res.status(500).json({
      error: error.message,
      vulnerability: 'Error messages can reveal database structure'
    });
  }
});

/**
 * VULNERABLE: SQL Injection in search
 * User input used directly in LIKE query
 */
router.get('/search', async (req, res, next) => {
  try {
    const { query } = req.query;

    // VULNERABILITY: User input in SQL without sanitization
    const sql = `SELECT * FROM products WHERE name LIKE '%${query}%' OR description LIKE '%${query}%'`;

    const result = await db.query(sql);

    res.json({
      success: true,
      results: result.rows,
      vulnerability: 'SQL Injection in search query',
      attack_examples: [
        "query: %' UNION SELECT * FROM users--",
        "query: %'; DROP TABLE products;--",
        "Result: Can extract data from any table or delete tables"
      ]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      hint: 'Error reveals database structure and syntax'
    });
  }
});

/**
 * VULNERABLE: Second-order SQL Injection
 * Stored data used in query without sanitization
 */
router.get('/user-products/:username', async (req, res, next) => {
  try {
    const { username } = req.params;

    // First query - might seem safe
    const userResult = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // VULNERABILITY: Using stored username in query without sanitization
    // If username contains SQL, it executes here
    const productQuery = `SELECT * FROM products WHERE user_id = ${userId}`;
    const products = await db.query(productQuery);

    res.json({
      success: true,
      products: products.rows,
      vulnerability: 'Trusts database data without validation',
      attack: 'If username was stored as "1 OR 1=1", it affects this query'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * VULNERABLE: Dynamic ORDER BY injection
 * Allows attacker to control query structure
 */
router.get('/products', async (req, res, next) => {
  try {
    const { sortBy = 'name', order = 'ASC' } = req.query;

    // VULNERABILITY: User controls ORDER BY clause
    const query = `SELECT * FROM products ORDER BY ${sortBy} ${order}`;

    const result = await db.query(query);

    res.json({
      success: true,
      products: result.rows,
      vulnerability: 'SQL Injection via ORDER BY clause',
      attack_examples: [
        "sortBy: (CASE WHEN (SELECT password FROM users WHERE id=1) LIKE 'a%' THEN name ELSE price END)",
        "Result: Boolean-based blind SQL injection to extract data character by character"
      ]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * VULNERABLE: UNION-based SQL Injection
 * Allows extraction of data from other tables
 */
router.get('/product/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // VULNERABILITY: Numeric parameter without validation
    const query = `SELECT id, name, description, price FROM products WHERE id = ${id}`;

    const result = await db.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product: result.rows[0],
      vulnerability: 'UNION-based SQL Injection',
      attack_examples: [
        "id: 1 UNION SELECT id, username, email, password FROM users--",
        "Result: Returns user data alongside product data",
        "Attacker can extract entire database"
      ]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      vulnerability: 'Detailed error messages help attacker refine injection'
    });
  }
});

/**
 * VULNERABLE: Blind SQL Injection (Time-based)
 * No direct output but can extract data via timing
 */
router.get('/check-username', async (req, res, next) => {
  try {
    const { username } = req.query;

    // VULNERABILITY: Can use time delays to extract data
    const query = `SELECT COUNT(*) as count FROM users WHERE username = '${username}'`;

    const start = Date.now();
    const result = await db.query(query);
    const duration = Date.now() - start;

    res.json({
      exists: result.rows[0].count > 0,
      response_time: duration,
      vulnerability: 'Time-based blind SQL Injection',
      attack_examples: [
        "username: admin' AND (SELECT CASE WHEN (1=1) THEN 1 ELSE (SELECT 1 UNION SELECT 2) END)--",
        "Use timing differences to extract data bit by bit",
        "SQLMap and other tools automate this attack"
      ]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * VULNERABLE: NoSQL Injection simulation
 * Shows concept even though we're using SQL
 */
router.post('/nosql-login', (req, res) => {
  const { username, password } = req.body;

  // Simulating NoSQL query object
  const query = {
    username: username,
    password: password
  };

  res.json({
    success: true,
    vulnerability: 'NoSQL Injection (concept)',
    attack_examples: [
      'username: {"$ne": null}',
      'password: {"$ne": null}',
      'Result: Matches all users where username is not null',
      'Also: {"$gt": ""} matches all non-empty values'
    ],
    real_world: 'MongoDB, CouchDB, and other NoSQL databases vulnerable',
    query_attempted: query
  });
});

/**
 * VULNERABLE: SQL Injection in batch operations
 * Multiple statements can be stacked
 */
router.post('/update-price', async (req, res, next) => {
  try {
    const { productId, newPrice } = req.body;

    // VULNERABILITY: Allows stacked queries
    const query = `UPDATE products SET price = ${newPrice} WHERE id = ${productId}`;

    await db.query(query);

    res.json({
      success: true,
      message: 'Price updated',
      vulnerability: 'Stacked query SQL Injection',
      attack_examples: [
        "newPrice: 0; DROP TABLE products;--",
        "newPrice: 0; INSERT INTO users (username, password, role) VALUES ('hacker', 'pass', 'admin');--",
        "Result: Can execute multiple malicious statements"
      ]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
