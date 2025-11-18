# CLAUDE.md - AI Assistant Guide for Casa Ignat Project

**Last Updated:** 2025-11-18
**Project:** Casa Ignat - Guesthouse & Restaurant Website
**Tech Stack:** Node.js 18+, Express, MongoDB, EJS, Docker

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Architecture](#codebase-architecture)
3. [Directory Structure](#directory-structure)
4. [Development Workflows](#development-workflows)
5. [Code Conventions](#code-conventions)
6. [Database Models](#database-models)
7. [Security Patterns](#security-patterns)
8. [Testing Guidelines](#testing-guidelines)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

Casa Ignat is a comprehensive web application for a Romanian guesthouse and restaurant. The application provides:

- **Content Management**: Blog system with multiple templates (article, recipe, case-study, guide)
- **Booking System**: Room reservations and appointment scheduling
- **E-commerce Features**: Restaurant menu display
- **Admin Panel**: Complete administration interface with RBAC
- **SEO & Analytics**: Comprehensive SEO optimization and multi-platform analytics
- **Security & GDPR**: Enterprise-grade security with full GDPR compliance
- **Media Management**: Gallery system with automatic image optimization

### Key Technologies

- **Backend**: Node.js 18+, Express 4.x
- **Database**: MongoDB 7.0+ with Mongoose ODM
- **View Engine**: EJS (Embedded JavaScript Templates)
- **Session Store**: MongoDB (connect-mongo)
- **Image Processing**: Sharp (WebP conversion, multiple sizes)
- **Security**: Helmet, CSRF, Rate Limiting, XSS Protection, NoSQL Injection Protection
- **File Security**: ClamAV virus scanning
- **Email**: Nodemailer (SMTP)
- **Testing**: Jest, Supertest
- **Process Management**: PM2 (cluster mode)
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

---

## Codebase Architecture

### Architecture Pattern: MVC + Service Layer

```
Request → Route → Middleware Chain → Controller → Service → Model → Database
                                          ↓
                                       Response
```

### Layer Responsibilities

1. **Routes** (`src/routes/`): URL mapping and route grouping
2. **Middleware** (`src/middleware/`): Authentication, authorization, validation, security
3. **Controllers** (`src/controllers/`): Request handling, response formatting, error handling
4. **Services** (`src/services/`): Reusable business logic, external integrations
5. **Models** (`src/models/`): Data schemas, validation, database operations
6. **Utils** (`src/utils/`): Helper functions, utilities

### Route Organization

- `/src/routes/index.js` - Public routes (home, rooms, restaurant, blog, contact)
- `/src/routes/admin.js` - Admin panel routes (protected by auth middleware)
- `/src/routes/api.js` - RESTful API endpoints
- `/src/routes/privacy.js` - GDPR/privacy routes
- `/src/routes/analytics.js` - Analytics endpoints

### Key Files

- **`src/server.js`**: Server entry point, database connection, graceful shutdown
- **`src/app.js`**: Express configuration, middleware setup, route registration
- **`config/app.js`**: Centralized configuration export
- **`config/database.js`**: MongoDB connection setup
- **`.env`**: Environment variables (never commit this file!)

---

## Directory Structure

```
casa-ignat-nodejs/
├── src/                          # Application source code
│   ├── controllers/              # Business logic (15 controllers)
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── blogController.js
│   │   ├── appointmentController.js
│   │   └── ...
│   ├── models/                   # Mongoose schemas (21 models)
│   │   ├── User.js               # Authentication, roles, 2FA
│   │   ├── BlogPost.js           # Multi-template blog system
│   │   ├── Appointment.js
│   │   ├── AuditLog.js           # Security logging
│   │   └── ...
│   ├── routes/                   # Express routes (5 route files)
│   ├── middleware/               # Custom middleware (10 files)
│   │   ├── auth.js               # Authentication checks
│   │   ├── csrf.js               # CSRF protection
│   │   ├── rateLimiter.js        # Rate limiting
│   │   ├── secureUpload.js       # File upload security
│   │   ├── gdpr.js               # GDPR compliance
│   │   └── ...
│   ├── services/                 # Business services (7 services)
│   │   ├── emailService.js
│   │   ├── appointmentScheduler.js
│   │   ├── analyticsService.js
│   │   ├── imageService.js
│   │   └── ...
│   ├── utils/                    # Utility functions (5 modules)
│   │   ├── helpers.js
│   │   ├── seoHelpers.js
│   │   ├── jwtUtils.js
│   │   └── ...
│   ├── app.js                    # Express app configuration
│   └── server.js                 # Server entry point
├── views/                        # EJS templates
│   ├── admin/                    # Admin panel views
│   ├── blog/                     # Blog templates
│   ├── layouts/                  # Main layouts
│   ├── pages/                    # Public pages
│   ├── partials/                 # Reusable components
│   └── ...
├── public/                       # Static assets
│   ├── css/                      # Stylesheets
│   ├── js/                       # Client-side JavaScript
│   ├── admin/                    # Admin panel assets
│   └── uploads/                  # User-uploaded content
├── config/                       # Configuration files
│   ├── app.js                    # App-wide config
│   ├── database.js               # MongoDB connection
│   ├── email.js                  # Email/SMTP config
│   └── upload.js                 # File upload config
├── migrations/                   # Database migrations
├── seeds/                        # Database seed scripts
├── scripts/                      # Utility scripts
│   ├── backup-db.sh
│   ├── restore-db.sh
│   ├── securityAudit.js
│   └── setup-server.sh
├── tests/                        # Test files
├── docs/                         # Documentation
├── nginx/                        # Nginx configuration
├── .github/workflows/            # CI/CD pipelines
├── docker-compose.yml            # Docker orchestration
├── Dockerfile                    # Container definition
├── ecosystem.config.js           # PM2 configuration
├── .env.example                  # Environment template
└── package.json                  # Dependencies and scripts
```

---

## Development Workflows

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd casa-ignat-nodejs

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Start MongoDB (Docker recommended)
npm run docker:dev

# 5. Start development server
npm run dev
```

### Development with Docker

```bash
# Start all services (MongoDB + App + Mongo Express)
npm run docker:dev

# Access points:
# - App: http://localhost:3000
# - Mongo Express: http://localhost:8081

# Stop services
npm run docker:down

# View logs
docker-compose logs -f app-dev
```

### Available npm Scripts

```bash
npm start              # Production server
npm run dev            # Development with hot-reload (nodemon)
npm test               # Run tests with coverage
npm run test:watch     # Watch mode for tests
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix linting issues
npm run docker:dev     # Start Docker development
npm run docker:down    # Stop Docker containers
npm run docker:build   # Build Docker image
npm run migrate        # Run database migrations
npm run seed           # Seed database
npm run security:audit # Run security audit
```

### Git Workflow

This project follows a standard Git workflow:

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commit regularly
git add .
git commit -m "Descriptive commit message"

# Push to remote
git push -u origin feature/your-feature-name

# Create pull request on GitHub
```

### Commit Message Conventions

Follow these conventions for commit messages:

- **feat**: New feature (e.g., "feat: add user profile page")
- **fix**: Bug fix (e.g., "fix: resolve booking date validation")
- **refactor**: Code refactoring (e.g., "refactor: simplify auth middleware")
- **docs**: Documentation (e.g., "docs: update API documentation")
- **test**: Tests (e.g., "test: add unit tests for email service")
- **chore**: Maintenance (e.g., "chore: update dependencies")
- **style**: Code style (e.g., "style: fix ESLint warnings")
- **perf**: Performance improvements

---

## Code Conventions

### Naming Conventions

- **Files**: camelCase (e.g., `blogController.js`, `emailService.js`)
- **Directories**: lowercase or camelCase (e.g., `controllers`, `middleware`)
- **Routes**: kebab-case URLs (e.g., `/blog/categorie/:slug`)
- **Models**: PascalCase (e.g., `BlogPost`, `User`, `Appointment`)
- **Functions/Methods**: camelCase (e.g., `sendEmail`, `requireAuth`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`, `SESSION_SECRET`)
- **Variables**: camelCase (e.g., `userData`, `appointmentList`)

### Code Style

This project uses ESLint with Airbnb base configuration. Key rules:

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: Max 100 characters
- **Trailing commas**: Required in multiline objects/arrays
- **Arrow functions**: Prefer arrow functions for callbacks

### Controller Pattern

```javascript
// src/controllers/exampleController.js

/**
 * Example Controller
 * Handles example-related requests
 */

// List all examples
exports.index = async (req, res) => {
  try {
    const examples = await Example.find().sort({ createdAt: -1 });
    res.render('examples/index', {
      title: 'Examples',
      examples,
    });
  } catch (error) {
    console.error('Error fetching examples:', error);
    req.flash('error', 'A apărut o eroare la încărcarea exemplelor');
    res.redirect('/');
  }
};

// Show single example
exports.show = async (req, res) => {
  try {
    const example = await Example.findById(req.params.id);
    if (!example) {
      req.flash('error', 'Exemplul nu a fost găsit');
      return res.redirect('/examples');
    }
    res.render('examples/show', {
      title: example.title,
      example,
    });
  } catch (error) {
    console.error('Error fetching example:', error);
    req.flash('error', 'A apărut o eroare');
    res.redirect('/examples');
  }
};

// Create example (POST)
exports.create = async (req, res) => {
  try {
    const example = new Example(req.body);
    await example.save();
    req.flash('success', 'Exemplul a fost creat cu succes');
    res.redirect(`/examples/${example._id}`);
  } catch (error) {
    console.error('Error creating example:', error);
    req.flash('error', 'A apărut o eroare la crearea exemplului');
    res.redirect('/examples/new');
  }
};

// Update example (PUT)
exports.update = async (req, res) => {
  try {
    const example = await Example.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!example) {
      req.flash('error', 'Exemplul nu a fost găsit');
      return res.redirect('/examples');
    }
    req.flash('success', 'Exemplul a fost actualizat cu succes');
    res.redirect(`/examples/${example._id}`);
  } catch (error) {
    console.error('Error updating example:', error);
    req.flash('error', 'A apărut o eroare la actualizarea exemplului');
    res.redirect(`/examples/${req.params.id}/edit`);
  }
};

// Delete example (DELETE)
exports.delete = async (req, res) => {
  try {
    const example = await Example.findByIdAndDelete(req.params.id);
    if (!example) {
      req.flash('error', 'Exemplul nu a fost găsit');
      return res.redirect('/examples');
    }
    req.flash('success', 'Exemplul a fost șters cu succes');
    res.redirect('/examples');
  } catch (error) {
    console.error('Error deleting example:', error);
    req.flash('error', 'A apărut o eroare la ștergerea exemplului');
    res.redirect('/examples');
  }
};
```

### Model Pattern

```javascript
// src/models/Example.js
const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Titlul este obligatoriu'],
    trim: true,
    maxlength: [100, 'Titlul nu poate depăși 100 de caractere'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Descrierea este obligatorie'],
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tags: [String],
  metadata: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes
exampleSchema.index({ title: 'text', description: 'text' });
exampleSchema.index({ status: 1, createdAt: -1 });

// Virtual fields
exampleSchema.virtual('url').get(function() {
  return `/examples/${this.slug}`;
});

// Pre-save hook: Generate slug from title
exampleSchema.pre('save', async function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Ensure unique slug
    const existing = await this.constructor.findOne({
      slug: this.slug,
      _id: { $ne: this._id }
    });
    if (existing) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

// Instance methods
exampleSchema.methods.incrementViews = async function() {
  this.metadata.views += 1;
  return this.save();
};

// Static methods
exampleSchema.statics.findPublished = function() {
  return this.find({ status: 'published' })
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Example', exampleSchema);
```

### Service Pattern

```javascript
// src/services/exampleService.js

/**
 * Example Service
 * Handles business logic for examples
 */

const Example = require('../models/Example');
const emailService = require('./emailService');

/**
 * Process example with complex business logic
 */
exports.processExample = async (exampleId) => {
  try {
    const example = await Example.findById(exampleId);
    if (!example) {
      throw new Error('Example not found');
    }

    // Complex business logic here
    example.metadata.views += 1;
    await example.save();

    // Send notification
    await emailService.sendEmail({
      to: example.author.email,
      subject: 'Example processed',
      text: `Your example "${example.title}" has been processed.`,
    });

    return example;
  } catch (error) {
    console.error('Error processing example:', error);
    throw error;
  }
};
```

### Error Handling

Always use try-catch in async controllers and provide user-friendly error messages:

```javascript
try {
  // Your code here
} catch (error) {
  console.error('Descriptive error context:', error);

  // For web requests
  req.flash('error', 'User-friendly error message in Romanian');
  res.redirect('/appropriate-route');

  // For API requests
  res.status(500).json({
    success: false,
    message: 'User-friendly error message',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}
```

### Configuration Access

Always access configuration through the centralized config file:

```javascript
// Good
const config = require('../config/app');
const port = config.app.port;

// Bad
const port = process.env.PORT;
```

### Response Patterns

**Flash Messages (for web routes):**
```javascript
req.flash('success', 'Operațiune realizată cu succes');
req.flash('error', 'A apărut o eroare');
req.flash('warning', 'Avertisment');
req.flash('info', 'Informație');
res.redirect('/target-route');
```

**API Responses:**
```javascript
// Success
res.json({
  success: true,
  message: 'Operation completed',
  data: { ... },
});

// Error
res.status(400).json({
  success: false,
  message: 'Error message',
  errors: [ ... ],
});
```

---

## Database Models

### Model Overview

The project includes 21 Mongoose models organized by functionality:

#### Core Models

- **User** (`src/models/User.js`): Authentication, roles (admin, editor, viewer), permissions, 2FA
- **Settings** (`src/models/Settings.js`): Site-wide configuration
- **Page** (`src/models/Page.js`): Dynamic CMS pages

#### Business Models

- **Appointment** (`src/models/Appointment.js`): Booking system with scheduler integration
- **Booking** (`src/models/Booking.js`): Room/service reservations
- **Room** (`src/models/Room.js`): Accommodation listings
- **MenuItem** (`src/models/MenuItem.js`): Restaurant menu items
- **Service** (`src/models/Service.js`): Available services

#### Content Models

- **BlogPost** (`src/models/BlogPost.js`): Multi-template blog system with rich metadata
- **BlogCategory** (`src/models/BlogCategory.js`): Blog categorization
- **BlogComment** (`src/models/BlogComment.js`): Comment system with moderation
- **GalleryImage** (`src/models/GalleryImage.js`): Photo gallery
- **Media** (`src/models/Media.js`): General media management
- **Testimonial** (`src/models/Testimonial.js`): Customer reviews
- **TeamMember** (`src/models/TeamMember.js`): Staff profiles

#### Communication Models

- **Contact** (`src/models/Contact.js`): Contact form submissions

#### Security & Compliance Models

- **AuditLog** (`src/models/AuditLog.js`): Action logging for compliance
- **BreachLog** (`src/models/BreachLog.js`): Security breach tracking
- **ConsentTracking** (`src/models/ConsentTracking.js`): GDPR consent management
- **DataRequest** (`src/models/DataRequest.js`): GDPR data export/deletion requests

#### Analytics Models

- **AnalyticsEvent** (`src/models/AnalyticsEvent.js`): Custom event tracking

### Common Model Features

All models include:

- **Timestamps**: `createdAt`, `updatedAt` (automatic)
- **Validation**: Built-in and custom validators
- **Indexes**: For performance optimization
- **Virtual Fields**: Computed properties
- **Pre/Post Hooks**: Automation (e.g., slug generation, password hashing)
- **Instance Methods**: Model-specific operations
- **Static Methods**: Query helpers

### Database Connections

MongoDB connection is handled in `config/database.js`:

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## Security Patterns

Security is a top priority in this project. Multiple layers of protection are implemented:

### 1. Authentication

**Session-based authentication** with MongoDB store:

```javascript
// Check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Trebuie să fiți autentificat');
  res.redirect('/admin/login');
};
```

**Two-Factor Authentication (2FA)**:
- TOTP-based (Speakeasy)
- QR code generation
- Backup codes for recovery

### 2. Authorization

**Role-Based Access Control (RBAC)**:
- Roles: `admin`, `editor`, `viewer`
- Permissions: `blog`, `bookings`, `appointments`, `settings`

```javascript
// Check user role
const requireRole = (role) => {
  return (req, res, next) => {
    if (req.session.user && req.session.user.role === role) {
      return next();
    }
    req.flash('error', 'Nu aveți permisiunile necesare');
    res.redirect('/admin');
  };
};

// Check specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.session.user && req.session.user.permissions.includes(permission)) {
      return next();
    }
    req.flash('error', 'Nu aveți permisiunile necesare');
    res.redirect('/admin');
  };
};
```

### 3. CSRF Protection

CSRF tokens are required for all state-changing admin operations:

```javascript
// Middleware: src/middleware/csrf.js
// Usage in routes:
router.post('/admin/blog/create', csrfMiddleware.verifyToken, blogController.create);
```

In EJS templates:
```html
<form method="POST">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- form fields -->
</form>
```

### 4. Rate Limiting

Protects against brute-force attacks:

```javascript
// API routes are rate-limited
app.use('/api/', limiter);
```

Configuration in `.env`:
```
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Max 100 requests per window
```

### 5. File Upload Security

Multiple layers of validation:

- **Virus Scanning**: ClamAV integration
- **File Type Validation**: MIME type checking
- **Size Limits**: Configurable max file size
- **Filename Sanitization**: Remove dangerous characters
- **Directory Traversal Prevention**: Path validation

```javascript
// Middleware: src/middleware/secureUpload.js
```

### 6. XSS Protection

- `xss-clean` middleware
- Helmet CSP headers
- Input sanitization

### 7. NoSQL Injection Protection

- `express-mongo-sanitize` middleware
- Mongoose schema validation
- Input validation with `express-validator`

### 8. Password Security

- bcrypt hashing (10 rounds by default)
- Password strength requirements
- Secure password reset flow

### 9. Session Security

```javascript
cookie: {
  maxAge: 24 * 60 * 60 * 1000,  // 24 hours
  httpOnly: true,                // Prevent XSS
  secure: true,                  // HTTPS only in production
  sameSite: 'lax',              // CSRF protection
}
```

### 10. GDPR Compliance

Full GDPR implementation:

- **Consent tracking**: Cookie consent, data processing consent
- **Right to access**: Data export functionality
- **Right to be forgotten**: Account deletion with grace period
- **Breach logging**: Security incident tracking
- **Privacy policy versioning**: Consent version tracking

See `docs/SECURITY.md` for detailed security documentation.

---

## Testing Guidelines

### Testing Framework

- **Test Runner**: Jest
- **HTTP Testing**: Supertest
- **Coverage**: Jest built-in coverage

### Test Structure (to be implemented)

```
tests/
├── unit/
│   ├── models/
│   ├── services/
│   └── utils/
├── integration/
│   ├── controllers/
│   └── routes/
└── e2e/
    └── workflows/
```

### Running Tests

```bash
npm test              # Run all tests with coverage
npm run test:watch    # Watch mode for development
```

### Writing Tests

**Model Test Example:**
```javascript
// tests/unit/models/Example.test.js
const Example = require('../../../src/models/Example');

describe('Example Model', () => {
  test('should create a valid example', async () => {
    const example = new Example({
      title: 'Test Example',
      description: 'Test description',
      author: '507f1f77bcf86cd799439011',
    });

    const savedExample = await example.save();
    expect(savedExample._id).toBeDefined();
    expect(savedExample.title).toBe('Test Example');
  });

  test('should generate slug from title', async () => {
    const example = new Example({
      title: 'Test Example Title',
      description: 'Test description',
      author: '507f1f77bcf86cd799439011',
    });

    await example.save();
    expect(example.slug).toBe('test-example-title');
  });
});
```

**Controller Test Example:**
```javascript
// tests/integration/controllers/example.test.js
const request = require('supertest');
const app = require('../../../src/app');
const Example = require('../../../src/models/Example');

describe('Example Controller', () => {
  test('GET /examples should return all examples', async () => {
    const response = await request(app)
      .get('/examples')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

---

## Common Tasks

### Adding a New Feature

1. **Plan the feature**
   - Identify affected models, controllers, routes
   - Consider security implications
   - Plan database schema changes

2. **Create/Update Database Model**
   ```bash
   # Create new model
   touch src/models/NewFeature.js
   ```

3. **Create Controller**
   ```bash
   touch src/controllers/newFeatureController.js
   ```

4. **Add Routes**
   - Update appropriate route file in `src/routes/`

5. **Create Views** (if needed)
   ```bash
   mkdir views/new-feature
   touch views/new-feature/index.ejs
   ```

6. **Add Middleware** (if needed)
   - Authentication, authorization, validation

7. **Create Service** (if complex logic)
   ```bash
   touch src/services/newFeatureService.js
   ```

8. **Test the Feature**
   - Manual testing in development
   - Write automated tests

9. **Document the Feature**
   - Update README.md if user-facing
   - Add comments in code
   - Update API documentation

### Adding a New API Endpoint

1. **Define Route** in `src/routes/api.js`:
```javascript
router.get('/api/examples', exampleController.list);
router.get('/api/examples/:id', exampleController.show);
router.post('/api/examples',
  requireAuth,
  validate.example,
  exampleController.create
);
```

2. **Create Controller Method**:
```javascript
// src/controllers/exampleController.js
exports.list = async (req, res) => {
  try {
    const examples = await Example.find();
    res.json({
      success: true,
      data: examples,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching examples',
    });
  }
};
```

3. **Add Validation** (if needed):
```javascript
// src/middleware/validation.js
exports.example = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];
```

### Adding a New Admin Page

1. **Create Route** in `src/routes/admin.js`:
```javascript
router.get('/admin/examples', requireAuth, requireRole('admin'), exampleController.adminIndex);
```

2. **Create Controller Method**:
```javascript
exports.adminIndex = async (req, res) => {
  try {
    const examples = await Example.find().sort({ createdAt: -1 });
    res.render('admin/examples/index', {
      title: 'Manage Examples',
      examples,
    });
  } catch (error) {
    req.flash('error', 'Error loading examples');
    res.redirect('/admin');
  }
};
```

3. **Create View** in `views/admin/examples/index.ejs`:
```html
<%- include('../layouts/admin-header', { title: title }) %>

<div class="container">
  <h1><%= title %></h1>

  <% if (examples.length === 0) { %>
    <p>No examples found.</p>
  <% } else { %>
    <table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <% examples.forEach(example => { %>
          <tr>
            <td><%= example.title %></td>
            <td><%= example.status %></td>
            <td><%= example.createdAt.toLocaleDateString() %></td>
            <td>
              <a href="/admin/examples/<%= example._id %>/edit">Edit</a>
              <form method="POST" action="/admin/examples/<%= example._id %>/delete" style="display: inline;">
                <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                <button type="submit">Delete</button>
              </form>
            </td>
          </tr>
        <% }) %>
      </tbody>
    </table>
  <% } %>
</div>

<%- include('../layouts/admin-footer') %>
```

### Database Operations

**Seeding the Database:**
```bash
npm run seed
```

**Creating a Seed Script:**
```javascript
// seeds/seedExamples.js
const mongoose = require('mongoose');
require('dotenv').config();
const Example = require('../src/models/Example');

const examples = [
  { title: 'Example 1', description: 'Description 1' },
  { title: 'Example 2', description: 'Description 2' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Example.deleteMany({});
    await Example.insertMany(examples);
    console.log('Examples seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding examples:', error);
    process.exit(1);
  }
}

seed();
```

**Backup Database:**
```bash
./scripts/backup-db.sh
```

**Restore Database:**
```bash
./scripts/restore-db.sh /path/to/backup
```

### Image Processing

Images are automatically processed when uploaded:

```javascript
// src/services/imageService.js
const sharp = require('sharp');

// Images are converted to WebP and resized to:
// - thumbnail: 300x200
// - medium: 800x600
// - large: 1920x1080
```

Configuration in `.env`:
```
IMAGE_QUALITY=80
THUMBNAIL_WIDTH=300
THUMBNAIL_HEIGHT=200
MEDIUM_WIDTH=800
MEDIUM_HEIGHT=600
LARGE_WIDTH=1920
LARGE_HEIGHT=1080
```

### Sending Emails

```javascript
const emailService = require('../services/emailService');

await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Subject',
  text: 'Plain text content',
  html: '<p>HTML content</p>',
});

// Or use templates
const emailTemplates = require('../services/emailTemplates');

await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Booking Confirmation',
  html: emailTemplates.bookingConfirmation(bookingData),
});
```

---

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed

**Problem**: Can't connect to MongoDB

**Solution**:
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Start MongoDB with Docker
npm run docker:dev

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/casa_ignat
```

#### Port Already in Use

**Problem**: Port 3000 is already in use

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port in .env
PORT=3001
```

#### Session Issues

**Problem**: Session not persisting

**Solution**:
- Ensure MongoDB is running (sessions are stored in MongoDB)
- Check `SESSION_SECRET` in `.env`
- Clear cookies in browser
- Check if session store is properly configured in `app.js`

#### File Upload Errors

**Problem**: File upload fails

**Solution**:
- Check `MAX_FILE_SIZE` in `.env`
- Verify `ALLOWED_FILE_TYPES` includes the file type
- Ensure upload directory exists and is writable
- Check if ClamAV is running (if virus scanning is enabled)

#### CSRF Token Mismatch

**Problem**: CSRF token validation fails

**Solution**:
- Ensure the form includes the CSRF token: `<input type="hidden" name="_csrf" value="<%= csrfToken %>">`
- Check if CSRF middleware is properly configured
- Clear cookies and session
- Verify `CSRF_SECRET` in `.env`

#### ESLint Errors

**Problem**: Linting errors prevent code from running

**Solution**:
```bash
# Auto-fix linting issues
npm run lint:fix

# Check remaining issues
npm run lint
```

#### Image Processing Fails

**Problem**: Sharp image processing errors

**Solution**:
- Ensure Sharp is properly installed: `npm rebuild sharp`
- Check if input file is a valid image
- Verify sufficient disk space
- Check file permissions on upload directory

### Environment Variables

If features aren't working as expected, verify all required environment variables are set:

```bash
# Required variables
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/casa_ignat
SESSION_SECRET=<secret>
JWT_SECRET=<secret>
CSRF_SECRET=<secret>
SMTP_HOST=<smtp-host>
SMTP_USER=<email>
SMTP_PASS=<password>
```

See `.env.example` for complete list.

### Debugging Tips

1. **Enable Detailed Logging**:
   ```javascript
   console.log('Debug info:', variable);
   ```

2. **Use Morgan Logger**:
   - Already configured in development mode
   - Shows all HTTP requests

3. **MongoDB Queries**:
   ```javascript
   mongoose.set('debug', true); // Shows all MongoDB queries
   ```

4. **Check Logs**:
   ```bash
   # Docker logs
   docker-compose logs -f app-dev

   # PM2 logs (production)
   pm2 logs casa-ignat
   ```

5. **Use Mongo Express**:
   - Access http://localhost:8081 when using Docker
   - Visual interface for MongoDB

### Getting Help

1. **Check Documentation**:
   - `README.md` - General project information
   - `DEPLOYMENT.md` - Deployment guide
   - `docs/SECURITY.md` - Security documentation
   - `docs/ANALYTICS-SETUP.md` - Analytics setup
   - Other docs in `docs/` directory

2. **Check Code Comments**:
   - Controllers, models, and services have detailed comments

3. **Review Git History**:
   ```bash
   git log --oneline
   git show <commit-hash>
   ```

---

## Best Practices for AI Assistants

When working with this codebase as an AI assistant, follow these guidelines:

### 1. Always Read Before Modifying

- Use the `Read` tool to read existing files before making changes
- Understand the current implementation before suggesting modifications
- Check related files for dependencies

### 2. Maintain Consistency

- Follow existing naming conventions
- Match the code style of surrounding code
- Use the same error handling patterns
- Keep the same level of commenting

### 3. Security First

- Always validate user input
- Use parameterized queries (Mongoose does this automatically)
- Implement proper authentication/authorization
- Never expose sensitive data in responses
- Check OWASP Top 10 vulnerabilities

### 4. Test Your Changes

- Manually test the feature after implementing
- Write automated tests if possible
- Check for edge cases
- Verify error handling works

### 5. Document Your Changes

- Add comments for complex logic
- Update relevant documentation files
- Include JSDoc comments for functions
- Update this CLAUDE.md if adding new patterns

### 6. Romanian Language

- User-facing messages should be in Romanian
- Flash messages in Romanian
- Error messages in Romanian
- Email templates in Romanian
- Keep code comments in English

### 7. Environment Variables

- Never hardcode secrets or configuration
- Use `.env` variables through the config system
- Update `.env.example` when adding new variables
- Document new variables in this file

### 8. Performance Considerations

- Use database indexes for frequently queried fields
- Implement pagination for large datasets
- Optimize images before uploading
- Use caching where appropriate
- Avoid N+1 queries

### 9. Error Handling

- Always wrap async code in try-catch
- Provide user-friendly error messages
- Log errors with context
- Never expose stack traces to users in production

### 10. Git Practices

- Write clear commit messages
- Make atomic commits (one logical change per commit)
- Test before committing
- Never commit `.env` file
- Keep commits focused and small

---

## Quick Reference

### File Locations

| Feature | Controller | Model | Routes | Views |
|---------|-----------|-------|--------|-------|
| Blog | `blogController.js` | `BlogPost.js`, `BlogCategory.js` | `index.js`, `admin.js` | `views/blog/`, `views/admin/blog/` |
| Appointments | `appointmentController.js` | `Appointment.js` | `index.js`, `admin.js` | `views/appointments/`, `views/admin/appointments/` |
| Rooms | `roomsController.js` | `Room.js` | `index.js`, `admin.js` | `views/pages/rooms.ejs` |
| Gallery | `galleryController.js` | `GalleryImage.js` | `index.js`, `admin.js` | `views/pages/gallery.ejs` |
| Authentication | `authController.js` | `User.js` | `admin.js` | `views/admin/auth/` |
| Analytics | `analyticsController.js` | `AnalyticsEvent.js` | `analytics.js` | `views/partials/analytics/` |
| GDPR | `privacyController.js` | `ConsentTracking.js`, `DataRequest.js` | `privacy.js` | `views/privacy/` |

### Useful Commands

```bash
# Development
npm run dev                  # Start dev server with hot-reload
npm run docker:dev           # Start full Docker environment
npm run lint:fix            # Fix linting issues

# Database
npm run seed                # Seed database
./scripts/backup-db.sh      # Backup database
./scripts/restore-db.sh     # Restore database

# Production
npm start                   # Start production server
npm run docker:build        # Build Docker image
npm run security:audit      # Run security audit

# Testing
npm test                    # Run tests with coverage
npm run test:watch          # Run tests in watch mode
```

### Environment Profiles

- **development**: Local development with hot-reload
- **production**: Production deployment with PM2 cluster mode
- **test**: Testing environment (not fully implemented)

### Ports

- **3000**: Application (default)
- **27017**: MongoDB
- **6379**: Redis
- **8081**: Mongo Express (Docker development only)
- **80/443**: Nginx (production)

---

## Changelog

### 2025-11-18
- Initial CLAUDE.md creation
- Documented complete architecture and conventions
- Added development workflows and common tasks
- Included security patterns and best practices

---

**Note**: This document is maintained for AI assistants working on the Casa Ignat project. When making significant architectural changes or adding new patterns, update this document accordingly.
