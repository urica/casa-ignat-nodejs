# Analytics Setup Guide - Casa Ignat

## Overview

Complete analytics implementation for Casa Ignat with Google Analytics 4, Google Tag Manager, Facebook Pixel, Microsoft Clarity, and custom tracking.

**Last Updated:** 2024-01-18
**Version:** 1.0
**Status:** ✅ Complete

---

## 📊 Analytics Platforms Implemented

### 1. Google Analytics 4 (GA4)
- **Purpose:** Website analytics, user behavior tracking
- **Features:**
  - Page views
  - Custom events
  - Ecommerce tracking
  - User demographics
  - Conversion tracking
  - Enhanced measurement

### 2. Google Tag Manager (GTM)
- **Purpose:** Centralized tag management
- **Features:**
  - Easy tag deployment
  - Event triggers
  - Custom variables
  - Preview mode
  - Version control

### 3. Facebook Pixel
- **Purpose:** Social media advertising and retargeting
- **Features:**
  - Page views
  - Conversions
  - Custom events
  - Conversion API (server-side)
  - Consent mode support

### 4. Microsoft Clarity
- **Purpose:** User behavior analysis
- **Features:**
  - Heatmaps
  - Session recordings
  - Frustration signals
  - JavaScript error tracking
  - User identification

### 5. Google Optimize
- **Purpose:** A/B testing
- **Features:**
  - Multiple test variations
  - Visual editor
  - Targeting rules
  - Integration with GA4

---

## 🚀 Quick Start

### Step 1: Configure Environment Variables

Update `.env` with your tracking IDs:

```bash
# Google Analytics 4
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your_api_secret_here
GA_ANONYMIZE_IP=true

# Google Tag Manager
GTM_CONTAINER_ID=GTM-XXXXXXX

# Facebook Pixel
FB_PIXEL_ID=123456789012345
FB_CONVERSION_API_TOKEN=your_conversion_api_token_here

# Microsoft Clarity
CLARITY_PROJECT_ID=abcdefghij

# Google Optimize (A/B Testing)
GOOGLE_OPTIMIZE_ID=OPT-XXXXXXX
```

### Step 2: Update Main Layout

Add analytics scripts to your header (`views/partials/header.ejs`):

```ejs
<head>
  <!-- ... other head content ... -->

  <%# Google Optimize (must be before GTM/GA4) %>
  <%- include('analytics/google-optimize') %>

  <%# Google Tag Manager - Head %>
  <%- include('analytics/gtm-head') %>

  <%# Google Analytics 4 (if not using GTM) %>
  <%- include('analytics/ga4') %>
</head>
```

Add to body start (`views/partials/header.ejs` after `<body>`):

```ejs
<body>
  <%# Google Tag Manager - Body %>
  <%- include('analytics/gtm-body') %>

  <!-- ... rest of body ... -->
```

Add to footer (`views/partials/footer.ejs`):

```ejs
  <%# Facebook Pixel %>
  <%- include('analytics/facebook-pixel') %>

  <%# Microsoft Clarity %>
  <%- include('analytics/clarity') %>

  <%# Custom Event Tracking %>
  <script src="/js/analytics-tracking.js"></script>

</body>
```

### Step 3: Enable Analytics Middleware

Update `src/app.js`:

```javascript
const analyticsMiddleware = require('./middleware/analytics');

// Add after other middleware
app.use(analyticsMiddleware.injectAnalytics);
app.use(analyticsMiddleware.trackPageView);
```

### Step 4: Add Analytics Routes

Update `src/app.js`:

```javascript
const analyticsRoutes = require('./routes/analytics');

// Add analytics routes
app.use('/admin/analytics', analyticsRoutes);
```

---

## 📈 Tracked Events

### Automatic Events

These events are tracked automatically without additional code:

| Event | Trigger | Platforms |
|-------|---------|-----------|
| **page_view** | Every page load | GA4, GTM, FB Pixel |
| **scroll_depth** | 25%, 50%, 75%, 100% scroll | GA4, GTM |
| **time_on_page** | Page unload (if >5 sec) | GA4, GTM |
| **outbound_click** | External link click | GA4, GTM |
| **file_download** | PDF, DOC, ZIP, etc. download | GA4, GTM |
| **phone_click** | tel: link click | GA4, GTM, FB Pixel |
| **email_click** | mailto: link click | GA4, GTM, FB Pixel |
| **whatsapp_click** | WhatsApp link click | GA4, GTM, FB Pixel |
| **button_click** | Any button click | GA4, GTM |
| **javascript_error** | JS errors | GA4, GTM, Clarity |

