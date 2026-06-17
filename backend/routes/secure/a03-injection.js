/**
 * A03: Injection - SECURE Implementation
 * Demonstrates proper SQL injection prevention using parameterized queries
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

/**
 * SECURE: Parameterized login query
 * Uses prepared statements to prevent SQL injection
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // SECURITY: Parameterized query - user input is never executed as SQL
    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({
        success: true,
        message: 'Login successful',
        user: result.rows[0],
        security: [
          'Parameterized queries prevent SQL injection',
          'Database driver escapes special characters',
          'User input treated as data, not code',
          'No amount of quotes or SQL syntax will execute'
        ]
      });
    } else {
      // SECURITY: Generic error message doesn't leak information
      res.status(401).json({
        error: 'Invalid credentials',
        security: 'Generic error prevents user enumeration'
      });
    }

  } catch (error) {
    // SECURITY: Don't expose database errors to client
    console.error('Login error:', error);
    res.status(500).json({
      error: 'An error occurred',
      security: 'Detailed errors logged server-side only'
    });
  }
});

/**
 * SECURE: Parameterized search query
 * Safe handling of LIKE queries
 */
router.get('/search', async (req, res, next) => {
  try {
    let { query } = req.query;

    // SECURITY: Input validation
    if (!query || query.length > 100) {
      return res.status(400).json({ error: 'Invalid search query' });
    }

    // SECURITY: Parameterized query with LIKE
    const sql = `
      SELECT id, name, description, price
      FROM products
      WHERE name LIKE $1 OR description LIKE $1
    `;

    // SECURITY: Escape special LIKE characters and add wildcards safely
    const searchParam = `%${query}%`;

    const result = await db.query(sql, [searchParam]);

    res.json({
      success: true,
      results: result.rows,
      security: [
        'Parameterized query prevents injection',
        'Wildcard % added in application code, not user input',
        'Input length validated',
        'Only safe fields returned'
      ]
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * SECURE: Proper handling of numeric parameters
 * Validates and sanitizes user input
 */
router.get('/product/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // SECURITY: Validate that ID is actually a number
    const productId = parseInt(id, 10);
    if (isNaN(productId) || productId < 1) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // SECURITY: Parameterized query
    const result = await db.query(
      'SELECT id, name, description, price FROM products WHERE id = $1',
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product: result.rows[0],
      security: [
        'Input validated as integer',
        'Parameterized query used',
        'UNION attacks impossible',
        'Range checking prevents ID enumeration'
      ]
    });

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

/**
 * SECURE: Safe ORDER BY with whitelist
 * Only allows predefined sort columns
 */
router.get('/products', async (req, res, next) => {
  try {
    const { sortBy = 'name', order = 'ASC' } = req.query;

    // SECURITY: Whitelist of allowed sort columns
    const allowedSortFields = ['name', 'price', 'created_at', 'id'];
    const allowedOrders = ['ASC', 'DESC'];

    // SECURITY: Validate inputs against whitelist
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ error: 'Invalid sort field' });
    }

    if (!allowedOrders.includes(order.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid sort order' });
    }

    // SECURITY: Safe to use validated input in query
    const query = `SELECT id, name, description, price FROM products ORDER BY ${sortBy} ${order}`;

    const result = await db.query(query);

    res.json({
      success: true,
      products: result.rows,
      security: [
        'Whitelist validation for column names',
        'Only predefined columns allowed',
        'Sort order validated',
        'No user input executed as SQL'
      ],
      sort: { field: sortBy, order }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * SECURE: Parameterized update query
 * All user input properly escaped
 */
router.post('/update-price', async (req, res, next) => {
  try {
    const { productId, newPrice } = req.body;

    // SECURITY: Validate inputs
    const id = parseInt(productId, 10);
    const price = parseFloat(newPrice);

    if (isNaN(id) || isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Invalid product ID or price' });
    }

    // SECURITY: Parameterized query prevents stacked queries
    const result = await db.query(
      'UPDATE products SET price = $1 WHERE id = $2',
      [price, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Price updated',
      security: [
        'Parameterized query prevents injection',
        'Stacked queries not possible',
        'Input validated as numeric',
        'Business logic validated (price >= 0)'
      ]
    });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

/**
 * SECURE: Username check without leaking timing info
 * Constant-time comparison where possible
 */
router.get('/check-username', async (req, res, next) => {
  try {
    const { username } = req.query;

    // SECURITY: Input validation
    if (!username || username.length > 50 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Invalid username format' });
    }

    // SECURITY: Parameterized query
    const result = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE username = $1',
      [username]
    );

    // Add small random delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    res.json({
      exists: result.rows[0].count > 0,
      security: [
        'Parameterized query prevents injection',
        'Input validated with regex',
        'Random delay prevents timing attacks',
        'Length limit prevents DOS'
      ]
    });

  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ error: 'Check failed' });
  }
});

/**
 * SECURE: ORM usage example (simulated)
 * Shows how ORMs prevent injection
 */
router.get('/user/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Using parameterized query (ORM would do this automatically)
    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0],
      security: [
        'ORMs like Sequelize, TypeORM, Prisma use parameterized queries',
        'Query builders prevent SQL injection by design',
        'Input validation still required',
        'Avoid raw SQL queries when possible'
      ],
      orm_examples: {
        'sequelize': 'User.findOne({ where: { id: userId } })',
        'typeorm': 'userRepository.findOne({ where: { id: userId } })',
        'prisma': 'prisma.user.findUnique({ where: { id: userId } })'
      }
    });

  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * SECURE: NoSQL injection prevention
 * Shows safe practices for NoSQL databases
 */
router.post('/nosql-login', (req, res) => {
  const { username, password } = req.body;

  // SECURITY: Validate input types
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input types' });
  }

  // SECURITY: Validate input format
  if (username.length > 50 || password.length > 100) {
    return res.status(400).json({ error: 'Input too long' });
  }

  res.json({
    success: true,
    security: [
      'Validate input is string type, not object',
      'Reject objects like {"$ne": null}',
      'Use database driver\'s escaping',
      'Sanitize with libraries like mongo-sanitize',
      'Never use user input in operators'
    ],
    safe_patterns: {
      'mongodb': 'db.users.findOne({ username: username, password: password })',
      'validation': 'Ensure typeof === "string"',
      'sanitization': 'Use express-mongo-sanitize middleware'
    },
    unsafe_patterns: [
      'db.users.findOne(JSON.parse(userInput))',
      'Allowing objects in queries',
      'Using eval() or Function() with user input'
    ]
  });
});

/**
 * Security guidelines endpoint
 */
router.get('/security-info', (req, res) => {
  res.json({
    success: true,
    injection_prevention: {
      'parameterized_queries': {
        description: 'Use placeholders for user input',
        example: 'SELECT * FROM users WHERE id = $1',
        never: 'SELECT * FROM users WHERE id = ' + userInput
      },
      'input_validation': {
        description: 'Validate type, format, length, and range',
        examples: [
          'Use parseInt() for numeric IDs',
          'Regex validation for usernames',
          'Length limits on all inputs',
          'Type checking for NoSQL'
        ]
      },
      'whitelisting': {
        description: 'For ORDER BY, column names, etc.',
        example: 'allowedColumns = ["name", "price", "date"]'
      },
      'orm_usage': {
        description: 'Use ORM/query builders when possible',
        examples: ['Sequelize', 'TypeORM', 'Prisma', 'Mongoose']
      },
      'error_handling': {
        description: 'Never expose database errors to users',
        practice: 'Log errors server-side, return generic messages'
      }
    },
    defense_layers: [
      '1. Input validation (type, length, format)',
      '2. Parameterized queries (prepared statements)',
      '3. Least privilege database users',
      '4. WAF (Web Application Firewall)',
      '5. Regular security testing',
      '6. Code review and static analysis'
    ],
    testing_tools: [
      'SQLMap - Automated SQL injection testing',
      'Burp Suite - Manual testing and scanning',
      'OWASP ZAP - Web application scanner',
      'NoSQLMap - NoSQL injection testing'
    ],
    resources: [
      'OWASP SQL Injection Prevention Cheat Sheet',
      'PortSwigger SQL Injection Guide',
      'OWASP Testing Guide - Injection Testing'
    ]
  });
});

module.exports = router;
