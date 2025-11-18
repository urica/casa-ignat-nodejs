const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email-ul este obligatoriu'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalid'],
  },
  password: {
    type: String,
    required: [true, 'Parola este obligatorie'],
    minlength: [8, 'Parola trebuie să aibă cel puțin 8 caractere'],
    select: false,
  },
  name: {
    type: String,
    required: [true, 'Numele este obligatoriu'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'moderator'],
    default: 'editor',
  },
  avatar: {
    type: String,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },
  twoFactorBackupCodes: {
    type: [String],
    select: false,
  },
  lastLogin: {
    type: Date,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  permissions: {
    blog: {
      type: Boolean,
      default: true,
    },
    pages: {
      type: Boolean,
      default: true,
    },
    services: {
      type: Boolean,
      default: true,
    },
    team: {
      type: Boolean,
      default: true,
    },
    testimonials: {
      type: Boolean,
      default: true,
    },
    bookings: {
      type: Boolean,
      default: true,
    },
    media: {
      type: Boolean,
      default: true,
    },
    settings: {
      type: Boolean,
      default: false,
    },
    users: {
      type: Boolean,
      default: false,
    },
  },
  // JWT refresh tokens (supports multiple devices)
  refreshTokens: [{
    token: {
      type: String,
      required: true,
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      deviceId: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  }],
  // GDPR compliance
  gdprConsent: {
    accepted: {
      type: Boolean,
      default: false,
    },
    acceptedAt: {
      type: Date,
    },
    privacyPolicyVersion: {
      type: String,
    },
  },
  dataProcessingConsent: {
    analytics: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    thirdParty: { type: Boolean, default: false },
  },
  // Account deletion request (soft delete)
  deletionRequested: {
    type: Boolean,
    default: false,
  },
  deletionRequestedAt: {
    type: Date,
  },
  scheduledDeletionDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 }
  });
};

// Check permission
userSchema.methods.hasPermission = function(module) {
  if (this.role === 'admin') return true;
  return this.permissions[module] === true;
};

// Add refresh token
userSchema.methods.addRefreshToken = function(token, deviceInfo, expiresAt) {
  // Clean up expired tokens
  this.refreshTokens = this.refreshTokens.filter(
    rt => rt.expiresAt > new Date()
  );

  // Limit to 5 devices
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift(); // Remove oldest
  }

  this.refreshTokens.push({
    token,
    deviceInfo,
    expiresAt,
  });

  return this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  return this.save();
};

// Check if refresh token is valid
userSchema.methods.hasValidRefreshToken = function(token) {
  const refreshToken = this.refreshTokens.find(rt => rt.token === token);
  if (!refreshToken) return false;
  return refreshToken.expiresAt > new Date();
};

// Remove all refresh tokens (logout from all devices)
userSchema.methods.removeAllRefreshTokens = function() {
  this.refreshTokens = [];
  return this.save();
};

// Validate password complexity
userSchema.statics.validatePasswordComplexity = function(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Parola trebuie să aibă cel puțin 8 caractere');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Parola trebuie să conțină cel puțin o literă mică');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Parola trebuie să conțină cel puțin o literă mare');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Parola trebuie să conțină cel puțin o cifră');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Parola trebuie să conțină cel puțin un caracter special (!@#$%^&*(),.?":{}|<>)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = mongoose.model('User', userSchema);
