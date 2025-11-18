const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },

  description: {
    type: String,
    required: true,
  },

  image: String,

  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink'],
    required: true,
  },

  dietType: {
    type: String,
    enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo'],
    default: 'omnivore',
  },

  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },

  prepTime: Number, // minutes
  cookTime: Number, // minutes

  servings: {
    type: Number,
    default: 4,
  },

  ingredients: [{
    ingredient: String,
    quantity: Number,
    unit: String,
    category: String,
  }],

  instructions: [String],

  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number,
  },

  tags: [String],

  restrictions: [String],

  ratings: {
    average: {
      type: Number,
      default: 0,
    },
    count: {
      type: Number,
      default: 0,
    },
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
}, {
  timestamps: true,
});

recipeSchema.index({ title: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ category: 1, status: 1 });
recipeSchema.index({ dietType: 1, difficulty: 1 });
recipeSchema.index({ 'ratings.average': -1 });

recipeSchema.pre('save', async function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await this.constructor.findOne({
      slug: this.slug,
      _id: { $ne: this._id }
    });

    if (existing) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

recipeSchema.methods.getTotalTime = function() {
  return (this.prepTime || 0) + (this.cookTime || 0);
};

recipeSchema.statics.findByDiet = function(dietType, options = {}) {
  return this.find({
    dietType,
    status: 'published',
    ...options,
  }).sort({ 'ratings.average': -1 });
};

recipeSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({
    difficulty,
    status: 'published',
  }).sort({ 'ratings.average': -1 });
};

module.exports = mongoose.model('Recipe', recipeSchema);
