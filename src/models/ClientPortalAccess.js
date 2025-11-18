const mongoose = require('mongoose');

const clientPortalAccessSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  consultations: [{
    date: Date,
    type: String,
    notes: String,
    nutritionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    documents: [String],
  }],

  mealPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan',
  }],

  nutritionalProfiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NutritionalProfile',
  }],

  progress: {
    measurements: [{
      date: Date,
      weight: Number,
      bodyFat: Number,
      muscleMass: Number,
      notes: String,
    }],
    photos: [{
      date: Date,
      url: String,
    }],
    goals: [{
      description: String,
      targetDate: Date,
      achieved: Boolean,
      achievedDate: Date,
    }],
  },

  messages: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    subject: String,
    message: String,
    read: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  }],

  documents: [{
    title: String,
    type: String,
    url: String,
    uploadedAt: Date,
  }],

  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  },

  subscriptionExpiry: Date,
}, {
  timestamps: true,
});

clientPortalAccessSchema.index({ user: 1 });

module.exports = mongoose.model('ClientPortalAccess', clientPortalAccessSchema);
