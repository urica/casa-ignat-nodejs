# Casa Ignat - Responsive Design Documentation

## 📱 Prezentare Generală

Implementare completă a responsive design-ului pentru Casa Ignat cu **mobile-first approach**, optimizări de performance și suport pentru toate dispozitivele.

## 🎯 Breakpoints

```css
/* Mobile First Breakpoints */
--mobile: 320px      /* Telefoane mici */
--tablet: 640px      /* Telefoane mari și tablete portrait */
--desktop: 1024px    /* Tablete landscape și desktop-uri mici */
--large: 1280px      /* Desktop-uri mari */
```

### Strategia Mobile-First

Toate stilurile sunt scrise pentru mobile mai întâi, apoi se adaugă funcționalități pentru dispozitive mai mari:

```css
/* Base styles (mobile) */
.element {
    font-size: 1rem;
    padding: 1rem;
}

/* Tablet */
@media (min-width: 640px) {
    .element {
        font-size: 1.125rem;
        padding: 1.5rem;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .element {
        font-size: 1.25rem;
        padding: 2rem;
    }
}
```

## ✍️ Typography - Fluid & Responsive

### Fluid Typography cu clamp()

Typography-ul se scalează automat între dimensiunile minime și maxime:

```css
/* Font Sizes - Se adapteaza automat la viewport */
--font-size-xs: clamp(0.75rem, 0.7rem + 0.22vw, 0.875rem);
--font-size-sm: clamp(0.875rem, 0.82rem + 0.28vw, 1rem);
--font-size-base: clamp(1rem, 0.96rem + 0.22vw, 1.125rem);
--font-size-lg: clamp(1.125rem, 1.06rem + 0.33vw, 1.313rem);
--font-size-xl: clamp(1.25rem, 1.15rem + 0.54vw, 1.563rem);
--font-size-2xl: clamp(1.5rem, 1.33rem + 0.87vw, 2rem);
--font-size-3xl: clamp(1.875rem, 1.59rem + 1.41vw, 2.625rem);
--font-size-4xl: clamp(2.25rem, 1.85rem + 2.17vw, 3.5rem);
--font-size-5xl: clamp(3rem, 2.35rem + 3.26vw, 5rem);
```

### Line Heights Adaptive

```css
--line-height-tight: 1.2;      /* Headings */
--line-height-snug: 1.375;     /* Subheadings */
--line-height-normal: 1.5;     /* Body text (mobile) */
--line-height-relaxed: 1.625;  /* Body text (desktop) */
--line-height-loose: 2;        /* Spacious content */
```

### Touch Targets

Toate elementele interactive au **minim 44x44px** pentru ușurință în utilizare pe mobile:

```css
--touch-target: 44px;

.btn {
    min-height: var(--touch-target);
    min-width: var(--touch-target);
}
```

## 🧭 Navigation - Mobile & Desktop

### Mobile Navigation

- **Hamburger Menu**: Animat cu 3 linii
- **Slide-in Drawer**: Din dreapta cu overlay
- **Smooth Animations**: Tranziții de 0.3s
- **Scroll Lock**: Body scroll disabled când drawer-ul e deschis
- **ESC Key**: Închide drawer-ul
- **Touch Optimized**: Toate link-urile au min 44px height

```html
<!-- Hamburger Button -->
<button class="hamburger">
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
</button>

<!-- Drawer Menu -->
<nav class="nav-drawer">
    <ul class="nav-drawer-menu">
        <li class="nav-drawer-item">
            <a href="/" class="nav-drawer-link">Acasă</a>
        </li>
    </ul>
</nav>

<!-- Overlay -->
<div class="nav-drawer-overlay"></div>
```

### Desktop Navigation

La `min-width: 1024px`:
- Hamburger menu ascuns
- Navigation horizontală vizibilă
- Hover effects
- Dropdown menus

## 📐 Layout - Grid System Responsive

### Container Fluid

```css
.container {
    width: 100%;
    margin: 0 auto;
    padding: 0 var(--space-sm);
}

@media (min-width: 640px) {
    .container { max-width: 640px; }
}

@media (min-width: 1024px) {
    .container { max-width: 1024px; }
}

@media (min-width: 1280px) {
    .container { max-width: 1280px; }
}
```

### Grid Responsive

