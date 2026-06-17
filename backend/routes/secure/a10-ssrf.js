/**
 * A10: Server-Side Request Forgery (SSRF) - SECURE Implementation
 * Demonstrates URL validation, allowlisting, and SSRF prevention
 */

const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');
const dns = require('dns').promises;

// Allowlist of permitted domains
const ALLOWED_DOMAINS = [
  'api.github.com',
  'api.example.com',
  'cdn.example.com'
];

// Blocklist of dangerous patterns
const BLOCKED_PATTERNS = [
  /^127\./,           // Localhost
  /^10\./,            // Private network
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private network
  /^192\.168\./,      // Private network
  /^169\.254\./,      // Link-local (AWS metadata)
  /^0\./,             // Invalid
  /^224\./,           // Multicast
  /localhost/i,
  /metadata/i
];

/**
 * Helper: Validate URL for SSRF prevention
 */
async function validateUrl(urlString) {
  try {
    // Parse URL
    const url = new URL(urlString);

    // SECURE: Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        valid: false,
        reason: 'Only HTTP and HTTPS protocols are allowed'
      };
    }

    // SECURE: Check domain allowlist
    if (!ALLOWED_DOMAINS.includes(url.hostname)) {
      return {
        valid: false,
        reason: 'Domain not in allowlist'
      };
    }

    // SECURE: Resolve hostname to IP
    let addresses;
    try {
      addresses = await dns.resolve4(url.hostname);
    } catch (e) {
      return {
        valid: false,
        reason: 'Unable to resolve hostname'
      };
    }

    // SECURE: Check if any resolved IP is blocked
    for (let ip of addresses) {
      for (let pattern of BLOCKED_PATTERNS) {
        if (pattern.test(ip)) {
          return {
            valid: false,
            reason: 'Resolved IP address is not allowed'
          };
        }
      }
    }

    return { valid: true, url: url };

  } catch (error) {
    return {
      valid: false,
      reason: 'Invalid URL format'
    };
  }
}

/**
 * SECURE: Fetch URL with strict validation
 * Only allows requests to allowlisted domains
 */
