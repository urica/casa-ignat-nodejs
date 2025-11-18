const User = require('../models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const auditLog = require('../middleware/auditLog');

// Show login form
exports.loginForm = (req, res) => {
  res.render('admin/auth/login', {
    title: 'Autentificare',
    csrfToken: req.session.csrfToken,
  });
};

// Handle login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      await auditLog.logLogin(req, false, email, 'User not found');
      req.flash('error', 'Email sau parolă incorectă');
      return res.redirect('/admin/login');
    }

    // Check if account is locked
    if (user.isLocked()) {
      await auditLog.logLogin(req, false, email, 'Account locked');
      req.flash('error', 'Contul este blocat temporar. Încercați mai târziu.');
      return res.redirect('/admin/login');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await user.incLoginAttempts();
      await auditLog.logLogin(req, false, email, 'Invalid password');
      req.flash('error', 'Email sau parolă incorectă');
      return res.redirect('/admin/login');
    }

    // Reset login attempts
    await user.resetLoginAttempts();

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      req.session.pendingUserId = user._id;
      return res.redirect('/admin/verify-2fa');
    }

    // Set session
    req.session.userId = user._id;
    req.session.twoFactorVerified = false;

    await auditLog.logLogin(req, true, email);
    req.flash('success', `Bun venit, ${user.name}!`);
    res.redirect('/admin');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'A apărut o eroare. Vă rugăm încercați din nou.');
    res.redirect('/admin/login');
  }
};

// Show 2FA verification form
exports.verify2FAForm = (req, res) => {
  if (!req.session.pendingUserId) {
    return res.redirect('/admin/login');
  }

  res.render('admin/auth/verify-2fa', {
    title: 'Verificare 2FA',
    csrfToken: req.session.csrfToken,
  });
};

// Handle 2FA verification
exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.session.pendingUserId;

    if (!userId) {
      return res.redirect('/admin/login');
    }

    const user = await User.findById(userId).select('+twoFactorSecret');

    if (!user) {
      return res.redirect('/admin/login');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      req.flash('error', 'Cod 2FA invalid');
      return res.redirect('/admin/verify-2fa');
    }

    // Set session
    req.session.userId = user._id;
    req.session.twoFactorVerified = true;
    delete req.session.pendingUserId;

    await user.resetLoginAttempts();
    await auditLog.logLogin(req, true, user.email, '2FA verified');

    req.flash('success', `Bun venit, ${user.name}!`);
    res.redirect('/admin');
  } catch (error) {
    console.error('2FA verification error:', error);
    req.flash('error', 'A apărut o eroare. Vă rugăm încercați din nou.');
    res.redirect('/admin/verify-2fa');
  }
};

// Logout
exports.logout = async (req, res) => {
  await auditLog.logLogout(req);
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/admin/login');
  });
};

// Enable 2FA - Show QR code
exports.enable2FAForm = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `Casa Ignat CMS (${req.user.email})`,
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    req.session.tempTwoFactorSecret = secret.base32;

    res.render('admin/auth/enable-2fa', {
      title: 'Activare 2FA',
      qrCodeUrl,
      secret: secret.base32,
      csrfToken: req.session.csrfToken,
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    req.flash('error', 'A apărut o eroare');
    res.redirect('/admin/security');
  }
};

// Verify and enable 2FA
exports.enable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const secret = req.session.tempTwoFactorSecret;

    if (!secret) {
      req.flash('error', 'Sesiune expirată');
      return res.redirect('/admin/security');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      req.flash('error', 'Cod invalid');
      return res.redirect('/admin/enable-2fa');
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: backupCodes,
    });

    delete req.session.tempTwoFactorSecret;
    await auditLog.log(req, '2fa_enable', 'user', req.user._id);

    req.session.backupCodes = backupCodes;
    res.redirect('/admin/2fa-backup-codes');
  } catch (error) {
    console.error('Enable 2FA error:', error);
    req.flash('error', 'A apărut o eroare');
    res.redirect('/admin/security');
  }
};

// Show backup codes
exports.showBackupCodes = (req, res) => {
  const backupCodes = req.session.backupCodes;

  if (!backupCodes) {
    return res.redirect('/admin/security');
  }

  res.render('admin/auth/backup-codes', {
    title: 'Coduri de backup 2FA',
    backupCodes,
    csrfToken: req.session.csrfToken,
  });
};

// Disable 2FA
exports.disable2FA = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      twoFactorEnabled: false,
      $unset: { twoFactorSecret: 1, twoFactorBackupCodes: 1 },
    });

    await auditLog.log(req, '2fa_disable', 'user', req.user._id);

    req.flash('success', '2FA a fost dezactivat');
    res.redirect('/admin/security');
  } catch (error) {
    console.error('Disable 2FA error:', error);
    req.flash('error', 'A apărut o eroare');
    res.redirect('/admin/security');
  }
};
