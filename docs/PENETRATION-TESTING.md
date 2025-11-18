# Penetration Testing Plan - Casa Ignat

## Overview

This document outlines the penetration testing strategy for Casa Ignat application.

**Version:** 1.0
**Last Updated:** 2024-01-18
**Frequency:** Annual (or after major releases)
**Type:** Gray Box Testing

---

## Testing Scope

### In-Scope

**Web Application:**
- Public website (https://casa-ignat.ro)
- Admin panel (/admin/*)
- API endpoints (/api/*)
- File upload functionality
- Authentication system
- Booking and appointment systems

**Infrastructure:**
- Web server configuration
- Database access controls
- SSL/TLS implementation
- DNS configuration

### Out-of-Scope

- Physical security
- Social engineering (unless explicitly approved)
- Third-party services (Google Analytics, payment processors)
- Denial of Service (DoS) attacks
- Destructive testing (data deletion)

---

## Testing Methodology

### Phase 1: Reconnaissance (Passive)

**Timeline:** 1-2 days

**Activities:**

1. **Information Gathering**
   ```bash
   # Subdomain enumeration
   subfinder -d casa-ignat.ro
   amass enum -d casa-ignat.ro

   # DNS records
   dig casa-ignat.ro ANY
   nslookup casa-ignat.ro

   # WHOIS information
   whois casa-ignat.ro
   ```

2. **Technology Stack Identification**
   ```bash
   # HTTP headers
   curl -I https://casa-ignat.ro

   # Technology detection
   whatweb https://casa-ignat.ro
   wappalyzer https://casa-ignat.ro
   ```

3. **Public Data Search**
   - GitHub repositories
   - Stack Overflow mentions
   - Code snippets online
   - Cached pages (Google, Archive.org)

**Expected Findings:**
- Server: Nginx
- Framework: Express.js (Node.js)
- Database: MongoDB
- CDN usage
- Third-party integrations

---

### Phase 2: Scanning (Active)

**Timeline:** 2-3 days

**Tools & Activities:**

1. **Port Scanning**
   ```bash
   # Full TCP scan
   nmap -sS -p- -T4 casa-ignat.ro

   # Service detection
   nmap -sV -p 80,443,3000,27017 casa-ignat.ro

   # Vulnerability scanning
   nmap --script vuln casa-ignat.ro
   ```

2. **Web Vulnerability Scanning**
   ```bash
   # OWASP ZAP
   zap-cli quick-scan --self-contained https://casa-ignat.ro

   # Nikto
   nikto -h https://casa-ignat.ro

   # WFUZZ (directory brute force)
   wfuzz -c -z file,/usr/share/wordlists/dirb/common.txt \
         --hc 404 https://casa-ignat.ro/FUZZ
   ```

3. **SSL/TLS Testing**
   ```bash
   # SSL Labs
   # Visit: https://www.ssllabs.com/ssltest/analyze.html?d=casa-ignat.ro

   # testssl.sh
   testssl.sh --full https://casa-ignat.ro

   # Check certificate
   openssl s_client -connect casa-ignat.ro:443 < /dev/null
   ```

**Areas to Check:**
- Open ports (should only be 80, 443)
- Outdated software versions
- SSL/TLS configuration (TLS 1.2+)
- HTTP security headers
- Directory listings

---

### Phase 3: Exploitation

**Timeline:** 5-7 days

#### 3.1 Authentication Testing

**Objectives:**
- Test login mechanism
- Brute force protection
- Session management
- Password reset functionality

**Test Cases:**

1. **Brute Force Protection**
   ```bash
   # Using Hydra
   hydra -l admin@casaignat.ro -P passwords.txt \
         casa-ignat.ro https-post-form \
         "/admin/login:email=^USER^&password=^PASS^:F=Invalid"
   ```
   **Expected:** Account lockout after 5 attempts

2. **Session Management**
   ```bash
   # Test session fixation
   # 1. Get session cookie before login
   # 2. Login
   # 3. Verify session cookie changed

   # Test session timeout
   # 1. Login
   # 2. Wait 24+ hours
   # 3. Try to access protected resource
   ```
   **Expected:** Session rotation, timeout enforced

3. **Password Reset**
   ```bash
   # Test token predictability
   # Request multiple password resets
   # Analyze tokens for patterns

   # Test token reuse
   # Use same reset token twice
   ```
   **Expected:** Random tokens, single-use only

4. **2FA Bypass**
   ```bash
   # Try accessing protected resources after username/password only
   # Try replaying 2FA codes
   # Test backup code functionality
   ```
   **Expected:** 2FA cannot be bypassed

#### 3.2 Authorization Testing

**Test Cases:**

1. **Vertical Privilege Escalation**
   ```bash
   # Login as editor
   # Try to access: /admin/settings (admin only)
   # Try to create users
   ```
   **Expected:** Access denied, redirect to 403

2. **Horizontal Privilege Escalation**
   ```bash
   # Login as User A
   # Try to access User B's data via ID manipulation
   # Example: /api/users/USER_B_ID
   ```
   **Expected:** Access denied

3. **IDOR (Insecure Direct Object Reference)**
   ```bash
   # Login, get booking ID
   # Increment/decrement ID
   # Try to access other users' bookings
   ```
   **Expected:** Authorization check prevents access

#### 3.3 Injection Testing

**Test Cases:**

1. **SQL/NoSQL Injection**
   ```javascript
   // Login form
   POST /admin/login
   {
     "email": {"$ne": null},
     "password": {"$ne": null}
   }
   ```
   **Expected:** Input sanitization blocks payload

2. **XSS (Cross-Site Scripting)**
   ```javascript
   // Comment form
   POST /blog/comment
   {
     "content": "<script>alert('XSS')</script>"
   }
   ```
   **Expected:** HTML encoded, script doesn't execute

3. **Command Injection**
   ```bash
   # File upload with malicious filename
   ; cat /etc/passwd
   | whoami
   && ls -la /
   ```
   **Expected:** Filename sanitized, UUID naming

4. **Path Traversal**
   ```bash
   # File upload
   POST /api/upload
   uploadType=../../../etc&file=malicious.txt
   ```
   **Expected:** Path sanitization blocks traversal

#### 3.4 File Upload Testing

**Test Cases:**

1. **Malicious File Upload**
   ```bash
   # Upload PHP shell
   curl -F "file=@shell.php.png" \
        -F "uploadType=gallery" \
        https://casa-ignat.ro/api/upload
   ```
   **Expected:** Magic number validation rejects

2. **Virus Upload**
   ```bash
   # Upload EICAR test file
   curl -F "file=@eicar.com" \
        https://casa-ignat.ro/api/upload
   ```
   **Expected:** ClamAV detects and quarantines

3. **Large File Upload**
   ```bash
   # Generate 100MB file
   dd if=/dev/zero of=large.jpg bs=1M count=100

   # Upload
   curl -F "file=@large.jpg" https://casa-ignat.ro/api/upload
   ```
   **Expected:** Size limit rejection

#### 3.5 CSRF Testing

**Test Cases:**

1. **CSRF Token Validation**
   ```html
   <!-- Create malicious page -->
   <form action="https://casa-ignat.ro/admin/settings" method="POST">
     <input name="siteName" value="Hacked">
     <input type="submit">
   </form>
   <script>document.forms[0].submit();</script>
   ```
   **Expected:** Request fails without valid CSRF token

2. **Token Reuse**
   ```bash
   # Get CSRF token from one session
   # Try to use in different session
   ```
   **Expected:** Token tied to session

#### 3.6 Rate Limiting Testing

**Test Cases:**

1. **Login Rate Limiting**
   ```python
   import requests

   for i in range(10):
       r = requests.post('https://casa-ignat.ro/admin/login', {
           'email': 'test@test.com',
           'password': 'wrong'
       })
       print(f"Attempt {i+1}: {r.status_code}")
   ```
   **Expected:** 429 status after 5 attempts

2. **API Rate Limiting**
   ```bash
   # Rapid API requests
   for i in {1..150}; do
     curl https://casa-ignat.ro/api/rooms &
   done
   ```
   **Expected:** Rate limit after 100 requests/15min

---

### Phase 4: GDPR Compliance Testing

**Timeline:** 2-3 days

**Test Cases:**

1. **Data Export (Right to Access)**
   ```bash
   # Request data export
   # Verify export contains all user data
   # Check export expiration (7 days)
   ```

2. **Data Deletion (Right to Erasure)**
   ```bash
   # Request account deletion
   # Verify 30-day grace period
   # Confirm anonymization/deletion
   ```

3. **Consent Management**
   ```bash
   # Reject all cookies
   # Verify analytics not loaded
   # Verify marketing pixels blocked
   ```

4. **Data Breach Notification**
   ```bash
   # Simulate breach detection
   # Verify notification workflow
   # Check 72-hour deadline tracking
   ```

---

### Phase 5: Business Logic Testing

**Timeline:** 3-4 days

**Test Cases:**

1. **Booking System**
   - [ ] Double booking prevention
   - [ ] Price manipulation
   - [ ] Date validation (past dates)
   - [ ] Capacity limits
   - [ ] Payment bypass

2. **Appointment System**
   - [ ] Overlapping appointments
   - [ ] Past date booking
   - [ ] Cancel after deadline
   - [ ] Modify other users' appointments

3. **Blog System**
   - [ ] Publish without permission
   - [ ] Modify others' posts
   - [ ] Comment spam
   - [ ] XSS in rich text editor

---

## Reporting

### Report Structure

1. **Executive Summary**
   - High-level findings
   - Risk rating
   - Recommendations

2. **Methodology**
   - Testing approach
   - Tools used
   - Timeline

3. **Detailed Findings**
   - For each vulnerability:
     - Description
     - Severity (Critical, High, Medium, Low)
     - Steps to reproduce
     - Proof of concept
     - Remediation

4. **Risk Rating**
   - CVSS scoring
   - Business impact
   - Likelihood

5. **Recommendations**
   - Prioritized action items
   - Best practices

### Severity Classification

| Severity | CVSS Score | Example |
|----------|------------|---------|
| **Critical** | 9.0-10.0 | Remote code execution, SQL injection |
| **High** | 7.0-8.9 | Authentication bypass, privilege escalation |
| **Medium** | 4.0-6.9 | XSS, CSRF, information disclosure |
| **Low** | 0.1-3.9 | Missing security headers, verbose errors |

---

## Tools Required

### Reconnaissance
- subfinder, amass (subdomain enumeration)
- whois, dig, nslookup
- whatweb, wappalyzer

### Scanning
- Nmap (port scanning)
- OWASP ZAP (vulnerability scanning)
- Nikto (web server scanning)
- Burp Suite (web proxy)

### Exploitation
- Burp Suite Pro
- SQLMap (SQL injection)
- Hydra (brute force)
- Metasploit Framework

### GDPR Testing
- Manual testing
- Cookie scanners
- Privacy audit tools

---

## Pre-Testing Checklist

- [ ] Scope defined and approved
- [ ] Rules of engagement signed
- [ ] Testing window scheduled
- [ ] Emergency contacts exchanged
- [ ] Backup plan in place
- [ ] Monitoring disabled during test (or alerts ignored)
- [ ] Non-production environment available for destructive tests

---

## Post-Testing Actions

1. **Immediate**
   - [ ] Debrief with security team
   - [ ] Validate critical findings
   - [ ] Emergency patches for critical issues

2. **Within 1 Week**
   - [ ] Full report delivered
   - [ ] Remediation plan created
   - [ ] Assign owners to findings

3. **Within 1 Month**
   - [ ] Re-test critical findings
   - [ ] Update security documentation
   - [ ] Team training on findings

---

## Contact Information

**Penetration Tester:**
- Name: [To be assigned]
- Email: [To be assigned]
- Phone: [To be assigned]

**Technical Contact:**
- Name: DevOps Lead
- Email: devops@casaignat.ro
- Phone: [Emergency only]

**Emergency Escalation:**
- Contact: DPO/Security Team
- Email: dpo@casaignat.ro

---

**Document Owner:** Security Team
**Approval:** Pending
**Next Test:** 2025-01-18
