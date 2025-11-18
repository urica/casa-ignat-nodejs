const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Numele este obligatoriu'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email-ul este obligatoriu'],
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Subiectul este obligatoriu'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Mesajul este obligatoriu'],
  },
  read: {
    type: Boolean,
    default: false,
  },
  replied: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Contact', contactSchema);
