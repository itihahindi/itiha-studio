// VAQ HQ — slide primitives, v2 ("daylight newsroom + poster wall")
// Bake-off verdict 2026-07-07: light paper interiors (A) with per-vertical
// top rule + highlighter emphasis; solid accent poster tiles (B) for covers
// and photo-less emphasis slides. No swipe-meta (Itiha overlap). Textures
// are VAQ-native: grid / riso / dots / signal — not Itiha's archival set.

const VAQ = {
  // dark channel tokens (kept for the mark + occasional use)
  navy:      '#0A1119',
  tileDark:  '#0E1A29',
  panel:     '#15263B',
  ink:       '#1E1E1E',   // sports dark-hero surface
  // daylight ground
  paper:     '#F7F9FB',
  white:     '#FFFFFF',
  inkL:      '#0A1119',   // headline ink on light
  bodyL:     '#33475C',   // body copy on light
  mutedL:    '#5C7089',   // kickers / meta on light
  hairL:     'rgba(10,17,25,.12)',
  // shared
  orange:    '#F4631E',
  slate:     '#4A6076',
  serif:   "'Newsreader', Georgia, serif",
  sans:    "'Hanken Grotesk', system-ui, sans-serif",
  display: "'Archivo', 'Hanken Grotesk', sans-serif",
  athletic:"'Saira Condensed', 'Archivo', sans-serif",
  mono:    "'Space Mono', ui-monospace, monospace",
  deva:    "'Noto Serif Devanagari', serif",
  // The Docket (legal) reading voice + UI — from its own design kit.
  bodySerif: "'Source Serif 4', Georgia, serif",
  ui:        "'Inter', system-ui, sans-serif",
  // Cathode (tech) — engineered grotesk + humanist sans + the machine's monospace.
  grotesk:  "'Space Grotesk', system-ui, sans-serif",
  plex:     "'IBM Plex Sans', system-ui, sans-serif",
  plexMono: "'IBM Plex Mono', ui-monospace, monospace",
};

