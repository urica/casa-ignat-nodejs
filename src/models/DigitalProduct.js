const mongoose = require('mongoose');

const digitalProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },

  description: String,

  coverImage: String,

  previewPDF: String,

  category: {
    type: String,
    enum: ['ebook', 'guide', 'template', 'course', 'other'],
    default: 'ebook',
  },

  price: {
    type: Number,
    required: true,
  },

  fileUrl: {
    type: String,
    required: true,
  },

  fileSize: Number, // bytes

  pages: Number,

  format: String, // PDF, EPUB, etc.

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  purchases: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    purchasedAt: Date,
    transactionId: String,
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownload: Date,
  }],

  ratings: {
    average: Number,
    count: Number,
  },

  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rating: Number,
    comment: String,
    createdAt: Date,
  }],

  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
}, {
  timestamps: true,
});

digitalProductSchema.index({ slug: 1 });
digitalProductSchema.index({ status: 1, category: 1 });
digitalProductSchema.index({ 'ratings.average': -1 });

digitalProductSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('DigitalProduct', digitalProductSchema);
