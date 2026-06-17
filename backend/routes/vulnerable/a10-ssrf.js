/**
 * A10: Server-Side Request Forgery (SSRF) - VULNERABLE Implementation
 * Demonstrates unvalidated URL fetching and internal network access
 */

const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * VULNERABLE: Fetch URL without validation
 * Allows access to internal resources and cloud metadata
 */
router.post('/fetch-url', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    // VULNERABILITY: No URL validation
    // Allows requests to:
    // - Internal IP addresses (192.168.x.x, 10.x.x.x, 127.0.0.1)
    // - Cloud metadata endpoints (169.254.169.254)
    // - File:// protocol
    // - localhost services

    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        res.json({
          success: true,
          data: data,
          statusCode: response.statusCode,
          vulnerability: 'SSRF - Can access internal resources, cloud metadata, localhost'
        });
      });
    }).on('error', (error) => {
      res.json({
        success: false,
        error: error.message,
        vulnerability: 'SSRF vulnerability - attempted to access restricted resource'
      });
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Import from URL
 * Fetches and processes data from user-supplied URL
 */
router.post('/import-from-url', async (req, res, next) => {
  try {
    const { dataUrl } = req.body;

    if (!dataUrl) {
      return res.status(400).json({ error: 'Data URL required' });
    }

    // VULNERABILITY: No URL validation
    // Attacker can point to internal services
    // Example: http://localhost:3000/api/admin/users
    // Example: http://169.254.169.254/latest/meta-data/

    const protocol = dataUrl.startsWith('https') ? https : http;

    protocol.get(dataUrl, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        res.json({
          success: true,
          importedData: data,
          vulnerability: 'SSRF in data import - can read internal services'
        });
      });
    }).on('error', (error) => {
      res.json({
        success: false,
        error: error.message,
        vulnerability: 'SSRF vulnerability exposed'
      });
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Webhook callback without validation
 * Allows attacker to scan internal network
 */
router.post('/register-webhook', async (req, res, next) => {
  try {
    const { callbackUrl } = req.body;

    if (!callbackUrl) {
      return res.status(400).json({ error: 'Callback URL required' });
    }

    // VULNERABILITY: No validation of callback URL
    // Attacker can register internal endpoints
    // Server will make requests to internal network

    // Simulate webhook callback
    const protocol = callbackUrl.startsWith('https') ? https : http;

    const webhookData = JSON.stringify({
      event: 'test',
      timestamp: new Date().toISOString()
    });

    const urlObj = new URL(callbackUrl);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': webhookData.length
      }
    };

    const request = protocol.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        res.json({
          success: true,
          callbackUrl: callbackUrl,
          responseStatus: response.statusCode,
          responseData: data,
          vulnerability: 'SSRF via webhook - can probe internal network'
        });
      });
    });

    request.on('error', (error) => {
      res.json({
        success: false,
        error: error.message,
        vulnerability: 'SSRF in webhook registration'
      });
    });

    request.write(webhookData);
    request.end();

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: PDF generation from URL
 * Fetches HTML from user URL without validation
 */
router.post('/generate-pdf', async (req, res, next) => {
  try {
    const { htmlUrl } = req.body;

    if (!htmlUrl) {
      return res.status(400).json({ error: 'HTML URL required' });
    }

    // VULNERABILITY: No URL validation before fetching
    // Can access file:///etc/passwd
    // Can access http://localhost/admin
    // Can access cloud metadata

    res.json({
      success: true,
      message: 'PDF generation initiated',
      sourceUrl: htmlUrl,
      vulnerability: 'SSRF in PDF generation - can read local files and internal services'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Image proxy without validation
 * Proxies images from any URL
 */
router.get('/proxy-image', async (req, res, next) => {
  try {
    const imageUrl = req.query.url;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' });
    }

    // VULNERABILITY: No URL validation
    // Can be used to:
    // - Port scan internal network
    // - Access AWS/GCP/Azure metadata
    // - Bypass IP-based access controls

    const protocol = imageUrl.startsWith('https') ? https : http;

    protocol.get(imageUrl, (response) => {
      // Proxy the image
      res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');

      response.pipe(res);
    }).on('error', (error) => {
      res.status(500).json({
        error: error.message,
        vulnerability: 'SSRF in image proxy'
      });
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Check URL status (port scanner)
 * Reveals internal network structure
 */
router.post('/check-url-status', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    // VULNERABILITY: No URL validation
    // Can be used as port scanner
    // Example: http://192.168.1.1:22 (SSH)
    // Example: http://192.168.1.1:3306 (MySQL)

    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        url: url,
        status: response.statusCode,
        responseTime: responseTime,
        headers: response.headers,
        vulnerability: 'SSRF - can be used as internal port scanner'
      });
    }).on('error', (error) => {
      const responseTime = Date.now() - startTime;

      res.json({
        success: false,
        url: url,
        error: error.code,
        responseTime: responseTime,
        vulnerability: 'SSRF port scanner - reveals internal network structure'
      });
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Fetch user avatar from URL
 * No domain whitelist
 */
router.post('/update-avatar', async (req, res, next) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ error: 'Avatar URL required' });
    }

    // VULNERABILITY: No domain whitelist
    // Accepts any URL including internal ones

    res.json({
      success: true,
      avatarUrl: avatarUrl,
      message: 'Avatar updated',
      vulnerability: 'SSRF - no domain whitelist for avatar URLs'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
