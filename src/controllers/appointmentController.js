const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');
const calendarService = require('../services/calendarService');

// @desc    Display appointment booking form
// @route   GET /programari
// @access  Public
exports.showBookingForm = async (req, res) => {
  try {
    // Get all bookable services
    const services = await Service.find({
      available: true,
      bookable: true,
    }).sort({ displayOrder: 1, name: 1 });

    res.render('appointments/booking-form', {
      title: 'Programare Online | Casa Ignat',
      description: 'Rezervă o programare online pentru serviciile noastre',
      services,
      step: 1,
      seo: {
        title: 'Programare Online | Casa Ignat',
        description: 'Programează-te online rapid și ușor pentru consultație nutrițională',
        noIndex: false,
      },
    });
  } catch (error) {
    console.error('Error loading booking form:', error);
    req.flash('error', 'A apărut o eroare la încărcarea formularului');
    res.redirect('/');
  }
};

// @desc    Get available time slots for a specific date and service
// @route   GET /api/appointments/available-slots
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Data și serviciul sunt obligatorii',
      });
    }

    // Check if date is in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Nu puteți rezerva o programare în trecut',
      });
    }

    // Check if it's a weekend (optional - can be configured)
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.json({
        success: true,
        slots: [],
        message: 'Nu lucrăm în weekend',
      });
    }

    const slots = await Appointment.findAvailableSlots(date, serviceId);

    res.json({
      success: true,
      slots,
      date,
    });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea sloturilor disponibile',
    });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Public
exports.createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      serviceId,
      appointmentDate,
      appointmentTime,
      name,
      email,
      phone,
      age,
      gender,
      problemDescription,
      referralSource,
      referralSourceOther,
      reminderEmail,
      reminderSMS,
      termsAccepted,
    } = req.body;

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service || !service.bookable) {
      return res.status(400).json({
        success: false,
        message: 'Serviciul selectat nu este disponibil pentru programare',
      });
    }

    // Check if slot is still available
    const slots = await Appointment.findAvailableSlots(appointmentDate, serviceId);
    const selectedSlot = slots.find(slot => slot.time === appointmentTime);

    if (!selectedSlot || !selectedSlot.available) {
      return res.status(400).json({
        success: false,
        message: 'Slotul selectat nu mai este disponibil. Vă rugăm alegeți alt interval orar.',
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      service: serviceId,
      appointmentDate,
      appointmentTime,
      duration: service.duration,
      clientInfo: {
        name,
        email,
        phone,
        age,
        gender,
        problemDescription,
        referralSource,
        referralSourceOther,
      },
      price: service.price,
      currency: service.currency,
      reminderPreferences: {
        email: reminderEmail !== false,
        sms: reminderSMS === true,
      },
      termsAccepted,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    await appointment.populate('service');

    // Send confirmation email
    try {
      await emailService.sendAppointmentConfirmation(appointment);
      appointment.notificationsSent.confirmationEmail.sent = true;
      appointment.notificationsSent.confirmationEmail.sentAt = new Date();
      await appointment.save();
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the appointment creation if email fails
    }

    // Send notification to admin
    try {
      await emailService.sendNewAppointmentNotification(appointment);
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Programarea a fost creată cu succes! Veți primi un email de confirmare.',
      appointment: {
        id: appointment._id,
        service: service.name,
        date: appointmentDate,
        time: appointmentTime,
      },
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'A apărut o eroare la crearea programării',
    });
  }
};

// @desc    Get all appointments (Admin)
// @route   GET /api/appointments
// @access  Private/Admin
exports.getAllAppointments = async (req, res) => {
  try {
    const {
      status,
      service,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // Filters
    if (status) {
      query.status = status;
    }
    if (service) {
      query.service = service;
    }
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) {
        query.appointmentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.appointmentDate.$lte = new Date(endDate);
      }
    }

    const appointments = await Appointment.find(query)
      .populate('service', 'name category duration price')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Appointment.countDocuments(query);

    res.json({
      success: true,
      appointments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea programărilor',
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private/Admin
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('service')
      .populate('statusHistory.changedBy', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Programarea nu a fost găsită',
      });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error('Error getting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea programării',
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private/Admin
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Programarea nu a fost găsită',
      });
    }

    const {
      appointmentDate,
      appointmentTime,
      internalNotes,
      paymentStatus,
    } = req.body;

    // Update allowed fields
    if (appointmentDate) appointment.appointmentDate = appointmentDate;
    if (appointmentTime) appointment.appointmentTime = appointmentTime;
    if (internalNotes !== undefined) appointment.internalNotes = internalNotes;
    if (paymentStatus) appointment.paymentStatus = paymentStatus;

    await appointment.save();

    // If date/time changed, send notification to client
    if (appointmentDate || appointmentTime) {
      try {
        await emailService.sendAppointmentRescheduled(appointment);
      } catch (emailError) {
        console.error('Error sending reschedule notification:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Programarea a fost actualizată',
      appointment,
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la actualizarea programării',
    });
  }
};

