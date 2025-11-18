// Simple session-based authentication middleware
// This is a basic implementation - can be extended with passport.js or JWT

exports.requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }

  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(401).json({
      success: false,
      message: 'Trebuie să fiți autentificat pentru a accesa această resursă.',
    });
  }

  res.redirect('/admin/login');
};

exports.isAuthenticated = (req, res, next) => {
  res.locals.isAuthenticated = req.session && req.session.user;
  next();
};

exports.setUser = (req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
  }
  next();
};
