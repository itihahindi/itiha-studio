// VAQ HQ — slide primitives (tokens, verticals, mark, kickers, chrome)
// Design source: reference/vaq-hq-instagram-system.html + vaq-hq-verticals.html.
// Flat editorial tiles à la Vox: solid accent surfaces or dark navy with an
// accent bottom rule. Four verticals share one skeleton and differ only in
// accent + type treatment. Orange is the channel hero and never moves.

const VAQ = {
  bg:        '#0A1119',
  tileDark:  '#0E1A29',
  surface:   '#1B2735',
  card:      '#101D2E',
  ink:       '#FFFFFF',
  body:      '#9FB0C0',
  body2:     '#C7D2DD',
  muted:     '#6E8093',
  muted2:    '#5C6E80',
  hairline:  'rgba(255,255,255,.07)',
  hairline2: 'rgba(255,255,255,.10)',
  hairline3: 'rgba(255,255,255,.12)',
  orange:    '#F4631E',
  slate:     '#4A6076',                     // outer arc of the V-Transmit mark
  serif:   "'Newsreader', Georgia, serif",
  sans:    "'Hanken Grotesk', system-ui, sans-serif",
  display: "'Archivo', 'Hanken Grotesk', sans-serif",
  mono:    "'Space Mono', ui-monospace, monospace",
  deva:    "'Noto Serif Devanagari', serif",
};

// ── The four verticals ────────────────────────────────────────
// accent   — the beat's colour (solid tile bg / kicker / rule on dark)
// onAccent — kicker & emphasis ink on a solid accent surface
// tint     — light companion colour on a solid accent surface
// face     — headline treatment key (see headlineStyle)
// badge    — kicker chrome: 'plain' (● LIVE), 'solid' chip, 'outline' chip
const VERTICALS = {
  live: {
    key: 'live', name: 'Current Affairs', show: 'Vaq HQ Breaking',
    kicker: '● LIVE', badge: 'plain',
    accent: '#F4631E', onAccent: '#3A1402', onAccentMuted: '#7A2C08', tint: '#FFD9C4',
    face: 'display',
  },
  briefing: {
    key: 'briefing', name: 'Geopolitics', show: 'The Briefing',
    kicker: 'GEOPOLITICS', badge: 'solid',
    accent: '#2F6BE0', onAccent: '#FFFFFF', onAccentMuted: 'rgba(255,255,255,.7)', tint: '#CFE0FB',
    face: 'serif',
  },
  longview: {
    key: 'longview', name: 'Political History', show: 'The Long View',
    kicker: 'HISTORY', badge: 'outline',
    accent: '#9A3F73', onAccent: '#FFFFFF', onAccentMuted: '#C77FA8', tint: '#F2D6E6',
    face: 'serif-italic',
  },
  ground: {
    key: 'ground', name: 'Indian Politics', show: 'Ground Report',
    kicker: 'GROUND REPORT', badge: 'solid', deva: 'ज़मीनी हक़ीक़त',
    accent: '#0FA08C', onAccent: '#FFFFFF', onAccentMuted: 'rgba(255,255,255,.7)', tint: '#CFF3EC',
    face: 'sans',
  },
};

