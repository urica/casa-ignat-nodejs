const axios = require('axios');
const ConsentTracking = require('../models/ConsentTracking');

/**
 * Analytics Service
 * Centralized service for tracking events across multiple analytics platforms
 * Respects GDPR consent preferences
 */

class AnalyticsService {
  /**
   * Check if user has consented to analytics
   */
  static async hasAnalyticsConsent(req) {
    try {
      const identifier = req.user?.id || req.user?.email || req.session?.id;

      if (!identifier) {
        // Check cookie consent
        const cookieConsent = req.cookies?.cookieConsent;
        if (cookieConsent) {
          const consent = JSON.parse(cookieConsent);
          return consent.analytics === true;
        }
        return false;
      }

      const consent = await ConsentTracking.getActiveConsent(identifier);
      return consent && consent.hasConsent('analytics');
    } catch (error) {
      console.error('Error checking analytics consent:', error);
      return false;
    }
  }

  /**
   * Check if user has consented to marketing
   */
  static async hasMarketingConsent(req) {
    try {
      const identifier = req.user?.id || req.user?.email || req.session?.id;

      if (!identifier) {
        const cookieConsent = req.cookies?.cookieConsent;
        if (cookieConsent) {
          const consent = JSON.parse(cookieConsent);
          return consent.marketing === true;
        }
        return false;
      }

      const consent = await ConsentTracking.getActiveConsent(identifier);
      return consent && consent.hasConsent('marketing');
    } catch (error) {
      console.error('Error checking marketing consent:', error);
      return false;
    }
  }

  /**
   * Track page view
   */
  static async trackPageView(req, data = {}) {
    const hasConsent = await this.hasAnalyticsConsent(req);
    if (!hasConsent) return;

    const event = {
      event: 'page_view',
      page_path: req.path,
      page_title: data.title || req.path,
      page_location: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      user_id: req.user?.id || null,
      timestamp: new Date().toISOString(),
      ...data,
    };

    this._pushToDataLayer(event);
  }

  /**
   * Track custom event
   */
  static async trackEvent(req, eventName, parameters = {}) {
    const hasConsent = await this.hasAnalyticsConsent(req);
    if (!hasConsent) return;

    const event = {
      event: eventName,
      user_id: req.user?.id || null,
      timestamp: new Date().toISOString(),
      ...parameters,
    };

    this._pushToDataLayer(event);
  }

  /**
   * Track conversion event
   */
  static async trackConversion(req, conversionType, value = 0, parameters = {}) {
    const hasConsent = await this.hasAnalyticsConsent(req);
    if (!hasConsent) return;

    const event = {
      event: 'conversion',
      conversion_type: conversionType,
      value: value,
      currency: 'RON',
      user_id: req.user?.id || null,
      timestamp: new Date().toISOString(),
      ...parameters,
    };

    this._pushToDataLayer(event);

    // Also track to Facebook Pixel if marketing consent
    const hasMarketingConsent = await this.hasMarketingConsent(req);
    if (hasMarketingConsent) {
      this._trackFacebookConversion(conversionType, value, parameters);
    }
  }

  /**
   * Track ecommerce event
   */
  static async trackEcommerce(req, action, items = [], transactionData = {}) {
    const hasConsent = await this.hasAnalyticsConsent(req);
    if (!hasConsent) return;

    const event = {
      event: `ecommerce_${action}`,
      ecommerce: {
        [action]: {
          items: items,
          ...transactionData,
        },
      },
      user_id: req.user?.id || null,
      timestamp: new Date().toISOString(),
    };

    this._pushToDataLayer(event);
  }

  /**
   * Track form submission
   */
  static async trackFormSubmission(req, formName, formData = {}) {
    const hasConsent = await this.hasAnalyticsConsent(req);
    if (!hasConsent) return;

    const event = {
      event: 'form_submit',
      form_name: formName,
      form_destination: formData.destination || req.path,
      user_id: req.user?.id || null,
      timestamp: new Date().toISOString(),
      ...formData,
    };

    this._pushToDataLayer(event);

    // Lead event for Facebook Pixel
    const hasMarketingConsent = await this.hasMarketingConsent(req);
    if (hasMarketingConsent && formName !== 'newsletter') {
      this._trackFacebookEvent('Lead', { content_name: formName });
    }
  }

  /**
   * Track user interaction
   */
  static async trackInteraction(req, elementType, elementId, action) {
    const hasConsent = await this.hasAnalyticsConsent(req);
    if (!hasConsent) return;

    const event = {
      event: 'user_interaction',
      element_type: elementType,
      element_id: elementId,
      action: action,
      page_path: req.path,
      user_id: req.user?.id || null,
      timestamp: new Date().toISOString(),
    };

    this._pushToDataLayer(event);
  }

