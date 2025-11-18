const NutritionalProfile = require('../models/NutritionalProfile');
const emailService = require('../services/emailService');

/**
 * Nutritional Calculator Controller
 */

/**
 * Show calculator page
 */
exports.showCalculator = (req, res) => {
  res.render('tools/nutritional-calculator', {
    title: 'Calculator Nutrițional',
  });
};

/**
 * Calculate nutritional needs
 */
exports.calculate = async (req, res) => {
  try {
    const {
      age, gender, height, weight,
      activityLevel, goal, dietType, restrictions,
      email,
    } = req.body;

    // Create profile
    const profile = new NutritionalProfile({
      user: req.user?.id,
      sessionId: req.sessionID,
      personalInfo: { age, gender, height, weight },
      activityLevel,
      goal,
      dietaryPreferences: {
        type: dietType,
        restrictions: restrictions ? restrictions.split(',').map(r => r.trim()) : [],
      },
      email,
    });

    // Calculate all metrics
    profile.calculateAll();

    // Save profile
    await profile.save();

    // Send email if requested
    if (email && req.body.sendEmail) {
      await emailService.sendNutritionalReport(email, profile);
      profile.emailSent = true;
      await profile.save();
    }

    res.json({
      success: true,
      data: {
        bmi: profile.calculations.bmi,
        bmr: profile.calculations.bmr,
        tdee: profile.calculations.tdee,
        idealWeight: profile.calculations.idealWeight,
        waterIntake: profile.calculations.waterIntake,
        macros: profile.calculations.macros,
        recommendations: profile.recommendations,
      },
    });
  } catch (error) {
    console.error('Error calculating nutritional needs:', error);
    res.status(500).json({
      success: false,
      message: 'A apărut o eroare la calculare',
    });
  }
};

/**
 * Get user history
 */
exports.getHistory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Trebuie să fiți autentificat',
      });
    }

    const profiles = await NutritionalProfile.getRecentProfiles(req.user.id, 10);

    res.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la încărcarea istoricului',
    });
  }
};

module.exports = exports;
