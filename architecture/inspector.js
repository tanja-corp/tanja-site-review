/* TANJA object map — inspector.js
   The right-hand panel. Every control edits the ONE model through OMApp.edit(), so a change made here shows up at once in the
   design, concept and ER views. Nothing in this file keeps its own copy of the data. */
(function () {
  'use strict';
  var A = window.OMApp, OM = window.OM, SK = window.OMSkins;
  var h = A.h, root = A.$('#inspector');

  var TYPES = ['id', 'text', 'int', 'bool', 'enum', 'image', 'url', 'email', 'date', 'ref'];
  var MOCKS = ['generic', 'hero', 'company', 'cards', 'band', 'crop-feature', 'crop', 'project-card', 'career', 'contact', 'footer', 'bar', 'chips', 'ghost', 'ghost-section'];
  var LAYOUTS = ['stack', 'row', 'grid'];
  var STATUSES = Object.keys(SK.STATUS).map(function (k) { return [k, SK.STATUS[k].ja]; });      // one status list, shared with the canvas
  var KINDS = [['entity', 'エンティティ（データを持つ）'], ['row', '行（あるテーブルの1行）'], ['element', '要素（見た目だけ）'], ['concept', '概念（言葉だけ）']];
  var CARDS = [['1:1', '1 対 1'], ['1:N', '1 対 多'], ['N:1', '多 対 1'], ['N:M', '多 対 多']];
  var VIEWS = [['concept', '概念図'], ['er', 'ER図'], ['design', 'デザイン']];

  var model = function () { return A.state.model; };
  var find = function (id) { return model().objects.find(function (o) { return o.id === id; }); };
  var derived = function () { return A.L.d; };
  var lab = function (o) { return o ? SK.label(o, A.state.lang) : ''; };

  /* ------------------------------------------------------------ tiny form kit */
  function field(labelText, control, hint) { return h('div', {}, h('label', {}, labelText), control, hint ? h('p', { class: 'muted' }, hint) : null); }
  function tinput(value, onInput, opt) {
    opt = opt || {};
    var el = h('input', { type: opt.number ? 'number' : 'text', value: value == null ? '' : value, placeholder: opt.placeholder || '', step: opt.step, min: opt.min, list: opt.list, 'aria-label': opt.aria });
    el.addEventListener(opt.onChange ? 'change' : 'input', function () { onInput(el.value); });
    return el;
  }
  function tselect(options, value, onChange, opt) {
    var el = h('select', { 'aria-label': opt && opt.aria }, options.map(function (o) { return h('option', { value: o[0], selected: String(o[0]) === String(value) }, o[1]); }));
    el.addEventListener('change', function () { onChange(el.value); });
    return el;
  }
  function tcheck(text, checked, onChange) {
    var el = h('input', { type: 'checkbox', checked: !!checked });
    el.addEventListener('change', function () { onChange(el.checked); });
    return h('label', {}, el, text);
  }
  function tarea(value, onInput, rows) {
    var el = h('textarea', { rows: rows || 3 }); el.value = value || '';
    el.addEventListener('input', function () { onInput(el.value); });
    return el;
  }
  function btn(text, onClick, cls, title) { return h('button', { type: 'button', class: cls || '', title: title, onClick: onClick }, text); }
  function chip(text, cls) { return h('span', { class: 'chip ' + (cls || '') }, text); }
  function linkChip(id) { var o = find(id); return h('button', { type: 'button', class: 'chip', onClick: function () { jumpTo(id); } }, o ? lab(o) : id); }

  var live = function (key) { return { key: key, keepInspector: true }; };
  function jumpTo(id) {
    var o = find(id); if (!o) return;
    var v = OM.inView(model(), o, A.state.view) ? A.state.view : ['design', 'concept', 'er'].filter(function (x) { return OM.inView(model(), o, x); })[0];
    if (v && v !== A.state.view) A.setView(v);
    A.select(id, { reveal: true });
  }

  /* --------------------------------------------------------------- panels */
  var openState = { design: false, concept: false, er: true, links: true, derived: false, danger: false };
  function details(key, title, body, extra) {
    var d = h('details', { open: openState[key] }, h('summary', {}, title, extra || null), body);
    d.addEventListener('toggle', function () { openState[key] = d.open; });
    return d;
  }

  function statusDot(status) { var st = SK.STATUS[status] || SK.STATUS.built; return h('span', { class: 'chip', style: 'background:' + st.color + ';color:#fff' }, st.ja); }

  function render() {
    var keep = root.scrollTop;
    root.innerHTML = '';
    var o = A.state.sel ? find(A.state.sel) : null;
    root.appendChild(o ? objectPanel(o) : overviewPanel());
    root.scrollTop = keep;
  }

  /* ---------------------------------------------- overview (nothing selected) */
  function overviewPanel() {
    var m = model(), d = derived(), wrap = h('div', {});
    wrap.appendChild(h('h2', {}, 'オブジェクトマップ'));
    wrap.appendChild(h('p', { class: 'muted' }, 'デザインデータ・概念図・ER図は、同じ1つのデータ（model.js）から毎回描き直されます。上のメニューで行き来でき、オブジェクトを選ぶと3つの姿を並べて見られます。ここで直すと、3つとも同時に変わります。'));
    wrap.appendChild(h('div', { class: 'chips' },
      btn('＋ オブジェクトを追加', function () { openAdd(); }, 'primary'),
      btn('JSON を直接編集', function () { openJson(); }),
      btn('整合性を検査', function () { checkNow(); })));

    var issues = A.state.issues;
    wrap.appendChild(h('h3', {}, '整合性'));
    if (!issues.length) wrap.appendChild(h('p', { class: 'muted' }, 'エラーも注意もありません。'));
    else wrap.appendChild(h('ul', { class: 'issues' }, issues.map(function (i) { return h('li', { class: i.level }, (i.level === 'error' ? 'エラー：' : '注意：') + i.msg); })));

    var used = {};
    m.objects.forEach(function (o) { ((o.design && o.design.tokens) || []).forEach(function (t) { (used[t] = used[t] || []).push(o.id); }); });
    var groups = { color: '色', type: '文字', space: '余白', layout: '寸法', shape: '角', motion: '動き' };
    wrap.appendChild(h('h3', {}, 'デザイントークン（styles.css の :root と一致を検査）'));
    Object.keys(groups).forEach(function (g) {
      var list = (m.tokens || []).filter(function (t) { return t.group === g; });
      if (!list.length) return;
      var box = h('div', { class: 'swatches' }, list.map(function (t) {
        var sw = g === 'color' ? h('i', { style: 'background:' + t.value }) : null;
        var users = used[t.name];
        return h('div', { class: 'sw' + (users ? ' hit' : ''), title: t.name + ' = ' + t.value + (t.ja ? '（' + t.ja + '）' : '') + (users ? '\n使用: ' + users.join(', ') : '') }, sw, h('span', {}, t.name.replace(/^--/, '') + (g !== 'color' ? ' ' + t.value.replace(/clamp\(.*/, 'clamp…') : '')));
      }));
      wrap.appendChild(details('tok-' + g, groups[g] + '（' + list.length + '）', box));
    });
    var tokenUsers = Object.keys(used);
    if (tokenUsers.length) wrap.appendChild(h('p', { class: 'muted' }, '太字のトークンは、デザイン上のオブジェクトが使っています（オブジェクトの「デザイン設定」に記録）。'));

    wrap.appendChild(h('h3', {}, 'ブレークポイント'));
    wrap.appendChild(h('ul', { class: 'muted' }, (m.breakpoints || []).map(function (b) { return h('li', {}, h('code', {}, b.query), ' ' + b.ja); })));
    wrap.appendChild(h('h3', {}, '使い方'));
    wrap.appendChild(h('ul', { class: 'muted' },
      h('li', {}, 'キー 1／2／3：ビュー切替、/：検索、0：全体表示、Esc：選択解除'),
      h('li', {}, 'ダブルクリック：同じオブジェクトを次のビューで見る'),
      h('li', {}, 'ドラッグ：移動、Ctrl+ホイール：拡大縮小、ホイール：スクロール'),
      h('li', {}, 'Ctrl+Z／Ctrl+Shift+Z：元に戻す／やり直す、Ctrl+S：model.js に保存')));
    return wrap;
  }

  function checkNow() {
    A.state.issues = OM.validate(model());
    var errs = A.state.issues.filter(function (i) { return i.level === 'error'; }).length;
    A.toast(errs ? 'エラー ' + errs + ' 件あります' : '整合性に問題はありません');
    render();
  }

  /* ------------------------------------------------------ selected object */
  function objectPanel(o) {
    var d = derived(), wrap = h('div', {});
    var faces = OM.faces(model(), d, o.id);
    wrap.appendChild(h('div', { class: 'chips' }, btn('← 全体に戻る', function () { A.select(null); }, 'ghost')));
    wrap.appendChild(h('h2', {}, lab(o)));
    wrap.appendChild(h('p', { class: 'muted' }, SK.sub(o, A.state.lang) + ' ・ ', h('code', {}, o.id), ' ・ ' + o.kind + ' '));
    wrap.appendChild(h('div', { class: 'chips' }, statusDot(o.status)));

    /* basics */
    wrap.appendChild(h('div', { class: 'row2' },
      field('名前（日本語）', tinput(o.ja, function (v) { A.edit(function (m) { find2(m, o.id).ja = v; }, live(o.id + ':ja')); })),
      field('name (English)', tinput(o.en, function (v) { A.edit(function (m) { find2(m, o.id).en = v; }, live(o.id + ':en')); }))));
    wrap.appendChild(h('div', { class: 'row2' },
      field('状態', tselect(STATUSES, o.status, function (v) { A.edit(function (m) { find2(m, o.id).status = v; }); })),
      field('種類', tselect(KINDS, o.kind, function (v) { A.edit(function (m) { find2(m, o.id).kind = v; }); }))));
    wrap.appendChild(field('説明', tarea(o.summary, function (v) { A.edit(function (m) { find2(m, o.id).summary = v; }, live(o.id + ':sum')); }, 3)));

    /* three faces */
    wrap.appendChild(h('h3', {}, '同じオブジェクトの3つの姿'));
    wrap.appendChild(facesPanel(o, faces));

    wrap.appendChild(designSection(o));
    wrap.appendChild(conceptSection(o));
    wrap.appendChild(erSection(o));
    wrap.appendChild(linksSection(o));
    wrap.appendChild(derivedSection(o));
    wrap.appendChild(dangerSection(o));
    return wrap;
  }
  function find2(m, id) { return m.objects.find(function (x) { return x.id === id; }); }

  function facesPanel(o, faces) {
    var cur = A.state.view, box = h('div', { class: 'faces' });
    var card = function (view, title, body, has, add) {
      var c = h('div', { class: 'face' + (has ? '' : ' none') + (cur === view ? ' here' : '') },
        h('div', { class: 't' }, h('span', {}, title), has ? btn(cur === view ? '表示中' : 'この姿で見る', function () { A.setView(view); A.select(o.id, { reveal: true }); }) : btn('＋ 追加', add)),
        h('div', { class: 'd' }, body));
      box.appendChild(c);
    };
    var f = faces;
    card('design', 'デザインデータ', f.design ? [f.design.path.join(' › '), f.design.component ? ' ・ ' + f.design.component : '', f.design.slot ? ' ・ slot ' + f.design.slot : '', f.design.repeat ? ' ・ ×' + f.design.repeat.shown : ''] : 'ページ上には出ていません', !!f.design, function () { addFacet(o, 'design'); });
    var nConcept = derived().edges.concept.filter(function (e) { return e.from === o.id || e.to === o.id; }).length;
    card('concept', '概念図', f.concept ? ['領域「' + f.concept.domain + '」・つながり ' + nConcept + ' 本'] : '概念図には出ていません', !!f.concept, function () { addFacet(o, 'concept'); });
    var er = f.er;
    card('er', 'ER図', er ? (er.kind === 'table' ? ['テーブル ', h('code', {}, er.table), '・フィールド ' + er.fields + (er.rows ? '・行 ' + er.rows : '')] : ['テーブル ', h('code', {}, er.table), ' の1行']) : 'ER図には出ていません', !!er, function () { addFacet(o, 'er'); });
    return box;
  }

  function addFacet(o, kind) {
    A.edit(function (m) {
      var x = find2(m, o.id);
      if (kind === 'design') { var root = OM.derive(m).designRoot; x.design = { parent: root === o.id ? null : root, order: 99, mock: 'generic', h: 90, component: '' }; }
      else if (kind === 'concept') x.concept = { domain: (m.domains[0] || {}).id, order: 99 };
      else if (kind === 'er') {
        if (x.kind === 'row') { var t = m.objects.find(function (y) { return OM.isEntity(y); }); x.er = { rowOf: t ? t.id : '', values: {} }; }
        else x.er = { table: (x.en || x.id).replace(/[^A-Za-z0-9]/g, '') || 'Table', fields: [{ name: 'id', type: 'id', pk: true }] };
      }
    });
    A.setView(kind); A.select(o.id, { reveal: true });
    A.toast('「' + (kind === 'design' ? 'デザイン' : kind === 'concept' ? '概念図' : 'ER図') + '」に追加しました');
  }

  function rowCount(o) { return model().objects.filter(function (y) { return y.er && y.er.rowOf === o.id; }).length; }
  function dropFacet(o, kind) {
    if (kind === 'design' && OM.isRoot(o)) { A.toast('ページ全体（ルート）のデザインの面は外せません'); return; }
    var rows = kind === 'er' && OM.isEntity(o) ? rowCount(o) : 0;
    if (rows && !window.confirm('このテーブルの行 ' + rows + ' 件は、ERの値も一緒に消えます。続けますか？（元に戻せます）')) return;
    A.edit(function (m) { OM.dropFacet(m, o.id, kind); });
  }

  /* ---- design facet ---- */
  function designSection(o) {
    var ds = o.design, m = model(), d = derived();
    if (!ds) return details('design', 'デザイン設定', h('p', { class: 'muted' }, 'この面はまだありません。上の「＋ 追加」で作れます。'));
    var body = h('div', {});
    var set = function (mut, key) { A.edit(function (mm) { mut(find2(mm, o.id).design, mm); }, key ? live(o.id + ':d:' + key) : {}); };
    var setKeep = function (key, mut) { A.edit(function (mm) { mut(find2(mm, o.id).design); }, live(o.id + ':d:' + key)); };

    var descendants = {}; (function walk(id) { (d.children.get(id) || []).forEach(function (c) { if (descendants[c]) return; descendants[c] = 1; walk(c); }); })(o.id);
    var parents = m.objects.filter(function (x) { return x.design && x.id !== o.id && !descendants[x.id]; }).map(function (x) { return [x.id, lab(x)]; });
    if (!ds.root) body.appendChild(field('ページ上の親', tselect([['', '（親なし）']].concat(parents), ds.parent || '', function (v) { set(function (dd) { dd.parent = v || null; }); })));
    else body.appendChild(h('p', { class: 'muted' }, 'このオブジェクトはページ全体（ルート）です。'));
    body.appendChild(h('div', { class: 'row3' },
      field('並び順', tinput(ds.order, function (v) { setKeep('order', function (dd) { dd.order = v === '' ? 0 : +v; }); }, { number: true, step: 0.5 })),
      field('高さ', tinput(ds.h, function (v) { setKeep('h', function (dd) { if (v === '') delete dd.h; else dd.h = Math.max(10, Math.min(2000, +v || 90)); }); }, { number: true, step: 10 })),
      field('幅の割合', tinput(ds.weight || 1, function (v) { setKeep('weight', function (dd) { dd.weight = Math.max(0.1, Math.min(10, +v || 1)); }); }, { number: true, step: 0.2 }))));
    var hasKids = (d.children.get(o.id) || []).length > 0;
    if (hasKids) body.appendChild(h('div', { class: 'row2' },
      field('子の並べ方', tselect(LAYOUTS.map(function (x) { return [x, x]; }), ds.layout || 'stack', function (v) { set(function (dd) { dd.layout = v; }); })),
      field('列数（grid）', tinput(ds.cols || 2, function (v) { setKeep('cols', function (dd) { dd.cols = Math.max(1, Math.min(6, Math.floor(+v) || 2)); }); }, { number: true, min: 1 }))));
    body.appendChild(h('div', { class: 'row2' },
      field('見た目の型', tselect(MOCKS.map(function (x) { return [x, x]; }), ds.mock || 'generic', function (v) { set(function (dd) { dd.mock = v; }); })),
      field('横に広げる列数（span）', tinput(ds.span || 1, function (v) { setKeep('span', function (dd) { if (+v > 1) dd.span = Math.min(6, Math.floor(+v)); else delete dd.span; }); }, { number: true, min: 1 }))));
    body.appendChild(h('div', { class: 'row2' },
      field('HTML の id', tinput(ds.htmlId || '', function (v) { setKeep('html', function (dd) { if (v) dd.htmlId = v; else delete dd.htmlId; }); })),
      field('CSS のクラス', tinput(ds.component || '', function (v) { setKeep('cmp', function (dd) { dd.component = v; }); }))));
    var slotOpts = [['', '（写真枠なし）']].concat(m.objects.filter(function (x) { return x.id.indexOf('slot-') === 0; }).map(function (x) { return [x.id.slice(5), lab(x)]; }));
    body.appendChild(h('div', { class: 'row2' },
      field('写真枠（PhotoSlot の行）', tselect(slotOpts, ds.slot || '', function (v) { set(function (dd) { if (v) dd.slot = v; else delete dd.slot; }); })),
      field('写真を入れるフィールド', tinput(ds.slotField || '', function (v) { setKeep('sf', function (dd) { if (v) dd.slotField = v; else delete dd.slotField; }); }, { placeholder: 'photo' }))));
    var rp = ds.repeat;
    body.appendChild(tcheck('同じカードを繰り返す（スタッフ・ナビ項目など）', !!rp, function (on) { set(function (dd) { if (on) dd.repeat = { shown: 3, min: 1, max: 6 }; else delete dd.repeat; }); }));
    if (rp) body.appendChild(h('div', { class: 'row3' },
      field('いま表示', tinput(rp.shown, function (v) { setKeep('rs', function (dd) { dd.repeat.shown = Math.max(1, Math.min(12, Math.floor(+v) || 1)); }); }, { number: true, min: 1 })),
      field('最小', tinput(rp.min, function (v) { setKeep('rmin', function (dd) { dd.repeat.min = Math.max(0, Math.min(12, Math.floor(+v) || 0)); }); }, { number: true, min: 0 })),
      field('最大', tinput(rp.max, function (v) { setKeep('rmax', function (dd) { dd.repeat.max = Math.max(1, Math.min(12, Math.floor(+v) || 1)); }); }, { number: true, min: 1 }))));
    body.appendChild(tcheck('将来（破線で表示）', !!ds.ghost, function (on) { set(function (dd) { if (on) dd.ghost = true; else delete dd.ghost; }); }));
    body.appendChild(field('仮置きの目印（data-placeholder、カンマ区切り）', tinput((ds.placeholders || []).join(', '), function (v) { setKeep('ph', function (dd) { var a = v.split(',').map(function (s) { return s.trim(); }).filter(Boolean); if (a.length) dd.placeholders = a; else delete dd.placeholders; }); }, { onChange: false })));
    body.appendChild(field('他にも表示される場所（オブジェクトIDをカンマ区切り）', tinput((ds.alsoIn || []).join(', '), function (v) { setKeep('also', function (dd) { var a = v.split(',').map(function (s) { return s.trim(); }).filter(Boolean); if (a.length) dd.alsoIn = a; else delete dd.alsoIn; }); }, { onChange: true }), 'フッターに再掲されるナビ・言語・SNSなど。'));
    // tokens
    var tokenOpts = [['', '＋ トークンを追加…']].concat((m.tokens || []).map(function (t) { return [t.name, t.name + (t.ja ? '（' + t.ja + '）' : '')]; }));
    body.appendChild(h('label', {}, '使っているデザイントークン'));
    body.appendChild(h('div', { class: 'chips' }, (ds.tokens || []).map(function (t) {
      var tok = (m.tokens || []).find(function (x) { return x.name === t; });
      return h('span', { class: 'chip mono', title: tok ? tok.value : '未定義のトークン' }, tok && tok.group === 'color' ? h('i', { style: 'display:inline-block;width:10px;height:10px;border-radius:2px;background:' + tok.value + ';border:1px solid rgba(0,0,0,.2)' }) : null, t, h('button', { type: 'button', class: 'ghost', style: 'min-height:16px;padding:0 2px;border:0', onClick: function () { set(function (dd) { dd.tokens = dd.tokens.filter(function (x) { return x !== t; }); if (!dd.tokens.length) delete dd.tokens; }); } }, '×'));
    })));
    body.appendChild(tselect(tokenOpts, '', function (v) { if (v) set(function (dd) { dd.tokens = (dd.tokens || []).concat([v]); }); }));
    body.appendChild(field('メモ（レスポンシブの挙動など）', tarea(ds.note || '', function (v) { setKeep('note', function (dd) { if (v) dd.note = v; else delete dd.note; }); }, 2)));
    body.appendChild(h('p', {}, btn('デザインの面を外す', function () { dropFacet(o, 'design'); }, 'danger')));
    return details('design', 'デザイン設定', body);
  }

  /* ---- concept facet ---- */
  function conceptSection(o) {
    var c = o.concept, m = model();
    if (!c) return details('concept', '概念図の設定', h('p', { class: 'muted' }, 'この面はまだありません。'));
    var body = h('div', {},
      h('div', { class: 'row2' },
        field('領域', tselect((m.domains || []).map(function (x) { return [x.id, x.ja]; }), c.domain, function (v) { A.edit(function (mm) { find2(mm, o.id).concept.domain = v; }); })),
        field('領域内の並び順', tinput(c.order, function (v) { A.edit(function (mm) { find2(mm, o.id).concept.order = v === '' ? 0 : +v; }, live(o.id + ':co')); }, { number: true, step: 1 }))),
      h('p', {}, btn('概念図の面を外す', function () { dropFacet(o, 'concept'); }, 'danger')));
    return details('concept', '概念図の設定', body);
  }

  /* ---- ER facet ---- */
  function erSection(o) {
    var er = o.er, m = model(), d = derived();
    if (!er) return details('er', 'ER図の設定', h('p', { class: 'muted' }, 'この面はまだありません。'));
    var body = h('div', {});
    if (er.rowOf) {
      var tables = m.objects.filter(function (x) { return OM.isEntity(x); }).map(function (x) { return [x.id, (x.er.table || lab(x)) + '（' + lab(x) + '）']; });
      body.appendChild(field('どのテーブルの行か', tselect(tables, er.rowOf, function (v) { A.edit(function (mm) { find2(mm, o.id).er.rowOf = v; }); })));
      body.appendChild(h('label', {}, '行の値'));
      var vals = er.values || {};
      Object.keys(vals).forEach(function (k) {
        body.appendChild(h('div', { class: 'row2' }, tinput(k, function (nv) { A.edit(function (mm) { var x = find2(mm, o.id).er.values; if (nv && nv !== k && !(nv in x)) { x[nv] = x[k]; delete x[k]; } }); }, { onChange: true }),
          tinput(vals[k], function (v) { A.edit(function (mm) { find2(mm, o.id).er.values[k] = v; }, live(o.id + ':v:' + k)); })));
      });
      body.appendChild(btn('＋ 値を追加', function () { A.edit(function (mm) { var x = find2(mm, o.id).er; x.values = x.values || {}; var i = 1; while (('field' + i) in x.values) i++; x.values['field' + i] = ''; }); }));
    } else {
      body.appendChild(h('div', { class: 'row2' },
        field('テーブル名', tinput(er.table || '', function (v) { A.edit(function (mm) { find2(mm, o.id).er.table = v; }, live(o.id + ':tb')); })),
        field('ER図の列（位置の目安）', tselect([['', '自動'], ['0', '1列目'], ['1', '2列目'], ['2', '3列目'], ['3', '4列目']], er.col == null ? '' : String(er.col), function (v) { A.edit(function (mm) { var x = find2(mm, o.id).er; if (v === '') delete x.col; else x.col = +v; }); }))));
      body.appendChild(h('label', {}, 'フィールド'));
      er.fields.forEach(function (f, i) { body.appendChild(fieldRow(o, f, i)); });
      body.appendChild(btn('＋ フィールドを追加', function () { A.edit(function (mm) { var x = find2(mm, o.id).er.fields, n = 1; while (x.some(function (q) { return q.name === 'field_' + n; })) n++; x.push({ name: 'field_' + n, type: 'text' }); }); }, 'primary'));
      var t = d.tables.get(o.id), auto = t ? t.fields.filter(function (f) { return f.derived; }) : [];
      if (auto.length) {
        body.appendChild(h('label', {}, 'リンクから自動生成された外部キー（編集不可）'));
        auto.forEach(function (f) { body.appendChild(h('div', { class: 'fld derived' }, h('span', {}, h('code', {}, f.name), ' → ' + (d.tables.get(f.fk) ? d.tables.get(f.fk).name : f.fk)), h('span', {}, 'FK'))); });
      }
    }
    body.appendChild(h('p', {}, btn('ERの面を外す', function () { dropFacet(o, 'er'); }, 'danger')));
    return details('er', 'ER図の設定', body);
  }

  function fieldRow(o, f, i) {
    var upd = function (mut, key) { A.edit(function (mm) { mut(find2(mm, o.id).er.fields[i]); }, key ? live(o.id + ':f' + i + key) : {}); };
    var row = h('div', { class: 'fld' },
      tinput(f.name, function (v) {
        v = v.trim(); if (!v || v === f.name) { render(); return; }
        if (o.er.fields.some(function (q) { return q.name === v; })) { A.toast('同じ名前のフィールドがあります'); render(); return; }
        A.edit(function (mm) { OM.renameField(mm, o.id, f.name, v); });
      }, { onChange: true, aria: 'フィールド名' }),
      tselect(TYPES.map(function (x) { return [x, x]; }), f.type === 'fk' ? 'ref' : f.type, function (v) { upd(function (ff) { ff.type = v; }); }, { aria: '型' }),
      h('span', {}, btn('↑', function () { A.edit(function (mm) { var a = find2(mm, o.id).er.fields; if (i > 0) { var t = a[i - 1]; a[i - 1] = a[i]; a[i] = t; } }); }, '', '上へ'), btn('↓', function () { A.edit(function (mm) { var a = find2(mm, o.id).er.fields; if (i < a.length - 1) { var t = a[i + 1]; a[i + 1] = a[i]; a[i] = t; } }); }, '', '下へ'), btn('×', function () { A.edit(function (mm) { find2(mm, o.id).er.fields.splice(i, 1); }); }, 'danger', '削除')),
      h('div', { class: 'flags' },
        tcheck('PK', f.pk, function (on) { upd(function (ff) { if (on) ff.pk = true; else delete ff.pk; }); }),
        tcheck('必須', f.req, function (on) { upd(function (ff) { if (on) ff.req = true; else delete ff.req; }); }),
        tcheck('3言語', f.i18n, function (on) { upd(function (ff) { if (on) ff.i18n = true; else delete ff.i18n; }); }),
        tcheck('空でよい', f.nullable, function (on) { upd(function (ff) { if (on) ff.nullable = true; else delete ff.nullable; }); }),
        tcheck('いまは仮の値', f.placeholder, function (on) { upd(function (ff) { if (on) ff.placeholder = true; else delete ff.placeholder; }); })),
      h('div', { style: 'grid-column:1/-1' }, tinput(f.note || '', function (v) { upd(function (ff) { if (v) ff.note = v; else delete ff.note; }, 'n'); }, { placeholder: 'メモ（任意）' })));
    return row;
  }

  /* ---- links ---- */
  function linksSection(o) {
    var m = model(), body = h('div', {});
    var mine = (m.links || []).filter(function (l) { return l.from === o.id || l.to === o.id; });
    var objOpts = m.objects.filter(function (x) { return x.id !== o.id; }).map(function (x) { return [x.id, lab(x)]; });
    if (!mine.length) body.appendChild(h('p', { class: 'muted' }, '意味のあるつながり（リンク）はまだありません。'));
    mine.forEach(function (l) {
      var out = l.from === o.id, otherId = out ? l.to : l.from, other = find(otherId);
      var upd = function (mut, key) { A.edit(function (mm) { mut(mm.links.find(function (q) { return q.id === l.id; })); }, key ? live('link:' + l.id + key) : {}); };
      var views = l.views || ['concept', 'er'];
      body.appendChild(h('div', { class: 'link' },
        h('div', { class: 'h' }, h('span', { class: 'arrow' }, out ? '→' : '←'), linkChip(otherId), h('span', { class: 'muted' }, (out ? (l.verb && l.verb.ja) : '（' + (l.verb && l.verb.ja) + '）')), btn('×', function () { A.edit(function (mm) { mm.links = mm.links.filter(function (q) { return q.id !== l.id; }); }); }, 'danger', 'このリンクを削除')),
        h('div', { class: 'row2' },
          field('つなぐ相手', tselect(objOpts, otherId, function (v) { upd(function (ll) { if (out) ll.to = v; else ll.from = v; }); })),
          field('多重度（' + lab(find(l.from)) + ' : ' + lab(find(l.to)) + '）', tselect(CARDS, l.card, function (v) { upd(function (ll) { ll.card = v; }); }))),
        h('div', { class: 'row2' },
          field('動詞（日本語）', tinput(l.verb && l.verb.ja, function (v) { upd(function (ll) { ll.verb = ll.verb || {}; ll.verb.ja = v; }, 'ja'); })),
          field('verb (English)', tinput(l.verb && l.verb.en, function (v) { upd(function (ll) { ll.verb = ll.verb || {}; ll.verb.en = v; }, 'en'); }))),
        h('div', { class: 'checks' }, h('span', { class: 'muted' }, '出す場所：'), VIEWS.map(function (vw) {
          return tcheck(vw[1], views.indexOf(vw[0]) > -1, function (on) { upd(function (ll) { var s = (ll.views || ['concept', 'er']).slice(); var ix = s.indexOf(vw[0]); if (on && ix < 0) s.push(vw[0]); if (!on && ix > -1) s.splice(ix, 1); ll.views = s; }); });
        })),
        h('div', { class: 'row2' },
          field('FKになるフィールド名（任意）', tinput(l.field || '', function (v) { upd(function (ll) { if (v) ll.field = v; else delete ll.field; }, 'f'); })),
          h('div', { class: 'checks', style: 'align-self:end' }, tcheck('FKを作らない', l.noFk, function (on) { upd(function (ll) { if (on) ll.noFk = true; else delete ll.noFk; }); }), tcheck('空でよい', l.optional, function (on) { upd(function (ll) { if (on) ll.optional = true; else delete ll.optional; }); })))));
    });
    var nl = { dir: 'out', other: objOpts[0] && objOpts[0][0], card: '1:N', ja: '', en: '' };
    var add = h('div', { class: 'link' }, h('div', { class: 'h' }, '＋ リンクを追加'),
      h('div', { class: 'row2' },
        field('向き', tselect([['out', lab(o) + ' → 相手'], ['in', '相手 → ' + lab(o)]], 'out', function (v) { nl.dir = v; })),
        field('相手', tselect(objOpts, nl.other, function (v) { nl.other = v; }))),
      h('div', { class: 'row3' },
        field('多重度', tselect(CARDS, nl.card, function (v) { nl.card = v; })),
        field('動詞（日）', tinput('', function (v) { nl.ja = v; })),
        field('verb (en)', tinput('', function (v) { nl.en = v; }))),
      btn('追加', function () {
        if (!nl.other) return;
        A.edit(function (mm) {
          var n = 1, ids = new Set((mm.links || []).map(function (q) { return q.id; })); while (ids.has('l' + n)) n++;
          (mm.links = mm.links || []).push({ id: 'l' + n, from: nl.dir === 'out' ? o.id : nl.other, to: nl.dir === 'out' ? nl.other : o.id, card: nl.card, verb: { ja: nl.ja, en: nl.en } });
        });
        A.toast('リンクを追加しました（概念図とER図に出ます）');
      }, 'primary'));
    body.appendChild(add);
    return details('links', 'つながり（リンク）', body, h('span', { class: 'chip' }, String(mine.length)));
  }

  /* ---- what is derived, not edited ---- */
  function derivedSection(o) {
    var d = derived(), body = h('div', {});
    var row = function (title, ids) { if (!ids.length) return; body.appendChild(h('p', { class: 'muted' }, title)); body.appendChild(h('div', { class: 'chips' }, ids.map(linkChip))); };
    var ds = o.design;
    if (ds && ds.parent) row('ページ上の親（design.parent）', [ds.parent]);
    row('ページ上の子', d.children.get(o.id) || []);
    row('他にも表示される場所（alsoIn）', ds && ds.alsoIn || []);
    row('この場所を「他にも」で借りているもの', d.refs.filter(function (r) { return r.in === o.id; }).map(function (r) { return r.object; }));
    var edges = d.edges.concept.filter(function (e) { return e.kind === 'contain' && (e.from === o.id || e.to === o.id); });
    if (edges.length) { body.appendChild(h('p', { class: 'muted' }, '入れ子から自動でできる概念図の線（含む）')); body.appendChild(h('div', { class: 'chips' }, edges.map(function (e) { return linkChip(e.from === o.id ? e.to : e.from); }))); }
    var owner = d.erOwner(o.id);
    var slotEdges = d.edges.er.filter(function (e) { return e.kind === 'slot' && (e.from === owner); });
    slotEdges.forEach(function (e) { body.appendChild(h('p', { class: 'muted' }, 'ER：写真枠 ' + (e.slots || []).join('・') + ' を ' + e.field + ' で使う（design.slot から自動）')); });
    if (owner && d.edges.er.some(function (e) { return e.kind === 'i18n' && e.from === owner; })) body.appendChild(h('p', { class: 'muted' }, 'ER：3言語フィールドがあるので Translation につながる（自動）'));
    if (!body.childNodes.length) body.appendChild(h('p', { class: 'muted' }, '自動でできるつながりはありません。'));
    body.insertBefore(h('p', { class: 'muted' }, 'ここにあるのは手で入力しなくても、他の設定から自動で決まるつながりです。'), body.firstChild);
    return details('derived', '自動で決まるつながり', body);
  }

  function dangerSection(o) {
    return details('danger', '削除・ID変更', h('div', {},
      field('ID を変更（すべての参照を追従）', tinput(o.id, function (v) {
        v = v.trim();
        if (!/^[a-z0-9][a-z0-9-]*$/.test(v) || v === o.id || find(v)) { A.toast('IDは小文字・数字・ハイフンで、重複しないものにしてください'); render(); return; }
        A.edit(function (mm) { OM.renameId(mm, o.id, v); }); A.select(v);
      }, { onChange: true })),
      h('p', {}, btn('このオブジェクトを削除', function () {
        if (OM.isRoot(o)) { A.toast('ページ全体（ルート）は削除できません'); return; }
        var nrows = OM.isEntity(o) ? rowCount(o) : 0;
        if (!window.confirm('「' + lab(o) + '」を削除します。つながっているリンクも消えます' + (nrows ? '。このテーブルの行 ' + nrows + ' 件のERの値も消えます' : '') + '（元に戻せます）。')) return;
        A.edit(function (mm) { OM.removeObject(mm, o.id); }); A.select(null);
      }, 'danger'))));
  }

  /* ------------------------------------------------------- add / JSON forms */
  function openAdd() {
    var m = model(), draft = { ja: '', en: '', kind: 'entity', status: 'placeholder', design: false, concept: true, er: true, domain: (m.domains[0] || {}).id };
    root.innerHTML = '';
    var wrap = h('div', {}, btn('← 戻る', function () { render(); }, 'ghost'), h('h2', {}, 'オブジェクトを追加'),
      h('p', { class: 'muted' }, '追加すると、選んだ面（デザイン・概念図・ER）に同時に現れます。あとから面の追加・削除もできます。'),
      h('div', { class: 'row2' }, field('名前（日本語）', tinput('', function (v) { draft.ja = v; })), field('name (English)', tinput('', function (v) { draft.en = v; }))),
      h('div', { class: 'row2' }, field('種類', tselect(KINDS, draft.kind, function (v) { draft.kind = v; })), field('状態', tselect(STATUSES, draft.status, function (v) { draft.status = v; }))),
      field('概念図の領域', tselect((m.domains || []).map(function (x) { return [x.id, x.ja]; }), draft.domain, function (v) { draft.domain = v; })),
      h('div', { class: 'checks' }, h('span', { class: 'muted' }, '出す面：'), tcheck('デザイン', draft.design, function (on) { draft.design = on; }), tcheck('概念図', draft.concept, function (on) { draft.concept = on; }), tcheck('ER図', draft.er, function (on) { draft.er = on; })),
      h('p', {}, btn('追加する', function () {
        var id = (draft.en || draft.ja || 'object').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'object';
        var base = id, n = 2; while (find(id)) id = base + '-' + (n++);
        A.edit(function (mm) {
          var o = { id: id, kind: draft.kind, ja: draft.ja || id, en: draft.en || id, status: draft.status, summary: '' };
          if (draft.design) o.design = { parent: OM.derive(mm).designRoot, order: 99, mock: 'generic', h: 90, component: '' };
          if (draft.concept) o.concept = { domain: draft.domain, order: 99 };
          if (draft.er) o.er = draft.kind === 'row' ? { rowOf: (mm.objects.find(function (y) { return OM.isEntity(y); }) || {}).id || '', values: {} } : { table: (draft.en || id).replace(/[^A-Za-z0-9]/g, '') || 'Table', fields: [{ name: 'id', type: 'id', pk: true }] };
          mm.objects.push(o);
        });
        var v = draft.design ? 'design' : draft.concept ? 'concept' : 'er';
        A.setView(v); A.select(id, { reveal: true }); A.toast('「' + (draft.ja || id) + '」を追加しました');
      }, 'primary')));
    root.appendChild(wrap);
  }

  function openJson() {
    var ta = h('textarea', { class: 'json', spellcheck: 'false' }); ta.value = JSON.stringify(model(), null, 2);
    var msg = h('p', { class: 'issues' });
    root.innerHTML = '';
    root.appendChild(h('div', {}, btn('← 戻る', function () { render(); }, 'ghost'), h('h2', {}, 'データを直接編集（JSON）'),
      h('p', { class: 'muted' }, 'これが model.js の中身そのものです。適用すると、デザイン・概念図・ER図がすべて描き直されます。'),
      ta, msg,
      h('p', {}, btn('適用', function () {
        var m2; try { m2 = JSON.parse(ta.value); } catch (e) { msg.innerHTML = ''; msg.appendChild(h('li', {}, 'JSON として読めません：' + e.message)); return; }
        var issues = OM.validate(m2), errs = issues.filter(function (i) { return i.level === 'error'; });
        if (errs.length) { msg.innerHTML = ''; errs.slice(0, 8).forEach(function (i) { msg.appendChild(h('li', {}, i.msg)); }); return; }
        A.replaceModel(m2, 'JSON を適用しました'); render();
      }, 'primary'), ' ', btn('現在の状態に戻す', function () { ta.value = JSON.stringify(model(), null, 2); msg.innerHTML = ''; }))));
  }

  window.OMInspector = { render: render, refreshLight: function () { /* inputs keep focus while typing; nothing to redraw */ }, openAdd: openAdd, openJson: openJson };
  A.init();
})();
