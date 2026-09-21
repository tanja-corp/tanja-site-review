/* TANJA Web V2 — script.js
   Progressive enhancement only. The page is fully readable in English with JavaScript off.
   Jobs: (1) language switch + remembered choice, (2) mobile menu, (3) header over the hero,
         (4) current-section marker, (5) footer menu copies the header menu.
   No libraries, no network requests.

   Load order: the inline boot script in <head> adds html.js before first paint (layout rules use it), and
   restores a saved SW/JP choice. This file adds html.js-ready when it has run (controls become visible).
   If this file fails to load, <script onerror> removes html.js and the plain layout returns. */
(function () {
  'use strict';

  var STORAGE_KEY = 'tanja-lang';           // same key as the inline boot script in index.html <head>
  var LANGS = ['en', 'sw', 'ja'];           // the boot script lists 'sw' and 'ja' separately; keep both in step
  var root = document.documentElement;

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

    /* ---------- 1. language ---------- */
    var switchers = [].slice.call(document.querySelectorAll('[data-set-lang]'));
    var titleEl = document.querySelector('title');
    var descEl = document.querySelector('meta[name="description"]');
    var altEls = [].slice.call(document.querySelectorAll('[data-alt-sw]'));

    // Keep the English originals so we can switch back.
    var original = {
      title: titleEl ? titleEl.textContent : '',
      desc: descEl ? descEl.getAttribute('content') : ''
    };
    altEls.forEach(function (el) { el.setAttribute('data-alt-en', el.getAttribute('alt') || ''); });

    var applyLang = function (lang, persist) {
      if (LANGS.indexOf(lang) < 0) lang = 'en';
      root.setAttribute('data-lang', lang);
      root.setAttribute('lang', lang);

      switchers.forEach(function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-set-lang') === lang ? 'true' : 'false');
      });

      if (titleEl) titleEl.textContent = lang === 'en' ? original.title : (titleEl.getAttribute('data-' + lang) || original.title);
      if (descEl) descEl.setAttribute('content', lang === 'en' ? original.desc : (descEl.getAttribute('data-' + lang) || original.desc));
      altEls.forEach(function (el) {
        el.setAttribute('alt', el.getAttribute('data-alt-' + lang) || el.getAttribute('data-alt-en'));
      });

      if (persist) writeLang(lang);
      syncMenuTop();                                   // an open menu sheet re-measures where the header bar ends
    };

    switchers.forEach(function (btn) {
      btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-set-lang'), true); });
    });

    /* ---------- 2. mobile menu ---------- */
    // While the full-screen sheet is open everything outside the header is inert, so keyboard focus and
    // screen readers cannot reach the page hidden behind it (skip link, draft strip, main, footer, and any section added later).
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
        if (e.target.closest('a')) setMenu(false, false);          // anchor navigation closes the sheet
      });
      var brand = header.querySelector('.brand');                    // the wordmark is outside the sheet but is also a link to the top
      if (brand) brand.addEventListener('click', function () { if (header.classList.contains('is-menu-open')) setMenu(false, false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false, true);
      });
      var onBreakpoint = function () { if (mqDesktop.matches) setMenu(false, false); };
      if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', onBreakpoint);
      else if (mqDesktop.addListener) mqDesktop.addListener(onBreakpoint);
      window.addEventListener('resize', syncMenuTop);
    }

    // English is the default; a saved SW/JP choice was already applied by the boot script — sync titles/alts/buttons to it.
    applyLang(readLang() || 'en', false);

    /* ---------- 3. header: transparent over the hero, solid after it ---------- */
    var hero = document.getElementById('home');
    if (header && hero && 'IntersectionObserver' in window) {
      // Turn solid slightly BEFORE the header would overlap the next section: an anchor jump lands 8px below the header
      // (scroll-padding-top), so the margin must exceed that or the hero would still show behind a transparent header.
      var headerH = header.getBoundingClientRect().height || 72;
      new IntersectionObserver(function (entries) {
        header.classList.toggle('is-solid', !entries[0].isIntersecting);
      }, { rootMargin: '-' + Math.round(headerH + 16) + 'px 0px 0px 0px', threshold: 0 }).observe(hero);
    } else if (header) {
      header.classList.add('is-solid');                              // no IntersectionObserver: stay readable
    }

    /* ---------- 4. current-section marker ---------- */
    // A menu link whose target does not exist (e.g. href="#", or an id that starts with a digit) is simply ignored. Only the header menu is watched.
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

    /* ---------- 5. footer menu follows the header menu ---------- */
    // The footer list is written out in the HTML so it works without JavaScript. Here it is replaced by a copy of the header list, so a
    // new menu item (e.g. News) only has to be added once, in the header. Copies carry no ids, so nothing is duplicated.
    [].forEach.call(document.querySelectorAll('[data-mirror-nav]'), function (mirror) {
      var source = document.querySelector(mirror.getAttribute('data-mirror-nav') + ' ul');
      var target = mirror.querySelector('ul');
      if (source && target && source.children.length) target.innerHTML = source.innerHTML;
    });

  } finally {
    // Always runs, even if something above threw: the language and menu controls must not stay hidden.
    root.classList.add('js-ready');
  }
})();
