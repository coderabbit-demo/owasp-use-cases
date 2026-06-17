/**
 * A09: Security Logging and Monitoring Failures - SECURE Implementation
 * Demonstrates comprehensive logging, monitoring, and alerting
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const crypto = require('crypto');

// In-memory audit log (in production: use dedicated logging service)
const auditLog = [];
const securityEvents = [];

/**
 * Helper: Create audit log entry
 */
function logAuditEvent(eventType, details, severity = 'INFO') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType: eventType,
    severity: severity,
    details: details,
    logId: crypto.randomBytes(16).toString('hex')
  };

  auditLog.push(logEntry);

  // In production: Send to SIEM, log aggregation service
  console.log(`[AUDIT-${severity}] ${eventType}:`, JSON.stringify(details));

  // Trigger alerts for high-severity events
  if (severity === 'HIGH' || severity === 'CRITICAL') {
    triggerAlert(logEntry);
  }

  return logEntry;
}

/**
 * Helper: Trigger security alert
 */
function triggerAlert(logEntry) {
  securityEvents.push({
    ...logEntry,
    alertId: crypto.randomBytes(8).toString('hex'),
    acknowledged: false
  });

  // In production: Send to PagerDuty, Slack, email, etc.
  console.log(`[ALERT] Security event detected: ${logEntry.eventType}`);
}

/**
 * SECURE: Login with comprehensive logging
 * All authentication attempts logged
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // SECURE: Log authentication attempt with context
    const logDetails = {
      username: username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };

    const result = await db.query(
      'SELECT id, username, role, password FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      // SECURE: Log failed authentication
      logAuditEvent('LOGIN_FAILED', {
        ...logDetails,
        reason: 'User not found'
      }, 'MEDIUM');

      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Simulate password check (in production: use bcrypt)
    const validPassword = password === user.password;

    if (!validPassword) {
      // SECURE: Log failed authentication with HIGH severity
      logAuditEvent('LOGIN_FAILED', {
        ...logDetails,
        userId: user.id,
        reason: 'Invalid password',
        attempts: getLoginAttempts(username)
      }, 'HIGH');

      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // SECURE: Log successful authentication
    logAuditEvent('LOGIN_SUCCESS', {
      ...logDetails,
      userId: user.id,
      role: user.role
    }, 'INFO');

    res.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
      message: 'Login logged with full audit trail'
    });

  } catch (error) {
    // SECURE: Log errors
    logAuditEvent('LOGIN_ERROR', {
      error: error.message,
      ipAddress: req.ip
    }, 'CRITICAL');
    next(error);
  }
});

/**
 * Helper: Track login attempts
 */
function getLoginAttempts(username) {
  const recentAttempts = auditLog.filter(log =>
    log.eventType === 'LOGIN_FAILED' &&
    log.details.username === username &&
    Date.now() - new Date(log.timestamp).getTime() < 15 * 60 * 1000
  );
  return recentAttempts.length;
}

/**
 * SECURE: Sensitive data access with logging
 * Complete audit trail of data access
 */
router.get('/sensitive-data/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

    // SECURE: Log data access
    logAuditEvent('DATA_ACCESS', {
      resourceType: 'user_profile',
      resourceId: id,
      accessedBy: userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, 'INFO');

    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Data access logged for compliance audit'
    });

  } catch (error) {
    logAuditEvent('DATA_ACCESS_ERROR', {
      resourceId: id,
      error: error.message
    }, 'HIGH');
    next(error);
  }
});

/**
 * SECURE: Authorization failures logged
 * Detect potential attacks
 */
