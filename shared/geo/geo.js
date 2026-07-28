// Shared geo helper — country lookup over the bundled world.js ring data.
//
// SOURCE: Natural Earth 10m admin-0, **India point-of-view edition**
// (ne_10m_admin_0_countries_ind), simplified to ~6 km tolerance.
//
// The POV edition matters: Natural Earth's default file draws de-facto control,
// which puts Aksai Chin inside China and Gilgit-Baltistan / Azad Kashmir inside
// Pakistan. Maps published in India must show the whole of the former princely
// state of Jammu & Kashmir as Indian territory, so this pack ships the `_ind`
// edition. Swapping back to the default file would silently redraw those
// borders — don't.
//
// Loaded as a synchronous <script>: render.py screenshots as soon as
// .itiha-slide appears, so an async fetch would race the capture.
(function () {
  const W = window.WORLD;
  if (!W) { window.GEO = null; return; }

  const BY_NAME = {};
  Object.keys(W).forEach((n) => { BY_NAME[n.toLowerCase()] = W[n]; });

  // Natural Earth's own labels are terse ("Dem. Rep. Korea", "S. Sudan") and
  // one spelling per country; authors type the everyday name.
  const ALIASES = {
    'usa': 'united states', 'us': 'united states', 'u.s.': 'united states',
    'u.s.a.': 'united states', 'united states of america': 'united states',
    'america': 'united states',
    'uk': 'united kingdom', 'britain': 'united kingdom',
    'great britain': 'united kingdom', 'england': 'united kingdom',
    'uae': 'united arab emirates', 'emirates': 'united arab emirates',
    'south korea': 'republic of korea', 'korea': 'republic of korea',
    'north korea': 'dem. rep. korea', 'dprk': 'dem. rep. korea',
    'drc': 'democratic republic of the congo',
    'dr congo': 'democratic republic of the congo',
    'democratic republic of congo': 'democratic republic of the congo',
    'congo': 'republic of the congo',
    'czech republic': 'czechia',
    'burma': 'myanmar',
    'holland': 'netherlands',
    'ivory coast': "côte d'ivoire", "cote d'ivoire": "côte d'ivoire",
    'swaziland': 'eswatini',
    'macedonia': 'north macedonia',
    'south sudan': 's. sudan',
    'bosnia': 'bosnia and herz.', 'bosnia and herzegovina': 'bosnia and herz.',
    'dominican republic': 'dominican rep.',
    'central african republic': 'central african rep.',
    'equatorial guinea': 'eq. guinea',
    'solomon islands': 'solomon is.',
    'falkland islands': 'falkland is.',
    'east timor': 'timor-leste',
    'russian federation': 'russia',
    'cape verde': 'cabo verde',
    'palestinian territories': 'palestine',
    'vatican': 'italy',
  };

  function resolve(name) {
    if (!name) return null;
    const k = String(name).trim().toLowerCase();
    if (BY_NAME[k]) return k;
    if (ALIASES[k] && BY_NAME[ALIASES[k]]) return ALIASES[k];
    return null;
  }

  // Russia, Fiji and Antarctica carry rings that step straight across the
  // antimeridian; drawn naively the closing segment sweeps the full width of
  // the map. Split wherever longitude jumps more than 180°.
  function splitAntimeridian(pts) {
    if (pts.length < 2) return [pts];
    const out = [];
    let cur = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (Math.abs(pts[i][0] - pts[i - 1][0]) > 180) { out.push(cur); cur = [pts[i]]; }
      else cur.push(pts[i]);
    }
    out.push(cur);
    return out.filter((r) => r.length > 2);
  }

  const _cache = {};
  function rings(name) {
    const k = resolve(name);
    if (!k) return null;
    if (!_cache[k]) {
      const out = [];
      BY_NAME[k].forEach((r) => splitAntimeridian(r).forEach((s) => out.push(s)));
      _cache[k] = out;
    }
    return _cache[k];
  }

  function area(r) {
    let a = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++)
      a += (r[j][0] * r[i][1]) - (r[i][0] * r[j][1]);
    return Math.abs(a / 2);
  }

  // Centroid of the largest ring, so outlying islands (Alaska, overseas
  // territories) don't drag a country's label into the ocean.
  function centroid(name) {
    const rs = rings(name);
    if (!rs || !rs.length) return null;
    let best = rs[0], bestA = -1;
    rs.forEach((r) => { const a = area(r); if (a > bestA) { bestA = a; best = r; } });
    let x = 0, y = 0;
    best.forEach((p) => { x += p[0]; y += p[1]; });
    return [x / best.length, y / best.length];
  }

  // Bounding box for auto-fitting the camera. Deliberately NOT the box of every
  // ring: France carries Réunion and French Guiana, the United States carries
  // Alaska and Hawaii, so a naive box spans half the planet and the zoom is
  // useless. Take rings by descending area until they account for ~80% of the
  // country, which keeps Indonesia's real spread (Sumatra→Papua) but drops
  // outlying territories. Areas are cos(lat)-corrected so high-latitude rings
  // aren't over-weighted by the projection.
  const _bboxCache = {};
  function bboxFit(name) {
    const k = resolve(name);
    if (!k) return null;
    if (_bboxCache[k]) return _bboxCache[k];
    const rs = rings(k);
    if (!rs || !rs.length) return null;
    const scored = rs.map((r) => {
      let lat = 0;
      r.forEach((p) => { lat += p[1]; });
      return { r, a: area(r) * Math.cos(Math.abs(lat / r.length) * Math.PI / 180) };
    }).sort((p, q) => q.a - p.a);
    const total = scored.reduce((s, o) => s + o.a, 0) || 1;
    let acc = 0;
    const keep = [];
    for (const o of scored) {
      keep.push(o.r); acc += o.a;
      if (acc / total >= 0.8) break;
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    keep.forEach((r) => r.forEach((p) => {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }));
    return (_bboxCache[k] = [x0, y0, x1, y1]);
  }

  let _all = null;
  function allRings() {
    if (!_all) {
      _all = [];
      Object.keys(BY_NAME).forEach((k) => rings(k).forEach((r) => _all.push(r)));
    }
    return _all;
  }

  window.GEO = {
    resolve, rings, centroid, bboxFit, allRings,
    names: () => Object.keys(W).sort(),
  };
})();
