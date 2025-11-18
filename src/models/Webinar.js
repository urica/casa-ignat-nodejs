const mongoose = require('mongoose');

const webinarSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: String,

  image: String,

  presenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  scheduledDate: {
    type: Date,
    required: true,
  },

  duration: Number, // minutes

  streamUrl: String,

  recordingUrl: String,

  registrations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: String,
    email: String,
    phone: String,
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    attended: {
      type: Boolean,
      default: false,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  }],

  maxAttendees: {
    type: Number,
    default: 100,
  },

  questions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: String,
    question: String,
    askedAt: Date,
    answered: Boolean,
    answer: String,
  }],

  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled',
  },
}, {
  timestamps: true,
});

webinarSchema.index({ scheduledDate: 1, status: 1 });
webinarSchema.index({ presenter: 1 });

module.exports = mongoose.model('Webinar', webinarSchema);
