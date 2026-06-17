/**
 * AI02 - Improper Output Handling (Secure Implementation)
 * Demonstrates proper sanitization and handling of AI-generated content
 */

const express = require('express');
const router = express.Router();
const aiService = require('../../services/aiService');
const db = require('../../db/connection');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Initialize DOMPurify for server-side sanitization
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * POST /api/secure/ai02/generate-content
 * SECURE: Sanitizes AI output before returning
 */
router.post('/generate-content', async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    // Input validation
    if (prompt.length > 1000) {
      return res.status(400).json({
        error: 'Prompt too long (max 1000 characters)'
      });
    }

    // Generate content with sanitization
    const result = await aiService.secureGenerate(prompt);

    // Additional sanitization with DOMPurify
    const doubleSanitized = DOMPurify.sanitize(result.sanitized, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    });

    // Log the output with threat detection
    const conversation = await db.query(
      `INSERT INTO ai_conversations
       (user_input, ai_response, is_vulnerable, model_used)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [prompt, doubleSanitized, false, result.provider]
    );

    await db.query(
      `INSERT INTO ai_outputs
       (conversation_id, raw_output, sanitized_output, xss_detected, contains_html, contains_code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        conversation.rows[0].id,
        result.raw,
        doubleSanitized,
        result.xssDetected,
        result.threats.htmlInjection,
        result.threats.sqlInjection || result.threats.commandInjection
      ]
    );

    res.json({
      success: true,
      output: {
        raw: result.raw,
        sanitized: doubleSanitized,
        threats: result.threats
      },
      mode: result.mode,
      provider: result.provider,
      security: [
        'Output sanitized using multiple layers',
        'XSS patterns detected and removed',
        'Only safe HTML tags allowed',
        'All event handlers stripped',
        'JavaScript protocols removed'
      ]
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/secure/ai02/code-generator
 * SECURE: Validates generated code and provides warnings
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
    const result = await aiService.secureGenerate(prompt);

    // Analyze code for security issues
    const codeAnalysis = analyzeCode(result.raw, language);

    res.json({
      success: true,
      code: {
        raw: result.raw,
        sanitized: result.sanitized,
        warnings: codeAnalysis.warnings
      },
      language: language || 'javascript',
      security: [
        'Code analyzed for common vulnerabilities',
        'SQL injection patterns detected',
        'Command injection patterns flagged',
        'Eval and dangerous functions identified',
        'Manual review recommended before use'
      ],
      threats: result.threats,
      analysis: codeAnalysis
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/secure/ai02/document-processor
 * SECURE: Processes documents with CSP and sanitization
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
    const result = await aiService.secureGenerate(prompt);

    // Apply strict sanitization for HTML documents
    let sanitizedDocument = result.sanitized;

    if (documentType === 'html' || !documentType) {
      sanitizedDocument = DOMPurify.sanitize(result.raw, {
        ALLOWED_TAGS: ['p', 'br', 'div', 'span', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th'],
        ALLOWED_ATTR: ['class', 'id'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
      });
    }

    res.set({
      'Content-Security-Policy': "default-src 'self'; script-src 'none'; object-src 'none'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    });

    res.json({
      success: true,
      document: sanitizedDocument,
      documentType: documentType || 'html',
      security: [
        'Content-Security-Policy headers set',
        'Scripts blocked via CSP',
        'HTML sanitized with whitelist approach',
        'Dangerous tags removed',
        'Event handlers stripped'
      ],
      threats: result.threats
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/secure/ai02/markdown-renderer
 * SECURE: Sanitizes markdown and validates links
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
    const result = await aiService.secureGenerate(prompt);

    // Sanitize markdown (remove dangerous protocols)
    const sanitizedMarkdown = sanitizeMarkdown(result.raw);

    res.json({
      success: true,
      markdown: {
        raw: result.raw,
        sanitized: sanitizedMarkdown,
        html: DOMPurify.sanitize(markdownToHtml(sanitizedMarkdown))
      },
      security: [
        'Dangerous link protocols removed (javascript:, data:, vbscript:)',
        'Embedded HTML sanitized',
        'Image sources validated',
        'Safe subset of markdown rendered'
      ],
      threats: result.threats
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/secure/ai02/security-guidelines
 * Returns security best practices for handling AI output
 */
router.get('/security-guidelines', (req, res) => {
  res.json({
    guidelines: [
      {
        category: 'Output Sanitization',
        practices: [
          'Always sanitize AI-generated content before rendering',
          'Use established libraries like DOMPurify for HTML sanitization',
          'Apply context-aware escaping (HTML, JavaScript, SQL, etc.)',
          'Never use innerHTML or eval with AI-generated content',
          'Validate and sanitize on both client and server sides'
        ]
      },
      {
        category: 'Content Security Policy',
        practices: [
          'Implement strict CSP headers',
          'Disable inline scripts and styles',
          'Use nonces or hashes for required inline content',
          'Restrict allowed domains for resources',
          'Set script-src to \'none\' or \'self\' when possible'
        ]
      },
      {
        category: 'Code Generation',
        practices: [
          'Never automatically execute AI-generated code',
          'Implement code review workflows for AI-generated code',
          'Scan generated code for known vulnerability patterns',
          'Provide clear warnings about generated code risks',
          'Sandbox code execution environments',
          'Use static analysis tools on generated code'
        ]
      },
      {
        category: 'Link and Resource Validation',
        practices: [
          'Validate all URLs before rendering',
          'Block dangerous protocols (javascript:, data:, vbscript:)',
          'Implement allowlists for external domains',
          'Sanitize markdown before converting to HTML',
          'Validate image sources and file uploads'
        ]
      },
      {
        category: 'Error Handling',
        practices: [
          'Don\'t expose raw AI output in error messages',
          'Log security events for monitoring',
          'Implement rate limiting for AI endpoints',
          'Provide user-friendly error messages without details',
          'Monitor for abnormal patterns in AI responses'
        ]
      }
    ],
    tools: [
      'DOMPurify - HTML sanitization',
      'CSP headers - Browser security policy',
      'OWASP Java HTML Sanitizer',
      'Bleach (Python) - HTML sanitizer',
      'Content validation libraries per language'
    ]
  });
});

/**
 * Helper: Analyze code for security issues
 */
function analyzeCode(code, language) {
  const warnings = [];

  // Check for dangerous patterns
  if (/eval\(/i.test(code)) {
    warnings.push({ severity: 'high', message: 'Use of eval() detected - highly dangerous' });
  }

  if (/exec\(|system\(|shell_exec/i.test(code)) {
    warnings.push({ severity: 'critical', message: 'Command execution function detected' });
  }

  if (/DROP\s+TABLE|DELETE\s+FROM|TRUNCATE/i.test(code)) {
    warnings.push({ severity: 'high', message: 'Destructive SQL operations detected' });
  }

  if (/innerHTML|outerHTML|document\.write/i.test(code)) {
    warnings.push({ severity: 'medium', message: 'Potential XSS vector detected' });
  }

  if (/require\(|import\(|__import__/i.test(code)) {
    warnings.push({ severity: 'medium', message: 'Dynamic imports detected - validate sources' });
  }

  return {
    safe: warnings.length === 0,
    warnings,
    recommendation: warnings.length > 0
      ? 'Manual review required before using this code'
      : 'Code appears safe but should still be reviewed'
  };
}

/**
 * Helper: Sanitize markdown
 */
function sanitizeMarkdown(markdown) {
  return markdown
    // Remove javascript: protocol
    .replace(/\[([^\]]+)\]\(javascript:[^)]+\)/gi, '[$1](#blocked-javascript-protocol)')
    // Remove data: protocol
    .replace(/\[([^\]]+)\]\(data:[^)]+\)/gi, '[$1](#blocked-data-protocol)')
    // Remove vbscript: protocol
    .replace(/\[([^\]]+)\]\(vbscript:[^)]+\)/gi, '[$1](#blocked-vbscript-protocol)')
    // Sanitize image sources
    .replace(/!\[([^\]]*)\]\(javascript:[^)]+\)/gi, '![$1](#blocked-malicious-image)')
    .replace(/!\[([^\]]*)\]\(data:(?!image\/)[^)]+\)/gi, '![$1](#blocked-suspicious-data)');
}

/**
 * Helper: Simple markdown to HTML conversion (basic implementation)
 */
function markdownToHtml(markdown) {
  // Very basic conversion - in production use a proper markdown library
  return markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n/g, '<br>');
}

module.exports = router;
