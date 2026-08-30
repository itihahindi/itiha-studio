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
  ink:       '#1E1E1E',   // dark-hero surface
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
  mono:    "'Space Mono', ui-monospace, monospace",
  deva:    "'Noto Serif Devanagari', serif",
};

// ── The verticals ─────────────────────────────────────────────
// TWO-TONE CONSOLIDATION, 2026-07-27. Audience feedback: the seven per-
// vertical liveries (accents, typefaces, and the Docket/Cathode sub-kits)
// made the feed read as several different accounts. Retired all of it.
// One visual system now, for every vertical:
//   paper #F7F9FB ground · hero orange #F4631E as the only accent ·
//   navy poster via `surface: dark` as the counterweight · Archivo caps
//   headlines · Hanken body · Space Mono meta · Newsreader pull quotes.
// A vertical contributes ONLY editorial identity: badge text (kicker),
// show-name meta, and ground's Devanagari companion. Do not reintroduce
// per-vertical accents, faces, or kit objects.
const V_BASE = {
  accent: '#F4631E', onAccent: '#3A1402', onAccentMuted: '#7A2C08', tint: '#FFD9C4',
  darkInk: true,   // orange tile is light enough for dark ink text
  face: 'display',
  // The second tone. `surface: dark` = the NAVY poster (brand panel navy, not
  // charcoal) — without this shared palette inkFor falls back to VAQ.ink and
  // the two-tone system loses its blue half.
  dark: {
    bg:    VAQ.panel,               // #15263B — visibly navy on the feed
    head:  '#FFFFFF',
    body:  'rgba(255,255,255,.88)',
    muted: 'rgba(255,255,255,.58)',
    hair:  'rgba(255,255,255,.16)',
    well:  'rgba(10,17,25,.45)',    // image wells stay in the navy family
  },
};
const VERTICALS = {
  live:     { ...V_BASE, key: 'live', name: 'Current Affairs', show: 'Vaq HQ Breaking',
              kicker: '● LIVE', badge: 'plain' },
  briefing: { ...V_BASE, key: 'briefing', name: 'Geopolitics', show: 'The Briefing',
              kicker: 'GEOPOLITICS', badge: 'solid' },
  longview: { ...V_BASE, key: 'longview', name: 'Political History', show: 'The Long View',
              kicker: 'HISTORY', badge: 'outline' },
  ground:   { ...V_BASE, key: 'ground', name: 'Indian Politics', show: 'Ground Report',
              kicker: 'GROUND REPORT', badge: 'solid' },   // Devanagari companion retired 2026-08-29 (user)
  // sports/tech: `show` matches the kicker so VKicker's dupMeta check hides
  // the meta — their show-name wordmarks were retired earlier on 2026-07-27.
  sports:   { ...V_BASE, key: 'sports', name: 'Sports', show: 'SPORTS',
              kicker: 'SPORTS', badge: 'solid' },
  legal:    { ...V_BASE, key: 'legal', name: 'Legal', show: 'The Docket',
              kicker: 'LEGAL', badge: 'solid' },
  tech:     { ...V_BASE, key: 'tech', name: 'Technology', show: 'TECH',
              kicker: 'TECH', badge: 'solid' },
};

