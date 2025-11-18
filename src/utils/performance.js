/**
 * Performance Utilities
 * Critical CSS, font loading, resource hints
 */

/**
 * Extract critical CSS for above-the-fold content
 * This would integrate with a tool like Critical or Penthouse
 */
function extractCriticalCSS(html, cssFiles) {
    // In a real implementation, this would use a library like 'critical'
    // For now, return a placeholder
    return `
        /* Critical CSS - Above the fold */
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;line-height:1.5}
        .header{position:sticky;top:0;z-index:200;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.1)}
        .hero{min-height:50vh;display:flex;align-items:center;justify-content:center}
    `;
}

/**
 * Generate resource hints
 */
function generateResourceHints() {
    return {
        dns: [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com'
        ],
        preconnect: [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ],
        preload: [
            { href: '/css/style.css', as: 'style' },
            { href: '/js/main.js', as: 'script' },
            { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossorigin: true }
        ]
    };
}

/**
 * Generate font-face CSS with font-display: swap
 */
function generateFontFaceCSS() {
    return `
        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 300 900;
            font-display: swap;
            src: url('/fonts/inter-var.woff2') format('woff2-variations');
        }
    `;
}

/**
 * Generate meta tags for performance
 */
function generatePerformanceMetaTags() {
    return [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#2d6a4f' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'format-detection', content: 'telephone=no' }
    ];
}

/**
 * Generate manifest.json for PWA
 */
function generateWebManifest() {
    return {
        name: 'Casa Ignat - Nutriție și Sănătate',
        short_name: 'Casa Ignat',
        description: 'Cabinet de Nutriție și Dietetică',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2d6a4f',
        orientation: 'portrait-primary',
        icons: [
            {
                src: '/img/icon-72.png',
                sizes: '72x72',
                type: 'image/png'
            },
            {
                src: '/img/icon-96.png',
                sizes: '96x96',
                type: 'image/png'
            },
            {
                src: '/img/icon-128.png',
                sizes: '128x128',
                type: 'image/png'
            },
            {
                src: '/img/icon-144.png',
                sizes: '144x144',
                type: 'image/png'
            },
            {
                src: '/img/icon-152.png',
                sizes: '152x152',
                type: 'image/png'
            },
            {
                src: '/img/icon-192.png',
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: '/img/icon-384.png',
                sizes: '384x384',
                type: 'image/png'
            },
            {
                src: '/img/icon-512.png',
                sizes: '512x512',
                type: 'image/png'
            }
        ]
    };
}

/**
 * Service Worker registration script
 */
function getServiceWorkerScript() {
    return `
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered:', registration);

                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New service worker available
                                    if (confirm('Versiune nouă disponibilă! Reîncărcați pagina?')) {
                                        window.location.reload();
                                    }
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.log('SW registration failed:', error);
                    });
            });
        }
    `;
}

/**
 * Generate inline script for critical JS
 */
function getCriticalJS() {
    return `
        // Set viewport height CSS variable (for mobile browsers)
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', vh + 'px');
        };
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);

        // Add 'js' class to html
        document.documentElement.classList.add('js');

        // Detect touch support
        if ('ontouchstart' in window) {
            document.documentElement.classList.add('touch');
        } else {
            document.documentElement.classList.add('no-touch');
        }

        // Detect reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduced-motion');
        }
    `;
}

/**
 * Generate CSP meta tag
 */
function generateCSP() {
    return {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://www.google-analytics.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
        'connect-src': ["'self'", 'https://www.google-analytics.com'],
        'frame-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': []
    };
}

/**
 * Generate security headers
 */
function getSecurityHeaders() {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
}

/**
 * Measure performance metrics
 */
function getPerformanceMetrics() {
    if (typeof window === 'undefined') return null;

    const metrics = {};

    // Navigation Timing
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        metrics.domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
        metrics.connectTime = timing.responseEnd - timing.requestStart;
    }

    // Paint Timing
    if (window.performance && window.performance.getEntriesByType) {
        const paintEntries = window.performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
            if (entry.name === 'first-paint') {
                metrics.firstPaint = entry.startTime;
            }
            if (entry.name === 'first-contentful-paint') {
                metrics.firstContentfulPaint = entry.startTime;
            }
        });
    }

    // Largest Contentful Paint
    if (window.PerformanceObserver) {
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
            // LCP not supported
        }
    }

    return metrics;
}

module.exports = {
    extractCriticalCSS,
    generateResourceHints,
    generateFontFaceCSS,
    generatePerformanceMetaTags,
    generateWebManifest,
    getServiceWorkerScript,
    getCriticalJS,
    generateCSP,
    getSecurityHeaders,
    getPerformanceMetrics
};
