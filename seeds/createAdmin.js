/**
 * Script pentru crearea utilizatorului admin
 *
 * Rulare: node seeds/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Conectat la MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@casaignat.ro' });
    if (existingAdmin) {
      console.log('⚠ Utilizatorul admin există deja');
      console.log('Email:', existingAdmin.email);
      console.log('Nume:', existingAdmin.name);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Administrator',
      email: 'admin@casaignat.ro',
      password: 'Admin123!@#', // Change this in production!
      role: 'admin',
      isActive: true,
      permissions: {
        blog: true,
        pages: true,
        services: true,
        team: true,
        testimonials: true,
        bookings: true,
        media: true,
        settings: true,
        users: true,
      },
    });

    console.log('\n✓ Utilizator admin creat cu succes!');
    console.log('═══════════════════════════════════════');
    console.log('Email:   ', admin.email);
    console.log('Parolă:  ', 'Admin123!@#');
    console.log('Rol:     ', admin.role);
    console.log('═══════════════════════════════════════');
    console.log('\n⚠  IMPORTANT: Schimbați parola după prima autentificare!');
    console.log('⚠  Accesați: http://localhost:3000/admin/login\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Eroare:', error.message);
    process.exit(1);
  }
}

createAdmin();
