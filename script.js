(function() {
  'use strict';

  if (typeof window.__app === 'undefined') {
    window.__app = {};
  }

  var app = window.__app;

  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  function throttle(func, limit) {
    var inThrottle;
    return function() {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() {
          inThrottle = false;
        }, limit);
      }
    };
  }

  function initBurger() {
    if (app.burgerInitialized) return;
    app.burgerInitialized = true;

    var nav = document.querySelector('.c-nav, .navbar-collapse');
    var toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
    var body = document.body;

    if (!toggle) return;

    if (!nav) {
      var navList = document.querySelector('.c-nav__list, .navbar-nav');
      if (navList) {
        nav = navList.parentElement;
      }
    }

    if (!nav) return;

    var focusableElements = 'a[href], button:not([disabled]), textarea, input, select';
    var firstFocusable, lastFocusable;

    function updateFocusableElements() {
      var focusables = nav.querySelectorAll(focusableElements);
      if (focusables.length > 0) {
        firstFocusable = focusables[0];
        lastFocusable = focusables[focusables.length - 1];
      }
    }

    function openMenu() {
      nav.classList.add('is-open', 'show');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
      updateFocusableElements();
      if (firstFocusable) {
        setTimeout(function() {
          firstFocusable.focus();
        }, 100);
      }
    }

    function closeMenu() {
      nav.classList.remove('is-open', 'show');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
    }

    function trapFocus(e) {
      if (!nav.classList.contains('is-open')) return;

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      if (nav.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
      trapFocus(e);
    });

    document.addEventListener('click', function(e) {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    var navLinks = document.querySelectorAll('.c-nav__link, .nav-link');
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        if (nav.classList.contains('is-open')) {
          closeMenu();
        }
      });
    }

    var resizeHandler = debounce(function() {
      if (window.innerWidth >= 1024 && nav.classList.contains('is-open')) {
        closeMenu();
      }
    }, 200);

    window.addEventListener('resize', resizeHandler, { passive: true });
  }

  function initSmoothScroll() {
    if (app.smoothScrollInitialized) return;
    app.smoothScrollInitialized = true;

    function getHeaderHeight() {
      var header = document.querySelector('.l-header, .navbar');
      return header ? header.offsetHeight : 72;
    }

    function smoothScrollTo(target) {
      var headerHeight = getHeaderHeight();
      var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }

    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target) return;

      var href = target.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#' || href === '#!') return;

      var sectionId = href.substring(1);
      var section = document.getElementById(sectionId);

      if (section) {
        e.preventDefault();
        smoothScrollTo(section);
        if (window.history && window.history.pushState) {
          window.history.pushState(null, null, href);
        }
      }
    });
  }

  function initScrollSpy() {
    if (app.scrollSpyInitialized) return;
    app.scrollSpyInitialized = true;

    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.c-nav__link[href^="#"], .nav-link[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    function getHeaderHeight() {
      var header = document.querySelector('.l-header, .navbar');
      return header ? header.offsetHeight : 72;
    }

    var handleScroll = throttle(function() {
      var scrollPos = window.scrollY + getHeaderHeight() + 100;
      var currentSection = '';

      for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        var sectionTop = section.offsetTop;
        var sectionHeight = section.offsetHeight;

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          currentSection = section.getAttribute('id');
          break;
        }
      }

      for (var j = 0; j < navLinks.length; j++) {
        var link = navLinks[j];
        var href = link.getAttribute('href');
        
        link.classList.remove('is-active', 'active');
        link.removeAttribute('aria-current');

        if (href === '#' + currentSection) {
          link.classList.add('is-active', 'active');
          link.setAttribute('aria-current', 'page');
        }
      }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  function initActiveMenu() {
    if (app.activeMenuInitialized) return;
    app.activeMenuInitialized = true;

    var currentPath = window.location.pathname;
    var navLinks = document.querySelectorAll('.c-nav__link, .nav-link');

    var normalizedPath = currentPath.replace(/\/index.html$/, '/');
    if (normalizedPath === '') normalizedPath = '/';

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var linkPath = link.getAttribute('href');

      if (!linkPath || linkPath.startsWith('#')) continue;

      var normalizedLink = linkPath.replace(/\/index.html$/, '/');

      link.removeAttribute('aria-current');
      link.classList.remove('active', 'is-active');

      if (normalizedLink === normalizedPath || (normalizedPath === '/' && linkPath === '/')) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active', 'is-active');
      }
    }
  }

  function initImages() {
    if (app.imagesInitialized) return;
    app.imagesInitialized = true;

    var images = document.querySelectorAll('img');

    var placeholderSVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="18"%3EImage not available%3C/text%3E%3C/svg%3E';

    for (var i = 0; i < images.length; i++) {
      var img = images[i];

      if (!img.hasAttribute('loading') && !img.classList.contains('c-logo__img') && !img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      img.addEventListener('error', function() {
        if (this.src !== placeholderSVG) {
          this.src = placeholderSVG;
        }
      });
    }
  }

  function initForms() {
    if (app.formsInitialized) return;
    app.formsInitialized = true;

    app.notify = function(message, type) {
      var container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
      }

      var toast = document.createElement('div');
      toast.className = 'alert alert-' + (type || 'info') + ' alert-dismissible fade show';
      toast.setAttribute('role', 'alert');
      toast.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

      container.appendChild(toast);

      var closeBtn = toast.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          toast.classList.remove('show');
          setTimeout(function() {
            if (toast.parentNode) {
              toast.parentNode.removeChild(toast);
            }
          }, 150);
        });
      }

      setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 150);
      }, 5000);
    };

    var contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    var submittedAt = 0;

    contactForm.addEventListener('submit', function(event) {
      event.preventDefault();
      event.stopPropagation();

      var now = Date.now();
      if (now - submittedAt < 3000) {
        app.notify('Wacht alstublieft even voordat u opnieuw verzendt.', 'warning');
        return;
      }

      var fullName = document.getElementById('fullName');
      var email = document.getElementById('email');
      var phone = document.getElementById('phone');
      var subject = document.getElementById('subject');
      var message = document.getElementById('message');
      var privacyConsent = document.getElementById('privacyConsent');

      var errors = [];

      function showError(field, msg) {
        var wrapper = field.closest('.c-form__group') || field.parentElement;
        var errorEl = wrapper.querySelector('.c-form__error, .invalid-feedback');
        if (!errorEl) {
          errorEl = document.createElement('div');
          errorEl.className = 'c-form__error invalid-feedback';
          wrapper.appendChild(errorEl);
        }
        errorEl.textContent = msg;
        errorEl.classList.add('is-visible');
        field.classList.add('has-error', 'is-invalid');
      }

      function clearError(field) {
        var wrapper = field.closest('.c-form__group') || field.parentElement;
        var errorEl = wrapper.querySelector('.c-form__error, .invalid-feedback');
        if (errorEl) {
          errorEl.classList.remove('is-visible');
        }
        field.classList.remove('has-error', 'is-invalid');
      }

      var allFields = [fullName, email, phone, subject, message];
      for (var i = 0; i < allFields.length; i++) {
        if (allFields[i]) clearError(allFields[i]);
      }

      if (!fullName.value.trim()) {
        showError(fullName, 'Naam is verplicht.');
        errors.push('name');
      } else if (fullName.value.trim().length < 2) {
        showError(fullName, 'Naam moet minimaal 2 tekens bevatten.');
        errors.push('name');
      } else if (!/^[a-zA-ZÀ-ÿs-']{2,50}$/.test(fullName.value.trim())) {
        showError(fullName, 'Naam bevat ongeldige tekens.');
        errors.push('name');
      }

      if (!email.value.trim()) {
        showError(email, 'E-mail is verplicht.');
        errors.push('email');
      } else if (!/^[^s@]+@[^s@]+\.[^s@]+$/.test(email.value.trim())) {
        showError(email, 'Voer een geldig e-mailadres in.');
        errors.push('email');
      }

      if (!phone.value.trim()) {
        showError(phone, 'Telefoonnummer is verplicht.');
        errors.push('phone');
      } else if (!/^[ds+\-()]{10,20}$/.test(phone.value.trim())) {
        showError(phone, 'Voer een geldig telefoonnummer in (10-20 tekens).');
        errors.push('phone');
      }

      if (!message.value.trim()) {
        showError(message, 'Bericht is verplicht.');
        errors.push('message');
      } else if (message.value.trim().length < 10) {
        showError(message, 'Bericht moet minimaal 10 tekens bevatten.');
        errors.push('message');
      }

      if (!privacyConsent.checked) {
        var consentWrapper = privacyConsent.closest('.c-form__checkbox-wrapper, .form-check');
        if (consentWrapper) {
          var errorEl = consentWrapper.querySelector('.c-form__error, .invalid-feedback');
          if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'c-form__error invalid-feedback';
            consentWrapper.appendChild(errorEl);
          }
          errorEl.textContent = 'U moet akkoord gaan met het privacybeleid.';
          errorEl.classList.add('is-visible');
        }
        errors.push('privacy');
      }

      if (errors.length > 0) {
        app.notify('Controleer de gemarkeerde velden en probeer het opnieuw.', 'danger');
        return;
      }

      submittedAt = now;

      var submitBtn = this.querySelector('button[type="submit"]');
      var originalText = submitBtn ? submitBtn.innerHTML : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Verzenden...';
      }

      setTimeout(function() {
        app.notify('Bedankt! Uw bericht is succesvol verzonden.', 'success');
        
        setTimeout(function() {
          window.location.href = 'thank_you.html';
        }, 1000);
      }, 1500);
    });
  }

  function initScrollToTop() {
    if (app.scrollToTopInitialized) return;
    app.scrollToTopInitialized = true;

    var scrollTopButtons = document.querySelectorAll('[href="#top"], [data-scroll-top]');

    for (var i = 0; i < scrollTopButtons.length; i++) {
      scrollTopButtons[i].addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  }

  function initLiveChat() {
    if (app.liveChatInitialized) return;
    app.liveChatInitialized = true;

    var liveChatBtn = document.getElementById('liveChatBtn');
    if (!liveChatBtn) return;

    liveChatBtn.addEventListener('click', function(e) {
      e.preventDefault();
      app.notify('Live chat wordt binnenkort beschikbaar.', 'info');
    });
  }

  function initHeaderScroll() {
    if (app.headerScrollInitialized) return;
    app.headerScrollInitialized = true;

    var header = document.querySelector('.l-header, .navbar');
    if (!header) return;

    var handleScroll = throttle(function() {
      if (window.scrollY > 50) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  function initPrivacyModal() {
    if (app.privacyModalInitialized) return;
    app.privacyModalInitialized = true;

    var privacyLinks = document.querySelectorAll('a[href*="privacy"]');
    
    for (var i = 0; i < privacyLinks.length; i++) {
      var link = privacyLinks[i];
      var href = link.getAttribute('href');
      
      if (href && (href.includes('privacy.html') || href.includes('privacy_policy'))) {
        link.addEventListener('click', function(e) {
          var target = this.getAttribute('target');
          if (!target || target !== '_blank') {
            return;
          }
        });
      }
    }
  }

  app.init = function() {
    initBurger();
    initSmoothScroll();
    initScrollSpy();
    initActiveMenu();
    initImages();
    initForms();
    initScrollToTop();
    initLiveChat();
    initHeaderScroll();
    initPrivacyModal();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }
})();