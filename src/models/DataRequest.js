const mongoose = require('mongoose');

/**
 * DataRequest Model
 * Tracks user data requests for GDPR compliance
 * Implements rights: Access, Rectification, Erasure, Portability, Objection
 */
const dataRequestSchema = new mongoose.Schema({
  // User making the request
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // For non-registered users
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  // Request type
  requestType: {
    type: String,
    enum: [
      'access',        // Right to access - export all user data
      'rectification', // Right to rectification - update incorrect data
      'erasure',       // Right to be forgotten - delete account and data
      'portability',   // Right to data portability - export in machine-readable format
      'objection',     // Right to object - stop processing for specific purposes
      'restriction',   // Right to restriction - limit processing
    ],
    required: true,
  },

  // Request status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected', 'cancelled'],
    default: 'pending',
  },

  // Request details
  description: {
    type: String,
    maxlength: 1000,
  },

  // For rectification requests
  rectificationData: {
    type: mongoose.Schema.Types.Mixed,
  },

  // For objection/restriction requests
  processingPurposes: [{
    type: String,
    enum: ['analytics', 'marketing', 'profiling', 'automated_decision'],
  }],

  // Response
  responseMessage: {
    type: String,
  },

  responseDate: {
    type: Date,
  },

  // Data export file path (for access/portability requests)
  exportFilePath: {
    type: String,
  },

  exportFileExpiry: {
    type: Date,
  },

  // Verification token (sent via email)
  verificationToken: {
    type: String,
    select: false,
  },

  verificationTokenExpiry: {
    type: Date,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  verifiedAt: {
    type: Date,
  },

  // Processing information
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  processedAt: {
    type: Date,
  },

  // Deadline (GDPR requires response within 30 days)
  deadline: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },

  // Tracking
  ipAddress: {
    type: String,
  },

  userAgent: {
    type: String,
  },

  // Notes for internal use
  internalNotes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
dataRequestSchema.index({ user: 1, status: 1 });
dataRequestSchema.index({ email: 1, status: 1 });
dataRequestSchema.index({ status: 1, deadline: 1 });
dataRequestSchema.index({ requestType: 1, status: 1 });
dataRequestSchema.index({ verificationToken: 1 });
dataRequestSchema.index({ createdAt: -1 });

// Methods
dataRequestSchema.methods.isOverdue = function() {
  return this.deadline < new Date() && this.status !== 'completed' && this.status !== 'cancelled';
};

dataRequestSchema.methods.verify = function() {
  this.isVerified = true;
  this.verifiedAt = new Date();
  this.verificationToken = undefined;
  this.verificationTokenExpiry = undefined;
  return this.save();
};

dataRequestSchema.methods.complete = async function(responseMessage, processedBy) {
  this.status = 'completed';
  this.responseMessage = responseMessage;
  this.responseDate = new Date();
  this.processedBy = processedBy;
  this.processedAt = new Date();
  return this.save();
};

dataRequestSchema.methods.reject = async function(responseMessage, processedBy) {
  this.status = 'rejected';
  this.responseMessage = responseMessage;
  this.responseDate = new Date();
  this.processedBy = processedBy;
  this.processedAt = new Date();
  return this.save();
};

// Static methods
dataRequestSchema.statics.getOverdueRequests = function() {
  return this.find({
    deadline: { $lt: new Date() },
    status: { $in: ['pending', 'in_progress'] },
  }).populate('user', 'email name');
};

dataRequestSchema.statics.getPendingRequests = function() {
  return this.find({
    status: 'pending',
    isVerified: true,
  }).sort({ createdAt: 1 }).populate('user', 'email name');
};

// Pre-save middleware
dataRequestSchema.pre('save', function(next) {
  // Update processedAt when status changes to completed/rejected
  if (this.isModified('status') && (this.status === 'completed' || this.status === 'rejected')) {
    if (!this.processedAt) {
      this.processedAt = new Date();
    }
    if (!this.responseDate) {
      this.responseDate = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('DataRequest', dataRequestSchema);
