const AnalyticsService = require('../services/analyticsService');

/**
 * Analytics Middleware
 * Automatically tracks page views and makes analytics service available
 */

/**
 * Track page view middleware
 */
const trackPageView = async (req, res, next) => {
  // Track page view in background (don't block request)
  setImmediate(async () => {
    try {
      await AnalyticsService.trackPageView(req, {
        title: res.locals.title || req.path,
        referrer: req.get('referrer'),
        user_agent: req.get('user-agent'),
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  });

  next();
};

/**
 * Make analytics service available in views
 */
const injectAnalytics = async (req, res, next) => {
  // Check consent status
  const hasAnalyticsConsent = await AnalyticsService.hasAnalyticsConsent(req);
  const hasMarketingConsent = await AnalyticsService.hasMarketingConsent(req);

  // Make available in views
  res.locals.hasAnalyticsConsent = hasAnalyticsConsent;
  res.locals.hasMarketingConsent = hasMarketingConsent;
  res.locals.analyticsService = AnalyticsService;

  // Analytics configuration
  res.locals.analytics = {
    ga4MeasurementId: process.env.GA4_MEASUREMENT_ID || process.env.GA_TRACKING_ID,
    gtmContainerId: process.env.GTM_CONTAINER_ID,
    fbPixelId: process.env.FB_PIXEL_ID,
    clarityProjectId: process.env.CLARITY_PROJECT_ID,
    googleOptimizeId: process.env.GOOGLE_OPTIMIZE_ID,
  };

  next();
};

/**
 * Track form submission
 */
const trackFormSubmission = (formName) => {
  return async (req, res, next) => {
    // Store original res.json to intercept
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Track if successful
      if (data.success) {
        setImmediate(async () => {
          try {
            await AnalyticsService.trackFormSubmission(req, formName, {
              destination: req.path,
              ...req.body,
            });
          } catch (error) {
            console.error('Error tracking form submission:', error);
          }
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Track conversion
 */
const trackConversion = (conversionType, getValue = () => 0) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (data.success) {
        setImmediate(async () => {
          try {
            const value = typeof getValue === 'function' ? getValue(req, data) : getValue;

            await AnalyticsService.trackConversion(req, conversionType, value, {
              page_url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
              ip: req.ip || req.connection.remoteAddress,
              user_agent: req.get('user-agent'),
            });
          } catch (error) {
            console.error('Error tracking conversion:', error);
          }
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Track ecommerce event
 */
const trackEcommerce = (action, getItems, getTransactionData) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (data.success) {
        setImmediate(async () => {
          try {
            const items = typeof getItems === 'function' ? getItems(req, data) : [];
            const transactionData = typeof getTransactionData === 'function'
              ? getTransactionData(req, data)
              : {};

            await AnalyticsService.trackEcommerce(req, action, items, transactionData);
          } catch (error) {
            console.error('Error tracking ecommerce:', error);
          }
        });
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  trackPageView,
  injectAnalytics,
  trackFormSubmission,
  trackConversion,
  trackEcommerce,
};