// @desc    Change appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private/Admin
exports.changeAppointmentStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Programarea nu a fost găsită',
      });
    }

    const { status, notes } = req.body;

    if (!['new', 'confirmed', 'waiting', 'cancelled', 'completed', 'no_show'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status invalid',
      });
    }

    await appointment.changeStatus(status, req.session.user._id, notes);

    // Send notification based on status
    try {
      if (status === 'confirmed') {
        await emailService.sendAppointmentConfirmed(appointment);
      } else if (status === 'cancelled') {
        await emailService.sendAppointmentCancelled(appointment);
      }
    } catch (emailError) {
      console.error('Error sending status notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Status-ul programării a fost actualizat',
      appointment,
    });
  } catch (error) {
    console.error('Error changing status:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la schimbarea statusului',
    });
  }
};

// @desc    Cancel appointment (client)
// @route   POST /api/appointments/:id/cancel
// @access  Public (with token)
exports.cancelAppointment = async (req, res) => {
  try {
    const { email, reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Programarea nu a fost găsită',
      });
    }

    // Verify email matches
    if (appointment.clientInfo.email !== email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Email invalid',
      });
    }

    // Check if already cancelled
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Programarea este deja anulată',
      });
    }

    // Check if in the past
    if (appointment.isPast()) {
      return res.status(400).json({
        success: false,
        message: 'Nu puteți anula o programare trecută',
      });
    }

    appointment.cancellationReason = reason;
    appointment.cancelledBy = 'client';
    await appointment.changeStatus('cancelled', null, 'Anulat de client');

    // Send cancellation notification
    try {
      await emailService.sendAppointmentCancelled(appointment);
      await emailService.sendCancellationNotificationToAdmin(appointment);
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Programarea a fost anulată cu succes',
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la anularea programării',
    });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private/Admin
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Programarea nu a fost găsită',
      });
    }

    await appointment.deleteOne();

    res.json({
      success: true,
      message: 'Programarea a fost ștearsă',
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la ștergerea programării',
    });
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private/Admin
exports.getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Total appointments
    const totalAppointments = await Appointment.countDocuments(dateFilter);

    // By status
    const byStatus = await Appointment.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // By service
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

    // No-show rate
    const noShowCount = await Appointment.countDocuments({
      ...dateFilter,
      status: 'no_show',
    });
    const noShowRate = totalAppointments > 0 ? (noShowCount / totalAppointments * 100).toFixed(2) : 0;

    // Conversion rate (confirmed/completed vs total)
    const convertedCount = await Appointment.countDocuments({
      ...dateFilter,
      status: { $in: ['confirmed', 'completed'] },
    });
    const conversionRate = totalAppointments > 0 ? (convertedCount / totalAppointments * 100).toFixed(2) : 0;

    // Total revenue
    const revenueResult = await Appointment.aggregate([
      { $match: { ...dateFilter, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      success: true,
      statistics: {
        totalAppointments,
        byStatus,
        byService,
        noShowRate: parseFloat(noShowRate),
        conversionRate: parseFloat(conversionRate),
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea statisticilor',
    });
  }
};

// @desc    Export appointment to calendar (.ics)
// @route   GET /api/appointments/:id/export
// @access  Public (with token in query)
exports.exportToCalendar = async (req, res) => {
  try {
    const { email } = req.query;
    const appointment = await Appointment.findById(req.params.id)
      .populate('service');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Programarea nu a fost găsită',
      });
    }

    // Verify email for security
    if (email && appointment.clientInfo.email !== email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Acces interzis',
      });
    }

    const icsContent = calendarService.generateICS(appointment);

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="programare-${appointment._id}.ics"`);
    res.send(icsContent);
  } catch (error) {
    console.error('Error exporting to calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la exportul în calendar',
    });
  }
};

module.exports = exports;