```html
<!-- Auto-adapts: 1 col mobile, 2 cols tablet, 3 cols desktop -->
<div class="grid grid-cols-1 grid-cols-sm-2 grid-cols-lg-3">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
</div>

<!-- Auto-fit grid (se adapteaza automat) -->
<div class="grid grid-auto-fit">
    <!-- Items cu minim 280px width -->
</div>
```

## 🖼️ Imagini - Responsive & Optimized

### Lazy Loading

```html
<!-- Lazy loading cu data-src -->
<img
    src="placeholder.svg"
    data-src="/img/photo.jpg"
    data-srcset="/img/photo-640w.jpg 640w, /img/photo-1280w.jpg 1280w"
    sizes="(max-width: 640px) 100vw, 50vw"
    alt="Descriere"
    class="img-lazy"
    loading="lazy"
>
```

### Srcset pentru Multiple Rezoluții

```html
<picture>
    <!-- WebP pentru browsere moderne -->
    <source
        type="image/webp"
        srcset="/img/photo-320w.webp 320w,
                /img/photo-640w.webp 640w,
                /img/photo-1280w.webp 1280w"
        sizes="(max-width: 640px) 100vw, 50vw"
    >

    <!-- JPEG fallback -->
    <source
        type="image/jpeg"
        srcset="/img/photo-320w.jpg 320w,
                /img/photo-640w.jpg 640w,
                /img/photo-1280w.jpg 1280w"
        sizes="(max-width: 640px) 100vw, 50vw"
    >

    <!-- Fallback img -->
    <img src="/img/photo-640w.jpg" alt="Descriere">
</picture>
```

### Aspect Ratio Containers

```html
<div class="aspect-ratio aspect-ratio-16-9">
    <img src="/img/photo.jpg" alt="Photo">
</div>
```

### Image Helpers (Node.js)

```javascript
const { generateResponsiveImages, generateWebPImages } = require('./utils/imageHelpers');

// Generate multiple sizes
const sizes = await generateResponsiveImages('/path/to/image.jpg');
// Returns: 320w, 640w, 768w, 1024w, 1280w, 1920w

// Generate WebP versions
const webp = await generateWebPImages('/path/to/image.jpg');
```

## 📝 Forms - Mobile Optimized

### Prevent iOS Zoom

```css
/* Font size de min 16px pentru a preveni zoom-ul pe iOS */
@media (max-width: 639px) {
    input[type="text"],
    input[type="email"],
    textarea {
        font-size: 16px;
    }
}
```

### Touch-Friendly Inputs

```html
<!-- Autocomplete pentru easier filling -->
<input
    type="email"
    name="email"
    autocomplete="email"
    inputmode="email"
>

<!-- Tel input cu tastatura numerica -->
<input
    type="tel"
    name="phone"
    autocomplete="tel"
    inputmode="tel"
>
```

## 👆 Touch Gestures

### Swipe Support

```javascript
// Carousel cu swipe
const carousel = document.querySelector('.carousel');
const gestures = new CasaIgnat.TouchGestures(carousel);

carousel.addEventListener('swipeleft', () => {
    carousel.next();
});

carousel.addEventListener('swiperight', () => {
    carousel.prev();
});
```

### Touch Feedback

```css
.touching {
    opacity: 0.7;
    transform: scale(0.98);
}
```

## 🎠 Carousel Responsive

```html
<div class="carousel">
    <div class="carousel-track">
        <div class="carousel-item">Item 1</div>
        <div class="carousel-item">Item 2</div>
        <div class="carousel-item">Item 3</div>
    </div>

    <button class="carousel-prev">←</button>
    <button class="carousel-next">→</button>

    <div class="carousel-dots"></div>
</div>

<script>
    const carousel = new CasaIgnat.Carousel(
        document.querySelector('.carousel')
    );
</script>
```

## 📊 Tables - Responsive

Tables se fac auto-scrollable pe mobile:

```html
<div class="table-responsive">
    <table class="table">
        <!-- Table content -->
    </table>
</div>
```

## 🚀 Performance Optimizations

### Service Worker - Offline Support

```javascript
// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}
```

Strategii de caching:
- **Cache First**: Images, CSS, JS
- **Network First**: HTML pages
- **Offline Fallback**: /offline.html

### Critical CSS

Critical CSS este inline în `<head>` pentru faster first paint:

```html
<style>
    /* Critical CSS - above the fold */
    /* ... */
</style>
```