### Form Events

| Event | Description | Platforms |
|-------|-------------|-----------|
| **form_submit** | Any form submission | GA4, GTM |
| **newsletter_signup** | Newsletter form | GA4, GTM, FB Pixel (CompleteRegistration) |
| **contact_form_submit** | Contact form | GA4, GTM, FB Pixel (Lead) |
| **booking_form_submit** | Booking form | GA4, GTM, FB Pixel (Lead) |
| **appointment_form_submit** | Appointment form | GA4, GTM, FB Pixel (Lead) |

### Ecommerce Events

| Event | Description | Platforms |
|-------|-------------|-----------|
| **view_item** | Service page view | GA4, GTM, FB Pixel (ViewContent) |
| **add_to_cart** | Add to cart (future) | GA4, GTM, FB Pixel |
| **begin_checkout** | Start checkout process | GA4, GTM, FB Pixel |
| **purchase** | Complete booking | GA4, GTM, FB Pixel (Purchase) |

### Custom Events

| Event | Description | Platforms |
|-------|-------------|-----------|
| **video_engagement** | Video play/pause/complete | GA4, GTM |
| **site_search** | Search query | GA4, GTM |
| **cta_click** | CTA button click | GA4, GTM |
| **page_return** | User returns to tab | GA4, GTM |

---

## 🎯 Conversion Tracking

### Predefined Conversions

The following conversions are automatically tracked:

```javascript
// Appointment completed
AnalyticsService.trackConversion(req, 'appointment_completed', servicePrice);

// Newsletter signup
AnalyticsService.trackConversion(req, 'newsletter_signup', 0);

// Contact form submit
AnalyticsService.trackConversion(req, 'contact_form_submit', 0);

// Booking completed
AnalyticsService.trackConversion(req, 'booking_completed', totalAmount);
```

### Adding Custom Conversions

Use the middleware in your routes:

```javascript
const { trackConversion } = require('../middleware/analytics');

router.post('/custom-action',
  trackConversion('custom_conversion', (req, data) => {
    return data.amount; // Return conversion value
  }),
  yourController.action
);
```

Or manually in controller:

```javascript
const AnalyticsService = require('../services/analyticsService');

await AnalyticsService.trackConversion(req, 'conversion_type', value, {
  page_url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
  ip: req.ip,
  user_agent: req.get('user-agent'),
});
```

---

## 🛍️ Ecommerce Tracking

### Track Service Views

Add data attributes to service pages:

```html
<div data-service-id="<%= service.id %>"
     data-service-name="<%= service.name %>"
     data-service-price="<%= service.price %>"
     data-service-category="<%= service.category %>">
  <!-- Service content -->
</div>
```

The script will automatically track `view_item` event.

### Track Purchase

```javascript
await AnalyticsService.trackEcommerce(req, 'purchase',
  [
    {
      item_id: service.id,
      item_name: service.name,
      price: service.price,
      quantity: 1,
    }
  ],
  {
    transaction_id: booking.id,
    value: totalAmount,
    currency: 'RON',
    tax: 0,
  }
);
```

---

## 📱 Tracking Specific Interactions

### Phone Clicks

```html
<a href="tel:+40123456789">Call Us</a>
```

Automatically tracked as `phone_click` event.

### Email Clicks

```html
<a href="mailto:contact@casaignat.ro">Email Us</a>
```

Automatically tracked as `email_click` event.

### Video Engagement

```html
<video title="Casa Ignat Tour" src="/videos/tour.mp4" controls></video>
```

Automatically tracks:
- `video_play`
- `video_pause`
- `video_progress_25/50/75`
- `video_complete`

### File Downloads

Any link to PDF, DOC, ZIP, etc. is automatically tracked.

---

## 🎨 A/B Testing with Google Optimize

### Create Test

1. Go to Google Optimize
2. Create new experience
3. Set targeting rules
4. Create variations
5. Set objectives (from GA4 events)

### Implement Test

No code changes needed! Google Optimize automatically modifies the page.

### Track Test in Code

```javascript
// Get active experiment
if (window.google_optimize) {
  const experimentId = 'YOUR_EXPERIMENT_ID';
  const variant = window.google_optimize.get(experimentId);

  // Track variant view
  AnalyticsService.trackEvent(req, 'experiment_view', {
    experiment_id: experimentId,
    variant_id: variant,
  });
}
```

---

## 📊 Custom Analytics Dashboard

### Access Dashboard

