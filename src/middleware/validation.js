const { validationResult } = require('express-validator');

// Handle validation errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);

    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.status(400).json({
        success: false,
        message: 'Erori de validare',
        errors: errorMessages,
      });
    }

    req.flash = req.flash || {};
    req.flash.error = errorMessages;
    return res.redirect('back');
  }

  next();
};

// Sanitize input
exports.sanitize = (field) => {
  return (req, res, next) => {
    if (req.body[field]) {
      req.body[field] = req.body[field].trim();
    }
    next();
  };
};
