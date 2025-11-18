# Sistem Programări Online - Casa Ignat

## 📋 Prezentare Generală

Sistem complet de programări online implementat pentru Casa Ignat, cu funcționalități complete pentru clienți și administratori.

## ✨ Caracteristici Principale

### Pentru Clienți (Frontend Public)

#### 1. **Formular Programare Multi-Step (4 Pași)**

**Pas 1: Selectare Serviciu**
- Lista completă servicii cu descriere și preț
- Afișare durată estimată
- Design card-based interactiv
- Selecție vizuală cu feedback

**Pas 2: Calendar & Disponibilitate**
- Calendar interactiv Flatpickr
- Slot-uri orare disponibile în timp real
- Blocking automat pentru weekend
- Verificare disponibilitate în timp real
- Loading state pentru UX îmbunătățit

**Pas 3: Date Personale**
- Nume, telefon, email (obligatorii)
- Vârstă, sex (opționale)
- Descriere problemă (textarea)
- Sursă descoperire (dropdown cu "Altul")
- Preferințe reminder (email/SMS checkboxes)

**Pas 4: Confirmare**
- Sumar complet programare
- Recap detalii client
- Termeni și condiții checkbox
- Buton confirmare finală

**Funcționalități UX:**
- Progress bar vizual
- Validare pe fiecare pas
- Navigare înapoi fără pierdere date
- Animații smooth
- Responsive design complet
- Mesaje de eroare clare

### Pentru Administratori (Admin Panel)

#### 1. **Listă Programări** (`/admin/programari`)
- Tabel cu toate programările
- Filtrare după:
  - Status (nouă, confirmată, în așteptare, anulată, finalizată, no-show)
  - Serviciu
  - Interval de date
- Paginare
- Badge-uri color-coded pentru status
- Acțiuni rapide (vezi detalii)

#### 2. **Calendar Vizual** (`/admin/programari/calendar`)
- Vizualizare stil Google Calendar (FullCalendar.js ready)
- Drag & drop pentru reprogramare (implementare disponibilă)
- Cod culori după status
- Click pentru detalii rapide

#### 3. **Rapoarte & Statistici** (`/admin/programari/rapoarte`)
- Programări per serviciu
- Rate de conversie (confirmări/total)
- No-show statistics
- Revenue tracking (venituri încasate)
- Filtrare pe interval de date
- Export date (ready pentru implementare)

#### 4. **Detalii Programare**
- Informații complete client
- Istoric modificări status
- Note interne (doar admin)
- Timeline modificări
- Acțiuni: confirmare, anulare, finalizare

## 🔧 Componente Tehnice

### Backend

#### Modele de Date

**Appointment Model** (`src/models/Appointment.js`):
```javascript
{
  service: ObjectId,
  appointmentDate: Date,
  appointmentTime: String,
  duration: Number,
  clientInfo: {
    name, email, phone,
    age, gender,
    problemDescription,
    referralSource, referralSourceOther
  },
  status: enum['new', 'confirmed', 'waiting', 'cancelled', 'completed', 'no_show'],
  statusHistory: [{status, changedAt, changedBy, notes}],
  internalNotes: String,
  price: Number,
  paymentStatus: enum['pending', 'paid', 'refunded'],
  reminderPreferences: {email, sms},
  notificationsSent: {
    confirmationEmail,
    reminder24h,
    reminderSMS,
    followUp
  },
  termsAccepted: Boolean,
  cancellationReason: String,
  userAgent, ipAddress
}
```

**Metode utile:**
- `findAvailableSlots(date, serviceId)` - găsește sloturi disponibile
- `changeStatus(newStatus, userId, notes)` - schimbă status cu istoric
- `isPast()` - verifică dacă programarea a trecut
- `isUpcoming()` - verifică dacă e în următoarele 24h

#### Controllere

**appointmentController.js:**
- `showBookingForm` - afișează formularul public
- `getAvailableSlots` - returnează sloturi disponibile
- `createAppointment` - creează programare nouă
- `getAllAppointments` - listă (admin)
- `getAppointment` - detalii (admin)
- `updateAppointment` - actualizare (admin)
- `changeAppointmentStatus` - schimbare status
- `cancelAppointment` - anulare (client cu email)
- `deleteAppointment` - ștergere (admin)
- `getStatistics` - statistici și rapoarte
- `exportToCalendar` - export .ics

