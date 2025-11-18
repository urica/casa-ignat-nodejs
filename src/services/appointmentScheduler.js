const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const emailService = require('./emailService');

/**
 * Send 24h reminders for appointments tomorrow
 * Runs daily at 10:00 AM
 */
const send24hReminders = async () => {
  try {
    console.log('Running 24h reminder job...');

    // Get tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find appointments for tomorrow that haven't received reminders
    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow,
      },
      status: { $in: ['new', 'confirmed'] },
      'notificationsSent.reminder24h.sent': false,
      'reminderPreferences.email': true,
    }).populate('service');

    console.log(`Found ${appointments.length} appointments needing 24h reminder`);

    for (const appointment of appointments) {
      try {
        await emailService.sendAppointmentReminder(appointment);

        appointment.notificationsSent.reminder24h.sent = true;
        appointment.notificationsSent.reminder24h.sentAt = new Date();
        await appointment.save();

        console.log(`24h reminder sent for appointment ${appointment._id}`);
      } catch (error) {
        console.error(`Failed to send reminder for appointment ${appointment._id}:`, error);
      }
    }

    console.log('24h reminder job completed');
  } catch (error) {
    console.error('Error in 24h reminder job:', error);
  }
};

/**
 * Send follow-up emails for completed appointments
 * Runs daily at 11:00 AM
 */
const sendFollowUpEmails = async () => {
  try {
    console.log('Running follow-up email job...');

    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find completed appointments from yesterday that haven't received follow-up
    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: yesterday,
        $lt: today,
      },
      status: 'completed',
      'notificationsSent.followUp.sent': false,
    }).populate('service');

    console.log(`Found ${appointments.length} appointments needing follow-up`);

    for (const appointment of appointments) {
      try {
        await emailService.sendFollowUp(appointment);

        appointment.notificationsSent.followUp.sent = true;
        appointment.notificationsSent.followUp.sentAt = new Date();
        await appointment.save();

        console.log(`Follow-up sent for appointment ${appointment._id}`);
      } catch (error) {
        console.error(`Failed to send follow-up for appointment ${appointment._id}:`, error);
      }
    }

    console.log('Follow-up email job completed');
  } catch (error) {
    console.error('Error in follow-up email job:', error);
  }
};

/**
 * Send daily summary to admin
 * Runs daily at 8:00 AM
 */
const sendDailySummaryEmail = async () => {
  try {
    console.log('Running daily summary job...');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all appointments for today
    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate('service')
      .sort({ appointmentTime: 1 });

    if (appointments.length > 0) {
      await emailService.sendDailySummary(appointments);
      console.log(`Daily summary sent with ${appointments.length} appointments`);
    } else {
      console.log('No appointments today, skipping daily summary');
    }

    console.log('Daily summary job completed');
  } catch (error) {
    console.error('Error in daily summary job:', error);
  }
};

/**
 * Auto-mark past appointments as no-show if still pending
 * Runs every hour
 */
const markNoShows = async () => {
  try {
    console.log('Running no-show marking job...');

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Find appointments that are more than 2 hours in the past and still pending/confirmed
    const appointments = await Appointment.find({
      status: { $in: ['new', 'confirmed'] },
    });

    let noShowCount = 0;

    for (const appointment of appointments) {
      if (appointment.appointmentDateTime < twoHoursAgo) {
        appointment.status = 'no_show';
        appointment.statusHistory.push({
          status: 'no_show',
          changedAt: new Date(),
          notes: 'Auto-marked as no-show by system',
        });
        await appointment.save();
        noShowCount++;
      }
    }

    if (noShowCount > 0) {
      console.log(`Marked ${noShowCount} appointments as no-show`);
    }

    console.log('No-show marking job completed');
  } catch (error) {
    console.error('Error in no-show marking job:', error);
  }
};

/**
 * Initialize all scheduled jobs
 */
const initializeScheduler = () => {
  console.log('Initializing appointment scheduler...');

  // Send 24h reminders daily at 10:00 AM
  cron.schedule('0 10 * * *', send24hReminders, {
    timezone: 'Europe/Bucharest',
  });
  console.log('✓ 24h reminder job scheduled (10:00 AM daily)');

  // Send follow-ups daily at 11:00 AM
  cron.schedule('0 11 * * *', sendFollowUpEmails, {
    timezone: 'Europe/Bucharest',
  });
  console.log('✓ Follow-up email job scheduled (11:00 AM daily)');

  // Send daily summary at 8:00 AM
  cron.schedule('0 8 * * *', sendDailySummaryEmail, {
    timezone: 'Europe/Bucharest',
  });
  console.log('✓ Daily summary job scheduled (8:00 AM daily)');

  // Mark no-shows every hour
  cron.schedule('0 * * * *', markNoShows, {
    timezone: 'Europe/Bucharest',
  });
  console.log('✓ No-show marking job scheduled (hourly)');

  console.log('Appointment scheduler initialized successfully');
};

/**
 * Manual trigger functions for testing
 */
const manualTriggers = {
  send24hReminders,
  sendFollowUpEmails,
  sendDailySummaryEmail,
  markNoShows,
};

module.exports = {
  initializeScheduler,
  manualTriggers,
};
