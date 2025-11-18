const { format } = require('date-fns');
const { ro } = require('date-fns/locale');

/**
 * Base email template with responsive design
 */
const baseTemplate = (content, title = 'Casa Ignat') => {
  const currentYear = new Date().getFullYear();
  const siteUrl = process.env.SITE_URL || 'https://casaignat.ro';
  const contactEmail = process.env.CONTACT_EMAIL || 'contact@casaignat.ro';
  const contactPhone = process.env.CONTACT_PHONE || '';

  return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px 20px;
    }
    .appointment-details {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .appointment-details h3 {
      margin-top: 0;
      color: #667eea;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #555;
    }
    .detail-value {
      color: #333;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      background: #5568d3;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #667eea;
      text-decoration: none;
    }
    .unsubscribe {
      margin-top: 15px;
      font-size: 12px;
      color: #999;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
      .detail-row {
        flex-direction: column;
      }
      .detail-label {
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 Casa Ignat</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <strong>Casa Ignat - Cabinet Nutriție</strong><br>
      ${contactPhone ? `Tel: <a href="tel:${contactPhone}">${contactPhone}</a><br>` : ''}
      Email: <a href="mailto:${contactEmail}">${contactEmail}</a><br>
      Web: <a href="${siteUrl}">${siteUrl}</a>

      <div class="social-links">
        ${process.env.SOCIAL_FACEBOOK ? `<a href="${process.env.SOCIAL_FACEBOOK}">Facebook</a>` : ''}
        ${process.env.SOCIAL_INSTAGRAM ? `<a href="${process.env.SOCIAL_INSTAGRAM}">Instagram</a>` : ''}
      </div>

      <div class="unsubscribe">
        <p>&copy; ${currentYear} Casa Ignat. Toate drepturile rezervate.</p>
        <p><a href="${siteUrl}/unsubscribe?email={{EMAIL}}">Dezabonare notificări</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Format appointment date and time
 */
const formatAppointmentDateTime = (appointment) => {
  try {
    const dateStr = format(new Date(appointment.appointmentDate), 'dd MMMM yyyy', { locale: ro });
    return {
      date: dateStr,
      time: appointment.appointmentTime,
    };
  } catch (error) {
    return {
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
    };
  }
};

/**
 * Appointment confirmation email
 */
const appointmentConfirmation = (appointment) => {
  const { date, time } = formatAppointmentDateTime(appointment);
  const siteUrl = process.env.SITE_URL || 'https://casaignat.ro';
  const calendarUrl = `${siteUrl}/api/appointments/${appointment._id}/export?email=${appointment.clientInfo.email}`;

  const content = `
    <h2>Bună ${appointment.clientInfo.name}!</h2>
    <p>Programarea ta a fost înregistrată cu succes! 🎉</p>

    <div class="appointment-details">
      <h3>Detalii programare:</h3>
      <div class="detail-row">
        <span class="detail-label">Serviciu:</span>
        <span class="detail-value">${appointment.service.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Data:</span>
        <span class="detail-value">${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ora:</span>
        <span class="detail-value">${time}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Durată:</span>
        <span class="detail-value">${appointment.duration} minute</span>
      </div>
      ${appointment.price ? `
      <div class="detail-row">
        <span class="detail-label">Preț:</span>
        <span class="detail-value">${appointment.price} ${appointment.currency}</span>
      </div>
      ` : ''}
    </div>

    <p><strong>Ce urmează?</strong></p>
    <ul>
      <li>Vei primi un reminder cu 24h înainte de programare${appointment.reminderPreferences.sms ? ' (email și SMS)' : ''}</li>
      <li>Te rugăm să ajungi cu 5-10 minute înainte de ora programării</li>
      <li>Dacă trebuie să anulezi programarea, te rugăm să ne anunți cu minim 24h înainte</li>
    </ul>

    <center>
      <a href="${calendarUrl}" class="button">📅 Adaugă în Calendar</a>
    </center>

    <p>Dacă ai întrebări, nu ezita să ne contactezi!</p>
    <p>Ne vedem curând! 😊</p>
  `;

  return baseTemplate(content, 'Confirmare Programare - Casa Ignat');
};

/**
 * New appointment notification for admin
 */
const newAppointmentAdmin = (appointment) => {
  const { date, time } = formatAppointmentDateTime(appointment);
  const siteUrl = process.env.SITE_URL || 'https://casaignat.ro';
  const appointmentUrl = `${siteUrl}/admin/programari/${appointment._id}`;

  const content = `
    <h2>Programare Nouă Primită! 🔔</h2>

    <div class="appointment-details">
      <h3>Detalii client:</h3>
      <div class="detail-row">
        <span class="detail-label">Nume:</span>
        <span class="detail-value">${appointment.clientInfo.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email:</span>
        <span class="detail-value">${appointment.clientInfo.email}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Telefon:</span>
        <span class="detail-value">${appointment.clientInfo.phone}</span>
      </div>
      ${appointment.clientInfo.age ? `
      <div class="detail-row">
        <span class="detail-label">Vârstă:</span>
        <span class="detail-value">${appointment.clientInfo.age} ani</span>
      </div>
      ` : ''}
      ${appointment.clientInfo.gender ? `
      <div class="detail-row">
        <span class="detail-label">Sex:</span>
        <span class="detail-value">${appointment.clientInfo.gender}</span>
      </div>
      ` : ''}
    </div>

    <div class="appointment-details">
      <h3>Detalii programare:</h3>
      <div class="detail-row">
        <span class="detail-label">Serviciu:</span>
        <span class="detail-value">${appointment.service.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Data:</span>
        <span class="detail-value">${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ora:</span>
        <span class="detail-value">${time}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Durată:</span>
        <span class="detail-value">${appointment.duration} minute</span>
      </div>
    </div>

    ${appointment.clientInfo.problemDescription ? `
    <div class="appointment-details">
      <h3>Descriere problemă:</h3>
      <p>${appointment.clientInfo.problemDescription}</p>
    </div>
    ` : ''}

    ${appointment.clientInfo.referralSource ? `
    <div class="appointment-details">
      <h3>Sursă:</h3>
      <p>${appointment.clientInfo.referralSource}${appointment.clientInfo.referralSourceOther ? ` - ${appointment.clientInfo.referralSourceOther}` : ''}</p>
    </div>
    ` : ''}

    <center>
      <a href="${appointmentUrl}" class="button">Vezi în Admin Panel</a>
    </center>
  `;

  return baseTemplate(content, 'Programare Nouă - Casa Ignat Admin');
};

/**
 * 24h reminder email
 */
const appointmentReminder = (appointment) => {
  const { date, time } = formatAppointmentDateTime(appointment);
  const siteUrl = process.env.SITE_URL || 'https://casaignat.ro';
  const calendarUrl = `${siteUrl}/api/appointments/${appointment._id}/export?email=${appointment.clientInfo.email}`;

  const content = `
    <h2>Reminder: Programare Mâine! ⏰</h2>
    <p>Bună ${appointment.clientInfo.name},</p>
    <p>Acesta este un reminder prietenos că ai o programare mâine:</p>

    <div class="appointment-details">
      <h3>Detalii programare:</h3>
      <div class="detail-row">
        <span class="detail-label">Serviciu:</span>
        <span class="detail-value">${appointment.service.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Data:</span>
        <span class="detail-value">${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ora:</span>
        <span class="detail-value">${time}</span>
      </div>
    </div>

    <p><strong>Pregătire pentru consultație:</strong></p>
    <ul>
      <li>Te rugăm să ajungi cu 5-10 minute înainte</li>
      <li>Adu orice analize medicale relevante</li>
      <li>Pregătește o listă cu întrebări dacă ai</li>
    </ul>

    <center>
      <a href="${calendarUrl}" class="button">📅 Adaugă în Calendar</a>
    </center>

    <p>Dacă nu poți ajunge, te rugăm să ne anunți cât mai curând posibil.</p>
    <p>Ne vedem mâine! 😊</p>
  `;

  return baseTemplate(content, 'Reminder Programare - Casa Ignat');
};

/**
 * Appointment confirmed
 */
const appointmentConfirmed = (appointment) => {
  const { date, time } = formatAppointmentDateTime(appointment);

  const content = `
    <h2>Programarea ta a fost confirmată! ✅</h2>
    <p>Bună ${appointment.clientInfo.name},</p>
    <p>Programarea ta a fost confirmată de către echipa noastră.</p>

    <div class="appointment-details">
      <h3>Detalii programare:</h3>
      <div class="detail-row">
        <span class="detail-label">Serviciu:</span>
        <span class="detail-value">${appointment.service.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Data:</span>
        <span class="detail-value">${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ora:</span>
        <span class="detail-value">${time}</span>
      </div>
    </div>

    <p>Te așteptăm! 😊</p>
  `;

  return baseTemplate(content, 'Programare Confirmată - Casa Ignat');
};

/**
 * Appointment rescheduled
 */
const appointmentRescheduled = (appointment) => {
  const { date, time } = formatAppointmentDateTime(appointment);
  const siteUrl = process.env.SITE_URL || 'https://casaignat.ro';
  const calendarUrl = `${siteUrl}/api/appointments/${appointment._id}/export?email=${appointment.clientInfo.email}`;

  const content = `
    <h2>Programarea ta a fost reprogramată 📅</h2>
    <p>Bună ${appointment.clientInfo.name},</p>
    <p>Programarea ta a fost reprogramată la o nouă dată și oră:</p>

    <div class="appointment-details">
      <h3>Noile detalii:</h3>
      <div class="detail-row">
        <span class="detail-label">Serviciu:</span>
        <span class="detail-value">${appointment.service.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Data:</span>
        <span class="detail-value">${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ora:</span>
        <span class="detail-value">${time}</span>
      </div>
    </div>

    <center>
      <a href="${calendarUrl}" class="button">📅 Actualizează Calendarul</a>
    </center>

    <p>Dacă ai întrebări, nu ezita să ne contactezi!</p>
  `;

  return baseTemplate(content, 'Programare Reprogramată - Casa Ignat');
};

/**
 * Appointment cancelled
 */
const appointmentCancelled = (appointment) => {
  const { date, time } = formatAppointmentDateTime(appointment);
  const siteUrl = process.env.SITE_URL || 'https://casaignat.ro';

  const content = `
    <h2>Programarea ta a fost anulată</h2>
    <p>Bună ${appointment.clientInfo.name},</p>
    <p>Programarea ta a fost anulată:</p>

    <div class="appointment-details">
      <h3>Detalii programare anulată:</h3>
      <div class="detail-row">
        <span class="detail-label">Serviciu:</span>
        <span class="detail-value">${appointment.service.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Data:</span>
        <span class="detail-value">${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ora:</span>
        <span class="detail-value">${time}</span>
      </div>
    </div>

    ${appointment.cancellationReason ? `
    <div class="appointment-details">
      <h3>Motiv anulare:</h3>
      <p>${appointment.cancellationReason}</p>
    </div>
    ` : ''}

    <p>Dacă dorești să programezi o nouă consultație, te așteptăm!</p>

    <center>
      <a href="${siteUrl}/programari" class="button">Programează-te din nou</a>
    </center>
  `;

  return baseTemplate(content, 'Programare Anulată - Casa Ignat');
};

/**
 * Cancellation notification for admin
 */
const cancellationAdmin = (appointment) => {
  const { date, time } = formatAppointmentDateTime(appointment);

  const content = `
    <h2>Programare Anulată! ⚠️</h2>

    <div class="appointment-details">
      <h3>Detalii programare anulată:</h3>
      <div class="detail-row">
        <span class="detail-label">Client:</span>
        <span class="detail-value">${appointment.clientInfo.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email:</span>
        <span class="detail-value">${appointment.clientInfo.email}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Telefon:</span>
        <span class="detail-value">${appointment.clientInfo.phone}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Serviciu:</span>
        <span class="detail-value">${appointment.service.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Data:</span>
        <span class="detail-value">${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ora:</span>
        <span class="detail-value">${time}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Anulat de:</span>
        <span class="detail-value">${appointment.cancelledBy === 'client' ? 'Client' : 'Admin'}</span>
      </div>
    </div>

    ${appointment.cancellationReason ? `
    <div class="appointment-details">
      <h3>Motiv anulare:</h3>
      <p>${appointment.cancellationReason}</p>
    </div>
    ` : ''}
  `;

  return baseTemplate(content, 'Programare Anulată - Casa Ignat Admin');
};

/**
 * Follow-up email after appointment
 */
const followUp = (appointment) => {
  const siteUrl = process.env.SITE_URL || 'https://casaignat.ro';

  const content = `
    <h2>Mulțumim pentru vizită! 🙏</h2>
    <p>Bună ${appointment.clientInfo.name},</p>
    <p>Sperăm că consultația ta cu noi a fost utilă și informativă!</p>

    <p><strong>Feedback:</strong></p>
    <p>Părerea ta este foarte importantă pentru noi. Te rugăm să ne spui cum a fost experiența ta:</p>

    <center>
      <a href="${siteUrl}/feedback?appointment=${appointment._id}" class="button">Lasă un Review</a>
    </center>

    <p><strong>Pași următori:</strong></p>
    <ul>
      <li>Urmează recomandările primite în timpul consultației</li>
      <li>Contactează-ne dacă ai întrebări suplimentare</li>
      <li>Programează-te pentru o consultație de follow-up dacă este necesar</li>
    </ul>

    <center>
      <a href="${siteUrl}/programari" class="button">Programează Consultație Follow-up</a>
    </center>

    <p>Îți mulțumim că ai ales Casa Ignat! 😊</p>
  `;

  return baseTemplate(content, 'Mulțumim pentru vizită - Casa Ignat');
};

/**
 * Daily summary for admin
 */
const dailySummary = (appointments) => {
  const today = new Date().toLocaleDateString('ro-RO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const upcoming = appointments.filter(apt => apt.status !== 'cancelled' && apt.status !== 'completed');
  const completed = appointments.filter(apt => apt.status === 'completed');
  const cancelled = appointments.filter(apt => apt.status === 'cancelled');

  const content = `
    <h2>Rezumat Programări - ${today}</h2>

    <div class="appointment-details">
      <h3>Statistici zilnice:</h3>
      <div class="detail-row">
        <span class="detail-label">Total programări:</span>
        <span class="detail-value">${appointments.length}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Programări active:</span>
        <span class="detail-value">${upcoming.length}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Finalizate:</span>
        <span class="detail-value">${completed.length}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Anulate:</span>
        <span class="detail-value">${cancelled.length}</span>
      </div>
    </div>

    ${upcoming.length > 0 ? `
    <div class="appointment-details">
      <h3>Programări pentru astăzi:</h3>
      ${upcoming.map(apt => {
        const { time } = formatAppointmentDateTime(apt);
        return `
        <div class="detail-row">
          <span class="detail-label">${time} - ${apt.clientInfo.name}</span>
          <span class="detail-value">${apt.service.name}</span>
        </div>
        `;
      }).join('')}
    </div>
    ` : '<p>Nu există programări pentru astăzi.</p>'}
  `;

  return baseTemplate(content, 'Rezumat Programări - Casa Ignat Admin');
};

module.exports = {
  appointmentConfirmation,
  newAppointmentAdmin,
  appointmentReminder,
  appointmentConfirmed,
  appointmentRescheduled,
  appointmentCancelled,
  cancellationAdmin,
  followUp,
  dailySummary,
};
