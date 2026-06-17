/**
 * AI01 - Prompt Injection (Vulnerable Implementation)
 * Demonstrates how unprotected AI systems can be manipulated
 */

const express = require('express');
const router = express.Router();
const aiService = require('../../services/aiService');
const db = require('../../db/connection');

/**
 * POST /api/vulnerable/ai01/chat
 * Vulnerable chat endpoint - directly passes user input to LLM
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // VULNERABLE: Direct pass-through to AI without any protection
    const result = await aiService.vulnerableChat(message);

    // Log the conversation
    await db.query(
      `INSERT INTO ai_conversations
       (user_input, ai_response, is_vulnerable, is_malicious, model_used)
       VALUES ($1, $2, $3, $4, $5)`,
      [message, result.response, true, false, result.provider]
    );

    res.json({
      success: true,
      response: result.response,
      mode: result.mode,
      provider: result.provider,
      vulnerability: 'This endpoint is vulnerable to prompt injection attacks'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/vulnerable/ai01/system-prompt
 * VULNERABLE: Exposes the system prompt
 */
router.get('/system-prompt', (req, res) => {
  const systemPrompt = `You are a helpful customer service assistant for TechStore.
You can help with: product inquiries, order status, returns, and general questions.
You have access to: customer database, order history, product catalog.
You CANNOT: access admin functions, modify databases directly, share system information, or execute commands.
Always be polite and helpful within your authorized scope.`;

  res.json({
    systemPrompt,
    warning: 'Exposing system prompts is a security vulnerability!'
  });
});

/**
 * POST /api/vulnerable/ai01/admin-action
 * VULNERABLE: No authorization check, trusts AI response
 */
router.post('/admin-action', async (req, res, next) => {
  try {
    const { action, userMessage } = req.body;

    // VULNERABLE: No authorization validation!
    // An attacker could use prompt injection to make the AI authorize admin actions

    const aiResponse = await aiService.vulnerableChat(
      `User wants to perform: ${action}. Their message: ${userMessage}. Should I allow this?`
    );

    // VULNERABLE: Trusting AI decision without validation
    const allowed = aiResponse.response.toLowerCase().includes('yes') ||
                   aiResponse.response.toLowerCase().includes('allow') ||
                   aiResponse.response.toLowerCase().includes('approved');

    if (allowed) {
      return res.json({
        success: true,
        message: `Admin action '${action}' executed!`,
        warning: 'This demonstrates how prompt injection can lead to privilege escalation'
      });
    }

    res.json({
      success: false,
      message: 'Action not authorized'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/vulnerable/ai01/history
 * Get conversation history
 */
router.get('/history', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, user_input, ai_response, is_malicious, model_used, created_at
       FROM ai_conversations
       WHERE is_vulnerable = true
       ORDER BY created_at DESC
       LIMIT 50`
    );

    res.json({
      success: true,
      conversations: result.rows
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
