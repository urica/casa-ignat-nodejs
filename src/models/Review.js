const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['google', 'facebook', 'website'],
    required: true,
  },

  externalId: String, // ID from Google/Facebook

  author: {
    name: String,
    email: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },

  title: String,

  content: {
    type: String,
    required: true,
  },

  response: {
    content: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: Date,
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  featured: {
    type: Boolean,
    default: false,
  },

  reviewDate: {
    type: Date,
    default: Date.now,
  },

  synced: {
    type: Boolean,
    default: false,
  },

  lastSyncedAt: Date,
}, {
  timestamps: true,
});

reviewSchema.index({ platform: 1, externalId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ status: 1, rating: -1 });
reviewSchema.index({ reviewDate: -1 });

reviewSchema.statics.getAverageRating = async function() {
  const result = await this.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { averageRating: 0, totalReviews: 0 };
};

module.exports = mongoose.model('Review', reviewSchema);
