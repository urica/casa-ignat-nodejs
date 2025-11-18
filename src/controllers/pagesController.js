/**
 * Pages Controller
 * Handles static and informational pages
 */

// About pages
exports.echipa = async (req, res) => {
  try {
    res.render('pages/despre/echipa', {
      title: 'Echipa Noastră - Casa Ignat',
      page: 'despre',
    });
  } catch (error) {
    console.error('Error loading team page:', error);
    req.flash('error', 'A apărut o eroare la încărcarea paginii');
    res.redirect('/');
  }
};

exports.testimoniale = async (req, res) => {
  try {
    res.render('pages/despre/testimoniale', {
      title: 'Testimoniale - Casa Ignat',
      page: 'despre',
    });
  } catch (error) {
    console.error('Error loading testimonials page:', error);
    req.flash('error', 'A apărut o eroare la încărcarea paginii');
    res.redirect('/');
  }
};

exports.misiune = async (req, res) => {
  try {
    res.render('pages/despre/misiune', {
      title: 'Misiunea Noastră - Casa Ignat',
      page: 'despre',
    });
  } catch (error) {
    console.error('Error loading mission page:', error);
    req.flash('error', 'A apărut o eroare la încărcarea paginii');
    res.redirect('/');
  }
};

// Services pages
exports.consultatii = async (req, res) => {
  try {
    res.render('pages/servicii/consultatii', {
      title: 'Consultații Nutriționale - Casa Ignat',
      page: 'servicii',
    });
  } catch (error) {
    console.error('Error loading consultations page:', error);
    req.flash('error', 'A apărut o eroare la încărcarea paginii');
    res.redirect('/');
  }
};

exports.programe = async (req, res) => {
  try {
    res.render('pages/servicii/programe', {
      title: 'Programe Personalizate - Casa Ignat',
      page: 'servicii',
    });
  } catch (error) {
    console.error('Error loading programs page:', error);
    req.flash('error', 'A apărut o eroare la încărcarea paginii');
    res.redirect('/');
  }
};

exports.analize = async (req, res) => {
  try {
    res.render('pages/servicii/analize', {
      title: 'Analize Specializate - Casa Ignat',
      page: 'servicii',
    });
  } catch (error) {
    console.error('Error loading analysis page:', error);
    req.flash('error', 'A apărut o eroare la încărcarea paginii');
    res.redirect('/');
  }
};

// Special programs pages
exports.program1010 = async (req, res) => {
  try {
    res.render('pages/programe/10-10', {
      title: 'Program 10-10 - Casa Ignat',
      page: 'programe',
    });
  } catch (error) {
    console.error('Error loading 10-10 program page:', error);
    req.flash('error', 'A apărut o eroare la încărcarea paginii');
    res.redirect('/');
  }
};

exports.nutriJunior = async (req, res) => {
  try {
    res.render('pages/programe/nutri-junior', {
      title: 'Nutri-Junior - Casa Ignat',
      page: 'programe',
    });
  } catch (error) {
    console.error('Error loading nutri-junior page:', error);
    req.flash('error', 'A apărut o eroare la încărcarea paginii');
    res.redirect('/');
  }
};

exports.corporate = async (req, res) => {
  try {
    res.render('pages/programe/corporate', {
      title: 'Programe Corporate - Casa Ignat',
      page: 'programe',
    });
  } catch (error) {
    console.error('Error loading corporate page:', error);
    req.flash('error', 'A apărut o eroare la încărcarea paginii');
    res.redirect('/');
  }
};

// Booking/appointment page
exports.programare = async (req, res) => {
  try {
    res.render('pages/programare', {
      title: 'Programare Consultație - Casa Ignat',
      page: 'programare',
    });
  } catch (error) {
    console.error('Error loading booking page:', error);
    req.flash('error', 'A apărut o eroare la încărcarea paginii');
    res.redirect('/');
  }
};
