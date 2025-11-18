const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Numele este obligatoriu'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  rating: {
    type: Number,
    required: [true, 'Rating-ul este obligatoriu'],
    min: 1,
    max: 5,
  },
  message: {
    type: String,
    required: [true, 'Mesajul este obligatoriu'],
  },
  approved: {
    type: Boolean,
    default: false,
  },
  featured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
