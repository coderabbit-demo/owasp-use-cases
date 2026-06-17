/**
 * AI01 - Prompt Injection (Secure Implementation)
 * Demonstrates proper protection against prompt injection attacks
 */

const express = require('express');
const router = express.Router();
const aiService = require('../../services/aiService');
const db = require('../../db/connection');

/**
 * POST /api/secure/ai01/chat
 * Secure chat endpoint - validates and sanitizes input
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // Input validation
    if (message.length > 500) {
      return res.status(400).json({
        error: 'Message too long (max 500 characters)'
      });
    }

    // SECURE: Uses sanitization and delimiters
    const result = await aiService.secureChat(message);

    // Detect if injection was attempted
    const injectionDetected = !result.success && result.injectionType;

    // Log the conversation
    await db.query(
      `INSERT INTO ai_conversations
       (user_input, ai_response, is_vulnerable, injection_detected, sanitized_input, model_used)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        message,
        result.message || 'Blocked',
        false,
        injectionDetected,
        result.sanitized ? message : null,
        result.provider
      ]
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        injectionDetected: true,
        injectionType: result.injectionType
      });
    }

    res.json({
      success: true,
      response: result.message,
      mode: result.mode,
      provider: result.provider,
      sanitized: result.sanitized,
      security: 'Input validated and sanitized, delimiters used to isolate user content'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/secure/ai01/validate-prompt
 * Validates user input for injection attempts
 */
router.post('/validate-prompt', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      error: 'Message is required'
    });
  }

  // Check for injection patterns
  const injectionPatterns = [
    { pattern: /ignore\s+previous\s+instructions/i, type: 'prompt_override', severity: 'high' },
    { pattern: /disregard\s+(?:previous|above)/i, type: 'prompt_override', severity: 'high' },
    { pattern: /repeat\s+(?:all|everything)\s+above/i, type: 'prompt_extraction', severity: 'medium' },
    { pattern: /(?:admin|developer|sudo)\s+mode/i, type: 'privilege_escalation', severity: 'critical' },
    { pattern: /you\s+are\s+now/i, type: 'role_manipulation', severity: 'high' },
    { pattern: /system\s+prompt/i, type: 'prompt_extraction', severity: 'medium' },
  ];

  const detectedThreats = [];

  for (const { pattern, type, severity } of injectionPatterns) {
    if (pattern.test(message)) {
      detectedThreats.push({ type, severity, pattern: pattern.source });
    }
  }

  res.json({
    safe: detectedThreats.length === 0,
    threats: detectedThreats,
    message: detectedThreats.length > 0
      ? 'Potential prompt injection detected'
      : 'Input appears safe'
  });
});

/**
 * POST /api/secure/ai01/admin-action
 * SECURE: Proper authorization with explicit checks
 */
router.post('/admin-action', async (req, res, next) => {
  try {
    const { action, authToken } = req.body;

    // SECURE: Explicit authorization check (not relying on AI)
    const isAdmin = await validateAdminToken(authToken);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin privileges required',
        security: 'Proper authorization validation prevents prompt injection bypass'
      });
    }

    // Proceed with admin action
    res.json({
      success: true,
      message: `Admin action '${action}' executed successfully`,
      security: 'Authorization checked via token, not AI decision'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/secure/ai01/security-info
 * Returns information about security measures
 */
router.get('/security-info', (req, res) => {
  res.json({
    securityMeasures: [
      'Input length validation (max 500 chars)',
      'Prompt injection pattern detection',
      'Input sanitization',
      'XML/delimiter-based prompt isolation',
      'System prompt protection',
      'Explicit authorization checks (not AI-based)',
      'Conversation logging with threat detection',
      'Rate limiting (to be implemented)',
    ],
    protectedAgainst: [
      'Direct prompt override attempts',
      'System prompt extraction',
      'Role manipulation',
      'Privilege escalation via prompts',
      'Indirect prompt injection',
      'Command injection through prompts',
    ],
    bestPractices: [
      'Never concatenate user input directly with system prompts',
      'Use clear delimiters (XML tags, special tokens) to isolate user content',
      'Implement input validation and sanitization',
      'Add pattern-based detection for known attack vectors',
      'Never rely on AI for authorization decisions',
      'Log all interactions for security monitoring',
      'Implement rate limiting to prevent abuse',
      'Regularly update injection detection patterns',
    ]
  });
});

/**
 * Helper function to validate admin token
 */
async function validateAdminToken(token) {
  // In a real application, this would check against a database or JWT
  // For demo purposes, we use a simple check
  return token === process.env.ADMIN_TOKEN || token === 'demo-admin-token';
}

module.exports = router;
