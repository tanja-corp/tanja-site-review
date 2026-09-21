/* TANJA object map — skins.js
   Turns the computed layout into SVG strings: one "skin" per object per view, plus lines and lane backgrounds.
   Colours come from model.tokens, which check.js compares with styles.css, so the diagram uses the site's own palette. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model-core.js'), require('./layout.js'));
  else root.OMSkins = factory(root.OM, root.OMLayout);
})(typeof self !== 'undefined' ? self : this, function (OM, LY) {
  'use strict';

  var STATUS = {
    built: { ja: '実装済み', color: '#24402f', legend: '実装済み' },
    provisional: { ja: '暫定（未承認）', color: '#b7791f', legend: '暫定（実在するが未承認）' },
    placeholder: { ja: '仮置き', color: '#9c3a2d', legend: '仮置き（中身なし）' },
    planned: { ja: '将来', color: '#7c7a6c', legend: '将来（破線）' }
  };

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var textW = function (s, size) { var w = 0; for (var i = 0; i < s.length; i++) w += s.charCodeAt(i) > 0x2e80 ? size : size * 0.56; return w; };
  function fit(s, maxW, size) {
    s = String(s == null ? '' : s);
    if (textW(s, size) <= maxW) return s;
    var out = '';
    for (var i = 0; i < s.length; i++) { if (textW(out + s[i] + '…', size) > maxW) break; out += s[i]; }
    return out + '…';
  }

  function tokenMap(model) { var m = {}; (model.tokens || []).forEach(function (t) { m[t.name] = t.value; }); return m; }

  /* a small helper that gives every skin the same palette */
  function palette(model) {
    var t = tokenMap(model), g = function (n, d) { return t[n] || d; };
    return {
      paper: g('--c-surface', '#faf8f2'), paper2: g('--c-surface-2', '#f2eee4'), paper3: g('--c-surface-3', '#e7e1d2'),
      ink: g('--c-on-surface', '#1d201b'), ink2: g('--c-on-surface-2', '#474b41'), ink3: g('--c-on-surface-3', '#5f6357'),
      line: g('--c-outline-2', '#d5cfbf'), outline: g('--c-outline', '#7c7a6c'),
      primary: g('--c-primary', '#24402f'), onPrimary: g('--c-on-primary', '#ffffff'), primary2: g('--c-primary-2', '#dde7d8'),
      accent: g('--c-accent', '#9c3a2d'), inverse: g('--c-inverse', '#19231c'), onInverse: g('--c-on-inverse', '#ece9de'), onInverse2: g('--c-on-inverse-2', '#b9bdaf')
    };
  }

  function domainColor(model, o) {
    var id = o.concept && o.concept.domain;
    var dm = (model.domains || []).find(function (x) { return x.id === id; });
    return dm ? dm.color : '#3d4a40';
  }

  var label = function (o, lang) { return lang === 'en' ? (o.en || o.ja || o.id) : (o.ja || o.en || o.id); };
  var sub = function (o, lang) { return lang === 'en' ? (o.ja || '') : (o.en || ''); };

  /* small pill, returns {svg, w} */
  function pill(text, x, y, opt) {
    opt = opt || {};
    var size = opt.size || 10, w = textW(text, size) + 12, h = 16;
    var svg = '<g transform="translate(' + x + ' ' + y + ')"><rect width="' + w + '" height="' + h + '" rx="8" fill="' + (opt.fill || 'none') + '" stroke="' + (opt.stroke || 'none') + '"/>' +
      '<text x="' + w / 2 + '" y="11.5" text-anchor="middle" font-size="' + size + '" fill="' + (opt.color || '#474b41') + '"' + (opt.mono ? ' class="mono"' : '') + '>' + esc(text) + '</text></g>';
    return { svg: svg, w: w };
  }

  /* ----------------------------------------------------------- design */
  function bar(x, y, w, h, fill, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 3 : r) + '" fill="' + fill + '"/>'; }

  function mockSvg(mock, area, c, ctx, o) {
    var P = ctx.P, x = area.x, y = area.y, w = area.w, h = area.h, s = '';
    var photo = function (px, py, pw, ph) {
      return '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="3" fill="' + P.paper3 + '"/>' +
        '<path d="M' + (px + pw * .18) + ' ' + (py + ph * .72) + ' l' + pw * .2 + ' -' + ph * .26 + ' l' + pw * .16 + ' ' + ph * .16 + ' l' + pw * .14 + ' -' + ph * .2 + ' l' + pw * .2 + ' ' + ph * .3 + '" fill="none" stroke="' + P.outline + '" stroke-opacity=".55" stroke-width="1.4"/>';
    };
    var lines = function (lx, ly, lw, n, gap) { var o2 = ''; for (var i = 0; i < n; i++) o2 += bar(lx, ly + i * (gap || 11), lw * (i === n - 1 ? .62 : 1), 6, P.line); return o2; };
    switch (mock) {
      case 'hero':
        s += '<defs><linearGradient id="g-hero" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a6a52"/><stop offset="1" stop-color="#1f2f24"/></linearGradient></defs>' +
          '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="url(#g-hero)"/>' +
          '<text x="' + (x + 18) + '" y="' + (y + h - 44) + '" font-size="34" font-weight="700" fill="#fff" letter-spacing="7">TANJA</text>' +
          bar(x + 18, y + h - 28, 120, 6, 'rgba(255,255,255,.6)') + bar(x + 18, y + 12, 56, 6, 'rgba(255,255,255,.5)') + bar(x + w - 150, y + 12, 130, 6, 'rgba(255,255,255,.5)');
        break;
      case 'company': {
        var lw = w * .5 - 8;
        for (var i = 0; i < 3; i++) s += bar(x, y + i * 24, 34, 6, P.line) + bar(x + 46, y + i * 24, lw - 60, 6, P.ink3 === P.line ? P.line : '#b9b3a2') + '<rect x="' + x + '" y="' + (y + i * 24 + 12) + '" width="' + lw + '" height="1" fill="' + P.line + '"/>';
        s += lines(x, y + 84, lw, 4, 11) + photo(x + w * .5 + 4, y, w * .5 - 4, h);
        break; }
      case 'cards': {
        var n = Math.min(12, Math.max(1, (o.design.repeat && +o.design.repeat.shown) || 3)), gap = 10, cw = (w - gap * (n - 1)) / n, ph = Math.min(h - 34, cw * 1.25);
        for (var k = 0; k < n; k++) {
          var cx = x + k * (cw + gap);
          s += '<rect x="' + cx + '" y="' + y + '" width="' + cw + '" height="' + ph + '" rx="3" fill="' + P.paper3 + '"/>' +
            '<circle cx="' + (cx + cw / 2) + '" cy="' + (y + ph * .4) + '" r="' + Math.min(11, cw * .12) + '" fill="none" stroke="' + P.outline + '" stroke-opacity=".6" stroke-width="1.4"/>' +
            '<path d="M' + (cx + cw / 2 - 16) + ' ' + (y + ph * .72) + ' q16 -22 32 0" fill="none" stroke="' + P.outline + '" stroke-opacity=".6" stroke-width="1.4"/>' +
            bar(cx, y + ph + 8, cw * .7, 6, '#b9b3a2') + bar(cx, y + ph + 20, cw * .5, 5, P.line);
        }
        break; }
      case 'band':
        s += '<rect x="' + (x - 10) + '" y="' + y + '" width="' + (w + 20) + '" height="' + h + '" fill="' + P.primary + '"/>';
        [0, 1].forEach(function (k) { var bx = x + k * (w / 2 + 8); s += bar(bx, y + 14, 44, 6, 'rgba(255,255,255,.75)') + bar(bx, y + 34, w / 2 - 30, 9, 'rgba(255,255,255,.5)') + bar(bx, y + 50, w / 2 - 70, 9, 'rgba(255,255,255,.35)'); });
        break;
      case 'crop-feature': {
        var pw = w * .32;
        s += photo(x, y, pw, h) + '<rect x="' + (x + pw + 18) + '" y="' + y + '" width="86" height="16" rx="8" fill="' + P.primary2 + '"/>' + bar(x + pw + 18, y + 30, w * .28, 16, '#8f8a78') + lines(x + pw + 18, y + 62, w * .5, 2, 11) + bar(x + pw + 18, y + 94, 90, 5, P.line);
        break; }
      case 'crop':
      case 'project-card': {
        var ph2 = h * .52;
        s += photo(x, y, w, ph2);
        if (mock === 'crop') s += '<rect x="' + x + '" y="' + (y + ph2 + 10) + '" width="70" height="14" rx="7" fill="' + P.primary2 + '"/>';
        s += bar(x, y + ph2 + (mock === 'crop' ? 32 : 12), w * .5, 12, '#8f8a78') + lines(x, y + ph2 + (mock === 'crop' ? 52 : 32), w * .8, 2, 10) + bar(x, y + ph2 + (mock === 'crop' ? 78 : 58), 70, 5, P.line);
        break; }
      case 'career': {
        var pw2 = w * .4;
        s += photo(x, y, pw2, h) + bar(x + pw2 + 18, y + 6, w * .3, 16, '#8f8a78') + lines(x + pw2 + 18, y + 36, w * .42, 2, 11) +
          '<rect x="' + (x + pw2 + 18) + '" y="' + (y + 74) + '" width="' + (w * .42) + '" height="26" fill="' + P.paper2 + '"/><rect x="' + (x + pw2 + 18) + '" y="' + (y + 74) + '" width="3" height="26" fill="' + P.accent + '"/>' + bar(x + pw2 + 30, y + 84, w * .3, 6, P.line);
        break; }
      case 'contact':
        [0, 1].forEach(function (k) { s += bar(x, y + k * 36, 36, 5, P.line) + bar(x, y + k * 36 + 12, w * .32, 10, '#8f8a78') + '<rect x="' + x + '" y="' + (y + k * 36 + 28) + '" width="' + (w * .5) + '" height="1" fill="' + P.line + '"/>'; });
        break;
      case 'footer': {
        s += '<rect x="' + (x - 10) + '" y="' + (y - 4) + '" width="' + (w + 20) + '" height="' + (h + 8) + '" fill="' + P.inverse + '"/>' +
          '<text x="' + x + '" y="' + (y + 20) + '" font-size="16" font-weight="700" fill="' + P.onInverse + '" letter-spacing="3">TANJA</text>';
        var navRef = ctx.d.refs.filter(function (r) { return r.in === o.id; }).map(function (r) { return ctx.d.get(r.object); }).filter(function (x) { return x && x.design && x.design.repeat; })[0];
        var navN = Math.min(8, navRef ? +navRef.design.repeat.shown : 4);
        for (var q = 0; q < navN; q++) s += bar(x + 120 + q * 60, y + 14, 44, 5, P.onInverse2);
        var refs = ctx.d.refs.filter(function (r) { return r.in === o.id; }), rx = x;
        refs.forEach(function (r) {
          var ro = ctx.d.get(r.object), t = '↪ ' + fit(label(ro, ctx.lang), 90, 10);
          var pl = pill(t, rx, y + 40, { fill: 'none', stroke: P.onInverse2, color: P.onInverse, size: 10 });
          s += pl.svg.replace('<rect ', '<rect stroke-dasharray="3 2" '); rx += pl.w + 8;
        });
        s += bar(x, y + h - 14, 130, 5, P.onInverse2);
        break; }
      case 'chips': {
        var m = Math.min(12, Math.max(1, (o.design.repeat && +o.design.repeat.shown) || 3)), g = 8, cw2 = Math.min(78, (w - g * (m - 1)) / m);
        for (var j = 0; j < m; j++) s += '<rect x="' + (x + j * (cw2 + g)) + '" y="' + (y + 2) + '" width="' + cw2 + '" height="' + Math.max(16, h - 8) + '" rx="' + Math.min(11, (h - 8) / 2) + '" fill="' + P.paper2 + '" stroke="' + P.line + '"/>';
        break; }
      case 'ghost':
        s += '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 8) + '" text-anchor="middle" font-size="30" fill="' + P.outline + '">＋</text>';
        break;
      case 'ghost-section':
        s += '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 6) + '" text-anchor="middle" font-size="12" fill="' + P.outline + '">同じ枠組みで挿入できる（CSS変更なし）</text>';
        break;
      case 'bar':
        s += '<text x="' + x + '" y="' + (y + 18) + '" font-size="15" font-weight="700" fill="' + P.ink + '" letter-spacing="3">TANJA</text>' +
          bar(x + w - 26, y + 6, 20, 2.4, P.ink, 1) + bar(x + w - 26, y + 13, 20, 2.4, P.ink, 1) + bar(x + w - 26, y + 20, 20, 2.4, P.ink, 1);
        break;
    }
    return s;
  }

  function designSkin(o, rect, ctx) {
    var P = ctx.P, w = rect.w, h = rect.h, ds = o.design, kids = (ctx.d.children.get(o.id) || []).length;
    var root = !!ds.root, ghost = !!ds.ghost || o.status === 'planned';
    var fill = root ? '#ffffff' : (kids ? (rect.depth % 2 ? P.paper2 : P.paper) : '#ffffff');
    var st = STATUS[o.status] || STATUS.built;
    var stroke = root ? P.ink2 : P.line;
    var s = '<rect class="frame" width="' + w + '" height="' + h + '" rx="' + (root ? 10 : 6) + '" fill="' + (ghost ? 'none' : fill) + '" stroke="' + stroke + '" stroke-width="' + (root ? 1.6 : 1.2) + '"' + (ghost ? ' stroke-dasharray="6 4"' : '') + '/>';
    if (o.status === 'placeholder' && !kids) s += '<rect width="' + w + '" height="' + h + '" rx="6" fill="url(#hatch)" opacity=".55" pointer-events="none"/>';
    if (o.status === 'provisional' && !kids) s += '<rect x="0" y="6" width="4" height="' + (h - 12) + '" rx="2" fill="' + STATUS.provisional.color + '"/>';

    /* mock content */
    var ins = rect.inset || [0, 0, 0, 0];
    if (ds.mock && !ghost || ds.mock && (ds.mock === 'ghost' || ds.mock === 'ghost-section')) {
      var area;
      if (kids) {
        if (ds.mock === 'bar') area = { x: 12, y: 4, w: w - 24, h: 24 };
        else if (ds.mock === 'contact') area = { x: 14, y: 34, w: w - 28, h: ins[0] - 40 };
        else area = { x: 12, y: 30, w: w - 24, h: ins[0] - 32 };
      } else area = { x: 12, y: 30, w: w - 24, h: h - 42 };
      if (ds.mock === 'hero' || ds.mock === 'footer') area = { x: 12, y: 28, w: w - 24, h: h - 40 };
      if (ds.mock === 'chips') area = { x: 6, y: 4, w: w - 12, h: h - 8 };
      if (area.w > 0 && area.h > 0) s += mockSvg(ds.mock, area, null, ctx, o);
    }

    /* label + badges */
    var titleColor = (ds.mock === 'hero' || ds.mock === 'band' || ds.mock === 'footer') ? '#fff' : P.ink;
    var lx = 10, ly = 18;
    if (ds.mock === 'chips') { lx = 8; ly = h - 6; }
    if (ds.mock === 'bar') { lx = 12; ly = h - 6; }
    var show = ds.mock !== 'chips' && ds.mock !== 'bar';
    if (show || ds.mock === 'chips') {
      var lbl = fit(label(o, ctx.lang), ds.mock === 'chips' ? w - 12 : w * .55, 12.5);
      var onDark = false;
      var tx = ds.mock === 'chips' ? '<text x="' + lx + '" y="' + (ly + 0) + '" font-size="10" fill="' + P.ink3 + '">' + esc(lbl) + '</text>'
        : '<text class="lbl" x="' + lx + '" y="' + ly + '" font-size="12.5" font-weight="700" fill="' + (onDark ? '#fff' : P.ink) + '">' + esc(lbl) + '</text>';
      if (ds.mock === 'chips') {
        s += '<text x="' + lx + '" y="' + (h - 2 + 0) + '" font-size="0"></text>';
      } else s += tx;
      if (ds.htmlId && ds.mock !== 'chips') s += '<text class="mono" x="' + (lx + textW(lbl, 12.5) + 8) + '" y="' + ly + '" font-size="10" fill="' + (onDark ? 'rgba(255,255,255,.7)' : P.ink3) + '">#' + esc(ds.htmlId) + '</text>';
    }
    if (ds.mock === 'chips') {                    // label sits under the chips
      s += '<text x="8" y="' + (h - 1) + '" font-size="9.5" fill="' + P.ink3 + '">' + esc(fit(label(o, ctx.lang), w - 40, 9.5)) + '</text>';
    }

    var bx = w - 8, by = 5;
    var badge = function (text, opt) { var p = pill(text, 0, 0, opt); bx -= p.w; s += '<g transform="translate(' + bx + ' ' + by + ')">' + p.svg + '</g>'; bx -= 4; };
    if (ds.mock !== 'chips' && ds.mock !== 'bar') {
      var light = false;
      var bcol = light ? '#fff' : P.ink2, bstroke = light ? 'rgba(255,255,255,.6)' : P.outline, bfill = light ? 'rgba(0,0,0,.25)' : '#fff';
      if (ds.slot) badge('slot ' + ds.slot, { color: bcol, stroke: bstroke, fill: bfill, mono: true });
      if (ds.repeat) badge('×' + ds.repeat.shown + '（' + ds.repeat.min + '–' + ds.repeat.max + '）', { color: bcol, stroke: bstroke, fill: bfill });
      if (OM.isEntity(o) && o.er.fields.some(function (f) { return f.i18n; })) badge('3言語', { color: bcol, stroke: bstroke, fill: bfill });
      var stp = pill(st.ja, 0, 0, { color: '#fff', fill: st.color, size: 9.5 }); bx -= stp.w; s += '<g transform="translate(' + bx + ' ' + by + ')">' + stp.svg + '</g>';
    } else if (ds.mock === 'chips') {
      var dotc = st.color; s += '<circle cx="' + (w - 10) + '" cy="' + (h - 8) + '" r="3.5" fill="' + dotc + '"/>';
      if (ds.repeat) s += '<text x="' + (w - 18) + '" y="' + (h - 5) + '" text-anchor="end" font-size="9.5" fill="' + P.ink3 + '">×' + ds.repeat.shown + '</text>';
    } else {
      s += '<circle cx="' + (w - 70) + '" cy="' + (h - 10) + '" r="3.5" fill="' + st.color + '"/>';
    }
    return s;
  }

  /* ---------------------------------------------------------- concept */
  function conceptSkin(o, rect, ctx) {
    var P = ctx.P, w = rect.w, h = rect.h, col = domainColor(ctx.model, o), st = STATUS[o.status] || STATUS.built;
    var ghost = o.status === 'planned';
    var s = '<rect class="frame" width="' + w + '" height="' + h + '" rx="10" fill="' + (ghost ? P.paper : '#fff') + '" stroke="' + col + '" stroke-width="1.5"' + (ghost ? ' stroke-dasharray="5 4"' : '') + '/>' +
      '<rect x="0" y="0" width="6" height="' + h + '" rx="3" fill="' + col + '"' + (ghost ? ' opacity=".45"' : '') + '/>' +
      '<text class="lbl" x="17" y="' + (h / 2 - 2) + '" font-size="12.5" font-weight="700" fill="' + P.ink + '">' + esc(fit(label(o, ctx.lang), w - 40, 12.5)) + '</text>' +
      '<text x="17" y="' + (h / 2 + 15) + '" font-size="10" fill="' + P.ink3 + '">' + esc(fit(sub(o, ctx.lang), w - 30, 10)) + '</text>' +
      '<circle cx="' + (w - 13) + '" cy="13" r="4" fill="' + st.color + '"><title>' + esc(st.ja) + '</title></circle>';
    if (o.kind === 'row') s += '<text x="' + (w - 10) + '" y="' + (h - 8) + '" text-anchor="end" font-size="9" fill="' + col + '">行</text>';
    return s;
  }

  function laneSvg(lane, ctx) {
    var col = lane.domain.color;
    return '<g transform="translate(' + lane.x + ' ' + lane.y + ')"><rect width="' + lane.w + '" height="' + lane.h + '" rx="16" fill="' + col + '" fill-opacity=".05" stroke="' + col + '" stroke-opacity=".28"/>' +
      '<text x="18" y="27" font-size="14" font-weight="700" fill="' + col + '">' + esc(ctx.lang === 'en' ? lane.domain.en : lane.domain.ja) + '</text>' +
      '<text x="18" y="41" font-size="10" fill="' + ctx.P.ink3 + '">' + esc(ctx.lang === 'en' ? lane.domain.ja : lane.domain.en) + '</text></g>';
  }

  /* --------------------------------------------------------------- ER */
  var TYPE_LABEL = { id: 'id', text: 'text', int: 'int', bool: 'bool', enum: 'enum', image: 'image', url: 'url', email: 'email', date: 'date', ref: 'ref', fk: 'fk' };

  function erTableSkin(o, table, rect, ctx) {
    var P = ctx.P, w = rect.w, h = rect.h, ER = LY.ER, col = domainColor(ctx.model, o), st = STATUS[o.status] || STATUS.built;
    var ghost = o.status === 'planned';
    var s = '<rect class="frame" width="' + w + '" height="' + h + '" rx="7" fill="#fff" stroke="' + (ghost ? P.outline : '#3d4a40') + '" stroke-width="1.3"' + (ghost ? ' stroke-dasharray="6 4"' : '') + '/>' +
      '<path d="M0 ' + ER.head + ' V7 a7 7 0 0 1 7 -7 H' + (w - 7) + ' a7 7 0 0 1 7 7 V' + ER.head + ' Z" fill="' + col + '"' + (ghost ? ' fill-opacity=".55"' : '') + '/>' +
      '<text class="mono" x="12" y="21" font-size="14" font-weight="700" fill="#fff">' + esc(table.name) + '</text>' +
      '<text x="12" y="37" font-size="10.5" fill="rgba(255,255,255,.88)">' + esc(fit(label(o, ctx.lang) + (ctx.lang === 'en' ? '' : ''), w - 90, 10.5)) + '</text>' +
      '<circle cx="' + (w - 14) + '" cy="15" r="4.5" fill="' + st.color + '" stroke="#fff" stroke-width="1.2"><title>' + esc('ページ上のオブジェクトの状態：' + st.ja + '（このテーブル自体は案）') + '</title></circle>';
    table.fields.forEach(function (f, i) {
      var y = ER.head + i * ER.row;
      if (i % 2) s += '<rect x="1" y="' + y + '" width="' + (w - 2) + '" height="' + ER.row + '" fill="' + P.paper + '"/>';
      var tag = f.pk ? 'PK' : (f.fk ? 'FK' : '');
      if (tag) s += '<text class="mono" x="10" y="' + (y + 15) + '" font-size="9" font-weight="700" fill="' + (f.pk ? P.primary : '#3f6472') + '">' + tag + '</text>';
      var nameX = 32, nm = f.name + (f.nullable ? '?' : '');
      s += '<text class="mono' + (f.placeholder ? ' ph' : '') + '" x="' + nameX + '" y="' + (y + 15) + '" font-size="11.5" fill="' + (f.derived ? '#3f6472' : P.ink) + '"' + (f.derived ? ' font-style="italic"' : '') + (f.req ? ' font-weight="700"' : '') + '>' + esc(fit(nm, 118, 11.5)) + '</text>';
      var tx = w - 10;
      s += '<text x="' + tx + '" y="' + (y + 15) + '" text-anchor="end" font-size="10" fill="' + P.ink3 + '">' + esc(f.fk ? '→ ' + (ctx.d.tables.get(f.fk) ? ctx.d.tables.get(f.fk).name : f.fk) : (TYPE_LABEL[f.type] || f.type)) + '</text>';
      var fx = nameX + textW(nm, 11.5) * 0.98 + 6;
      if (f.i18n) { var p1 = pill('3言語', fx, y + 3, { size: 8.5, color: '#3f6472', stroke: '#3f6472' }); s += p1.svg; fx += p1.w + 3; }
      if (f.placeholder) { var p2 = pill('仮', fx, y + 3, { size: 8.5, color: '#fff', fill: STATUS.provisional.color }); s += p2.svg; }
      if (f.note) s += '<title>' + esc(f.name + ' — ' + f.note) + '</title>';
    });
    var by = ER.head + table.fields.length * ER.row + ER.pad;
    if (table.rows.length) s += '<text x="12" y="' + (by + 9) + '" font-size="9.5" fill="' + P.ink3 + '">行（' + table.rows.length + '）</text>';
    if (rect.hasRepeat) {
      var rp = o.design.repeat;
      s += '<text x="12" y="' + (h - 9) + '" font-size="10" fill="' + P.ink3 + '">ページ上の表示 ×' + rp.shown + '（' + rp.min + '〜' + rp.max + '件）</text>';
    }
    return s;
  }

  function erRowSkin(o, rect, ctx) {
    var st = STATUS[o.status] || STATUS.built;
    var name = (o.er && o.er.values && (o.er.values.key || o.er.values.slug || o.er.values.slot_no)) || o.en;
    var t = o.id.indexOf('slot-') === 0 ? 'Slot ' + name : name;
    return '<rect class="frame" width="' + rect.w + '" height="' + rect.h + '" rx="11" fill="' + ctx.P.primary2 + '" stroke="' + st.color + '" stroke-width="1.2"/>' +
      '<text class="mono" x="' + rect.w / 2 + '" y="' + (rect.h / 2 + 4) + '" text-anchor="middle" font-size="10.5" fill="' + ctx.P.primary + '">' + esc(fit(t, rect.w - 10, 10.5)) + '</text>';
  }

  /* ------------------------------------------------------------ lines */
  function arrowHead(x, y, dir, color) {              // tip at (x,y), pointing into the node from `dir`
    return '<path d="M' + x + ' ' + y + ' l' + (-dir * 9) + ' -4.5 v9 z" fill="' + color + '"/>';
  }

  function endMark(pt, kind, optional, color) {
    var x = pt.x, y = pt.y, d = pt.dir, s = '';
    if (kind === 'many') s += '<path d="M' + (x + d * 14) + ' ' + y + ' L' + x + ' ' + (y - 7) + ' M' + (x + d * 14) + ' ' + y + ' L' + x + ' ' + y + ' M' + (x + d * 14) + ' ' + y + ' L' + x + ' ' + (y + 7) + '" stroke="' + color + '" stroke-width="1.5" fill="none"/>';
    else s += '<path d="M' + (x + d * 8) + ' ' + (y - 6) + ' v12 M' + (x + d * 13) + ' ' + (y - 6) + ' v12" stroke="' + color + '" stroke-width="1.5" fill="none"/>';
    if (optional) s += '<circle cx="' + (x + d * (kind === 'many' ? 21 : 19)) + '" cy="' + y + '" r="3.6" fill="#fff" stroke="' + color + '" stroke-width="1.4"/>';
    return s;
  }

  function verbOf(e, lang) { return e.verb ? (lang === 'en' ? e.verb.en : e.verb.ja) : ''; }

  function labelSvg(x, y, text, color, cls) {
    if (!text) return '';
    var w = textW(text, 10.5) + 12;
    return '<g class="elabel ' + (cls || '') + '" transform="translate(' + x + ' ' + y + ')"><rect x="' + (-w / 2) + '" y="-9" width="' + w + '" height="17" rx="8.5" fill="#faf8f2" stroke="' + color + '" stroke-opacity=".5"/><text y="3.5" text-anchor="middle" font-size="10.5" fill="' + color + '">' + esc(text) + '</text></g>';
  }

  function conceptEdgeSvg(r, ctx) {
    var e = r.edge, contain = e.kind === 'contain', col = contain ? '#a29d8b' : '#59604f';
    var tip = r.to;
    return '<g class="edge' + (contain ? ' contain' : '') + '" data-from="' + esc(e.from) + '" data-to="' + esc(e.to) + '" data-id="' + esc(e.id) + '">' +
      '<path class="hit" d="' + r.d + '" fill="none" stroke="transparent" stroke-width="12"/>' +
      '<path class="halo" d="' + r.d + '" fill="none" stroke="#faf8f2" stroke-width="4" stroke-opacity=".85"/>' +
      '<path class="line" d="' + r.d + '" fill="none" stroke="' + col + '" stroke-width="1.4"' + (contain ? ' stroke-dasharray="4 4"' : '') + '/>' +
      arrowHead(tip.x, tip.y, tip.dir, col) +
      (r.dupLabel ? labelSvg(r.label.x, r.label.y, verbOf(e, ctx.lang), col, 'lbl-edge dup') : labelSvg(r.label.x, r.label.y, verbOf(e, ctx.lang), col, 'lbl-edge')) + '</g>';
  }

  function erEdgeSvg(r, ctx) {
    var e = r.edge, faint = e.kind === 'i18n', slot = e.kind === 'slot';
    var col = faint ? '#3f6472' : (slot ? '#3f6472' : '#2e3a30');
    var txt = verbOf(e, ctx.lang);
    if (e.kind === 'slot' && e.slots) txt += '（' + e.slots.slice(0, 3).join('・') + (e.slots.length > 3 ? '…' : '') + '）';
    return '<g class="edge ' + (faint ? 'faint' : '') + '" data-from="' + esc(e.from) + '" data-to="' + esc(e.to) + '" data-id="' + esc(e.id) + '">' +
      '<path class="hit" d="' + r.d + '" fill="none" stroke="transparent" stroke-width="12"/>' +
      '<path class="halo" d="' + r.d + '" fill="none" stroke="#faf8f2" stroke-width="4.5" stroke-opacity=".9"/>' +
      '<path class="line" d="' + r.d + '" fill="none" stroke="' + col + '" stroke-width="' + (faint ? 1 : 1.5) + '"' + (faint ? ' stroke-dasharray="3 4"' : (slot ? ' stroke-dasharray="7 3"' : '')) + '/>' +
      endMark(r.from, r.from.mark, false, col) + endMark(r.to, r.to.mark, r.optional, col) +
      (faint ? '' : labelSvg(r.label.x, r.label.y, txt, col, 'lbl-edge')) + '</g>';
  }

  function designEdgeSvg(r, ctx) {
    var col = ctx.P.accent;
    return '<g class="edge" data-from="' + esc(r.edge.from) + '" data-to="' + esc(r.edge.to) + '" data-id="' + esc(r.edge.id) + '">' +
      '<path class="line" d="' + r.d + '" fill="none" stroke="' + col + '" stroke-width="1.6" stroke-dasharray="6 4"/>' +
      arrowHead(r.to.x, r.to.y, 1, col) + labelSvg(r.label.x + 12, r.label.y, verbOf(r.edge, ctx.lang), col, 'lbl-edge') + '</g>';
  }

  function makeCtx(model, d, lang) { return { model: model, d: d, lang: lang || 'ja', P: palette(model) }; }

  return {
    STATUS: STATUS, esc: esc, fit: fit, textW: textW, palette: palette, domainColor: domainColor, label: label, sub: sub, makeCtx: makeCtx,
    designSkin: designSkin, conceptSkin: conceptSkin, erTableSkin: erTableSkin, erRowSkin: erRowSkin, laneSvg: laneSvg,
    conceptEdgeSvg: conceptEdgeSvg, erEdgeSvg: erEdgeSvg, designEdgeSvg: designEdgeSvg, verbOf: verbOf, tokenMap: tokenMap
  };
});
