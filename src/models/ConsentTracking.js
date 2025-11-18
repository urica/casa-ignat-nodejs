const mongoose = require('mongoose');

/**
 * ConsentTracking Model
 * Tracks user consent for GDPR compliance
 */
const consentTrackingSchema = new mongoose.Schema({
  // User information (can be null for non-registered users)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // For non-registered users, track by email or session ID
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },

  sessionId: {
    type: String,
  },

  // Consent categories
  consent: {
    necessary: {
      type: Boolean,
      default: true, // Always true, cannot be disabled
      required: true,
    },
    analytics: {
      type: Boolean,
      default: false,
    },
    marketing: {
      type: Boolean,
      default: false,
    },
    preferences: {
      type: Boolean,
      default: false,
    },
    thirdParty: {
      type: Boolean,
      default: false,
    },
  },

  // Tracking information
  consentDate: {
    type: Date,
    default: Date.now,
    required: true,
  },

  lastUpdated: {
    type: Date,
    default: Date.now,
  },

  // User agent and IP for audit trail
  ipAddress: {
    type: String,
    required: true,
  },

  userAgent: {
    type: String,
  },

  // Consent method
  consentMethod: {
    type: String,
    enum: ['banner', 'preferences', 'registration', 'api'],
    default: 'banner',
  },

  // Version of privacy policy accepted
  privacyPolicyVersion: {
    type: String,
    default: '1.0',
  },

  // Expiration date (GDPR requires re-consent after certain period)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  },

  // Whether consent is still valid
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
consentTrackingSchema.index({ user: 1, isActive: 1 });
consentTrackingSchema.index({ email: 1, isActive: 1 });
consentTrackingSchema.index({ sessionId: 1 });
consentTrackingSchema.index({ expiresAt: 1 });
consentTrackingSchema.index({ createdAt: 1 });

// TTL index to auto-delete expired consents after 2 years
consentTrackingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Methods
consentTrackingSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

consentTrackingSchema.methods.hasConsent = function(category) {
  if (this.isExpired() || !this.isActive) {
    return false;
  }
  return this.consent[category] === true;
};

// Static methods
consentTrackingSchema.statics.getActiveConsent = async function(identifier) {
  const query = {
    isActive: true,
    expiresAt: { $gt: new Date() },
  };

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.user = identifier;
  } else if (identifier.includes('@')) {
    query.email = identifier;
  } else {
    query.sessionId = identifier;
  }

  return this.findOne(query).sort({ createdAt: -1 });
};

consentTrackingSchema.statics.updateConsent = async function(identifier, consentData, metadata) {
  // Deactivate old consents
  const query = {};
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.user = identifier;
  } else if (identifier.includes('@')) {
    query.email = identifier;
  } else {
    query.sessionId = identifier;
  }

  await this.updateMany(query, { isActive: false });

  // Create new consent record
  return this.create({
    ...query,
    consent: consentData,
    ...metadata,
  });
};

module.exports = mongoose.model('ConsentTracking', consentTrackingSchema);
