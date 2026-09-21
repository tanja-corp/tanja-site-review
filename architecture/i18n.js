/* TANJA object map — i18n.js
   UI language for the viewer (ja | en). The source text in the code and in model.js is Japanese; t('日本語') returns the English
   entry from the i18n-en-*.js dictionaries when the language is English, and falls back to the Japanese text when there is none.
   t('… {n} …', {n: 3}) fills {placeholders}. The choice is remembered per browser (localStorage 'tanja-object-map-lang');
   the default follows the browser language (ja for Japanese browsers, otherwise en). */
(function () {
  'use strict';
  var KEY = 'tanja-object-map-lang', EN = {}, lang = 'ja';
  try {
    var v = window.localStorage.getItem(KEY);
    if (v === 'en' || v === 'ja') lang = v;
    else lang = /^ja/i.test((navigator.language || 'ja')) ? 'ja' : 'en';
  } catch (e) { lang = /^ja/i.test((navigator.language || 'ja')) ? 'ja' : 'en'; }

  function t(s, vars) {
    var r = s;
    if (lang === 'en' && typeof s === 'string' && Object.prototype.hasOwnProperty.call(EN, s)) r = EN[s];
    if (vars && typeof r === 'string') r = r.replace(/\{(\w+)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m; });
    return r;
  }
  window.I18N = {
    t: t,
    get lang() { return lang; },
    setLang: function (l) {
      lang = l === 'en' ? 'en' : 'ja';
      try { window.localStorage.setItem(KEY, lang); } catch (e) { /* choice just isn't remembered */ }
      document.documentElement.lang = lang;
    },
    add: function (dict) { for (var k in dict) if (Object.prototype.hasOwnProperty.call(dict, k)) EN[k] = dict[k]; },
    has: function (s) { return Object.prototype.hasOwnProperty.call(EN, s); }
  };
  document.documentElement.lang = lang;
})();
