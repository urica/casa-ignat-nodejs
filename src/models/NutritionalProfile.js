const mongoose = require('mongoose');

/**
 * Nutritional Profile Model
 * Stores user nutritional information and calculations
 */

const nutritionalProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Can be anonymous
  },

  sessionId: {
    type: String,
    index: true,
  },

  // Personal Information
  personalInfo: {
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    height: {
      type: Number,
      required: true,
      min: 50, // cm
      max: 300,
    },
    weight: {
      type: Number,
      required: true,
      min: 20, // kg
      max: 500,
    },
  },

  // Activity Level
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    required: true,
    default: 'moderate',
  },

  // Goals
  goal: {
    type: String,
    enum: ['lose_weight', 'maintain', 'gain_weight', 'gain_muscle'],
    required: true,
    default: 'maintain',
  },

  // Dietary Preferences
  dietaryPreferences: {
    type: {
      type: String,
      enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo'],
      default: 'omnivore',
    },
    restrictions: [String], // allergies, intolerances
  },

  // Calculated Metrics
  calculations: {
    bmi: {
      value: Number,
      category: {
        type: String,
        enum: ['underweight', 'normal', 'overweight', 'obese'],
      },
    },
    bmr: Number, // Basal Metabolic Rate
    tdee: Number, // Total Daily Energy Expenditure
    idealWeight: {
      min: Number,
      max: Number,
    },
    waterIntake: Number, // liters per day
    macros: {
      protein: Number, // grams
      carbs: Number, // grams
      fats: Number, // grams
      calories: Number,
    },
  },

  // Recommendations
  recommendations: {
    calorieIntake: Number,
    mealPlan: String,
    tips: [String],
  },

  // Metadata
  calculatedAt: {
    type: Date,
    default: Date.now,
  },

  emailSent: {
    type: Boolean,
    default: false,
  },

  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
}, {
  timestamps: true,
});

// Indexes
nutritionalProfileSchema.index({ user: 1, createdAt: -1 });
nutritionalProfileSchema.index({ sessionId: 1 });
nutritionalProfileSchema.index({ email: 1 });

// Calculate BMI
nutritionalProfileSchema.methods.calculateBMI = function() {
  const heightInMeters = this.personalInfo.height / 100;
  const bmi = this.personalInfo.weight / (heightInMeters * heightInMeters);

  let category;
  if (bmi < 18.5) category = 'underweight';
  else if (bmi < 25) category = 'normal';
  else if (bmi < 30) category = 'overweight';
  else category = 'obese';

  this.calculations.bmi = {
    value: Math.round(bmi * 10) / 10,
    category: category,
  };

  return this.calculations.bmi;
};

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
nutritionalProfileSchema.methods.calculateBMR = function() {
  const { weight, height, age } = this.personalInfo;
  const gender = this.personalInfo.gender;

  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  this.calculations.bmr = Math.round(bmr);
  return this.calculations.bmr;
};

// Calculate TDEE (Total Daily Energy Expenditure)
nutritionalProfileSchema.methods.calculateTDEE = function() {
  const bmr = this.calculations.bmr || this.calculateBMR();

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = activityMultipliers[this.activityLevel] || 1.55;
  this.calculations.tdee = Math.round(bmr * multiplier);

  return this.calculations.tdee;
};

// Calculate ideal weight range
nutritionalProfileSchema.methods.calculateIdealWeight = function() {
  const heightInMeters = this.personalInfo.height / 100;

  // Using BMI of 18.5-24.9 for ideal weight range
  const minWeight = Math.round(18.5 * heightInMeters * heightInMeters);
  const maxWeight = Math.round(24.9 * heightInMeters * heightInMeters);

  this.calculations.idealWeight = {
    min: minWeight,
    max: maxWeight,
  };

  return this.calculations.idealWeight;
};

