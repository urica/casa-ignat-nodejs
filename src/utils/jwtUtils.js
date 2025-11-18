const jwt = require('jsonwebtoken');
const config = require('../../config/app');

/**
 * JWT Utilities for Token Management
 * Provides functions for generating and verifying JWT tokens
 */

/**
 * Generate access token (short-lived)
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    config.security.jwtSecret,
    {
      expiresIn: config.security.jwtAccessExpiry || '15m', // 15 minutes
      issuer: config.app.name || 'Casa Ignat',
      audience: config.app.url,
    }
  );
};

/**
 * Generate refresh token (long-lived)
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    config.security.jwtRefreshSecret || config.security.jwtSecret,
    {
      expiresIn: config.security.jwtRefreshExpiry || '7d', // 7 days
      issuer: config.app.name || 'Casa Ignat',
      audience: config.app.url,
    }
  );
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object from database
 * @returns {Object} Object containing both tokens
 */
const generateTokenPair = (user) => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: payload.id }), // Minimal data in refresh token
  };
};

/**
 * Verify access token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.security.jwtSecret, {
      issuer: config.app.name || 'Casa Ignat',
      audience: config.app.url,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {String} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(
      token,
      config.security.jwtRefreshSecret || config.security.jwtSecret,
      {
        issuer: config.app.name || 'Casa Ignat',
        audience: config.app.url,
      }
    );
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (use with caution)
 * @param {String} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Extract token from cookie
 * @param {Object} cookies - Request cookies object
 * @param {String} cookieName - Name of cookie containing token
 * @returns {String|null} Extracted token or null
 */
const extractTokenFromCookie = (cookies, cookieName = 'accessToken') => {
  return cookies[cookieName] || null;
};

/**
 * Get token expiration time
 * @param {String} token - JWT token
 * @returns {Date|null} Expiration date or null if invalid
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return null;
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 * @param {String} token - JWT token
 * @returns {Boolean} True if expired
 */
const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration < new Date();
};

/**
 * Generate token for password reset
 * @param {String} userId - User ID
 * @returns {String} Password reset token
 */
const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'password_reset' },
    config.security.jwtSecret,
    { expiresIn: '1h' }
  );
};

/**
 * Verify password reset token
 * @param {String} token - Password reset token
 * @returns {Object} Decoded token payload
 */
const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.security.jwtSecret);
    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Password reset token has expired');
    }
    throw new Error('Invalid password reset token');
  }
};

/**
 * Generate email verification token
 * @param {String} email - User email
 * @returns {String} Email verification token
 */
const generateEmailVerificationToken = (email) => {
  return jwt.sign(
    { email, type: 'email_verification' },
    config.security.jwtSecret,
    { expiresIn: '24h' }
  );
};

/**
 * Verify email verification token
 * @param {String} token - Email verification token
 * @returns {Object} Decoded token payload
 */
const verifyEmailVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.security.jwtSecret);
    if (decoded.type !== 'email_verification') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Email verification token has expired');
    }
    throw new Error('Invalid email verification token');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader,
  extractTokenFromCookie,
  getTokenExpiration,
  isTokenExpired,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
};
