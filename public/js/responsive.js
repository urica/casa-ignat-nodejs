/**
 * Casa Ignat - Responsive JavaScript
 * Mobile navigation, gestures, lazy loading, and touch interactions
 */

(function() {
    'use strict';

    // ============================================
    // MOBILE NAVIGATION
    // ============================================

    class MobileNav {
        constructor() {
            this.hamburger = document.querySelector('.hamburger');
            this.drawer = document.querySelector('.nav-drawer');
            this.overlay = document.querySelector('.nav-drawer-overlay');
            this.drawerLinks = document.querySelectorAll('.nav-drawer-link');

            if (this.hamburger && this.drawer && this.overlay) {
                this.init();
            }
        }

        init() {
            // Hamburger click
            this.hamburger.addEventListener('click', () => this.toggle());

            // Overlay click
            this.overlay.addEventListener('click', () => this.close());

            // Link clicks
            this.drawerLinks.forEach(link => {
                link.addEventListener('click', () => this.close());
            });

            // Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen()) {
                    this.close();
                }
            });

            // Prevent body scroll when drawer is open
            this.drawer.addEventListener('touchmove', (e) => {
                if (this.isOpen()) {
                    e.stopPropagation();
                }
            });
        }

        toggle() {
            if (this.isOpen()) {
                this.close();
            } else {
                this.open();
            }
        }

        open() {
            this.hamburger.classList.add('active');
            this.drawer.classList.add('active');
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        close() {
            this.hamburger.classList.remove('active');
            this.drawer.classList.remove('active');
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        isOpen() {
            return this.drawer.classList.contains('active');
        }
    }

    // ============================================
    // LAZY LOADING IMAGES
    // ============================================

    class LazyLoader {
        constructor() {
            this.images = document.querySelectorAll('img[data-src], img[data-srcset]');
            this.init();
        }

        init() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.loadImage(entry.target);
                            this.observer.unobserve(entry.target);
                        }
                    });
                }, {
                    rootMargin: '50px',
                    threshold: 0.01
                });

                this.images.forEach(img => this.observer.observe(img));
            } else {
                // Fallback for browsers without IntersectionObserver
                this.images.forEach(img => this.loadImage(img));
            }
        }

        loadImage(img) {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                delete img.dataset.src;
            }

            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
                delete img.dataset.srcset;
            }

            img.classList.add('loaded');

            // Trigger load event for any listeners
            img.dispatchEvent(new Event('lazyloaded'));
        }
    }

    // ============================================
    // TOUCH GESTURES
    // ============================================

    class TouchGestures {
        constructor(element, options = {}) {
            this.element = element;
            this.options = {
                swipeThreshold: 50,
                swipeTimeout: 300,
                ...options
            };

            this.startX = 0;
            this.startY = 0;
            this.startTime = 0;
            this.init();
        }

        init() {
            this.element.addEventListener('touchstart', (e) => this.handleStart(e), { passive: true });
            this.element.addEventListener('touchmove', (e) => this.handleMove(e), { passive: true });
            this.element.addEventListener('touchend', (e) => this.handleEnd(e), { passive: true });
        }

        handleStart(e) {
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
            this.startTime = Date.now();
        }

        handleMove(e) {
            // Can add visual feedback here if needed
        }

        handleEnd(e) {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();

            const diffX = endX - this.startX;
            const diffY = endY - this.startY;
            const diffTime = endTime - this.startTime;

            // Check if it's a swipe (not too slow, not too short)
            if (Math.abs(diffX) > this.options.swipeThreshold && diffTime < this.options.swipeTimeout) {
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    // Horizontal swipe
                    if (diffX > 0) {
                        this.element.dispatchEvent(new CustomEvent('swiperight', { detail: { diffX, diffY, diffTime } }));
                    } else {
                        this.element.dispatchEvent(new CustomEvent('swipeleft', { detail: { diffX, diffY, diffTime } }));
                    }
                }
            }

            if (Math.abs(diffY) > this.options.swipeThreshold && diffTime < this.options.swipeTimeout) {
                if (Math.abs(diffY) > Math.abs(diffX)) {
                    // Vertical swipe
                    if (diffY > 0) {
                        this.element.dispatchEvent(new CustomEvent('swipedown', { detail: { diffX, diffY, diffTime } }));
                    } else {
                        this.element.dispatchEvent(new CustomEvent('swipeup', { detail: { diffX, diffY, diffTime } }));
                    }
                }
            }
        }
    }

    // ============================================
    // CAROUSEL WITH SWIPE SUPPORT
    // ============================================

    class Carousel {
        constructor(element) {
            this.carousel = element;
            this.track = element.querySelector('.carousel-track');
            this.items = element.querySelectorAll('.carousel-item');
            this.prevBtn = element.querySelector('.carousel-prev');
            this.nextBtn = element.querySelector('.carousel-next');
            this.dots = element.querySelector('.carousel-dots');

            this.currentIndex = 0;
            this.itemWidth = 0;

            if (this.track && this.items.length > 0) {
                this.init();
            }
        }

        init() {
            // Calculate item width
            this.updateItemWidth();

            // Create dots
            if (this.dots) {
                this.createDots();
            }

            // Button controls
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => this.prev());
            }

            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => this.next());
            }

            // Touch gestures
            const gestures = new TouchGestures(this.carousel);
            this.carousel.addEventListener('swipeleft', () => this.next());
            this.carousel.addEventListener('swiperight', () => this.prev());

            // Update on resize
            window.addEventListener('resize', () => this.updateItemWidth());

            // Update initial state
            this.update();
        }

        updateItemWidth() {
            if (this.items[0]) {
                this.itemWidth = this.items[0].offsetWidth;
            }
        }

        createDots() {
            this.dots.innerHTML = '';
            this.items.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.classList.add('carousel-dot');
                dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
                dot.addEventListener('click', () => this.goTo(index));
                this.dots.appendChild(dot);
            });
        }

        prev() {
            this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
            this.update();
        }

        next() {
            this.currentIndex = (this.currentIndex + 1) % this.items.length;
            this.update();
        }

        goTo(index) {
            this.currentIndex = index;
            this.update();
        }

        update() {
            const offset = -this.currentIndex * this.itemWidth;
            this.track.style.transform = `translateX(${offset}px)`;

            // Update dots
            if (this.dots) {
                const dotElements = this.dots.querySelectorAll('.carousel-dot');
                dotElements.forEach((dot, index) => {
                    dot.classList.toggle('active', index === this.currentIndex);
                });
            }

            // Update buttons state
            if (this.prevBtn) {
                this.prevBtn.disabled = this.currentIndex === 0;
            }

            if (this.nextBtn) {
                this.nextBtn.disabled = this.currentIndex === this.items.length - 1;
            }
        }
    }

    // ============================================
    // RESPONSIVE TABLES
    // ============================================

    class ResponsiveTable {
        constructor() {
            this.tables = document.querySelectorAll('table:not(.no-responsive)');
            this.init();
        }

        init() {
            this.tables.forEach(table => {
                if (!table.parentElement.classList.contains('table-responsive')) {
                    const wrapper = document.createElement('div');
                    wrapper.classList.add('table-responsive');
                    table.parentNode.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                }
            });
        }
    }

    // ============================================
    // SCROLL TO TOP
    // ============================================

    class ScrollToTop {
        constructor() {
            this.button = document.querySelector('.scroll-to-top');
            if (this.button) {
                this.init();
            }
        }

        init() {
            // Show/hide button on scroll
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    this.button.classList.add('visible');
                } else {
                    this.button.classList.remove('visible');
                }
            });

            // Click handler
            this.button.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    // ============================================
    // VIEWPORT HEIGHT FIX (for mobile browsers)
    // ============================================

    function fixViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // ============================================
    // TOUCH FEEDBACK
    // ============================================

    function addTouchFeedback() {
        const touchElements = document.querySelectorAll('a, button, .touch-target');

        touchElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.classList.add('touching');
            }, { passive: true });

            element.addEventListener('touchend', function() {
                this.classList.remove('touching');
            }, { passive: true });

            element.addEventListener('touchcancel', function() {
                this.classList.remove('touching');
            }, { passive: true });
        });
    }

    // ============================================
    // ORIENTATION CHANGE HANDLER
    // ============================================

    function handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            // Fix viewport height after orientation change
            setTimeout(fixViewportHeight, 100);

            // Reload carousels if any
            document.querySelectorAll('.carousel').forEach(carousel => {
                const instance = carousel.__carouselInstance;
                if (instance) {
                    instance.updateItemWidth();
                    instance.update();
                }
            });
        });
    }

    // ============================================
    // NETWORK STATUS
    // ============================================

    function monitorNetworkStatus() {
        function updateOnlineStatus() {
            const status = navigator.onLine ? 'online' : 'offline';
            document.body.classList.toggle('offline', !navigator.onLine);

            if (!navigator.onLine) {
                showNotification('Conexiune pierdută. Unele funcții pot fi limitate.', 'warning');
            }
        }

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        updateOnlineStatus();
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        // Mobile Navigation
        new MobileNav();

        // Lazy Loading
        new LazyLoader();

        // Initialize carousels
        document.querySelectorAll('.carousel').forEach(carousel => {
            carousel.__carouselInstance = new Carousel(carousel);
        });

        // Responsive tables
        new ResponsiveTable();

        // Scroll to top
        new ScrollToTop();

        // Viewport height fix
        fixViewportHeight();
        window.addEventListener('resize', fixViewportHeight);

        // Touch feedback
        addTouchFeedback();

        // Orientation change
        handleOrientationChange();

        // Network status monitoring
        if ('onLine' in navigator) {
            monitorNetworkStatus();
        }

        // Log device info (for debugging)
        console.log('Device Info:', {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio,
            touchSupport: 'ontouchstart' in window,
            online: navigator.onLine
        });
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for global use
    window.CasaIgnat = window.CasaIgnat || {};
    window.CasaIgnat.TouchGestures = TouchGestures;
    window.CasaIgnat.Carousel = Carousel;
    window.CasaIgnat.LazyLoader = LazyLoader;

})();
