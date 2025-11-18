const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');

/**
 * Meal Planner Controller
 */

exports.index = (req, res) => {
  res.render('tools/meal-planner', {
    title: 'Planificator de Mese',
  });
};

exports.generate = async (req, res) => {
  try {
    const {
      duration, dailyCalories, dietType, restrictions,
    } = req.body;

    const mealPlan = new MealPlan({
      user: req.user?.id,
      sessionId: req.sessionID,
      name: `Plan ${new Date().toLocaleDateString('ro-RO')}`,
      duration: parseInt(duration) || 7,
      dailyCalorieTarget: parseInt(dailyCalories),
      dietaryPreferences: dietType,
      restrictions: restrictions ? restrictions.split(',').map(r => r.trim()) : [],
    });

    // Generate meals for each day
    for (let day = 1; day <= mealPlan.duration; day++) {
      const recipes = await Recipe.find({
        dietType: mealPlan.dietaryPreferences,
        restrictions: { $nin: mealPlan.restrictions },
        status: 'published',
      }).limit(4);

      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      recipes.forEach((recipe, index) => {
        if (index < mealTypes.length) {
          mealPlan.meals.push({
            day,
            mealType: mealTypes[index],
            recipe: recipe._id,
            calories: recipe.nutrition?.calories || 0,
            macros: {
              protein: recipe.nutrition?.protein || 0,
              carbs: recipe.nutrition?.carbs || 0,
              fats: recipe.nutrition?.fats || 0,
            },
          });
        }
      });
    }

    // Generate shopping list
    await mealPlan.generateShoppingList();

    mealPlan.status = 'active';
    await mealPlan.save();

    await mealPlan.populate('meals.recipe');

    res.json({
      success: true,
      data: mealPlan,
    });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la generarea planului',
    });
  }
};

exports.getMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id)
      .populate('meals.recipe');

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Planul nu a fost găsit',
      });
    }

    res.json({
      success: true,
      data: mealPlan,
    });
  } catch (error) {
    console.error('Error getting meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare',
    });
  }
};

exports.exportShoppingList = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id);

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Planul nu a fost găsit',
      });
    }

    // Generate PDF or CSV
    const format = req.query.format || 'pdf';

    if (format === 'csv') {
      const csv = ['Ingredient,Quantity,Unit,Category'];
      mealPlan.shoppingList.forEach(item => {
        csv.push(`${item.ingredient},${item.quantity},${item.unit},${item.category}`);
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=shopping-list.csv');
      res.send(csv.join('\n'));
    } else {
      res.json({
        success: true,
        data: mealPlan.shoppingList,
      });
    }
  } catch (error) {
    console.error('Error exporting shopping list:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la export',
    });
  }
};

module.exports = exports;
