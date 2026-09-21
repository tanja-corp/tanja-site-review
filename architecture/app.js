/* TANJA object map — app.js
   The canvas: one SVG, one set of objects. Switching the view moves the SAME objects to their positions in that view
   and swaps their appearance (page block ↔ concept card ↔ ER table / row). Everything is recomputed from the model
   after every edit, so a change made anywhere shows up in all three views. */
(function () {
  'use strict';
  var OM = window.OM, LY = window.OMLayout, SK = window.OMSkins;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var DRAFT_KEY = 'tanja-object-map-draft';
  function t(s, v) { return window.I18N.t(s, v); }
  var VIEWS = ['design', 'concept', 'er'];
  var VIEW_LABEL = { design: 'デザインデータ', concept: '概念図', er: 'ER図' };
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var fileJson = JSON.stringify(window.OBJECT_MODEL);
  var state = {
    model: JSON.parse(fileJson), view: 'design', sel: null, lang: window.I18N.lang, labelsAlways: true,
    hist: [], fut: [], cam: { x: 0, y: 0, k: 1 }, draft: false, issues: [], lastKey: '', lastAt: 0, stale: null, notice: '', userCam: false, unsavedInvalid: false
  };
  var L = null, ctx = null;
  var nodes = new Map(), pos = new Map();
  var raf = 0, camRaf = 0;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function h(tag, props) {
    var el = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (k === 'selected') el.selected = !!v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }

  /* ------------------------------------------------------- history / draft */
  function snapshot() { return JSON.stringify(state.model); }
  function hashOf(str) { var x = 5381; for (var i = 0; i < str.length; i++) x = ((x << 5) + x + str.charCodeAt(i)) | 0; return String(x); }
  var BASE = hashOf(fileJson);                       // which model.js a draft was made from
  var isErr = function (i) { return i.level === 'error'; };

  function persist() {
    var now = snapshot();
    state.draft = now !== fileJson;
    try {
      if (!state.draft) { localStorage.removeItem(DRAFT_KEY); state.unsavedInvalid = false; return; }
      if (OM.validate(state.model).some(isErr)) { state.unsavedInvalid = true; return; }     // never replace the last good draft with a broken state
      state.unsavedInvalid = false;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ base: BASE, model: now }));
    } catch (e) { /* storage may be blocked: edits still work for this session */ }
  }
  function setAside(raw) { try { localStorage.setItem(DRAFT_KEY + '-rejected', raw); localStorage.removeItem(DRAFT_KEY); } catch (x) { /* ignore */ } }
  function loadDraft() {
    var raw = null;
    try {
      raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      var rec = JSON.parse(raw), m = rec && typeof rec.model === 'string' ? JSON.parse(rec.model) : null;
      if (!m || OM.validate(m).some(isErr)) {          // keep the broken draft aside instead of silently losing it
        setAside(raw);
        state.notice = t('保存されていた下書きを読み込めませんでした（別のキーに退避しました）');
        return;
      }
      if (rec.base !== BASE) { state.stale = rec.model; return; }      // model.js has changed since this draft: ask, do not overwrite
      if (rec.model === fileJson) return;
      state.model = m; state.draft = true;
    } catch (e) { if (raw) setAside(raw); state.notice = t('保存されていた下書きを読み込めませんでした（別のキーに退避しました）'); }
  }

  /* All edits go through here. mutate() changes the model in place; the three views are then recomputed.
     A no-op adds no undo step, and a mutation that throws is rolled back. */
  function edit(mutate, opt) {
    opt = opt || {};
    var before = snapshot();
    try { mutate(state.model); }
    catch (e) { state.model = JSON.parse(before); toast(t('その操作は実行できませんでした')); afterEdit(); return; }
    if (snapshot() === before) return;
    var now = Date.now();
    var coalesce = opt.key && opt.key === state.lastKey && now - state.lastAt < 1200;
    if (!coalesce) { state.hist.push(before); if (state.hist.length > 80) state.hist.shift(); }
    state.lastKey = opt.key || ''; state.lastAt = now;
    state.fut = [];
    afterEdit(opt);
  }
  function afterEdit(opt) {
    state.issues = OM.validate(state.model);
    persist();
    rebuild({ animate: false, keepInspector: !!(opt && opt.keepInspector) });
  }
  function undo() { if (!state.hist.length) return; state.fut.push(snapshot()); state.model = JSON.parse(state.hist.pop()); state.lastKey = ''; fixSelection(); afterEdit(); }
  function redo() { if (!state.fut.length) return; state.hist.push(snapshot()); state.model = JSON.parse(state.fut.pop()); state.lastKey = ''; fixSelection(); afterEdit(); }
  function fixSelection() { if (state.sel && !state.model.objects.some(function (o) { return o.id === state.sel; })) state.sel = null; }
  function replaceModel(m, label) {
    state.hist.push(snapshot()); state.fut = []; state.model = m; state.lastKey = '';
    fixSelection(); afterEdit(); toast(label || t('モデルを置き換えました'));
  }
  function restoreStale() { state.hist.push(snapshot()); state.model = JSON.parse(state.stale); state.stale = null; state.lastKey = ''; fixSelection(); afterEdit(); toast(t('前の下書きを復元しました')); }
  function dropStale() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ } state.stale = null; updateChrome(); toast(t('前の下書きを破棄しました')); }
  function discardDraft() {
    state.hist.push(snapshot()); state.model = JSON.parse(fileJson); fixSelection(); afterEdit(); toast(t('model.js の状態に戻しました'));
  }

  /* --------------------------------------------------------------- build */
  function rebuild(opt) {
    opt = opt || {};
    L = LY.computeAll(state.model);
    ctx = SK.makeCtx(state.model, L.d, state.lang);
    applyTokens();
    ensureNodes();
    drawSkins();
    placeNodes(!!opt.animate);
    drawLanesAndEdges();
    applySelection();
    updateChrome();
    if (!opt.keepInspector && window.OMInspector) window.OMInspector.render();
    else if (window.OMInspector && window.OMInspector.refreshLight) window.OMInspector.refreshLight();
  }

  function applyTokens() {                       // the explorer wears the site's own palette
    (state.model.tokens || []).forEach(function (t) { if (t.group === 'color') document.documentElement.style.setProperty(t.name, t.value); });
  }

  function ensureNodes() {
    var layer = $('#nodes'), want = {};
    state.model.objects.forEach(function (o) { want[o.id] = true; });
    nodes.forEach(function (g, id) { if (!want[id]) { g.remove(); nodes.delete(id); pos.delete(id); } });
    state.model.objects.forEach(function (o) {
      if (nodes.has(o.id)) return;
      var g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'node'); g.setAttribute('data-id', o.id); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
      g.innerHTML = '<g class="skin skin-design"></g><g class="skin skin-concept"></g><g class="skin skin-er"></g>';
      layer.appendChild(g); nodes.set(o.id, g);
    });
  }

  function rectIn(view, id) { return (view === 'design' ? L.design.rects : view === 'concept' ? L.concept.rects : L.er.rects)[id] || null; }

  function drawSkins() {
    state.model.objects.forEach(function (o) {
      var g = nodes.get(o.id), rd = L.design.rects[o.id], rc = L.concept.rects[o.id], re = L.er.rects[o.id], tb = L.d.tables.get(o.id);
      g.querySelector('.skin-design').innerHTML = rd ? SK.designSkin(o, rd, ctx) : '';
      g.querySelector('.skin-concept').innerHTML = rc ? SK.conceptSkin(o, rc, ctx) : '';
      g.querySelector('.skin-er').innerHTML = re ? (tb ? SK.erTableSkin(o, tb, re, ctx) : SK.erRowSkin(o, re, ctx)) : '';
      g.classList.toggle('in-design', !!rd); g.classList.toggle('in-concept', !!rc); g.classList.toggle('in-er', !!re);
      var where = [rd && t('デザイン'), rc && t('概念図'), re && t('ER図')].filter(Boolean).join(t('・'));
      g.setAttribute('aria-label', SK.label(o, ctx.lang) + ' (' + where + ')');
    });
  }

  function setPos(id, x, y) { var g = nodes.get(id); pos.set(id, { x: x, y: y }); g.setAttribute('transform', 'translate(' + x + ' ' + y + ')'); }

  function zOrder(view) {
    var ids = state.model.objects.map(function (o) { return o.id; }), first = [];
    if (view === 'design') first = L.design.order;
    else if (view === 'er') first = ids.filter(function (id) { return L.d.tables.has(id); });
    var seen = {}, out = [];
    first.forEach(function (id) { if (!seen[id]) { seen[id] = 1; out.push(id); } });
    ids.forEach(function (id) { if (!seen[id]) { seen[id] = 1; out.push(id); } });
    return out;
  }

  function placeNodes(animate, prevView) {
    var v = state.view, list = [];
    nodes.forEach(function (g, id) {
      var r = rectIn(v, id), was = !g.classList.contains('off');
      list.push({ id: id, g: g, on: !!r, was: was, x: r ? r.x : 0, y: r ? r.y : 0 });
    });
    var layer = $('#nodes'), order = zOrder(v);       // parents before children, ER rows above their tables
    order.forEach(function (id) { var g = nodes.get(id); if (g) layer.appendChild(g); });
    cancelAnimationFrame(raf);
    var svg = $('#canvas');
    var finish = function () {
      list.forEach(function (t) {
        t.g.classList.toggle('off', !t.on); t.g.style.opacity = '';
        $$('.skin', t.g).forEach(function (k) { k.style.opacity = ''; });
        if (t.on) setPos(t.id, t.x, t.y);
      });
      svg.classList.remove('animating');
    };
    list.forEach(function (t) { var p = pos.get(t.id); t.x0 = p ? p.x : t.x; t.y0 = p ? p.y : t.y; });
    if (!animate || reduce) { finish(); return; }
    svg.classList.add('animating');
    list.forEach(function (t) { if (t.on) t.g.classList.remove('off'); });
    var start = performance.now(), dur = 760;
    (function step(now) {
      var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3.2), f = Math.min(1, p * 1.6);
      list.forEach(function (t) {
        if (t.on) setPos(t.id, t.x0 + (t.x - t.x0) * e, t.y0 + (t.y - t.y0) * e);
        if (t.on && !t.was) t.g.style.opacity = f;
        else if (!t.on && t.was) t.g.style.opacity = 1 - f;
        if (t.on && prevView && prevView !== v) {                // the same object changes appearance: old skin out, new skin in
          var a = t.g.querySelector('.skin-' + prevView), b = t.g.querySelector('.skin-' + v);
          if (a && t.was) a.style.opacity = 1 - f;
          if (b) b.style.opacity = f;
        }
      });
      if (p < 1) raf = requestAnimationFrame(step); else finish();
    })(start);
  }

  function drawLanesAndEdges() {
    var lanes = $('#lanes'), s = '';
    L.concept.lanes.forEach(function (l) { s += SK.laneSvg(l, ctx); });
    lanes.innerHTML = s;
    $('#edges-concept').innerHTML = L.routes.concept.map(function (r) { return SK.conceptEdgeSvg(r, ctx); }).join('');
    $('#edges-er').innerHTML = L.routes.er.map(function (r) { return SK.erEdgeSvg(r, ctx); }).join('');
    $('#edges-design').innerHTML = L.routes.design.map(function (r) { return SK.designEdgeSvg(r, ctx); }).join('');
    $('#canvas').classList.toggle('labels-sel', !state.labelsAlways);
  }

  /* ------------------------------------------------------------ selection */
  function related(view, id) {
    var out = {}, d = L.d;
    out[id] = 'sel';
    var mark = function (x) { if (x && !out[x]) out[x] = 'rel'; };
    if (view === 'design') {
      var o = d.get(id);
      if (o && o.design && o.design.parent) mark(o.design.parent);
      (d.children.get(id) || []).forEach(mark);
      d.edges.design.forEach(function (e) { if (e.from === id) mark(e.to); if (e.to === id) mark(e.from); });
      d.refs.forEach(function (r) { if (r.object === id) mark(r.in); if (r.in === id) mark(r.object); });
      var sl = id === d.slotEntity ? '*' : (/^slot-(\d+)$/.test(id) ? RegExp.$1 : null);     // a photo slot lights every block that uses it
      if (sl) d.objects.forEach(function (x) { if (x.design && x.design.slot && (sl === '*' || x.design.slot === sl)) mark(x.id); });
    } else if (view === 'concept') {
      d.edges.concept.forEach(function (e) { if (e.from === id) mark(e.to); if (e.to === id) mark(e.from); });
    } else {
      var owner = d.erOwner(id);
      if (owner) {
        out[owner] = out[owner] || 'rel';
        d.edges.er.forEach(function (e) { if (e.from === owner) mark(e.to); if (e.to === owner) mark(e.from); });
      }
    }
    return out;
  }

  function applySelection() {
    var svg = $('#canvas'), v = state.view, sel = state.sel;
    var rel = sel ? related(v, sel) : {};
    var present = !!sel && (!!rectIn(v, sel) || Object.keys(rel).some(function (k) { return k !== sel && !!rectIn(v, k); }));   // nothing to highlight in this view → do not dim the page
    svg.classList.toggle('has-sel', present);
    nodes.forEach(function (g, id) {
      var cls;
      if (sel) {
        if (v === 'er') {                                  // rows belong to their table: selecting either lights the whole table
          var nk = L.d.erOwner(id), sk = L.d.erOwner(sel);
          if (id === sel) cls = 'sel';
          else if (nk && nk === sk) cls = 'rel';
          else if (nk && rel[nk]) cls = 'rel';
        } else cls = rel[id];
      }
      g.classList.toggle('is-sel', cls === 'sel');
      g.classList.toggle('is-rel', cls === 'rel');
      g.classList.toggle('is-dim', present && !cls);
    });
    ['concept', 'er', 'design'].forEach(function (name) {
      $$('#edges-' + name + ' .edge').forEach(function (e) {
        var f = e.getAttribute('data-from'), t = e.getAttribute('data-to'), hit = false;
        if (sel) {
          if (name === 'er') { var so = L.d.erOwner(sel); hit = !!so && (f === so || t === so); }
          else hit = f === sel || t === sel;
        }
        e.classList.toggle('hl', hit);
      });
    });
    if (sel) history.replaceState(null, '', '#view=' + v + '&sel=' + encodeURIComponent(sel)); else history.replaceState(null, '', '#view=' + v);
  }

  function select(id, opt) {
    opt = opt || {};
    state.sel = id || null;
    applySelection();
    if (window.OMInspector) window.OMInspector.render();
    if (id && opt.reveal) revealSelected();
  }

  /* --------------------------------------------------------------- views */
  function setView(v, opt) {
    opt = opt || {};
    if (VIEWS.indexOf(v) < 0) return;
    var changed = v !== state.view, prev = state.view;
    state.view = v;
    $('#canvas').setAttribute('data-view', v);
    $$('#viewmenu button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-view') === v ? 'true' : 'false'); });
    document.body.setAttribute('data-view', v);
    placeNodes(changed && !opt.instant, prev);
    applySelection();
    fit(opt.instant ? false : true);
    updateChrome();
    if (window.OMInspector) window.OMInspector.render();
  }

  /* --------------------------------------------------------------- camera */
  function viewBounds(v) {
    var b = v === 'design' ? L.design.bounds : v === 'concept' ? L.concept.bounds : L.er.bounds;
    var padR = v === 'design' ? 130 : 30;
    return { x: b.x - 24, y: b.y - 24, w: b.w + 48 + padR - 24, h: b.h + 48 };
  }
  function stageSize() { var s = $('#canvas'); return { w: s.clientWidth || 800, h: s.clientHeight || 600 }; }

  /* fit(animate): frame the view (or the selection and what it links to). fit(animate, true): show the whole view. */
  function fit(animate, all) {
    var v = state.view, b = viewBounds(v), S = stageSize(), k, x, y;
    var sel = !all && state.sel && (rectIn(v, state.sel) || Object.keys(related(v, state.sel)).some(function (i) { return !!rectIn(v, i); })) ? state.sel : null;
    var widthK = Math.min(1.1, (S.w - 24) / b.w);
    var fitK = Math.min(1.15, (S.w - 24) / b.w, (S.h - 24) / b.h);
    if (v === 'design') {
      k = all ? Math.min(widthK, (S.h - 24) / b.h) : widthK;     // the page is tall: fit the width and start at the top
      x = (S.w - b.w * k) / 2 - b.x * k; y = 14 - b.y * k;
      var r0 = sel && rectIn(v, sel);
      if (r0) y = Math.min(y, Math.max(S.h / 2 - (r0.y + Math.min(r0.h, 200) / 2) * k, S.h - (b.y + b.h) * k - 14));
    } else {
      k = all ? fitK : (v === 'er' ? Math.max(fitK, 0.7) : fitK);     // ER field names must stay legible
      x = (S.w - b.w * k) / 2 - b.x * k;
      y = b.h * k > S.h ? 14 - b.y * k : (S.h - b.h * k) / 2 - b.y * k;
      if (b.w * k > S.w) x = 12 - b.x * k;
      if (sel) {                                                     // frame the selection together with everything it links to
        var rs = Object.keys(related(v, sel)).map(function (i) { return rectIn(v, i); }).filter(Boolean);
        var x0 = Math.min.apply(null, rs.map(function (r) { return r.x; })), y0 = Math.min.apply(null, rs.map(function (r) { return r.y; }));
        var x1 = Math.max.apply(null, rs.map(function (r) { return r.x + r.w; })), y1 = Math.max.apply(null, rs.map(function (r) { return r.y + r.h; }));
        var kk = Math.max(fitK, Math.min(1.1, (S.w - 90) / (x1 - x0), (S.h - 90) / (y1 - y0)));
        k = kk; x = S.w / 2 - (x0 + x1) / 2 * k; y = S.h / 2 - (y0 + y1) / 2 * k;
      }
    }
    state.userCam = false;
    tweenCam({ x: x, y: y, k: k }, animate);
  }
  function revealSelected() { fit(true); }

  function applyCam() { $('#world').setAttribute('transform', 'translate(' + state.cam.x + ' ' + state.cam.y + ') scale(' + state.cam.k + ')'); }
  function tweenCam(t, animate) {
    cancelAnimationFrame(camRaf);
    if (!animate || reduce) { state.cam = { x: t.x, y: t.y, k: t.k }; applyCam(); return; }
    var c0 = { x: state.cam.x, y: state.cam.y, k: state.cam.k }, start = performance.now(), dur = 760;
    (function step(now) {
      var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      state.cam = { x: c0.x + (t.x - c0.x) * e, y: c0.y + (t.y - c0.y) * e, k: c0.k + (t.k - c0.k) * e };
      applyCam();
      if (p < 1) camRaf = requestAnimationFrame(step);
    })(start);
  }
  function zoomAt(cx, cy, factor) {
    var k0 = state.cam.k, k1 = Math.max(0.15, Math.min(3, k0 * factor)), f = k1 / k0;
    cancelAnimationFrame(camRaf); state.userCam = true;
    state.cam = { x: cx - (cx - state.cam.x) * f, y: cy - (cy - state.cam.y) * f, k: k1 }; applyCam();
  }

  function bindCanvas() {
    var svg = $('#canvas'), drag = null, moved = false, pts = {}, pinch = null, pinched = false;
    function ptList() { return Object.keys(pts).map(function (k) { return pts[k]; }); }
    function pinchGeom() { var a = ptList(); return { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1, x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; }
    svg.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { svg.setPointerCapture(e.pointerId); } catch (x) { /* not capturable */ }
      if (ptList().length === 2) { pinch = pinchGeom(); pinched = true; drag = null; moved = true; state.userCam = true; cancelAnimationFrame(camRaf); return; }
      drag = { x: e.clientX, y: e.clientY, cx: state.cam.x, cy: state.cam.y }; moved = false; pinched = false;
    });
    svg.addEventListener('pointermove', function (e) {
      if (pts[e.pointerId]) pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pinch && ptList().length === 2) {
        var g = pinchGeom(), r = svg.getBoundingClientRect();
        state.cam.x += g.x - pinch.x; state.cam.y += g.y - pinch.y;
        zoomAt(g.x - r.left, g.y - r.top, g.d / pinch.d); pinch = g; return;
      }
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; svg.classList.add('panning'); cancelAnimationFrame(camRaf); }
      if (moved) { state.userCam = true; state.cam.x = drag.cx + dx; state.cam.y = drag.cy + dy; applyCam(); }
    });
    function endPointer(e, cancelled) {
      delete pts[e.pointerId];
      try { svg.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ }
      if (pinch) { pinch = null; drag = null; if (!ptList().length) { pinched = false; svg.classList.remove('panning'); } return; }
      var wasMoved = moved || pinched; drag = null; pinched = false; svg.classList.remove('panning');
      if (cancelled || wasMoved) return;
      var n = e.target.closest && e.target.closest('.node');
      if (n && !n.classList.contains('off')) select(n.getAttribute('data-id'));
      else select(null);
    }
    svg.addEventListener('pointerup', function (e) { endPointer(e, false); });
    svg.addEventListener('pointercancel', function (e) { endPointer(e, true); });
    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = svg.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.01));
      else { state.userCam = true; cancelAnimationFrame(camRaf); state.cam.x -= e.deltaX; state.cam.y -= e.deltaY; applyCam(); }
    }, { passive: false });
    svg.addEventListener('keydown', function (e) {
      var n = e.target.closest && e.target.closest('.node');
      if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(n.getAttribute('data-id')); }
    });
    svg.addEventListener('dblclick', function (e) {
      var n = e.target.closest && e.target.closest('.node');
      if (n) { var next = VIEWS[(VIEWS.indexOf(state.view) + 1) % 3]; while (!state.model.objects.some(function (o) { return o.id === n.getAttribute('data-id') && OM.inView(state.model, o, next); })) next = VIEWS[(VIEWS.indexOf(next) + 1) % 3]; setView(next); }
    });
    // hover highlight of edges
    svg.addEventListener('pointerover', function (e) { var g = e.target.closest && e.target.closest('.edge'); if (g) g.classList.add('hover'); });
    svg.addEventListener('pointerout', function (e) { var g = e.target.closest && e.target.closest('.edge'); if (g) g.classList.remove('hover'); });
  }

  /* ---------------------------------------------------------------- chrome */
  function updateChrome() {
    var st = state.issues.filter(function (i) { return i.level === 'error'; }).length;
    var el = $('#status');
    if (el) {
      var counts = { design: 0, concept: 0, er: 0 };
      state.model.objects.forEach(function (o) { VIEWS.forEach(function (v) { if (OM.inView(state.model, o, v)) counts[v]++; }); });
      el.textContent = (state.unsavedInvalid ? t('⚠ エラーがあるため、下書きはこの前の正常な状態のままです｜') : '') +
        t('オブジェクト {o}｜リンク {l}｜デザイン {d}・概念 {c}・ER {e}', { o: state.model.objects.length, l: (state.model.links || []).length, d: counts.design, c: counts.concept, e: counts.er }) +
        (st ? t('｜エラー {n}', { n: st }) : '');
      el.classList.toggle('bad', !!st);
    }
    $('#undo').disabled = !state.hist.length; $('#redo').disabled = !state.fut.length;
    $('#draftbar').hidden = !state.draft || !!state.stale;
    $('#stalebar').hidden = !state.stale;
    $('#langbtn').textContent = state.lang === 'ja' ? 'EN' : '日本語';
    $('#labelbtn').setAttribute('aria-pressed', state.labelsAlways ? 'true' : 'false');
    $('#legend').setAttribute('data-view', state.view);
  }

  function toast(msg) {
    var el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  /* ----------------------------------------------------------------- save */
  function download(name, text) {
    var a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/javascript' })), download: name });
    document.body.appendChild(a); a.click(); a.remove();
  }
  function okToSave() {
    var n = OM.validate(state.model).filter(isErr).length;
    return !n || window.confirm(t('エラーが {n} 件あります。それでも保存しますか？（ブラウザ内の下書きは残ります）', { n: n }));
  }
  function saveToFile() {
    if (!okToSave()) return;
    var text = OM.serialize(state.model);
    if (!window.showSaveFilePicker) { download('model.js', text); toast(t('model.js をダウンロードしました。architecture/ に上書きしてください')); return; }
    window.showSaveFilePicker({ suggestedName: 'model.js', types: [{ description: 'JavaScript', accept: { 'text/javascript': ['.js'] } }] })
      .then(function (handle) { return handle.createWritable().then(function (w) { return w.write(text).then(function () { return w.close(); }); }).then(function () { var invalid = OM.validate(state.model).some(isErr); fileJson = snapshot(); BASE = hashOf(fileJson); if (invalid) { try { localStorage.setItem(DRAFT_KEY + '-rejected', JSON.stringify({ base: BASE, model: fileJson })); } catch (x) { /* ignore */ } } persist(); updateChrome(); toast(t('保存しました：{name}', { name: handle.name })); }); })
      .catch(function (e) { if (e && e.name !== 'AbortError') { download('model.js', text); toast(t('直接保存できなかったためダウンロードしました')); } });
  }

  /* ------------------------------------------------------------------ init */
  function parseHash() {
    var out = {}; location.hash.replace(/^#/, '').split('&').forEach(function (p) { var kv = p.split('='); if (kv[0]) out[kv[0]] = decodeURIComponent(kv[1] || ''); });
    return out;
  }

  function buildChrome() {
    buildViewMenu();
    $('#undo').addEventListener('click', undo); $('#redo').addEventListener('click', redo);
    $('#langbtn').addEventListener('click', function () { state.lang = state.lang === 'ja' ? 'en' : 'ja'; window.I18N.setLang(state.lang); applyLang(); });
    $('#labelbtn').addEventListener('click', function () { state.labelsAlways = !state.labelsAlways; rebuild({ keepInspector: true }); });
    $('#fitbtn').addEventListener('click', function () { fit(true, true); });
    $('#zin').addEventListener('click', function () { var S = stageSize(); zoomAt(S.w / 2, S.h / 2, 1.25); });
    $('#zout').addEventListener('click', function () { var S = stageSize(); zoomAt(S.w / 2, S.h / 2, 0.8); });
    $('#inspbtn').addEventListener('click', function () { document.body.classList.toggle('no-insp'); setTimeout(function () { fit(true); }, 60); });
    $('#legendbtn').addEventListener('click', function () { $('#legend').classList.toggle('closed'); });
    $('#savebtn').addEventListener('click', saveToFile);
    $('#dlbtn').addEventListener('click', function () { if (!okToSave()) return; download('model.js', OM.serialize(state.model)); toast(t('model.js をダウンロードしました')); });
    $('#stalerestore').addEventListener('click', restoreStale); $('#staledrop').addEventListener('click', dropStale);
    $('#draftsave').addEventListener('click', saveToFile);
    $('#draftdrop').addEventListener('click', discardDraft);
    var search = $('#search'), results = $('#results');
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase(); results.innerHTML = '';
      if (!q) { results.hidden = true; return; }
      var hits = state.model.objects.filter(function (o) { return (o.ja + ' ' + o.en + ' ' + o.id + ' ' + ((o.er && o.er.table) || '')).toLowerCase().indexOf(q) > -1; }).slice(0, 8);
      hits.forEach(function (o) {
        results.appendChild(h('li', {}, h('button', { type: 'button', onClick: function () { search.value = ''; results.hidden = true; var v = OM.inView(state.model, o, state.view) ? state.view : VIEWS.filter(function (x) { return OM.inView(state.model, o, x); })[0]; if (v && v !== state.view) setView(v); select(o.id, { reveal: true }); } }, SK.label(o, state.lang), h('small', {}, ' ' + o.id))));
      });
      results.hidden = !hits.length;
    });
    document.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.search')) results.hidden = true; });
    document.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { if (typing) return; e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { if (typing) return; e.preventDefault(); redo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveToFile(); return; }
      if (typing) { if (e.key === 'Escape') { $('#results').hidden = true; e.target.blur(); } return; }
      if (e.key === '1' || e.key === '2' || e.key === '3') setView(VIEWS[+e.key - 1]);
      else if (e.key === '/') { e.preventDefault(); search.focus(); }
      else if (e.key === 'Escape') select(null);
      else if (e.key === '0') fit(true, true);
    });
    window.addEventListener('resize', function () { if (!state.userCam) fit(false); });
  }

  /* Attributes on the static HTML that carry Japanese text (title / aria-label / placeholder): keep the original, show t(original). */
  function applyStatic() {
    ['title', 'aria-label', 'placeholder'].forEach(function (a) {
      $$('[' + a + ']').forEach(function (el) {
        var k = 'data-ja-' + a;
        if (!el.hasAttribute(k)) { var v = el.getAttribute(a); if (!/[぀-ヿ一-鿿]/.test(v)) return; el.setAttribute(k, v); }
        el.setAttribute(a, t(el.getAttribute(k)));
      });
    });
    document.title = window.I18N.lang === 'en' ? 'Website Structure / Design Map — TANJA' : 'Website Structure / Design Map — TANJA（オブジェクトマップ）';
  }
  function buildViewMenu() {
    var menu = $('#viewmenu'); menu.textContent = '';
    VIEWS.forEach(function (v, i) {
      menu.appendChild(h('button', { type: 'button', role: 'tab', 'data-view': v, 'aria-selected': v === state.view ? 'true' : 'false', title: t(VIEW_LABEL[v]) + ' (' + (i + 1) + ')', onClick: function () { setView(v); } }, h('span', { class: 'n' }, String(i + 1)), h('span', { class: 'vl' }, t(VIEW_LABEL[v]))));
    });
  }
  function applyLang() { applyStatic(); buildViewMenu(); buildLegend(); rebuild({}); }

  function buildLegend() {
    var ul = $('#lg-status'); if (!ul) return;
    ul.textContent = '';
    Object.keys(SK.STATUS).forEach(function (k) { var st = SK.STATUS[k]; ul.appendChild(h('li', {}, h('i', { class: 'dot', style: 'background:' + st.color }), t(st.legend || st.ja))); });
  }

  function init() {
    loadDraft(); buildLegend();
    state.issues = OM.validate(state.model);
    buildChrome(); bindCanvas(); applyStatic();
    var hash = parseHash();
    if (VIEWS.indexOf(hash.view) > -1) state.view = hash.view;
    if (hash.sel) state.sel = hash.sel;
    $('#canvas').setAttribute('data-view', state.view);
    rebuild({});
    fixSelection();
    setView(state.view, { instant: true });
    if (state.sel) select(state.sel);
    document.body.classList.add('ready');
    if (state.notice) toast(state.notice);
  }

  window.OMApp = {
    state: state, h: h, $: $, $$: $$, edit: edit, select: select, setView: setView, toast: toast, rebuild: rebuild, replaceModel: replaceModel,
    undo: undo, redo: redo, saveToFile: saveToFile, download: download, get L() { return L; }, VIEW_LABEL: VIEW_LABEL, VIEWS: VIEWS, fit: fit, revealSelected: revealSelected
  };

  window.OMApp.init = init;
})();
