const ConsentTracking = require('../models/ConsentTracking');

/**
 * GDPR Middleware
 * Handles consent tracking and verification
 */

/**
 * Track consent from request
 */
const trackConsent = async (req, res, next) => {
  try {
    const consentData = req.body.consent || req.cookies.consent;

    if (!consentData) {
      return next();
    }

    const identifier = req.user?.id || req.user?.email || req.session.id;

    if (!identifier) {
      return next();
    }

    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      consentMethod: req.body.consentMethod || 'banner',
      privacyPolicyVersion: req.body.privacyPolicyVersion || '1.0',
    };

    await ConsentTracking.updateConsent(identifier, consentData, metadata);

    next();
  } catch (error) {
    console.error('Error tracking consent:', error);
    next(); // Don't block request on consent tracking error
  }
};

/**
 * Check if user has given consent for specific category
 */
const requireConsent = (category) => {
  return async (req, res, next) => {
    try {
      const identifier = req.user?.id || req.user?.email || req.session.id;

      if (!identifier) {
        // For non-authenticated users, check cookie consent
        const cookieConsent = req.cookies.consent;
        if (cookieConsent && cookieConsent[category]) {
          return next();
        }

        return res.status(403).json({
          success: false,
          message: 'Trebuie să acceptați consimțământul pentru această funcționalitate',
          requiredConsent: category,
        });
      }

      const consent = await ConsentTracking.getActiveConsent(identifier);

      if (!consent || !consent.hasConsent(category)) {
        if (req.path.startsWith('/api/')) {
          return res.status(403).json({
            success: false,
            message: `Trebuie să acceptați consimțământul pentru ${category}`,
            requiredConsent: category,
          });
        }

        req.flash('error', 'Trebuie să acceptați consimțământul pentru această funcționalitate');
        return res.redirect('/privacy/consent');
      }

      next();
    } catch (error) {
      console.error('Error checking consent:', error);
      next(error);
    }
  };
};

/**
 * Get user consent status
 */
const getConsentStatus = async (req, res, next) => {
  try {
    const identifier = req.user?.id || req.user?.email || req.session.id;

    if (!identifier) {
      req.consentStatus = null;
      return next();
    }

    const consent = await ConsentTracking.getActiveConsent(identifier);
    req.consentStatus = consent;

    // Make consent status available in views
    res.locals.consentStatus = consent;

    next();
  } catch (error) {
    console.error('Error getting consent status:', error);
    req.consentStatus = null;
    next();
  }
};

/**
 * Initialize consent from cookie
 */
const initializeConsent = (req, res, next) => {
  const cookieConsent = req.cookies.cookieConsent;

  if (cookieConsent) {
    try {
      const consent = JSON.parse(cookieConsent);
      res.locals.hasConsent = consent;
      req.consent = consent;
    } catch (error) {
      console.error('Error parsing cookie consent:', error);
    }
  }

  next();
};

/**
 * Set consent cookie
 */
const setConsentCookie = (res, consent, maxAge = 365 * 24 * 60 * 60 * 1000) => {
  res.cookie('cookieConsent', JSON.stringify(consent), {
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

/**
 * Clear consent cookie
 */
const clearConsentCookie = (res) => {
  res.clearCookie('cookieConsent');
};

/**
 * Middleware to block analytics if no consent
 */
const blockAnalyticsWithoutConsent = (req, res, next) => {
  const consent = req.consent || {};

  if (!consent.analytics) {
    res.locals.disableAnalytics = true;
  }

  next();
};

/**
 * Middleware to block marketing if no consent
 */
const blockMarketingWithoutConsent = (req, res, next) => {
  const consent = req.consent || {};

  if (!consent.marketing) {
    res.locals.disableMarketing = true;
  }

  next();
};

/**
 * Middleware to add GDPR headers
 */
const addGDPRHeaders = (req, res, next) => {
  // Add header to indicate GDPR compliance
  res.setHeader('X-GDPR-Compliant', 'true');

  // Add header for consent status
  if (req.consent) {
    res.setHeader('X-Consent-Status', JSON.stringify({
      analytics: !!req.consent.analytics,
      marketing: !!req.consent.marketing,
      preferences: !!req.consent.preferences,
    }));
  }

  next();
};

/**
 * Middleware to log data access for audit trail
 */
const logDataAccess = (resourceType) => {
  return (req, res, next) => {
    if (req.user) {
      // Log access to audit trail
      const AuditLog = require('../models/AuditLog');

      AuditLog.create({
        user: req.user.id,
        action: 'access',
        resource: resourceType,
        details: {
          method: req.method,
          path: req.path,
        },
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success',
      }).catch(err => console.error('Error logging data access:', err));
    }

    next();
  };
};

/**
 * Sanitize user data for export (remove sensitive fields)
 */
const sanitizeUserData = (userData) => {
  const sanitized = { ...userData };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.twoFactorSecret;
  delete sanitized.twoFactorBackupCodes;
  delete sanitized.passwordResetToken;
  delete sanitized.passwordResetExpires;
  delete sanitized.refreshTokens;

  return sanitized;
};

/**
 * Check if consent has expired
 */
const checkConsentExpiry = async (req, res, next) => {
  try {
    const identifier = req.user?.id || req.user?.email || req.session.id;

    if (!identifier) {
      return next();
    }

    const consent = await ConsentTracking.getActiveConsent(identifier);

    if (consent && consent.isExpired()) {
      // Deactivate expired consent
      consent.isActive = false;
      await consent.save();

      // Notify user to renew consent
      req.consentExpired = true;
      res.locals.consentExpired = true;
    }

    next();
  } catch (error) {
    console.error('Error checking consent expiry:', error);
    next();
  }
};

/**
 * Require GDPR acceptance for certain actions
 */
const requireGDPRAcceptance = (req, res, next) => {
  if (req.user && !req.user.gdprConsent?.accepted) {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({
        success: false,
        message: 'Trebuie să acceptați politica de confidențialitate pentru a continua',
        redirectTo: '/privacy/policy',
      });
    }

    req.flash('warning', 'Trebuie să acceptați politica de confidențialitate pentru a continua');
    return res.redirect('/privacy/policy');
  }

  next();
};

module.exports = {
  trackConsent,
  requireConsent,
  getConsentStatus,
  initializeConsent,
  setConsentCookie,
  clearConsentCookie,
  blockAnalyticsWithoutConsent,
  blockMarketingWithoutConsent,
  addGDPRHeaders,
  logDataAccess,
  sanitizeUserData,
  checkConsentExpiry,
  requireGDPRAcceptance,
};
