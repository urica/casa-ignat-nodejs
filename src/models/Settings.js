const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // General settings
  siteName: {
    type: String,
    default: 'Casa Ignat - Nutriție și Sănătate',
  },
  siteTagline: {
    type: String,
    default: 'Cabinet de Nutriție și Dietetică',
  },
  siteDescription: {
    type: String,
  },
  siteLogo: {
    type: String,
  },
  siteFavicon: {
    type: String,
  },
  contactEmail: {
    type: String,
  },
  contactPhone: {
    type: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },

  // Social media
  socialMedia: {
    facebook: String,
    instagram: String,
    linkedin: String,
    twitter: String,
    youtube: String,
    tiktok: String,
  },

  // SEO settings
  seo: {
    defaultMetaTitle: String,
    defaultMetaDescription: String,
    keywords: [String],
    ogImage: String,
    googleAnalyticsId: String,
    googleTagManagerId: String,
    facebookPixelId: String,
    googleSiteVerification: String,
    bingVerification: String,
  },

  // Email settings
  email: {
    fromName: String,
    fromEmail: String,
    replyToEmail: String,
    notificationEmail: String,
    notifyOnBooking: {
      type: Boolean,
      default: true,
    },
    notifyOnContact: {
      type: Boolean,
      default: true,
    },
    notifyOnTestimonial: {
      type: Boolean,
      default: true,
    },
  },

  // Booking settings
  booking: {
    enabled: {
      type: Boolean,
      default: true,
    },
    requireApproval: {
      type: Boolean,
      default: true,
    },
    minAdvanceBooking: {
      type: Number,
      default: 24, // hours
    },
    maxAdvanceBooking: {
      type: Number,
      default: 90, // days
    },
    workingHours: {
      monday: { enabled: Boolean, start: String, end: String },
      tuesday: { enabled: Boolean, start: String, end: String },
      wednesday: { enabled: Boolean, start: String, end: String },
      thursday: { enabled: Boolean, start: String, end: String },
      friday: { enabled: Boolean, start: String, end: String },
      saturday: { enabled: Boolean, start: String, end: String },
      sunday: { enabled: Boolean, start: String, end: String },
    },
    slotDuration: {
      type: Number,
      default: 60, // minutes
    },
  },

  // Maintenance mode
  maintenance: {
    enabled: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: 'Site-ul este în mentenanță. Revenim în curând!',
    },
    allowedIPs: [String],
  },

  // Backup settings
  backup: {
    autoBackup: {
      type: Boolean,
      default: false,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly',
    },
    lastBackup: Date,
  },

  // Custom CSS/JS
  customCode: {
    headerScripts: String,
    footerScripts: String,
    customCSS: String,
  },

}, {
  timestamps: true,
});

// Ensure only one settings document exists
settingsSchema.statics.get = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
