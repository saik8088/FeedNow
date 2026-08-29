/* ============================================================
   FEEDNOW — NAVIGATION MODULE
   Handles public navbar, sidebar, and mobile menu toggles
   ============================================================ */

const Navigation = {
  init() {
    this.initNavbarScroll();
    this.initHamburger();
    this.initSidebar();
    this.highlightActiveLink();
    this.initRevealAnimations();
  },

  /* Navbar scroll effect */
  initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const onScroll = () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  },

  /* Hamburger mobile menu */
  initHamburger() {
    const hamburger = document.querySelector('.navbar__hamburger');
    const mobileMenu = document.querySelector('.navbar__mobile-menu');
    const overlay = document.querySelector('.navbar__mobile-overlay');
    const closeBtn = document.querySelector('.navbar__mobile-close');
    
    if (!hamburger || !mobileMenu) return;

    const openMenu = () => {
      hamburger.classList.add('active');
      mobileMenu.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', () => {
      if (mobileMenu.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeMenu);
    }
    
    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  },

  /* Dashboard sidebar mobile toggle */
  initSidebar() {
    const toggle = document.querySelector('.sidebar__mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar__overlay');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      if (overlay) overlay.classList.toggle('active');
      document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
  },

  /* Highlight current page in sidebar */
  highlightActiveLink() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar__link, .navbar__link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && currentPath.endsWith(href.replace(/^\.\.\//, '').replace(/^\.\//, ''))) {
        link.classList.add('active');
      }
    });
  },

  /* Intersection Observer for reveal animations */
  initRevealAnimations() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    reveals.forEach(el => observer.observe(el));
  },
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => Navigation.init());
