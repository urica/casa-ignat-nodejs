const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Numele camerei este obligatoriu'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Descrierea este obligatorie'],
  },
  shortDescription: {
    type: String,
    maxlength: 200,
  },
  price: {
    type: Number,
    required: [true, 'Prețul este obligatoriu'],
    min: 0,
  },
  capacity: {
    type: Number,
    required: [true, 'Capacitatea este obligatorie'],
    min: 1,
  },
  size: {
    type: Number, // in square meters
    min: 0,
  },
  images: [{
    url: String,
    alt: String,
    thumbnail: String,
    medium: String,
  }],
  amenities: [{
    type: String,
  }],
  available: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: 60,
      trim: true,
    },
    metaDescription: {
      type: String,
      maxlength: 160,
      trim: true,
    },
    keywords: [{
      type: String,
      trim: true,
    }],
    ogImage: {
      type: String,
      trim: true,
    },
  },
}, {
  timestamps: true,
});

// Create slug from name before saving
roomSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);
