const ConsentTracking = require('../models/ConsentTracking');
const DataRequest = require('../models/DataRequest');
const GDPRService = require('../services/gdprService');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

/**
 * Privacy Controller
 * Handles privacy policy, cookie policy, consent management, and GDPR requests
 */

/**
 * Display Privacy Policy page
 */
exports.showPrivacyPolicy = (req, res) => {
  res.render('privacy/policy', {
    title: 'Politica de Confidențialitate',
    version: '1.0',
    lastUpdated: new Date('2024-01-01'),
  });
};

/**
 * Display Cookie Policy page
 */
exports.showCookiePolicy = (req, res) => {
  res.render('privacy/cookies', {
    title: 'Politica de Cookie-uri',
    version: '1.0',
    lastUpdated: new Date('2024-01-01'),
  });
};

/**
 * Display consent management page
 */
exports.showConsentPage = async (req, res) => {
  try {
    const identifier = req.user?.id || req.user?.email || req.session.id;
    let currentConsent = null;

    if (identifier) {
      currentConsent = await ConsentTracking.getActiveConsent(identifier);
    }

    res.render('privacy/consent', {
      title: 'Gestionare Consimțământ',
      currentConsent,
    });
  } catch (error) {
    console.error('Error loading consent page:', error);
    req.flash('error', 'Eroare la încărcarea paginii de consimțământ');
    res.redirect('/');
  }
};

/**
 * Update consent preferences
 */
exports.updateConsent = async (req, res) => {
  try {
    const { analytics, marketing, preferences, thirdParty } = req.body;

    const consentData = {
      necessary: true, // Always required
      analytics: analytics === 'true' || analytics === true,
      marketing: marketing === 'true' || marketing === true,
      preferences: preferences === 'true' || preferences === true,
      thirdParty: thirdParty === 'true' || thirdParty === true,
    };

    const identifier = req.user?.id || req.user?.email || req.session.id;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Nu s-a putut identifica utilizatorul',
      });
    }

    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      consentMethod: 'preferences',
      privacyPolicyVersion: '1.0',
    };

    await ConsentTracking.updateConsent(identifier, consentData, metadata);

    // Set consent cookie
    res.cookie('cookieConsent', JSON.stringify(consentData), {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    if (req.xhr || req.path.startsWith('/api/')) {
      return res.json({
        success: true,
        message: 'Preferințele au fost actualizate cu succes',
      });
    }

    req.flash('success', 'Preferințele dvs. de confidențialitate au fost actualizate');
    res.redirect('/privacy/consent');
  } catch (error) {
    console.error('Error updating consent:', error);

    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(500).json({
        success: false,
        message: 'Eroare la actualizarea preferințelor',
      });
    }

    req.flash('error', 'Eroare la actualizarea preferințelor');
    res.redirect('/privacy/consent');
  }
};

/**
 * Display data request form
 */
exports.showDataRequestForm = (req, res) => {
  res.render('privacy/data-request', {
    title: 'Solicitare Date Personale',
  });
};

/**
 * Submit data request (access, erasure, portability, etc.)
 */
exports.submitDataRequest = async (req, res) => {
  try {
    const { requestType, email, description } = req.body;

    if (!requestType || !email) {
      if (req.xhr || req.path.startsWith('/api/')) {
        return res.status(400).json({
          success: false,
          message: 'Tipul cererii și email-ul sunt obligatorii',
        });
      }

      req.flash('error', 'Tipul cererii și email-ul sunt obligatorii');
      return res.redirect('/privacy/data-request');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create data request
    const dataRequest = await DataRequest.create({
      user: req.user?.id,
      email: email.toLowerCase(),
      requestType,
      description,
      verificationToken,
      verificationTokenExpiry,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    // Send verification email
    const verificationUrl = `${process.env.APP_URL}/privacy/verify-request/${verificationToken}`;

    await sendEmail({
      to: email,
      subject: 'Verificare Solicitare Date Personale',
      template: 'data-request-verification',
      context: {
        requestType: requestType,
        verificationUrl,
        expiryHours: 24,
      },
    });

    if (req.xhr || req.path.startsWith('/api/')) {
      return res.json({
        success: true,
        message: 'Solicitarea a fost trimisă. Verificați email-ul pentru confirmare.',
      });
    }

    req.flash('success', 'Solicitarea a fost trimisă. Vă rugăm verificați email-ul pentru confirmare.');
    res.redirect('/');
  } catch (error) {
    console.error('Error submitting data request:', error);

    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(500).json({
        success: false,
        message: 'Eroare la trimiterea solicitării',
      });
    }

    req.flash('error', 'Eroare la trimiterea solicitării');
    res.redirect('/privacy/data-request');
  }
};

/**
 * Verify data request via email token
 */
exports.verifyDataRequest = async (req, res) => {
  try {
    const { token } = req.params;

    const dataRequest = await DataRequest.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
      isVerified: false,
    });

    if (!dataRequest) {
      req.flash('error', 'Token invalid sau expirat');
      return res.redirect('/');
    }

    await dataRequest.verify();

    req.flash('success', 'Solicitarea a fost verificată cu succes. O vom procesa în maxim 30 de zile.');
    res.redirect('/');
  } catch (error) {
    console.error('Error verifying data request:', error);
    req.flash('error', 'Eroare la verificarea solicitării');
    res.redirect('/');
  }
};

