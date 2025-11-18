const Contact = require('../models/Contact');
const { sendEmail } = require('../../config/email');
const { validationResult } = require('express-validator');

exports.index = async (req, res) => {
  try {
    res.render('pages/contact', {
      title: 'Contact - Casa Ignat',
    });
  } catch (error) {
    console.error('Error loading contact page:', error);
    res.status(500).render('pages/error', {
      title: 'Eroare',
      message: 'A apărut o eroare la încărcarea paginii de contact.',
    });
  }
};

exports.submit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, phone, subject, message } = req.body;

    // Save message to database
    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message,
      read: false,
    });

    await contact.save();

    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: 'Mesajul dumneavoastră a fost primit - Casa Ignat',
      html: `
        <h2>Mulțumim pentru mesaj!</h2>
        <p>Dragă ${name},</p>
        <p>Am primit mesajul dumneavoastră și vă vom răspunde în cel mai scurt timp posibil.</p>
        <p><strong>Mesajul dumneavoastră:</strong></p>
        <p>${message}</p>
        <p>Cu stimă,<br>Echipa Casa Ignat</p>
      `,
    });

    // Send notification to admin
    await sendEmail({
      to: process.env.CONTACT_EMAIL,
      subject: `Mesaj nou de contact: ${subject}`,
      html: `
        <h2>Mesaj nou de contact</h2>
        <p><strong>De la:</strong> ${name} (${email})</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        <p><strong>Subiect:</strong> ${subject}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${message}</p>
      `,
    });

    res.json({
      success: true,
      message: 'Mesajul a fost trimis cu succes!',
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'A apărut o eroare la trimiterea mesajului.',
    });
  }
};
