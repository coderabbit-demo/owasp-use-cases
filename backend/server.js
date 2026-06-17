/**
 * OWASP Security Education Application
 * Main Express Server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const db = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// Middleware Configuration
// ======================

// CORS - Allow all origins for educational purposes
app.use(cors());

// Helmet - Security headers (with CSP disabled for demos)
app.use(helmet({
  contentSecurityPolicy: false // Disabled to allow inline scripts in demos
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ======================
// API Routes
// ======================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// AI Service info
const aiService = require('./services/aiService');
app.get('/api/ai/info', (req, res) => {
  res.json(aiService.getInfo());
});

// Import route modules
// OWASP Top 10 routes
app.use('/api/vulnerable/a01', require('./routes/vulnerable/a01-access-control'));
app.use('/api/secure/a01', require('./routes/secure/a01-access-control'));
app.use('/api/vulnerable/a02', require('./routes/vulnerable/a02-crypto-failures'));
app.use('/api/secure/a02', require('./routes/secure/a02-crypto-failures'));
app.use('/api/vulnerable/a03', require('./routes/vulnerable/a03-injection'));
app.use('/api/secure/a03', require('./routes/secure/a03-injection'));
app.use('/api/vulnerable/a04', require('./routes/vulnerable/a04-insecure-design'));
app.use('/api/secure/a04', require('./routes/secure/a04-insecure-design'));
app.use('/api/vulnerable/a05', require('./routes/vulnerable/a05-security-misconfiguration'));
app.use('/api/secure/a05', require('./routes/secure/a05-security-misconfiguration'));
app.use('/api/vulnerable/a06', require('./routes/vulnerable/a06-vulnerable-components'));
app.use('/api/secure/a06', require('./routes/secure/a06-vulnerable-components'));
app.use('/api/vulnerable/a07', require('./routes/vulnerable/a07-auth-failures'));
app.use('/api/secure/a07', require('./routes/secure/a07-auth-failures'));
app.use('/api/vulnerable/a08', require('./routes/vulnerable/a08-data-integrity'));
app.use('/api/secure/a08', require('./routes/secure/a08-data-integrity'));
app.use('/api/vulnerable/a09', require('./routes/vulnerable/a09-logging-failures'));
app.use('/api/secure/a09', require('./routes/secure/a09-logging-failures'));
app.use('/api/vulnerable/a10', require('./routes/vulnerable/a10-ssrf'));
app.use('/api/secure/a10', require('./routes/secure/a10-ssrf'));

// AI Security routes
app.use('/api/vulnerable/ai01', require('./routes/vulnerable/ai01-prompt-injection'));
app.use('/api/secure/ai01', require('./routes/secure/ai01-prompt-injection'));
app.use('/api/vulnerable/ai02', require('./routes/vulnerable/ai02-output-handling'));
app.use('/api/secure/ai02', require('./routes/secure/ai02-output-handling'));

// Examples API
app.use('/api/examples', require('./routes/examples'));

// ======================
// Frontend Routes
// ======================

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve other frontend pages
app.get('/vulnerability/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/vulnerability.html'));
});

app.get('/compare/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/compare.html'));
});

// ======================
// Error Handling
// ======================

app.use(notFoundHandler);
app.use(errorHandler);

// ======================
// Server Startup
// ======================

async function startServer() {
  try {
    // Initialize database connection
    await db.initDatabase();
    console.log('✓ Database connection successful');

    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log('🚀 OWASP Security Education Server');
      console.log('='.repeat(50));
      console.log(`📍 Server running at: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🤖 AI Mode: ${aiService.getInfo().mode}`);
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  db.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