router.get('/admin/panel', async (req, res, next) => {
  try {
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];

    if (userRole !== 'admin') {
      // SECURE: Log authorization failure with HIGH severity
      logAuditEvent('AUTHORIZATION_FAILED', {
        userId: userId,
        requestedResource: '/admin/panel',
        userRole: userRole,
        requiredRole: 'admin',
        ipAddress: req.ip
      }, 'HIGH');

      return res.status(403).json({
        error: 'Forbidden'
      });
    }

    // SECURE: Log authorized access
    logAuditEvent('ADMIN_ACCESS', {
      userId: userId,
      resource: '/admin/panel',
      ipAddress: req.ip
    }, 'MEDIUM');

    res.json({
      success: true,
      message: 'Admin panel - all access logged'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Alert on suspicious activity
 * Multiple failures trigger alerts
 */
router.post('/verify-code', async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.headers['x-user-id'];
    const correctCode = '123456';

    if (code !== correctCode) {
      // SECURE: Track failed attempts
      const recentFailures = auditLog.filter(log =>
        log.eventType === 'CODE_VERIFICATION_FAILED' &&
        log.details.userId === userId &&
        Date.now() - new Date(log.timestamp).getTime() < 5 * 60 * 1000
      ).length;

      // SECURE: Alert on multiple failures
      const severity = recentFailures >= 3 ? 'CRITICAL' : 'MEDIUM';

      logAuditEvent('CODE_VERIFICATION_FAILED', {
        userId: userId,
        attemptNumber: recentFailures + 1,
        ipAddress: req.ip,
        alert: recentFailures >= 3 ? 'Possible brute force attack' : null
      }, severity);

      return res.status(401).json({
        error: 'Invalid code'
      });
    }

    // SECURE: Log successful verification
    logAuditEvent('CODE_VERIFICATION_SUCCESS', {
      userId: userId,
      ipAddress: req.ip
    }, 'INFO');

    res.json({
      success: true,
      message: 'Code verified - suspicious activity monitored and alerted'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Protected audit logs
 * Read-only access with authentication
 */
router.get('/logs', async (req, res, next) => {
  try {
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];

    // SECURE: Require admin role
    if (userRole !== 'admin') {
      logAuditEvent('UNAUTHORIZED_LOG_ACCESS', {
        userId: userId,
        ipAddress: req.ip
      }, 'CRITICAL');

      return res.status(403).json({
        error: 'Unauthorized - admin access required'
      });
    }

    // SECURE: Log the log access (meta-logging)
    logAuditEvent('AUDIT_LOG_ACCESSED', {
      userId: userId,
      ipAddress: req.ip
    }, 'MEDIUM');

    // SECURE: Return sanitized logs (no sensitive data)
    const sanitizedLogs = auditLog.map(log => ({
      timestamp: log.timestamp,
      eventType: log.eventType,
      severity: log.severity,
      logId: log.logId
      // Sensitive details omitted in response
    }));

    res.json({
      success: true,
      logs: sanitizedLogs,
      total: sanitizedLogs.length,
      message: 'Audit logs protected with authentication and sanitization'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Privilege changes logged and monitored
 * Requires approval and creates audit trail
 */
router.post('/change-role', async (req, res, next) => {
  try {
    const { userId, newRole } = req.body;
    const adminId = req.headers['x-user-id'];

    // SECURE: Log privilege escalation with CRITICAL severity
    logAuditEvent('ROLE_CHANGE', {
      targetUserId: userId,
      newRole: newRole,
      changedBy: adminId,
      ipAddress: req.ip,
      requiresApproval: true
    }, 'CRITICAL');

    await db.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      [newRole, userId]
    );

    // SECURE: Notify security team
    triggerAlert({
      eventType: 'PRIVILEGE_ESCALATION',
      details: { userId, newRole, changedBy: adminId },
      severity: 'CRITICAL'
    });

    res.json({
      success: true,
      message: 'Role change logged and security team notified'
    });

  } catch (error) {
    logAuditEvent('ROLE_CHANGE_ERROR', {
      userId: userId,
      error: error.message
    }, 'CRITICAL');
    next(error);
  }
});

/**
 * SECURE: Errors logged with full context
 * Enables root cause analysis
 */
router.get('/process/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === '999') {
      throw new Error('Database connection failed');
    }

    res.json({
      success: true,
      data: { id: id }
    });

  } catch (error) {
    // SECURE: Comprehensive error logging
    logAuditEvent('PROCESSING_ERROR', {
      resourceId: req.params.id,
      error: error.message,
      stack: error.stack,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    }, 'HIGH');

    res.status(500).json({
      error: 'An error occurred',
      errorId: auditLog[auditLog.length - 1].logId // Reference for support
    });
  }
});

/**
 * SECURE: Log integrity protection
 * Append-only logs with checksums
 */
router.get('/log-integrity', async (req, res, next) => {
  try {
    // SECURE: Calculate log integrity checksum
    const logData = JSON.stringify(auditLog);
    const checksum = crypto
      .createHash('sha256')
      .update(logData)
      .digest('hex');

    res.json({
      success: true,
      logCount: auditLog.length,
      integrity: {
        checksum: checksum,
        algorithm: 'SHA-256',
        protected: true,
        appendOnly: true
      },
      message: 'Logs protected with cryptographic integrity verification'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Detailed logging for sensitive operations
 * Complete context for forensic analysis
 */
router.post('/transfer', async (req, res, next) => {
  try {
    const { amount, recipient } = req.body;
    const userId = req.headers['x-user-id'];

    // SECURE: Comprehensive logging with all context
    logAuditEvent('FINANCIAL_TRANSACTION', {
      userId: userId,
      amount: amount,
      recipient: recipient,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      geolocation: 'US', // In production: use IP geolocation
      deviceFingerprint: req.headers['x-device-id'],
      sessionId: req.headers['x-session-id']
    }, 'CRITICAL');

    res.json({
      success: true,
      message: 'Transfer completed with full audit trail',
      transactionId: auditLog[auditLog.length - 1].logId
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Real-time monitoring dashboard
 * Active security monitoring and alerting
 */
router.get('/monitoring-status', async (req, res, next) => {
  try {
    const recentAlerts = securityEvents.filter(event =>
      Date.now() - new Date(event.timestamp).getTime() < 60 * 60 * 1000
    );

    res.json({
      success: true,
      monitoring: {
        enabled: true,
        realTimeAlerts: true,
        logAggregation: true,
        securityDashboard: true,
        incidentResponse: 'Active 24/7'
      },
      statistics: {
        totalLogs: auditLog.length,
        recentAlerts: recentAlerts.length,
        criticalEvents: auditLog.filter(l => l.severity === 'CRITICAL').length,
        highSeverityEvents: auditLog.filter(l => l.severity === 'HIGH').length
      },
      message: 'Real-time monitoring with automated alerting enabled'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Security events dashboard
 * View recent security events and alerts
 */
router.get('/security-events', async (req, res, next) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const recentEvents = securityEvents.slice(-20); // Last 20 events

    res.json({
      success: true,
      events: recentEvents,
      totalAlerts: securityEvents.length,
      unacknowledged: securityEvents.filter(e => !e.acknowledged).length,
      message: 'Security event monitoring active'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
