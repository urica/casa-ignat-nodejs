# Casa Ignat - Website Pensiune și Restaurant

Website pentru Casa Ignat, o pensiune și restaurant tradițional, construit cu Node.js, Express și MongoDB.

## 🚀 Caracteristici

- **Gestiune Camere**: Afișare și management camere disponibile
- **Restaurant & Meniu**: Prezentare meniu și oferte culinare
- **Sistem Rezervări**: Rezervări online cu confirmare prin email
- **Galerie Foto**: Galerie de imagini organizată pe categorii
- **Formular Contact**: Sistem de mesaje cu notificări email
- **Panel Admin**: Interfață de administrare completă
- **Optimizare Imagini**: Procesare automată cu Sharp (WebP, multiple dimensiuni)
- **Securitate**: Helmet, Rate Limiting, XSS Protection, NoSQL Injection Protection
- **Performance**: GZIP Compression, Static File Caching

## 📋 Cerințe

- Node.js >= 18.0.0
- MongoDB >= 7.0
- npm >= 9.0.0
- Docker și Docker Compose (opțional, pentru development)

## 🛠️ Instalare

### 1. Clonare repository

```bash
git clone <repository-url>
cd casa-ignat-nodejs
```

### 2. Instalare dependențe

```bash
npm install
```

### 3. Configurare environment

Copiază `.env.example` în `.env` și configurează variabilele:

```bash
cp .env.example .env
```

Editează `.env` și completează cu datele tale:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/casa_ignat
SESSION_SECRET=your-super-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. Start MongoDB

#### Opțiunea A: Cu Docker (Recomandat pentru development)

```bash
npm run docker:dev
```

Acest command pornește:
- MongoDB pe portul 27017
- Mongo Express (GUI) pe http://localhost:8081
- Aplicația Node.js cu hot-reload pe http://localhost:3000

#### Opțiunea B: MongoDB local

Asigură-te că MongoDB rulează local pe portul 27017.

### 5. Start aplicație

**Development (cu hot-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## 🐳 Docker

### Development cu Docker Compose

```bash
# Start toate serviciile (MongoDB + App + Mongo Express)
docker-compose --profile development up -d

# Stop serviciile
docker-compose down

# View logs
docker-compose logs -f app-dev
```

### Production cu Docker

```bash
# Build imagine
docker build -t casa-ignat .

# Start cu docker-compose
docker-compose --profile production up -d

# Sau manual
docker run -p 3000:3000 --env-file .env casa-ignat
```

## 📁 Structura Proiectului

```
casa-ignat-nodejs/
├── src/
│   ├── controllers/      # Business logic
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business services (email, images)
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
├── views/
│   ├── layouts/         # EJS layouts
│   ├── partials/        # Reusable components
│   ├── pages/           # Page templates
│   └── admin/           # Admin panel templates
├── public/
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   ├── images/          # Static images
│   └── uploads/         # User uploads
├── config/
│   ├── app.js           # App configuration
│   ├── database.js      # MongoDB connection
│   ├── email.js         # Email configuration
│   └── upload.js        # Upload & Multer config
├── migrations/          # Database migrations
├── seeds/               # Database seeds
├── tests/               # Tests
├── .env.example         # Environment template
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## 🔧 Scripts Disponibile

```bash
npm start           # Start production server
npm run dev         # Start development server cu nodemon
npm test            # Run tests
npm run lint        # Lint code
npm run lint:fix    # Fix linting issues
npm run docker:dev  # Start Docker development environment
npm run docker:down # Stop Docker containers
```

## 🔐 Securitate

Proiectul include mai multe măsuri de securitate:

- **Helmet**: Setări HTTP headers securizate
- **Rate Limiting**: Protecție împotriva abuzurilor
- **XSS Clean**: Protecție împotriva XSS attacks
- **Mongo Sanitize**: Protecție împotriva NoSQL injection
- **CORS**: Configurare cross-origin requests
- **Bcrypt**: Hash-uire parole
- **Session Security**: Sesiuni securizate cu HttpOnly cookies

## 📧 Configurare Email

Pentru trimitere emailuri (confirmări rezervări, contact), configurează SMTP în `.env`:

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

**Important**: Pentru Gmail, trebuie să generezi un [App Password](https://support.google.com/accounts/answer/185833).

## 🖼️ Procesare Imagini

Imaginile încărcate sunt procesate automat cu Sharp:
- Conversie în WebP pentru compresie optimă
- Generare thumbnail (300x200)
- Generare medium (800x600)
- Generare large (1920x1080)
- Calitate configurabilă în `.env`

## 🗄️ Baza de Date

### Models

- **Room**: Camere disponibile
- **MenuItem**: Produse din meniu
- **GalleryImage**: Imagini galerie
- **Booking**: Rezervări
- **Contact**: Mesaje de contact
- **Testimonial**: Testimoniale clienți

### Migrations & Seeds

```bash
npm run migrate     # Run migrations
npm run seed        # Seed database with sample data
```

## 📱 API Endpoints

### Public API
```
GET  /api/rooms                    # Lista camere
GET  /api/rooms/:id                # Detalii cameră
GET  /api/menu                     # Meniu complet
GET  /api/menu/:category           # Meniu pe categorie
GET  /api/gallery                  # Galerie completă
GET  /api/testimonials             # Testimoniale aprobate
POST /api/contact                  # Trimite mesaj contact
POST /api/booking                  # Creare rezervare
```

### Admin API (necesită autentificare)
```
GET  /admin                        # Dashboard
GET  /admin/rooms                  # Gestiune camere
GET  /admin/menu                   # Gestiune meniu
GET  /admin/gallery                # Gestiune galerie
GET  /admin/bookings               # Gestiune rezervări
GET  /admin/messages               # Mesaje primite
```

## 🧪 Testing

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
```

## 📄 License

MIT

## 👥 Contact

Pentru suport și întrebări, contactează echipa Casa Ignat.

---

**Dezvoltat cu ❤️ pentru Casa Ignat**