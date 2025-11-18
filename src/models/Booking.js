const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Camera este obligatorie'],
  },
  checkIn: {
    type: Date,
    required: [true, 'Data de check-in este obligatorie'],
  },
  checkOut: {
    type: Date,
    required: [true, 'Data de check-out este obligatorie'],
  },
  guests: {
    type: Number,
    required: [true, 'Numărul de persoane este obligatoriu'],
    min: 1,
  },
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
  message: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  totalPrice: {
    type: Number,
    min: 0,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Calculate total price before saving
bookingSchema.pre('save', async function(next) {
  if (this.isModified('checkIn') || this.isModified('checkOut') || this.isModified('room')) {
    const Room = mongoose.model('Room');
    const room = await Room.findById(this.room);

    if (room) {
      const days = Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
      this.totalPrice = room.price * days;
    }
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
