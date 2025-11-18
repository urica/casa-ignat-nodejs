const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { requireAuth, requirePermission } = require('../middleware/auth');

/**
 * Analytics Routes
 * All routes require authentication and analytics permission
 */

// Dashboard
router.get('/dashboard',
  requireAuth,
  requirePermission('settings'),
  analyticsController.showDashboard
);

// Real-time data
router.get('/realtime',
  requireAuth,
  requirePermission('settings'),
  analyticsController.getRealTimeVisitors
);

// Traffic sources
router.get('/traffic-sources',
  requireAuth,
  requirePermission('settings'),
  analyticsController.getTrafficSources
);

// Conversion report
router.get('/conversions',
  requireAuth,
  requirePermission('settings'),
  analyticsController.getConversionReport
);

// Export data
router.get('/export',
  requireAuth,
  requirePermission('settings'),
  analyticsController.exportData
);

// API: Track custom event
router.post('/track',
  analyticsController.trackEvent
);

module.exports = router;
