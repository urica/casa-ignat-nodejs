const mongoose = require('mongoose');

const blogCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Numele categoriei este obligatoriu'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    maxlength: [500, 'Descrierea poate avea maxim 500 caractere'],
  },
  icon: {
    type: String, // Font Awesome icon class sau emoji
  },
  color: {
    type: String, // Hex color pentru UI
    default: '#3498db',
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
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
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Auto-generate slug from name
blogCategorySchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Virtual for post count
blogCategorySchema.virtual('postCount', {
  ref: 'BlogPost',
  localField: 'slug',
  foreignField: 'category',
  count: true,
});

blogCategorySchema.index({ slug: 1 });
blogCategorySchema.index({ order: 1 });

module.exports = mongoose.model('BlogCategory', blogCategorySchema);
