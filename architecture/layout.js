/* TANJA object map — layout.js
   Pure geometry. Given the derived model, computes where every object sits in each of the three views
   and how the lines between them run. No positions are stored in model.js: they are recomputed on every edit,
   which is what keeps the three views in step. Works in the browser (window.OMLayout) and in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model-core.js'));
  else root.OMLayout = factory(root.OM);
})(typeof self !== 'undefined' ? self : this, function (OM) {
  'use strict';

  var DESIGN = { W: 1040, pad: 12, gap: 12, head: 26 };
  var CONCEPT = { nodeW: 200, nodeH: 58, laneGapX: 128, colGapX: 62, gapY: 26, laneHead: 46, lanePad: 20, maxPerCol: 6, rowGap: 72, maxRowW: 1240 };
  var ER = { W: 244, gapX: 150, gapY: 44, head: 46, row: 22, pad: 10, chipH: 22 };
  var MOCK_H = { hero: 300, company: 200, cards: 190, band: 120, 'crop-feature': 240, crop: 230, 'project-card': 210, career: 190, contact: 120, footer: 104, bar: 60, chips: 42, ghost: 210, 'ghost-section': 84, generic: 90 };

  var max = Math.max, min = Math.min;

  /* ------------------------------------------------------------ design */
  function layoutDesign(model, d) {
    var rects = {}, order = [];
    if (!d.designRoot) return { rects: rects, order: order, bounds: { x: 0, y: 0, w: 0, h: 0 } };

    function place(id, x, y, w, depth) {
      var o = d.get(id), ds = o.design;
      var kids = d.children.get(id) || [];
      var inset = ds.inset || (kids.length ? [DESIGN.head, DESIGN.pad, DESIGN.pad, DESIGN.pad] : [0, 0, 0, 0]);
      var rect = { x: x, y: y, w: w, h: 0, depth: depth, inset: inset };
      rects[id] = rect; order.push(id);
      var h;
      if (!kids.length) {
        h = Math.max(1, +ds.h || MOCK_H[ds.mock || 'generic'] || 90);
      } else {
        var ix = x + inset[3], iy = y + inset[0], iw = w - inset[1] - inset[3];
        var layout = ds.layout || 'stack';
        var gap = ds.gap != null ? ds.gap : DESIGN.gap;
        var cy = iy;
        if (layout === 'stack') {
          kids.forEach(function (k) { cy += place(k, ix, cy, iw, depth + 1) + gap; });
          cy -= gap;
        } else {
          var cols = layout === 'row' ? kids.length : Math.max(1, Math.floor(+ds.cols || 2));
          var flow = [], cur = [], used = 0;
          kids.forEach(function (k) {
            var span = layout === 'row' ? 1 : min(Math.max(1, Math.floor(+d.get(k).design.span || 1)), cols);
            if (used + span > cols) { flow.push(cur); cur = []; used = 0; }
            cur.push({ id: k, span: span }); used += span;
          });
          if (cur.length) flow.push(cur);
          flow.forEach(function (row, ri) {
            var rowH = 0, cx = ix;
            if (layout === 'row') {
              var wt = function (id) { return Math.max(0.1, +d.get(id).design.weight || 1); };
              var total = row.reduce(function (s, c) { return s + wt(c.id); }, 0);
              var avail = iw - gap * (row.length - 1);
              row.forEach(function (c) {
                var cw = avail * wt(c.id) / total;
                rowH = max(rowH, place(c.id, cx, cy, cw, depth + 1)); cx += cw + gap;
              });
            } else {
              var colW = (iw - gap * (cols - 1)) / cols, colUsed = 0;
              row.forEach(function (c) {
                var cw = c.span * colW + (c.span - 1) * gap;
                rowH = max(rowH, place(c.id, ix + colUsed * (colW + gap), cy, cw, depth + 1)); colUsed += c.span;
              });
            }
            row.forEach(function (c) { var r = rects[c.id]; if (!(d.children.get(c.id) || []).length) r.h = rowH; });   // even rows
            cy += rowH + (ri < flow.length - 1 ? gap : 0);
          });
        }
        h = (cy - y) + inset[2];
        if (+ds.h > h) h = +ds.h;
      }
      rect.h = h;
      return h;
    }
    place(d.designRoot, 0, 0, DESIGN.W, 0);
    var r0 = rects[d.designRoot];
    return { rects: rects, order: order, bounds: { x: 0, y: 0, w: r0.w, h: r0.h } };
  }

  /* ----------------------------------------------------------- concept */
  function layoutConcept(model, d) {
    var rects = {}, lanes = [];
    var C = CONCEPT;
    var built = [];
    (model.domains || []).forEach(function (dm) {
      var members = d.objects.filter(function (o) { return o.concept && o.concept.domain === dm.id; });
      if (!members.length) return;
      members.sort(function (a, b) {
        var oa = a.concept.order, ob = b.concept.order;
        oa = oa == null ? 1e6 : oa; ob = ob == null ? 1e6 : ob;
        return oa - ob || d.order.get(a.id) - d.order.get(b.id);
      });
      var cols = Math.ceil(members.length / C.maxPerCol);
      var per = Math.ceil(members.length / cols);
      var stagger = cols > 1 ? C.nodeH / 2 : 0;
      built.push({
        dm: dm, members: members, cols: cols, per: per,
        w: C.lanePad * 2 + cols * C.nodeW + (cols - 1) * C.colGapX,
        h: C.laneHead + C.lanePad * 2 + per * C.nodeH + (per - 1) * C.gapY + stagger
      });
    });
    /* wrap lanes into rows so the diagram stays roughly square and readable */
    var rows = [], cur = [], curW = 0;
    built.forEach(function (b) {
      var add = b.w + (cur.length ? C.laneGapX : 0);
      if (cur.length && curW + add > C.maxRowW) { rows.push(cur); cur = []; curW = 0; add = b.w; }
      cur.push(b); curW += add;
    });
    if (cur.length) rows.push(cur);
    var y0 = 0, totalW = 0;
    rows.forEach(function (row) {
      var rowH = row.reduce(function (m, b) { return max(m, b.h); }, 0), x = 0;
      row.forEach(function (b) {
        b.members.forEach(function (o, i) {
          var col = Math.floor(i / b.per), r = i % b.per;
          rects[o.id] = { x: x + C.lanePad + col * (C.nodeW + C.colGapX), y: y0 + C.laneHead + C.lanePad + r * (C.nodeH + C.gapY) + (col % 2) * (C.nodeH / 2), w: C.nodeW, h: C.nodeH, domain: b.dm.id };
        });
        lanes.push({ id: b.dm.id, domain: b.dm, x: x, y: y0, w: b.w, h: rowH });
        x += b.w + C.laneGapX;
      });
      totalW = max(totalW, x - C.laneGapX);
      y0 += rowH + C.rowGap;
    });
    return { rects: rects, lanes: lanes, bounds: { x: 0, y: 0, w: totalW, h: max(0, y0 - C.rowGap) } };
  }

  /* -------------------------------------------------------------- ER */
  function layoutER(model, d) {
    var rects = {}, tableRects = {}, rowRects = {};
    var tables = Array.from(d.tables.values());
    var colHeights = [];
    var wantCols = tables.reduce(function (m, t) { var c = d.get(t.id).er.col; return c == null ? m : max(m, c + 1); }, 0) || 4;
    for (var i = 0; i < wantCols; i++) colHeights.push(0);

    tables.forEach(function (t) {
      var o = d.get(t.id);
      var hasRepeat = !!(o.design && o.design.repeat);
      var rowLines = 0;
      if (t.rows.length) {                                   // wrap row chips inside the table
        var lineW = 0; rowLines = 1;
        t.rows.forEach(function (rid) {
          var w = chipWidth(d.get(rid));
          if (lineW && lineW + w > ER.W - ER.pad * 2) { rowLines++; lineW = 0; }
          lineW += w + 6;
        });
      }
      var bandH = (rowLines ? 12 + rowLines * (ER.chipH + 6) : 0) + (hasRepeat ? 26 : 0);
      var h = ER.head + t.fields.length * ER.row + ER.pad + bandH;
      var col = o.er.col;
      if (col == null || col >= wantCols) { col = colHeights.indexOf(min.apply(null, colHeights)); }
      var rect = { x: col * (ER.W + ER.gapX), y: colHeights[col], w: ER.W, h: h, col: col, bandH: bandH, rowLines: rowLines, hasRepeat: hasRepeat };
      colHeights[col] += h + ER.gapY;
      tableRects[t.id] = rect;
    });

    tables.forEach(function (t) {
      var tr = tableRects[t.id];
      var lineX = ER.pad, line = 0;
      var baseY = ER.head + t.fields.length * ER.row + ER.pad + 12;
      t.rows.forEach(function (rid) {
        var w = chipWidth(d.get(rid));
        if (lineX > ER.pad && lineX + w > ER.W - ER.pad) { line++; lineX = ER.pad; }
        rowRects[rid] = { x: tr.x + lineX, y: tr.y + baseY + line * (ER.chipH + 6), w: w, h: ER.chipH, table: t.id };
        lineX += w + 6;
      });
    });

    var bounds = { x: 0, y: 0, w: wantCols * ER.W + (wantCols - 1) * ER.gapX, h: max.apply(null, colHeights.concat([0])) - ER.gapY };
    Object.keys(tableRects).forEach(function (k) { rects[k] = tableRects[k]; });
    Object.keys(rowRects).forEach(function (k) { rects[k] = rowRects[k]; });
    return { rects: rects, tableRects: tableRects, rowRects: rowRects, bounds: bounds };
  }

  function chipWidth(o) {
    var s = (o && (o.en || o.id)) || '';
    return max(58, min(120, 22 + s.length * 6.6));
  }

  function fieldY(table, tableRect, name) {
    var i = table.fields.findIndex(function (f) { return f.name === name; });
    if (i < 0) return tableRect.y + ER.head / 2;
    return tableRect.y + ER.head + i * ER.row + ER.row / 2;
  }

  /* --------------------------------------------------------- routing */
  function bez(p0, p1, p2, p3, t) {
    var u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  }

  function spread(list, rectOf) {           // list: {edge,end,node,side,otherY}
    var groups = new Map();
    list.forEach(function (a) { var k = a.node + '|' + a.side; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(a); });
    groups.forEach(function (g) {
      g.sort(function (a, b) { return a.otherY - b.otherY; });
      var r = rectOf(g[0].node), m = 10;
      g.forEach(function (a, i) { a.y = a.fixedY != null ? a.fixedY + (i - (g.length - 1) / 2) * 3 : r.y + m + (i + 1) / (g.length + 1) * (r.h - 2 * m); });
    });
  }

  function routeConcept(edges, rects) {
    var anchors = [], items = [];
    edges.forEach(function (e, i) {
      var a = rects[e.from], b = rects[e.to];
      if (!a || !b) return;
      var dx = (b.x + b.w / 2) - (a.x + a.w / 2);
      var sameCol = Math.abs(dx) < a.w * 0.6;
      var fs, ts;
      if (sameCol) { fs = 'r'; ts = 'r'; } else if (dx > 0) { fs = 'r'; ts = 'l'; } else { fs = 'l'; ts = 'r'; }
      var it = { e: e, a: a, b: b, fs: fs, ts: ts, sameCol: sameCol };
      items.push(it);
      anchors.push({ item: it, end: 'from', node: e.from, side: fs, otherY: b.y + b.h / 2 });
      anchors.push({ item: it, end: 'to', node: e.to, side: ts, otherY: a.y + a.h / 2 });
    });
    spread(anchors, function (id) { return rects[id]; });
    anchors.forEach(function (an) { an.item[an.end + 'Y'] = an.y; });
    var seenVerb = {};
    return items.map(function (it, i) {
      var a = it.a, b = it.b;
      var vk = it.e.from + '|' + (it.e.verb && it.e.verb.ja) + '|' + (it.e.verb && it.e.verb.en), dup = !!seenVerb[vk]; seenVerb[vk] = true;
      var x1 = it.fs === 'r' ? a.x + a.w : a.x, y1 = it.fromY;
      var x2 = it.ts === 'r' ? b.x + b.w : b.x, y2 = it.toY;
      var d, lx, ly, c1x, c2x;
      if (it.sameCol) {
        var bulge = 54 + (i % 3) * 14;
        c1x = x1 + bulge; c2x = x2 + bulge;
        d = 'M' + x1 + ' ' + y1 + ' C' + c1x + ' ' + y1 + ' ' + c2x + ' ' + y2 + ' ' + x2 + ' ' + y2;
      } else {
        var k = max(44, Math.abs(x2 - x1) * 0.45), dir = x2 > x1 ? 1 : -1;
        c1x = x1 + dir * k; c2x = x2 - dir * k;
        d = 'M' + x1 + ' ' + y1 + ' C' + c1x + ' ' + y1 + ' ' + c2x + ' ' + y2 + ' ' + x2 + ' ' + y2;
      }
      lx = bez(x1, c1x, c2x, x2, 0.5); ly = bez(y1, y1, y2, y2, 0.5);
      return { id: it.e.id, edge: it.e, d: d, dupLabel: dup, label: { x: lx, y: ly }, from: { x: x1, y: y1, dir: it.fs === 'r' ? 1 : -1 }, to: { x: x2, y: y2, dir: it.ts === 'r' ? 1 : -1 } };
    });
  }

  function markersFor(edge) {              // what sits at each end: 'one' | 'many'
    var f = 'one', t = 'many';
    if (edge.card === '1:N') { f = 'one'; t = 'many'; }
    else if (edge.card === 'N:1') { f = 'many'; t = 'one'; }
    else if (edge.card === '1:1') { f = 'one'; t = 'one'; }
    else if (edge.card === 'N:M') { f = 'many'; t = 'many'; }
    return { from: f, to: t };
  }

  function routeER(edges, layout, d) {
    var rects = layout.tableRects, anchors = [], items = [];
    edges.forEach(function (e) {
      var a = rects[e.from], b = rects[e.to];
      if (!a || !b) return;
      var dx = (b.x + b.w / 2) - (a.x + a.w / 2);
      var same = Math.abs(dx) < a.w * 0.6;
      var fs, ts;
      if (same) { fs = 'r'; ts = 'r'; } else if (dx > 0) { fs = 'r'; ts = 'l'; } else { fs = 'l'; ts = 'r'; }
      var ta = d.tables.get(e.from), tb = d.tables.get(e.to);
      var fixedFrom = a.y + ER.head / 2, fixedTo = b.y + ER.head / 2;          // default: the table header
      if (e.fkField) { if (e.fkSide === e.from) fixedFrom = fieldY(ta, a, e.fkField); else fixedTo = fieldY(tb, b, e.fkField); }
      var it = { e: e, a: a, b: b, fs: fs, ts: ts, same: same };
      items.push(it);
      anchors.push({ item: it, end: 'from', node: e.from, side: fs, otherY: b.y + b.h / 2, fixedY: fixedFrom });
      anchors.push({ item: it, end: 'to', node: e.to, side: ts, otherY: a.y + a.h / 2, fixedY: fixedTo });
    });
    spread(anchors, function (id) { return rects[id]; });
    anchors.forEach(function (an) { an.item[an.end + 'Y'] = an.y != null ? an.y : (an.node && rects[an.node].y + ER.head / 2); });
    var seenVerb = {};
    return items.map(function (it, i) {
      var a = it.a, b = it.b;
      var vk = it.e.from + '|' + (it.e.verb && it.e.verb.ja) + '|' + (it.e.verb && it.e.verb.en), dup = !!seenVerb[vk]; seenVerb[vk] = true;
      var x1 = it.fs === 'r' ? a.x + a.w : a.x, y1 = it.fromY;
      var x2 = it.ts === 'r' ? b.x + b.w : b.x, y2 = it.toY;
      var c1x, c2x;
      if (it.same) { var bl = 58 + (i % 4) * 12; c1x = x1 + bl; c2x = x2 + bl; }
      else { var k = max(48, Math.abs(x2 - x1) * 0.42), dir = x2 > x1 ? 1 : -1; c1x = x1 + dir * k; c2x = x2 - dir * k; }
      var m = markersFor(it.e);
      return {
        id: it.e.id, edge: it.e,
        d: 'M' + x1 + ' ' + y1 + ' C' + c1x + ' ' + y1 + ' ' + c2x + ' ' + y2 + ' ' + x2 + ' ' + y2,
        label: { x: bez(x1, c1x, c2x, x2, 0.5), y: bez(y1, y1, y2, y2, 0.5) },
        from: { x: x1, y: y1, dir: it.fs === 'r' ? 1 : -1, mark: m.from },
        to: { x: x2, y: y2, dir: it.ts === 'r' ? 1 : -1, mark: m.to },
        optional: !!it.e.optional
      };
    });
  }

  function routeDesign(edges, rects) {          // orthogonal lines through the right gutter, drawn only for the selection
    var gx = 0;
    Object.keys(rects).forEach(function (k) { gx = max(gx, rects[k].x + rects[k].w); });
    return edges.map(function (e, i) {
      var a = rects[e.from], b = rects[e.to];
      if (!a || !b) return null;
      var x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x + b.w, y2 = b.y + 22;
      var g = gx + 26 + i * 9;
      return { id: e.id, edge: e, d: 'M' + x1 + ' ' + y1 + ' H' + g + ' V' + y2 + ' H' + x2, label: { x: g + 6, y: (y1 + y2) / 2 }, from: { x: x1, y: y1, dir: 1 }, to: { x: x2, y: y2, dir: 1 } };
    }).filter(Boolean);
  }

  /* everything a renderer needs, in one call */
  function computeAll(model) {
    var d = OM.derive(model);
    var design = layoutDesign(model, d);
    var concept = layoutConcept(model, d);
    var er = layoutER(model, d);
    return {
      d: d, design: design, concept: concept, er: er,
      routes: {
        concept: routeConcept(d.edges.concept, concept.rects),
        er: routeER(d.edges.er, er, d),
        design: routeDesign(d.edges.design, design.rects)
      }
    };
  }

  return { DESIGN: DESIGN, CONCEPT: CONCEPT, ER: ER, MOCK_H: MOCK_H, layoutDesign: layoutDesign, layoutConcept: layoutConcept, layoutER: layoutER, routeConcept: routeConcept, routeER: routeER, routeDesign: routeDesign, computeAll: computeAll, fieldY: fieldY, chipWidth: chipWidth, markersFor: markersFor };
});
