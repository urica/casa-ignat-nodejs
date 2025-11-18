# Casa Ignat CMS - Documentație

## Prezentare Generală

CMS-ul Casa Ignat este o platformă completă de management al conținutului, special concepută pentru clinica de nutriție Casa Ignat. Include toate funcționalitățile moderne necesare pentru gestionarea unui site web de succes.

## Funcționalități Principale

### 🔐 Autentificare și Securitate

- **Autentificare robustă** cu session-based authentication
- **2FA (Two-Factor Authentication)** cu QR code și coduri de backup
- **Roluri și permisiuni** granulare (admin, editor, moderator)
- **Blocarea contului** după 5 încercări eșuate de login
- **CSRF Protection** pentru toate form-urile
- **Audit Log** complet pentru toate acțiunile administrative
- **Rate Limiting** pentru prevenirea abuzurilor

### 📊 Dashboard

- Statistici în timp real (articole, programări, testimoniale)
- Activitate recentă
- Programări noi
- Acțiuni rapide
- Vizualizare centralizată a tuturor datelor importante

### 📝 Gestiune Conținut

#### 1. **Blog Posts**
- Editor complet pentru articole
- Categorii: nutriție, rețete, sănătate, lifestyle, sfaturi
- Tag-uri pentru organizare
- Imagini featured cu resize automat
- Status: draft, published, scheduled, archived
- SEO fields (meta title, description, keywords, og:image)
- Programare publicare
- Articole featured
- Sistem de views/likes
- Filtrare și căutare avansată

#### 2. **Pagini Statice**
- Template selector (default, full-width, landing, contact)
- Sections reordonabile (hero, text, image, gallery, CTA, etc.)
- Homepage designation
- Menu display options
- Ierarhie pagini (parent/child)
- SEO complet

#### 3. **Servicii**
- CRUD complet pentru servicii nutriție
- Categorii: consultație, plan nutritional, coaching, workshop, pachet
- Prețuri (fixed, from, range, custom)
- Durată serviciu
- Features list
- Galerie imagini
- Bookable/Available flags
- Ordine de afișare

#### 4. **Echipa**
- Profile complete pentru membri echipă
- Foto, nume, poziție, bio
- Specializări și credențiale
- Social links (Facebook, Instagram, LinkedIn, Twitter, Website)
- Disponibilitate pentru programări
- Ordine de afișare

#### 5. **Testimoniale**
- Sistem de aprobare
- Rating 1-5 stele
- Featured testimonials
- Filtrare approved/pending

#### 6. **Programări**
- Calendar vizual (în dezvoltare)
- Status: pending, confirmed, cancelled, completed
- Calculare automată preț total
- Notificări email (în dezvoltare)
- Export CSV (în dezvoltare)
- Gestiune program lucru

### 🖼️ Media Manager

- Upload multiple files
- Organizare în foldere
- Crop și resize cu Sharp
- Alt text pentru SEO
- Tags și descrieri
- Thumbnails automate (small, medium, large)
- Usage tracking
- Suport pentru imagini, video, audio, PDF

### ⚙️ Setări

- **General**: Site name, tagline, logo, favicon, contact info, address
- **Social Media**: Links pentru toate platformele
- **SEO**: Default meta tags, Google Analytics, GTM, Facebook Pixel, verification codes
- **Email**: SMTP settings, notification preferences
- **Booking**: Working hours, advance booking rules, slot duration
- **Maintenance Mode**: Cu IP whitelist
- **Backup**: Auto-backup settings
- **Custom Code**: Header/footer scripts, custom CSS

### 👥 Utilizatori

- Gestiune utilizatori admin
- Roluri: admin, editor, moderator
- Permisiuni granulare pe module
- Avatar upload
- Last login tracking
- Active/inactive status

### 📋 Audit Log

- Toate acțiunile înregistrate automat
- Filtrare după user, action, resource, date
- IP și User Agent tracking
- Auto-delete după 90 zile
- Doar pentru administratori

## Instalare și Configurare

### 1. Instalare Dependențe

```bash
npm install
```

### 2. Configurare Mediu

Creați fișierul `.env`:

```env
# Server
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/casa-ignat

# Session
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Casa Ignat <noreply@casaignat.ro>
```

### 3. Creare Utilizator Admin

```bash
node seeds/createAdmin.js
```

**Credențiale implicite:**
- Email: `admin@casaignat.ro`
- Parolă: `Admin123!@#`

⚠️ **IMPORTANT**: Schimbați parola după prima autentificare!

### 4. Pornire Aplicație

```bash
# Development
npm run dev

# Production
npm start
```

### 5. Acces CMS

Accesați: `http://localhost:3000/admin/login`

## Arhitectura Aplicației