// ── The four verticals ────────────────────────────────────────
const VERTICALS = {
  live: {
    key: 'live', name: 'Current Affairs', show: 'Vaq HQ Breaking',
    kicker: '● LIVE', badge: 'plain',
    accent: '#F4631E', onAccent: '#3A1402', onAccentMuted: '#7A2C08', tint: '#FFD9C4',
    darkInk: true,   // solid tile is light enough for dark ink text
    face: 'display',
  },
  briefing: {
    key: 'briefing', name: 'Geopolitics', show: 'The Briefing',
    kicker: 'GEOPOLITICS', badge: 'solid',
    accent: '#2F6BE0', onAccent: '#FFFFFF', onAccentMuted: 'rgba(255,255,255,.72)', tint: '#CFE0FB',
    darkInk: false,
    face: 'serif',
  },
  longview: {
    key: 'longview', name: 'Political History', show: 'The Long View',
    kicker: 'HISTORY', badge: 'outline',
    accent: '#9A3F73', onAccent: '#FFFFFF', onAccentMuted: '#C77FA8', tint: '#F2D6E6',
    darkInk: false,
    face: 'serif-italic',
  },
  ground: {
    key: 'ground', name: 'Indian Politics', show: 'Ground Report',
    kicker: 'GROUND REPORT', badge: 'solid', deva: 'ज़मीनी हक़ीक़त',
    accent: '#0FA08C', onAccent: '#FFFFFF', onAccentMuted: 'rgba(255,255,255,.72)', tint: '#CFF3EC',
    darkInk: false,
    face: 'sans',
  },
  sports: {
    key: 'sports', name: 'Sports', show: 'The Arena',
    kicker: 'SPORTS', badge: 'solid',
    accent: '#FF3333', onAccent: '#FFFFFF', onAccentMuted: 'rgba(255,255,255,.74)', tint: '#FFD6D6',
    darkInk: false,
    face: 'athletic',      // Saira Condensed — bold condensed uppercase
    coverSurface: 'dark',  // sports covers default to the cinematic dark hero
  },
  // Legal news. Runs on its own "modern docket" kit rather than the daylight
  // newsroom: dark end-to-end, Archivo in SENTENCE case (not the shouty caps the
  // other verticals use), Source Serif 4 as the reading voice, and one controlled
  // red. The kit's rule is that red only ever marks breaking, links and section
  // rules — so emphasis here is red text, never a highlighter block.
  legal: {
    key: 'legal', name: 'Legal', show: 'The Docket',
    kicker: 'LEGAL', badge: 'solid',
    accent: '#E0554E', onAccent: '#FFFFFF', onAccentMuted: 'rgba(255,255,255,.72)', tint: '#F6D3D1',
    darkInk: false,
    face: 'docket',
    bodyFont: VAQ.bodySerif,   // Source Serif 4 — never set body in Archivo
    metaFont: VAQ.ui,          // Inter for kickers / meta / chrome
    sentence: true,            // headlines are sentence case, kickers stay caps
    coverSurface: 'dark',
    interiorSurface: 'dark',   // the whole show is dark, not just the cover
    dark: {
      bg:    '#141413',        // kit --page
      head:  '#F2F2EF',        // kit --ink
      body:  '#B6B6B2',        // kit --text-2
      muted: '#8A8A86',        // kit --muted
      hair:  '#2E2E2B',        // kit --border
      well:  '#252523',        // kit --surface-2
    },
  },
  // Technology news. Runs on the "Cathode" kit: cool graphite-and-paper light
  // interiors, one electric signal blue as the only accent (spent on emphasis,
  // links, live states), Space Grotesk headlines in sentence case, IBM Plex Sans
  // for the read, and IBM Plex Mono everywhere the machine speaks (kickers, meta,
  // page numbers). Emphasis is signal-blue text, never a highlighter block. The
  // cover is the one loud moment — a solid signal-blue poster tile.
  tech: {
    key: 'tech', name: 'Technology', show: 'Cathode',
    kicker: 'TECH', badge: 'solid',
    accent: '#2540FF', onAccent: '#FFFFFF', onAccentMuted: 'rgba(255,255,255,.72)', tint: '#C7CEFF',
    darkInk: false,
    face: 'cathode',
    bodyFont: VAQ.plex,        // IBM Plex Sans — never set body in Space Grotesk
    metaFont: VAQ.plexMono,    // IBM Plex Mono — the machine's voice
    numFont: VAQ.grotesk,      // big stat numerals in the display grotesk
    quoteFont: VAQ.grotesk,    // pull quotes are Space Grotesk, not italic serif
    quoteItalic: false,
    sentence: true,            // sentence-case headlines; blue text emphasis
    light: {
      bg:      '#F5F6F8',      // kit --canvas
      surface: '#FFFFFF',      // kit --surface
      head:    '#14161B',      // kit --ink (graphite, not the daylight navy)
      body:    '#454951',      // kit --text-2
      muted:   '#7A7E88',      // kit --muted
      hair:    '#E2E4EA',      // kit --border
      well:    '#EDEFF3',      // kit --surface-2 (image wells, blueprint grid)
    },
    // The kit ships a full dark theme too, so a slide can opt into surface: dark.
    dark: {
      bg:    '#0E0F13', head: '#F1F2F4', body: '#B4B8C0',
      muted: '#7E828C', hair: '#262A31', well: '#1E2127',
    },
  },
};

// ── Base slide CSS (`.itiha-slide` = cross-brand capture contract) ──
if (typeof document !== 'undefined' && !document.getElementById('vaq-slide-styles')) {
  const s = document.createElement('style');
  s.id = 'vaq-slide-styles';
  s.textContent = `
    .itiha-slide{position:relative;width:var(--slide-width,1080px);height:var(--slide-height,1350px);overflow:hidden;color:${VAQ.bodyL};font-family:${VAQ.sans};-webkit-font-smoothing:antialiased}
    .itiha-slide *{box-sizing:border-box}
  `;
  document.head.appendChild(s);
}

// ── Tweak context (pack contract: window.BrandContext) ────────
const BrandContext = React.createContext({
  vertical: 'live',
  showStamp: true,
  showPageNum: true,
});
function useTweaks() { return React.useContext(BrandContext); }

function verticalFor(slide, t) {
  const key = (slide && slide.vertical) || (t && t.vertical) || 'live';
  return VERTICALS[key] || VERTICALS.live;
}