### Font Loading

```css
@font-face {
    font-family: 'Inter';
    font-display: swap; /* Show fallback until font loads */
    src: url('/fonts/inter-var.woff2') format('woff2-variations');
}
```

### Resource Hints

```html
<!-- DNS prefetch -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com">

<!-- Preconnect -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Preload critical assets -->
<link rel="preload" href="/css/style.css" as="style">
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
```

## 📱 PWA Support

### Web App Manifest

```json
{
    "name": "Casa Ignat",
    "short_name": "Casa Ignat",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#2d6a4f",
    "icons": [
        { "src": "/img/icon-192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "/img/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
}
```

### iOS Meta Tags

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Casa Ignat">
<link rel="apple-touch-icon" href="/img/icon-180.png">
```

## 🎨 Utility Classes

### Responsive Visibility

```html
<!-- Show only on mobile -->
<div class="show-mobile hide-tablet-up">Mobile Only</div>

<!-- Hide on mobile -->
<div class="hide-mobile">Desktop Only</div>

<!-- Hide on desktop -->
<div class="hide-desktop">Mobile & Tablet</div>
```

### Responsive Spacing

```html
<!-- Small padding on mobile -->
<div class="p-mobile-sm">Content</div>

<!-- Responsive margins -->
<div style="margin: var(--space-sm)">
    <!-- Auto-adapts from sm to lg -->
</div>
```

## ⚡ Performance Metrics

### Core Web Vitals Target

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Optimization Checklist

- ✅ Images lazy loaded
- ✅ Critical CSS inline
- ✅ Fonts optimized (font-display: swap)
- ✅ Service worker caching
- ✅ Resource hints (dns-prefetch, preconnect)
- ✅ Minified CSS/JS
- ✅ Gzip/Brotli compression
- ✅ HTTP/2 push for critical resources

## 🧪 Testing Checklist

### Devices to Test

**Mobile:**
- iPhone SE (375x667)
- iPhone 12/13 (390x844)
- iPhone 12/13 Pro Max (428x926)
- Samsung Galaxy S21 (360x800)
- Google Pixel 5 (393x851)

**Tablet:**
- iPad (768x1024)
- iPad Pro 11" (834x1194)
- iPad Pro 12.9" (1024x1366)

**Desktop:**
- 1366x768 (Laptop standard)
- 1920x1080 (Full HD)
- 2560x1440 (2K)
- 3840x2160 (4K)

### Testing Tools

```bash
# Lighthouse audit
npm run lighthouse

# Chrome DevTools Device Emulation
# F12 > Toggle Device Toolbar (Ctrl+Shift+M)

# Browser Stack / LambdaTest
# Pentru real device testing
```

### Performance Testing

```bash
# Google PageSpeed Insights
https://pagespeed.web.dev/

# WebPageTest
https://www.webpagetest.org/

# GTmetrix
https://gtmetrix.com/
```

## 📚 Resources & Documentation

### CSS Files
- `/public/css/responsive.css` - Toate stilurile responsive
- Variabile CSS pentru breakpoints și spacing
- Fluid typography cu clamp()
- Grid system responsive

### JavaScript Files
- `/public/js/responsive.js` - Navigation, gestures, lazy loading
- Service Worker - `/public/sw.js`
- Offline page - `/public/offline.html`

### Utilities
- `/src/utils/imageHelpers.js` - Generate responsive images
- `/src/utils/performance.js` - Performance helpers

## 🎯 Quick Start

### 1. Include CSS

```html
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/responsive.css">
```

### 2. Include JavaScript

```html
<script src="/js/main.js" defer></script>
<script src="/js/responsive.js" defer></script>
```

### 3. Register Service Worker

```html
<script>
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
    }
</script>
```

### 4. Use Responsive Classes

```html
<div class="container">
    <div class="grid grid-cols-1 grid-cols-sm-2 grid-cols-lg-3">
        <div class="card">Content</div>
    </div>
</div>
```

## 🚀 Next Steps

1. **Test pe dispozitive reale**
2. **Optimizează imagini** cu sharp
3. **Configurează CDN** pentru assets statice
4. **Monitorizează performance** cu Google Analytics
5. **A/B testing** pentru UX improvements

---

**Dezvoltat pentru Casa Ignat - Mobile-First, Performance-Optimized** 📱✨
