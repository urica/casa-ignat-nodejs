const GalleryImage = require('../models/GalleryImage');

exports.index = async (req, res) => {
  try {
    const { category } = req.query;

    const query = category ? { category } : {};
    const images = await GalleryImage.find(query).sort({ createdAt: -1 });

    const categories = await GalleryImage.distinct('category');

    res.render('pages/gallery', {
      title: 'Galerie - Casa Ignat',
      images,
      categories,
      selectedCategory: category || 'all',
    });
  } catch (error) {
    console.error('Error loading gallery:', error);
    res.status(500).render('pages/error', {
      title: 'Eroare',
      message: 'A apărut o eroare la încărcarea galeriei.',
    });
  }
};
