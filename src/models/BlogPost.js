const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
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
  excerpt: {
    type: String,
    required: [true, 'Descrierea scurtă este obligatorie'],
    maxlength: [300, 'Descrierea scurtă poate avea maxim 300 caractere'],
  },
  content: {
    type: String,
    required: [true, 'Conținutul este obligatoriu'],
  },
  featuredImage: {
    type: String,
  },
  images: [{
    type: String,
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: [true, 'Categoria este obligatorie'],
    enum: ['nutritie', 'retete', 'sanatate', 'lifestyle', 'sfaturi'],
  },
  tags: [{
    type: String,
    trim: true,
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft',
  },
  publishedAt: {
    type: Date,
  },
  scheduledFor: {
    type: Date,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  allowComments: {
    type: Boolean,
    default: true,
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
blogPostSchema.pre('validate', function(next) {
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
blogPostSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Indexes for better performance
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, status: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ author: 1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
