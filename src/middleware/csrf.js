const crypto = require('crypto');

// Generate CSRF token
exports.generateToken = (req) => {
  const token = crypto.randomBytes(32).toString('hex');
  req.session.csrfToken = token;
  return token;
};

// Middleware to add CSRF token to all responses
exports.addToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

// Verify CSRF token
exports.verifyToken = (req, res, next) => {
  // Skip verification for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.body._csrf || req.headers['x-csrf-token'] || req.query._csrf;
  const sessionToken = req.session.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.status(403).json({
        success: false,
        message: 'Token CSRF invalid',
      });
    }
    return res.status(403).render('pages/error', {
      title: 'Eroare',
      message: 'Token CSRF invalid. Vă rugăm reîncercați.',
    });
  }

  next();
};
