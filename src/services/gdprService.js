const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const User = require('../models/User');
const DataRequest = require('../models/DataRequest');
const ConsentTracking = require('../models/ConsentTracking');
const BlogComment = require('../models/BlogComment');
const Contact = require('../models/Contact');
const Booking = require('../models/Booking');
const Appointment = require('../models/Appointment');
const Testimonial = require('../models/Testimonial');
const AuditLog = require('../models/AuditLog');
const emailService = require('./emailService');

/**
 * GDPR Service
 * Handles GDPR compliance operations: data export, deletion, portability
 */

class GDPRService {
  /**
   * Export all user data (Right to Access)
   * @param {String} userId - User ID
   * @returns {Object} Exported data
   */
  static async exportUserData(userId) {
    try {
      // Get user data
      const user = await User.findById(userId).select('-password -twoFactorSecret -twoFactorBackupCodes');

      if (!user) {
        throw new Error('User not found');
      }

      // Get all related data
      const [
        consents,
        comments,
        contacts,
        bookings,
        appointments,
        testimonials,
        auditLogs,
        dataRequests,
      ] = await Promise.all([
        ConsentTracking.find({ user: userId }),
        BlogComment.find({ email: user.email }),
        Contact.find({ email: user.email }),
        Booking.find({ email: user.email }),
        Appointment.find({ 'clientInfo.email': user.email }),
        Testimonial.find({ email: user.email }),
        AuditLog.find({ user: userId }).sort({ createdAt: -1 }).limit(1000),
        DataRequest.find({ user: userId }),
      ]);

      // Compile all data
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          gdprConsent: user.gdprConsent,
          dataProcessingConsent: user.dataProcessingConsent,
        },
        consents: consents.map(c => ({
          consentDate: c.consentDate,
          consent: c.consent,
          privacyPolicyVersion: c.privacyPolicyVersion,
          expiresAt: c.expiresAt,
        })),
        blogComments: comments.map(c => ({
          content: c.content,
          postId: c.post,
          createdAt: c.createdAt,
          status: c.status,
        })),
        contactSubmissions: contacts.map(c => ({
          name: c.name,
          email: c.email,
          phone: c.phone,
          message: c.message,
          createdAt: c.createdAt,
        })),
        bookings: bookings.map(b => ({
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          guests: b.guests,
          status: b.status,
          totalPrice: b.totalPrice,
          createdAt: b.createdAt,
        })),
        appointments: appointments.map(a => ({
          service: a.service,
          appointmentDate: a.appointmentDate,
          status: a.status,
          notes: a.notes,
          createdAt: a.createdAt,
        })),
        testimonials: testimonials.map(t => ({
          content: t.content,
          rating: t.rating,
          approved: t.approved,
          createdAt: t.createdAt,
        })),
        auditLogs: auditLogs.map(log => ({
          action: log.action,
          resource: log.resource,
          ip: log.ip,
          timestamp: log.createdAt,
        })),
        dataRequests: dataRequests.map(dr => ({
          requestType: dr.requestType,
          status: dr.status,
          createdAt: dr.createdAt,
          processedAt: dr.processedAt,
        })),
      };

      return exportData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Create export file for download
   * @param {String} userId - User ID
   * @returns {String} File path
   */
  static async createExportFile(userId) {
    try {
      const data = await this.exportUserData(userId);
      const user = await User.findById(userId);

      // Create exports directory if it doesn't exist
      const exportsDir = path.join(__dirname, '../../exports');
      await fs.mkdir(exportsDir, { recursive: true });

      // Generate filename
      const timestamp = Date.now();
      const filename = `user-data-${userId}-${timestamp}.json`;
      const filepath = path.join(exportsDir, filename);

      // Write data to file
      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

      // Set expiration (7 days)
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return {
        filepath,
        filename,
        expiryDate,
      };
    } catch (error) {
      console.error('Error creating export file:', error);
      throw error;
    }
  }

