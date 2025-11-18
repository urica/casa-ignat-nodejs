const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  width: {
    type: Number,
  },
  height: {
    type: Number,
  },
  folder: {
    type: String,
    default: 'general',
  },
  alt: {
    type: String,
    trim: true,
  },
  title: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  thumbnails: {
    small: String,
    medium: String,
    large: String,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
mediaSchema.index({ folder: 1, createdAt: -1 });
mediaSchema.index({ mimeType: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ uploadedBy: 1 });

// Virtual for file type
mediaSchema.virtual('fileType').get(function() {
  if (this.mimeType.startsWith('image/')) return 'image';
  if (this.mimeType.startsWith('video/')) return 'video';
  if (this.mimeType.startsWith('audio/')) return 'audio';
  if (this.mimeType.includes('pdf')) return 'pdf';
  return 'file';
});

module.exports = mongoose.model('Media', mediaSchema);