Navigate to: `/admin/analytics/dashboard`

**Requirements:**
- Authentication required
- `settings` permission required

### Dashboard Features

#### Real-Time Visitors
```
GET /admin/analytics/realtime
```

Returns:
- Active visitor count (last 5 minutes)
- Current pages being viewed

#### Traffic Sources
```
GET /admin/analytics/traffic-sources?startDate=2024-01-01&endDate=2024-01-31
```

Returns breakdown by:
- Direct traffic
- Google
- Facebook
- Instagram
- Other sources

#### Conversion Report
```
GET /admin/analytics/conversions?startDate=2024-01-01&endDate=2024-01-31
```

Returns:
- Conversion counts by type
- Total conversion value
- Daily conversion trends

#### Top Pages
Displays most viewed pages with:
- Total views
- Unique visitors
- Bounce rate (future)

#### Device Breakdown
Shows traffic by device type:
- Desktop
- Mobile
- Tablet

---

## 🔌 API Endpoints

### Track Custom Event

```javascript
POST /admin/analytics/track

Body:
{
  "eventName": "custom_event",
  "eventCategory": "custom",
  "properties": {
    "key": "value"
  },
  "isConversion": false,
  "conversionValue": 0
}
```

### Export Analytics Data

```
GET /admin/analytics/export?startDate=2024-01-01&endDate=2024-01-31&format=csv

Formats: json, csv
```

---

## 🔒 GDPR Compliance

### Consent Management

Analytics respect GDPR consent preferences:

- **Analytics Consent**: Required for GA4, GTM, Clarity
- **Marketing Consent**: Required for Facebook Pixel

### Consent Mode

All platforms support consent mode:

```javascript
// Consent granted
gtag('consent', 'update', {
  'analytics_storage': 'granted',
  'ad_storage': 'granted'
});

// Consent denied
gtag('consent', 'update', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied'
});
```

### IP Anonymization

GA4 automatically anonymizes IP addresses when `GA_ANONYMIZE_IP=true`.

---

## 🎯 Google Tag Manager Setup

### Container Configuration

1. **Create Container**
   - Go to tagmanager.google.com
   - Create new container for Casa Ignat
   - Type: Web
   - Get Container ID (GTM-XXXXXXX)

2. **Import Configuration** (Optional)
   - Use provided GTM container export
   - File: `config/gtm-container-export.json`
   - Import via Admin → Import Container

### Tags to Configure

#### 1. Google Analytics 4 Configuration Tag
- **Type:** Google Analytics: GA4 Configuration
- **Measurement ID:** {{ GA4 Measurement ID }}
- **Trigger:** All Pages

#### 2. Facebook Pixel Base Code
- **Type:** Custom HTML
- **HTML:** Facebook Pixel initialization
- **Trigger:** All Pages (with marketing consent)

#### 3. Event Tags

Create tags for each custom event:

| Tag Name | Type | Event Name | Trigger |
|----------|------|------------|---------|
| GA4 - Form Submit | GA4 Event | form_submit | Custom Event: form_submit |
| GA4 - Conversion | GA4 Event | conversion | Custom Event: conversion |
| GA4 - CTA Click | GA4 Event | cta_click | Custom Event: cta_click |
| FB - Lead | Facebook Pixel | Lead | Custom Event: form_submit (contact/booking) |
| FB - Purchase | Facebook Pixel | Purchase | Custom Event: purchase |

### Triggers

| Trigger Name | Type | Condition |
|--------------|------|-----------|
| All Pages | Page View | - |
| Form Submit | Custom Event | Event equals form_submit |
| Conversion | Custom Event | Event equals conversion |
| CTA Click | Custom Event | Event equals cta_click |
| Marketing Consent | Custom Event | {{consentMarketing}} equals true |

### Variables

| Variable Name | Type | Value |
|---------------|------|-------|
| GA4 Measurement ID | Constant | G-XXXXXXXXXX |
| FB Pixel ID | Constant | 123456789012345 |
| User ID | Data Layer Variable | user_id |
| Consent Analytics | Data Layer Variable | consent.analytics_storage |
| Consent Marketing | Data Layer Variable | consent.ad_storage |

---

## 📈 Facebook Conversions API

### Server-Side Tracking

Benefits:
- More accurate tracking (bypasses ad blockers)
- Better data quality
- Privacy compliant

### Setup

1. Get Conversion API Access Token:
   - Go to Events Manager
   - Choose your Pixel
   - Settings → Conversions API → Generate Access Token

