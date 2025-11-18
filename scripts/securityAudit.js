#!/usr/bin/env node

/**
 * Security Audit Script
 * Performs comprehensive security checks on the application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Casa Ignat - Security Audit\n');
console.log('='.repeat(70));

const results = {
  passed: [],
  warnings: [],
  failed: [],
};

/**
 * Check 1: NPM Audit
 */
function checkNpmVulnerabilities() {
  console.log('\n📦 Checking NPM vulnerabilities...');
  try {
    const output = execSync('npm audit --json', { encoding: 'utf-8' });
    const audit = JSON.parse(output);

    if (audit.metadata.vulnerabilities.total === 0) {
      results.passed.push('No NPM vulnerabilities found');
      console.log('✅ No vulnerabilities found');
    } else {
      const { low, moderate, high, critical } = audit.metadata.vulnerabilities;
      const msg = `Found vulnerabilities: ${critical} critical, ${high} high, ${moderate} moderate, ${low} low`;

      if (critical > 0 || high > 0) {
        results.failed.push(msg);
        console.log(`❌ ${msg}`);
      } else {
        results.warnings.push(msg);
        console.log(`⚠️  ${msg}`);
      }
    }
  } catch (error) {
    results.warnings.push('NPM audit failed to run');
    console.log('⚠️  NPM audit failed to run');
  }
}

/**
 * Check 2: Environment Variables
 */
function checkEnvironmentVariables() {
  console.log('\n🔐 Checking environment variables...');

  const requiredVars = [
    'MONGODB_URI',
    'SESSION_SECRET',
    'JWT_SECRET',
    'NODE_ENV',
  ];

  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length === 0) {
    results.passed.push('All required environment variables are set');
    console.log('✅ All required environment variables are set');
  } else {
    results.failed.push(`Missing environment variables: ${missing.join(', ')}`);
    console.log(`❌ Missing: ${missing.join(', ')}`);
  }

  // Check secret strength
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    results.warnings.push('SESSION_SECRET should be at least 32 characters');
    console.log('⚠️  SESSION_SECRET is too short (< 32 characters)');
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    results.warnings.push('JWT_SECRET should be at least 32 characters');
    console.log('⚠️  JWT_SECRET is too short (< 32 characters)');
  }
}

/**
 * Check 3: File Permissions
 */
function checkFilePermissions() {
  console.log('\n📁 Checking file permissions...');

  const sensitiveFiles = [
    '.env',
    '.env.production',
    'config/database.js',
  ];

  let issues = 0;

  sensitiveFiles.forEach(file => {
    const filepath = path.join(process.cwd(), file);
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);

      if (mode !== '600' && mode !== '400') {
        results.warnings.push(`${file} has loose permissions (${mode})`);
        console.log(`⚠️  ${file} permissions: ${mode} (should be 600 or 400)`);
        issues++;
      }
    }
  });

  if (issues === 0) {
    results.passed.push('File permissions are secure');
    console.log('✅ File permissions are secure');
  }
}

/**
 * Check 4: HTTPS Configuration
 */
function checkHTTPS() {
  console.log('\n🔒 Checking HTTPS configuration...');

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.APP_URL || !process.env.APP_URL.startsWith('https://')) {
      results.failed.push('APP_URL should use HTTPS in production');
      console.log('❌ APP_URL should use HTTPS in production');
    } else {
      results.passed.push('HTTPS properly configured');
      console.log('✅ HTTPS properly configured');
    }
  } else {
    results.passed.push('HTTPS check skipped (not in production)');
    console.log('ℹ️  HTTPS check skipped (not in production)');
  }
}

/**
 * Check 5: Security Headers
 */
function checkSecurityHeaders() {
  console.log('\n🛡️  Checking security headers configuration...');

  const appJsPath = path.join(process.cwd(), 'src/app.js');

  if (fs.existsSync(appJsPath)) {
    const content = fs.readFileSync(appJsPath, 'utf-8');

    const checks = [
      { name: 'Helmet middleware', pattern: /helmet\(/i },
      { name: 'CORS configuration', pattern: /cors\(/i },
      { name: 'XSS protection', pattern: /xss-clean/i },
      { name: 'NoSQL injection protection', pattern: /mongo-sanitize/i },
      { name: 'Rate limiting', pattern: /rate-limit/i },
    ];

    checks.forEach(check => {
      if (check.pattern.test(content)) {
        results.passed.push(`${check.name} is enabled`);
        console.log(`✅ ${check.name} is enabled`);
      } else {
        results.failed.push(`${check.name} is missing`);
        console.log(`❌ ${check.name} is missing`);
      }
    });
  } else {
    results.failed.push('src/app.js not found');
    console.log('❌ src/app.js not found');
  }
}

/**
 * Check 6: Password Policy
 */
function checkPasswordPolicy() {
  console.log('\n🔑 Checking password policy...');

  const userModelPath = path.join(process.cwd(), 'src/models/User.js');

  if (fs.existsSync(userModelPath)) {
    const content = fs.readFileSync(userModelPath, 'utf-8');

    if (/validatePasswordComplexity/.test(content)) {
      results.passed.push('Password complexity validation is implemented');
      console.log('✅ Password complexity validation is implemented');
    } else {
      results.warnings.push('Password complexity validation not found');
      console.log('⚠️  Password complexity validation not found');
    }

    if (/bcrypt/.test(content)) {
      results.passed.push('Password hashing (bcrypt) is implemented');
      console.log('✅ Password hashing (bcrypt) is implemented');
    } else {
      results.failed.push('Password hashing not found');
      console.log('❌ Password hashing not found');
    }
  }
}

/**
 * Check 7: GDPR Compliance
 */
function checkGDPRCompliance() {
  console.log('\n⚖️  Checking GDPR compliance...');

  const gdprFiles = [
    'src/models/ConsentTracking.js',
    'src/models/DataRequest.js',
    'src/services/gdprService.js',
    'src/controllers/privacyController.js',
    'views/privacy/policy.ejs',
  ];

  let foundFiles = 0;

  gdprFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      foundFiles++;
    }
  });

  if (foundFiles === gdprFiles.length) {
    results.passed.push('GDPR compliance files are present');
    console.log('✅ GDPR compliance files are present');
  } else {
    results.warnings.push(`Only ${foundFiles}/${gdprFiles.length} GDPR files found`);
    console.log(`⚠️  Only ${foundFiles}/${gdprFiles.length} GDPR files found`);
  }
}

