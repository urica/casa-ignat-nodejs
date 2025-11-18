const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// API endpoints
router.get('/rooms', apiController.getRooms);
router.get('/rooms/:id', apiController.getRoomById);

router.get('/menu', apiController.getMenuItems);
router.get('/menu/:category', apiController.getMenuByCategory);

router.get('/gallery', apiController.getGalleryImages);
router.get('/gallery/:category', apiController.getGalleryByCategory);

router.post('/contact', apiController.sendContactMessage);
router.post('/booking', apiController.createBooking);

router.get('/testimonials', apiController.getTestimonials);

module.exports = router;
