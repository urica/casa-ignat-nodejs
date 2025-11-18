const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');

/**
 * Rate Limiting Middleware
 * Protects against brute force and DDoS attacks
 */

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Prea multe cereri din această adresă IP. Vă rugăm încercați din nou mai târziu.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use MongoDB store for distributed rate limiting
  store: process.env.MONGODB_URI ? new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'rateLimits',
    expireTimeMs: 15 * 60 * 1000,
  }) : undefined,
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Prea multe încercări de autentificare. Contul dvs. a fost blocat temporar. Încercați din nou în 15 minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: process.env.MONGODB_URI ? new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'authRateLimits',
    expireTimeMs: 15 * 60 * 1000,
  }) : undefined,
  // Custom key generator (by IP and email)
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const email = req.body.email || '';
    return `${ip}-${email}`;
  },
  // Skip rate limiting for whitelisted IPs
  skip: (req) => {
    const whitelistedIPs = (process.env.RATE_LIMIT_WHITELIST || '').split(',').filter(Boolean);
    const clientIP = req.ip || req.connection.remoteAddress;
    return whitelistedIPs.includes(clientIP);
  },
  // Handler for rate limit exceeded
  handler: (req, res) => {
    // Log the rate limit violation
    const AuditLog = require('../models/AuditLog');
    AuditLog.create({
      email: req.body.email,
      action: 'rate_limit_exceeded',
      resource: 'auth',
      details: {
        path: req.path,
        attempts: req.rateLimit?.current || 0,
      },
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status: 'warning',
    }).catch(err => console.error('Error logging rate limit:', err));

    if (req.path.startsWith('/api/')) {
      return res.status(429).json({
        success: false,
        message: 'Prea multe încercări de autentificare. Încercați din nou în 15 minute.',
        retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000,
      });
    }

    req.flash('error', 'Prea multe încercări de autentificare. Încercați din nou în 15 minute.');
    return res.redirect('/admin/login');
  },
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message: 'Prea multe cereri de resetare parolă. Încercați din nou mai târziu.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body.email || req.params.email || '';
    return `password-reset-${email}`;
  },
});

/**
 * Registration rate limiter
 */
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    message: 'Prea multe încercări de înregistrare. Încercați din nou mai târziu.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Contact form rate limiter
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour
  message: {
    success: false,
    message: 'Ați trimis prea multe mesaje. Vă rugăm așteptați înainte de a trimite un alt mesaj.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Booking rate limiter
 */
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bookings per hour
  message: {
    success: false,
    message: 'Prea multe rezervări într-o perioadă scurtă. Vă rugăm încercați din nou mai târziu.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes
  message: {
    success: false,
    message: 'Prea multe încărcări de fișiere. Încercați din nou mai târziu.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Comment rate limiter
 */
const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 comments per hour
  message: {
    success: false,
    message: 'Prea multe comentarii într-o perioadă scurtă. Încercați din nou mai târziu.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 2FA verification rate limiter
 */
const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: {
    success: false,
    message: 'Prea multe încercări de verificare 2FA. Încercați din nou mai târziu.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Data export rate limiter (GDPR)
 */
const dataExportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 exports per day
  message: {
    success: false,
    message: 'Ați atins limita de exporturi pentru astăzi. Încercați din nou mâine.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Custom rate limiter factory
 */
const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Prea multe cereri. Încercați din nou mai târziu.',
    },
  };

  return rateLimit({ ...defaults, ...options });
};

/**
 * Sliding window rate limiter (more precise)
 */
const slidingWindowLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    // Skip failed requests
    skipFailedRequests: options.skipFailedRequests || false,
    // Skip successful requests
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    message: options.message || {
      success: false,
      message: 'Prea multe cereri. Încercați din nou mai târziu.',
    },
  });
};

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  registrationLimiter,
  contactLimiter,
  bookingLimiter,
  uploadLimiter,
  commentLimiter,
  twoFactorLimiter,
  dataExportLimiter,
  createRateLimiter,
  slidingWindowLimiter,
};
