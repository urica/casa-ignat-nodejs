const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Check if user is authenticated
exports.requireAuth = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);

      if (!user || !user.isActive) {
        req.session.destroy();
        return res.redirect('/admin/login');
      }

      req.user = user;
      res.locals.user = user;
      return next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.redirect('/admin/login');
    }
  }

  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(401).json({
      success: false,
      message: 'Trebuie să fiți autentificat pentru a accesa această resursă.',
    });
  }

  res.redirect('/admin/login');
};

// Check if user is authenticated (soft check - doesn't redirect)
exports.isAuthenticated = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user && user.isActive) {
        req.user = user;
        res.locals.user = user;
        res.locals.isAuthenticated = true;
      }
    } catch (error) {
      console.error('isAuthenticated error:', error);
    }
  }
  next();
};

// Check if user has specific role
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentificare necesară',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Nu aveți permisiunea necesară pentru această acțiune',
      });
    }

    next();
  };
};

// Check if user has permission for specific module
exports.requirePermission = (module) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentificare necesară',
      });
    }

    if (!req.user.hasPermission(module)) {
      return res.status(403).json({
        success: false,
        message: `Nu aveți permisiunea de a accesa modulul ${module}`,
      });
    }

    next();
  };
};

// Check 2FA if enabled
exports.require2FA = (req, res, next) => {
  if (req.user && req.user.twoFactorEnabled && !req.session.twoFactorVerified) {
    return res.redirect('/admin/verify-2fa');
  }
  next();
};

// Redirect if already authenticated
exports.redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/admin');
  }
  next();
};
