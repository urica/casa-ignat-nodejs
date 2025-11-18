const Room = require('../models/Room');
const MenuItem = require('../models/MenuItem');
const GalleryImage = require('../models/GalleryImage');
const Testimonial = require('../models/Testimonial');
const Contact = require('../models/Contact');
const Booking = require('../models/Booking');

// Rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ available: true }).sort({ price: 1 });
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Camera nu a fost găsită' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Menu
exports.getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({ available: true }).sort({ category: 1, order: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMenuByCategory = async (req, res) => {
  try {
    const items = await MenuItem.find({
      category: req.params.category,
      available: true
    }).sort({ order: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Gallery
exports.getGalleryImages = async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 });
    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGalleryByCategory = async (req, res) => {
  try {
    const images = await GalleryImage.find({ category: req.params.category })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Contact
exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const contact = new Contact({ name, email, phone, subject, message });
    await contact.save();
    res.json({ success: true, message: 'Mesajul a fost trimis cu succes' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Booking
exports.createBooking = async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.json({ success: true, message: 'Rezervarea a fost creată cu succes', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Testimonials
exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
