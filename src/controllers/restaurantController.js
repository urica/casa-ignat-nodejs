const MenuItem = require('../models/MenuItem');

exports.index = async (req, res) => {
  try {
    res.render('pages/restaurant', {
      title: 'Restaurant - Casa Ignat',
    });
  } catch (error) {
    console.error('Error loading restaurant page:', error);
    res.status(500).render('pages/error', {
      title: 'Eroare',
      message: 'A apărut o eroare la încărcarea paginii restaurantului.',
    });
  }
};

exports.menu = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ available: true })
      .sort({ category: 1, order: 1 });

    // Group by category
    const categories = {};
    menuItems.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    res.render('pages/menu', {
      title: 'Meniu - Casa Ignat',
      categories,
    });
  } catch (error) {
    console.error('Error loading menu:', error);
    res.status(500).render('pages/error', {
      title: 'Eroare',
      message: 'A apărut o eroare la încărcarea meniului.',
    });
  }
};
