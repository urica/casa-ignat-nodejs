const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  email: {
    type: String,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'login_failed',
      'create', 'update', 'delete',
      'publish', 'unpublish',
      'approve', 'reject',
      'upload', 'download',
      'settings_change',
      'user_create', 'user_update', 'user_delete',
      'password_change', 'password_reset',
      '2fa_enable', '2fa_disable',
      'backup_create', 'backup_restore',
    ],
  },
  resource: {
    type: String,
    enum: [
      'user', 'blog_post', 'page', 'service', 'team_member',
      'testimonial', 'booking', 'media', 'settings', 'contact',
    ],
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'warning'],
    default: 'success',
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });

// Auto-delete logs older than 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('AuditLog', auditLogSchema);
