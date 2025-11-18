# OWASP Top 10 2021 Security Checklist - Casa Ignat

## Overview

This checklist maps the OWASP Top 10 security risks to Casa Ignat's implementations.

**Last Updated:** 2024-01-18
**OWASP Version:** 2021
**Application:** Casa Ignat Node.js

---

## A01:2021 – Broken Access Control

**Risk:** Users can access unauthorized functionality or data.

### Implementation Status: ✅ PROTECTED

**Controls Implemented:**

- [x] **Role-Based Access Control (RBAC)**
  - Location: `src/middleware/auth.js`
  - Roles: admin, editor, moderator
  - Granular permissions per module

- [x] **Authentication Required**
  - `requireAuth` middleware on protected routes
  - Session-based authentication with secure cookies

- [x] **Permission Checks**
  - `requirePermission(module)` middleware
  - `requireRole(...roles)` middleware
  - User.hasPermission() method

- [x] **Rate Limiting**
  - Prevents brute force attacks
  - Location: `src/middleware/rateLimiter.js`

- [x] **CSRF Protection**
  - Token-based validation
  - Applied to all state-changing operations

**Testing:**
```bash
# Test unauthorized access
curl http://localhost:3000/admin/settings
# Should redirect to login

# Test role escalation
# Login as editor, try to access admin-only resources
```

---

## A02:2021 – Cryptographic Failures

**Risk:** Sensitive data exposed due to weak cryptography.

### Implementation Status: ✅ PROTECTED

**Controls Implemented:**

- [x] **Password Hashing**
  - Algorithm: bcrypt (12 rounds production)
  - Never stored in plaintext
  - Location: `src/models/User.js`

- [x] **HTTPS Enforced**
  - Production: secure cookies, HSTS headers
  - APP_URL validates https:// in production

- [x] **Sensitive Data Protection**
  - 2FA secrets: select: false (not in queries)
  - Refresh tokens: stored with device info
  - Password reset tokens: temporary, hashed

- [x] **JWT Signing**
  - Strong secret keys (32+ characters)
  - Token expiration enforced
  - Location: `src/utils/jwtUtils.js`

**Gaps:**
- [ ] Database encryption at rest (recommend enabling in MongoDB)
- [ ] Backup encryption (configure in deployment)

**Testing:**
```bash
# Check SSL configuration
nmap --script ssl-enum-ciphers -p 443 casaignat.ro

# Test for weak ciphers
sslscan casaignat.ro
```

---

## A03:2021 – Injection

**Risk:** SQL, NoSQL, command injection vulnerabilities.

### Implementation Status: ✅ PROTECTED

**Controls Implemented:**

- [x] **NoSQL Injection Prevention**
  - Middleware: express-mongo-sanitize
  - Removes $ and . from user input
  - Location: `src/app.js`

- [x] **Input Validation**
  - express-validator for all forms
  - Location: `src/middleware/validation.js`

- [x] **Parameterized Queries**
  - Mongoose ODM (automatic parameterization)
  - No string concatenation in queries

- [x] **Command Injection Prevention**
  - No direct shell command execution with user input
  - File uploads: sanitized paths, UUID naming

**Testing:**
```bash
# Test NoSQL injection
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": {"$ne": null}, "password": {"$ne": null}}'
# Should be sanitized and fail

# Test path traversal in uploads
# Try uploading file with name: ../../etc/passwd
# Should be rejected
```

---

## A04:2021 – Insecure Design

**Risk:** Missing or ineffective control design.

### Implementation Status: ✅ PROTECTED

**Controls Implemented:**

- [x] **Threat Modeling**
  - Security architecture documented
  - Location: `docs/SECURITY.md`

- [x] **Defense in Depth**
  - Multiple layers: authentication, authorization, rate limiting, input validation

- [x] **Secure by Default**
  - Cookie consent: opt-in for non-essential
  - 2FA: available but not mandatory
  - Permissions: restrictive by default

