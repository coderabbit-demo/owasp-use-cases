/**
 * AI02 - Improper Output Handling (Vulnerable Implementation)
 * Demonstrates how unsanitized AI output can lead to XSS and injection attacks
 */

const express = require('express');
const router = express.Router();
const aiService = require('../../services/aiService');
const db = require('../../db/connection');

/**
 * POST /api/vulnerable/ai02/generate-content
 * VULNERABLE: Renders AI output as raw HTML without sanitization
 */
router.post('/generate-content', async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    // Generate content from AI
    const result = await aiService.vulnerableGenerate(prompt);

    // VULNERABLE: Returning raw output without sanitization
    // This output will be rendered as HTML in the frontend, allowing XSS!

    // Log the output
    const conversation = await db.query(
      `INSERT INTO ai_conversations
       (user_input, ai_response, is_vulnerable, model_used)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [prompt, result.output, true, result.provider]
    );

    await db.query(
      `INSERT INTO ai_outputs
       (conversation_id, raw_output, contains_html, contains_code)
       VALUES ($1, $2, $3, $4)`,
      [
        conversation.rows[0].id,
        result.output,
        /<[^>]+>/i.test(result.output),
        /<script|<style/i.test(result.output)
      ]
    );

    res.json({
      success: true,
      output: result.output, // RAW OUTPUT - DANGEROUS!
      mode: result.mode,
      provider: result.provider,
      vulnerability: 'This output is not sanitized and may contain XSS or injection attacks',
      warning: '⚠️ DO NOT render this directly in your browser without escaping!'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vulnerable/ai02/code-generator
 * VULNERABLE: Generates code that might contain malicious payloads
 */
router.post('/code-generator', async (req, res, next) => {
  try {
    const { language, description } = req.body;

    if (!description) {
      return res.status(400).json({
        error: 'Description is required'
      });
    }

    const prompt = `Generate ${language || 'JavaScript'} code for: ${description}`;
    const result = await aiService.vulnerableGenerate(prompt);

    // VULNERABLE: No validation of generated code
    // Could contain SQL injection, command injection, etc.

    res.json({
      success: true,
      code: result.output,
      language: language || 'javascript',
      warning: '⚠️ Generated code not validated - may contain vulnerabilities!'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vulnerable/ai02/document-processor
 * VULNERABLE: Processes and renders AI-generated documents without sanitization
 */
router.post('/document-processor', async (req, res, next) => {
  try {
    const { documentType, content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Content is required'
      });
    }

    const prompt = `Convert the following to ${documentType || 'HTML'}: ${content}`;
    const result = await aiService.vulnerableGenerate(prompt);

    // VULNERABLE: Direct rendering without Content Security Policy
    res.json({
      success: true,
      document: result.output,
      documentType: documentType || 'html',
      vulnerability: 'Document rendered without CSP headers or sanitization'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vulnerable/ai02/markdown-renderer
 * VULNERABLE: Renders markdown that might contain malicious links or scripts
 */
router.post('/markdown-renderer', async (req, res, next) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({
        error: 'Topic is required'
      });
    }

    const prompt = `Create a markdown document about: ${topic}`;
    const result = await aiService.vulnerableGenerate(prompt);

    // VULNERABLE: Markdown might contain javascript: links or HTML injection
    res.json({
      success: true,
      markdown: result.output,
      warning: 'Markdown may contain malicious links (javascript:, data:) or embedded HTML'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/vulnerable/ai02/examples
 * Returns example attack payloads that demonstrate the vulnerability
 */
router.get('/examples', (req, res) => {
  res.json({
    examples: [
      {
        name: 'Basic XSS via HTML generation',
        prompt: 'Generate an HTML greeting card',
        expectedOutput: 'HTML with embedded <script> tags that execute JavaScript',
        impact: 'Cookie theft, session hijacking, defacement'
      },
      {
        name: 'XSS via event handlers',
        prompt: 'Create a user profile card in HTML',
        expectedOutput: 'HTML with onerror or onload event handlers',
        impact: 'Automatic script execution when element loads'
      },
      {
        name: 'SQL Injection in generated code',
        prompt: 'Generate SQL query to fetch user by ID',
        expectedOutput: 'SQL with potential injection payloads in comments',
        impact: 'Database compromise if code is copied without review'
      },
      {
        name: 'Markdown injection',
        prompt: 'Create a markdown link to example.com',
        expectedOutput: 'Markdown with javascript: or data: protocol',
        impact: 'XSS when markdown is rendered to HTML'
      },
      {
        name: 'Command injection',
        prompt: 'Write a bash script to backup a file',
        expectedOutput: 'Script with potential command injection vectors',
        impact: 'Remote code execution if script is run without review'
      }
    ]
  });
});

module.exports = router;