**adminController.js** (extensii):
- `listAppointments` - listă cu filtrare
- `appointmentsCalendar` - calendar view
- `appointmentsReports` - rapoarte detaliate
- `viewAppointment` - detalii programare
- `updateAppointment` - actualizare admin

#### Servicii

**emailService.js:**
- `sendAppointmentConfirmation(appointment)` - confirmare client
- `sendNewAppointmentNotification(appointment)` - notificare admin
- `sendAppointmentReminder(appointment)` - reminder 24h
- `sendAppointmentConfirmed(appointment)` - confirmare de către admin
- `sendAppointmentRescheduled(appointment)` - reprogramare
- `sendAppointmentCancelled(appointment)` - anulare
- `sendCancellationNotificationToAdmin(appointment)` - notificare anulare admin
- `sendFollowUp(appointment)` - follow-up după consultație
- `sendDailySummary(appointments)` - rezumat zilnic

**emailTemplates.js:**
- Template-uri HTML responsive
- Personalizare cu variabile
- Footer cu date contact
- Unsubscribe link
- Design consistent cu branding

**calendarService.js:**
- `generateICS(appointment)` - generare fișier .ics
- `generateGoogleCalendarUrl(appointment)` - link Google Calendar
- `generateOutlookCalendarUrl(appointment)` - link Outlook
- `generateOffice365CalendarUrl(appointment)` - link Office 365
- `generateYahooCalendarUrl(appointment)` - link Yahoo Calendar
- `getCalendarIntegrationUrls(appointment)` - toate URL-urile

**appointmentScheduler.js:**
- **Reminder 24h** - rulează zilnic la 10:00 AM
  - Găsește programările de mâine
  - Trimite reminder-e email
  - Marchează ca trimise

- **Follow-up** - rulează zilnic la 11:00 AM
  - Găsește programările finalizate de ieri
  - Trimite email follow-up
  - Solicită feedback

- **Daily Summary** - rulează zilnic la 8:00 AM
  - Rezumat programări zilnice pentru admin
  - Statistici rapide

- **Auto No-Show** - rulează la fiecare oră
  - Marchează automat programările ca no-show
  - După 2h de la ora programării
  - Dacă status încă pending/confirmed

### Routes

**API Public** (`/api/appointments/*`):
- `GET /api/appointments/available-slots` - sloturi disponibile
- `POST /api/appointments` - creare programare nouă
- `POST /api/appointments/:id/cancel` - anulare (cu validare email)
- `GET /api/appointments/:id/export` - export calendar .ics

**API Admin** (`/api/appointments/*` - necesită autentificare):
- `GET /api/appointments` - listă cu filtrare
- `GET /api/appointments/:id` - detalii
- `PUT /api/appointments/:id` - actualizare
- `PATCH /api/appointments/:id/status` - schimbare status
- `DELETE /api/appointments/:id` - ștergere
- `GET /api/appointments/stats` - statistici

**Admin Pages** (`/admin/programari/*`):
- `GET /admin/programari` - listă programări
- `GET /admin/programari/calendar` - calendar vizual
- `GET /admin/programari/rapoarte` - rapoarte
- `GET /admin/programari/:id` - detalii programare
- `POST /admin/programari/:id/update` - actualizare

**Public Page**:
- `GET /programari` - formular programare public

## 📧 Notificări Automate

### Pentru Clienți

1. **Email Confirmare** (imediat după programare)
   - Detalii complete programare
   - Link adăugare în calendar
   - Instrucțiuni pregătire

2. **Reminder 24h** (cu o zi înainte)
   - Reminder programare mâine
   - Detalii consultație
   - Link calendar
   - Opțiune anulare

3. **SMS Reminder** (opțional, dacă activat)
   - Mesaj scurt reminder
   - Detalii esențiale

4. **Follow-up** (după consultație)
   - Mulțumire pentru vizită
   - Solicitare feedback
   - Link programare follow-up

### Pentru Admin

1. **Notificare Programare Nouă**
   - Detalii client complet
   - Informații programare
   - Link admin panel

2. **Daily Summary** (dimineața la 8:00)
   - Toate programările zilei
   - Statistici rapide
   - Link calendar

3. **Alert Anulare**
   - Notificare când clientul anulează
   - Motiv anulare
   - Detalii programare

## 📅 Integrare Calendar