// Calculate water intake
nutritionalProfileSchema.methods.calculateWaterIntake = function() {
  const baseWater = this.personalInfo.weight * 0.033; // 33ml per kg

  const activityBonus = {
    sedentary: 0,
    light: 0.3,
    moderate: 0.5,
    active: 0.7,
    very_active: 1.0,
  };

  const bonus = activityBonus[this.activityLevel] || 0.5;
  this.calculations.waterIntake = Math.round((baseWater + bonus) * 10) / 10;

  return this.calculations.waterIntake;
};

// Calculate macros
nutritionalProfileSchema.methods.calculateMacros = function() {
  const tdee = this.calculations.tdee || this.calculateTDEE();

  // Adjust calories based on goal
  let targetCalories = tdee;
  if (this.goal === 'lose_weight') {
    targetCalories = tdee - 500; // 500 cal deficit
  } else if (this.goal === 'gain_weight' || this.goal === 'gain_muscle') {
    targetCalories = tdee + 300; // 300 cal surplus
  }

  // Macro split based on goal
  let proteinPercent, carbsPercent, fatsPercent;

  if (this.goal === 'gain_muscle') {
    proteinPercent = 0.30;
    carbsPercent = 0.40;
    fatsPercent = 0.30;
  } else if (this.goal === 'lose_weight') {
    proteinPercent = 0.35;
    carbsPercent = 0.35;
    fatsPercent = 0.30;
  } else {
    proteinPercent = 0.25;
    carbsPercent = 0.45;
    fatsPercent = 0.30;
  }

  this.calculations.macros = {
    calories: Math.round(targetCalories),
    protein: Math.round((targetCalories * proteinPercent) / 4), // 4 cal per gram
    carbs: Math.round((targetCalories * carbsPercent) / 4),
    fats: Math.round((targetCalories * fatsPercent) / 9), // 9 cal per gram
  };

  this.recommendations.calorieIntake = Math.round(targetCalories);

  return this.calculations.macros;
};

// Generate recommendations
nutritionalProfileSchema.methods.generateRecommendations = function() {
  const tips = [];

  // BMI-based tips
  if (this.calculations.bmi.category === 'underweight') {
    tips.push('Vă recomandăm să consultați un nutriționist pentru un plan de creștere în greutate sănătoasă.');
    tips.push('Includeți mai multe alimente dense în calorii și proteine în dietă.');
  } else if (this.calculations.bmi.category === 'overweight' || this.calculations.bmi.category === 'obese') {
    tips.push('Un deficit caloric moderat și exerciții regulate pot ajuta la pierderea în greutate.');
    tips.push('Concentrați-vă pe alimente integrale și evitați alimentele procesate.');
  } else {
    tips.push('Greutatea dvs. este în intervalul normal. Continuați cu obiceiurile sănătoase!');
  }

  // Water intake tips
  if (this.calculations.waterIntake < 2) {
    tips.push('Hidratarea este esențială! Încercați să beți mai multă apă pe parcursul zilei.');
  }

  // Activity level tips
  if (this.activityLevel === 'sedentary') {
    tips.push('Încercați să includeți cel puțin 30 de minute de activitate fizică zilnic.');
  }

  // Goal-specific tips
  if (this.goal === 'gain_muscle') {
    tips.push('Pentru creștere musculară, consumați proteine după antrenament.');
    tips.push('Antrenamentele de forță 3-4 ori pe săptămână sunt ideale.');
  } else if (this.goal === 'lose_weight') {
    tips.push('Pierderea în greutate sănătoasă este de 0.5-1 kg pe săptămână.');
    tips.push('Combinați deficitul caloric cu exerciții cardiovasculare.');
  }

  this.recommendations.tips = tips;
  return tips;
};

// Calculate all metrics
nutritionalProfileSchema.methods.calculateAll = function() {
  this.calculateBMI();
  this.calculateBMR();
  this.calculateTDEE();
  this.calculateIdealWeight();
  this.calculateWaterIntake();
  this.calculateMacros();
  this.generateRecommendations();
  this.calculatedAt = new Date();
  return this;
};

// Static method to get recent profiles for a user
nutritionalProfileSchema.statics.getRecentProfiles = function(userId, limit = 5) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('NutritionalProfile', nutritionalProfileSchema);
