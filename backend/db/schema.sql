-- OWASP Security Education Database Schema (SQLite)

-- Drop existing tables if they exist
DROP TABLE IF EXISTS ai_outputs;
DROP TABLE IF EXISTS ai_conversations;
DROP TABLE IF EXISTS remediation_steps;
DROP TABLE IF EXISTS test_cases;
DROP TABLE IF EXISTS examples;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- Examples table - stores all vulnerability examples
CREATE TABLE examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category VARCHAR(50) NOT NULL,
  owasp_category VARCHAR(50),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  real_world_attack TEXT,
  vulnerable_code TEXT,
  secure_code TEXT,
  severity VARCHAR(20) DEFAULT 'high',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test cases for each example
CREATE TABLE test_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  example_id INTEGER,
  test_type VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  endpoint VARCHAR(200),
  method VARCHAR(10),
  payload TEXT,
  expected_result TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (example_id) REFERENCES examples(id) ON DELETE CASCADE
);

-- Remediation steps for each vulnerability
CREATE TABLE remediation_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  example_id INTEGER,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  code_example TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (example_id) REFERENCES examples(id) ON DELETE CASCADE
);

-- Users table for demonstration purposes
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  api_key VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table for demonstration
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  user_id INTEGER,
  is_public BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions table for authentication demos
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  token VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_valid BOOLEAN DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI conversations for prompt injection demos
CREATE TABLE ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_input TEXT NOT NULL,
  system_prompt TEXT,
  ai_response TEXT,
  is_vulnerable BOOLEAN DEFAULT 1,
  is_malicious BOOLEAN DEFAULT 0,
  injection_detected BOOLEAN DEFAULT 0,
  sanitized_input TEXT,
  model_used VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI outputs for improper output handling demos
CREATE TABLE ai_outputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER,
  raw_output TEXT NOT NULL,
  sanitized_output TEXT,
  contains_code BOOLEAN DEFAULT 0,
  contains_html BOOLEAN DEFAULT 0,
  xss_detected BOOLEAN DEFAULT 0,
  injection_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_examples_category ON examples(category);
CREATE INDEX idx_examples_owasp_category ON examples(owasp_category);
CREATE INDEX idx_test_cases_example_id ON test_cases(example_id);
CREATE INDEX idx_remediation_example_id ON remediation_steps(example_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_ai_conversations_created ON ai_conversations(created_at);

-- Insert initial system data
INSERT INTO users (username, password, email, role) VALUES
('admin', 'admin123', 'admin@example.com', 'admin'),
('john_doe', 'password123', 'john@example.com', 'user'),
('jane_smith', 'qwerty', 'jane@example.com', 'user');

INSERT INTO products (name, description, price, user_id, is_public) VALUES
('Product 1', 'This is a public product', 29.99, 1, 1),
('Product 2', 'This is a private product', 49.99, 2, 0),
('Admin Product', 'Confidential admin product', 99.99, 1, 0);