/**
 * Check 8: Database Security
 */
function checkDatabaseSecurity() {
  console.log('\n💾 Checking database security...');

  if (process.env.MONGODB_URI) {
    const uri = process.env.MONGODB_URI;

    if (uri.includes('admin') || uri.includes('authSource')) {
      results.passed.push('MongoDB authentication is configured');
      console.log('✅ MongoDB authentication is configured');
    } else {
      results.warnings.push('MongoDB may not have authentication configured');
      console.log('⚠️  MongoDB may not have authentication configured');
    }

    if (uri.includes('localhost') && process.env.NODE_ENV === 'production') {
      results.warnings.push('Production should not use localhost for database');
      console.log('⚠️  Production should not use localhost for database');
    }
  }
}

/**
 * Check 9: Session Security
 */
function checkSessionSecurity() {
  console.log('\n🎟️  Checking session security...');

  const appJsPath = path.join(process.cwd(), 'src/app.js');

  if (fs.existsSync(appJsPath)) {
    const content = fs.readFileSync(appJsPath, 'utf-8');

    const checks = [
      { name: 'httpOnly cookies', pattern: /httpOnly:\s*true/i },
      { name: 'secure cookies (production)', pattern: /secure:\s*.*production/i },
      { name: 'sameSite protection', pattern: /sameSite:\s*['"]lax['"]/i },
      { name: 'MongoDB session store', pattern: /MongoStore/i },
    ];

    checks.forEach(check => {
      if (check.pattern.test(content)) {
        results.passed.push(`${check.name} is enabled`);
        console.log(`✅ ${check.name} is enabled`);
      } else {
        results.warnings.push(`${check.name} may not be configured`);
        console.log(`⚠️  ${check.name} may not be configured`);
      }
    });
  }
}

/**
 * Check 10: File Upload Security
 */
function checkFileUploadSecurity() {
  console.log('\n📤 Checking file upload security...');

  const uploadFiles = [
    'src/middleware/secureUpload.js',
    'config/upload.js',
  ];

  let foundFiles = 0;
  uploadFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      foundFiles++;
    }
  });

  if (foundFiles > 0) {
    results.passed.push('File upload security files found');
    console.log('✅ File upload security files found');

    // Check for virus scanning
    const secureUploadPath = path.join(process.cwd(), 'src/middleware/secureUpload.js');
    if (fs.existsSync(secureUploadPath)) {
      const content = fs.readFileSync(secureUploadPath, 'utf-8');
      if (/clamscan/i.test(content)) {
        results.passed.push('Virus scanning (ClamAV) is implemented');
        console.log('✅ Virus scanning (ClamAV) is implemented');
      } else {
        results.warnings.push('Virus scanning not found');
        console.log('⚠️  Virus scanning not found');
      }
    }
  } else {
    results.warnings.push('File upload security may not be configured');
    console.log('⚠️  File upload security may not be configured');
  }
}

/**
 * Generate Report
 */
function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Security Audit Summary\n');

  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  const score = Math.round(
    (results.passed.length / (results.passed.length + results.warnings.length + results.failed.length)) * 100
  );

  console.log(`\n🎯 Security Score: ${score}%`);

  if (score >= 90) {
    console.log('   Status: Excellent 🏆');
  } else if (score >= 75) {
    console.log('   Status: Good ✅');
  } else if (score >= 50) {
    console.log('   Status: Needs Improvement ⚠️');
  } else {
    console.log('   Status: Critical ❌');
  }

  // Save report to file
  const report = {
    timestamp: new Date().toISOString(),
    score,
    passed: results.passed,
    warnings: results.warnings,
    failed: results.failed,
  };

  fs.writeFileSync(
    'security-audit-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n📄 Full report saved to: security-audit-report.json');

  if (results.failed.length > 0) {
    console.log('\n❌ Critical Issues:');
    results.failed.forEach(issue => console.log(`   - ${issue}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  console.log('\n' + '='.repeat(70));

  // Exit with error code if critical failures
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

/**
 * Run all checks
 */
function runAudit() {
  checkNpmVulnerabilities();
  checkEnvironmentVariables();
  checkFilePermissions();
  checkHTTPS();
  checkSecurityHeaders();
  checkPasswordPolicy();
  checkGDPRCompliance();
  checkDatabaseSecurity();
  checkSessionSecurity();
  checkFileUploadSecurity();
  generateReport();
}

// Run the audit
runAudit();
