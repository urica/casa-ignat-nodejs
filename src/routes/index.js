const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const roomsController = require('../controllers/roomsController');
const restaurantController = require('../controllers/restaurantController');
const galleryController = require('../controllers/galleryController');
const contactController = require('../controllers/contactController');
const sitemapController = require('../controllers/sitemapController');
const appointmentController = require('../controllers/appointmentController');
const blogController = require('../controllers/blogController');
const pagesController = require('../controllers/pagesController');

// Home page
router.get('/', homeController.index);

// About pages
router.get('/despre/echipa', pagesController.echipa);
router.get('/despre/testimoniale', pagesController.testimoniale);
router.get('/despre/misiune', pagesController.misiune);

// Services pages
router.get('/servicii/consultatii', pagesController.consultatii);
router.get('/servicii/programe', pagesController.programe);
router.get('/servicii/analize', pagesController.analize);

// Special programs pages
router.get('/programe/10-10', pagesController.program1010);
router.get('/programe/nutri-junior', pagesController.nutriJunior);
router.get('/programe/corporate', pagesController.corporate);

// Booking/appointment page
router.get('/programare', pagesController.programare);

// Rooms
router.get('/camere', roomsController.index);
router.get('/camere/:slug', roomsController.show);

// Restaurant
router.get('/restaurant', restaurantController.index);
router.get('/restaurant/meniu', restaurantController.menu);

// Gallery
router.get('/galerie', galleryController.index);

// Contact
router.get('/contact', contactController.index);
router.post('/contact', contactController.submit);

// Booking
router.get('/rezervare', homeController.booking);
router.post('/rezervare', homeController.submitBooking);

// Appointments / Programari
router.get('/programari', appointmentController.showBookingForm);

// Blog routes
router.get('/blog', blogController.publicList);
router.get('/blog/categorie/:slug', blogController.publicCategory);
router.get('/blog/:slug', blogController.publicShow);
router.post('/blog/comment', blogController.submitComment);

// Health check endpoint for Docker
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SEO - Sitemap
router.get('/sitemap.xml', sitemapController.generateSitemap);

// SEO - Robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
  const robotsTxt = `# Casa Ignat - Robots.txt
# https://casa-ignat.ro

User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/private/

# Disallow login pages
Disallow: /admin/login

# Disallow search result pages (if any)
Disallow: /search?
Disallow: /cautare?

# Allow public API endpoints
Allow: /api/

# Crawl-delay (optional, adjust if needed)
Crawl-delay: 1
`;

  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.send(robotsTxt);
});

module.exports = router;
