/**
 * A06: Vulnerable and Outdated Components - SECURE Implementation
 * Demonstrates proper dependency management and vulnerability scanning
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

/**
 * SECURE: Up-to-date dependencies
 * Regular updates and vulnerability monitoring
 */
router.get('/dependencies', async (req, res, next) => {
  try {
    // SECURE: All dependencies kept up-to-date
    const secureDependencies = [
      {
        name: 'lodash',
        version: '4.17.21',
        lastUpdate: '2023-01-15',
        vulnerabilities: 0,
        status: 'Up to date'
      },
      {
        name: 'express',
        version: '4.18.2',
        lastUpdate: '2023-02-20',
        vulnerabilities: 0,
        status: 'Up to date'
      },
      {
        name: 'jsonwebtoken',
        version: '9.0.2',
        lastUpdate: '2023-03-10',
        vulnerabilities: 0,
        status: 'Up to date'
      },
      {
        name: 'axios',
        version: '1.4.0',
        lastUpdate: '2023-04-05',
        vulnerabilities: 0,
        status: 'Up to date'
      }
    ];

    res.json({
      success: true,
      dependencies: secureDependencies,
      totalVulnerabilities: 0,
      lastAudit: new Date().toISOString(),
      message: 'All dependencies up-to-date with no known vulnerabilities'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Protected against prototype pollution
 * Using safe object operations
 */
router.post('/merge', async (req, res, next) => {
  try {
    const { userInput } = req.body;

    // SECURE: Safe object merge with prototype pollution protection
    const targetObject = {};

    if (userInput && typeof userInput === 'object') {
      // Filter out dangerous keys
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

      for (let key in userInput) {
        if (!dangerousKeys.includes(key) && userInput.hasOwnProperty(key)) {
          // Additional validation
          if (typeof key === 'string' && key.length < 100) {
            targetObject[key] = userInput[key];
          }
        }
      }
    }

    res.json({
      success: true,
      merged: targetObject,
      message: 'Safe object merge with prototype pollution protection'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Safe deserialization
 * Using JSON.parse with validation
 */
router.post('/deserialize', async (req, res, next) => {
  try {
    const { serialized } = req.body;

    // SECURE: Safe deserialization using JSON.parse
    let deserialized;
    try {
      deserialized = JSON.parse(serialized);

      // Additional validation
      if (typeof deserialized !== 'object' || deserialized === null) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Expected JSON object'
        });
      }

      // Whitelist allowed properties
      const allowedKeys = ['name', 'email', 'age'];
      const sanitized = {};

      for (let key of allowedKeys) {
        if (deserialized.hasOwnProperty(key)) {
          sanitized[key] = deserialized[key];
        }
      }

      res.json({
        success: true,
        deserialized: sanitized,
        message: 'Safe deserialization with validation and whitelisting'
      });

    } catch (e) {
      res.status(400).json({
        error: 'Invalid JSON',
        message: 'Unable to parse input'
      });
    }

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Automated dependency scanning
 * Regular vulnerability checks with npm audit
 */
router.get('/security-scan', async (req, res, next) => {
  try {
    const scanResults = {
      lastScan: new Date().toISOString(),
      vulnerabilitiesFound: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      tools: ['npm audit', 'Snyk', 'Dependabot'],
      status: 'PASSED'
    };

    res.json({
      success: true,
      scan: scanResults,
      message: 'Automated security scanning configured and running'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Clean dependency tree
 * Only necessary dependencies included
 */
router.get('/unused-packages', async (req, res, next) => {
  try {
    res.json({
      success: true,
      unusedPackages: [],
      totalPackages: 15,
      unusedCount: 0,
      message: 'All dependencies are actively used - no unused packages'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Running supported runtime version
 * Regular Node.js LTS updates
 */
router.get('/runtime-info', async (req, res, next) => {
  try {
    const currentVersion = process.version;
    const major = parseInt(currentVersion.split('.')[0].substring(1));

    res.json({
      success: true,
      nodeVersion: currentVersion,
      majorVersion: major,
      ltsStatus: major >= 18 ? 'Active LTS' : 'Please upgrade',
      securityUpdates: 'Receiving security updates',
      recommendedAction: major >= 18 ? 'No action needed' : 'Upgrade to Node.js 18 LTS or later',
      message: 'Running supported Node.js version with active security updates'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Transitive dependency monitoring
 * Track all direct and indirect dependencies
 */
router.get('/transitive-deps', async (req, res, next) => {
  try {
    const depTree = {
      directDependencies: 15,
      transitiveDependencies: 142,
      vulnerabilitiesFound: 0,
      monitoringEnabled: true,
      lastCheck: new Date().toISOString(),
      tools: ['npm audit', 'Snyk']
    };

    res.json({
      success: true,
      dependencyTree: depTree,
      message: 'All direct and transitive dependencies monitored for vulnerabilities'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * SECURE: Dependency update policy
 * Documented update strategy
 */
router.get('/update-policy', async (req, res, next) => {
  try {
    const policy = {
      critical: 'Immediate (within 24 hours)',
      high: 'Within 1 week',
      medium: 'Within 1 month',
      low: 'Next release cycle',
      automatedTools: ['Dependabot', 'Renovate'],
      testingRequired: true,
      approvalProcess: 'Required for production deployments'
    };

    res.json({
      success: true,
      policy: policy,
      message: 'Clear dependency update policy with automated monitoring'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