2. Add to `.env`:
   ```bash
   FB_CONVERSION_API_TOKEN=your_token_here
   ```

3. Events are automatically sent server-side for:
   - Conversions
   - Leads
   - Purchases

---

## 📊 Microsoft Clarity Setup

### Features

1. **Heatmaps**
   - Click heatmaps
   - Scroll heatmaps
   - Area heatmaps

2. **Session Recordings**
   - Full session replay
   - User journey visualization
   - Rage clicks detection

3. **Insights**
   - JavaScript errors
   - Dead clicks
   - Quick backs
   - Excessive scrolling

### Setup

1. Create project at clarity.microsoft.com
2. Get Project ID
3. Add to `.env`:
   ```bash
   CLARITY_PROJECT_ID=abcdefghij
   ```

4. User identification automatically set if logged in

---

## 🧪 Testing Analytics

### 1. Test in Preview Mode

**Google Tag Manager:**
```
1. Open GTM
2. Click "Preview"
3. Enter your website URL
4. Test events in Tag Assistant
```

**Google Analytics 4:**
```
1. Go to GA4
2. Click "DebugView"
3. Enable debug mode: ?debug_mode=true
4. See events in real-time
```

### 2. Test with Browser Console

```javascript
// Check if dataLayer exists
console.log(window.dataLayer);

// Manually push test event
dataLayer.push({
  event: 'test_event',
  test_property: 'test_value'
});

// Check Facebook Pixel
console.log(window.fbq);

// Test Facebook event
fbq('track', 'Test');
```

### 3. Test Consent Management

```javascript
// Check current consent
document.cookie.split(';')
  .find(c => c.includes('cookieConsent'));

// Update consent
fetch('/privacy/consent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    analytics: true,
    marketing: true
  })
});
```

---

## 📧 Weekly Email Reports

### Setup Automated Reports (Future Enhancement)

Create cron job to send weekly analytics summary:

```javascript
// scripts/sendWeeklyReport.js
const AnalyticsEvent = require('../src/models/AnalyticsEvent');
const emailService = require('../src/services/emailService');

async function sendWeeklyReport() {
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const stats = await AnalyticsEvent.getEventStats(lastWeek, now);

  await emailService.sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: 'Casa Ignat - Raport Săptămânal Analytics',
    template: 'weekly-analytics-report',
    context: { stats },
  });
}

module.exports = sendWeeklyReport;
```

Add to crontab:
```bash
0 9 * * 1 cd /path/to/casa-ignat-nodejs && node scripts/sendWeeklyReport.js
```

---

## 🐛 Troubleshooting

### Analytics Not Tracking

**Check:**
1. ✅ Consent granted? (Check cookie: `cookieConsent`)
2. ✅ Tracking IDs correct? (Check `.env`)
3. ✅ Scripts loaded? (Check browser console)
4. ✅ No ad blockers? (Test in incognito)
5. ✅ dataLayer initialized? (`console.log(window.dataLayer)`)

### GTM Not Working

**Check:**
1. ✅ Container ID correct?
2. ✅ Container published? (Not in draft)
3. ✅ Triggers firing? (Test in Preview mode)
4. ✅ Tags configured? (Check Tag Assistant)

### Facebook Pixel Not Tracking

**Check:**
1. ✅ Marketing consent granted?
2. ✅ Pixel ID correct?
3. ✅ Script loaded? (`console.log(window.fbq)`)
4. ✅ Test with Facebook Pixel Helper extension

### Clarity Not Recording

**Check:**
1. ✅ Project ID correct?
2. ✅ Analytics consent granted?
3. ✅ Wait 2-3 minutes (recordings process delay)
4. ✅ Check Clarity dashboard for sessions

---

## 📚 Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Google Tag Manager Guide](https://support.google.com/tagmanager/answer/6102821)
- [Facebook Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)
- [Facebook Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Microsoft Clarity Documentation](https://docs.microsoft.com/en-us/clarity/)
- [Google Optimize Guide](https://support.google.com/optimize)

---

## 📞 Support

**Technical Issues:**
- Check browser console for errors
- Review network tab for failed requests
- Test in incognito mode

**Configuration Help:**
- Review this documentation
- Check `.env.example` for required variables
- Verify tracking IDs in platform dashboards

**Data Questions:**
- Access analytics dashboard: `/admin/analytics/dashboard`
- Export data for analysis
- Contact analytics team

---

**Document Owner:** Development Team
**Last Updated:** 2024-01-18
**Version:** 1.0
**Status:** Production Ready
