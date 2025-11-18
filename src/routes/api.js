const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const apiController = require('../controllers/apiController');
const appointmentController = require('../controllers/appointmentController');
const { isAuthenticated } = require('../middleware/auth');

// Existing API endpoints
router.get('/rooms', apiController.getRooms);
router.get('/rooms/:id', apiController.getRoomById);

router.get('/menu', apiController.getMenuItems);
router.get('/menu/:category', apiController.getMenuByCategory);

router.get('/gallery', apiController.getGalleryImages);
router.get('/gallery/:category', apiController.getGalleryByCategory);

router.post('/contact', apiController.sendContactMessage);
router.post('/booking', apiController.createBooking);

router.get('/testimonials', apiController.getTestimonials);

// Appointment API endpoints - Public
router.get('/appointments/available-slots', appointmentController.getAvailableSlots);

router.post('/appointments', [
  body('serviceId').notEmpty().withMessage('Serviciul este obligatoriu'),
  body('appointmentDate').isISO8601().withMessage('Data invalidă'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Ora invalidă'),
  body('name').trim().notEmpty().withMessage('Numele este obligatoriu'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalid'),
  body('phone').trim().notEmpty().withMessage('Telefonul este obligatoriu'),
  body('termsAccepted').equals('true').withMessage('Trebuie să acceptați termenii și condițiile'),
], appointmentController.createAppointment);

router.post('/appointments/:id/cancel', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalid'),
], appointmentController.cancelAppointment);

router.get('/appointments/:id/export', appointmentController.exportToCalendar);

// Appointment API endpoints - Admin only
router.get('/appointments/stats', isAuthenticated, appointmentController.getStatistics);
router.get('/appointments/:id', isAuthenticated, appointmentController.getAppointment);
router.get('/appointments', isAuthenticated, appointmentController.getAllAppointments);
router.put('/appointments/:id', isAuthenticated, appointmentController.updateAppointment);
router.patch('/appointments/:id/status', isAuthenticated, [
  body('status').isIn(['new', 'confirmed', 'waiting', 'cancelled', 'completed', 'no_show']).withMessage('Status invalid'),
], appointmentController.changeAppointmentStatus);
router.delete('/appointments/:id', isAuthenticated, appointmentController.deleteAppointment);

module.exports = router;
