# Security Documentation - Casa Ignat

## Overview

This document outlines the comprehensive security measures and GDPR compliance implementations for the Casa Ignat application.

**Last Updated:** 2024-01-18
**Version:** 1.0
**Classification:** Internal Use

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [File Upload Security](#file-upload-security)
4. [GDPR Compliance](#gdpr-compliance)
5. [Security Headers](#security-headers)
6. [Rate Limiting](#rate-limiting)
7. [Audit Logging](#audit-logging)
8. [Security Checklist](#security-checklist)
9. [Incident Response](#incident-response)

---

## Authentication & Authorization

### Password Security

**Implementation:**
- **Hashing:** bcrypt with 12 rounds (production), 10 rounds (development)
- **Complexity Requirements:**
  - Minimum 8 characters
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number
  - At least one special character (!@#$%^&*(),.?":{}|<>)
  - No common passwords (blacklist check)

**Location:** `src/middleware/passwordValidation.js`, `src/models/User.js`

### Account Lockout

- **Threshold:** 5 failed login attempts
- **Lockout Duration:** 30 minutes
- **Location:** `src/models/User.js:131-150`

### Two-Factor Authentication (2FA)

- **Method:** TOTP (Time-based One-Time Password) via speakeasy
- **Backup Codes:** 10 one-time use codes generated during setup
- **QR Code:** Generated for easy mobile app setup
- **Location:** `src/controllers/authController.js`

### JWT Token System

**Access Tokens:**
- Expiration: 15 minutes
- Use: API authentication
- Storage: httpOnly cookies

**Refresh Tokens:**
- Expiration: 7 days
- Multi-device support (up to 5 devices)
- Stored in User model with device information
- Location: `src/utils/jwtUtils.js`

### Role-Based Access Control (RBAC)

**Roles:**
- `admin` - Full system access
- `editor` - Content management
- `moderator` - Comment moderation

**Permissions (Granular):**
- blog, pages, services, team, testimonials, bookings, media, settings, users

**Middleware:** `src/middleware/auth.js`

---

## Data Protection

### Input Validation & Sanitization

1. **NoSQL Injection Prevention**
   - Middleware: `express-mongo-sanitize`
   - Location: `src/app.js`

2. **XSS Protection**
   - Middleware: `xss-clean`
   - Content Security Policy headers
   - Location: `src/app.js`

3. **CSRF Protection**
   - Token-based validation for state-changing operations
   - Applied to `/admin` routes
   - Location: `src/middleware/csrf.js`

4. **SQL Injection**
   - Using Mongoose ODM (parameterized queries)
   - Input validation with express-validator

### Data Encryption

- **In Transit:** TLS/SSL (HTTPS enforced in production)
- **At Rest:**
  - Database: MongoDB with encryption at rest (recommended)
  - Passwords: bcrypt hashing
  - 2FA secrets: Encrypted in database (select: false)
  - JWT tokens: Signed with secret key

---

## File Upload Security

**Location:** `src/middleware/secureUpload.js`

### Features

1. **UUID File Naming**
   - Prevents directory traversal
   - Ensures unique filenames
   - Format: `{uuid}{extension}`

2. **File Type Validation**
   - MIME type checking
   - Magic number (file signature) validation
   - Allowed types: JPEG, PNG, WebP, GIF, PDF

3. **Virus Scanning**
   - Integration: ClamAV (clamscan)
   - Automatic quarantine of infected files
   - Location: `public/uploads/quarantine/`

4. **Size Limits**
   - Default: 5MB per file
   - Maximum 10 files per request
   - Configurable via `MAX_FILE_SIZE` environment variable

5. **Path Traversal Prevention**
   - Whitelist of allowed upload directories
   - Sanitization of upload paths
   - Rejected: `../`, `/`, special characters

### Quarantine Process

Infected or suspicious files are moved to:
```
public/uploads/quarantine/{reason}-{timestamp}-{filename}
```

Automatic cleanup after 30 days via cron job.

---

## GDPR Compliance

### Data Subject Rights

**Location:** `src/services/gdprService.js`, `src/controllers/privacyController.js`

1. **Right to Access**
   - Users can export all their data
   - Format: JSON, CSV, XML (machine-readable)
   - Includes: profile, consents, bookings, appointments, comments
   - Expiration: 7 days

2. **Right to Rectification**
   - Users can request data correction
   - Request system tracks and verifies changes

3. **Right to Erasure (Right to be Forgotten)**
   - **Method:** Anonymization (default) or hard delete
   - **Grace Period:** 30 days (cancellable)
   - **Retention:** Legal/financial records kept anonymized
   - **Process:**
     ```
     User data → Anonymized (email: deleted-{userId}@anonymized.local)
     Related data → Anonymized or deleted based on legal requirements
     Audit logs → Retained for legal compliance
     ```

4. **Right to Portability**
   - Machine-readable exports (JSON, CSV, XML)
   - Includes all personal data in structured format

5. **Right to Object**
   - Users can object to processing for specific purposes
   - Marketing, profiling, automated decision-making

### Consent Management

**Location:** `src/models/ConsentTracking.js`, `src/middleware/gdpr.js`

**Categories:**
- Necessary (always active)
- Analytics (Google Analytics with IP anonymization)
- Marketing (Facebook Pixel, email campaigns)
- Preferences (personalization)
- Third-party (embedded content)

**Features:**
- Granular control per category
- Expiration: 1 year (re-consent required)
- Audit trail: IP, user agent, timestamp
- Cookie banner: `/views/partials/cookie-banner.ejs`

### Data Breach Notification

**Location:** `src/models/BreachLog.js`

**Process:**
1. **Detection:** Security team or automated systems detect breach
2. **Assessment:**
   - Severity: low, medium, high, critical
   - Affected data types and user count
3. **Notification:**
   - **Authority:** 72 hours to notify GDPR supervisory authority
   - **Users:** If high-risk breach, direct notification required
4. **Resolution:** Containment, remediation, preventive measures
5. **Documentation:** Full audit trail maintained

**Fields Tracked:**
- Breach ID, type, severity
- Affected users and data types
- Timeline (detected, contained, resolved)
- Impact assessment (confidentiality, integrity, availability)
- Notification status and timestamps

### Privacy Policy & Cookie Policy

**Routes:** `/privacy/policy`, `/privacy/cookies`
**Views:** `views/privacy/`
**Version:** 1.0
**Last Updated:** 2024-01-01

---

## Security Headers

**Location:** `src/app.js`

**Implemented Headers (via Helmet.js):**

```javascript
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;

X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Rate Limiting

**Location:** `src/middleware/rateLimiter.js`

### Implemented Limiters

| Endpoint | Window | Max Requests | Purpose |
|----------|--------|--------------|---------|
| `/api/*` | 15 min | 100 | General API |
| `/admin/login` | 15 min | 5 | Brute force prevention |
| `/api/auth/*` | 15 min | 5 | Auth endpoints |
| `/password-reset` | 1 hour | 3 | Password reset |
| `/register` | 1 hour | 3 | Registration |
| `/contact` | 1 hour | 5 | Contact form |
| `/upload` | 15 min | 20 | File uploads |
| `/privacy/export-data` | 24 hours | 3 | Data export (GDPR) |

**Storage:** MongoDB (distributed rate limiting support)
**Whitelisting:** Configurable via `RATE_LIMIT_WHITELIST` env var

---

## Audit Logging

**Location:** `src/models/AuditLog.js`, `src/middleware/auditLog.js`

### Logged Events

**Authentication:**
- login, logout, login_failed
- 2fa_enable, 2fa_disable
- password_change, password_reset

**Data Operations:**
- create, update, delete, publish

**GDPR:**
- account_deleted, deletion_requested, deletion_cancelled
- data_export, consent_update

**Security:**
- rate_limit_exceeded, virus_detected, file_upload
- unauthorized_access

### Log Fields

- User ID and email
- Action and resource
- IP address and user agent
- Timestamp
- Status (success, failed, warning)
- Details (JSON)

**Retention:** 90 days (TTL index auto-deletion)

---

## Security Checklist

### Pre-Deployment

- [ ] All environment variables set in production
- [ ] Secrets are strong (32+ characters)
- [ ] HTTPS enforced (APP_URL uses https://)
- [ ] Database authentication configured
- [ ] Session secrets rotated
- [ ] NPM audit clean (no high/critical vulnerabilities)
- [ ] File permissions secure (600 for .env files)
- [ ] ClamAV configured and running
- [ ] Backups configured
- [ ] Error handling doesn't leak sensitive info

### Regular Maintenance

- [ ] Weekly: Run `npm audit` and update dependencies
- [ ] Monthly: Review audit logs for anomalies
- [ ] Monthly: Test backup restoration
- [ ] Quarterly: Update SSL certificates
- [ ] Quarterly: Review and update security policies
- [ ] Annually: Third-party security audit
- [ ] Annually: Penetration testing

### Monitoring

- [ ] Failed login attempts monitored
- [ ] Rate limit violations tracked
- [ ] Virus scan results reviewed
- [ ] Data breach monitoring active
- [ ] GDPR request processing times within 30 days

---

## Incident Response

### Security Breach Response Plan

**1. Detection & Assessment (0-2 hours)**
- Identify breach type and scope
- Assess affected data and users
- Create breach log entry

**2. Containment (2-6 hours)**
- Isolate affected systems
- Revoke compromised credentials
- Block malicious IPs
- Mark breach as "contained"

**3. Notification (6-72 hours)**
- If high-risk: Notify GDPR supervisory authority within 72 hours
- If critical: Direct user notification via email
- Internal stakeholder notification

**4. Recovery & Remediation**
- Restore from clean backups
- Patch vulnerabilities
- Implement preventive measures
- Update security policies

**5. Post-Incident Review**
- Root cause analysis
- Document lessons learned
- Update incident response plan
- Security training for team

### Contact Information

**Data Protection Officer:**
Email: dpo@casaignat.ro
Phone: +40 XXX XXX XXX

**GDPR Supervisory Authority:**
ANSPDCP (Romania)
Website: https://www.dataprotection.ro/

---

## Running Security Audit

Execute the automated security audit:

```bash
npm run security:audit
# or
node scripts/securityAudit.js
```

**Report Location:** `security-audit-report.json`

**Score Interpretation:**
- 90-100%: Excellent 🏆
- 75-89%: Good ✅
- 50-74%: Needs Improvement ⚠️
- <50%: Critical ❌

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GDPR Official Text](https://gdpr-info.eu/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Document Maintained By:** Security Team
**Next Review:** 2024-07-18
