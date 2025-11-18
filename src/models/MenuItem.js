const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Numele produsului este obligatoriu'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Descrierea este obligatorie'],
  },
  price: {
    type: Number,
    required: [true, 'Prețul este obligatoriu'],
    min: 0,
  },
  category: {
    type: String,
    required: [true, 'Categoria este obligatorie'],
    enum: ['Mic dejun', 'Aperitive', 'Supe', 'Feluri principale', 'Deserturi', 'Băuturi'],
  },
  image: {
    url: String,
    alt: String,
    thumbnail: String,
  },
  allergens: [{
    type: String,
  }],
  vegetarian: {
    type: Boolean,
    default: false,
  },
  vegan: {
    type: Boolean,
    default: false,
  },
  glutenFree: {
    type: Boolean,
    default: false,
  },
  spicy: {
    type: Boolean,
    default: false,
  },
  available: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