// ── Base slide CSS ────────────────────────────────────────────
// `.itiha-slide` is the cross-brand capture contract (render.py waits on it).
if (typeof document !== 'undefined' && !document.getElementById('vaq-slide-styles')) {
  const s = document.createElement('style');
  s.id = 'vaq-slide-styles';
  s.textContent = `
    .itiha-slide{position:relative;width:var(--slide-width,1080px);height:var(--slide-height,1350px);overflow:hidden;color:${VAQ.body2};font-family:${VAQ.sans};-webkit-font-smoothing:antialiased}
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

// Resolve a slide's vertical: slide field wins, then project tweak, then live.
function verticalFor(slide, t) {
  const key = (slide && slide.vertical) || (t && t.vertical) || 'live';
  return VERTICALS[key] || VERTICALS.live;
}

// Surface for a slide: 'solid' (accent bg) or 'dark' (navy + accent rule).
function surfaceFor(slide, v, fallback = 'dark') {
  const mode = (slide && slide.surface) || fallback;
  if (mode === 'solid') return { mode, bg: v.accent, onSolid: true };
  if (mode === 'navy')  return { mode, bg: VAQ.bg,      onSolid: false };
  return { mode: 'dark', bg: VAQ.tileDark, onSolid: false };
}

// ── Headline treatment per vertical ───────────────────────────
function headlineStyle(v, size) {
  const base = { margin: 0, color: VAQ.ink, textWrap: 'balance' };
  switch (v.face) {
    case 'display':      // Live — Archivo 900, UPPERCASE
      return { ...base, fontFamily: VAQ.display, fontWeight: 900, fontSize: size,
               lineHeight: 0.98, letterSpacing: '-.02em', textTransform: 'uppercase' };
    case 'serif':        // The Briefing — Newsreader 600
      return { ...base, fontFamily: VAQ.serif, fontWeight: 600, fontSize: size,
               lineHeight: 1.04, letterSpacing: '-.015em' };
    case 'serif-italic': // The Long View — Newsreader italic 500
      return { ...base, fontFamily: VAQ.serif, fontWeight: 500, fontStyle: 'italic',
               fontSize: size, lineHeight: 1.04, letterSpacing: '-.01em' };
    default:             // Ground Report — Hanken Grotesk 800
      return { ...base, fontFamily: VAQ.sans, fontWeight: 800, fontSize: size,
               lineHeight: 1.02, letterSpacing: '-.02em' };
  }
}

// Default headline size per face. Sized so a 10-cap word (PARLIAMENT)
// still fits the 936px text column in each face — long words clip otherwise.
function headlineDefaultSize(v, kind) {
  const cover = { display: 118, serif: 110, 'serif-italic': 108, sans: 112 };
  const inner = { display: 88,  serif: 84,  'serif-italic': 84,  sans: 84 };
  return (kind === 'cover' ? cover : inner)[v.face] || 96;
}

// ── Micro-syntax ──────────────────────────────────────────────
// Headlines: *word* → emphasis. On dark surfaces it becomes a Vox-style
// accent highlight block; on solid accent surfaces it renders in the tint.
function VHeadline({ text, v, size, onSolid, style }) {
  const st = headlineStyle(v, size);
  const parts = String(text || '').split(/(\*[^*]+\*)/g).filter(Boolean);
  const lines = [];
  parts.forEach((p, i) => {
    const isEm = p.startsWith('*') && p.endsWith('*') && p.length > 2;
    const chunk = isEm ? p.slice(1, -1) : p;
    chunk.split('\n').forEach((seg, j) => {
      if (j > 0) lines.push(<br key={`b${i}-${j}`} />);
      if (!seg) return;
      if (isEm) {
        lines.push(onSolid
          ? <span key={`${i}-${j}`} style={{ color: v.tint }}>{seg}</span>
          : <span key={`${i}-${j}`} style={{
              background: v.accent, color: v.onAccent,
              padding: '0 0.14em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
            }}>{seg}</span>);
      } else {
        lines.push(<span key={`${i}-${j}`}>{seg}</span>);
      }
    });
  });
  return <h2 style={{ ...st, ...style }}>{lines}</h2>;
}

// Body: [word] → accent emphasis · _word_ → italic · **word** → bold white.
function VBody({ text, v, size = 40, onSolid, color, style }) {
  const base = {
    margin: 0, fontFamily: VAQ.sans, fontWeight: 400, fontSize: size,
    lineHeight: size <= 36 ? 1.65 : size <= 46 ? 1.6 : 1.45,
    color: color || (onSolid ? 'rgba(255,255,255,.92)' : VAQ.body2),
    textWrap: 'pretty',
  };
  const emColor = onSolid ? v.tint : v.accent;
  const paras = String(text || '').split(/\n\n+/);
  const renderInline = (str, keyBase) =>
    str.split(/(\[[^\]]+\]|\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean).map((p, i) => {
      if (p.startsWith('[') && p.endsWith(']'))
        return <span key={`${keyBase}-${i}`} style={{ color: emColor, fontWeight: 600 }}>{p.slice(1, -1)}</span>;
      if (p.startsWith('**') && p.endsWith('**'))
        return <strong key={`${keyBase}-${i}`} style={{ color: onSolid ? '#fff' : VAQ.ink, fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
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

// ── Kicker row (the vertical's cue + show label) ──────────────
function VKicker({ v, onSolid, meta, style }) {
  const chip = (() => {
    if (v.badge === 'plain') {
      return <span style={{
        fontFamily: VAQ.sans, fontWeight: 800, fontSize: 28, letterSpacing: '.1em',
        color: onSolid ? v.onAccent : v.accent,
      }}>{v.kicker}</span>;
    }
    if (v.badge === 'outline') {
      return <span style={{
        border: `2.5px solid ${onSolid ? v.tint : v.accent}`,
        color: onSolid ? v.tint : v.accent,
        fontFamily: VAQ.sans, fontWeight: 700, fontSize: 23, letterSpacing: '.12em',
        padding: '7px 16px', borderRadius: 8, textTransform: 'uppercase',
      }}>{v.kicker}</span>;
    }
    return <span style={{
      background: onSolid ? 'rgba(255,255,255,.16)' : v.accent, color: '#fff',
      fontFamily: VAQ.sans, fontWeight: 800, fontSize: 23, letterSpacing: '.12em',
      padding: '8px 17px', borderRadius: 8, textTransform: 'uppercase',
    }}>{v.kicker}</span>;
  })();
  // Suppress the show label when it just repeats the badge (Ground Report).
  const metaText = meta || v.show;
  const dupMeta = metaText.trim().toLowerCase() === v.kicker.trim().toLowerCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, ...style }}>
      {chip}
      {!dupMeta && <span style={{
        fontFamily: VAQ.mono, fontWeight: 700, fontSize: 22, letterSpacing: '.16em',
        textTransform: 'uppercase',
        color: onSolid ? v.onAccentMuted : VAQ.muted,
      }}>{metaText}</span>}
      {v.deva && (
        <span style={{ fontFamily: VAQ.deva, fontWeight: 600, fontSize: 27,
          color: onSolid ? v.tint : v.accent, marginLeft: 'auto' }}>{v.deva}</span>
      )}
    </div>
  );
}

// ── V-Transmit mark + wordmark ────────────────────────────────
// Chevron + inner arc take `color`; outer arc stays slate (kit spec) unless
// mono (all-white on solid accent surfaces).
function VMark({ size = 44, color = VAQ.orange, mono = false }) {
  const main = mono ? '#FFFFFF' : color;
  const arc  = mono ? 'rgba(255,255,255,.55)' : VAQ.slate;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="Vaq HQ mark">
      <path d="M75 8 A21 21 0 0 1 96 29" stroke={arc} strokeWidth="6" strokeLinecap="round" />
      <path d="M75 17 A12 12 0 0 1 87 29" stroke={main} strokeWidth="6" strokeLinecap="round" />
      <path d="M19 29 L47 75 L75 29" stroke={main} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VWordmark({ size = 34, onSolid = false, withMark = true, markSize }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(size * 0.42) }}>
      {withMark && <VMark size={markSize || Math.round(size * 1.35)} mono={onSolid} />}
      <span style={{ fontFamily: VAQ.serif, fontWeight: 600, fontSize: size, letterSpacing: '-.01em', lineHeight: 1 }}>
        <span style={{ color: '#fff' }}>Vaq</span>{' '}
        <span style={{ color: onSolid ? '#fff' : VAQ.orange, opacity: onSolid ? 0.85 : 1 }}>HQ</span>
      </span>
    </div>
  );
}

// Bottom chrome: page number left, wordmark right. Respects tweaks.
function VChrome({ n, onSolid, v }) {
  const t = useTweaks();
  const total = (t && t.totalSlides) || 9;
  const lbl = (t && t.seriesLabel) || '';
  return (
    <div style={{
      position: 'absolute', left: 72, right: 72, bottom: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {t.showPageNum !== false && n != null ? (
        <span style={{ fontFamily: VAQ.mono, fontSize: 22, letterSpacing: '.18em',
          color: onSolid ? v.onAccentMuted : VAQ.muted }}>
          {String(n).padStart(2, '0')} / {String(total).padStart(2, '0')}{lbl ? ` · ${lbl}` : ''}
        </span>
      ) : <span />}
      {t.showStamp !== false ? <VWordmark size={30} onSolid={onSolid} /> : <span />}
    </div>
  );
}

// ── Slide wrapper ─────────────────────────────────────────────
// Solid tiles are pure colour; dark tiles carry the accent bottom rule
// (the grid signature from the IG mock, scaled up).
function VSlide({ v, surface, children }) {
  return (
    <div className="itiha-slide vaq-slide" style={{ background: surface.bg }}>
      {children}
      {!surface.onSolid && surface.mode !== 'navy' && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 14, background: v.accent }} />
      )}
    </div>
  );
}

Object.assign(window, {
  VAQ, VERTICALS, BrandContext, useTweaks, verticalFor, surfaceFor,
  headlineStyle, headlineDefaultSize, VHeadline, VBody, VKicker,
  VMark, VWordmark, VChrome, VSlide,
});
