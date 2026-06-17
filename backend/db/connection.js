const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Database file path
const dbPath = path.join(__dirname, '..', '..', 'data', 'owasp_education.db');
const dataDir = path.join(__dirname, '..', '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    // Load existing database
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('✓ Loaded existing SQLite database:', dbPath);
  } else {
    // Create new database
    db = new SQL.Database();
    console.log('✓ Created new SQLite database');
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  return db;
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

/**
 * Helper function to execute queries (PostgreSQL-compatible interface)
 */
const query = (text, params = []) => {
  const start = Date.now();

  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Convert PostgreSQL parameterized queries ($1, $2) to SQLite (?, ?)
    const sqliteQuery = text.replace(/\$(\d+)/g, '?');

    // Determine if it's a SELECT or INSERT/UPDATE/DELETE
    const isSelect = /^\s*SELECT/i.test(sqliteQuery);
    const isInsert = /RETURNING/i.test(sqliteQuery);

    if (isInsert) {
      // Handle INSERT ... RETURNING
      const mainQuery = sqliteQuery.replace(/RETURNING.*/i, '').trim();
      db.run(mainQuery, params);

      // Get the inserted row
      const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
      const tableName = extractTableName(mainQuery);
      const result = db.exec(`SELECT * FROM ${tableName} WHERE id = ?`, [lastId]);

      saveDatabase();

      const duration = Date.now() - start;
      console.log('Executed query', { text: sqliteQuery.substring(0, 50), duration, rows: 1 });

      if (result.length > 0 && result[0].values.length > 0) {
        const row = {};
        result[0].columns.forEach((col, idx) => {
          row[col] = result[0].values[0][idx];
        });

        return {
          rows: [row],
          rowCount: 1
        };
      }

      return {
        rows: [],
        rowCount: 0
      };
    } else if (isSelect) {
      // SELECT query
      const result = db.exec(sqliteQuery, params);

      const duration = Date.now() - start;

      if (result.length === 0) {
        console.log('Executed query', { text: sqliteQuery.substring(0, 50), duration, rows: 0 });
        return {
          rows: [],
          rowCount: 0
        };
      }

      const rows = result[0].values.map(row => {
        const obj = {};
        result[0].columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });

      console.log('Executed query', { text: sqliteQuery.substring(0, 50), duration, rows: rows.length });

      return {
        rows: rows,
        rowCount: rows.length
      };
    } else {
      // INSERT/UPDATE/DELETE without RETURNING
      db.run(sqliteQuery, params);
      saveDatabase();

      const changes = db.getRowsModified();
      const duration = Date.now() - start;
      console.log('Executed query', { text: sqliteQuery.substring(0, 50), duration, rows: changes });

      return {
        rows: [],
        rowCount: changes
      };
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Extract table name from INSERT query
 */
function extractTableName(query) {
  const match = query.match(/INSERT\s+INTO\s+(\w+)/i);
  return match ? match[1] : null;
}

/**
 * Execute multiple statements (for schema creation)
 */
const exec = (sql) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  db.exec(sql);
  saveDatabase();
};

/**
 * Close database connection
 */
const close = () => {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('✓ Database connection closed');
  }
};

// Getter for database instance
function getDb() {
  return db;
}

module.exports = {
  initDatabase,
  query,
  exec,
  close,
  getDb,
  saveDatabase,
  // PostgreSQL compatibility
  pool: {
    query,
    end: close
  }
};