```
casa-ignat-nodejs/
├── config/                    # Configurări
│   ├── app.js                # Config general
│   ├── database.js           # Config MongoDB
│   ├── upload.js             # Config upload-uri
│   └── email.js              # Config email
├── src/
│   ├── controllers/          # Logică business
│   │   ├── authController.js # Autentificare & 2FA
│   │   ├── cmsController.js  # Dashboard & Profile
│   │   ├── blogController.js # Blog CRUD
│   │   └── adminController.js# Alte module
│   ├── middleware/           # Middleware-uri
│   │   ├── auth.js          # Autentificare & permisiuni
│   │   ├── csrf.js          # CSRF protection
│   │   ├── auditLog.js      # Logging
│   │   └── validation.js    # Validare
│   ├── models/              # Modele Mongoose
│   │   ├── User.js          # Utilizatori
│   │   ├── BlogPost.js      # Articole blog
│   │   ├── Page.js          # Pagini
│   │   ├── Service.js       # Servicii
│   │   ├── TeamMember.js    # Echipă
│   │   ├── Testimonial.js   # Testimoniale
│   │   ├── Booking.js       # Programări
│   │   ├── Media.js         # Media files
│   │   ├── Settings.js      # Setări
│   │   └── AuditLog.js      # Log acțiuni
│   ├── routes/              # Rute
│   │   ├── index.js         # Rute publice
│   │   ├── api.js           # API
│   │   └── admin.js         # Rute admin
│   ├── utils/               # Utilități
│   │   └── helpers.js       # Helper functions
│   ├── app.js               # Configurare Express
│   └── server.js            # Entry point
├── views/
│   ├── admin/               # Views admin
│   │   ├── layouts/         # Layout-uri
│   │   ├── partials/        # Componente reutilizabile
│   │   ├── auth/            # Autentificare
│   │   ├── dashboard/       # Dashboard
│   │   ├── blog/            # Blog management
│   │   └── ...              # Alte module
│   └── pages/               # Views publice
├── public/
│   ├── admin/               # Assets admin
│   │   ├── css/            # Stiluri
│   │   ├── js/             # JavaScript
│   │   └── img/            # Imagini
│   └── uploads/             # Upload-uri utilizatori
└── seeds/                   # Seed scripts
    └── createAdmin.js       # Creare admin
```

## Securitate

### Măsuri Implementate

1. **Autentificare**
   - Bcrypt pentru hash-uire parole (cost factor: 12)
   - Session-based authentication cu MongoDB store
   - Cookie security flags (httpOnly, secure, sameSite)

2. **2FA**
   - TOTP cu speakeasy
   - QR code generation
   - 10 coduri de backup

3. **CSRF Protection**
   - Token-uri generate per sesiune
   - Verificare automată pentru toate POST/PUT/DELETE

4. **Input Validation & Sanitization**
   - express-validator pentru validare
   - express-mongo-sanitize pentru NoSQL injection
   - xss-clean pentru XSS attacks

5. **Rate Limiting**
   - 100 requests per 15 minute window per IP
   - Configurabil per rută

6. **Headers Security**
   - Helmet.js pentru security headers
   - CSP (Content Security Policy)
   - HSTS, X-Frame-Options, etc.

7. **Audit Logging**
   - Toate acțiunile înregistrate
   - IP și User Agent tracking
   - Retention: 90 zile

## API Permissions

### Roluri

- **admin**: Access complet la toate modulele
- **editor**: Poate edita conținut (blog, pages, services, team)
- **moderator**: Poate modera (testimonials, bookings)

### Permisiuni Granulare

Fiecare utilizator are permisiuni specifice:
- `blog`: Articole blog
- `pages`: Pagini statice
- `services`: Servicii
- `team`: Echipă
- `testimonials`: Testimoniale
- `bookings`: Programări
- `media`: Media manager
- `settings`: Setări site (doar admin)
- `users`: Gestiune utilizatori (doar admin)

## Dezvoltare Viitoare

### Funcționalități Planificate

1. **Editor WYSIWYG** - Integrare TinyMCE sau Quill pentru editare rich text
2. **Media Manager UI** - Interfață completă pentru upload, organizare, crop
3. **Calendar Programări** - Calendar interactiv pentru programări
4. **Email Templates** - Editor pentru template-uri email
5. **Export CSV** - Export date pentru bookings, testimonials
6. **Backup/Restore** - Sistem automat de backup
7. **Multi-language** - Suport pentru multiple limbi
8. **API REST** - API complet pentru integrări externe
9. **Notificări Push** - Notificări browser pentru eventi importante
10. **Analytics Dashboard** - Google Analytics integration în dashboard

### Module de Completat

Următoarele module au structura de bază dar necesită implementare completă:
- Pages (similar cu Blog)
- Services (CRUD complet)
- Team Members (CRUD complet)
- Media Manager (UI complet)
- Settings (toate setările)
- Users Management
- Audit Log viewing

## Suport și Contribuții

Pentru probleme sau sugestii, creați un issue în repository.

## Licență

MIT License - Vezi fișierul LICENSE pentru detalii.

---

**Dezvoltat pentru Casa Ignat - Nutriție și Sănătate** 🌿
