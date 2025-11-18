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

module.exports = mongoose.model('User', userSchema);