- [x] **GDPR by Design**
  - Privacy controls built-in
  - Data minimization
  - Right to erasure implemented

**Recommendations:**
- [ ] Security training for developers
- [ ] Regular threat modeling sessions
- [ ] Security champions program

---

## A05:2021 – Security Misconfiguration

**Risk:** Insecure default configurations, incomplete setups.

### Implementation Status: ⚠️ NEEDS REVIEW

**Controls Implemented:**

- [x] **Security Headers**
  - Helmet.js configured
  - CSP, HSTS, X-Frame-Options, etc.
  - Location: `src/app.js`

- [x] **Error Handling**
  - Production: generic error messages
  - Development: detailed errors (not exposed)

- [x] **Unnecessary Features Disabled**
  - Directory listing: disabled
  - Server info: hidden

- [x] **Environment Separation**
  - .env files for different environments
  - Production settings hardened

**Gaps to Address:**

- [ ] **Server Configuration Review**
  - Nginx/Apache hardening
  - TLS 1.3 only
  - Disable unnecessary HTTP methods

- [ ] **Dependency Updates**
  - Regular npm audit
  - Automated dependency scanning

- [ ] **File Permissions**
  - Verify .env files are 600
  - Application files not world-writable

**Testing:**
```bash
# Run security audit
npm run security:audit

# Check headers
curl -I https://casaignat.ro

# Verify file permissions
find . -type f -perm /o+w
```

---

## A06:2021 – Vulnerable and Outdated Components

**Risk:** Using components with known vulnerabilities.

### Implementation Status: ⚠️ ONGOING MAINTENANCE

**Controls Implemented:**

- [x] **Dependency Tracking**
  - package.json with locked versions
  - package-lock.json committed

- [x] **Automated Scanning**
  - Security audit script
  - Location: `scripts/securityAudit.js`

**Required Actions:**

- [ ] **Weekly npm audit**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **Monthly updates**
  ```bash
  npm outdated
  npm update
  ```

- [ ] **Remove unused dependencies**
  ```bash
  npx depcheck
  ```

**Current Status:**
```bash
# Run this weekly
npm audit

# Fix non-breaking issues
npm audit fix

# Review breaking changes
npm audit fix --force
```

---

## A07:2021 – Identification and Authentication Failures

**Risk:** Weak authentication, session management issues.

### Implementation Status: ✅ PROTECTED

**Controls Implemented:**

- [x] **Multi-Factor Authentication**
  - 2FA with TOTP (speakeasy)
  - Backup codes (10 codes)
  - Location: `src/controllers/authController.js`

- [x] **Password Strength**
  - Complexity requirements enforced
  - Minimum 8 characters, mixed case, numbers, symbols
  - Common password blacklist
  - Location: `src/middleware/passwordValidation.js`

- [x] **Account Lockout**
  - 5 failed attempts = 30 min lockout
  - Location: `src/models/User.js`

- [x] **Secure Session Management**
  - httpOnly, secure, sameSite cookies
  - Session rotation on privilege change
  - MongoDB session store

- [x] **Password Reset Security**
  - Temporary tokens with expiration
  - Rate limited (3 per hour)

- [x] **JWT Token Management**
  - Short-lived access tokens (15 min)
  - Long-lived refresh tokens (7 days)
  - Multi-device support with revocation

**Testing:**
```bash
# Test account lockout
for i in {1..6}; do
  curl -X POST http://localhost:3000/admin/login \
    -d "email=test@test.com&password=wrong"
done
# 6th attempt should fail with lockout message

# Test 2FA
# Enable 2FA, try logging in without code
```

---

## A08:2021 – Software and Data Integrity Failures

**Risk:** Code and infrastructure without integrity verification.

### Implementation Status: ⚠️ PARTIAL

**Controls Implemented:**

- [x] **Dependency Integrity**
  - package-lock.json ensures consistent installs
  - npm ci in production