// ── Base slide CSS (`.itiha-slide` = cross-brand capture contract) ──
if (typeof document !== 'undefined' && !document.getElementById('vaq-slide-styles')) {
  const s = document.createElement('style');
  s.id = 'vaq-slide-styles';
  s.textContent = `
    .itiha-slide{position:relative;width:var(--slide-width,1080px);height:var(--slide-height,1350px);overflow:hidden;color:${VAQ.bodyL};font-family:${VAQ.sans};-webkit-font-smoothing:antialiased}
    .itiha-slide *{box-sizing:border-box}
    /* ── Text alignment ────────────────────────────────────────────
       alignBlock() stamps data-align-x on a text block. text-align moves the
       type, but not boxes that carry their own width — those keep hanging off
       the left edge. VAQ has two such shapes: the fixed-width accent rule that
       sits above a dark-hero headline (.vaq-rule) and any measure-capped
       column of copy (.vaq-measure for the maxWidth sublines / body wells,
       .vaq-body for VBody's own root). Re-hang both on the chosen edge. */
    [data-align-x="left"]   > .vaq-rule{margin-left:0;margin-right:auto}
    [data-align-x="center"] > .vaq-rule{margin-left:auto;margin-right:auto}
    [data-align-x="right"]  > .vaq-rule{margin-left:auto;margin-right:0}
    [data-align-x="left"]   .vaq-measure,[data-align-x="left"]   .vaq-body{margin-left:0;margin-right:auto}
    [data-align-x="center"] .vaq-measure,[data-align-x="center"] .vaq-body{margin-left:auto;margin-right:auto}
    [data-align-x="right"]  .vaq-measure,[data-align-x="right"]  .vaq-body{margin-left:auto;margin-right:0}
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

// ── Headline treatment ────────────────────────────────────────
// Post-consolidation there is ONE headline voice: Archivo caps ('display').
// The switch stays only so a stray/legacy face degrades to the sans default
// instead of crashing.
function headlineStyle(v, size, onSolid, onDark) {
  const color = onDark ? ((v.dark && v.dark.head) || '#FFFFFF')
                       : (onSolid ? solidPalette(v).head : ((v.light && v.light.head) || VAQ.inkL));
  const base = { margin: 0, color, textWrap: 'balance' };
  switch (v.face) {
    case 'display':
      return { ...base, fontFamily: VAQ.display, fontWeight: 900, fontSize: size,
               lineHeight: 0.97, letterSpacing: '-.02em', textTransform: 'uppercase' };
    default:
      return { ...base, fontFamily: VAQ.sans, fontWeight: 800, fontSize: size,
               lineHeight: 1.02, letterSpacing: '-.02em' };
  }
}

function headlineDefaultSize(v, kind) {
  const cover = { display: 118 };
  const inner = { display: 88 };
  return (kind === 'cover' ? cover : inner)[v.face] || 96;
}

// ── Micro-syntax ──────────────────────────────────────────────
// Headlines: *word* → emphasis.
//   light + display face  → accent block, white text (A cover)
//   light + serif/sans    → tint block, navy text (highlighter)
//   solid                 → white (dark-ink tiles) / tint (white tiles)
function VHeadline({ text, v, size, onSolid, onDark, style, label }) {
  const st0 = headlineStyle(v, size, onSolid, onDark);
  // Collage vocabulary (2026-08-29): `label` sets the headline in sentence-case
  // sans, each line boxed in navy — the poster-label device from the GRIDD
  // references. Emphasis inside a label goes orange.
  const st = label
    ? { ...st0, fontFamily: VAQ.sans, fontWeight: 700, textTransform: 'none',
        letterSpacing: '-.02em', lineHeight: 1.34, fontSize: Math.round((size || 80) * 0.78) }
    : st0;
  const labelStyle = label ? {
    background: onSolid ? '#3A1402' : (onDark ? VAQ.paper : '#15263B'),
    color: onDark ? VAQ.inkL : '#FFFFFF', padding: '0.06em 0.26em',
    boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
  } : null;
  const blockFace = v.face === 'display';
  // Print refresh (2026-08-28): emphasis is an editorial italic in the serif,
  // set inside the Archivo caps — a magazine device, not a marker-pen slab.
  const emStyle = {
    fontFamily: VAQ.serif, fontStyle: 'italic', fontWeight: 600,
    textTransform: 'none', letterSpacing: '-.015em', fontSize: '1.06em',
    color: onSolid ? solidPalette(v).em : v.accent,
  };
  const parts = String(text || '').split(/(\*[^*]+\*)/g).filter(Boolean);
  const out = [];
  parts.forEach((p, i) => {
    const isEm = p.startsWith('*') && p.endsWith('*') && p.length > 2;
    const chunk = isEm ? p.slice(1, -1) : p;
    chunk.split('\n').forEach((seg, j) => {
      if (j > 0) out.push(<br key={`b${i}-${j}`} />);
      if (!seg) return;
      out.push(<span key={`${i}-${j}`} style={isEm ? (label ? { ...emStyle, fontFamily: VAQ.sans, fontStyle: 'normal', fontSize: '1em', color: onDark ? v.accent : '#FFB48F' } : emStyle) : undefined}>{seg}</span>);
    });
  });
  if (label) return <h2 style={{ ...st, ...style }}><span style={labelStyle}>{out}</span></h2>;
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
    <div className="vaq-body" style={{ ...base, ...style }}>
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
  // Print refresh: the section head is a newspaper slug — Archivo caps in ink
  // with a short accent underline — never a pill / chip / eyebrow.
  const slugInk = onSolid ? v.onAccent : (onDark ? '#FFFFFF' : VAQ.inkL);
  const slugRule = onSolid ? v.onAccent : v.accent;
  const chip = (
    <span style={{
      fontFamily: VAQ.display, fontWeight: 800, fontSize: 24, letterSpacing: '.14em',
      textTransform: 'uppercase', color: slugInk,
      borderBottom: `4px solid ${slugRule}`, paddingBottom: 5, lineHeight: 1,
    }}>{String(v.kicker).replace(/^●\s*/, '')}</span>
  );
  const mastRule = onSolid ? 'rgba(58,20,2,.45)' : (onDark ? 'rgba(255,255,255,.42)' : 'rgba(10,17,25,.5)');
  // String(): a bare year in YAML (`kicker_meta: 2017`) parses as a NUMBER, and
  // .trim() on a number throws, which takes down the whole slide tree from that
  // slide onward. Coerce rather than making authors remember to quote years.
  const metaText = String(meta || v.show);
  const dupMeta = metaText.trim().toLowerCase() === String(v.kicker).trim().toLowerCase();
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 26,
      paddingBottom: 16, borderBottom: `4px double ${mastRule}`, ...style }}>
      {chip}
      {!dupMeta && <span style={{
        fontFamily: metaFontFor(v), fontWeight: 700, fontSize: 22, letterSpacing: '.16em',
        textTransform: 'uppercase',
        color: onSolid ? pal.muted
             : (onDark ? ((v.dark && v.dark.muted) || 'rgba(255,255,255,.72)') : VAQ.mutedL),
      }}>{metaText}</span>}

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
        <span style={{ fontFamily: VAQ.serif, fontStyle: 'italic', fontWeight: 500, fontSize: 26,
          letterSpacing: '0', color: pageColor }}>
          {n} of {total}{lbl ? ` · ${lbl}` : ''}
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

const _PAPER_NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='520' height='520'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.06' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.10  0 0 0 0 0.09  0 0 0 0 0.07  0 0 0 0.55 0'/></filter><rect width='520' height='520' filter='url(%23p)'/></svg>\")";
const _HALFTONE_INK =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'><defs><pattern id='h' width='12' height='12' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'><circle cx='6' cy='6' r='1.7' fill='%230A1119'/></pattern></defs><rect width='12' height='12' fill='url(%23h)'/></svg>\")";
const _HALFTONE_WHITE = _HALFTONE_INK.replace('%230A1119', '%23FFFFFF');
const _SPECK_NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'><filter id='s'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' seed='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.95  0 0 0 0 0.55  0 0 0 0 0.30  0 0 0 9 -6.6'/></filter><rect width='360' height='360' filter='url(%23s)'/></svg>\")";

function VTexture({ texture, v, onSolid, onDark }) {
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
    if (name === 'paper' || name === 'newsprint') {
      // Print stock: low-frequency fibre noise, multiplied in. newsprint adds
      // faint horizontal fibre lines on top of the same stock.
      const layers = [
        <div key={`${i}-p`} style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: _PAPER_NOISE, backgroundSize: '520px 520px',
          opacity: onSolid ? 0.12 : 0.20, mixBlendMode: 'multiply',
        }} />,
      ];
      if (name === 'newsprint') layers.push(
        <div key={`${i}-n`} style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: onSolid ? 0.10 : 0.07,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(10,17,25,.9) 0 1px, transparent 1px 3px)',
          mixBlendMode: 'multiply',
        }} />);
      return <React.Fragment key={i}>{layers}</React.Fragment>;
    }
    if (name === 'halftone') {
      // 45° CMYK-style dot screen, ink on paper / white on colour.
      return <div key={i} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: onSolid ? _HALFTONE_WHITE : _HALFTONE_INK, backgroundSize: '12px 12px',
        opacity: onSolid ? 0.28 : 0.20, mixBlendMode: onSolid ? 'screen' : 'multiply',
      }} />;
    }
    if (name === 'ink') {
      // Press vignette: ink gathering at the edges of the sheet.
      return <div key={i} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply',
        background: 'radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(10,17,25,.28) 100%)',
        opacity: onSolid ? 0.6 : 0.85,
      }} />;
    }
    if (name.startsWith('file:')) {
      // A texture PNG dropped into shared/brands/vaq-hq/textures/ (e.g. a
      // texturelab.org export). Multiplied in at half strength; add `:NN` for
      // a custom opacity percent — `file:fibre.png:70`.
      // file:<path>[:opacity%][:blend]  — blend = multiply (default on paper /
      // orange), screen (default on dark: film & grunge scans lift instead of
      // muddying), overlay, soft-light, lighten, darken.
      const m = name.slice(5).match(/^(.*?)(?::(\d{1,3}))?(?::([a-z-]+))?$/);
      const file = m ? m[1] : name.slice(5);
      const op = m && m[2] ? Math.min(100, parseInt(m[2], 10)) / 100 : 0.5;
      const blend = (m && m[3]) || (onDark ? 'screen' : 'multiply');
      // Where the file lives: an http(s) URL as given · `images/…` = this
      // design's own images folder · `brands/…` = anywhere in the packs ·
      // otherwise shared/brands/vaq-hq/textures/ (subfolders allowed).
      const src = /^https?:/.test(file) || file.startsWith('images/') || file.startsWith('brands/')
        ? file : `brands/vaq-hq/textures/${file}`;
      return <div key={i} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `url(${src})`, backgroundSize: 'cover',
        opacity: op, mixBlendMode: blend,
      }} />;
    }
    if (name === 'squares') {
      // Squared grid paper (the GRIDD green slide), on any surface.
      const line = onSolid ? 'rgba(255,255,255,.14)' : 'rgba(10,17,25,.09)';
      return <div key={i} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `repeating-linear-gradient(0deg, ${line} 0 1px, transparent 1px 44px),` +
                         `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px 44px)`,
      }} />;
    }
    if (name === 'speck') {
      // Speckled press ground — warm flecks, reads on dark best.
      return <div key={i} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: _SPECK_NOISE, backgroundSize: '360px 360px', opacity: onSolid ? 0.35 : 0.55,
        mixBlendMode: 'screen',
      }} />;
    }
    if (name === 'splat') {
      // Ink blotches, orange on paper / dark on colour — the .ties map slide.
      const c = onSolid ? 'rgba(58,20,2,.35)' : (onDark ? 'rgba(244,99,30,.50)' : 'rgba(244,99,30,.55)');
      return <div key={i} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: onDark ? 'screen' : 'multiply',
        backgroundImage: `radial-gradient(140px 90px at 12% 22%, ${c} 0 55%, transparent 62%),` +
                         `radial-gradient(80px 60px at 78% 18%, ${c} 0 50%, transparent 60%),` +
                         `radial-gradient(200px 120px at 86% 70%, ${c} 0 52%, transparent 60%),` +
                         `radial-gradient(60px 40px at 30% 84%, ${c} 0 50%, transparent 62%),` +
                         `radial-gradient(110px 70px at 55% 55%, ${c} 0 50%, transparent 60%)`,
        filter: 'blur(1px) contrast(1.6)', opacity: 0.8,
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

// ── Collage vocabulary (2026-08-29) ───────────────────────────
// Starbursts, die-cut/duotone images and a condensed poster face — the zine /
// poster-wall register from the user's GRIDD and .ties references, kept inside
// the two-tone rule (orange + navy on paper).
const _BURST_POS = {
  'top-left': { top: -60, left: -60 }, 'top-right': { top: -60, right: -60 },
  'bottom-left': { bottom: -60, left: -60 }, 'bottom-right': { bottom: -60, right: -60 },
  'left': { top: '42%', left: -80 }, 'right': { top: '42%', right: -80 },
  'center': { top: '40%', left: '38%' },
  'top': { top: -40, left: '38%' }, 'bottom': { bottom: -40, left: '38%' },
};
function _burstColor(c, onSolid) {
  const map = { orange: VAQ.orange, navy: '#15263B', ink: VAQ.inkL, paper: VAQ.paper, white: '#FFFFFF',
                slate: VAQ.slate, tint: '#FFD8C4' };
  if (onSolid && (c === 'orange' || !c)) return VAQ.paper;
  return map[c] || c || VAQ.orange;
}
function burstPath(points = 10, inner = 0.42) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 50 : 50 * inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}
// bursts: [{pos, color, size, points, rotate, inner, x, y}] — pos names above;
// x/y (px) override pos for hand placement.
function VBursts({ bursts, onSolid }) {
  if (!bursts || !bursts.length) return null;
  return (
    <>
      {bursts.map((b, i) => {
        if (!b) return null;
        const size = b.size || 300;
        const pos = (b.x != null || b.y != null)
          ? { left: b.x || 0, top: b.y || 0 }
          : (_BURST_POS[b.pos || 'top-right'] || _BURST_POS['top-right']);
        return (
          <svg key={i} viewBox="0 0 100 100" width={size} height={size}
            style={{ position: 'absolute', zIndex: b.front ? 4 : 1, pointerEvents: 'none',
              transform: `rotate(${b.rotate || 0}deg)`, ...pos }}>
            <polygon points={burstPath(b.points || 10, b.inner || 0.42)} fill={_burstColor(b.color, onSolid)} />
          </svg>
        );
      })}
    </>
  );
}
const _DUOTONE = {
  orange: 'grayscale(1) sepia(1) saturate(4.2) hue-rotate(-12deg) contrast(1.08) brightness(1.02)',
  navy:   'grayscale(1) sepia(1) saturate(3) hue-rotate(178deg) brightness(.62) contrast(1.15)',
  mono:   'grayscale(1) contrast(1.18)',
};
// A die-cut (transparent PNG) or plain photo with the print treatments:
//   imageStyle: plain | cutout | duotone | mono   tint: orange | navy
//   halftone: dot screen masked to the image's own alpha   tilt: degrees
function VCutout({ src, imageStyle = 'plain', tint = 'orange', halftone = false, tilt = 0,
                   shadow = true, width, height, position, style }) {
  if (!src) return null;
  const url = src.startsWith('http') ? src : `images/${src}`;
  const filt = imageStyle === 'duotone' ? _DUOTONE[tint] || _DUOTONE.orange
             : imageStyle === 'mono' ? _DUOTONE.mono : 'none';
  const isCut = imageStyle === 'cutout' || imageStyle === 'duotone' || imageStyle === 'mono';
  return (
    <div style={{ position: 'relative', width: width || '100%', height: height || 'auto',
      transform: tilt ? `rotate(${tilt}deg)` : undefined, ...style }}>
      <img src={url} style={{
        display: 'block', width: '100%', height: height ? '100%' : 'auto',
        objectFit: height ? (isCut ? 'contain' : 'cover') : undefined, objectPosition: position || 'center',
        filter: [filt !== 'none' ? filt : '', shadow && isCut ? 'drop-shadow(0 26px 40px rgba(10,17,25,.45))' : '']
          .filter(Boolean).join(' ') || undefined,
      }} />
      {halftone && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: _HALFTONE_INK, backgroundSize: '10px 10px', opacity: 0.35, mixBlendMode: 'multiply',
          WebkitMaskImage: `url(${url})`, maskImage: `url(${url})`,
          WebkitMaskSize: height ? (isCut ? 'contain' : 'cover') : '100% 100%', maskSize: height ? (isCut ? 'contain' : 'cover') : '100% 100%',
          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: position || 'center', maskPosition: position || 'center' }} />
      )}
    </div>
  );
}
// Condensed poster face (Archivo wdth 62): the giant white display of the
// .ties covers. *word* → orange.
function VPosterHeadline({ text, size = 200, color = '#FFFFFF', accent = VAQ.orange, align = 'left', style }) {
  const parts = String(text || '').split(/(\*[^*]+\*)/g).filter(Boolean);
  const out = [];
  parts.forEach((p, i) => {
    const isEm = p.startsWith('*') && p.endsWith('*') && p.length > 2;
    const chunk = isEm ? p.slice(1, -1) : p;
    chunk.split('\n').forEach((seg, j) => {
      if (j > 0) out.push(<br key={`b${i}-${j}`} />);
      if (seg) out.push(<span key={`${i}-${j}`} style={isEm ? { color: accent } : undefined}>{seg}</span>);
    });
  });
  return (
    <h2 style={{ margin: 0, fontFamily: VAQ.display, fontWeight: 900, fontStretch: '62%',
      fontSize: size, lineHeight: 0.86, letterSpacing: '-.01em', textTransform: 'uppercase',
      color, textAlign: align, textWrap: 'balance', ...style }}>{out}</h2>
  );
}

// ── Slide wrapper ─────────────────────────────────────────────
// Light slides carry the vertical's rule across the TOP (newsroom masthead);
// solid tiles are pure colour.
// Print refresh: the slide owns a "foot" slot just above the chrome row. The
// jump line (VLoop) portals into it, so it sits at the column foot like a
// newspaper "continued on" line and can never run into the folio/stamp,
// whatever the body length or align_y re-anchoring does above it.
const VFootContext = React.createContext(null);
// Deck-wide texture (2026-08-29): tweaks.texture is the default stock for every
// slide, with tweaks.textureDark / tweaks.textureSolid overriding per surface
// (one paper for the interior, one film for the navy posters, one ink for the
// orange tiles). A slide's own `texture:` still wins; `texture: none` opts out.
// `house` = the user's favourite stocks (2026-08-29), per surface:
//   paper  → newsprint fibre + Grunge_340M scan
//   navy   → 45° halftone + Film_197M scan (Film_176M is the dustier alt)
//   orange → 45° halftone (white dots)
const HOUSE_TEXTURE = {
  light: 'newsprint, file:Texturelabs_Grunge_340M.jpg:30',
  dark:  'halftone, file:Texturelabs_Film_197M.jpg:40',
  solid: 'halftone',
};
function expandTexture(value, surface) {
  if (value !== 'house') return value;
  return surface.onDark ? HOUSE_TEXTURE.dark : surface.onSolid ? HOUSE_TEXTURE.solid : HOUSE_TEXTURE.light;
}
function resolveTexture(texture, t, surface) {
  if (texture === 'none') return '';
  if (texture) return expandTexture(texture, surface);
  if (!t) return '';
  if (surface.onDark && t.textureDark) return expandTexture(t.textureDark, surface);
  if (surface.onSolid && t.textureSolid) return expandTexture(t.textureSolid, surface);
  return expandTexture(t.texture || '', surface);
}
function VSlide({ v, surface, texture, bursts, children }) {
  const [foot, setFoot] = React.useState(null);
  const t = useTweaks();
  const tex = resolveTexture(texture, t, surface);
  return (
    <div className="itiha-slide vaq-slide" style={{ background: surface.bg }}>
      <VTexture texture={tex} v={v} onSolid={surface.onSolid} onDark={surface.onDark} />
      <VBursts bursts={bursts} onSolid={surface.onSolid} />
      <VFootContext.Provider value={foot}>{children}</VFootContext.Provider>
      <div ref={setFoot} style={{ position: 'absolute', left: 72, right: 72, bottom: 104, zIndex: 5 }} />
    </div>
  );
}

// ── Text alignment ────────────────────────────────────────────
// Two per-slide knobs, both optional (same contract as the Itiha pack):
//   align_x: left | center | right   — horizontal, always safe to apply
//   align_y: top  | middle | bottom  — vertical, OPT-IN
//
// align_y is deliberately opt-in. Every VAQ layout is a padded flex column
// whose main block sits wherever the hand-tuned spacers put it. When align_y
// is unset, alignBlock hands the caller's legacy geometry straight back, so
// existing designs render pixel-identically — the only additions are
// textAlign:'left' (already the inherited value) and inert left/right offsets
// on a static box. Only when the author picks a value do we lift the block out
// of the column flow and re-anchor it against the column's own box.
//
// Note the containing block: VAQ's text blocks live inside a padded column
// that is itself position:absolute, so the re-anchor is measured from that
// column — callers pass the column's own gutters as legacy left/right.

const _AX_FLEX = { left: 'flex-start', center: 'center', right: 'flex-end' };

// "Unset" and "explicitly left" are kept distinct: an unset slide emits no
// attribute and inherits whatever alignment its layout already had, so every
// design already in the repo renders untouched. Only an explicit value opts
// into the alignment system. (Same contract as the Itiha pack.)
function alignFor(slide) {
  const raw = (slide && slide.align_x) || '';
  const ax = raw || 'left';
  const ay = (slide && slide.align_y) || '';
  return {
    ax,
    axSet: !!raw,
    ay,
    textAlign: raw ? ax : undefined,
    flexAlign: _AX_FLEX[ax] || 'flex-start',
  };
}

// Build the props for a layout's text block.
//   legacy — the block's existing style object. left/right are read from it to
//     keep the block spanning its column once it goes absolute; on a static
//     box they are inert, so passing them costs nothing.
//   opts.top / opts.bottom — insets used when align_y re-anchors the block.
//     Fold any *_offset_y into these, since the legacy transform is dropped.
//   opts.stretch — pass true for blocks that must keep their box: rows that
//     already set both edges, and pinned chrome. Those take align_x only.
// Returns { style, 'data-align-x', 'data-align-y' } — spread onto the block.
function alignBlock(slide, legacy = {}, opts = {}) {
  const a = alignFor(slide);
  const { top = 110, bottom = 140, stretch = false } = opts;
  const { left, right } = legacy;

  let pos = legacy;
  if (!stretch && a.ay) {
    if (a.ay === 'top')         pos = { position: 'absolute', left, right, top };
    else if (a.ay === 'bottom') pos = { position: 'absolute', left, right, bottom };
    else if (a.ay === 'middle') pos = { position: 'absolute', left, right, top: '50%', transform: 'translateY(-50%)' };
    // Carry over the layout-specific display/margin bits, but drop the legacy
    // vertical anchors (margins and transforms included) so they can't fight
    // the new one.
    const { top: _t, bottom: _b, transform: _tr, position: _p, left: _l, right: _r, marginTop: _m, ...rest } = legacy;
    pos = { ...rest, ...pos };
  }

  const style = { ...pos };
  // Every horizontal effect is gated on the author actually setting align_x,
  // so an unset slide keeps whatever alignment its layout already had.
  if (a.axSet) {
    style.textAlign = a.textAlign;
    // Flex and grid containers have to be told separately — text-align doesn't
    // move flex items. A column aligns on the cross axis, a row on the main one.
    if (style.display === 'flex') {
      if (style.flexDirection === 'column') style.alignItems = a.flexAlign;
      else style.justifyContent = a.flexAlign;
    } else if (style.display === 'grid') {
      style.justifyItems = a.ax;
    }
  }
  return {
    style,
    'data-align-x': a.axSet ? a.ax : undefined,
    'data-align-y': a.ay || undefined,
  };
}

// ── CURIOSITY LOOP ────────────────────────────────────────────
// A one-line cliffhanger pinned under the body that sets up the NEXT slide.
// Editorial copy, not chrome — which is what keeps it clear of the brand's
// no-swipe-meta rule (Itiha owns the swipe-indicator convention). Give it
// nothing on the cover, where the subline already does this job, and nothing
// on the closing, where there is no next slide to loop to.
function VLoop({ text, v, onSolid, onDark }) {
  if (!text) return null;
  // Print refresh: a newspaper jump line ("Continued …") — hairline above,
  // serif italic, right-set. No arrow, no accent: it is copy, not chrome.
  const hair = onSolid ? 'rgba(58,20,2,.35)' : (onDark ? 'rgba(255,255,255,.28)' : 'rgba(10,17,25,.25)');
  const color = onSolid ? '#3A1402' : (onDark ? 'rgba(255,255,255,.82)' : VAQ.bodyL);
  const foot = React.useContext(VFootContext);
  const line = (
    <div style={{ paddingTop: 10, borderTop: `1px solid ${hair}`,
      display: 'flex', justifyContent: 'flex-end', lineHeight: 1.1 }}>
      <span style={{ fontFamily: VAQ.serif, fontStyle: 'italic', fontWeight: 500, fontSize: 26,
        letterSpacing: '-.005em', color }}>
        Next: {text}
      </span>
    </div>
  );
  if (foot && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal) {
    return ReactDOM.createPortal(line, foot);
  }
  return <div style={{ marginTop: 22 }}>{line}</div>;
}

// ── CHARTS ────────────────────────────────────────────────────
// Data-viz tokens for the two-tone system. Derived by holding the brand
// orange's own hue (OKLCH 41.6°) and stepping lightness, then validated with
// the dataviz skill's validate_palette.js against VAQ's real surfaces —
// NOT eyeballed. Re-run it before changing any hex here:
//   node scripts/validate_palette.js "#FF8B5D,#F4631E,#D54E00,#A23900" \
//        --ordinal --surface "#F7F9FB"                      → ALL PASS
//   node scripts/validate_palette.js "#FFCEBC,#FFA380,#F4631E,#D54E00" \
//        --ordinal --mode dark --surface "#1E1E1E"          → ALL PASS
//
// Why there is no categorical palette: a categorical slot needs OKLCH C >= .10
// to do identity work, and every navy that clears it comes out a saturated
// blue (#0064B5 …) — i.e. a second accent, which the 2026-07-27 two-tone
// consolidation exists to prevent. So VAQ charts encode by EMPHASIS instead:
// the subject in orange, the context in slate. That pair separates on
// lightness rather than hue (ΔE 34.1 normal, 21.5 protan on paper), so it
// survives colour blindness better than any two-hue pair would. Running the
// *categorical* validator on it FAILs the chroma floor by design — the grey is
// meant to read as grey. Don't "fix" that by saturating the context colour.
//
// Brand orange is 2.99:1 on paper, a hair under the 3:1 mark floor, so the
// relief rule binds: every value is DIRECTLY LABELLED. A slide has no tooltip
// and no table view, so the label is the only channel — it is not optional.
const VAQ_VIZ = {
  rampLight: ['#FF8B5D', '#F4631E', '#D54E00', '#A23900'],
  rampDark:  ['#FFCEBC', '#FFA380', '#F4631E', '#D54E00'],
  ctxLight:  '#94A7BA',   // de-emphasis fill on paper   (2.34:1)
  ctxDark:   '#76889B',   // de-emphasis fill on #1E1E1E (4.58:1)
  inkLight:  '#3E4F60',   // second identity series on paper (7.98:1)
  onSolidFill:  'rgba(58,20,2,.86)',   // data on the orange poster tile
  onSolidCtx:   'rgba(58,20,2,.26)',
};

// Mark specs. The dataviz specs are in SCREEN px; a 1080-wide slide is shown
// at ~390px on a phone, so everything is multiplied by ~2.75 to land at the
// intended optical weight. Changing SCALE rescales the whole chart system.
const VIZ_SCALE = 2.75;
const VIZ = {
  bar:  Math.round(23 * VIZ_SCALE),   // 63 — cap the bar, let the band breathe
  line: Math.round(2.2 * VIZ_SCALE),  // 6
  dot:  Math.round(4 * VIZ_SCALE),    // 11 radius → 22 dia (spec: >= 8 screen)
  gap:  Math.round(2 * VIZ_SCALE),    // 6  — surface gap between touching fills
  hair: Math.round(1 * VIZ_SCALE),    // 3  — solid hairline grid, never dashed
  round: 11,                          // 4px rounded data-end
};

// Resolve the chart ink for a surface. Text always wears text tokens; only
// marks wear the data colour.
function vizFor(v, surface) {
  const ink = inkFor(v, surface);
  if (surface.onSolid) return {
    accent: VAQ_VIZ.onSolidFill, ctx: VAQ_VIZ.onSolidCtx, ramp: [VAQ_VIZ.onSolidFill],
    grid: 'rgba(58,20,2,.18)', axis: 'rgba(58,20,2,.34)', ink,
  };
  if (surface.onDark) return {
    accent: '#F4631E', ctx: VAQ_VIZ.ctxDark, ramp: VAQ_VIZ.rampDark,
    grid: 'rgba(255,255,255,.12)', axis: 'rgba(255,255,255,.22)', ink,
  };
  return {
    accent: '#F4631E', ctx: VAQ_VIZ.ctxLight, ramp: VAQ_VIZ.rampLight,
    grid: 'rgba(10,17,25,.10)', axis: 'rgba(10,17,25,.20)', ink,
  };
}

// Numbers on a chart: Space Mono, tabular, so columns of values line up.
// (Large standalone figures — the `stat` layout — keep proportional figures.)
//
// Sets BOTH `color` and `fill`, because this style object is spread onto HTML
// spans and SVG <text> alike. SVG text takes `fill`; with `color` only it
// silently falls back to default black, which is invisible on a dark slide.
function vizNum(v, size, color, weight = 700) {
  return { fontFamily: metaFontFor(v), fontWeight: weight, fontSize: size, color, fill: color,
           fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', whiteSpace: 'nowrap' };
}

// A source/footnote line under a chart. Charts carry their provenance.
function VSource({ text, v, viz }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: 30, fontFamily: metaFontFor(v), fontWeight: 400, fontSize: 21,
      letterSpacing: '.04em', color: viz.ink.muted, lineHeight: 1.45 }}>{text}</div>
  );
}

// Legend — mandatory whenever two or more things are encoded by colour. A
// single series never gets one: the headline already names what is plotted.
function VLegend({ items, v, viz, style }) {
  if (!items || items.length < 2) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 34px', marginTop: 30, ...style }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 26, height: 14, borderRadius: 3, background: it.color, flex: 'none' }} />
          <span style={{ fontFamily: metaFontFor(v), fontWeight: 700, fontSize: 22, letterSpacing: '.06em',
            textTransform: 'uppercase', color: viz.ink.body }}>{it.name}</span>
        </div>
      ))}
    </div>
  );
}

// Parse `rows:` from YAML. Accepts objects or "Label | 42 | note" strings so a
// chart can be typed quickly in the paste tab.
function vizRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    if (typeof r === 'string') {
      const p = r.split('|').map(s => s.trim());
      return { label: p[0] || '', value: parseFloat(p[1]) || 0, note: p[2] || '', emphasis: /\*$/.test(p[0]) };
    }
    return { label: r.label || '', value: Number(r.value) || 0, note: r.note || '',
             emphasis: !!r.emphasis, color: r.color };
  }).map(r => ({ ...r, label: String(r.label).replace(/\s*\*$/, '') }));
}

// Format a value for a direct label.
function vizFmt(n, prefix = '', suffix = '', decimals) {
  const d = decimals === undefined || decimals === null || decimals === ''
    ? (Math.abs(n) < 10 && !Number.isInteger(n) ? 1 : 0) : Number(decimals);
  const s = Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
  return `${prefix}${s}${suffix}`;
}

Object.assign(window, {
  VAQ, VERTICALS, BrandContext, useTweaks, verticalFor, surfaceFor, solidPalette,
  headlineStyle, headlineDefaultSize, VHeadline, VBody, VKicker,
  VMark, VWordmark, VChrome, VTexture, VGhostIndex, VSlide,
  alignFor, alignBlock, VLoop,
  VAQ_VIZ, VIZ, VIZ_SCALE, vizFor, vizNum, VSource, VLegend, vizRows, vizFmt,
});
