const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const NodeClam = require('clamscan');

/**
 * Secure File Upload Middleware
 * Features:
 * - UUID-based file naming
 * - Virus scanning with ClamAV
 * - Magic number validation
 * - Path traversal prevention
 * - File size limits
 * - Quarantine for suspicious files
 */

// File type magic numbers (file signatures)
const MAGIC_NUMBERS = {
  'image/jpeg': ['FFD8FFE0', 'FFD8FFE1', 'FFD8FFE2', 'FFD8FFE3', 'FFD8FFE8'],
  'image/png': ['89504E47'],
  'image/webp': ['52494646'], // RIFF
  'image/gif': ['47494638'],
  'application/pdf': ['25504446'],
};

// Allowed upload directories (whitelist)
const ALLOWED_UPLOAD_DIRS = [
  'rooms',
  'gallery',
  'menu',
  'testimonials',
  'blog',
  'team',
  'avatars',
  'temp',
];

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const baseDirs = [
    'public/uploads',
    'public/uploads/quarantine',
    ...ALLOWED_UPLOAD_DIRS.map(dir => `public/uploads/${dir}`),
  ];

  for (const dir of baseDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}: ${error.message}`);
    }
  }
};

/**
 * Validate file type by magic numbers
 */
const validateFileSignature = async (filepath, expectedMimeType) => {
  try {
    const buffer = Buffer.alloc(8);
    const fd = await fs.open(filepath, 'r');
    await fd.read(buffer, 0, 8, 0);
    await fd.close();

    const hexSignature = buffer.toString('hex', 0, 4).toUpperCase();

    const validSignatures = MAGIC_NUMBERS[expectedMimeType];

    if (!validSignatures) {
      return false; // Unknown MIME type
    }

    return validSignatures.some(sig => hexSignature.startsWith(sig));
  } catch (error) {
    console.error('Error validating file signature:', error);
    return false;
  }
};

/**
 * Sanitize upload directory name (prevent path traversal)
 */
const sanitizeUploadDir = (uploadType) => {
  // Remove any path traversal attempts
  const sanitized = uploadType.replace(/\.\./g, '').replace(/\//g, '');

  // Check if it's in whitelist
  if (!ALLOWED_UPLOAD_DIRS.includes(sanitized)) {
    return 'temp'; // Default to temp if invalid
  }

  return sanitized;
};

/**
 * Configure ClamAV scanner
 */
let clamavScanner = null;
const initClamAV = async () => {
  try {
    const ClamScan = new NodeClam().init({
      removeInfected: false, // Don't auto-remove, quarantine instead
      quarantineInfected: false, // We'll handle quarantine manually
      scanLog: null,
      debugMode: process.env.NODE_ENV === 'development',
      clamscan: {
        path: '/usr/bin/clamscan',
        scanArchives: true,
        active: true,
      },
      clamdscan: {
        socket: '/var/run/clamav/clamd.sock',
        host: process.env.CLAMAV_HOST || 'localhost',
        port: process.env.CLAMAV_PORT || 3310,
        timeout: 60000,
        active: true,
      },
      preference: 'clamdscan',
    });

    clamavScanner = await ClamScan;
    console.log('ClamAV initialized successfully');
    return clamavScanner;
  } catch (error) {
    console.error('ClamAV initialization failed:', error.message);
    console.warn('File uploads will proceed without virus scanning');
    return null;
  }
};

/**
 * Scan file for viruses
 */
const scanFile = async (filepath) => {
  if (!clamavScanner) {
    console.warn('ClamAV not available, skipping virus scan');
    return { isInfected: false, viruses: [] };
  }

  try {
    const { isInfected, viruses } = await clamavScanner.scanFile(filepath);
    return { isInfected, viruses };
  } catch (error) {
    console.error('Error scanning file:', error);
    // Fail safely - treat scan errors as potential threats
    return { isInfected: true, viruses: ['SCAN_ERROR'] };
  }
};

/**
 * Quarantine infected file
 */
const quarantineFile = async (filepath, reason = 'virus_detected') => {
  try {
    const filename = path.basename(filepath);
    const quarantinePath = path.join(
      'public/uploads/quarantine',
      `${reason}-${Date.now()}-${filename}`
    );

    await fs.rename(filepath, quarantinePath);
    console.log(`File quarantined: ${filename} -> ${quarantinePath}`);

    return quarantinePath;
  } catch (error) {
    console.error('Error quarantining file:', error);
    // If quarantine fails, delete the file
    try {
      await fs.unlink(filepath);
    } catch (unlinkError) {
      console.error('Error deleting infected file:', unlinkError);
    }
    throw error;
  }
};

/**
 * Secure storage configuration with UUID naming
 */
const secureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = sanitizeUploadDir(req.body.uploadType || 'temp');
    const dest = path.join('public/uploads', uploadType);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate UUID for filename
    const uuid = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();

    // Validate extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'];
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid file extension'));
    }

    const filename = `${uuid}${ext}`;
    cb(null, filename);
  },
});

/**
 * Enhanced file filter
 */
const secureFileFilter = (req, file, cb) => {
  // Get allowed MIME types from environment or use defaults
  const allowedTypes = process.env.ALLOWED_FILE_TYPES
    ? process.env.ALLOWED_FILE_TYPES.split(',')
    : ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`), false);
  }

  // Check file size (additional to multer limits)
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB default
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return cb(new Error(`File too large. Maximum size: ${maxSize} bytes`), false);
  }

  cb(null, true);
};

