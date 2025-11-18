const { sendEmail } = require('../../config/email');
const emailTemplates = require('./emailTemplates');

/**
 * Send appointment confirmation email to client
 */
const sendAppointmentConfirmation = async (appointment) => {
  try {
    const html = emailTemplates.appointmentConfirmation(appointment);

    await sendEmail({
      to: appointment.clientInfo.email,
      subject: `Confirmare programare - ${appointment.service.name}`,
      html,
    });

    console.log(`Confirmation email sent to ${appointment.clientInfo.email}`);
  } catch (error) {
    console.error('Error sending appointment confirmation:', error);
    throw error;
  }
};

/**
 * Send new appointment notification to admin
 */
const sendNewAppointmentNotification = async (appointment) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL;
    if (!adminEmail) {
      console.warn('No admin email configured');
      return;
    }

    const html = emailTemplates.newAppointmentAdmin(appointment);

    await sendEmail({
      to: adminEmail,
      subject: `Programare nouă: ${appointment.service.name}`,
      html,
    });

    console.log(`Admin notification sent for appointment ${appointment._id}`);
  } catch (error) {
    console.error('Error sending admin notification:', error);
    throw error;
  }
};

/**
 * Send 24h reminder to client
 */
const sendAppointmentReminder = async (appointment) => {
  try {
    if (!appointment.reminderPreferences.email) {
      console.log(`Email reminder disabled for appointment ${appointment._id}`);
      return;
    }

    const html = emailTemplates.appointmentReminder(appointment);

    await sendEmail({
      to: appointment.clientInfo.email,
      subject: `Reminder: Programare mâine - ${appointment.service.name}`,
      html,
    });

    console.log(`Reminder email sent to ${appointment.clientInfo.email}`);
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    throw error;
  }
};

/**
 * Send appointment confirmed notification
 */
const sendAppointmentConfirmed = async (appointment) => {
  try {
    const html = emailTemplates.appointmentConfirmed(appointment);

    await sendEmail({
      to: appointment.clientInfo.email,
      subject: `Programare confirmată - ${appointment.service.name}`,
      html,
    });

    console.log(`Confirmed email sent to ${appointment.clientInfo.email}`);
  } catch (error) {
    console.error('Error sending appointment confirmed:', error);
    throw error;
  }
};

/**
 * Send appointment rescheduled notification
 */
const sendAppointmentRescheduled = async (appointment) => {
  try {
    const html = emailTemplates.appointmentRescheduled(appointment);

    await sendEmail({
      to: appointment.clientInfo.email,
      subject: `Programare reprogramată - ${appointment.service.name}`,
      html,
    });

    console.log(`Rescheduled email sent to ${appointment.clientInfo.email}`);
  } catch (error) {
    console.error('Error sending appointment rescheduled:', error);
    throw error;
  }
};

/**
 * Send appointment cancelled notification
 */
const sendAppointmentCancelled = async (appointment) => {
  try {
    const html = emailTemplates.appointmentCancelled(appointment);

    await sendEmail({
      to: appointment.clientInfo.email,
      subject: `Programare anulată - ${appointment.service.name}`,
      html,
    });

    console.log(`Cancellation email sent to ${appointment.clientInfo.email}`);
  } catch (error) {
    console.error('Error sending appointment cancelled:', error);
    throw error;
  }
};

/**
 * Send cancellation notification to admin
 */
const sendCancellationNotificationToAdmin = async (appointment) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL;
    if (!adminEmail) return;

    const html = emailTemplates.cancellationAdmin(appointment);

    await sendEmail({
      to: adminEmail,
      subject: `Programare anulată: ${appointment.service.name}`,
      html,
    });

    console.log(`Cancellation admin notification sent for appointment ${appointment._id}`);
  } catch (error) {
    console.error('Error sending cancellation admin notification:', error);
    throw error;
  }
};

/**
 * Send follow-up email after appointment
 */
const sendFollowUp = async (appointment) => {
  try {
    const html = emailTemplates.followUp(appointment);

    await sendEmail({
      to: appointment.clientInfo.email,
      subject: `Mulțumim pentru vizită - ${appointment.service.name}`,
      html,
    });

    console.log(`Follow-up email sent to ${appointment.clientInfo.email}`);
  } catch (error) {
    console.error('Error sending follow-up:', error);
    throw error;
  }
};

/**
 * Send daily summary to admin
 */
const sendDailySummary = async (appointments) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL;
    if (!adminEmail) {
      console.warn('No admin email configured for daily summary');
      return;
    }

    const html = emailTemplates.dailySummary(appointments);

    await sendEmail({
      to: adminEmail,
      subject: `Rezumat programări - ${new Date().toLocaleDateString('ro-RO')}`,
      html,
    });

    console.log('Daily summary sent to admin');
  } catch (error) {
    console.error('Error sending daily summary:', error);
    throw error;
  }
};

module.exports = {
  sendAppointmentConfirmation,
  sendNewAppointmentNotification,
  sendAppointmentReminder,
  sendAppointmentConfirmed,
  sendAppointmentRescheduled,
  sendAppointmentCancelled,
  sendCancellationNotificationToAdmin,
  sendFollowUp,
  sendDailySummary,
};
