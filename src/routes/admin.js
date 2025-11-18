const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../../config/upload');

// All admin routes require authentication
router.use(authMiddleware.requireAuth);

// Dashboard
router.get('/', adminController.dashboard);

// Rooms management
router.get('/rooms', adminController.listRooms);
router.get('/rooms/create', adminController.createRoomForm);
router.post('/rooms/create', upload.array('images', 10), adminController.createRoom);
router.get('/rooms/edit/:id', adminController.editRoomForm);
router.post('/rooms/edit/:id', upload.array('images', 10), adminController.updateRoom);
router.post('/rooms/delete/:id', adminController.deleteRoom);

// Menu management
router.get('/menu', adminController.listMenuItems);
router.get('/menu/create', adminController.createMenuItemForm);
router.post('/menu/create', upload.single('image'), adminController.createMenuItem);
router.get('/menu/edit/:id', adminController.editMenuItemForm);
router.post('/menu/edit/:id', upload.single('image'), adminController.updateMenuItem);
router.post('/menu/delete/:id', adminController.deleteMenuItem);

// Gallery management
router.get('/gallery', adminController.listGalleryImages);
router.get('/gallery/upload', adminController.uploadGalleryForm);
router.post('/gallery/upload', upload.array('images', 20), adminController.uploadGalleryImages);
router.post('/gallery/delete/:id', adminController.deleteGalleryImage);

// Bookings management
router.get('/bookings', adminController.listBookings);
router.get('/bookings/:id', adminController.viewBooking);
router.post('/bookings/:id/status', adminController.updateBookingStatus);

// Messages
router.get('/messages', adminController.listMessages);
router.get('/messages/:id', adminController.viewMessage);
router.post('/messages/:id/mark-read', adminController.markMessageAsRead);

// Testimonials
router.get('/testimonials', adminController.listTestimonials);
router.post('/testimonials/:id/approve', adminController.approveTestimonial);
router.post('/testimonials/:id/delete', adminController.deleteTestimonial);

// Settings
router.get('/settings', adminController.settings);
router.post('/settings', adminController.updateSettings);

module.exports = router;
