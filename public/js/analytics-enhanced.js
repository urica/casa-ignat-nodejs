/**
 * Enhanced Analytics Tracking for Casa Ignat
 * Comprehensive event tracking for GA4, GTM, Facebook Pixel, and Microsoft Clarity
 */

(function() {
  'use strict';

  const Analytics = {
    // Configuration
    config: {
      scrollThresholds: [25, 50, 75, 100],
      timeThresholds: [10, 30, 60, 120, 300], // seconds
      videoThresholds: [25, 50, 75, 100], // percentage
      debounceDelay: 300,
    },

    // State tracking
    state: {
      scrollTracked: {},
      timeTracked: {},
      startTime: Date.now(),
      maxScroll: 0,
      interactions: 0,
    },

    /**
     * Initialize all tracking
     */
    init() {
      this.initScrollTracking();
      this.initTimeTracking();
      this.initFormTracking();
      this.initButtonTracking();
      this.initLinkTracking();
      this.initVideoTracking();
      this.initDownloadTracking();
      this.initErrorTracking();
      this.initVisibilityTracking();
      this.initEngagementTracking();

      console.log('[Analytics] Enhanced tracking initialized');
    },

    /**
     * Check if user has analytics consent
     */
    hasConsent(type = 'analytics') {
      try {
        const consentCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('cookieConsent='));

        if (!consentCookie) return false;

        const consent = JSON.parse(decodeURIComponent(consentCookie.split('=')[1]));
        return consent[type] === true;
      } catch (error) {
        console.error('[Analytics] Error checking consent:', error);
        return false;
      }
    },

    /**
     * Push event to data layer
     */
    pushEvent(event) {
      if (!this.hasConsent('analytics')) return;

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        ...event,
        timestamp: new Date().toISOString(),
        page_path: window.location.pathname,
        page_url: window.location.href,
      });
    },

    /**
     * Track Facebook Pixel event
     */
    trackFBEvent(eventName, params = {}) {
      if (!this.hasConsent('marketing')) return;

      if (typeof fbq !== 'undefined') {
        fbq('track', eventName, params);
      }
    },

    /**
     * Initialize scroll depth tracking
     */
    initScrollTracking() {
      this.config.scrollThresholds.forEach(threshold => {
        this.state.scrollTracked[threshold] = false;
      });

      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrolled = window.scrollY;
          const scrollPercent = Math.round((scrolled / scrollHeight) * 100);

          // Track max scroll
          if (scrollPercent > this.state.maxScroll) {
            this.state.maxScroll = scrollPercent;
          }

          // Track thresholds
          this.config.scrollThresholds.forEach(threshold => {
            if (scrollPercent >= threshold && !this.state.scrollTracked[threshold]) {
              this.pushEvent({
                event: 'scroll_depth',
                scroll_percentage: threshold,
                scroll_direction: scrolled > (this.state.lastScroll || 0) ? 'down' : 'up',
              });
              this.state.scrollTracked[threshold] = true;
            }
          });

          this.state.lastScroll = scrolled;
        }, this.config.debounceDelay);
      });
    },

    /**
     * Initialize time on page tracking
     */
    initTimeTracking() {
      this.config.timeThresholds.forEach(threshold => {
        this.state.timeTracked[threshold] = false;
      });

      setInterval(() => {
        const timeOnPage = Math.floor((Date.now() - this.state.startTime) / 1000);

        this.config.timeThresholds.forEach(threshold => {
          if (timeOnPage >= threshold && !this.state.timeTracked[threshold]) {
            this.pushEvent({
              event: 'time_on_page',
              time_seconds: threshold,
              engagement_score: this.calculateEngagementScore(),
            });
            this.state.timeTracked[threshold] = true;
          }
        });
      }, 1000);

      // Track on page unload
      window.addEventListener('beforeunload', () => {
        const timeOnPage = Math.floor((Date.now() - this.state.startTime) / 1000);

        if (timeOnPage >= 5) {
          this.pushEvent({
            event: 'page_exit',
            time_on_page: timeOnPage,
            max_scroll: this.state.maxScroll,
            interactions: this.state.interactions,
            engagement_score: this.calculateEngagementScore(),
          });
        }
      });
    },

    /**
     * Calculate engagement score
     */
    calculateEngagementScore() {
      const timeWeight = 0.3;
      const scrollWeight = 0.3;
      const interactionWeight = 0.4;

      const timeScore = Math.min((Date.now() - this.state.startTime) / 60000, 5) / 5 * 100;
      const scrollScore = this.state.maxScroll;
      const interactionScore = Math.min(this.state.interactions / 10, 1) * 100;

      return Math.round(
        timeWeight * timeScore +
        scrollWeight * scrollScore +
        interactionWeight * interactionScore
      );
    },

    /**
     * Initialize form tracking
     */
    initFormTracking() {
      document.addEventListener('submit', (e) => {
        const form = e.target;
        if (!form.tagName || form.tagName !== 'FORM') return;

        const formName = form.getAttribute('name') ||
                        form.getAttribute('id') ||
                        form.getAttribute('class') ||
                        'unnamed_form';

        const formData = new FormData(form);
        const fields = {};

        for (let [key, value] of formData.entries()) {
          // Don't track sensitive data
          if (!['password', 'card', 'cvv', 'ssn'].some(sensitive =>
              key.toLowerCase().includes(sensitive))) {
            fields[key] = typeof value === 'string' && value.length > 100
              ? 'long_text'
              : 'field_present';
          }
        }

        this.pushEvent({
          event: 'form_submit',
          form_name: formName,
          form_action: form.action,
          form_method: form.method,
          field_count: Object.keys(fields).length,
        });

        // Track as conversion
        if (['contact', 'appointment', 'booking', 'newsletter'].some(type =>
            formName.toLowerCase().includes(type))) {
          this.trackFBEvent('Lead', {
            content_name: formName,
            content_category: 'form_submission',
          });
        }

        this.state.interactions++;
      });

      // Track form field interactions
      document.addEventListener('focus', (e) => {
        if (e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.tagName === 'SELECT') {
          this.pushEvent({
            event: 'form_field_interaction',
            field_name: e.target.name || e.target.id,
            field_type: e.target.type,
            action: 'focus',
          });
        }
      }, true);

      // Track form abandonment
      let formInteracted = false;
      document.addEventListener('input', (e) => {
        if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') &&
            !formInteracted) {
          formInteracted = true;

          window.addEventListener('beforeunload', () => {
            const form = e.target.closest('form');
            if (form && !form.submitted) {
              this.pushEvent({
                event: 'form_abandonment',
                form_name: form.getAttribute('name') || form.getAttribute('id'),
              });
            }
          });
        }
      }, true);
    },

    /**
     * Initialize button click tracking
     */
    initButtonTracking() {
      document.addEventListener('click', (e) => {
        const button = e.target.closest('button, .btn, [role="button"]');
        if (!button) return;

        const buttonText = button.textContent.trim();
        const buttonId = button.id || button.className;

        this.pushEvent({
          event: 'button_click',
          button_text: buttonText,
          button_id: buttonId,
          button_type: button.type || 'button',
        });

        // Track CTA buttons
        if (button.classList.contains('cta') ||
            button.classList.contains('btn-primary') ||
            buttonText.toLowerCase().includes('programare') ||
            buttonText.toLowerCase().includes('rezerva')) {
          this.pushEvent({
            event: 'cta_click',
            cta_text: buttonText,
            cta_location: this.getElementLocation(button),
          });

          this.trackFBEvent('InitiateCheckout', {
            content_name: buttonText,
          });
        }

        this.state.interactions++;
      });
    },

    /**
     * Initialize link tracking
     */
    initLinkTracking() {
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href) return;

        const linkUrl = link.href;
        const linkText = link.textContent.trim();
        const isExternal = link.hostname !== window.location.hostname;

        // Track outbound links
        if (isExternal) {
          this.pushEvent({
            event: 'outbound_click',
            link_url: linkUrl,
            link_text: linkText,
            link_domain: link.hostname,
          });
        }

        // Track internal navigation
        else {
          this.pushEvent({
            event: 'internal_link_click',
            link_url: linkUrl,
            link_text: linkText,
            link_location: this.getElementLocation(link),
          });
        }

        // Track phone clicks
        if (linkUrl.startsWith('tel:')) {
          this.pushEvent({
            event: 'phone_click',
            phone_number: linkUrl.replace('tel:', ''),
          });

          this.trackFBEvent('Contact', {
            content_name: 'phone_call',
          });
        }

        // Track email clicks
        if (linkUrl.startsWith('mailto:')) {
          this.pushEvent({
            event: 'email_click',
            email_address: linkUrl.replace('mailto:', ''),
          });

          this.trackFBEvent('Contact', {
            content_name: 'email',
          });
        }

        // Track WhatsApp clicks
        if (linkUrl.includes('whatsapp') || linkUrl.includes('wa.me')) {
          this.pushEvent({
            event: 'whatsapp_click',
          });

          this.trackFBEvent('Contact', {
            content_name: 'whatsapp',
          });
        }

        // Track social media clicks
        const socialPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'];
        socialPlatforms.forEach(platform => {
          if (linkUrl.includes(platform)) {
            this.pushEvent({
              event: 'social_click',
              social_platform: platform,
            });
          }
        });

        this.state.interactions++;
      });
    },

    /**
     * Initialize video tracking
     */
    initVideoTracking() {
      const videos = document.querySelectorAll('video');

      videos.forEach(video => {
        const videoTitle = video.getAttribute('title') ||
                          video.getAttribute('data-title') ||
                          'untitled_video';

        // Track play
        video.addEventListener('play', () => {
          this.pushEvent({
            event: 'video_play',
            video_title: videoTitle,
            video_current_time: video.currentTime,
            video_duration: video.duration,
          });
        });

        // Track pause
        video.addEventListener('pause', () => {
          if (video.currentTime < video.duration) {
            this.pushEvent({
              event: 'video_pause',
              video_title: videoTitle,
              video_current_time: video.currentTime,
              video_percent: Math.round((video.currentTime / video.duration) * 100),
            });
          }
        });

        // Track completion
        video.addEventListener('ended', () => {
          this.pushEvent({
            event: 'video_complete',
            video_title: videoTitle,
            video_duration: video.duration,
          });
        });

        // Track progress milestones
        const progressTracked = {};
        this.config.videoThresholds.forEach(threshold => {
          progressTracked[threshold] = false;
        });

        video.addEventListener('timeupdate', () => {
          const percent = Math.round((video.currentTime / video.duration) * 100);

          this.config.videoThresholds.forEach(threshold => {
            if (percent >= threshold && !progressTracked[threshold]) {
              this.pushEvent({
                event: 'video_progress',
                video_title: videoTitle,
                video_percent: threshold,
              });
              progressTracked[threshold] = true;
            }
          });
        });

        this.state.interactions++;
      });

      // Track YouTube embeds
      const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com"]');
      youtubeIframes.forEach(iframe => {
        this.pushEvent({
          event: 'youtube_embed_view',
          video_url: iframe.src,
        });
      });
    },

    /**
     * Initialize download tracking
     */
    initDownloadTracking() {
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href) return;

        const fileExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz|mp3|mp4|avi|mov|jpg|jpeg|png|gif|svg)$/i;

        if (fileExtensions.test(link.href)) {
          const fileName = link.href.split('/').pop().split('?')[0];
          const fileType = fileName.split('.').pop().toLowerCase();
          const fileSize = link.getAttribute('data-size') || 'unknown';

          this.pushEvent({
            event: 'file_download',
            file_name: fileName,
            file_type: fileType,
            file_size: fileSize,
            file_url: link.href,
          });

          this.trackFBEvent('Download', {
            content_name: fileName,
            content_type: fileType,
          });

          this.state.interactions++;
        }
      });
    },

    /**
     * Initialize error tracking
     */
    initErrorTracking() {
      // JavaScript errors
      window.addEventListener('error', (e) => {
        this.pushEvent({
          event: 'javascript_error',
          error_message: e.message,
          error_file: e.filename,
          error_line: e.lineno,
          error_column: e.colno,
        });
      });

      // Promise rejections
      window.addEventListener('unhandledrejection', (e) => {
        this.pushEvent({
          event: 'promise_rejection',
          error_message: e.reason?.message || e.reason,
        });
      });

      // Resource loading errors
      window.addEventListener('error', (e) => {
        if (e.target !== window) {
          this.pushEvent({
            event: 'resource_error',
            resource_type: e.target.tagName,
            resource_url: e.target.src || e.target.href,
          });
        }
      }, true);
    },

    /**
     * Initialize visibility tracking
     */
    initVisibilityTracking() {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pushEvent({
            event: 'page_hidden',
            time_visible: Math.floor((Date.now() - this.state.startTime) / 1000),
          });
        } else {
          this.pushEvent({
            event: 'page_visible',
          });
          this.state.startTime = Date.now(); // Reset start time
        }
      });
    },

    /**
     * Initialize engagement tracking
     */
    initEngagementTracking() {
      // Track mouse movement (throttled)
      let lastMouseMove = 0;
      document.addEventListener('mousemove', () => {
        const now = Date.now();
        if (now - lastMouseMove > 5000) { // Every 5 seconds
          this.state.interactions++;
          lastMouseMove = now;
        }
      });

      // Track copy events
      document.addEventListener('copy', () => {
        const selection = window.getSelection().toString();
        if (selection.length > 10) {
          this.pushEvent({
            event: 'content_copy',
            text_length: selection.length,
          });
          this.state.interactions++;
        }
      });

      // Track print
      window.addEventListener('beforeprint', () => {
        this.pushEvent({
          event: 'page_print',
        });
      });

      // Track search
      const searchInputs = document.querySelectorAll('input[type="search"], input[name*="search"], input[id*="search"]');
      searchInputs.forEach(input => {
        input.addEventListener('input', this.debounce(() => {
          if (input.value.length >= 3) {
            this.pushEvent({
              event: 'search',
              search_term: input.value,
              search_results: document.querySelectorAll('.search-result').length || null,
            });
          }
        }, 1000));
      });
    },

    /**
     * Get element location on page
     */
    getElementLocation(element) {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      return {
        top: Math.round(rect.top + scrollTop),
        left: Math.round(rect.left + scrollLeft),
        viewport_position: rect.top < window.innerHeight ? 'visible' : 'below_fold',
      };
    },

    /**
     * Debounce helper
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Track custom conversion
     */
    trackConversion(conversionType, value = 0, params = {}) {
      this.pushEvent({
        event: 'conversion',
        conversion_type: conversionType,
        value: value,
        currency: 'RON',
        ...params,
      });

      // Map to Facebook events
      const fbEventMap = {
        'appointment_completed': 'Lead',
        'booking_completed': 'Purchase',
        'newsletter_signup': 'CompleteRegistration',
        'contact_form': 'Contact',
        'service_view': 'ViewContent',
      };

      if (fbEventMap[conversionType]) {
        this.trackFBEvent(fbEventMap[conversionType], {
          value: value,
          currency: 'RON',
          ...params,
        });
      }
    },

    /**
     * Track ecommerce event
     */
    trackEcommerce(action, items = [], transactionData = {}) {
      this.pushEvent({
        event: `ecommerce_${action}`,
        ecommerce: {
          [action]: {
            items: items,
            ...transactionData,
          },
        },
      });

      // Track to Facebook
      if (action === 'purchase') {
        this.trackFBEvent('Purchase', {
          value: transactionData.value,
          currency: transactionData.currency || 'RON',
          content_ids: items.map(item => item.item_id),
          content_type: 'product',
          num_items: items.length,
        });
      } else if (action === 'view_item') {
        this.trackFBEvent('ViewContent', {
          content_ids: items.map(item => item.item_id),
          content_type: 'product',
        });
      } else if (action === 'add_to_cart') {
        this.trackFBEvent('AddToCart', {
          content_ids: items.map(item => item.item_id),
          content_type: 'product',
          value: items.reduce((sum, item) => sum + (item.price || 0), 0),
          currency: 'RON',
        });
      }
    },
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init());
  } else {
    Analytics.init();
  }

  // Expose to window for manual tracking
  window.CasaIgnatAnalytics = Analytics;

})();
