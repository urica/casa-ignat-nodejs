require('dotenv').config();
const app = require('./app');
const connectDB = require('../config/database');
const config = require('../config/app');
const { initializeScheduler } = require('./services/appointmentScheduler');

const PORT = config.app.port;

// Connect to database
connectDB();

// Initialize appointment scheduler
initializeScheduler();

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              🏡 Casa Ignat Website Server                ║
║                                                           ║
║  Environment: ${config.app.env.padEnd(45)}║
║  Port:        ${PORT.toString().padEnd(45)}║
║  URL:         ${config.app.url.padEnd(45)}║
║                                                           ║
║  Server is running and ready to accept connections!      ║
║  Appointment scheduler: Active                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;
