const BlogPost = require('../models/BlogPost');
const Page = require('../models/Page');
const Service = require('../models/Service');
const TeamMember = require('../models/TeamMember');
const Testimonial = require('../models/Testimonial');
const Booking = require('../models/Booking');
const Media = require('../models/Media');
const Settings = require('../models/Settings');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const auditLog = require('../middleware/auditLog');

// Dashboard
exports.dashboard = async (req, res) => {
  try {
    // Get statistics
    const [
      totalPosts,
      publishedPosts,
      totalBookings,
      pendingBookings,
      totalTestimonials,
      pendingTestimonials,
      totalVisitors,
    ] = await Promise.all([
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ status: 'published' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Testimonial.countDocuments(),
      Testimonial.countDocuments({ approved: false }),
      // In a real app, you'd get this from analytics
      Promise.resolve(0),
    ]);

    // Get recent activity
    const recentActivity = await AuditLog.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('room');

    res.render('admin/dashboard/index', {
      title: 'Dashboard',
      currentPath: '/admin',
      stats: {
        totalPosts,
        publishedPosts,
        totalBookings,
        pendingBookings,
        totalTestimonials,
        pendingTestimonials,
        totalVisitors,
      },
      recentActivity,
      recentBookings,
      csrfToken: req.session.csrfToken,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error', 'Eroare la încărcarea dashboard-ului');
    res.redirect('/admin/login');
  }
};

// Profile
exports.profile = async (req, res) => {
  res.render('admin/auth/profile', {
    title: 'Profilul Meu',
    currentPath: '/admin/profile',
    csrfToken: req.session.csrfToken,
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    await User.findByIdAndUpdate(req.user._id, { name, email });
    await auditLog.log(req, 'update', 'user', req.user._id, 'Profile updated');

    req.flash('success', 'Profilul a fost actualizat');
    res.redirect('/admin/profile');
  } catch (error) {
    console.error('Update profile error:', error);
    req.flash('error', 'Eroare la actualizarea profilului');
    res.redirect('/admin/profile');
  }
};

// Security page
exports.security = async (req, res) => {
  const user = await User.findById(req.user._id);

  res.render('admin/auth/security', {
    title: 'Securitate',
    currentPath: '/admin/security',
    twoFactorEnabled: user.twoFactorEnabled,
    csrfToken: req.session.csrfToken,
  });
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash('error', 'Parolele nu coincid');
      return res.redirect('/admin/security');
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      req.flash('error', 'Parola curentă este incorectă');
      return res.redirect('/admin/security');
    }

    user.password = newPassword;
    await user.save();

    await auditLog.log(req, 'password_change', 'user', req.user._id);

    req.flash('success', 'Parola a fost schimbată');
    res.redirect('/admin/security');
  } catch (error) {
    console.error('Change password error:', error);
    req.flash('error', 'Eroare la schimbarea parolei');
    res.redirect('/admin/security');
  }
};
