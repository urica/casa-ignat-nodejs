const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const roomsController = require('../controllers/roomsController');
const restaurantController = require('../controllers/restaurantController');
const galleryController = require('../controllers/galleryController');
const contactController = require('../controllers/contactController');

// Home page
router.get('/', homeController.index);

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

// Health check endpoint for Docker
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
