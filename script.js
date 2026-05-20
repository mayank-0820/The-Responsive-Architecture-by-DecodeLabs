/* ============================================================
   NEXUS — script.js
   Vanilla JS: navbar, hamburger, theme toggle, typing animation,
   scroll reveal, scroll-to-top, CTA interaction
   ============================================================ */

'use strict';

/* ── Utility: throttle ── */
function throttle(fn, wait) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) { last = now; fn.apply(this, args); }
  };
}

/* ── Utility: $ shorthand ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   1. NAVBAR — scroll shadow + active link highlight
   ============================================================ */
(function initNavbar() {
  const navbar    = $('#navbar');
  const navLinks  = $$('.nav-link');
  const sections  = $$('section[id]');

  /* Add scrolled class for shadow */
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 10);

    /* Highlight active nav link based on scroll position */
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === current);
    });
  }

  window.addEventListener('scroll', throttle(onScroll, 80), { passive: true });
  onScroll(); // run once on load
})();

/* ============================================================
   2. HAMBURGER MENU
   ============================================================ */
(function initHamburger() {
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  const mobileLinks = $$('.mobile-link, .mobile-cta');

  function toggleMenu(force) {
    const isOpen = force !== undefined ? force : !hamburger.classList.contains('open');
    hamburger.classList.toggle('open', isOpen);
    mobileMenu.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', () => toggleMenu());

  /* Close on link click */
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  /* Close on outside click */
  document.addEventListener('click', e => {
    if (mobileMenu.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        !hamburger.contains(e.target)) {
      toggleMenu(false);
    }
  });

  /* Close on Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) toggleMenu(false);
  });
})();

/* ============================================================
   3. DARK / LIGHT THEME TOGGLE
   ============================================================ */
(function initTheme() {
  const toggle = $('#themeToggle');
  const root   = document.documentElement;

  /* Restore saved preference */
  const saved = localStorage.getItem('nexus-theme');
  if (saved) root.setAttribute('data-theme', saved);

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('nexus-theme', theme);
  }

  toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  /* Respect OS preference on first visit */
  if (!saved) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }
})();

/* ============================================================
   4. TYPING ANIMATION — hero section
   ============================================================ */
(function initTyping() {
  const el     = $('#typedText');
  if (!el) return;

  const words  = ['matters.', 'lasts.', 'scales.', 'ships.', 'counts.'];
  let wi       = 0;   // word index
  let ci       = 0;   // char index
  let deleting = false;
  let paused   = false;

  const TYPING_SPEED   = 95;
  const DELETING_SPEED = 55;
  const PAUSE_AFTER    = 1800;
  const PAUSE_BEFORE   = 300;

  function type() {
    if (paused) return;

    const word    = words[wi];
    const current = deleting ? word.slice(0, ci - 1) : word.slice(0, ci + 1);

    el.textContent = current;
    deleting ? ci-- : ci++;

    let delay = deleting ? DELETING_SPEED : TYPING_SPEED;

    if (!deleting && ci === word.length) {
      /* Finished typing — pause then delete */
      paused = true;
      setTimeout(() => { paused = false; deleting = true; setTimeout(type, delay); }, PAUSE_AFTER);
      return;
    }

    if (deleting && ci === 0) {
      /* Finished deleting — move to next word */
      deleting = false;
      wi = (wi + 1) % words.length;
      paused = true;
      setTimeout(() => { paused = false; setTimeout(type, delay); }, PAUSE_BEFORE);
      return;
    }

    setTimeout(type, delay);
  }

  /* Start after a short delay so the page settles */
  setTimeout(type, 800);
})();

/* ============================================================
   5. SCROLL REVEAL — IntersectionObserver
   ============================================================ */
(function initScrollReveal() {
  const targets = $$('.reveal, .reveal-right');
  if (!targets.length) return;

  /* Respect reduced motion */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    targets.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // only animate once
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach(el => observer.observe(el));
})();

/* ============================================================
   6. SCROLL TO TOP BUTTON
   ============================================================ */
(function initScrollTop() {
  const btn = $('#scrollTop');
  if (!btn) return;

  function toggle() {
    btn.classList.toggle('visible', window.scrollY > 400);
  }

  window.addEventListener('scroll', throttle(toggle, 150), { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ============================================================
   7. CTA EMAIL FORM — validation + feedback
   ============================================================ */
(function initCTA() {
  const btn   = $('#ctaBtn');
  const input = $('#emailInput');
  if (!btn || !input) return;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setSuccess() {
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>You're in!</span>`;
    btn.style.background = '#3fcf6e';
    input.value = '';
    input.placeholder = 'Welcome aboard 🎉';
    btn.disabled = true;

    /* Reset after 4 s */
    setTimeout(() => {
      btn.innerHTML = `<span>Start free</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>`;
      btn.style.background = '';
      input.placeholder = 'you@company.com';
      btn.disabled = false;
    }, 4000);
  }

  function setError() {
    input.style.borderColor = '#e84040';
    input.style.boxShadow   = '0 0 0 3px rgba(232,64,64,.2)';

    input.addEventListener('input', function reset() {
      input.style.borderColor = '';
      input.style.boxShadow   = '';
      input.removeEventListener('input', reset);
    }, { once: true });
  }

  btn.addEventListener('click', () => {
    const val = input.value.trim();
    if (!EMAIL_RE.test(val)) { setError(); input.focus(); return; }
    setSuccess();
  });

  /* Allow Enter key submission */
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') btn.click();
  });
})();

/* ============================================================
   8. SMOOTH ANCHOR SCROLL — offset for sticky navbar
   ============================================================ */
(function initSmoothAnchors() {
  const NAV_HEIGHT = 64;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ============================================================
   9. INTERACTIVE DASHBOARD BARS — animate on scroll into view
   ============================================================ */
(function initDashboardBars() {
  const bars = $$('.bar');
  if (!bars.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        /* Stagger bar animations */
        bars.forEach((bar, i) => {
          setTimeout(() => {
            bar.style.opacity = '1';
            bar.style.transform = 'scaleY(1)';
          }, i * 80);
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });

  /* Initially hide bars */
  bars.forEach(bar => {
    bar.style.opacity = '0';
    bar.style.transform = 'scaleY(0)';
    bar.style.transformOrigin = 'bottom';
    bar.style.transition = 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)';
  });

  const chart = $('.mock-bar-chart');
  if (chart) observer.observe(chart);
})();

/* ============================================================
   10. WORK CARD KEYBOARD INTERACTION
   ============================================================ */
(function initWorkCards() {
  $$('.work-card, .feature-card').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
})();

/* ============================================================
   11. ACTIVE NAV LINK STYLE (add CSS rule once)
   ============================================================ */
(function injectActiveStyle() {
  const style = document.createElement('style');
  style.textContent = `.nav-link.active { color: var(--text) !important; }
  .nav-link.active::after { width: 100% !important; }`;
  document.head.appendChild(style);
})();

/* ============================================================
   12. PARALLAX — subtle orb drift on mouse move (desktop only)
   ============================================================ */
(function initParallax() {
  if (window.matchMedia('(max-width: 1023px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const orbs = $$('.mesh-orb');
  const STRENGTH = 20;

  document.addEventListener('mousemove', throttle(e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx; // -1 to 1
    const dy = (e.clientY - cy) / cy;

    orbs.forEach((orb, i) => {
      const factor = (i % 2 === 0 ? 1 : -1) * STRENGTH * (i * 0.4 + 0.6);
      orb.style.transform = `translate(${dx * factor}px, ${dy * factor}px)`;
    });
  }, 30));
})();

/* ============================================================
   Done — Nexus script.js loaded
   ============================================================ */
console.log('%c NEXUS %c v1.0 ready ', 
  'background:#f5a623;color:#0b0d11;font-weight:700;padding:2px 6px;border-radius:3px 0 0 3px',
  'background:#191d26;color:#f5a623;padding:2px 6px;border-radius:0 3px 3px 0'
);