/**
 * Secure upload middleware
 */
const secureUpload = multer({
  storage: secureStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
    files: 10, // Maximum 10 files per request
    fields: 20, // Maximum 20 non-file fields
  },
  fileFilter: secureFileFilter,
});

/**
 * Post-upload validation middleware
 */
const validateUpload = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];

    for (const file of files) {
      if (!file) continue;

      // Validate file signature
      const isValidSignature = await validateFileSignature(file.path, file.mimetype);

      if (!isValidSignature) {
        // Quarantine file with invalid signature
        await quarantineFile(file.path, 'invalid_signature');

        return res.status(400).json({
          success: false,
          message: 'File type mismatch detected. The file was rejected for security reasons.',
        });
      }

      // Scan for viruses
      const { isInfected, viruses } = await scanFile(file.path);

      if (isInfected) {
        // Quarantine infected file
        await quarantineFile(file.path, 'virus_detected');

        // Log the incident
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
          user: req.user?.id,
          action: 'virus_detected',
          resource: 'upload',
          details: {
            filename: file.originalname,
            viruses,
          },
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          status: 'warning',
        });

        return res.status(400).json({
          success: false,
          message: 'File rejected: Security threat detected',
        });
      }

      // Log successful upload
      if (req.user) {
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
          user: req.user.id,
          action: 'file_upload',
          resource: 'media',
          details: {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          },
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          status: 'success',
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in upload validation:', error);

    // Clean up uploaded files on error
    const files = req.files || [req.file];
    for (const file of files) {
      if (file && file.path) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }

    next(error);
  }
};

/**
 * Clean up quarantine folder (run as cron job)
 */
const cleanupQuarantine = async (maxAgeDays = 30) => {
  try {
    const quarantineDir = 'public/uploads/quarantine';
    const files = await fs.readdir(quarantineDir);

    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      const filepath = path.join(quarantineDir, file);
      const stats = await fs.stat(filepath);

      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filepath);
        deletedCount++;
      }
    }

    return { deletedCount };
  } catch (error) {
    console.error('Error cleaning up quarantine:', error);
    throw error;
  }
};

module.exports = {
  secureUpload,
  validateUpload,
  ensureUploadDirs,
  initClamAV,
  scanFile,
  quarantineFile,
  cleanupQuarantine,
};