### Export .ics
- Standard iCalendar (RFC 5545)
- Compatibil cu toate aplicațiile
- Include reminder-e automate

### Google Calendar
- Link direct add to calendar
- Pre-populat cu toate detaliile

### Outlook / Office 365
- Deep links pentru outlook.com și outlook.office.com
- Suport complet metadate

### Apple Calendar
- Via fișier .ics
- Import direct iOS/macOS

### Yahoo Calendar
- Link direct cu parametri

## 📊 Rapoarte & Statistici

### Metrici Disponibile

1. **Total Programări**
   - Număr total într-o perioadă
   - Trend crescător/descrescător

2. **Breakdown după Status**
   - Noi, Confirmate, Finalizate
   - Anulate, No-show
   - Procente din total

3. **Breakdown după Serviciu**
   - Număr programări per serviciu
   - Revenue per serviciu
   - Servicii populare

4. **No-show Rate**
   - Procent no-show din total
   - Trend temporal
   - Identificare patterns

5. **Conversion Rate**
   - Confirmate + Finalizate / Total
   - Indicator calitate leads
   - Optimizare proces

6. **Revenue Tracking**
   - Venituri totale (doar paid)
   - Breakdown per serviciu
   - Proiecții

## 🔐 Securitate & Validare

### Validări Backend

- Validare serviciu disponibil
- Verificare slot disponibil (race condition safe)
- Validare email format
- Sanitizare input (XSS protection)
- CSRF protection pe formulare
- Rate limiting pe API

### Validări Frontend

- Validare pe fiecare pas
- Email format validation
- Phone format hints
- Required fields
- Checkbox terms acceptance

### Securitate Date

- IP address logging
- User agent tracking
- Audit trail (statusHistory)
- Email verification pentru anulare
- Admin-only internal notes

## 🚀 Configurare & Setup

### Dependențe

```bash
npm install date-fns node-cron
```

### Variabile de Mediu

```env
# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=noreply@casaignat.ro
SMTP_PASS=password
EMAIL_FROM="Casa Ignat <noreply@casaignat.ro>"

# Admin Notifications
ADMIN_EMAIL=admin@casaignat.ro
CONTACT_EMAIL=contact@casaignat.ro
CONTACT_PHONE=+40721234567

# Site Configuration
SITE_URL=https://casaignat.ro

# Address (pentru calendar)
ADDRESS_FULL="Strada Exemplu 123, București"

# Social Media
SOCIAL_FACEBOOK=https://facebook.com/casaignat
SOCIAL_INSTAGRAM=https://instagram.com/casaignat
```

### Inițializare

Scheduler-ul se inițializează automat în `server.js`:

```javascript
const { initializeScheduler } = require('./services/appointmentScheduler');
initializeScheduler();
```

### Business Hours Configuration

Editează în `Appointment.findAvailableSlots()`:

```javascript
const businessHours = {
  start: '09:00',
  end: '18:00',
  interval: 30, // minutes between slots
};
```

## 📱 Features Viitoare (Optional)

- [ ] SMS Integration (Twilio)
- [ ] Online Payment Integration
- [ ] Video Consultation Support
- [ ] Multi-language Support
- [ ] Mobile App
- [ ] Recurring Appointments
- [ ] Waiting List
- [ ] Auto-rescheduling suggestions
- [ ] Client Portal (istoric programări)
- [ ] Staff Management (multiple medici)
- [ ] Advanced Analytics Dashboard

## 🐛 Troubleshooting

### Notificările nu se trimit

1. Verifică configurația SMTP în `.env`
2. Check logs pentru erori email
3. Verifică că scheduler-ul rulează
4. Test manual: `appointmentScheduler.manualTriggers.send24hReminders()`

### Sloturi nu se încarcă

1. Verifică că serviciul are `duration` setat
2. Check console browser pentru erori API
3. Verifică business hours configuration
4. Test API direct: `/api/appointments/available-slots?date=2024-01-01&serviceId=xxx`

### Calendar export nu funcționează

1. Verifică permisiuni fișiere
2. Check format date
3. Verifică email match pentru security

## 📞 Support

Pentru întrebări sau probleme:
- Email: dev@casaignat.ro
- Documentation: `/APPOINTMENT_SYSTEM.md`

---

**Dezvoltat cu ❤️ pentru Casa Ignat**