- [x] **File Upload Validation**
  - Magic number validation
  - Virus scanning (ClamAV)
  - Location: `src/middleware/secureUpload.js`

- [x] **Audit Logging**
  - All data modifications logged
  - Location: `src/models/AuditLog.js`

**Gaps:**

- [ ] **Subresource Integrity (SRI)**
  - Add for external CDN resources
  - Example:
    ```html
    <script src="https://cdn.example.com/lib.js"
            integrity="sha384-..."
            crossorigin="anonymous"></script>
    ```

- [ ] **Code Signing**
  - Consider signing releases
  - Verify npm package signatures

---

## A09:2021 – Security Logging and Monitoring Failures

**Risk:** Insufficient logging, delayed breach detection.

### Implementation Status: ✅ GOOD

**Controls Implemented:**

- [x] **Comprehensive Audit Logging**
  - Login/logout attempts
  - Data CRUD operations
  - Permission changes
  - Failed authentication
  - Location: `src/models/AuditLog.js`

- [x] **Security Event Logging**
  - Rate limit violations
  - Virus detections
  - CSRF violations
  - File upload security events

- [x] **GDPR Breach Logging**
  - Breach detection and notification tracking
  - 72-hour authority notification deadline tracked
  - Location: `src/models/BreachLog.js`

- [x] **Request Logging**
  - Morgan middleware
  - Development: 'dev' format
  - Production: 'combined' format

**Improvements Needed:**

- [ ] **Centralized Log Management**
  - Consider ELK stack or similar
  - Real-time alerting

- [ ] **Log Analysis**
  - Automated anomaly detection
  - Failed login pattern analysis

- [ ] **Backup and Retention**
  - Logs backed up regularly
  - Current retention: 90 days (audit logs)

**Alerts to Configure:**

- [ ] 10+ failed logins in 5 minutes
- [ ] Virus detected in upload
- [ ] GDPR breach detection
- [ ] Multiple rate limit violations
- [ ] Database connection failures

---

## A10:2021 – Server-Side Request Forgery (SSRF)

**Risk:** Application fetching remote resources without validation.

### Implementation Status: ✅ PROTECTED

**Controls Implemented:**

- [x] **No User-Controlled URLs**
  - Application doesn't fetch URLs based on user input

- [x] **Input Validation**
  - All external URLs validated
  - Whitelist approach for integrations

- [x] **Network Segmentation**
  - Database not directly accessible from web
  - Internal services on private network

**If URL fetching is added:**

- [ ] URL whitelist
- [ ] Deny access to private IPs (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16)
- [ ] Timeout limits
- [ ] Response size limits

---

## Overall Security Posture

### Summary

| Risk | Status | Priority |
|------|--------|----------|
| A01 - Broken Access Control | ✅ Protected | - |
| A02 - Cryptographic Failures | ✅ Protected | Medium |
| A03 - Injection | ✅ Protected | - |
| A04 - Insecure Design | ✅ Protected | - |
| A05 - Security Misconfiguration | ⚠️ Review | High |
| A06 - Vulnerable Components | ⚠️ Ongoing | High |
| A07 - Auth Failures | ✅ Protected | - |
| A08 - Integrity Failures | ⚠️ Partial | Medium |
| A09 - Logging Failures | ✅ Good | Low |
| A10 - SSRF | ✅ Protected | - |

**Overall Score: 80% (Good)**

### Immediate Actions Required

1. **Weekly:** Run `npm audit` and update dependencies
2. **Setup:** Configure database encryption at rest
3. **Review:** Server/reverse proxy security configuration
4. **Implement:** Centralized logging solution
5. **Add:** Subresource integrity for CDN resources

### Monthly Review Checklist

- [ ] Run full security audit: `npm run security:audit`
- [ ] Review audit logs for anomalies
- [ ] Update dependencies: `npm update`
- [ ] Check for new OWASP resources
- [ ] Test incident response procedures

---

**Document Owner:** Security Team
**Next Review:** 2024-02-18
