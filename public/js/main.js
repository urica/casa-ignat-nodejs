/**
 * Casa Ignat - Main JavaScript
 * Handles navigation, carousel, animations, and interactions
 */

(function() {
  'use strict';

  // ========================================
  // MOBILE NAVIGATION
  // ========================================

  const initMobileNav = () => {
    const toggle = document.getElementById('navbarToggle');
    const menu = document.getElementById('navbarMenu');
    const overlay = document.getElementById('navbarOverlay');

    if (!toggle || !menu) return;

    const toggleMenu = () => {
      const isOpen = menu.classList.contains('navbar__menu--open');

      if (isOpen) {
        menu.classList.remove('navbar__menu--open');
        overlay?.classList.remove('navbar__overlay--open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      } else {
        menu.classList.add('navbar__menu--open');
        overlay?.classList.add('navbar__overlay--open');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    };

    toggle.addEventListener('click', toggleMenu);

    // Close menu when clicking overlay
    overlay?.addEventListener('click', toggleMenu);

    // Close menu when clicking a link
    const menuLinks = menu.querySelectorAll('.navbar__link');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          toggleMenu();
        }
      });
    });

    // Close menu on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && menu.classList.contains('navbar__menu--open')) {
        toggleMenu();
      }
    });
  };

  // ========================================
  // DROPDOWN NAVIGATION
  // ========================================

  const initDropdowns = () => {
    const dropdownItems = document.querySelectorAll('.navbar__item--dropdown');

    dropdownItems.forEach(item => {
      const link = item.querySelector('.navbar__link');
      const dropdown = item.querySelector('.navbar__dropdown');

      if (!link || !dropdown) return;

      // Prevent default link behavior
      link.addEventListener('click', (e) => {
        e.preventDefault();

        // On mobile, toggle dropdown
        if (window.innerWidth <= 768) {
          dropdown.classList.toggle('navbar__dropdown--open');
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!item.contains(e.target)) {
          dropdown.classList.remove('navbar__dropdown--open');
        }
      });
    });
  };

  // ========================================
  // TESTIMONIALS CAROUSEL
  // ========================================

  const initTestimonialsCarousel = () => {
    const track = document.getElementById('testimonialsTrack');
    const prevBtn = document.getElementById('testimonialsPrev');
    const nextBtn = document.getElementById('testimonialsNext');
    const dotsContainer = document.getElementById('testimonialsDots');

    if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

    const items = track.querySelectorAll('.testimonials-carousel__item');
    let currentIndex = 0;

    // Create dots
    items.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
      if (index === 0) dot.classList.add('carousel-dot--active');

      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.carousel-dot');

    const updateCarousel = () => {
      // Move track
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      // Update dots
      dots.forEach((dot, index) => {
        dot.classList.toggle('carousel-dot--active', index === currentIndex);
      });

      // Update buttons
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === items.length - 1;
    };

    const goToSlide = (index) => {
      currentIndex = Math.max(0, Math.min(index, items.length - 1));
      updateCarousel();
    };

    const nextSlide = () => {
      if (currentIndex < items.length - 1) {
        currentIndex++;
        updateCarousel();
      }
    };

    const prevSlide = () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    };

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // Auto-play carousel
    let autoplayInterval;
    const startAutoplay = () => {
      autoplayInterval = setInterval(() => {
        if (currentIndex === items.length - 1) {
          currentIndex = 0;
        } else {
          currentIndex++;
        }
        updateCarousel();
      }, 5000);
    };

    const stopAutoplay = () => {
      clearInterval(autoplayInterval);
    };

    // Start autoplay
    startAutoplay();

    // Stop autoplay on hover
    track.addEventListener('mouseenter', stopAutoplay);
    track.addEventListener('mouseleave', startAutoplay);

    // Stop autoplay on interaction
    prevBtn.addEventListener('click', () => {
      stopAutoplay();
      setTimeout(startAutoplay, 10000);
    });

    nextBtn.addEventListener('click', () => {
      stopAutoplay();
      setTimeout(startAutoplay, 10000);
    });

    // Initial update
    updateCarousel();

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });

    const handleSwipe = () => {
      if (touchEndX < touchStartX - 50) {
        // Swipe left
        nextSlide();
        stopAutoplay();
        setTimeout(startAutoplay, 10000);
      }
      if (touchEndX > touchStartX + 50) {
        // Swipe right
        prevSlide();
        stopAutoplay();
        setTimeout(startAutoplay, 10000);
      }
    };
  };

  // ========================================
  // SCROLL ANIMATIONS
  // ========================================

  const initScrollAnimations = () => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Optional: unobserve after animation
          // observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
  };

  // ========================================
  // SMOOTH SCROLL
  // ========================================

  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        // Ignore empty hash or just #
        if (!href || href === '#') {
          e.preventDefault();
          return;
        }

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offsetTop = target.offsetTop - 80; // Account for fixed header

          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  };

  // ========================================
  // NEWSLETTER FORM
  // ========================================

  const initNewsletterForm = () => {
    const form = document.getElementById('newsletterForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput.value;

      // Basic validation
      if (!email || !email.includes('@')) {
        alert('Te rugăm să introduci o adresă de email validă.');
        return;
      }

      try {
        // Here you would normally send to your API
        // const response = await fetch('/api/newsletter/subscribe', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ email })
        // });

        // For now, just show success message
        alert('Mulțumim pentru abonare! Vei primi cele mai noi articole despre nutriție.');
        emailInput.value = '';
      } catch (error) {
        console.error('Newsletter subscription error:', error);
        alert('A apărut o eroare. Te rugăm să încerci din nou.');
      }
    });
  };

  // ========================================
  // STICKY HEADER
  // ========================================

  const initStickyHeader = () => {
    const header = document.querySelector('.navbar');
    if (!header) return;

    let lastScrollTop = 0;
    const headerHeight = header.offsetHeight;

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > headerHeight) {
        header.classList.add('navbar--scrolled');

        // Hide on scroll down, show on scroll up
        if (scrollTop > lastScrollTop && scrollTop > headerHeight * 2) {
          header.style.transform = 'translateY(-100%)';
        } else {
          header.style.transform = 'translateY(0)';
        }
      } else {
        header.classList.remove('navbar--scrolled');
      }

      lastScrollTop = scrollTop;
    });
  };

  // ========================================
  // LAZY LOADING IMAGES
  // ========================================

  const initLazyLoading = () => {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  };

  // ========================================
  // INITIALIZE ALL
  // ========================================

  const init = () => {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initMobileNav();
        initDropdowns();
        initTestimonialsCarousel();
        initScrollAnimations();
        initSmoothScroll();
        initNewsletterForm();
        initStickyHeader();
        initLazyLoading();
      });
    } else {
      initMobileNav();
      initDropdowns();
      initTestimonialsCarousel();
      initScrollAnimations();
      initSmoothScroll();
      initNewsletterForm();
      initStickyHeader();
      initLazyLoading();
    }
  };

  // Start initialization
  init();
})();