  /**
   * Track scroll depth
   */
  static trackScrollDepth(percentage) {
    if (!this._checkClientSideConsent('analytics')) return;

    const event = {
      event: 'scroll_depth',
      scroll_percentage: percentage,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    this._pushToDataLayer(event);
  }

  /**
   * Track video engagement
   */
  static trackVideoEngagement(videoTitle, action, progress = 0) {
    if (!this._checkClientSideConsent('analytics')) return;

    const event = {
      event: 'video_engagement',
      video_title: videoTitle,
      video_action: action,
      video_progress: progress,
      timestamp: new Date().toISOString(),
    };

    this._pushToDataLayer(event);
  }

  /**
   * Track file download
   */
  static trackFileDownload(fileName, fileType, fileUrl) {
    if (!this._checkClientSideConsent('analytics')) return;

    const event = {
      event: 'file_download',
      file_name: fileName,
      file_type: fileType,
      file_url: fileUrl,
      timestamp: new Date().toISOString(),
    };

    this._pushToDataLayer(event);
  }

  /**
   * Track outbound link click
   */
  static trackOutboundClick(url, linkText) {
    if (!this._checkClientSideConsent('analytics')) return;

    const event = {
      event: 'outbound_click',
      link_url: url,
      link_text: linkText,
      timestamp: new Date().toISOString(),
    };

    this._pushToDataLayer(event);
  }

  /**
   * Track error
   */
  static trackError(errorType, errorMessage, errorDetails = {}) {
    const event = {
      event: 'error',
      error_type: errorType,
      error_message: errorMessage,
      ...errorDetails,
      timestamp: new Date().toISOString(),
    };

    this._pushToDataLayer(event);
  }

  /**
   * Track time on page (client-side)
   */
  static trackTimeOnPage() {
    if (!this._checkClientSideConsent('analytics')) return;

    const startTime = Date.now();

    // Track on page unload
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);

      if (timeOnPage > 5) { // Only track if more than 5 seconds
        const event = {
          event: 'time_on_page',
          page_path: window.location.pathname,
          time_seconds: timeOnPage,
          timestamp: new Date().toISOString(),
        };

        this._pushToDataLayer(event);
      }
    });
  }

  /**
   * Push event to data layer (for GTM)
   */
  static _pushToDataLayer(event) {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push(event);
    } else {
      // Server-side: store in request for later processing
      console.log('Analytics Event:', event);
    }
  }

  /**
   * Check consent on client side
   */
  static _checkClientSideConsent(category) {
    if (typeof window === 'undefined') return false;

    try {
      const consentCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('cookieConsent='));

      if (!consentCookie) return false;

      const consent = JSON.parse(decodeURIComponent(consentCookie.split('=')[1]));
      return consent[category] === true;
    } catch (error) {
      console.error('Error checking client-side consent:', error);
      return false;
    }
  }

  /**
   * Track Facebook Pixel event (client-side)
   */
  static _trackFacebookEvent(eventName, parameters = {}) {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, parameters);
    }
  }

  /**
   * Track Facebook conversion (server-side)
   */
  static async _trackFacebookConversion(conversionType, value, parameters) {
    // Facebook Conversions API implementation
    // Requires access token and pixel ID
    if (!process.env.FB_PIXEL_ID || !process.env.FB_CONVERSION_API_TOKEN) {
      return;
    }

    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.FB_PIXEL_ID}/events`,
        {
          data: [{
            event_name: this._mapConversionToFBEvent(conversionType),
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: parameters.page_url,
            user_data: {
              client_ip_address: parameters.ip,
              client_user_agent: parameters.user_agent,
            },
            custom_data: {
              value: value,
              currency: 'RON',
            },
          }],
        },
        {
          params: {
            access_token: process.env.FB_CONVERSION_API_TOKEN,
          },
        }
      );
    } catch (error) {
      console.error('Error tracking Facebook conversion:', error);
    }
  }

  /**
   * Map internal conversion types to Facebook events
   */
  static _mapConversionToFBEvent(conversionType) {
    const mapping = {
      'appointment_completed': 'Lead',
      'newsletter_signup': 'CompleteRegistration',
      'contact_form_submit': 'Lead',
      'booking_completed': 'Purchase',
      'service_viewed': 'ViewContent',
    };

    return mapping[conversionType] || 'CustomEvent';
  }

  /**
   * Send event to Google Analytics 4 Measurement Protocol (server-side)
   */
  static async sendToGA4(clientId, events) {
    if (!process.env.GA4_MEASUREMENT_ID || !process.env.GA4_API_SECRET) {
      return;
    }

    try {
      await axios.post(
        `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA4_MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`,
        {
          client_id: clientId,
          events: events,
        }
      );
    } catch (error) {
      console.error('Error sending to GA4:', error);
    }
  }

  /**
   * Generate client ID for GA4
   */
  static generateClientId(req) {
    // Try to get from cookie first
    const gaCookie = req.cookies?._ga;
    if (gaCookie) {
      const parts = gaCookie.split('.');
      if (parts.length >= 4) {
        return `${parts[2]}.${parts[3]}`;
      }
    }

    // Generate new one
    return `${Date.now()}.${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Client-side initialization (will be included in views)
if (typeof window !== 'undefined') {
  // Initialize data layer for GTM
  window.dataLayer = window.dataLayer || [];

  // Track time on page
  AnalyticsService.trackTimeOnPage();

  // Track scroll depth
  let scrollTracked = {
    25: false,
    50: false,
    75: false,
    100: false,
  };

  window.addEventListener('scroll', () => {
    const scrollPercentage = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );

    Object.keys(scrollTracked).forEach(threshold => {
      if (scrollPercentage >= threshold && !scrollTracked[threshold]) {
        AnalyticsService.trackScrollDepth(threshold);
        scrollTracked[threshold] = true;
      }
    });
  });

  // Track outbound links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.hostname !== window.location.hostname) {
      AnalyticsService.trackOutboundClick(link.href, link.textContent);
    }
  });

  // Track file downloads
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href) {
      const fileExtensions = /\.(pdf|doc|docx|xls|xlsx|zip|rar|jpg|jpeg|png|gif)$/i;
      if (fileExtensions.test(link.href)) {
        const fileName = link.href.split('/').pop();
        const fileType = fileName.split('.').pop();
        AnalyticsService.trackFileDownload(fileName, fileType, link.href);
      }
    }
  });
}

module.exports = AnalyticsService;
