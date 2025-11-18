const express = require('express');
const router = express.Router();
const privacyController = require('../controllers/privacyController');
const { requireAuth } = require('../middleware/auth');
const { dataExportLimiter } = require('../middleware/rateLimiter');

/**
 * Privacy and GDPR Routes
 */

// Public routes
router.get('/policy', privacyController.showPrivacyPolicy);
router.get('/cookies', privacyController.showCookiePolicy);
router.get('/consent', privacyController.showConsentPage);
router.post('/consent', privacyController.updateConsent);

// Data request routes
router.get('/data-request', privacyController.showDataRequestForm);
router.post('/data-request', privacyController.submitDataRequest);
router.get('/verify-request/:token', privacyController.verifyDataRequest);

// Authenticated routes
router.post('/request-deletion', requireAuth, privacyController.requestAccountDeletion);
router.post('/cancel-deletion', requireAuth, privacyController.cancelAccountDeletion);
router.get('/export-data', requireAuth, dataExportLimiter, privacyController.exportMyData);
router.get('/download-export/:requestId', privacyController.downloadDataExport);

module.exports = router;
