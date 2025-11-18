const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');
const flash = require('connect-flash');

const config = require('../config/app');
const { ensureUploadDirs } = require('../config/upload');
const csrfMiddleware = require('./middleware/csrf');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: config.app.url,
  credentials: true,
}));

// Compression
app.use(compression());

// Logging
if (config.app.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600, // lazy session update
  }),
  cookie: {
    maxAge: config.session.maxAge,
    httpOnly: true,
    secure: config.app.env === 'production',
    sameSite: 'lax',
  },
}));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Flash messages
app.use(flash());

// CSRF protection for admin routes
app.use('/admin', csrfMiddleware.addToken);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Prea multe cereri de la această adresă IP, vă rugăm încercați din nou mai târziu.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Static files
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: config.app.env === 'production' ? '1y' : 0,
  etag: true,
}));

// Make config and helpers available in views
app.use((req, res, next) => {
  res.locals.config = config;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  res.locals.info = req.flash('info');
  res.locals.helpers = require('./utils/helpers');
  next();
});

// Ensure upload directories exist
ensureUploadDirs();

// Routes
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('pages/404', {
    title: 'Pagina nu a fost găsită',
    url: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = config.app.env === 'development'
    ? err.message
    : 'A apărut o eroare. Vă rugăm încercați din nou.';

  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    res.status(statusCode).json({
      success: false,
      message,
      error: config.app.env === 'development' ? err : {},
    });
  } else {
    res.status(statusCode).render('pages/error', {
      title: 'Eroare',
      message,
      error: config.app.env === 'development' ? err : {},
    });
  }
});

module.exports = app;
