const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Titlul este obligatoriu'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  content: {
    type: String,
    required: [true, 'Conținutul este obligatoriu'],
  },
  template: {
    type: String,
    enum: ['default', 'full-width', 'landing', 'contact'],
    default: 'default',
  },
  sections: [{
    type: {
      type: String,
      enum: ['hero', 'text', 'image', 'gallery', 'cta', 'testimonials', 'services', 'team', 'faq', 'custom'],
    },
    title: String,
    content: String,
    settings: mongoose.Schema.Types.Mixed,
    order: Number,
  }],
  featuredImage: {
    type: String,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  publishedAt: {
    type: Date,
  },
  isHomepage: {
    type: Boolean,
    default: false,
  },
  showInMenu: {
    type: Boolean,
    default: true,
  },
  menuOrder: {
    type: Number,
    default: 0,
  },
  parentPage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title poate avea maxim 60 caractere'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description poate avea maxim 160 caractere'],
    },
    keywords: [{
      type: String,
    }],
    ogImage: {
      type: String,
    },
  },
}, {
  timestamps: true,
});

// Auto-generate slug from title
pageSchema.pre('validate', function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Set publishedAt when status changes to published
pageSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Ensure only one homepage
pageSchema.pre('save', async function(next) {
  if (this.isModified('isHomepage') && this.isHomepage) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isHomepage: false } }
    );
  }
  next();
});

// Indexes
pageSchema.index({ slug: 1 });
pageSchema.index({ status: 1 });

module.exports = mongoose.model('Page', pageSchema);
