const Room = require('../models/Room');

exports.index = async (req, res) => {
  try {
    const rooms = await Room.find({ available: true }).sort({ price: 1 });

    res.render('pages/rooms', {
      title: 'Camere - Casa Ignat',
      rooms,
    });
  } catch (error) {
    console.error('Error loading rooms:', error);
    res.status(500).render('pages/error', {
      title: 'Eroare',
      message: 'A apărut o eroare la încărcarea camerelor.',
    });
  }
};

exports.show = async (req, res) => {
  try {
    const room = await Room.findOne({ slug: req.params.slug });

    if (!room) {
      return res.status(404).render('pages/404', {
        title: 'Camera nu a fost găsită',
      });
    }

    res.render('pages/room-details', {
      title: `${room.name} - Casa Ignat`,
      room,
    });
  } catch (error) {
    console.error('Error loading room details:', error);
    res.status(500).render('pages/error', {
      title: 'Eroare',
      message: 'A apărut o eroare la încărcarea detaliilor camerei.',
    });
  }
};
