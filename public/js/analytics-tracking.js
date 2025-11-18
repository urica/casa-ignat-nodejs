/**
 * Casa Ignat - Custom Analytics Tracking
 * Client-side event tracking for GA4, GTM, Facebook Pixel
 */

(function() {
  'use strict';

  // Check consent before tracking
  function hasConsent(category) {
    try {
      const consentCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('cookieConsent='));

      if (!consentCookie) return false;

      const consent = JSON.parse(decodeURIComponent(consentCookie.split('=')[1]));
      return consent[category] === true;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  // Push to data layer
  function pushToDataLayer(event) {
    if (hasConsent('analytics') && window.dataLayer) {
      window.dataLayer.push(event);
    }
  }

  // Track Facebook Pixel event
  function trackFacebookEvent(eventName, parameters) {
    if (hasConsent('marketing') && window.fbq) {
      window.fbq('track', eventName, parameters);
    }
  }

  // ========================================
  // SCROLL DEPTH TRACKING
  // ========================================
  const scrollTracked = {
    25: false,
    50: false,
    75: false,
    100: false,
  };

  function trackScrollDepth() {
    const scrollPercentage = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );

    Object.keys(scrollTracked).forEach(threshold => {
      if (scrollPercentage >= parseInt(threshold) && !scrollTracked[threshold]) {
        pushToDataLayer({
          event: 'scroll_depth',
          scroll_percentage: parseInt(threshold),
          page_path: window.location.pathname,
        });
        scrollTracked[threshold] = true;
      }
    });
  }

  let scrollThrottle;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollThrottle);
    scrollThrottle = setTimeout(trackScrollDepth, 300);
  });

  // ========================================
  // TIME ON PAGE TRACKING
  // ========================================
  const pageStartTime = Date.now();

  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);

    if (timeOnPage > 5 && hasConsent('analytics')) {
      pushToDataLayer({
        event: 'time_on_page',
        page_path: window.location.pathname,
        time_seconds: timeOnPage,
        time_category: timeOnPage < 30 ? 'Quick Visit' :
                       timeOnPage < 60 ? 'Brief Visit' :
                       timeOnPage < 180 ? 'Medium Visit' :
                       'Extended Visit',
      });
    }
  });

  // ========================================
  // FORM TRACKING
  // ========================================
  function trackFormSubmit(form) {
    const formName = form.getAttribute('name') ||
                     form.getAttribute('id') ||
                     form.getAttribute('class') ||
                     'unnamed_form';

    const formData = {
      event: 'form_submit',
      form_name: formName,
      form_destination: form.action || window.location.pathname,
      form_method: form.method || 'GET',
    };

    pushToDataLayer(formData);

    // Track as Lead for Facebook if it's a contact/booking form
    if (formName.includes('contact') || formName.includes('booking') || formName.includes('appointment')) {
      trackFacebookEvent('Lead', {
        content_name: formName,
        content_category: 'Form Submission',
      });
    }
  }

  document.addEventListener('submit', (e) => {
    if (e.target.tagName === 'FORM') {
      trackFormSubmit(e.target);
    }
  });

  // ========================================
  // BUTTON CLICK TRACKING
  // ========================================
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button, .btn, [role="button"]');

    if (button) {
      const buttonText = button.textContent.trim();
      const buttonId = button.id;
      const buttonClass = button.className;

      pushToDataLayer({
        event: 'button_click',
        button_text: buttonText,
        button_id: buttonId,
        button_class: buttonClass,
        page_path: window.location.pathname,
      });

      // Track CTA clicks specially
      if (buttonText.toLowerCase().includes('rezerv') ||
          buttonText.toLowerCase().includes('contact') ||
          buttonText.toLowerCase().includes('program')) {
        pushToDataLayer({
          event: 'cta_click',
          cta_text: buttonText,
          cta_location: window.location.pathname,
        });
      }
    }
  });

  // ========================================
  // PHONE/EMAIL/WHATSAPP CLICK TRACKING
  // ========================================
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');

    if (link && link.href) {
      // Phone clicks
      if (link.href.startsWith('tel:')) {
        pushToDataLayer({
          event: 'phone_click',
          phone_number: link.href.replace('tel:', ''),
          page_path: window.location.pathname,
        });

        trackFacebookEvent('Contact', {
          content_name: 'Phone Click',
        });
      }

      // Email clicks
      if (link.href.startsWith('mailto:')) {
        pushToDataLayer({
          event: 'email_click',
          email_address: link.href.replace('mailto:', ''),
          page_path: window.location.pathname,
        });

        trackFacebookEvent('Contact', {
          content_name: 'Email Click',
        });
      }

      // WhatsApp clicks
      if (link.href.includes('wa.me') || link.href.includes('whatsapp')) {
        pushToDataLayer({
          event: 'whatsapp_click',
          page_path: window.location.pathname,
        });

        trackFacebookEvent('Contact', {
          content_name: 'WhatsApp Click',
        });
      }
    }
  });

  // ========================================
  // OUTBOUND LINK TRACKING
  // ========================================
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');

    if (link && link.href && link.hostname !== window.location.hostname) {
      pushToDataLayer({
        event: 'outbound_click',
        link_url: link.href,
        link_text: link.textContent.trim(),
        link_domain: link.hostname,
        page_path: window.location.pathname,
      });
    }
  });

  // ========================================
  // FILE DOWNLOAD TRACKING
  // ========================================
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');

    if (link && link.href) {
      const fileExtensions = /\.(pdf|doc|docx|xls|xlsx|zip|rar|jpg|jpeg|png|gif|mp4|mp3)$/i;

      if (fileExtensions.test(link.href)) {
        const fileName = link.href.split('/').pop();
        const fileType = fileName.split('.').pop().toUpperCase();

        pushToDataLayer({
          event: 'file_download',
          file_name: fileName,
          file_type: fileType,
          file_url: link.href,
          page_path: window.location.pathname,
        });
      }
    }
  });

  // ========================================
  // VIDEO ENGAGEMENT TRACKING
  // ========================================
  function trackVideoEvent(video, action, progress) {
    const videoTitle = video.getAttribute('title') ||
                       video.getAttribute('data-title') ||
                       video.currentSrc.split('/').pop();

    pushToDataLayer({
      event: 'video_engagement',
      video_title: videoTitle,
      video_action: action,
      video_progress: progress,
      video_duration: Math.round(video.duration),
      page_path: window.location.pathname,
    });
  }

  document.querySelectorAll('video').forEach(video => {
    let trackedProgress = {
      25: false,
      50: false,
      75: false,
      100: false,
    };

    video.addEventListener('play', () => {
      trackVideoEvent(video, 'play', 0);
    });

    video.addEventListener('pause', () => {
      const progress = Math.round((video.currentTime / video.duration) * 100);
      trackVideoEvent(video, 'pause', progress);
    });

    video.addEventListener('ended', () => {
      trackVideoEvent(video, 'complete', 100);
    });

    video.addEventListener('timeupdate', () => {
      const progress = Math.round((video.currentTime / video.duration) * 100);

      Object.keys(trackedProgress).forEach(threshold => {
        if (progress >= parseInt(threshold) && !trackedProgress[threshold]) {
          trackVideoEvent(video, `progress_${threshold}`, parseInt(threshold));
          trackedProgress[threshold] = true;
        }
      });
    });
  });

  // ========================================
  // SEARCH TRACKING
  // ========================================
  const searchForms = document.querySelectorAll('form[role="search"], .search-form');

  searchForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const searchInput = form.querySelector('input[type="search"], input[name*="search"], input[name*="query"]');

      if (searchInput) {
        pushToDataLayer({
          event: 'site_search',
          search_term: searchInput.value,
          page_path: window.location.pathname,
        });
      }
    });
  });

  // ========================================
  // ERROR TRACKING
  // ========================================
  window.addEventListener('error', (e) => {
    pushToDataLayer({
      event: 'javascript_error',
      error_message: e.message,
      error_filename: e.filename,
      error_lineno: e.lineno,
      error_colno: e.colno,
      page_path: window.location.pathname,
    });
  });

  // ========================================
  // ECOMMERCE TRACKING (Service Views)
  // ========================================
  function trackServiceView() {
    const serviceElement = document.querySelector('[data-service-id]');

    if (serviceElement) {
      const serviceId = serviceElement.getAttribute('data-service-id');
      const serviceName = serviceElement.getAttribute('data-service-name');
      const servicePrice = serviceElement.getAttribute('data-service-price');
      const serviceCategory = serviceElement.getAttribute('data-service-category');

      pushToDataLayer({
        event: 'view_item',
        ecommerce: {
          items: [{
            item_id: serviceId,
            item_name: serviceName,
            item_category: serviceCategory,
            price: parseFloat(servicePrice) || 0,
            currency: 'RON',
          }],
        },
      });

      // Facebook Pixel
      trackFacebookEvent('ViewContent', {
        content_name: serviceName,
        content_category: serviceCategory,
        content_ids: [serviceId],
        content_type: 'product',
        value: parseFloat(servicePrice) || 0,
        currency: 'RON',
      });
    }
  }

  // Track service view on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackServiceView);
  } else {
    trackServiceView();
  }

  // ========================================
  // NEWSLETTER SIGNUP TRACKING
  // ========================================
  const newsletterForms = document.querySelectorAll('.newsletter-form, form[name*="newsletter"]');

  newsletterForms.forEach(form => {
    form.addEventListener('submit', () => {
      pushToDataLayer({
        event: 'newsletter_signup',
        page_path: window.location.pathname,
      });

      trackFacebookEvent('CompleteRegistration', {
        content_name: 'Newsletter Signup',
      });
    });
  });

  // ========================================
  // PAGE VISIBILITY TRACKING
  // ========================================
  let hiddenTime = null;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenTime = Date.now();
    } else if (hiddenTime) {
      const timeHidden = Date.now() - hiddenTime;

      if (timeHidden > 5000) { // More than 5 seconds
        pushToDataLayer({
          event: 'page_return',
          time_hidden: Math.round(timeHidden / 1000),
          page_path: window.location.pathname,
        });
      }

      hiddenTime = null;
    }
  });

  // ========================================
  // INITIALIZE
  // ========================================
  console.log('Casa Ignat Analytics Tracking Initialized');

  // Track initial page load
  pushToDataLayer({
    event: 'page_loaded',
    page_path: window.location.pathname,
    page_title: document.title,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
  });
})();