// Surface: 'light' (paper interior, A), 'solid' (accent poster tile, B), or
// 'dark' (cinematic / docket). A vertical can set interiorSurface to move its
// whole show off the daylight default — The Docket runs dark throughout, so
// layouts pass no fallback and let the vertical decide.
function surfaceFor(slide, v, fallback) {
  const base = fallback || (v && v.interiorSurface) || 'light';
  const mode = (slide && slide.surface) || base;
  if (mode === 'solid') return { mode, bg: v.accent, onSolid: true };
  if (mode === 'dark')  return { mode, bg: (v.dark && v.dark.bg) || VAQ.ink, onSolid: false, onDark: true };
  const lp = (v && v.light) || {};
  const bg = slide && slide.paper === 'white' ? (lp.surface || VAQ.white) : (lp.bg || VAQ.paper);
  return { mode: 'light', bg, onSolid: false };
}

// Every text / rule / well colour for a surface, resolved in one place. Layouts
// call this instead of reaching for VAQ.inkL & friends, which is what allows a
// vertical to be dark end-to-end without every layout growing a light/dark fork.
function inkFor(v, surface) {
  if (surface.onSolid) {
    const p = solidPalette(v);
    return { head: p.head, body: p.body, muted: p.muted, em: p.em,
             hair: 'rgba(255,255,255,.35)', well: 'rgba(0,0,0,.15)' };
  }
  if (surface.onDark) {
    const d = (v && v.dark) || {};
    return { head: d.head || '#FFFFFF', body: d.body || 'rgba(255,255,255,.86)',
             muted: d.muted || 'rgba(255,255,255,.55)', em: d.em || v.accent,
             hair: d.hair || 'rgba(255,255,255,.14)', well: d.well || '#20201E' };
  }
  const l = (v && v.light) || {};
  return { head: l.head || VAQ.inkL, body: l.body || VAQ.bodyL, muted: l.muted || VAQ.mutedL,
           em: v.accent, hair: l.hair || VAQ.hairL, well: l.well || '#E4EAF0' };
}

// Font helpers — a vertical may override the body / meta voice (The Docket).
function bodyFontFor(v) { return (v && v.bodyFont) || VAQ.sans; }
function metaFontFor(v) { return (v && v.metaFont) || VAQ.mono; }

// Ink helpers for text sitting on a solid accent tile.
function solidPalette(v) {
  if (v.darkInk) return {         // orange: dark-ink poster
    head: v.onAccent, em: '#FFFFFF',
    body: 'rgba(58,20,2,.88)', bodyEm: '#FFFFFF', bodyStrong: '#FFFFFF',
    muted: v.onAccentMuted,
  };
  return {                        // blue / plum / teal: white poster
    head: '#FFFFFF', em: v.tint,
    body: 'rgba(255,255,255,.92)', bodyEm: v.tint, bodyStrong: '#FFFFFF',
    muted: v.onAccentMuted,
  };
}

// ── Headline treatment per vertical ───────────────────────────
function headlineStyle(v, size, onSolid, onDark) {
  const color = onDark ? ((v.dark && v.dark.head) || '#FFFFFF')
                       : (onSolid ? solidPalette(v).head : ((v.light && v.light.head) || VAQ.inkL));
  const base = { margin: 0, color, textWrap: 'balance' };
  switch (v.face) {
    // The Docket: grotesque impact WITHOUT the caps. Its kit is explicit that
    // headlines are sentence case and only kickers are uppercase.
    case 'docket':
      return { ...base, fontFamily: VAQ.display, fontWeight: 700, fontSize: size,
               lineHeight: 1.04, letterSpacing: '-.025em' };
    // Cathode: engineered grotesk, sentence case, very tight tracking.
    case 'cathode':
      return { ...base, fontFamily: VAQ.grotesk, fontWeight: 700, fontSize: size,
               lineHeight: 1.02, letterSpacing: '-.03em' };
    case 'display':
      return { ...base, fontFamily: VAQ.display, fontWeight: 900, fontSize: size,
               lineHeight: 0.97, letterSpacing: '-.02em', textTransform: 'uppercase' };
    case 'athletic':
      return { ...base, fontFamily: VAQ.athletic, fontWeight: 800, fontSize: size,
               lineHeight: 1.04, letterSpacing: '.005em', textTransform: 'uppercase' };
    case 'serif':
      return { ...base, fontFamily: VAQ.serif, fontWeight: 600, fontSize: size,
               lineHeight: 1.05, letterSpacing: '-.015em' };
    case 'serif-italic':
      return { ...base, fontFamily: VAQ.serif, fontWeight: 500, fontStyle: 'italic',
               fontSize: size, lineHeight: 1.05, letterSpacing: '-.01em' };
    default:
      return { ...base, fontFamily: VAQ.sans, fontWeight: 800, fontSize: size,
               lineHeight: 1.02, letterSpacing: '-.02em' };
  }
}

