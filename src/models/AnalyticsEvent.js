const mongoose = require('mongoose');

/**
 * AnalyticsEvent Model
 * Stores custom analytics events for internal reporting
 */
const analyticsEventSchema = new mongoose.Schema({
  // Event details
  eventName: {
    type: String,
    required: true,
    index: true,
  },

  eventCategory: {
    type: String,
    enum: ['page_view', 'interaction', 'conversion', 'ecommerce', 'engagement', 'error', 'custom'],
    default: 'custom',
    index: true,
  },

  // Event data
  properties: {
    type: mongoose.Schema.Types.Mixed,
  },

  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  sessionId: {
    type: String,
    index: true,
  },

  // Request information
  url: {
    type: String,
  },

  referrer: {
    type: String,
  },

  userAgent: {
    type: String,
  },

  ipAddress: {
    type: String,
  },

  // Device information
  device: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
    },
    browser: String,
    os: String,
  },

  // Location (can be populated from IP)
  location: {
    country: String,
    city: String,
    region: String,
  },

  // Conversion tracking
  isConversion: {
    type: Boolean,
    default: false,
    index: true,
  },

  conversionValue: {
    type: Number,
    default: 0,
  },

  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
analyticsEventSchema.index({ eventName: 1, timestamp: -1 });
analyticsEventSchema.index({ eventCategory: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ isConversion: 1, timestamp: -1 });
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days retention

// Static methods
analyticsEventSchema.statics.trackEvent = async function(eventData) {
  try {
    return await this.create(eventData);
  } catch (error) {
    console.error('Error tracking event:', error);
    return null;
  }
};

analyticsEventSchema.statics.getEventStats = async function(startDate, endDate, filters = {}) {
  const match = {
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
    ...filters,
  };

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          eventName: '$eventName',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        totalValue: { $sum: '$conversionValue' },
      },
    },
    {
      $project: {
        eventName: '$_id.eventName',
        date: '$_id.date',
        count: 1,
        uniqueUsersCount: { $size: '$uniqueUsers' },
        totalValue: 1,
      },
    },
    { $sort: { date: -1, count: -1 } },
  ]);
};

analyticsEventSchema.statics.getTopPages = async function(startDate, endDate, limit = 10) {
  return await this.aggregate([
    {
      $match: {
        eventCategory: 'page_view',
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$url',
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$sessionId' },
      },
    },
    {
      $project: {
        url: '$_id',
        views: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
      },
    },
    { $sort: { views: -1 } },
    { $limit: limit },
  ]);
};

analyticsEventSchema.statics.getConversionFunnel = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        eventName: { $in: ['page_view', 'form_view', 'form_submit', 'conversion'] },
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          sessionId: '$sessionId',
          eventName: '$eventName',
        },
      },
    },
    {
      $group: {
        _id: '$_id.eventName',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
