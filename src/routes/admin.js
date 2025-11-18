const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const csrfMiddleware = require('../middleware/csrf');
const { upload } = require('../../config/upload');
const multer = require('multer');

// Controllers
const authController = require('../controllers/authController');
const cmsController = require('../controllers/cmsController');
const blogController = require('../controllers/blogController');
const adminController = require('../controllers/adminController');

// Configure multer for blog images
const blogUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

// Authentication routes (public)
router.get('/login', authMiddleware.redirectIfAuthenticated, authController.loginForm);
router.post('/login', authMiddleware.redirectIfAuthenticated, csrfMiddleware.verifyToken, authController.login);

// 2FA routes
router.get('/verify-2fa', authController.verify2FAForm);
router.post('/verify-2fa', csrfMiddleware.verifyToken, authController.verify2FA);

// Protected routes - require authentication
router.use(authMiddleware.requireAuth);

// Logout
router.post('/logout', csrfMiddleware.verifyToken, authController.logout);

// Dashboard
router.get('/', cmsController.dashboard);

// Profile
router.get('/profile', cmsController.profile);
router.post('/profile', csrfMiddleware.verifyToken, cmsController.updateProfile);

// Security
router.get('/security', cmsController.security);
router.post('/change-password', csrfMiddleware.verifyToken, cmsController.changePassword);

// 2FA Management
router.get('/enable-2fa', authController.enable2FAForm);
router.post('/enable-2fa', csrfMiddleware.verifyToken, authController.enable2FA);
router.get('/2fa-backup-codes', authController.showBackupCodes);
router.post('/disable-2fa', csrfMiddleware.verifyToken, authController.disable2FA);

// Blog Posts - require blog permission
router.get('/blog', authMiddleware.requirePermission('blog'), blogController.list);
router.get('/blog/create', authMiddleware.requirePermission('blog'), blogController.createForm);
router.post('/blog/create', authMiddleware.requirePermission('blog'), csrfMiddleware.verifyToken,
  blogUpload.fields([{ name: 'featuredImage', maxCount: 1 }]),
  blogController.create
);
router.get('/blog/edit/:id', authMiddleware.requirePermission('blog'), blogController.editForm);
router.post('/blog/edit/:id', authMiddleware.requirePermission('blog'), csrfMiddleware.verifyToken,
  blogUpload.fields([{ name: 'featuredImage', maxCount: 1 }]),
  blogController.update
);
router.delete('/blog/:id', authMiddleware.requirePermission('blog'), csrfMiddleware.verifyToken, blogController.delete);
router.post('/blog/:id/publish', authMiddleware.requirePermission('blog'), csrfMiddleware.verifyToken, blogController.togglePublish);

// Bookings management
router.get('/bookings', authMiddleware.requirePermission('bookings'), adminController.listBookings);
router.get('/bookings/:id', authMiddleware.requirePermission('bookings'), adminController.viewBooking);
router.post('/bookings/:id/status', authMiddleware.requirePermission('bookings'), csrfMiddleware.verifyToken, adminController.updateBookingStatus);

// Testimonials
router.get('/testimonials', authMiddleware.requirePermission('testimonials'), adminController.listTestimonials);
router.post('/testimonials/:id/approve', authMiddleware.requirePermission('testimonials'), csrfMiddleware.verifyToken, adminController.approveTestimonial);
router.post('/testimonials/:id/delete', authMiddleware.requirePermission('testimonials'), csrfMiddleware.verifyToken, adminController.deleteTestimonial);

// Settings
router.get('/settings', authMiddleware.requirePermission('settings'), adminController.settings);
router.post('/settings', authMiddleware.requirePermission('settings'), csrfMiddleware.verifyToken, adminController.updateSettings);

module.exports = router;