function headlineDefaultSize(v, kind) {
  // docket runs smaller than the caps faces — sentence case sets wider per word.
  const cover = { display: 118, serif: 108, 'serif-italic': 106, sans: 110, athletic: 140, docket: 100, cathode: 104 };
  const inner = { display: 88,  serif: 92,  'serif-italic': 92,  sans: 88, athletic: 108, docket: 82, cathode: 84 };
  return (kind === 'cover' ? cover : inner)[v.face] || 96;
}

// ── Micro-syntax ──────────────────────────────────────────────
// Headlines: *word* → emphasis.
//   light + display face  → accent block, white text (A cover)
//   light + serif/sans    → tint block, navy text (highlighter)
//   solid                 → white (dark-ink tiles) / tint (white tiles)
function VHeadline({ text, v, size, onSolid, onDark, style }) {
  const st = headlineStyle(v, size, onSolid, onDark);
  const blockFace = v.face === 'display' || v.face === 'athletic';
  const emStyle = onDark
    ? { color: v.accent }
    : onSolid
    ? { color: solidPalette(v).em, fontStyle: v.face === 'serif' || v.face === 'serif-italic' ? 'italic' : undefined }
    : v.sentence
    // The Docket: red is a signal, never a highlighter slab behind text.
    ? { color: v.accent }
    : (blockFace
        ? { background: `linear-gradient(180deg, transparent 10%, ${v.accent} 10%, ${v.accent} 82%, transparent 82%)`,
            color: '#fff', padding: '0 0.12em',
            boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }
        : { background: v.tint, color: VAQ.inkL, padding: '0 0.11em',
            boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' });
  const parts = String(text || '').split(/(\*[^*]+\*)/g).filter(Boolean);
  const out = [];
  parts.forEach((p, i) => {
    const isEm = p.startsWith('*') && p.endsWith('*') && p.length > 2;
    const chunk = isEm ? p.slice(1, -1) : p;
    chunk.split('\n').forEach((seg, j) => {
      if (j > 0) out.push(<br key={`b${i}-${j}`} />);
      if (!seg) return;
      out.push(<span key={`${i}-${j}`} style={isEm ? emStyle : undefined}>{seg}</span>);
    });
  });
  return <h2 style={{ ...st, ...style }}>{out}</h2>;
}

// Body: [word] → accent emphasis · _word_ → italic · **word** → bold ink.
function VBody({ text, v, size = 40, onSolid, onDark, color, style }) {
  const pal = onSolid ? solidPalette(v) : null;
  const dk = (v && v.dark) || {};
  const base = {
    margin: 0, fontFamily: bodyFontFor(v), fontWeight: 400, fontSize: size,
    lineHeight: size <= 38 ? 1.65 : size <= 50 ? 1.58 : 1.45,
    color: color || (onDark ? (dk.body || 'rgba(255,255,255,.86)') : onSolid ? pal.body : VAQ.bodyL),
    textWrap: 'pretty',
  };
  const emColor = onDark ? v.accent : (onSolid ? pal.bodyEm : v.accent);
  const strongColor = onDark ? (dk.head || '#FFFFFF') : (onSolid ? pal.bodyStrong : VAQ.inkL);
  const paras = String(text || '').split(/\n\n+/);
  const renderInline = (str, keyBase) =>
    str.split(/(\[[^\]]+\]|\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean).map((p, i) => {
      if (p.startsWith('[') && p.endsWith(']'))
        return <span key={`${keyBase}-${i}`} style={{ color: emColor, fontWeight: 600 }}>{p.slice(1, -1)}</span>;
      if (p.startsWith('**') && p.endsWith('**'))
        return <strong key={`${keyBase}-${i}`} style={{ color: strongColor, fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
      if (p.startsWith('_') && p.endsWith('_') && p.length > 2)
        return <em key={`${keyBase}-${i}`}>{p.slice(1, -1)}</em>;
      return <span key={`${keyBase}-${i}`}>{p.replace(/\n/g, ' ')}</span>;
    });
  return (
    <div style={{ ...base, ...style }}>
      {paras.map((p, i) => (
        <p key={i} style={{ margin: i === 0 ? 0 : `${Math.round(size * 0.8)}px 0 0` }}>
          {renderInline(p, i)}
        </p>
      ))}
    </div>
  );
}

// ── Kicker row ────────────────────────────────────────────────
function VKicker({ v, onSolid, onDark, meta, style }) {
  const pal = onSolid ? solidPalette(v) : null;
  const chip = (() => {
    if (v.badge === 'plain') {
      return <span style={{
        fontFamily: VAQ.sans, fontWeight: 800, fontSize: 28, letterSpacing: '.1em',
        color: onSolid ? v.onAccent : v.accent,
      }}>{v.kicker}</span>;
    }
    if (v.badge === 'outline') {
      const c = onSolid ? v.tint : v.accent;
      return <span style={{
        border: `2.5px solid ${c}`, color: c,
        fontFamily: VAQ.sans, fontWeight: 700, fontSize: 23, letterSpacing: '.12em',
        padding: '7px 16px', borderRadius: 8, textTransform: 'uppercase',
      }}>{v.kicker}</span>;
    }
    return <span style={{
      background: onSolid ? 'rgba(255,255,255,.18)' : v.accent, color: '#fff',
      fontFamily: VAQ.sans, fontWeight: 800, fontSize: 23, letterSpacing: '.12em',
      padding: '8px 17px', borderRadius: 8, textTransform: 'uppercase',
    }}>{v.kicker}</span>;
  })();
  const metaText = meta || v.show;
  const dupMeta = metaText.trim().toLowerCase() === v.kicker.trim().toLowerCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, ...style }}>
      {chip}
      {!dupMeta && <span style={{
        fontFamily: metaFontFor(v), fontWeight: 700, fontSize: 22, letterSpacing: '.16em',
        textTransform: 'uppercase',
        color: onSolid ? pal.muted
             : (onDark ? ((v.dark && v.dark.muted) || 'rgba(255,255,255,.72)') : VAQ.mutedL),
      }}>{metaText}</span>}
      {v.deva && (
        <span style={{ fontFamily: VAQ.deva, fontWeight: 600, fontSize: 27,
          color: onSolid ? v.tint : v.accent, marginLeft: 'auto' }}>{v.deva}</span>
      )}
    </div>
  );
}

// ── V-Transmit mark + wordmark ────────────────────────────────
function VMark({ size = 44, mono = false }) {
  const main = mono ? '#FFFFFF' : VAQ.orange;
  const arc  = mono ? 'rgba(255,255,255,.55)' : VAQ.slate;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="Vaq HQ mark">
      <path d="M75 8 A21 21 0 0 1 96 29" stroke={arc} strokeWidth="6" strokeLinecap="round" />
      <path d="M75 17 A12 12 0 0 1 87 29" stroke={main} strokeWidth="6" strokeLinecap="round" />
      <path d="M19 29 L47 75 L75 29" stroke={main} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VWordmark({ size = 30, onSolid = false, onDark = false, withMark = true }) {
  // Any non-paper ground gets the mono wordmark. Keeping HQ orange on a dark
  // slide would put a second accent next to the vertical's own — the exact thing
  // The Docket's kit forbids — and would clash with the white cover stamp.
  const light = onSolid || onDark;
  const vaqColor = light ? '#FFFFFF' : VAQ.inkL;
  const hqColor  = light ? 'rgba(255,255,255,.85)' : VAQ.orange;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(size * 0.42) }}>
      {withMark && <VMark size={Math.round(size * 1.35)} mono={light} />}
      <span style={{ fontFamily: VAQ.serif, fontWeight: 600, fontSize: size, letterSpacing: '-.01em', lineHeight: 1 }}>
        <span style={{ color: vaqColor }}>Vaq</span>{' '}
        <span style={{ color: hqColor }}>HQ</span>
      </span>
    </div>
  );
}

