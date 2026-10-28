// India choropleth (state, district or Lok Sabha constituency) for the
// data-infographic skill.
//
// Geometry: shared/geo/india.js (states, DataMeet), india-districts.js and
// india-pc.js (datta07). All three are India's official outline: J&K includes
// PoJK; Ladakh includes Gilgit-Baltistan, Aksai Chin and Shaksgam; Arunachal
// is whole. Never swap in another boundary file: see each file's header.
//
// Plain DOM + SVG, no D3, so it works inside any style's page. Fonts and
// colours come from the caller; nothing here is style-specific.
//
//   const m = IndiaMap.draw(svgEl, {
//     width: 900, height: 980,
//     data: [{ state: 'Bihar', value: 7.1 }, 'Kerala | 0.74', ...] or { Bihar: 7.1 },
//     bins: [0.5, 1, 2, 5], colors: [5 colours],     // colours = bins + 1
//     format: v => '₹' + v,                           // inline label text
//   });
//   level: 'district' (load india-districts.js) or 'pc' (load india-pc.js);
//   focus: 'Uttar Pradesh' zooms to one state's units; annotate: hero callouts.
//   IndiaMap.legend(el, { bins, colors, format, title });
//   IndiaMap.smallTable(el, m.small, { title: 'Too small to see' });
(function () {
  const G = window.INDIA_GEO;
  if (!G) throw new Error('india-map.js needs shared/geo/india.js loaded first');

  // ── Projection: Lambert conformal conic, the usual India setting ──────
  // (standard parallels 12.47°N / 35.17°N, centred on 80°E 24°N). Gives the
  // familiar Survey-of-India silhouette rather than a stretched plate carrée.
  const R = Math.PI / 180, p1 = 12.47 * R, p2 = 35.17 * R, p0 = 24 * R, l0 = 80 * R;
  const tq = (p) => Math.tan(Math.PI / 4 + p / 2);
  const n = Math.log(Math.cos(p1) / Math.cos(p2)) / Math.log(tq(p2) / tq(p1));
  const F = Math.cos(p1) * Math.pow(tq(p1), n) / n;
  const rho0 = F / Math.pow(tq(p0), n);
  function lcc(lon, lat) {
    const rho = F / Math.pow(tq(lat * R), n), th = n * (lon * R - l0);
    return [rho * Math.sin(th), -(rho0 - rho * Math.cos(th))];   // y down
  }

  const NAMES = Object.keys(G.s);
  const proj = (rings) => rings.map((ring) => ring.map(([lo, la]) => lcc(lo, la)));

  // ── Names ─────────────────────────────────────────────────────────────
  // Matching ignores case, spaces, punctuation and "and" vs "&".
  const ALIAS = {
    'Andaman and Nicobar Islands': 'Andaman & Nicobar', 'A&N Islands': 'Andaman & Nicobar',
    'A&N': 'Andaman & Nicobar', 'Andaman': 'Andaman & Nicobar',
    'J&K': 'Jammu & Kashmir', 'JK': 'Jammu & Kashmir',
    'NCT of Delhi': 'Delhi', 'Delhi NCT': 'Delhi', 'New Delhi': 'Delhi',
    'Orissa': 'Odisha', 'Pondicherry': 'Puducherry', 'Uttaranchal': 'Uttarakhand',
    'DNH & DD': 'Dadra and Nagar Haveli and Daman and Diu', 'DNHDD': 'Dadra and Nagar Haveli and Daman and Diu',
    'DNH and Daman Diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'Dadra & Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'Daman & Diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'Dadra,NH,Daman,Diu': 'Dadra and Nagar Haveli and Daman and Diu', 'DNH&DD': 'Dadra and Nagar Haveli and Daman and Diu',
    'UP': 'Uttar Pradesh', 'MP': 'Madhya Pradesh', 'AP': 'Andhra Pradesh', 'WB': 'West Bengal',
    'TN': 'Tamil Nadu', 'HP': 'Himachal Pradesh',
    // spellings seen in MoSPI / DGCI&S tables
    'Keralam': 'Kerala', 'Chattisgarh': 'Chhattisgarh', 'A & N. Island': 'Andaman & Nicobar',
    'Dadra & N Haveli & Daman & Diu': 'Dadra and Nagar Haveli and Daman and Diu',
  };
  const key = (s) => String(s || '').toLowerCase().replace(/\band\b/g, '&').replace(/[^a-z&]/g, '');
  const INDEX = {};
  NAMES.forEach((nm) => { INDEX[key(nm)] = nm; });
  Object.entries(ALIAS).forEach(([a, nm]) => { INDEX[key(a)] = nm; });
  const resolve = (name) => INDEX[key(name)] || null;

  const SHORT = {
    'Dadra and Nagar Haveli and Daman and Diu': 'DNH & Daman Diu',
    'Andaman & Nicobar': 'A&N Islands',
  };
  const short = (nm) => SHORT[nm] || nm;

  // Too small to carry a label at feed size: listed in a side table instead.
  const SMALL = ['Delhi', 'Chandigarh', 'Puducherry', 'Dadra and Nagar Haveli and Daman and Diu',
                 'Lakshadweep', 'Andaman & Nicobar'];
  // Visible but too narrow for an inline label: name + value outside, on a
  // leader line. `at` is where the text sits (lon, lat), placed in empty
  // space: the Arabian Sea, Tibet, Bangladesh and Myanmar are blank on this map.
  const CALLOUT = {
    'Goa':      { at: [71.0, 15.2], a: 'end' },
    'Kerala':   { at: [73.4, 9.4],  a: 'end' },
    'Sikkim':   { at: [88.4, 29.9], a: 'middle', pos: 'above' },
    'Tripura':  { at: [91.75, 21.55], a: 'middle', pos: 'below' },
    'Mizoram':  { at: [94.5, 22.3], a: 'start' },
    'Manipur':  { at: [95.7, 24.1], a: 'start' },
    'Nagaland': { at: [96.2, 25.9], a: 'start' },
  };
  // Open water / blank land a page can hand to a row as `callout: IndiaMap.SPOTS.bay`
  // when a big state's name won't fit inside it (West Bengal, Kerala).
  const SPOTS = {
    bay:      { at: [88.5, 20.7], a: 'middle', pos: 'below' },   // north Bay of Bengal
    arabian:  { at: [70.6, 18.6], a: 'end' },                    // off Mumbai
    tibet:    { at: [86.0, 31.5], a: 'middle', pos: 'above' },
  };
  // Inner points that land badly for a label (thin or bent states).
  const LABEL_AT = {
    'West Bengal': [87.95, 23.25], 'Haryana': [76.2, 29.25], 'Uttarakhand': [79.2, 30.15],
    'Himachal Pradesh': [77.3, 31.85], 'Punjab': [75.4, 30.85], 'Jammu & Kashmir': [75.2, 33.6],
    'Assam': [92.8, 26.25], 'Meghalaya': [91.3, 25.55], 'Arunachal Pradesh': [94.0, 28.1],
    'Andhra Pradesh': [79.2, 15.2], 'Tamil Nadu': [78.3, 11.0], 'Gujarat': [71.7, 22.6],
    'Maharashtra': [75.9, 19.4], 'Uttar Pradesh': [80.3, 26.55], 'Telangana': [79.0, 17.9], 'Chhattisgarh': [82.1, 21.6],
  };
  const labelPoint = (nm) => LABEL_AT[nm] || G.l[nm];

  // ── Colour helpers ────────────────────────────────────────────────────
  const hexRgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = (h) => { const [r, g, b] = hexRgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // Label ink: whichever of the two inks reads better on the fill.
  const inkOn = (fill, dark, light) => (contrast(fill, dark) >= contrast(fill, light) ? dark : light);

  // OKLab interpolation, for building an n-step ramp from a few anchors.
  function toOk(h) {
    const [r, g, b] = hexRgb(h).map(lin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  function fromOk([L, A, B]) {
    const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
    const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
    const s = Math.pow(L - 0.0894841775 * A - 1.2914855480 * B, 3);
    const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
                 -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
                 -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    return '#' + rgb.map((c) => {
      c = Math.max(0, Math.min(1, c));
      c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
      return Math.round(c * 255).toString(16).padStart(2, '0');
    }).join('').toUpperCase();
  }
  function ramp(anchors, count) {
    const ok = anchors.map(toOk);
    return Array.from({ length: count }, (_, i) => {
      const t = count === 1 ? 0 : (i / (count - 1)) * (ok.length - 1);
      const j = Math.min(Math.floor(t), ok.length - 2), f = t - j;
      return fromOk(ok[j].map((v, k) => v + (ok[j + 1][k] - v) * f));
    });
  }

  // Quantile thresholds rounded to two significant figures, deduplicated.
  function quantileBins(values, classes = 5) {
    const v = values.filter(Number.isFinite).sort((a, b) => a - b);
    const nice = (x) => { if (!x) return 0; const p = Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 1);
      return Math.round(x / p) * p; };
    const out = [];
    for (let i = 1; i < classes; i++) {
      const t = nice(v[Math.floor((i / classes) * v.length)]);
      if (!out.includes(t) && t > v[0]) out.push(t);
    }
    return out;
  }

  // ── Layers ────────────────────────────────────────────────────────────
  // Every level is a list of units {name, state, code, label:[lon,lat], P}
  // (P = projected rings) plus, for district/pc, a dissolved state layer
  // built from the same arcs so state lines sit exactly on unit edges.
  const LAYERS = {};
  function layer(level) {
    if (LAYERS[level]) return LAYERS[level];
    let units, borders = null;
    if (level === 'state') {
      units = NAMES.map((nm) => ({ name: nm, state: nm, code: null, label: labelPoint(nm), P: proj(G.s[nm]) }));
    } else {
      const D = level === 'district' ? window.INDIA_DIST : level === 'pc' ? window.INDIA_PC : null;
      if (!D) throw new Error(`IndiaMap level '${level}' needs shared/geo/india-${level === 'pc' ? 'pc' : 'districts'}.js loaded`);
      units = D.u.map(([name, state, code, label, rings]) => ({ name, state, code, label, P: proj(rings) }));
      borders = {};
      Object.entries(D.s).forEach(([st, rings]) => { borders[st] = proj(rings); });
    }
    units.forEach((u, i) => {
      u.i = i;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      u.P.forEach((r) => r.forEach(([x, y]) => {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }));
      u.bb = [x0, y0, x1, y1];
    });
    const byKey = {};
    units.forEach((u) => { if (!u.name) return; (byKey[key(u.name)] = byKey[key(u.name)] || []).push(u); });
    return (LAYERS[level] = { level, units, borders, byKey });
  }

  const lev = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  // Find the unit a data row means. State level: by state name. District /
  // pc: by `code` (LGD district code, or PC number + state), else by name
  // (+ state when names repeat across states), else a close spelling
  // (edit distance ≤ 2) — reported in `fuzzy` so a person checks it.
  function match(L, row, fuzzy) {
    if (L.level === 'state') {
      const nm = resolve(row.state || row.name);
      return nm ? L.units.find((u) => u.name === nm) : null;
    }
    const st = row.state ? resolve(row.state) : null;
    if (row.code != null && row.code !== '') {
      const hit = L.units.filter((u) => u.code != null && String(u.code) === String(row.code) && (!st || u.state === st));
      if (hit.length === 1) return hit[0];
    }
    const nmRaw = row.name || row.district || row.pc;
    if (!nmRaw) return null;
    const k = key(nmRaw);
    let hit = (L.byKey[k] || []).filter((u) => !st || u.state === st);
    if (hit.length === 1) return hit[0];
    if (hit.length > 1) { console.warn(`IndiaMap: "${nmRaw}" is in several states; add state:`); return null; }
    let best = null, bd = 3;
    L.units.forEach((u) => {
      if (!u.name || (st && u.state !== st) || k.length < 5) return;
      const dd = lev(k, key(u.name));
      if (dd < bd) { bd = dd; best = u; }
    });
    if (best) fuzzy.push(`${nmRaw} → ${best.name} (${best.state})`);
    return best;
  }

  // ── Data ──────────────────────────────────────────────────────────────
  function rowsOf(data) {
    if (!data) return [];
    if (!Array.isArray(data)) return Object.entries(data).map(([state, value]) => ({ state, value }));
    return data.map((r) => {
      if (typeof r !== 'string') return r;
      const [state, value, label] = r.split('|').map((s) => s.trim());
      return { state, value: Number(value), label };
    });
  }

  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => v != null && e.setAttribute(k, v));
    if (parent) parent.appendChild(e);
    return e;
  };

  // ── Draw ──────────────────────────────────────────────────────────────
  function draw(svg, o) {
    const level = o.level || 'state';
    const L = layer(level);
    const isState = level === 'state';
    const focus = o.focus ? [].concat(o.focus).map(resolve) : null;
    const units = focus ? L.units.filter((u) => focus.includes(u.state)) : L.units;

    const W = o.width, H = o.height, pad = o.padding != null ? o.padding : 8;
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    units.forEach(({ bb }) => { bx0 = Math.min(bx0, bb[0]); by0 = Math.min(by0, bb[1]);
      bx1 = Math.max(bx1, bb[2]); by1 = Math.max(by1, bb[3]); });
    const bw = bx1 - bx0, bh = by1 - by0;
    const s = Math.min((W - 2 * pad) / bw, (H - 2 * pad) / bh) * (o.zoom || 1);
    const ox = (o.align === 'left' ? pad : o.align === 'right' ? W - pad - bw * s : (W - bw * s) / 2)
             - bx0 * s + (o.dx || 0);
    const oy = (o.valign === 'top' ? pad : o.valign === 'bottom' ? H - pad - bh * s : (H - bh * s) / 2)
             - by0 * s + (o.dy || 0);
    const xy = (lon, lat) => { const [x, y] = lcc(lon, lat); return [x * s + ox, y * s + oy]; };

    const inkDark = o.inkDark || '#121212', inkLight = o.inkLight || '#FFFFFF';
    const border = o.border || '#FFFFFF';
    const borderW = o.borderWidth != null ? o.borderWidth : isState ? 1.6 : level === 'pc' ? 0.6 : 0.5;
    const fmt = o.format || ((v) => String(v));
    const labelFont = o.labelFont || 'inherit';
    const labelSize = o.labelSize || 22;
    const nameSize = o.nameSize || Math.round(labelSize * 0.82);
    const nameInk = o.nameInk || '#555';
    const missing = o.missingFill || '#E6E5E1';

    // Resolve rows → units
    const rowOf = new Map(), unknown = [], fuzzy = [];
    rowsOf(o.data).forEach((r) => {
      const u = match(L, r, fuzzy);
      if (!u) { unknown.push(r.name || r.district || r.pc || r.state); return; }
      rowOf.set(u, { ...r, unit: u });
    });
    if (unknown.length) console.warn('IndiaMap: no match for', unknown);
    if (fuzzy.length) console.warn('IndiaMap: fuzzy matches, check them:', fuzzy);

    const colorFor = (row) => {
      if (o.color) return o.color(row);
      const v = Number(row.value);
      if (!Number.isFinite(v) || !o.bins) return o.colors ? o.colors[o.colors.length - 1] : '#999';
      return o.colors[o.bins.filter((t) => v >= t).length];
    };

    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.overflow = 'visible';
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Optional no-data hatch (missingFill: 'hatch'). The default is a flat
    // neutral, so no part of the map, least of all the north, reads as
    // "marked out": it's simply land without a figure.
    const defs = el('defs', {}, svg);
    const pat = el('pattern', { id: 'im-hatch', width: 7, height: 7, patternUnits: 'userSpaceOnUse',
      patternTransform: 'rotate(45)' }, defs);
    el('rect', { width: 7, height: 7, fill: '#F2F2F0' }, pat);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: '#C9C9C4', 'stroke-width': 1.6 }, pat);
    const missingFill = missing === 'hatch' ? 'url(#im-hatch)' : missing;

    const pathP = (P) => P.map((ring) => 'M' + ring.map(([x, y]) =>
      `${(x * s + ox).toFixed(1)},${(y * s + oy).toFixed(1)}`).join('L') + 'Z').join('');
    const stateShapes = isState ? null
      : Object.entries(L.borders).filter(([st]) => !focus || focus.includes(st));

    // Halo outline: shapes stroked wider in grey first, then filled over.
    // Interior strokes are covered by the neighbouring fills, so the grey
    // survives only on the outer edge — pale bins stay visible on white.
    if (o.outline !== false) {
      const gO = el('g', {}, svg);
      const ow = (isState ? borderW : 1.2) + 2 * (o.outlineWidth || 1);
      (isState ? units.map((u) => u.P) : stateShapes.map(([, P]) => P)).forEach((P) =>
        el('path', { d: pathP(P), fill: 'none', stroke: o.outline || '#BDBDB8', 'stroke-width': ow,
          'stroke-linejoin': 'round' }, gO));
    }
    const gUnits = el('g', {}, svg);
    const fills = new Map();
    units.forEach((u) => {
      const row = rowOf.get(u);
      const fill = row ? colorFor(row) : (u.name ? missingFill : (o.blankFill || (missing === 'hatch' ? '#E6E5E1' : missingFill)));
      fills.set(u, fill);
      el('path', { d: pathP(u.P), fill, stroke: border, 'stroke-width': borderW,
        'stroke-linejoin': 'round', 'fill-rule': 'evenodd', 'data-unit': u.name || '' }, gUnits);
    });
    // State lines over district / constituency maps.
    if (!isState && o.stateBorder !== false) {
      const gB = el('g', {}, svg);
      stateShapes.forEach(([, P]) => el('path', { d: pathP(P), fill: 'none', stroke: o.stateBorder || '#FFFFFF',
        'stroke-width': o.stateBorderWidth || 2.2, 'stroke-linejoin': 'round' }, gB));
    }
    // Emphasised units get an ink outline drawn above every neighbour.
    const drawn = new Set(units);
    [...rowOf.values()].filter((r) => r.emphasis && drawn.has(r.unit)).forEach((r) => {
      el('path', { d: pathP(r.unit.P), fill: 'none', stroke: o.emphasisInk || inkDark,
        'stroke-width': o.emphasisWidth || 3, 'stroke-linejoin': 'round' }, svg);
    });

    const gLabels = el('g', { 'font-family': labelFont }, svg);
    const text = (x, y, str, attrs) => { const t = el('text', { x, y, ...attrs }, gLabels); t.textContent = str; return t; };
    const small = [];
    // Labels default on for states and for a single focused state; off for
    // all-India district / constituency maps (755 shapes can't carry text).
    const showLabels = o.labels != null ? o.labels : (isState || !!focus);
    const named = (o.names || []).map((n) => match(L, typeof n === 'string' ? { state: n, name: n } : n, [])).filter(Boolean);
    const unitPt = (u) => (u.label ? xy(...u.label) : [0, 0]);

    rowOf.forEach((row, u) => {
      if (!drawn.has(u)) return;           // outside the focused state(s)
      const nm = u.name;
      const str = row.label != null && row.label !== '' ? String(row.label) : fmt(Number(row.value), row);
      if (isState && (SMALL.includes(nm) || row.small)) {
        if (!row.hideLabel) small.push({ name: nm, short: short(nm), value: row.value, text: str, color: fills.get(u) });
        return;
      }
      if (!showLabels || row.hideLabel || row.annotate) return;
      const co = row.callout || (isState && o.callouts !== false && CALLOUT[nm]);
      if (co) {
        const at = co.at || co;
        const [sx, sy] = unitPt(u);
        const [tx, ty] = xy(...at);
        const anchor = co.a || 'start';
        // pos: side (default for start/end) · above · below (text block
        // sits above/below the point, centred on it when anchor is middle)
        const pos = co.pos || (anchor === 'middle' ? 'above' : 'side');
        const lineH = labelSize + 2;
        let nameY, ex, ey;
        if (pos === 'above') { nameY = ty - lineH - 6; ex = tx; ey = ty + 6; }
        else if (pos === 'below') { nameY = ty + nameSize; ex = tx; ey = ty - 6; }
        else { nameY = ty; ex = tx + (anchor === 'end' ? 8 : -8); ey = ty - nameSize * 0.35; }
        const lk = o.leaderInk || '#333';
        el('line', { x1: sx, y1: sy, x2: ex, y2: ey, stroke: lk, 'stroke-width': o.leaderWidth || 1.4 }, gLabels);
        el('circle', { cx: sx, cy: sy, r: 2.6, fill: lk }, gLabels);
        text(tx, nameY, short(nm), { 'text-anchor': anchor, 'font-size': nameSize, fill: nameInk,
          'font-weight': o.nameWeight || 500 });
        if (!co.nameOnly) text(tx, nameY + lineH, str, { 'text-anchor': anchor, 'font-size': labelSize,
          fill: o.calloutInk || inkDark, 'font-weight': o.labelWeight || 700,
          style: 'font-variant-numeric: tabular-nums' });
        return;
      }
      const [x, y] = unitPt(u);
      const withName = row.showName || named.includes(u);
      // District / constituency labels only where the text fits the shape.
      if (!isState && !row.forceLabel) {
        const room = (u.bb[2] - u.bb[0]) * s * 0.8;
        const need = Math.max(str.length * labelSize * 0.6, withName ? short(nm).length * nameSize * 0.55 : 0);
        if (need > room || (u.bb[3] - u.bb[1]) * s < labelSize * (withName ? 2.4 : 1.3)) return;
      }
      const f = fills.get(u);
      const ink = inkOn(f.startsWith('#') ? f : '#FFFFFF', inkDark, inkLight);
      if (withName) {
        text(x, y - labelSize * 0.55, short(nm), { 'text-anchor': 'middle', 'font-size': nameSize,
          fill: ink, 'font-weight': o.nameWeight || 500, opacity: 0.9 });
      }
      text(x, y + (withName ? labelSize * 0.55 : 0), str, { 'text-anchor': 'middle',
        'dominant-baseline': 'central', 'font-size': labelSize, fill: ink,
        'font-weight': o.labelWeight || 700, style: 'font-variant-numeric: tabular-nums' });
    });

    // Hero annotations: the one or two places the story is about, with a
    // big number on a leader line. {name|state, title, value, dx, dy, anchor}
    // dx/dy are px from the unit's label point to the text.
    const hero = el('g', { 'font-family': o.heroFont || labelFont }, svg);
    const heroes = [];
    (o.annotate || []).forEach((a) => {
      const u = match(L, a, fuzzy);
      if (!u) { console.warn('IndiaMap: annotate target not found', a.name || a.state); return; }
      const [sx, sy] = unitPt(u);
      // text at an absolute map position (`at: [lon, lat]`) or offset in px
      const [tx, ty] = a.at ? xy(...a.at) : [sx + (a.dx || 0), sy + (a.dy || 0)];
      const anchor = a.anchor || (tx < sx ? 'end' : 'start');
      const ink = a.ink || o.heroInk || inkDark;
      const big = a.size || o.heroSize || Math.round(labelSize * 2.4);
      const sub = a.titleSize || o.heroTitleSize || Math.round(labelSize * 1.05);
      // Text first, then measure it, then the leader: straight down/up when
      // the block sits under/over the place, else to the block's near edge.
      // The leader gets a paper-coloured halo so it reads across dark fills.
      const g = el('g', {}, hero);
      const lines = [];
      if (a.title) lines.push([a.title, sub, a.titleWeight || 700, a.titleInk || ink]);
      if (a.value != null) lines.push([String(a.value), big, a.valueWeight || 900, a.valueInk || ink]);
      if (a.note) lines.push([a.note, Math.round(sub * 0.9), 500, a.noteInk || nameInk]);
      const above = a.above != null ? a.above : (ty < sy);
      const total = lines.reduce((t, l) => t + l[1] * 1.02, 0);
      let y = above ? ty - total : ty;
      lines.forEach(([str, size, weight, fill]) => {
        y += size * 0.86;
        const t = el('text', { x: tx, y, 'text-anchor': anchor, 'font-size': size, 'font-weight': weight,
          fill, style: 'font-variant-numeric: tabular-nums; letter-spacing: -0.02em' }, g);
        t.textContent = str;
        y += size * 0.16;
      });
      a._g = g; a._src = [sx, sy]; a._ink = ink; a._above = above;
      heroes.push(a);
    });
    // Leaders are placed after fonts settle (the caller re-runs placeLeaders
    // if it swaps the hero font); measured boxes, not estimates.
    const placeLeaders = () => {
      heroes.forEach((a) => {
        if (a._lead) a._lead.remove();
        const bb = a._g.getBBox(), [sx, sy] = a._src;
        const inX = sx >= bb.x && sx <= bb.x + bb.width;
        let ex, ey;
        if (inX) { ex = sx; ey = a._above ? bb.y + bb.height + 8 : bb.y - 8; }
        else { ex = sx < bb.x ? bb.x - 10 : bb.x + bb.width + 10; ey = Math.max(bb.y, Math.min(sy, bb.y + bb.height)); }
        const lead = el('g', {}, hero); hero.insertBefore(lead, hero.firstChild);
        const halo = o.heroHalo || '#FFFFFF';
        el('line', { x1: sx, y1: sy, x2: ex, y2: ey, stroke: halo, 'stroke-width': (o.heroLeaderWidth || 2) + 4,
          'stroke-linecap': 'round', opacity: 0.9 }, lead);
        el('line', { x1: sx, y1: sy, x2: ex, y2: ey, stroke: a._ink, 'stroke-width': o.heroLeaderWidth || 2 }, lead);
        el('circle', { cx: sx, cy: sy, r: o.heroDot || 5, fill: a._ink, stroke: halo, 'stroke-width': 2.5 }, lead);
        a._lead = lead;
      });
    };
    placeLeaders();

    const ord = (n) => (SMALL.includes(n) ? SMALL.indexOf(n) : -1);   // promoted states first
    small.sort((a, b) => ord(a.name) - ord(b.name));
    const fillsByName = {};
    fills.forEach((f, u) => { if (u.name) fillsByName[`${u.name}|${u.state}`] = f; });
    return { small, unknown, fuzzy, xy, scale: s, fills: fillsByName, units, unitPoint: unitPt, placeLeaders,
      match: (row) => match(L, row, []) };
  }

  // ── Legend: stepped, ticks on the boundaries (HTML) ───────────────────
  function legend(host, o) {
    const sw = o.swatch || 56, h = o.swatchHeight || 16, fmt = o.format || String;
    const wrap = document.createElement('div');
    wrap.className = 'im-legend';
    wrap.innerHTML =
      (o.title ? `<div class="im-legend-title">${o.title}</div>` : '') +
      `<div style="position:relative;display:flex;gap:2px;margin-top:10px">` +
        o.colors.map((c) => `<span style="width:${sw}px;height:${h}px;background:${c};display:block;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)"></span>`).join('') +
      `</div>` +
      `<div class="im-legend-ticks" style="position:relative;height:1.6em;margin-top:6px;width:${o.colors.length * (sw + 2)}px">` +
        o.bins.map((b, i) => `<span style="position:absolute;left:${(i + 1) * (sw + 2) - 1}px;transform:translateX(-50%);white-space:nowrap">${fmt(b)}</span>`).join('') +
      `</div>` +
      (o.low || o.high ? `<div class="im-legend-ends" style="display:flex;justify-content:space-between;width:${o.colors.length * (sw + 2)}px;margin-top:4px"><span>${o.low || ''}</span><span>${o.high || ''}</span></div>` : '') +
      (o.noData ? `<div class="im-legend-nodata" style="display:flex;align-items:center;gap:8px;margin-top:8px"><span style="width:22px;height:14px;background:${o.noDataColor || '#E6E5E1'};display:block"></span><span>${o.noData}</span></div>` : '');
    host.appendChild(wrap);
    return wrap;
  }

  // ── "Too small to see" table (HTML) ───────────────────────────────────
  function smallTable(host, rows, o = {}) {
    if (!rows.length) return null;
    const wrap = document.createElement('div');
    wrap.className = 'im-small';
    wrap.innerHTML = `<div class="im-small-title">${o.title || 'Too small to see'}</div>` +
      rows.map((r) => `<div class="im-small-row" style="display:flex;align-items:center;gap:10px">` +
        `<span style="width:16px;height:16px;background:${r.color};flex:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.14)"></span>` +
        `<span class="im-small-name" style="flex:1">${r.short}</span>` +
        `<span class="im-small-val" style="font-variant-numeric:tabular-nums">${r.text}</span></div>`).join('');
    host.appendChild(wrap);
    return wrap;
  }

  window.IndiaMap = { SPOTS, CALLOUT, SMALL, layer, draw, legend, smallTable, ramp, quantileBins, resolve, names: NAMES, lcc, contrast };
})();
