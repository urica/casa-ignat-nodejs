// Placeholder for admin controller
// This will be implemented with full CRUD functionality for managing:
// - Rooms
// - Menu items
// - Gallery images
// - Bookings
// - Contact messages
// - Testimonials
// - Settings

exports.dashboard = async (req, res) => {
  res.render('admin/dashboard', {
    title: 'Dashboard Admin - Casa Ignat',
  });
};

// Rooms
exports.listRooms = async (req, res) => {
  res.render('admin/rooms/list', { title: 'Camere - Admin' });
};

exports.createRoomForm = async (req, res) => {
  res.render('admin/rooms/create', { title: 'Adaugă Cameră' });
};

exports.createRoom = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

exports.editRoomForm = async (req, res) => {
  res.render('admin/rooms/edit', { title: 'Editează Cameră' });
};

exports.updateRoom = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

exports.deleteRoom = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

// Menu
exports.listMenuItems = async (req, res) => {
  res.render('admin/menu/list', { title: 'Meniu - Admin' });
};

exports.createMenuItemForm = async (req, res) => {
  res.render('admin/menu/create', { title: 'Adaugă Produs' });
};

exports.createMenuItem = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

exports.editMenuItemForm = async (req, res) => {
  res.render('admin/menu/edit', { title: 'Editează Produs' });
};

exports.updateMenuItem = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

exports.deleteMenuItem = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

// Gallery
exports.listGalleryImages = async (req, res) => {
  res.render('admin/gallery/list', { title: 'Galerie - Admin' });
};

exports.uploadGalleryForm = async (req, res) => {
  res.render('admin/gallery/upload', { title: 'Încarcă Imagini' });
};

exports.uploadGalleryImages = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

exports.deleteGalleryImage = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

// Bookings
exports.listBookings = async (req, res) => {
  res.render('admin/bookings/list', { title: 'Rezervări - Admin' });
};

exports.viewBooking = async (req, res) => {
  res.render('admin/bookings/view', { title: 'Detalii Rezervare' });
};

exports.updateBookingStatus = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

// Messages
exports.listMessages = async (req, res) => {
  res.render('admin/messages/list', { title: 'Mesaje - Admin' });
};

exports.viewMessage = async (req, res) => {
  res.render('admin/messages/view', { title: 'Detalii Mesaj' });
};

exports.markMessageAsRead = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

// Testimonials
exports.listTestimonials = async (req, res) => {
  res.render('admin/testimonials/list', { title: 'Testimoniale - Admin' });
};

exports.approveTestimonial = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

exports.deleteTestimonial = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

// Settings
exports.settings = async (req, res) => {
  res.render('admin/settings', { title: 'Setări - Admin' });
};

exports.updateSettings = async (req, res) => {
  res.json({ success: true, message: 'To be implemented' });
};

// Appointments
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');

exports.listAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const { status, service, startDate, endDate } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (service) filter.service = service;
    if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) filter.appointmentDate.$gte = new Date(startDate);
      if (endDate) filter.appointmentDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(filter)
      .populate('service', 'name category')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(limit)
      .skip(skip);

    const totalAppointments = await Appointment.countDocuments(filter);
    const totalPages = Math.ceil(totalAppointments / limit);

    const services = await Service.find({ bookable: true }).select('name');

    res.render('admin/appointments/list', {
      title: 'Programări - Admin',
      appointments,
      services,
      currentPage: page,
      totalPages,
      filters: { status, service, startDate, endDate },
    });
  } catch (error) {
    console.error('Error listing appointments:', error);
    req.flash('error', 'Eroare la încărcarea programărilor');
    res.redirect('/admin');
  }
};

exports.appointmentsCalendar = async (req, res) => {
  try {
    const services = await Service.find({ bookable: true }).select('name category');

    res.render('admin/appointments/calendar', {
      title: 'Calendar Programări - Admin',
      services,
    });
  } catch (error) {
    console.error('Error loading calendar:', error);
    req.flash('error', 'Eroare la încărcarea calendarului');
    res.redirect('/admin/programari');
  }
};

exports.appointmentsReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get statistics
    const totalAppointments = await Appointment.countDocuments(dateFilter);

    const byStatus = await Appointment.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byService = await Appointment.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceDetails',
        },
      },
      { $unwind: '$serviceDetails' },
      {
        $group: {
          _id: '$service',
          serviceName: { $first: '$serviceDetails.name' },
          count: { $sum: 1 },
          revenue: { $sum: '$price' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const noShowCount = await Appointment.countDocuments({
      ...dateFilter,
      status: 'no_show',
    });

    const convertedCount = await Appointment.countDocuments({
      ...dateFilter,
      status: { $in: ['confirmed', 'completed'] },
    });

    const revenueResult = await Appointment.aggregate([
      { $match: { ...dateFilter, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]);

    const statistics = {
      totalAppointments,
      byStatus,
      byService,
      noShowRate: totalAppointments > 0 ? ((noShowCount / totalAppointments) * 100).toFixed(2) : 0,
      conversionRate: totalAppointments > 0 ? ((convertedCount / totalAppointments) * 100).toFixed(2) : 0,
      totalRevenue: revenueResult.length > 0 ? revenueResult[0].total : 0,
    };

    res.render('admin/appointments/reports', {
      title: 'Rapoarte Programări - Admin',
      statistics,
      filters: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    req.flash('error', 'Eroare la generarea rapoartelor');
    res.redirect('/admin/programari');
  }
};

exports.viewAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('service')
      .populate('statusHistory.changedBy', 'name email');

    if (!appointment) {
      req.flash('error', 'Programarea nu a fost găsită');
      return res.redirect('/admin/programari');
    }

    res.render('admin/appointments/view', {
      title: `Programare ${appointment.clientInfo.name} - Admin`,
      appointment,
    });
  } catch (error) {
    console.error('Error viewing appointment:', error);
    req.flash('error', 'Eroare la încărcarea programării');
    res.redirect('/admin/programari');
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      req.flash('error', 'Programarea nu a fost găsită');
      return res.redirect('/admin/programari');
    }

    const { status, internalNotes, paymentStatus } = req.body;

    if (status && status !== appointment.status) {
      await appointment.changeStatus(status, req.session.user._id, 'Modificat din admin');
    }

    if (internalNotes !== undefined) {
      appointment.internalNotes = internalNotes;
    }

    if (paymentStatus) {
      appointment.paymentStatus = paymentStatus;
    }

    await appointment.save();

    req.flash('success', 'Programarea a fost actualizată cu succes');
    res.redirect(`/admin/programari/${appointment._id}`);
  } catch (error) {
    console.error('Error updating appointment:', error);
    req.flash('error', 'Eroare la actualizarea programării');
    res.redirect(`/admin/programari/${req.params.id}`);
  }
};
