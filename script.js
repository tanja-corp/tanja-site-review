/* TANJA Web V2 — script.js
   Progressive enhancement only. The page is fully readable in English with JavaScript off.
   Jobs: (1) language menu + remembered choice, (2) mobile menu, (3) header over the hero, (4) current-section marker,
         (5) footer menu copies the header menu, (6) hero slider, (7) scroll reveal.
   No libraries. No network requests of its own: the hero slider only promotes the same-origin photographs already
   referenced in the page (job 6).

   Load order: the inline boot script in <head> adds html.js before first paint (layout rules use it) and restores a saved
   SW/JP choice. This file adds html.js-ready when it has run (controls become visible).
   If this file fails to load, <script onerror> removes html.js and the plain layout returns. */
(function () {
  'use strict';

  var STORAGE_KEY = 'tanja-lang';           // same key as the inline boot script in <head>
  var LANGS = ['en', 'sw', 'ja'];
  var LABEL = { en: 'EN', sw: 'SW', ja: 'JP' };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  try {

    /* ---------- storage (may be blocked: private mode, blocked site data) ---------- */
    var readLang = function () {
      try {
        var v = window.localStorage.getItem(STORAGE_KEY);
        return LANGS.indexOf(v) > -1 ? v : null;
      } catch (e) { return null; }
    };
    var writeLang = function (lang) {
      try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* choice just isn't remembered */ }
    };

    var header = document.querySelector('[data-header]');
    var menuBtn = document.querySelector('.menu-btn');
    var nav = document.getElementById('site-nav');
    var mqDesktop = window.matchMedia('(min-width: 60em)');

    /* ---------- 1. language menu ----------
       Each .lang block is one toggle button plus a list of three option buttons. One tap on the toggle opens the list; one tap
       on a language applies it everywhere (both menus stay in step) and closes the list. Escape or a tap outside closes it too. */
    var menus = [].slice.call(document.querySelectorAll('[data-lang-menu]'));
    var switchers = [].slice.call(document.querySelectorAll('[data-set-lang]'));
    var titleEl = document.querySelector('title');
    var descEl = document.querySelector('meta[name="description"]');
    var altEls = [].slice.call(document.querySelectorAll('[data-alt-sw]'));

    var original = {
      title: titleEl ? titleEl.textContent : '',
      desc: descEl ? descEl.getAttribute('content') : ''
    };
    altEls.forEach(function (el) { el.setAttribute('data-alt-en', el.getAttribute('alt') || ''); });

    var closeLangMenu = function (menu, returnFocus) {
      var t = menu.querySelector('.lang__toggle'), list = menu.querySelector('.lang__list');
      if (!t || !list || list.hidden) return;
      list.hidden = true;
      t.setAttribute('aria-expanded', 'false');
      if (returnFocus) t.focus();
    };
    var openLangMenu = function (menu) {
      menus.forEach(function (m) { if (m !== menu) closeLangMenu(m, false); });
      var t = menu.querySelector('.lang__toggle'), list = menu.querySelector('.lang__list');
      list.hidden = false;
      t.setAttribute('aria-expanded', 'true');
      var current = list.querySelector('[aria-pressed="true"]') || list.querySelector('button');
      if (current) current.focus();
    };

    var applyLang = function (lang, persist) {
      if (LANGS.indexOf(lang) < 0) lang = 'en';
      root.setAttribute('data-lang', lang);
      root.setAttribute('lang', lang);

      switchers.forEach(function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-set-lang') === lang ? 'true' : 'false');
      });
      menus.forEach(function (m) {
        var code = m.querySelector('.lang__code');
        if (code) code.textContent = LABEL[lang];
        var t = m.querySelector('.lang__toggle');
        if (t) t.setAttribute('aria-label', LABEL[lang] + ' — Language / Lugha / 言語');   // starts with the visible code (label in name)
      });

      if (titleEl) titleEl.textContent = lang === 'en' ? original.title : (titleEl.getAttribute('data-' + lang) || original.title);
      if (descEl) descEl.setAttribute('content', lang === 'en' ? original.desc : (descEl.getAttribute('data-' + lang) || original.desc));
      altEls.forEach(function (el) {
        el.setAttribute('alt', el.getAttribute('data-alt-' + lang) || el.getAttribute('data-alt-en'));
      });

      // aria-labels with translations (data-label-sw / -ja); the English original is kept in data-label-en.
      [].forEach.call(document.querySelectorAll('[data-label-sw]'), function (el) {
        if (!el.hasAttribute('data-label-en')) el.setAttribute('data-label-en', el.getAttribute('aria-label') || el.getAttribute('data-label') || '');
        var v = lang === 'en' ? el.getAttribute('data-label-en') : el.getAttribute('data-label-' + lang);
        if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', v); else el.setAttribute('data-label', v);
      });
      var dw = document.querySelector('.hero__dots');
      if (dw) {
        var word = dw.getAttribute('data-label') || 'Photo';
        [].forEach.call(dw.querySelectorAll('.hero__dot'), function (b) { b.setAttribute('aria-label', word + ' ' + b.getAttribute('data-n')); });
      }

      if (persist) writeLang(lang);
      syncMenuTop();
      if (typeof syncHeroCaption === 'function') syncHeroCaption();
    };

    menus.forEach(function (menu) {
      var t = menu.querySelector('.lang__toggle'), list = menu.querySelector('.lang__list');
      if (!t || !list) return;
      t.addEventListener('click', function () {
        if (list.hidden) openLangMenu(menu); else closeLangMenu(menu, false);
      });
      list.addEventListener('keydown', function (e) {
        var opts = [].slice.call(list.querySelectorAll('button'));
        var i = opts.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var n = e.key === 'ArrowDown' ? (i + 1) % opts.length : (i - 1 + opts.length) % opts.length;
          opts[n].focus();
        } else if (e.key === 'Home' || e.key === 'End') {
          e.preventDefault();
          opts[e.key === 'Home' ? 0 : opts.length - 1].focus();
        } else if (e.key === 'Tab') {
          closeLangMenu(menu, false);
        }
      });
    });
    switchers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyLang(btn.getAttribute('data-set-lang'), true);
        var menu = btn.closest('[data-lang-menu]');
        if (menu) closeLangMenu(menu, true);
      });
    });
    document.addEventListener('click', function (e) {
      menus.forEach(function (m) { if (!m.contains(e.target)) closeLangMenu(m, false); });
    });

    /* ---------- 2. mobile menu ---------- */
    // While the full-screen sheet is open everything outside the header is inert.
    var setBackgroundInert = function (on) {
      [].forEach.call(document.body.children, function (el) {
        var tag = el.tagName.toLowerCase();
        if (el === header || tag === 'script' || tag === 'svg') return;
        if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
      });
    };

    // The sheet is position:fixed from the top of the screen. Start the links below the header bar wherever it currently is.
    function syncMenuTop() {
      if (!nav || !header) return;
      if (header.classList.contains('is-menu-open')) {
        nav.style.paddingTop = Math.round(header.getBoundingClientRect().bottom + 16) + 'px';
      } else {
        nav.style.paddingTop = '';
      }
    }

    var setMenu = function (open, returnFocus) {
      if (!header || !menuBtn) return;
      header.classList.toggle('is-menu-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
      setBackgroundInert(open);
      syncMenuTop();
      if (open) {
        var first = nav && nav.querySelector('a');
        if (first) first.focus();
      } else if (returnFocus) {
        menuBtn.focus();
      }
    };

    if (menuBtn && nav) {
      menuBtn.addEventListener('click', function () {
        setMenu(menuBtn.getAttribute('aria-expanded') !== 'true', true);
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) setMenu(false, false);
      });
      var brand = header.querySelector('.brand');
      if (brand) brand.addEventListener('click', function () { if (header.classList.contains('is-menu-open')) setMenu(false, false); });
      var onBreakpoint = function () { if (mqDesktop.matches) setMenu(false, false); };
      if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', onBreakpoint);
      else if (mqDesktop.addListener) mqDesktop.addListener(onBreakpoint);
      window.addEventListener('resize', syncMenuTop);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var openLang = menus.filter(function (m) { var l = m.querySelector('.lang__list'); return l && !l.hidden; });
      if (openLang.length) { openLang.forEach(function (m) { closeLangMenu(m, true); }); return; }
      if (menuBtn && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });

    /* ---------- 3. header: transparent over the hero, solid after it ---------- */
    var hero = document.querySelector('.hero, .page-hero');
    if (header && hero && 'IntersectionObserver' in window) {
      var headerH = header.getBoundingClientRect().height || 72;
      new IntersectionObserver(function (entries) {
        header.classList.toggle('is-solid', !entries[0].isIntersecting);
      }, { rootMargin: '-' + Math.round(headerH + 16) + 'px 0px 0px 0px', threshold: 0 }).observe(hero);
    } else if (header) {
      header.classList.add('is-solid');
    }

    /* ---------- 4. current-section marker ---------- */
    // The homepage header menu marks the section in view (IntersectionObserver below); the detail page's jump bar has its own scroll-based marker.
    var links = [].slice.call(document.querySelectorAll('.site-nav a[href^="#"]')).filter(function (a) {
      var id = a.getAttribute('href').slice(1);
      return id && document.getElementById(id);
    });
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    if ('IntersectionObserver' in window && links.length) {
      var visible = {};
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
        var best = null, bestRatio = 0;
        targets.forEach(function (t) {
          if ((visible[t.id] || 0) > bestRatio) { best = t.id; bestRatio = visible[t.id]; }
        });
        links.forEach(function (a) {
          if (best && a.getAttribute('href') === '#' + best) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.01, 0.25, 0.5, 1] });
      targets.forEach(function (t) { spy.observe(t); });
    }

    var jumpLinks = [].slice.call(document.querySelectorAll('.wwd-jump a[href^="#"]')).filter(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    if (jumpLinks.length && header) {
      var jumpBar = document.querySelector('.wwd-jump'), jt = false;
      var markJump = function () {
        jt = false;
        var line = header.getBoundingClientRect().height + jumpBar.getBoundingClientRect().height + 24, best = null;
        jumpLinks.forEach(function (a) { if (document.getElementById(a.getAttribute('href').slice(1)).getBoundingClientRect().top <= line) best = a; });
        jumpLinks.forEach(function (a) { if (a === best) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      };
      window.addEventListener('scroll', function () { if (!jt) { jt = true; window.requestAnimationFrame(markJump); } }, { passive: true });
      markJump();
    }

    /* ---------- 5. footer menu follows the header menu ---------- */
    [].forEach.call(document.querySelectorAll('[data-mirror-nav]'), function (mirror) {
      var source = document.querySelector(mirror.getAttribute('data-mirror-nav') + ' ul');
      var target = mirror.querySelector('ul');
      if (source && target && source.children.length) target.innerHTML = source.innerHTML;
    });

    /* ---------- 6. hero slider ----------
       The photographs sit side by side; every few seconds the next one slides in from the right and the current one leaves to
       the left (the last wraps round to the first). Dots, arrows, swipe and the arrow keys move it by hand.
       Slide 1 is real (fetched) from the start; slides 2+ carry data-srcset / data-src, so the browser fetches nothing for them
       unless this code promotes those attributes. That happens only here, only when motion is allowed. A visitor who prefers
       reduced motion, or whose JS fails, sees slide 1 as a still photograph and never downloads the others.
       Autoplay pauses while the pointer is over the photographs, while keyboard focus is in the controls, and while the tab is
       hidden; a manual move restarts the timer. */
    var heroEl = document.querySelector('.hero');
    var heroMedia = document.querySelector('[data-hero-rotate]');
    var slides = heroMedia ? [].slice.call(heroMedia.querySelectorAll('.hero__slide')) : [];
    var caps = [].slice.call(document.querySelectorAll('.hero__caption-text [data-cap]'));
    var countEl = document.querySelector('.hero__count');
    var current = 0;
    var syncHeroCaption = function () {
      caps.forEach(function (c, i) { c.classList.toggle('is-active', i === current); });
      if (countEl) countEl.textContent = pad(current + 1) + ' / ' + pad(slides.length);
    };
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    if (heroEl && heroMedia && slides.length > 1 && !reduceMotion.matches) {
      var dotsWrap = heroEl.querySelector('.hero__dots');
      var prevBtn = heroEl.querySelector('[data-hero-prev]');
      var nextBtn = heroEl.querySelector('[data-hero-next]');
      var interval = parseFloat(getComputedStyle(root).getPropertyValue('--hero-interval')) * 1000 || 6000;
      var slideMs = parseFloat(getComputedStyle(root).getPropertyValue('--dur-slide')) || 1100;
      var timer = null, busy = false, hovering = false, focusing = false, stopped = false, offscreen = false;

      slides.slice(1).forEach(function (slide) {
        [].forEach.call(slide.querySelectorAll('source[data-srcset]'), function (s) { s.setAttribute('srcset', s.getAttribute('data-srcset')); });
        var img = slide.querySelector('img[data-src]');
        if (img) img.setAttribute('src', img.getAttribute('data-src'));
      });

      var dots = [];
      if (dotsWrap) {
        slides.forEach(function (s, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'hero__dot';
          b.setAttribute('data-n', (i + 1) + ' / ' + slides.length);
          b.setAttribute('aria-label', (dotsWrap.getAttribute('data-label') || 'Photo') + ' ' + (i + 1) + ' / ' + slides.length);
          if (i === 0) b.setAttribute('aria-current', 'true');
          b.addEventListener('click', function () { var d = i > current ? 1 : -1; whenReady(i, function () { go(i, d, true); }); });
          dotsWrap.appendChild(b);
          dots.push(b);
        });
      }

      // The progress line on the current dot and the timer always restart together, so the line reaching its end is the move.
      var paused = false;
      var restartProgress = function () {
        heroEl.classList.remove('is-playing'); void heroEl.offsetWidth; heroEl.classList.add('is-playing');
      };
      var setPlaying = function () {
        var p = stopped || hovering || focusing || offscreen || document.hidden;
        if (p === paused && timer) return;
        paused = p;
        heroEl.classList.toggle('is-paused', p);
        if (p) { window.clearInterval(timer); timer = null; }
        else { restartProgress(); restart(); }
      };

      // A photograph is "ready" once it is fetched AND decoded, so the move never stalls on decoding a large image mid-slide.
      var ready = function (i) { var im = slides[i].querySelector('img'); return !!(im && im.complete && im.naturalWidth); };
      var prepare = function (i) {
        var im = slides[i].querySelector('img');
        if (im && im.decode) im.decode().catch(function () {});
      };
      var whenReady = function (i, cb) {
        if (ready(i)) { cb(); return; }
        var im = slides[i].querySelector('img'), done = false;
        var fire = function () { if (!done) { done = true; cb(); } };
        im.addEventListener('load', fire, { once: true });
        window.setTimeout(fire, 2500);                            // slow connection: go anyway rather than stay stuck
      };
      slides.forEach(function (s, i) { var im = s.querySelector('img'); if (i && im) im.addEventListener('load', function () { if (i === (current + 1) % slides.length) prepare(i); }); });

      var go = function (next, dir, manual) {
        if (busy || next === current) return;
        busy = true;
        var from = slides[current], to = slides[next];
        var fromPic = from.querySelector('picture'), toPic = to.querySelector('picture');
        // Put the incoming slide on the correct side without animating, then animate both.
        to.classList.remove('is-anim');
        to.style.transform = 'translate3d(' + (dir > 0 ? 100 : -100) + '%,0,0)';
        to.style.visibility = 'visible';
        if (toPic) toPic.style.setProperty('--px', (dir > 0 ? -10 : 10) + '%');
        void to.offsetWidth;                                     // commit the start position
        to.classList.add('is-anim');
        from.classList.add('is-anim', 'is-leaving');
        to.style.transform = '';
        if (toPic) toPic.style.setProperty('--px', '0%');
        if (fromPic) fromPic.style.setProperty('--px', (dir > 0 ? 10 : -10) + '%');
        to.classList.add('is-active');
        from.classList.remove('is-active');
        from.style.transform = 'translate3d(' + (dir > 0 ? -100 : 100) + '%,0,0)';
        to.setAttribute('aria-hidden', 'false');
        from.setAttribute('aria-hidden', 'true');
        if (dots.length) { dots[current].removeAttribute('aria-current'); dots[next].setAttribute('aria-current', 'true'); }
        current = next;
        syncHeroCaption();
        restartProgress();
        window.setTimeout(function () {
          from.classList.remove('is-anim', 'is-leaving');
          from.style.transform = ''; from.style.visibility = '';
          if (fromPic) fromPic.style.removeProperty('--px');
          prepare((current + 1) % slides.length);
          to.style.visibility = '';
          busy = false;
        }, slideMs + 50);
        if (manual) restart();
      };
      var step = function (dir, manual) {
        var n = (current + dir + slides.length) % slides.length;
        if (manual) whenReady(n, function () { go(n, dir, true); });
        else if (ready(n)) go(n, dir, false);                    // autoplay never shows a photograph that is not loaded yet
      };

      // The pause button (WCAG 2.2.2): a visitor-chosen stop that stays until they press it again.
      var pauseBtn = heroEl.querySelector('[data-hero-pause]');
      if (pauseBtn) pauseBtn.addEventListener('click', function () {
        stopped = !stopped;
        pauseBtn.setAttribute('aria-pressed', stopped ? 'true' : 'false');
        setPlaying();
      });
      var tick = function () { if (!paused) step(1, false); };
      var restart = function () {
        window.clearInterval(timer);
        timer = paused ? null : window.setInterval(tick, interval);
      };

      if (prevBtn) prevBtn.addEventListener('click', function () { step(-1, true); });
      if (nextBtn) nextBtn.addEventListener('click', function () { step(1, true); });

      // Only a real mouse pointer pauses on hover. Touch browsers fire "mouseenter" on a tap and keep the hover state until the next tap
      // elsewhere, which would freeze autoplay after any tap on the hero.
      heroEl.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; setPlaying(); } });
      heroEl.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovering = false; setPlaying(); } });
      // No point animating (and decoding) photographs nobody can see: pause while the hero is scrolled out of view.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { offscreen = !en[0].isIntersecting; setPlaying(); }, { threshold: 0.15 }).observe(heroEl);
      }
      var controls = heroEl.querySelector('.hero__controls');
      if (controls) {
        // Keyboard focus pauses (a keyboard user should not chase a moving target); a mouse click, which also focuses the button, does not.
        controls.addEventListener('focusin', function (e) {
          var kb = true; try { kb = e.target.matches(':focus-visible'); } catch (x) {}
          if (kb) { focusing = true; setPlaying(); }
        });
        controls.addEventListener('focusout', function () { focusing = false; setPlaying(); });
        controls.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { e.preventDefault(); step(1, true); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1, true); }
        });
      }
      document.addEventListener('visibilitychange', setPlaying);

      // Swipe (touch and pen): a horizontal drag of 40px or more moves one slide. Vertical scrolling is left to the browser.
      var sx = null, sy = null;
      heroEl.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' && !e.target.closest('button, a')) { sx = e.clientX; sy = e.clientY; }
      });
      heroEl.addEventListener('pointerup', function (e) {
        if (sx === null) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        sx = sy = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1, true);
      });
      heroEl.addEventListener('pointercancel', function () { sx = sy = null; });

      prepare(1);
      heroEl.classList.add('has-slider');
      restartProgress();
      restart();
    }
    syncHeroCaption();

    /* ---------- 7. scroll reveal ---------- */
    // Elements marked data-reveal (or the children of data-reveal-group) fade up once as they enter the window.
    // CSS only hides them under .js-ready and when motion is allowed, so without JS they are simply visible.
    var revealEls = [].slice.call(document.querySelectorAll('[data-reveal], [data-reveal-group]'));
    if (revealEls.length && 'IntersectionObserver' in window && !reduceMotion.matches) {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealEls.forEach(function (el) { ro.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }

    // English is the default; a saved SW/JP choice was already applied by the boot script — sync titles/alts/menus to it.
    applyLang(readLang() || 'en', false);

  } finally {
    // Always runs, even if something above threw: the language and menu controls must not stay hidden.
    root.classList.add('js-ready');
  }
})();
