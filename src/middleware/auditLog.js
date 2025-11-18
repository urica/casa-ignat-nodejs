const AuditLog = require('../models/AuditLog');

// Log action
exports.log = async (req, action, resource, resourceId = null, details = '', metadata = {}) => {
  try {
    await AuditLog.create({
      user: req.user?._id,
      email: req.user?.email || req.body?.email,
      action,
      resource,
      resourceId,
      details,
      metadata,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status: 'success',
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// Middleware to auto-log actions
exports.autoLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    const originalRender = res.render.bind(res);

    res.json = function(data) {
      // Log if successful
      if (data && data.success !== false) {
        exports.log(req, action, resource, data.id || req.params.id, '', {
          method: req.method,
          path: req.path,
        }).catch(console.error);
      }
      return originalJson(data);
    };

    res.render = function(view, options) {
      // Log render
      exports.log(req, action, resource, req.params.id, '', {
        view,
        method: req.method,
        path: req.path,
      }).catch(console.error);
      return originalRender(view, options);
    };

    next();
  };
};

// Log login attempt
exports.logLogin = async (req, success, email, reason = '') => {
  try {
    await AuditLog.create({
      user: req.user?._id,
      email,
      action: success ? 'login' : 'login_failed',
      resource: 'user',
      details: reason,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status: success ? 'success' : 'failed',
    });
  } catch (error) {
    console.error('Login audit log error:', error);
  }
};

// Log logout
exports.logLogout = async (req) => {
  try {
    await AuditLog.create({
      user: req.user?._id,
      email: req.user?.email,
      action: 'logout',
      resource: 'user',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status: 'success',
    });
  } catch (error) {
    console.error('Logout audit log error:', error);
  }
};
