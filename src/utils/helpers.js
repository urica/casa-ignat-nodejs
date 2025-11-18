const crypto = require('crypto');

// Generate slug from text
exports.slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Generate random token
exports.generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Format date
exports.formatDate = (date, format = 'ro') => {
  if (!date) return '';

  const d = new Date(date);

  if (format === 'ro') {
    return d.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return d.toISOString().split('T')[0];
};

// Format price
exports.formatPrice = (price, currency = 'RON') => {
  if (price === null || price === undefined) return '';
  return `${price.toLocaleString('ro-RO')} ${currency}`;
};

// Truncate text
exports.truncate = (text, length = 100, suffix = '...') => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
};

// Calculate reading time
exports.readingTime = (text) => {
  if (!text) return 0;
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Generate excerpt from HTML
exports.generateExcerpt = (html, length = 200) => {
  if (!html) return '';

  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  return exports.truncate(text, length);
};

// Check if date is in the past
exports.isPastDate = (date) => {
  return new Date(date) < new Date();
};

// Check if date is in the future
exports.isFutureDate = (date) => {
  return new Date(date) > new Date();
};

// Get time ago
exports.timeAgo = (date) => {
  if (!date) return '';

  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = {
    an: 31536000,
    lună: 2592000,
    săptămână: 604800,
    zi: 86400,
    oră: 3600,
    minut: 60,
    secundă: 1,
  };

  for (const [name, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return `acum ${interval} ${name}${interval !== 1 && name !== 'oră' ? (name === 'lună' ? 'i' : name === 'zi' ? 'le' : 'e') : ''}`;
    }
  }

  return 'acum';
};

// Validate email
exports.isValidEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

// Validate phone
exports.isValidPhone = (phone) => {
  return /^[0-9\s\-\+\(\)]+$/.test(phone);
};

// Generate backup filename
exports.generateBackupFilename = () => {
  const date = new Date();
  const timestamp = date.toISOString().replace(/:/g, '-').split('.')[0];
  return `backup-${timestamp}.json`;
};

// Safe JSON parse
exports.safeJsonParse = (json, defaultValue = null) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    return defaultValue;
  }
};
