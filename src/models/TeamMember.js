const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Numele este obligatoriu'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  position: {
    type: String,
    required: [true, 'Poziția este obligatorie'],
    trim: true,
  },
  photo: {
    type: String,
    required: [true, 'Fotografia este obligatorie'],
  },
  bio: {
    type: String,
    required: [true, 'Biografia este obligatorie'],
  },
  specializations: [{
    type: String,
    trim: true,
  }],
  credentials: [{
    type: String,
    trim: true,
  }],
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  socialLinks: {
    facebook: {
      type: String,
      trim: true,
    },
    instagram: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    twitter: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  available: {
    type: Boolean,
    default: true,
  },
  acceptsAppointments: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Auto-generate slug from name
teamMemberSchema.pre('validate', function(next) {
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
teamMemberSchema.index({ slug: 1 });
teamMemberSchema.index({ available: 1, displayOrder: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