  /**
   * Create export archive (ZIP) with all user data
   * @param {String} userId - User ID
   * @returns {String} Archive file path
   */
  static async createExportArchive(userId) {
    try {
      const data = await this.exportUserData(userId);
      const user = await User.findById(userId);

      // Create exports directory
      const exportsDir = path.join(__dirname, '../../exports');
      await fs.mkdir(exportsDir, { recursive: true });

      // Generate archive filename
      const timestamp = Date.now();
      const archiveFilename = `user-data-${userId}-${timestamp}.zip`;
      const archivePath = path.join(exportsDir, archiveFilename);

      // Create write stream
      const output = require('fs').createWriteStream(archivePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          resolve({
            filepath: archivePath,
            filename: archiveFilename,
            size: archive.pointer(),
            expiryDate,
          });
        });

        archive.on('error', (err) => {
          reject(err);
        });

        archive.pipe(output);

        // Add JSON data file
        archive.append(JSON.stringify(data, null, 2), { name: 'user-data.json' });

        // Add README
        const readme = `
# Your Personal Data Export

This archive contains all your personal data stored in our system, exported on ${new Date().toISOString()}.

## Files included:
- user-data.json: All your personal data in JSON format

## Data categories:
- User profile information
- Consent records
- Blog comments
- Contact submissions
- Bookings
- Appointments
- Testimonials
- Audit logs (last 1000 entries)
- Data requests

This export is valid for 7 days and will be automatically deleted after that period.

If you have any questions, please contact our Data Protection Officer at: ${process.env.ADMIN_EMAIL || 'dpo@casaignat.ro'}
`;
        archive.append(readme, { name: 'README.txt' });

        archive.finalize();
      });
    } catch (error) {
      console.error('Error creating export archive:', error);
      throw error;
    }
  }

  /**
   * Delete user data (Right to Erasure / Right to be Forgotten)
   * @param {String} userId - User ID
   * @param {Object} options - Deletion options
   * @returns {Object} Deletion summary
   */
  static async deleteUserData(userId, options = {}) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const {
        deleteComments = true,
        deleteBookings = false, // Keep for legal/financial records
        deleteAppointments = false, // Keep for legal/health records
        deleteAuditLogs = false, // Keep for security
        anonymizeInstead = true, // Anonymize instead of hard delete
      } = options;

      const deletionSummary = {
        userId,
        deletedAt: new Date(),
        anonymized: anonymizeInstead,
        deletedRecords: {},
      };

      if (anonymizeInstead) {
        // Anonymize user data instead of deleting
        user.email = `deleted-${userId}@anonymized.local`;
        user.name = 'Deleted User';
        user.avatar = null;
        user.isActive = false;
        user.deletionRequested = true;
        user.deletionRequestedAt = new Date();

        await user.save();

        // Anonymize related data
        if (deleteComments) {
          await BlogComment.updateMany(
            { email: user.email },
            { author: 'Anonymous', email: `anonymous-${userId}@anonymized.local` }
          );
          deletionSummary.deletedRecords.comments = 'anonymized';
        }

        // Keep bookings and appointments but anonymize
        await Booking.updateMany(
          { email: user.email },
          {
            'guestName': 'Anonymous Guest',
            'email': `anonymous-${userId}@anonymized.local`,
            'phone': 'DELETED',
          }
        );

        await Appointment.updateMany(
          { 'clientInfo.email': user.email },
          {
            'clientInfo.name': 'Anonymous',
            'clientInfo.email': `anonymous-${userId}@anonymized.local`,
            'clientInfo.phone': 'DELETED',
          }
        );

        deletionSummary.deletedRecords.user = 'anonymized';
      } else {
        // Hard delete (use with caution - may violate legal requirements)
        await User.findByIdAndDelete(userId);

        if (deleteComments) {
          const commentsResult = await BlogComment.deleteMany({ email: user.email });
          deletionSummary.deletedRecords.comments = commentsResult.deletedCount;
        }

        if (deleteBookings) {
          const bookingsResult = await Booking.deleteMany({ email: user.email });
          deletionSummary.deletedRecords.bookings = bookingsResult.deletedCount;
        }

        if (deleteAppointments) {
          const appointmentsResult = await Appointment.deleteMany({ 'clientInfo.email': user.email });
          deletionSummary.deletedRecords.appointments = appointmentsResult.deletedCount;
        }

        deletionSummary.deletedRecords.user = 'deleted';
      }

      // Always delete consents (no longer needed)
      const consentsResult = await ConsentTracking.deleteMany({ user: userId });
      deletionSummary.deletedRecords.consents = consentsResult.deletedCount;

      // Delete contact submissions
      const contactsResult = await Contact.deleteMany({ email: user.email });
      deletionSummary.deletedRecords.contacts = contactsResult.deletedCount;

      // Delete testimonials
      const testimonialsResult = await Testimonial.deleteMany({ email: user.email });
      deletionSummary.deletedRecords.testimonials = testimonialsResult.deletedCount;

      // Keep audit logs for legal compliance (log the deletion instead)
      if (!deleteAuditLogs) {
        await AuditLog.create({
          user: userId,
          action: 'account_deleted',
          resource: 'user',
          details: deletionSummary,
          ip: 'system',
          status: 'success',
        });
      }

      return deletionSummary;
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  /**
   * Schedule account deletion (with grace period)
   * @param {String} userId - User ID
   * @param {Number} gracePeriodDays - Days before deletion (default 30)
   */
  static async scheduleAccountDeletion(userId, gracePeriodDays = 30) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const scheduledDate = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000);

      user.deletionRequested = true;
      user.deletionRequestedAt = new Date();
      user.scheduledDeletionDate = scheduledDate;

      await user.save();

      // Send confirmation email
      await emailService.sendEmail({
        to: user.email,
        subject: 'Confirmare ștergere cont',
        template: 'account-deletion-scheduled',
        context: {
          name: user.name,
          scheduledDate: scheduledDate.toLocaleDateString('ro-RO'),
          cancelUrl: `${process.env.APP_URL}/account/cancel-deletion`,
        },
      });

      // Log the request
      await AuditLog.create({
        user: userId,
        action: 'deletion_requested',
        resource: 'user',
        details: { scheduledDate },
        ip: 'system',
        status: 'success',
      });

      return {
        success: true,
        scheduledDate,
        gracePeriodDays,
      };
    } catch (error) {
      console.error('Error scheduling account deletion:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled account deletion
   * @param {String} userId - User ID
   */
  static async cancelAccountDeletion(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      user.deletionRequested = false;
      user.deletionRequestedAt = null;
      user.scheduledDeletionDate = null;

      await user.save();

      // Log the cancellation
      await AuditLog.create({
        user: userId,
        action: 'deletion_cancelled',
        resource: 'user',
        ip: 'system',
        status: 'success',
      });

      return { success: true };
    } catch (error) {
      console.error('Error cancelling account deletion:', error);
      throw error;
    }
  }

  /**
   * Process scheduled deletions (should be run as cron job)
   */
  static async processScheduledDeletions() {
    try {
      const now = new Date();

      // Find users scheduled for deletion
      const usersToDelete = await User.find({
        deletionRequested: true,
        scheduledDeletionDate: { $lte: now },
      });

      const results = [];

      for (const user of usersToDelete) {
        try {
          const result = await this.deleteUserData(user._id, { anonymizeInstead: true });
          results.push({ userId: user._id, success: true, result });
        } catch (error) {
          console.error(`Error deleting user ${user._id}:`, error);
          results.push({ userId: user._id, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing scheduled deletions:', error);
      throw error;
    }
  }

  /**
   * Generate data portability export (machine-readable format)
   * @param {String} userId - User ID
   * @param {String} format - Export format (json, csv, xml)
   */
  static async generatePortabilityExport(userId, format = 'json') {
    try {
      const data = await this.exportUserData(userId);

      switch (format.toLowerCase()) {
        case 'json':
          return {
            data: JSON.stringify(data, null, 2),
            contentType: 'application/json',
            extension: 'json',
          };

        case 'csv':
          // Flatten data for CSV export
          const csvData = this.convertToCSV(data);
          return {
            data: csvData,
            contentType: 'text/csv',
            extension: 'csv',
          };

        case 'xml':
          const xmlData = this.convertToXML(data);
          return {
            data: xmlData,
            contentType: 'application/xml',
            extension: 'xml',
          };

        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error generating portability export:', error);
      throw error;
    }
  }

  /**
   * Convert data to CSV format
   */
  static convertToCSV(data) {
    // Simplified CSV conversion - would need proper library for production
    const rows = [];
    rows.push('Category,Field,Value');

    Object.entries(data).forEach(([category, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          Object.entries(item).forEach(([field, val]) => {
            rows.push(`${category}[${index}],${field},"${val}"`);
          });
        });
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([field, val]) => {
          rows.push(`${category},${field},"${val}"`);
        });
      } else {
        rows.push(`${category},-,"${value}"`);
      }
    });

    return rows.join('\n');
  }

  /**
   * Convert data to XML format
   */
  static convertToXML(data) {
    // Simplified XML conversion
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<userData>\n';

    Object.entries(data).forEach(([key, value]) => {
      xml += `  <${key}>${JSON.stringify(value)}</${key}>\n`;
    });

    xml += '</userData>';
    return xml;
  }

  /**
   * Clean up old export files (run as cron job)
   */
  static async cleanupOldExports() {
    try {
      const exportsDir = path.join(__dirname, '../../exports');
      const files = await fs.readdir(exportsDir);

      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(exportsDir, file);
        const stats = await fs.stat(filepath);

        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filepath);
          deletedCount++;
        }
      }

      return { deletedCount };
    } catch (error) {
      console.error('Error cleaning up old exports:', error);
      throw error;
    }
  }
}

module.exports = GDPRService;