router.post('/fetch-url', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    // SECURE: Validate URL
    const validation = await validateUrl(url);

    if (!validation.valid) {
      return res.status(403).json({
        error: 'URL validation failed',
        reason: validation.reason,
        message: 'Only allowlisted domains are permitted'
      });
    }

    const protocol = url.startsWith('https') ? https : http;

    // SECURE: Set timeout to prevent hanging
    const options = {
      timeout: 5000 // 5 seconds
    };

    protocol.get(url, options, (response) => {
      let data = '';
      let dataLength = 0;
      const MAX_SIZE = 1024 * 1024; // 1MB limit

      response.on('data', (chunk) => {
        dataLength += chunk.length;

        // SECURE: Prevent large response attacks
        if (dataLength > MAX_SIZE) {
          response.destroy();
          return res.status(413).json({
            error: 'Response too large',
            maxSize: '1MB'
          });
        }

        data += chunk;
      });

      response.on('end', () => {
        res.json({
          success: true,
          data: data,
          statusCode: response.statusCode,
          message: 'URL validated and fetched securely'
        });
      });
    }).on('error', (error) => {
      res.status(500).json({
        error: 'Request failed',
        message: error.message
      });
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Import from URL with validation
 * Strict domain allowlist enforcement
 */
router.post('/import-from-url', async (req, res, next) => {
  try {
    const { dataUrl } = req.body;

    if (!dataUrl) {
      return res.status(400).json({ error: 'Data URL required' });
    }

    // SECURE: Validate URL
    const validation = await validateUrl(dataUrl);

    if (!validation.valid) {
      return res.status(403).json({
        error: 'URL validation failed',
        reason: validation.reason,
        allowedDomains: ALLOWED_DOMAINS
      });
    }

    const protocol = dataUrl.startsWith('https') ? https : http;

    protocol.get(dataUrl, { timeout: 5000 }, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        res.json({
          success: true,
          importedData: data,
          message: 'Data imported from validated URL'
        });
      });
    }).on('error', (error) => {
      res.status(500).json({
        error: 'Import failed',
        message: error.message
      });
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Webhook with URL validation
 * Only allows registered and validated callback URLs
 */
router.post('/register-webhook', async (req, res, next) => {
  try {
    const { callbackUrl } = req.body;

    if (!callbackUrl) {
      return res.status(400).json({ error: 'Callback URL required' });
    }

    // SECURE: Validate webhook URL
    const validation = await validateUrl(callbackUrl);

    if (!validation.valid) {
      return res.status(403).json({
        error: 'Webhook URL validation failed',
        reason: validation.reason,
        message: 'Only trusted callback URLs are allowed'
      });
    }

    // SECURE: Additional webhook-specific validation
    const url = validation.url;

    if (url.port && !['80', '443', ''].includes(url.port)) {
      return res.status(403).json({
        error: 'Invalid port',
        message: 'Only standard HTTP/HTTPS ports allowed'
      });
    }

    res.json({
      success: true,
      callbackUrl: callbackUrl,
      status: 'registered',
      message: 'Webhook registered with validated URL'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: PDF generation with URL validation
 * Only generates PDFs from trusted sources
 */
router.post('/generate-pdf', async (req, res, next) => {
  try {
    const { htmlUrl } = req.body;

    if (!htmlUrl) {
      return res.status(400).json({ error: 'HTML URL required' });
    }

    // SECURE: Validate URL
    const validation = await validateUrl(htmlUrl);

    if (!validation.valid) {
      return res.status(403).json({
        error: 'URL validation failed',
        reason: validation.reason,
        message: 'PDF generation only from trusted domains'
      });
    }

    res.json({
      success: true,
      message: 'PDF generation initiated',
      sourceUrl: htmlUrl,
      security: 'URL validated against allowlist'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Image proxy with strict validation
 * Only proxies images from CDN domains
 */
router.get('/proxy-image', async (req, res, next) => {
  try {
    const imageUrl = req.query.url;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' });
    }

    // SECURE: Specific allowlist for image CDNs
    const imageCDNs = ['cdn.example.com', 'images.example.com'];

    const url = new URL(imageUrl);

    if (!imageCDNs.includes(url.hostname)) {
      return res.status(403).json({
        error: 'Invalid image source',
        message: 'Images must be from approved CDN',
        allowedCDNs: imageCDNs
      });
    }

    // SECURE: Only allow image file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasImageExtension = imageExtensions.some(ext =>
      url.pathname.toLowerCase().endsWith(ext)
    );

    if (!hasImageExtension) {
      return res.status(403).json({
        error: 'Invalid file type',
        message: 'Only image files allowed',
        allowedTypes: imageExtensions
      });
    }

    const protocol = imageUrl.startsWith('https') ? https : http;

    protocol.get(imageUrl, { timeout: 5000 }, (response) => {
      // SECURE: Verify content type
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        response.destroy();
        return res.status(403).json({
          error: 'Invalid content type',
          message: 'Response is not an image'
        });
      }

      res.setHeader('Content-Type', contentType);
      response.pipe(res);
    }).on('error', (error) => {
      res.status(500).json({
        error: 'Image proxy failed',
        message: error.message
      });
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: URL status check disabled
 * Prevents use as port scanner
 */
router.post('/check-url-status', async (req, res, next) => {
  try {
    res.status(403).json({
      error: 'Feature disabled',
      message: 'URL status checking disabled to prevent SSRF and port scanning',
      reason: 'Security policy'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Avatar from validated URL
 * Strict domain allowlist for avatar sources
 */
router.post('/update-avatar', async (req, res, next) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ error: 'Avatar URL required' });
    }

    // SECURE: Specific allowlist for avatar sources
    const avatarSources = ['avatars.example.com', 'cdn.example.com'];

    const url = new URL(avatarUrl);

    if (!avatarSources.includes(url.hostname)) {
      return res.status(403).json({
        error: 'Invalid avatar source',
        message: 'Avatars must be from approved sources',
        allowedSources: avatarSources
      });
    }

    // SECURE: Verify it's an image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const hasImageExtension = imageExtensions.some(ext =>
      url.pathname.toLowerCase().endsWith(ext)
    );

    if (!hasImageExtension) {
      return res.status(403).json({
        error: 'Invalid file type',
        message: 'Avatar must be an image file'
      });
    }

    res.json({
      success: true,
      avatarUrl: avatarUrl,
      message: 'Avatar updated with validated URL',
      security: 'Domain allowlist enforced'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Get allowed domains list
 * Transparency about permitted domains
 */
router.get('/allowed-domains', async (req, res, next) => {
  try {
    res.json({
      success: true,
      allowedDomains: ALLOWED_DOMAINS,
      message: 'Only these domains are permitted for external requests',
      security: 'SSRF protection enabled'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
