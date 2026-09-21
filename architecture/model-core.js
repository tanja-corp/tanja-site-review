/* TANJA object map — model-core.js
   Pure functions (no DOM). Works in the browser (window.OM) and in Node (require).

   ONE source of truth: model.js. An object may have up to three "facets":
     design  → where it sits on the page (tree position, layout hints, slot, html id …)
     concept → which domain it belongs to in the concept diagram
     er      → a table (fields) or a row of another table (rowOf)
   Every view is a projection computed here from those facets plus `links`.
   Nothing about a view is stored anywhere else, so editing the source changes all three. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OM = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VIEWS = ['design', 'concept', 'er'];
  var STATUSES = ['built', 'provisional', 'placeholder', 'planned'];
  var CARDS = ['1:1', '1:N', 'N:1', 'N:M'];
  var KINDS = ['entity', 'row', 'element', 'concept'];
  var DEFAULT_LINK_VIEWS = ['concept', 'er'];

  var isEntity = function (o) { return !!(o && o.er && Array.isArray(o.er.fields)); };
  var isRow = function (o) { return !!(o && o.er && o.er.rowOf); };
  /* CamelCase table names become snake_case column names: CareerNote → career_note */
  var slug = function (s) { return String(s || '').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); };

  /* ---------------------------------------------------------------- derive */
  function derive(model) {
    var objects = model.objects || [];
    var order = new Map();
    objects.forEach(function (o, i) { order.set(o.id, i); });
    var get = function (id) { return order.has(id) ? objects[order.get(id)] : null; };

    /* design tree */
    var children = new Map();
    var designRoot = null;
    objects.forEach(function (o) {
      if (!o.design) return;
      var p = o.design.parent;
      if (!p) { if (!designRoot) designRoot = o.id; return; }
      if (!children.has(p)) children.set(p, []);
      children.get(p).push(o.id);
    });
    children.forEach(function (list) {
      list.sort(function (a, b) {
        var da = get(a).design.order, db = get(b).design.order;
        da = da == null ? 0 : da; db = db == null ? 0 : db;
        return da - db || order.get(a) - order.get(b);
      });
    });

    /* which ER table does an object belong to (entity → itself, row → its table, else none) */
    var erOwner = function (id) {
      var o = get(id);
      if (!o) return null;
      if (isEntity(o)) return o.id;
      if (isRow(o)) { var t = get(o.er.rowOf); return isEntity(t) ? t.id : null; }
      return null;
    };

    var slotEntity = (model.meta && model.meta.slotEntity) || 'photo-slot';
    var i18nEntity = (model.meta && model.meta.i18nEntity) || 'translation';

    /* edges per view */
    var edges = { design: [], concept: [], er: [] };
    var links = model.links || [];
    var pairKey = function (a, b) { return a < b ? a + '|' + b : b + '|' + a; };
    var conceptPairs = new Set();

    links.forEach(function (l) {
      var views = l.views || DEFAULT_LINK_VIEWS;
      var f = get(l.from), t = get(l.to);
      if (!f || !t) return;
      var base = { id: l.id, from: l.from, to: l.to, verb: l.verb || { ja: '', en: '' }, card: l.card || '1:N', kind: 'link', optional: !!l.optional, field: l.field, noFk: !!l.noFk };
      if (views.indexOf('concept') > -1 && f.concept && t.concept) { edges.concept.push(Object.assign({}, base)); conceptPairs.add(pairKey(l.from, l.to)); }
      if (views.indexOf('design') > -1 && f.design && t.design) edges.design.push(Object.assign({}, base));
      if (views.indexOf('er') > -1) {
        var a = erOwner(l.from), b = erOwner(l.to);
        if (a && b) edges.er.push(Object.assign({}, base, { from: a, to: b, via: [l.from, l.to] }));
      }
    });

    /* containment (design.parent) shows in the concept diagram unless a link already joins the pair;
       the page root is skipped (it would join everything) */
    objects.forEach(function (o) {
      if (!o.design || !o.design.parent || !o.concept) return;
      var p = get(o.design.parent);
      if (!p || !p.concept || (p.design && p.design.root)) return;
      if (conceptPairs.has(pairKey(p.id, o.id))) return;
      edges.concept.push({ id: 'contain:' + p.id + '>' + o.id, from: p.id, to: o.id, verb: { ja: '含む', en: 'contains' }, card: '1:N', kind: 'contain' });
    });

    /* design.slot → the PhotoSlot table (ER) */
    var slotOwners = new Map();
    objects.forEach(function (o) {
      if (!o.design || !o.design.slot) return;
      var owner = erOwner(o.id);
      if (!owner || !get(slotEntity)) return;
      var field = o.design.slotField || 'photo';
      var key = owner + '|' + field;
      if (!slotOwners.has(key)) slotOwners.set(key, { owner: owner, field: field, via: [], slots: [] });
      slotOwners.get(key).via.push(o.id);
      slotOwners.get(key).slots.push(o.design.slot);
    });
    slotOwners.forEach(function (s) {
      edges.er.push({ id: 'slot:' + s.owner + '.' + s.field, from: s.owner, to: slotEntity, verb: { ja: '写真枠を使う', en: 'fills slot' }, card: 'N:1', kind: 'slot', field: s.field, via: s.via, slots: s.slots });
    });

    /* entities with translatable fields → the Translation table (faint) */
    if (get(i18nEntity) && isEntity(get(i18nEntity))) {
      objects.forEach(function (o) {
        if (!isEntity(o) || o.id === i18nEntity) return;
        if (o.er.fields.some(function (f) { return f.i18n; })) {
          edges.er.push({ id: 'i18n:' + o.id, from: o.id, to: i18nEntity, verb: { ja: '翻訳を持つ', en: 'has translations' }, card: '1:N', kind: 'i18n', via: [o.id] });
        }
      });
    }

    /* "also shown in": design references drawn as small dotted chips */
    var refs = [];
    objects.forEach(function (o) {
      if (o.design && Array.isArray(o.design.alsoIn)) o.design.alsoIn.forEach(function (p) { if (get(p) && get(p).design) refs.push({ object: o.id, in: p }); });
    });

    /* de-duplicate ER edges (several rows of one table point at the same table) */
    var seen = new Map();
    edges.er = edges.er.filter(function (e) {
      var k = [e.kind, e.from, e.to, e.field || (e.verb && e.verb.en)].join('|');
      if (seen.has(k)) { var prev = seen.get(k); prev.via = (prev.via || []).concat(e.via || []); return false; }
      seen.set(k, e); return true;
    });

    /* ER tables: explicit fields + derived foreign keys */
    var tables = new Map();
    objects.forEach(function (o) {
      if (!isEntity(o)) return;
      tables.set(o.id, { id: o.id, name: o.er.table || o.en || o.id, fields: o.er.fields.map(function (f) { return Object.assign({}, f); }), rows: [], refs: [] });
    });
    objects.forEach(function (o) { if (isRow(o) && tables.has(o.er.rowOf)) tables.get(o.er.rowOf).rows.push(o.id); });
    edges.er.forEach(function (e) {
      if (e.kind === 'i18n' || e.card === 'N:M' || e.noFk) return;
      var fkSide = e.card === 'N:1' ? e.from : e.to;
      var refSide = fkSide === e.from ? e.to : e.from;
      var tbl = tables.get(fkSide), ref = tables.get(refSide);
      if (!tbl || !ref) return;
      var name = e.field || (slug(ref.name) + '_id');
      var existing = tbl.fields.find(function (f) { return f.name === name; });
      if (existing) { existing.fk = refSide; if (e.optional) existing.nullable = true; }
      else tbl.fields.push({ name: name, type: 'fk', fk: refSide, derived: true, nullable: !!e.optional });
      e.fkSide = fkSide; e.fkField = name;
    });

    return { objects: objects, get: get, order: order, children: children, designRoot: designRoot, erOwner: erOwner, edges: edges, tables: tables, refs: refs, slotEntity: slotEntity, i18nEntity: i18nEntity };
  }

  /* ------------------------------------------------------------ view membership */
  function inView(model, obj, view) {
    if (view === 'design') return !!obj.design;
    if (view === 'concept') return !!obj.concept;
    if (view === 'er') return isEntity(obj) || isRow(obj);
    return false;
  }

  /* where does the same object live? (used by the "three faces" panel) */
  function faces(model, d, id) {
    var o = d.get(id), out = {};
    if (!o) return out;
    if (o.design) {
      var chain = [], p = o;
      var guard = new Set();
      while (p && p.design && !guard.has(p.id)) { guard.add(p.id); chain.unshift(p.design.htmlId ? '#' + p.design.htmlId : p.ja || p.id); p = p.design.parent ? d.get(p.design.parent) : null; }
      out.design = { path: chain, component: o.design.component || '', slot: o.design.slot || '', repeat: o.design.repeat || null, htmlId: o.design.htmlId || '' };
    }
    if (o.concept) {
      var dom = (model.domains || []).find(function (x) { return x.id === o.concept.domain; });
      out.concept = { domain: dom ? dom.ja : o.concept.domain || '' };
    }
    if (isEntity(o)) { var t = d.tables.get(o.id); out.er = { table: t.name, fields: t.fields.length, rows: t.rows.length, kind: 'table' }; }
    else if (isRow(o)) { var tt = d.tables.get(o.er.rowOf); out.er = { table: tt ? tt.name : o.er.rowOf, kind: 'row', values: o.er.values || {} }; }
    return out;
  }

  /* ------------------------------------------------------------------ validate */
  function validate(model) {
    try { return validateInner(model); }
    catch (e) { return [{ level: 'error', msg: 'model is not a valid object map (' + (e && e.message) + ')' }]; }
  }

  function validateInner(model) {
    var issues = [];
    if (!model || typeof model !== 'object' || !Array.isArray(model.objects)) return [{ level: 'error', msg: 'model.objects must be an array' }];
    if (model.links != null && !Array.isArray(model.links)) return [{ level: 'error', msg: 'model.links must be an array' }];
    if (model.domains != null && !Array.isArray(model.domains)) return [{ level: 'error', msg: 'model.domains must be an array' }];
    if (model.objects.some(function (o) { return !o || typeof o !== 'object'; })) return [{ level: 'error', msg: 'every object must be an object' }];
    var err = function (m) { issues.push({ level: 'error', msg: m }); };
    var warn = function (m) { issues.push({ level: 'warn', msg: m }); };
    var objects = model.objects || [];
    var ids = new Set();
    objects.forEach(function (o) {
      if (!o.id || !/^[a-z0-9][a-z0-9-]*$/.test(o.id)) err('object id must be lowercase letters, digits, hyphen: ' + JSON.stringify(o.id));
      if (ids.has(o.id)) err('duplicate object id: ' + o.id);
      ids.add(o.id);
      if (KINDS.indexOf(o.kind) < 0) err(o.id + ': unknown kind ' + o.kind);
      if (STATUSES.indexOf(o.status) < 0) err(o.id + ': unknown status ' + o.status);
      if (!o.ja || !o.en) warn(o.id + ': label missing (ja/en)');
      if (!o.design && !o.concept && !isEntity(o) && !isRow(o)) warn(o.id + ': has no facet, so it appears in no view');
    });
    var byId = new Map(objects.map(function (o) { return [o.id, o]; }));
    var domains = new Set((model.domains || []).map(function (d) { return d.id; }));
    var roots = objects.filter(function (o) { return o.design && !o.design.parent; });
    if (roots.length !== 1) err('design tree needs exactly one root (found ' + roots.length + ')');
    objects.forEach(function (o) {
      if (o.design && o.design.parent) {
        if (!byId.has(o.design.parent)) err(o.id + ': design.parent "' + o.design.parent + '" does not exist');
        else if (!byId.get(o.design.parent).design) err(o.id + ': design.parent "' + o.design.parent + '" has no design facet');
        var seen = new Set([o.id]), p = byId.get(o.design.parent);
        while (p && p.design && p.design.parent) { if (seen.has(p.id)) { err('design tree cycle at ' + o.id); break; } seen.add(p.id); p = byId.get(p.design.parent); }
      }
      if (o.design && Array.isArray(o.design.alsoIn)) o.design.alsoIn.forEach(function (x) { if (!byId.has(x)) err(o.id + ': design.alsoIn "' + x + '" does not exist'); });
      if (o.concept && !domains.has(o.concept.domain)) err(o.id + ': concept.domain must be one of the model domains (got ' + o.concept.domain + ')');
      if (o.er && !isEntity(o) && !isRow(o)) err(o.id + ': er needs either fields (a table) or rowOf (a row of a table)');
      if (o.design) {
        var ds = o.design;
        if (ds.h != null && !(+ds.h > 0)) err(o.id + ': design.h must be a positive number');
        if (ds.weight != null && !(+ds.weight > 0)) err(o.id + ': design.weight must be a positive number');
        if (ds.cols != null && !(+ds.cols >= 1)) err(o.id + ': design.cols must be 1 or more');
        if (ds.span != null && !(+ds.span >= 1)) err(o.id + ': design.span must be 1 or more');
        if (ds.repeat && !(+ds.repeat.shown >= 1 && +ds.repeat.shown <= 99)) err(o.id + ': design.repeat.shown must be between 1 and 99');
      }
      if (isRow(o)) {
        var t = byId.get(o.er.rowOf);
        if (!t) err(o.id + ': er.rowOf "' + o.er.rowOf + '" does not exist');
        else if (!isEntity(t)) err(o.id + ': er.rowOf "' + o.er.rowOf + '" is not a table');
      }
      if (isEntity(o)) {
        var names = new Set();
        o.er.fields.forEach(function (f) {
          if (!f.name) err(o.id + ': a field has no name');
          if (names.has(f.name)) err(o.id + ': duplicate field ' + f.name);
          names.add(f.name);
        });
        if (!o.er.fields.some(function (f) { return f.pk; })) warn(o.id + ': table has no primary key');
      }
    });
    var mt = model.meta || {};
    ['slotEntity', 'i18nEntity'].forEach(function (k) { if (mt[k] && !byId.has(mt[k])) warn('meta.' + k + ' names "' + mt[k] + '", which does not exist (derived slot / translation lines are off)'); });
    var linkIds = new Set();
    (model.links || []).forEach(function (l) {
      if (linkIds.has(l.id)) err('duplicate link id ' + l.id);
      linkIds.add(l.id);
      if (!byId.has(l.from)) err('link ' + l.id + ': from "' + l.from + '" does not exist');
      if (!byId.has(l.to)) err('link ' + l.id + ': to "' + l.to + '" does not exist');
      if (CARDS.indexOf(l.card) < 0) err('link ' + l.id + ': card must be one of ' + CARDS.join(' '));
      (l.views || []).forEach(function (v) { if (VIEWS.indexOf(v) < 0) err('link ' + l.id + ': unknown view ' + v); });
    });
    objects.forEach(function (o) {
      if (o.design && o.design.slot && !byId.has('slot-' + o.design.slot)) warn(o.id + ': design.slot ' + o.design.slot + ' has no object "slot-' + o.design.slot + '"');
    });
    return issues;
  }

  /* -------------------------------------------------------- editing helpers */
  /* Rename an object id everywhere (parents, links, rowOf, alsoIn, meta). */
  function renameId(model, from, to) {
    model.objects.forEach(function (o) {
      if (o.id === from) o.id = to;
      if (o.design && o.design.parent === from) o.design.parent = to;
      if (o.design && Array.isArray(o.design.alsoIn)) o.design.alsoIn = o.design.alsoIn.map(function (x) { return x === from ? to : x; });
      if (o.er && o.er.rowOf === from) o.er.rowOf = to;
    });
    (model.links || []).forEach(function (l) { if (l.from === from) l.from = to; if (l.to === from) l.to = to; });
    if (model.meta) ['slotEntity', 'i18nEntity'].forEach(function (k) { if (model.meta[k] === from) model.meta[k] = to; });
  }

  /* Remove an object and everything that pointed at it. Children move up to its parent. */
  function isRoot(o) { return !!(o && o.design && !o.design.parent); }

  function removeObject(model, id) {
    var o = model.objects.find(function (x) { return x.id === id; });
    if (!o) return false;
    if (isRoot(o)) return false;                      // the page root cannot be deleted: every block hangs from it
    var parent = o.design ? o.design.parent : null;
    model.objects.forEach(function (x) {
      if (x.design && x.design.parent === id) x.design.parent = parent || null;
      if (x.design && Array.isArray(x.design.alsoIn)) x.design.alsoIn = x.design.alsoIn.filter(function (p) { return p !== id; });
      if (x.er && x.er.rowOf === id) delete x.er;          // its rows lose their table
    });
    model.objects = model.objects.filter(function (x) { return x.id !== id; });
    model.links = (model.links || []).filter(function (l) { return l.from !== id && l.to !== id; });
    return true;
  }

  /* Remove one facet. What depended on it is kept valid: children of a design block move up to its parent,
     and rows of a table that loses its ER facet lose theirs too (a row cannot outlive its table). */
  function dropFacet(model, id, kind) {
    var x = model.objects.find(function (o) { return o.id === id; });
    if (!x) return false;
    if (kind === 'design' && isRoot(x)) return false;
    if (kind === 'design' && x.design) {
      var parent = x.design.parent || null;
      model.objects.forEach(function (y) {
        if (y.design && y.design.parent === id) y.design.parent = parent;
        if (y.design && Array.isArray(y.design.alsoIn)) y.design.alsoIn = y.design.alsoIn.filter(function (p) { return p !== id; });
      });
      delete x.design;
    } else if (kind === 'concept') delete x.concept;
    else if (kind === 'er') {
      model.objects.forEach(function (y) { if (y.er && y.er.rowOf === id) delete y.er; });
      delete x.er;
    }
    return true;
  }

  /* Rename a field and keep every link that names it in step. */
  function renameField(model, entityId, from, to) {
    var e = model.objects.find(function (o) { return o.id === entityId; });
    if (!e || !isEntity(e)) return;
    var f = e.er.fields.find(function (x) { return x.name === from; });
    if (f) f.name = to;
    var d = derive(model);
    (model.links || []).forEach(function (l) {
      if (l.field !== from) return;
      if (d.erOwner(l.from) === entityId || d.erOwner(l.to) === entityId) l.field = to;
    });
    model.objects.forEach(function (o) {
      if (o.design && o.design.slotField === from && d.erOwner(o.id) === entityId) o.design.slotField = to;
    });
  }

  /* one line per small object, expanded only when long: keeps model.js diff-friendly and readable */
  function compact(v, ind) {
    var one = JSON.stringify(v);
    if (one === undefined) return 'null';
    if (typeof v !== 'object' || v === null || one.length <= 100) return one;
    var pad = new Array(ind + 2).join('  '), end = new Array(ind + 1).join('  ');
    if (Array.isArray(v)) return '[\n' + v.map(function (x) { return pad + compact(x, ind + 1); }).join(',\n') + '\n' + end + ']';
    var keys = Object.keys(v).filter(function (k) { return v[k] !== undefined; });
    return '{\n' + keys.map(function (k) { return pad + JSON.stringify(k) + ': ' + compact(v[k], ind + 1); }).join(',\n') + '\n' + end + '}';
  }

  function serialize(model) {
    return '/* TANJA object map: the single source of truth for the design, concept and ER views.\n' +
      '   Edit here (or in the explorer, then save back to this file). Verify against the site with:  node architecture/check.js */\n' +
      'window.OBJECT_MODEL = ' + compact(model, 0) + ';\n';
  }

  return { VIEWS: VIEWS, STATUSES: STATUSES, CARDS: CARDS, KINDS: KINDS, derive: derive, inView: inView, faces: faces, validate: validate, renameId: renameId, removeObject: removeObject, dropFacet: dropFacet, isRoot: isRoot, renameField: renameField, serialize: serialize, isEntity: isEntity, isRow: isRow, slug: slug };
});
