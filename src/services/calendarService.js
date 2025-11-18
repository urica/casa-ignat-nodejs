const { format } = require('date-fns');

/**
 * Generate ICS (iCalendar) file content for appointment
 * Compatible with Google Calendar, Outlook, Apple Calendar
 */
const generateICS = (appointment) => {
  const siteUrl = process.env.SITE_URL || 'https://casaignat.ro';
  const contactEmail = process.env.CONTACT_EMAIL || 'contact@casaignat.ro';

  // Create start datetime
  const startDate = new Date(appointment.appointmentDate);
  const [hours, minutes] = appointment.appointmentTime.split(':');
  startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  // Create end datetime
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + appointment.duration);

  // Format dates for ICS (YYYYMMDDTHHmmss)
  const formatICSDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hour}${minute}${second}`;
  };

  const dtStart = formatICSDate(startDate);
  const dtEnd = formatICSDate(endDate);
  const dtStamp = formatICSDate(new Date());

  // Create description
  const description = `Programare pentru ${appointment.service.name}\\n\\n` +
    `Durată: ${appointment.duration} minute\\n` +
    (appointment.price ? `Preț: ${appointment.price} ${appointment.currency}\\n` : '') +
    `\\nVă rugăm să ajungeți cu 5-10 minute înainte.\\n\\n` +
    `Dacă aveți nevoie să anulați sau să reprogramați, vă rugăm să ne contactați.\\n\\n` +
    `Casa Ignat - Cabinet Nutriție\\n` +
    `Email: ${contactEmail}`;

  // Create location
  const location = process.env.ADDRESS_FULL || 'Casa Ignat';

  // Generate UID
  const uid = `appointment-${appointment._id}@casaignat.ro`;

  // ICS content (following RFC 5545)
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Casa Ignat//Appointment Booking//RO',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${appointment.service.name} - Casa Ignat`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `STATUS:CONFIRMED`,
    `ORGANIZER;CN=Casa Ignat:MAILTO:${contactEmail}`,
    `ATTENDEE;CN=${appointment.clientInfo.name};RSVP=TRUE:MAILTO:${appointment.clientInfo.email}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Programare mâine la Casa Ignat',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Programare în 1 oră la Casa Ignat',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
};

/**
 * Generate Google Calendar URL
 */
const generateGoogleCalendarUrl = (appointment) => {
  const startDate = new Date(appointment.appointmentDate);
  const [hours, minutes] = appointment.appointmentTime.split(':');
  startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + appointment.duration);

  // Format for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;

  const title = encodeURIComponent(`${appointment.service.name} - Casa Ignat`);
  const details = encodeURIComponent(
    `Programare pentru ${appointment.service.name}\n\n` +
    `Durată: ${appointment.duration} minute\n` +
    (appointment.price ? `Preț: ${appointment.price} ${appointment.currency}\n` : '') +
    `\nVă rugăm să ajungeți cu 5-10 minute înainte.`
  );
  const location = encodeURIComponent(process.env.ADDRESS_FULL || 'Casa Ignat');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
};

/**
 * Generate Outlook Calendar URL
 */
const generateOutlookCalendarUrl = (appointment) => {
  const startDate = new Date(appointment.appointmentDate);
  const [hours, minutes] = appointment.appointmentTime.split(':');
  startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + appointment.duration);

  const title = encodeURIComponent(`${appointment.service.name} - Casa Ignat`);
  const body = encodeURIComponent(
    `Programare pentru ${appointment.service.name}\n\n` +
    `Durată: ${appointment.duration} minute\n` +
    (appointment.price ? `Preț: ${appointment.price} ${appointment.currency}\n` : '')
  );
  const location = encodeURIComponent(process.env.ADDRESS_FULL || 'Casa Ignat');
  const startTime = startDate.toISOString();
  const endTime = endDate.toISOString();

  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${body}&location=${location}&startdt=${startTime}&enddt=${endTime}`;
};

/**
 * Generate Office 365 Calendar URL
 */
const generateOffice365CalendarUrl = (appointment) => {
  const startDate = new Date(appointment.appointmentDate);
  const [hours, minutes] = appointment.appointmentTime.split(':');
  startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + appointment.duration);

  const title = encodeURIComponent(`${appointment.service.name} - Casa Ignat`);
  const body = encodeURIComponent(
    `Programare pentru ${appointment.service.name}\n\n` +
    `Durată: ${appointment.duration} minute\n` +
    (appointment.price ? `Preț: ${appointment.price} ${appointment.currency}\n` : '')
  );
  const location = encodeURIComponent(process.env.ADDRESS_FULL || 'Casa Ignat');
  const startTime = startDate.toISOString();
  const endTime = endDate.toISOString();

  return `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&body=${body}&location=${location}&startdt=${startTime}&enddt=${endTime}`;
};

/**
 * Generate Yahoo Calendar URL
 */
const generateYahooCalendarUrl = (appointment) => {
  const startDate = new Date(appointment.appointmentDate);
  const [hours, minutes] = appointment.appointmentTime.split(':');
  startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + appointment.duration);

  // Format for Yahoo (YYYYMMDDTHHmmssZ)
  const formatYahooDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const title = encodeURIComponent(`${appointment.service.name} - Casa Ignat`);
  const desc = encodeURIComponent(
    `Programare pentru ${appointment.service.name}\n\n` +
    `Durată: ${appointment.duration} minute`
  );
  const location = encodeURIComponent(process.env.ADDRESS_FULL || 'Casa Ignat');
  const st = formatYahooDate(startDate);
  const dur = String(Math.floor(appointment.duration / 60)).padStart(2, '0') +
    String(appointment.duration % 60).padStart(2, '0');

  return `https://calendar.yahoo.com/?v=60&title=${title}&desc=${desc}&loc=${location}&st=${st}&dur=${dur}`;
};

/**
 * Get all calendar integration URLs
 */
const getCalendarIntegrationUrls = (appointment) => {
  return {
    google: generateGoogleCalendarUrl(appointment),
    outlook: generateOutlookCalendarUrl(appointment),
    office365: generateOffice365CalendarUrl(appointment),
    yahoo: generateYahooCalendarUrl(appointment),
    ics: `/api/appointments/${appointment._id}/export?email=${appointment.clientInfo.email}`,
  };
};

module.exports = {
  generateICS,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateOffice365CalendarUrl,
  generateYahooCalendarUrl,
  getCalendarIntegrationUrls,
};
