const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Numele serviciului este obligatoriu'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  shortDescription: {
    type: String,
    required: [true, 'Descrierea scurtă este obligatorie'],
    maxlength: [200, 'Descrierea scurtă poate avea maxim 200 caractere'],
  },
  description: {
    type: String,
    required: [true, 'Descrierea completă este obligatorie'],
  },
  icon: {
    type: String,
  },
  featuredImage: {
    type: String,
  },
  gallery: [{
    type: String,
  }],
  price: {
    type: Number,
    min: [0, 'Prețul nu poate fi negativ'],
  },
  priceType: {
    type: String,
    enum: ['fixed', 'from', 'range', 'custom'],
    default: 'fixed',
  },
  priceMax: {
    type: Number,
    min: [0, 'Prețul maxim nu poate fi negativ'],
  },
  currency: {
    type: String,
    default: 'RON',
  },
  duration: {
    type: Number, // in minutes
  },
  features: [{
    type: String,
  }],
  category: {
    type: String,
    enum: ['consultatie', 'plan-nutritional', 'coaching', 'workshop', 'pachet'],
    required: [true, 'Categoria este obligatorie'],
  },
  bookable: {
    type: Boolean,
    default: true,
  },
  requiresConsultation: {
    type: Boolean,
    default: false,
  },
  available: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  displayOrder: {
    type: Number,
    default: 0,
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
  },
}, {
  timestamps: true,
});

// Auto-generate slug from name
serviceSchema.pre('validate', function(next) {
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

// Indexes
serviceSchema.index({ slug: 1 });
serviceSchema.index({ category: 1, available: 1 });
serviceSchema.index({ featured: 1, displayOrder: 1 });

module.exports = mongoose.model('Service', serviceSchema);