// Bottom chrome: page number left, wordmark right.
function VChrome({ n, onSolid, onDark, v }) {
  const t = useTweaks();
  const total = (t && t.totalSlides) || 9;
  const lbl = (t && t.seriesLabel) || '';
  const pageColor = onSolid ? solidPalette(v).muted
                  : onDark ? ((v && v.dark && v.dark.muted) || 'rgba(255,255,255,.55)')
                  : VAQ.mutedL;
  return (
    <div style={{
      position: 'absolute', left: 72, right: 72, bottom: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {t.showPageNum !== false && n != null ? (
        <span style={{ fontFamily: metaFontFor(v), fontSize: 22, letterSpacing: '.18em', color: pageColor }}>
          {String(n).padStart(2, '0')} / {String(total).padStart(2, '0')}{lbl ? ` · ${lbl}` : ''}
        </span>
      ) : <span />}
      {t.showStamp !== false ? <VWordmark size={30} onSolid={onSolid} onDark={onDark} /> : <span />}
    </div>
  );
}

// ── Textures (VAQ-native; NOT Itiha's archival set) ───────────
// grid   — faint ruled baseline + column grid (newsroom paper)
// riso   — risograph print grain (great on solid tiles)
// dots   — Ben-Day dot field fading from a corner (print CMYK nod)
// signal — ghosted V-Transmit arcs, top right
const _RISO_NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")";

function VTexture({ texture, v, onSolid }) {
  if (!texture) return null;
  const names = String(texture).split(',').map(s => s.trim()).filter(Boolean);
  const layers = names.map((name, i) => {
    if (name === 'grid') {
      const line = onSolid ? 'rgba(255,255,255,.10)' : 'rgba(10,17,25,.055)';
      return <div key={i} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `repeating-linear-gradient(0deg, ${line} 0 1px, transparent 1px 54px),` +
                         `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px 156px)`,
      }} />;
    }
    if (name === 'riso') {
      return <div key={i} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: _RISO_NOISE, backgroundSize: '240px 240px',
        opacity: onSolid ? 0.14 : 0.07, mixBlendMode: 'multiply',
      }} />;
    }
    if (name === 'dots') {
      const dot = onSolid ? 'rgba(255,255,255,.28)' : (v ? v.accent : VAQ.orange);
      return <div key={i} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle, ${dot} 2.2px, transparent 2.8px)`,
        backgroundSize: '20px 20px',
        opacity: onSolid ? 0.5 : 0.16,
        WebkitMaskImage: 'radial-gradient(620px 620px at 100% 0%, #000 0%, transparent 72%)',
        maskImage: 'radial-gradient(620px 620px at 100% 0%, #000 0%, transparent 72%)',
      }} />;
    }
    if (name === 'signal') {
      const c = onSolid ? '#FFFFFF' : (v ? v.accent : VAQ.orange);
      const op = onSolid ? 0.16 : 0.10;
      return (
        <svg key={i} style={{ position: 'absolute', top: 90, right: -130, opacity: op, pointerEvents: 'none' }}
             width="560" height="560" viewBox="0 0 100 100" fill="none">
          <path d="M60 40 A30 30 0 0 1 90 70" stroke={c} strokeWidth="3" strokeLinecap="round" />
          <path d="M52 30 A42 42 0 0 1 94 72" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M44 20 A54 54 0 0 1 98 74" stroke={c} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    return null;
  });
  return <>{layers}</>;
}

// Oversized ghost index numeral (poster tiles + covers).
function VGhostIndex({ n, v, onSolid }) {
  if (n == null) return null;
  const color = onSolid ? 'rgba(255,255,255,.16)' : `${v.accent}1A`;
  return (
    <div style={{
      position: 'absolute', top: 30, right: 44, pointerEvents: 'none',
      fontFamily: VAQ.display, fontWeight: 900, fontSize: 300, lineHeight: 1,
      letterSpacing: '-.04em', color,
    }}>{String(n).padStart(2, '0')}</div>
  );
}

// ── Slide wrapper ─────────────────────────────────────────────
// Light slides carry the vertical's rule across the TOP (newsroom masthead);
// solid tiles are pure colour.
function VSlide({ v, surface, texture, children }) {
  return (
    <div className="itiha-slide vaq-slide" style={{ background: surface.bg }}>
      {!surface.onSolid && !surface.onDark && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 10, background: v.accent, zIndex: 3 }} />
      )}
      <VTexture texture={texture} v={v} onSolid={surface.onSolid} />
      {children}
    </div>
  );
}

Object.assign(window, {
  VAQ, VERTICALS, BrandContext, useTweaks, verticalFor, surfaceFor, solidPalette,
  headlineStyle, headlineDefaultSize, VHeadline, VBody, VKicker,
  VMark, VWordmark, VChrome, VTexture, VGhostIndex, VSlide,
});
