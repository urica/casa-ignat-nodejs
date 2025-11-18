const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Service reference
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Serviciul este obligatoriu'],
  },

  // Appointment date and time
  appointmentDate: {
    type: Date,
    required: [true, 'Data programării este obligatorie'],
  },
  appointmentTime: {
    type: String, // Format: "HH:MM"
    required: [true, 'Ora programării este obligatorie'],
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },

  // Client information
  clientInfo: {
    name: {
      type: String,
      required: [true, 'Numele este obligatoriu'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email-ul este obligatoriu'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Numărul de telefon este obligatoriu'],
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: ['masculin', 'feminin', 'altul', 'prefer_sa_nu_specific'],
    },
    problemDescription: {
      type: String,
      maxlength: [1000, 'Descrierea problemei poate avea maxim 1000 caractere'],
    },
    referralSource: {
      type: String,
      enum: [
        'google',
        'facebook',
        'instagram',
        'recomandare',
        'publicitate',
        'altul',
      ],
    },
    referralSourceOther: {
      type: String,
      trim: true,
    },
  },

  // Status tracking
  status: {
    type: String,
    enum: ['new', 'confirmed', 'waiting', 'cancelled', 'completed', 'no_show'],
    default: 'new',
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['new', 'confirmed', 'waiting', 'cancelled', 'completed', 'no_show'],
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  }],

  // Internal notes (admin only)
  internalNotes: {
    type: String,
    maxlength: [2000, 'Notele interne pot avea maxim 2000 caractere'],
  },

  // Pricing
  price: {
    type: Number,
    min: 0,
  },
  currency: {
    type: String,
    default: 'RON',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },

  // Notifications
  reminderPreferences: {
    email: {
      type: Boolean,
      default: true,
    },
    sms: {
      type: Boolean,
      default: false,
    },
  },
  notificationsSent: {
    confirmationEmail: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
    },
    reminder24h: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
    },
    reminderSMS: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
    },
    followUp: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
    },
  },

  // Terms acceptance
  termsAccepted: {
    type: Boolean,
    required: [true, 'Termenii și condițiile trebuie acceptate'],
    default: false,
  },
  termsAcceptedAt: {
    type: Date,
  },

  // Cancellation
  cancellationReason: {
    type: String,
    maxlength: [500, 'Motivul anulării poate avea maxim 500 caractere'],
  },
  cancelledAt: {
    type: Date,
  },
  cancelledBy: {
    type: String,
    enum: ['client', 'admin'],
  },

  // Metadata
  userAgent: String,
  ipAddress: String,

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for full appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function() {
  if (!this.appointmentDate || !this.appointmentTime) return null;

  const [hours, minutes] = this.appointmentTime.split(':');
  const date = new Date(this.appointmentDate);
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  return date;
});

// Virtual for end time
appointmentSchema.virtual('appointmentEndTime').get(function() {
  if (!this.appointmentDateTime || !this.duration) return null;

  const endTime = new Date(this.appointmentDateTime);
  endTime.setMinutes(endTime.getMinutes() + this.duration);

  return endTime;
});

// Pre-save middleware to set price from service
appointmentSchema.pre('save', async function(next) {
  if (this.isModified('service') && !this.price) {
    const Service = mongoose.model('Service');
    const service = await Service.findById(this.service);

    if (service && service.price) {
      this.price = service.price;
    }
    if (service && service.duration) {
      this.duration = service.duration;
    }
  }

  // Set terms accepted timestamp
  if (this.isModified('termsAccepted') && this.termsAccepted && !this.termsAcceptedAt) {
    this.termsAcceptedAt = new Date();
  }

  next();
});

// Add status change to history
appointmentSchema.methods.changeStatus = async function(newStatus, userId, notes) {
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: userId,
    notes: notes || '',
  });
  this.status = newStatus;

  // Track cancellation
  if (newStatus === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }

  await this.save();
};

// Check if appointment is in the past
appointmentSchema.methods.isPast = function() {
  return this.appointmentDateTime < new Date();
};

// Check if appointment is upcoming (within 24 hours)
appointmentSchema.methods.isUpcoming = function() {
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return this.appointmentDateTime > now && this.appointmentDateTime <= twentyFourHoursFromNow;
};

// Static method to find available time slots for a date
appointmentSchema.statics.findAvailableSlots = async function(date, serviceId) {
  const Service = mongoose.model('Service');
  const service = await Service.findById(serviceId);

  if (!service || !service.duration) {
    throw new Error('Serviciu invalid sau fără durată specificată');
  }

  // Business hours configuration (can be moved to settings)
  const businessHours = {
    start: '09:00',
    end: '18:00',
    interval: 30, // minutes between slots
  };

  // Get all appointments for the given date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await this.find({
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['cancelled', 'no_show'] },
  }).sort({ appointmentTime: 1 });

  // Generate all possible slots
  const allSlots = [];
  const [startHour, startMin] = businessHours.start.split(':').map(Number);
  const [endHour, endMin] = businessHours.end.split(':').map(Number);

  let currentTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin - service.duration;

  while (currentTime <= endTime) {
    const hours = Math.floor(currentTime / 60);
    const minutes = currentTime % 60;
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    // Check if slot is available
    const isBooked = existingAppointments.some(apt => {
      const aptStart = apt.appointmentTime;
      const [aptHour, aptMin] = aptStart.split(':').map(Number);
      const aptStartMinutes = aptHour * 60 + aptMin;
      const aptEndMinutes = aptStartMinutes + apt.duration;

      return (currentTime >= aptStartMinutes && currentTime < aptEndMinutes) ||
             (currentTime + service.duration > aptStartMinutes && currentTime < aptEndMinutes);
    });

    allSlots.push({
      time: timeString,
      available: !isBooked,
    });

    currentTime += businessHours.interval;
  }

  return allSlots;
};

// Indexes for better query performance
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ service: 1, status: 1 });
appointmentSchema.index({ 'clientInfo.email': 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
