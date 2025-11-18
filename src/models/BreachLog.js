const mongoose = require('mongoose');

/**
 * BreachLog Model
 * Tracks security breaches for GDPR compliance
 * GDPR Article 33 & 34 - Breach notification requirements
 */
const breachLogSchema = new mongoose.Schema({
  // Breach identification
  breachId: {
    type: String,
    unique: true,
    required: true,
  },

  // Breach details
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },

  description: {
    type: String,
    required: true,
  },

  // Breach classification
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },

  breachType: {
    type: String,
    enum: [
      'unauthorized_access',
      'data_loss',
      'data_theft',
      'ransomware',
      'ddos',
      'phishing',
      'malware',
      'insider_threat',
      'misconfiguration',
      'other',
    ],
    required: true,
  },

  // Affected data
  dataTypes: [{
    type: String,
    enum: [
      'personal_identifiable',
      'financial',
      'health',
      'authentication',
      'location',
      'behavioral',
      'communication',
      'other',
    ],
  }],

  affectedRecordsCount: {
    type: Number,
    default: 0,
  },

  affectedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // Timeline
  detectedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },

  occurredAt: {
    type: Date, // When the breach actually happened (may be before detection)
  },

  containedAt: {
    type: Date, // When the breach was contained
  },

  resolvedAt: {
    type: Date, // When the breach was fully resolved
  },

  // Status
  status: {
    type: String,
    enum: ['detected', 'investigating', 'contained', 'resolved', 'closed'],
    default: 'detected',
  },

  // Impact assessment
  impactAssessment: {
    confidentiality: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'medium',
    },
    integrity: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'medium',
    },
    availability: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'medium',
    },
  },

  // Root cause analysis
  rootCause: {
    type: String,
  },

  vulnerabilityDetails: {
    type: String,
  },

  // Remediation
  remediationSteps: [{
    description: String,
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],

  preventiveMeasures: {
    type: String,
  },

  // Notification requirements (GDPR - 72 hours to notify authority)
  requiresAuthorityNotification: {
    type: Boolean,
    default: false,
  },

  authorityNotifiedAt: {
    type: Date,
  },

  authorityNotificationDetails: {
    type: String,
  },

  requiresUserNotification: {
    type: Boolean,
    default: false,
  },

  usersNotifiedAt: {
    type: Date,
  },

  userNotificationMethod: {
    type: String,
    enum: ['email', 'sms', 'in_app', 'public_notice'],
  },

  // Responsible parties
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Evidence and documentation
  evidenceFiles: [{
    filename: String,
    filepath: String,
    uploadedAt: Date,
  }],

  externalReferences: [{
    type: String, // URLs to external reports, tickets, etc.
  }],

  // Internal notes
  internalNotes: {
    type: String,
  },

  // Costs
  estimatedCost: {
    type: Number,
    default: 0,
  },

  actualCost: {
    type: Number,
  },

  // Follow-up
  followUpRequired: {
    type: Boolean,
    default: true,
  },

  followUpDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
breachLogSchema.index({ breachId: 1 }, { unique: true });
breachLogSchema.index({ status: 1, severity: 1 });
breachLogSchema.index({ detectedAt: -1 });
breachLogSchema.index({ requiresAuthorityNotification: 1, authorityNotifiedAt: 1 });
breachLogSchema.index({ requiresUserNotification: 1, usersNotifiedAt: 1 });

// Virtual for authority notification deadline (72 hours from detection)
breachLogSchema.virtual('authorityNotificationDeadline').get(function() {
  return new Date(this.detectedAt.getTime() + 72 * 60 * 60 * 1000);
});

// Methods
breachLogSchema.methods.isAuthorityNotificationOverdue = function() {
  if (!this.requiresAuthorityNotification || this.authorityNotifiedAt) {
    return false;
  }
  const deadline = new Date(this.detectedAt.getTime() + 72 * 60 * 60 * 1000);
  return new Date() > deadline;
};

breachLogSchema.methods.markAsContained = function() {
  this.status = 'contained';
  this.containedAt = new Date();
  return this.save();
};

breachLogSchema.methods.markAsResolved = function() {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  return this.save();
};

breachLogSchema.methods.notifyAuthority = function(details) {
  this.authorityNotifiedAt = new Date();
  this.authorityNotificationDetails = details;
  return this.save();
};

breachLogSchema.methods.notifyUsers = function(method) {
  this.usersNotifiedAt = new Date();
  this.userNotificationMethod = method;
  return this.save();
};

// Static methods
breachLogSchema.statics.getActiveBreaches = function() {
  return this.find({
    status: { $in: ['detected', 'investigating', 'contained'] },
  }).sort({ severity: -1, detectedAt: -1 });
};

breachLogSchema.statics.getOverdueNotifications = function() {
  const deadline = new Date(Date.now() - 72 * 60 * 60 * 1000);
  return this.find({
    requiresAuthorityNotification: true,
    authorityNotifiedAt: null,
    detectedAt: { $lt: deadline },
  });
};

breachLogSchema.statics.generateBreachId = function() {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `BREACH-${year}-${timestamp}`;
};

// Pre-save middleware
breachLogSchema.pre('save', function(next) {
  // Auto-determine if authority notification is required
  if (this.isNew || this.isModified('severity') || this.isModified('affectedRecordsCount')) {
    // GDPR requires notification if breach is likely to result in risk to users
    if (this.severity === 'high' || this.severity === 'critical' || this.affectedRecordsCount > 100) {
      this.requiresAuthorityNotification = true;
    }

    // User notification required for high-risk breaches
    if (this.severity === 'critical' || this.affectedRecordsCount > 1000) {
      this.requiresUserNotification = true;
    }
  }
  next();
});

module.exports = mongoose.model('BreachLog', breachLogSchema);
