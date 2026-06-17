/**
 * A06: Vulnerable and Outdated Components - VULNERABLE Implementation
 * Demonstrates risks of using outdated dependencies with known vulnerabilities
 */

const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

/**
 * VULNERABLE: Using outdated library information
 * Simulates using packages with known CVEs
 */
router.get('/dependencies', async (req, res, next) => {
  try {
    // VULNERABILITY: Simulating outdated dependencies with known CVEs
    const vulnerableDependencies = [
      {
        name: 'lodash',
        version: '4.17.15',
        vulnerability: 'CVE-2020-8203',
        severity: 'HIGH',
        description: 'Prototype pollution vulnerability',
        fixed_in: '4.17.19'
      },
      {
        name: 'express',
        version: '4.16.0',
        vulnerability: 'CVE-2022-24999',
        severity: 'MEDIUM',
        description: 'Open redirect vulnerability',
        fixed_in: '4.17.3'
      },
      {
        name: 'jsonwebtoken',
        version: '8.5.0',
        vulnerability: 'CVE-2022-23529',
        severity: 'HIGH',
        description: 'Algorithm confusion vulnerability',
        fixed_in: '9.0.0'
      },
      {
        name: 'axios',
        version: '0.21.0',
        vulnerability: 'CVE-2021-3749',
        severity: 'CRITICAL',
        description: 'SSRF vulnerability',
        fixed_in: '0.21.2'
      }
    ];

    res.json({
      success: true,
      dependencies: vulnerableDependencies,
      totalVulnerabilities: vulnerableDependencies.length,
      vulnerability: 'Using outdated components with known security vulnerabilities'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Prototype pollution demonstration
 * Simulates lodash 4.17.15 prototype pollution
 */
router.post('/merge', async (req, res, next) => {
  try {
    const { userInput } = req.body;

    // VULNERABILITY: Unsafe object merge (simulating old lodash behavior)
    const targetObject = {};

    // Simulating prototype pollution
    if (userInput && typeof userInput === 'object') {
      for (let key in userInput) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          // VULNERABILITY: Allows prototype pollution
          targetObject[key] = userInput[key];
        } else {
          targetObject[key] = userInput[key];
        }
      }
    }

    res.json({
      success: true,
      merged: targetObject,
      vulnerability: 'Prototype pollution - can manipulate Object.prototype'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Deserialization with old library
 * Simulates insecure deserialization vulnerability
 */
router.post('/deserialize', async (req, res, next) => {
  try {
    const { serialized } = req.body;

    // VULNERABILITY: Unsafe deserialization
    let deserialized;
    try {
      // Using eval (simulating old vulnerable deserialization)
      deserialized = eval('(' + serialized + ')');
    } catch (e) {
      deserialized = { error: 'Invalid input' };
    }

    res.json({
      success: true,
      deserialized: deserialized,
      vulnerability: 'Insecure deserialization using vulnerable component'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: No dependency scanning
 * No automated vulnerability detection
 */
router.get('/security-scan', async (req, res, next) => {
  try {
    res.json({
      success: true,
      lastScan: 'Never',
      vulnerabilitiesFound: 'Unknown',
      vulnerability: 'No automated dependency vulnerability scanning configured'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Unused dependencies still included
 * Increases attack surface
 */
router.get('/unused-packages', async (req, res, next) => {
  try {
    const unusedPackages = [
      { name: 'moment', version: '2.24.0', lastUsed: 'Never', vulnerabilities: 2 },
      { name: 'request', version: '2.88.0', lastUsed: 'Never', status: 'Deprecated', vulnerabilities: 1 },
      { name: 'underscore', version: '1.9.1', lastUsed: 'Never', vulnerabilities: 1 }
    ];

    res.json({
      success: true,
      unusedPackages: unusedPackages,
      vulnerability: 'Unused dependencies with vulnerabilities still installed'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Using EOL (End of Life) runtime
 * Simulates running on unsupported Node.js version
 */
router.get('/runtime-info', async (req, res, next) => {
  try {
    res.json({
      success: true,
      nodeVersion: 'v10.16.0', // Simulated EOL version
      eolDate: '2021-04-30',
      securityUpdates: 'No longer receiving security updates',
      currentVersion: process.version, // Actual version
      vulnerability: 'Running on End-of-Life Node.js version without security patches'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * VULNERABLE: Transitive dependency vulnerability
 * Indirect dependencies with security issues
 */
router.get('/transitive-deps', async (req, res, next) => {
  try {
    const transitiveDeps = [
      {
        package: 'express',
        version: '4.16.0',
        dependency: 'qs',
        dependencyVersion: '6.5.1',
        vulnerability: 'CVE-2022-24999',
        severity: 'HIGH'
      },
      {
        package: 'body-parser',
        version: '1.18.0',
        dependency: 'iconv-lite',
        dependencyVersion: '0.4.19',
        vulnerability: 'CVE-2022-24999',
        severity: 'MEDIUM'
      }
    ];

    res.json({
      success: true,
      transitiveDependencies: transitiveDeps,
      vulnerability: 'Vulnerable transitive dependencies not monitored'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
