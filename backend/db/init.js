const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function initializeDatabaseSchema() {
  console.log('🚀 Initializing SQLite database...');

  try {
    // Initialize database connection
    await db.initDatabase();

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    db.exec(schema);

    console.log('✓ Database initialized successfully!');
    console.log('✓ Tables created and seeded with initial data');
    console.log('✓ Database location:', path.join(__dirname, '..', '..', 'data', 'owasp_education.db'));

  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Run if executed directly
if (require.main === module) {
  initializeDatabaseSchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = initializeDatabaseSchema;
