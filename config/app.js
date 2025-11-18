module.exports = {
  app: {
    name: 'Casa Ignat',
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    url: process.env.APP_URL || 'http://localhost:3000',
  },
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp'],
    path: process.env.UPLOAD_PATH || 'public/uploads',
  },
  image: {
    quality: parseInt(process.env.IMAGE_QUALITY) || 80,
    thumbnail: {
      width: parseInt(process.env.THUMBNAIL_WIDTH) || 300,
      height: parseInt(process.env.THUMBNAIL_HEIGHT) || 200,
    },
    medium: {
      width: parseInt(process.env.MEDIUM_WIDTH) || 800,
      height: parseInt(process.env.MEDIUM_HEIGHT) || 600,
    },
    large: {
      width: parseInt(process.env.LARGE_WIDTH) || 1920,
      height: parseInt(process.env.LARGE_HEIGHT) || 1080,
    },
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  booking: {
    email: process.env.BOOKING_EMAIL,
    minDays: parseInt(process.env.MIN_BOOKING_DAYS) || 1,
    maxDays: parseInt(process.env.MAX_BOOKING_DAYS) || 30,
  },
  social: {
    facebook: process.env.FACEBOOK_URL,
    instagram: process.env.INSTAGRAM_URL,
  },
  analytics: {
    gaTrackingId: process.env.GA_TRACKING_ID,
  },
};