/**
 * Download user data export (for verified data requests)
 */
exports.downloadDataExport = async (req, res) => {
  try {
    const { requestId } = req.params;

    const dataRequest = await DataRequest.findById(requestId);

    if (!dataRequest || dataRequest.status !== 'completed') {
      return res.status(404).json({
        success: false,
        message: 'Export not found or not ready',
      });
    }

    // Check if export file exists and is not expired
    if (!dataRequest.exportFilePath || dataRequest.exportFileExpiry < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'Export has expired. Please request a new export.',
      });
    }

    res.download(dataRequest.exportFilePath);
  } catch (error) {
    console.error('Error downloading data export:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading export',
    });
  }
};

/**
 * Request account deletion
 */
exports.requestAccountDeletion = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Trebuie să fiți autentificat',
      });
    }

    const result = await GDPRService.scheduleAccountDeletion(req.user.id, 30);

    if (req.xhr || req.path.startsWith('/api/')) {
      return res.json({
        success: true,
        message: 'Solicitarea de ștergere a fost înregistrată. Contul va fi șters în 30 de zile.',
        scheduledDate: result.scheduledDate,
      });
    }

    req.flash('warning', 'Solicitarea de ștergere a fost înregistrată. Contul va fi șters în 30 de zile.');
    res.redirect('/admin/profile');
  } catch (error) {
    console.error('Error requesting account deletion:', error);

    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(500).json({
        success: false,
        message: 'Eroare la procesarea solicitării',
      });
    }

    req.flash('error', 'Eroare la procesarea solicitării de ștergere');
    res.redirect('/admin/profile');
  }
};

/**
 * Cancel account deletion
 */
exports.cancelAccountDeletion = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Trebuie să fiți autentificat',
      });
    }

    await GDPRService.cancelAccountDeletion(req.user.id);

    if (req.xhr || req.path.startsWith('/api/')) {
      return res.json({
        success: true,
        message: 'Solicitarea de ștergere a fost anulată',
      });
    }

    req.flash('success', 'Solicitarea de ștergere a fost anulată cu succes');
    res.redirect('/admin/profile');
  } catch (error) {
    console.error('Error cancelling account deletion:', error);

    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(500).json({
        success: false,
        message: 'Eroare la anularea solicitării',
      });
    }

    req.flash('error', 'Eroare la anularea solicitării de ștergere');
    res.redirect('/admin/profile');
  }
};

/**
 * Export user data (authenticated users)
 */
exports.exportMyData = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Trebuie să fiți autentificat',
      });
    }

    const { filepath, filename, expiryDate } = await GDPRService.createExportArchive(req.user.id);

    // Update or create data request
    await DataRequest.findOneAndUpdate(
      {
        user: req.user.id,
        requestType: 'access',
        status: 'pending',
      },
      {
        status: 'completed',
        exportFilePath: filepath,
        exportFileExpiry: expiryDate,
        processedAt: new Date(),
      },
      { upsert: true }
    );

    if (req.xhr || req.path.startsWith('/api/')) {
      return res.json({
        success: true,
        message: 'Exportul a fost creat cu succes',
        downloadUrl: `/privacy/download-export/${filename}`,
        expiryDate,
      });
    }

    res.download(filepath, filename);
  } catch (error) {
    console.error('Error exporting user data:', error);

    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(500).json({
        success: false,
        message: 'Eroare la exportarea datelor',
      });
    }

    req.flash('error', 'Eroare la exportarea datelor');
    res.redirect('/admin/profile');
  }
};

module.exports = exports;
