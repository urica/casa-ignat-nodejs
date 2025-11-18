const Room = require('../models/Room');
const Testimonial = require('../models/Testimonial');
const Booking = require('../models/Booking');
const { sendEmail } = require('../../config/email');
const { validationResult } = require('express-validator');

exports.index = async (req, res) => {
  try {
    // Get featured rooms
    const featuredRooms = await Room.find({ featured: true }).limit(3);

    // Get approved testimonials
    const testimonials = await Testimonial.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(6);

    res.render('pages/home', {
      title: 'Casa Ignat - Pensiune și Restaurant',
      featuredRooms,
      testimonials,
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).render('pages/error', {
      title: 'Eroare',
      message: 'A apărut o eroare la încărcarea paginii.',
    });
  }
};

exports.booking = async (req, res) => {
  try {
    const rooms = await Room.find({ available: true }).sort({ price: 1 });

    res.render('pages/booking', {
      title: 'Rezervare - Casa Ignat',
      rooms,
    });
  } catch (error) {
    console.error('Error loading booking page:', error);
    res.status(500).render('pages/error', {
      title: 'Eroare',
      message: 'A apărut o eroare la încărcarea paginii de rezervare.',
    });
  }
};

exports.submitBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { roomId, checkIn, checkOut, guests, name, email, phone, message } = req.body;

    // Create booking
    const booking = new Booking({
      room: roomId,
      checkIn,
      checkOut,
      guests,
      name,
      email,
      phone,
      message,
      status: 'pending',
    });

    await booking.save();

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'Confirmare cerere de rezervare - Casa Ignat',
      html: `
        <h2>Mulțumim pentru cererea de rezervare!</h2>
        <p>Dragă ${name},</p>
        <p>Am primit cererea dumneavoastră de rezervare și vă vom contacta în curând pentru confirmare.</p>
        <p><strong>Detalii rezervare:</strong></p>
        <ul>
          <li>Check-in: ${new Date(checkIn).toLocaleDateString('ro-RO')}</li>
          <li>Check-out: ${new Date(checkOut).toLocaleDateString('ro-RO')}</li>
          <li>Număr persoane: ${guests}</li>
        </ul>
        <p>Cu stimă,<br>Echipa Casa Ignat</p>
      `,
    });

    // Send notification email to admin
    await sendEmail({
      to: process.env.BOOKING_EMAIL,
      subject: 'Cerere nouă de rezervare',
      html: `
        <h2>Cerere nouă de rezervare</h2>
        <p><strong>Detalii client:</strong></p>
        <ul>
          <li>Nume: ${name}</li>
          <li>Email: ${email}</li>
          <li>Telefon: ${phone}</li>
        </ul>
        <p><strong>Detalii rezervare:</strong></p>
        <ul>
          <li>Check-in: ${new Date(checkIn).toLocaleDateString('ro-RO')}</li>
          <li>Check-out: ${new Date(checkOut).toLocaleDateString('ro-RO')}</li>
          <li>Număr persoane: ${guests}</li>
          <li>Mesaj: ${message || 'N/A'}</li>
        </ul>
      `,
    });

    res.json({
      success: true,
      message: 'Cererea de rezervare a fost trimisă cu succes!',
    });
  } catch (error) {
    console.error('Error submitting booking:', error);
    res.status(500).json({
      success: false,
      message: 'A apărut o eroare la trimiterea cererii de rezervare.',
    });
  }
};
