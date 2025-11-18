const { body, validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * Password Validation Middleware
 * Enforces password complexity requirements for security
 */

/**
 * Password complexity validation rules
 */
const passwordComplexityRules = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Parola trebuie să aibă cel puțin 8 caractere')
    .matches(/[a-z]/)
    .withMessage('Parola trebuie să conțină cel puțin o literă mică')
    .matches(/[A-Z]/)
    .withMessage('Parola trebuie să conțină cel puțin o literă mare')
    .matches(/[0-9]/)
    .withMessage('Parola trebuie să conțină cel puțin o cifră')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Parola trebuie să conțină cel puțin un caracter special (!@#$%^&*(),.?":{}|<>)')
    .custom((value) => {
      // Additional check for common passwords
      const commonPasswords = [
        'password', 'password123', '12345678', 'qwerty', 'abc123',
        'password1', 'admin', 'admin123', 'root', 'user',
      ];

      if (commonPasswords.includes(value.toLowerCase())) {
        throw new Error('Această parolă este prea comună. Alegeți o parolă mai sigură.');
      }

      return true;
    }),
];

/**
 * Password confirmation validation
 */
const passwordConfirmationRules = [
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Parolele nu se potrivesc');
      }
      return true;
    }),
];

/**
 * Old password validation (for password change)
 */
const oldPasswordValidation = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Parola veche este obligatorie'),
];

/**
 * Validate password complexity using User model method
 */
const validatePasswordComplexity = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Parola este obligatorie',
    });
  }

  const validation = User.validatePasswordComplexity(password);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Parola nu îndeplinește cerințele de complexitate',
      errors: validation.errors,
    });
  }

  next();
};

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // For API requests
    if (req.path.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        message: 'Erori de validare',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }

    // For web requests
    const errorMessages = errors.array().map(err => err.msg);
    req.flash('error', errorMessages.join('. '));

    return res.redirect('back');
  }

  next();
};

/**
 * Password strength meter helper
 */
const getPasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    extraLength: password.length >= 16,
  };

  // Calculate strength (0-100)
  Object.values(checks).forEach(check => {
    if (check) strength += 16.67;
  });

  let label = 'Foarte slabă';
  let color = 'danger';

  if (strength >= 80) {
    label = 'Foarte puternică';
    color = 'success';
  } else if (strength >= 60) {
    label = 'Puternică';
    color = 'info';
  } else if (strength >= 40) {
    label = 'Medie';
    color = 'warning';
  } else if (strength >= 20) {
    label = 'Slabă';
    color = 'warning';
  }

  return {
    strength: Math.round(strength),
    label,
    color,
    checks,
  };
};

/**
 * Middleware to add password strength to response
 */
const addPasswordStrength = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    if (req.body.password && req.method === 'POST') {
      const strength = getPasswordStrength(req.body.password);
      data.passwordStrength = strength;
    }
    return originalJson(data);
  };

  next();
};

/**
 * Check if password was recently used (prevent password reuse)
 */
const checkPasswordReuse = async (req, res, next) => {
  try {
    const { password } = req.body;
    const userId = req.user?.id || req.params.id;

    if (!userId || !password) {
      return next();
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      return next();
    }

    // Check if new password is same as current password
    const isSamePassword = await user.comparePassword(password);

    if (isSamePassword) {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({
          success: false,
          message: 'Nu puteți folosi aceeași parolă. Alegeți o parolă diferită.',
        });
      }

      req.flash('error', 'Nu puteți folosi aceeași parolă. Alegeți o parolă diferită.');
      return res.redirect('back');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  passwordComplexityRules,
  passwordConfirmationRules,
  oldPasswordValidation,
  validatePasswordComplexity,
  handleValidationErrors,
  getPasswordStrength,
  addPasswordStrength,
  checkPasswordReuse,
};
