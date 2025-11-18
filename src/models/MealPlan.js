const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  sessionId: String,

  name: {
    type: String,
    required: true,
  },

  duration: {
    type: Number,
    default: 7, // days
  },

  dailyCalorieTarget: Number,

  dietaryPreferences: {
    type: String,
    enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo'],
    default: 'omnivore',
  },

  restrictions: [String],

  meals: [{
    day: Number,
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    },
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
    },
    calories: Number,
    macros: {
      protein: Number,
      carbs: Number,
      fats: Number,
    },
  }],

  shoppingList: [{
    ingredient: String,
    quantity: Number,
    unit: String,
    category: String,
  }],

  status: {
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'draft',
  },
}, {
  timestamps: true,
});

mealPlanSchema.index({ user: 1, createdAt: -1 });
mealPlanSchema.index({ sessionId: 1 });

mealPlanSchema.methods.generateShoppingList = async function() {
  const Recipe = mongoose.model('Recipe');
  const ingredientsMap = new Map();

  for (const meal of this.meals) {
    if (meal.recipe) {
      const recipe = await Recipe.findById(meal.recipe);
      if (recipe && recipe.ingredients) {
        recipe.ingredients.forEach(ing => {
          const key = `${ing.ingredient}-${ing.unit}`;
          if (ingredientsMap.has(key)) {
            ingredientsMap.get(key).quantity += ing.quantity;
          } else {
            ingredientsMap.set(key, {
              ingredient: ing.ingredient,
              quantity: ing.quantity,
              unit: ing.unit,
              category: ing.category || 'other',
            });
          }
        });
      }
    }
  }

  this.shoppingList = Array.from(ingredientsMap.values());
  return this.shoppingList;
};

module.exports = mongoose.model('MealPlan', mealPlanSchema);
