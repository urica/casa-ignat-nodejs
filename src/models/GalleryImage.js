const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    required: [true, 'Categoria este obligatorie'],
    enum: ['Camere', 'Restaurant', 'Exterior', 'Evenimente', 'Altele'],
  },
  image: {
    url: {
      type: String,
      required: true,
    },
    alt: String,
    thumbnail: String,
    medium: String,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
