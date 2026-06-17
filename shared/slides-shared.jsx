// Itiha — shared slide primitives (tokens, Stamp, Slide chrome, Placeholder)
// All slides are 1080×1350 (4:5 Instagram carousel).

const ITIHA = {
  jet: '#000000',
  ink: '#0D0D0D',
  charcoal: '#1C1C1C',
  darkGray: '#2C2C2C',
  midGray: '#8A8A8A',
  red: '#C0392B',
  parchment: '#E8DCC8',
  offWhite: '#FAF5EE',
  white: '#FFFFFF',
  nearBlack: '#1A1A1A',
  bebas: "'Bebas Neue', Impact, sans-serif",
  heavy: "'Big Shoulders Display', 'Bebas Neue', Impact, sans-serif",
  sans: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

// One-time global CSS for the slide world (separate from design-canvas chrome)
if (typeof document !== 'undefined' && !document.getElementById('itiha-slide-styles')) {
  const s = document.createElement('style');
  s.id = 'itiha-slide-styles';
  s.textContent = `
    .itiha-slide{position:relative;width:var(--slide-width,1080px);height:var(--slide-height,1350px);overflow:hidden;color:${ITIHA.parchment};font-family:${ITIHA.sans};-webkit-font-smoothing:antialiased}
    /* Type overlays must not block drops onto the image-slot underneath. */
    .itiha-slide > div[style*="position: absolute"]:not(:first-child){pointer-events:none}
    .itiha-slide image-slot{pointer-events:auto}
    .itiha-slide *{box-sizing:border-box}
    .itiha-stamp{position:absolute;right:56px;bottom:48px;font-family:${ITIHA.bebas};font-size:22px;letter-spacing:2px;line-height:1;display:flex;align-items:baseline;gap:0}
    .itiha-stamp .w{color:var(--stamp-fg,${ITIHA.parchment})}
    .itiha-stamp .d{color:${ITIHA.red};margin-left:1px}
    .itiha-page{position:absolute;left:56px;bottom:48px;font-family:${ITIHA.sans};font-weight:600;font-size:13px;letter-spacing:4px;color:${ITIHA.midGray};text-transform:uppercase}
    .itiha-eyebrow{font-family:${ITIHA.sans};font-weight:600;font-size:14px;letter-spacing:5px;color:${ITIHA.red};text-transform:uppercase}
    .itiha-divider{display:block;width:48px;height:3px;background:${ITIHA.red};border:0}
    .itiha-h1{font-family:${ITIHA.bebas};color:${ITIHA.parchment};font-weight:400;line-height:0.94;letter-spacing:-0.5px;margin:0;text-transform:uppercase}
    .itiha-h1 .accent{color:${ITIHA.red}}
    .itiha-sub{font-family:${ITIHA.sans};font-weight:600;font-size:15px;letter-spacing:4px;text-transform:uppercase;color:rgba(232,220,200,0.55)}
    .itiha-body{font-family:${ITIHA.sans};font-weight:400;font-size:28px;line-height:1.6;color:${ITIHA.parchment};text-wrap:pretty}
    .itiha-body.light{color:${ITIHA.nearBlack}}
    .itiha-body .key{color:${ITIHA.red};font-weight:500}
    .itiha-meta{font-family:${ITIHA.sans};font-weight:500;font-size:15px;letter-spacing:2.4px;text-transform:uppercase;color:${ITIHA.midGray}}
    .itiha-pull{font-family:${ITIHA.bebas};font-size:64px;line-height:1.0;color:${ITIHA.parchment};letter-spacing:0.5px;text-transform:uppercase}
    /* Light-theme per-slide overrides: triggered by .itiha-slide.light */
    .itiha-slide.light{color:${ITIHA.nearBlack}}
    .itiha-slide.light .itiha-h1{color:${ITIHA.ink}}
    .itiha-slide.light .itiha-body{color:${ITIHA.nearBlack}}
    .itiha-slide.light .itiha-pull{color:${ITIHA.ink}}
    .itiha-slide.light .itiha-sub{color:rgba(26,26,26,0.6)}
    .itiha-slide.light .itiha-meta{color:rgba(26,26,26,0.55)}
    .itiha-slide.light .itiha-page{color:rgba(26,26,26,0.6)}
    .itiha-slide image-slot{display:block;width:100%;height:100%}
    /* faint film grain — pseudo only, no shadows */
    .itiha-grain::after{content:"";position:absolute;inset:0;pointer-events:none;
      background-image:radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);
      background-size:3px 3px;mix-blend-mode:overlay;opacity:0.6}
    .itiha-noise{position:absolute;inset:0;pointer-events:none;opacity:0.07;
      background:
        repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.5) 2px 3px),
        repeating-linear-gradient(90deg, transparent 0 2px, rgba(0,0,0,0.5) 2px 3px)}
    /* ── Texture overlays (opt in via slide.texture) ───────────── */
    .itiha-tex{position:absolute;inset:0;pointer-events:none;z-index:2}
    .itiha-tex--grain{
      background-image:radial-gradient(rgba(255,255,255,0.05) 1px,transparent 1px);
      background-size:3px 3px;mix-blend-mode:overlay;opacity:0.85}
    .itiha-tex--noise{opacity:0.12;
      background:
        repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.5) 2px 3px),
        repeating-linear-gradient(90deg, transparent 0 2px, rgba(0,0,0,0.5) 2px 3px)}
    .itiha-tex--scanlines{opacity:0.18;mix-blend-mode:multiply;
      background:repeating-linear-gradient(180deg, transparent 0 2px, rgba(0,0,0,0.55) 2px 3px)}
    .itiha-tex--paper{opacity:0.32;mix-blend-mode:multiply;
      background:
        radial-gradient(circle at 20% 30%, rgba(0,0,0,0.18) 0, transparent 35%),
        radial-gradient(circle at 75% 70%, rgba(0,0,0,0.16) 0, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(140,110,60,0.12) 0, transparent 60%),
        repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 2px, transparent 2px 7px)}
    .itiha-tex--halftone{opacity:0.32;mix-blend-mode:multiply;
      background-image:radial-gradient(circle at center, rgba(0,0,0,0.7) 0.6px, transparent 1.6px);
      background-size:5px 5px}
    .itiha-tex--vignette{opacity:1;
      background:radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 100%)}
  `;
  document.head.appendChild(s);
}

function Stamp({ color }) {
  return (
    <div className="itiha-stamp" style={color ? { '--stamp-fg': color } : undefined}>
      <span className="w">ITIHA</span><span className="d">.</span>
    </div>
  );
}

function PageNum({ n, total, label, color }) {
  const t = useItiha();
  const N = total || (t && t.totalSlides) || 9;
  const lbl = label || (t && t.seriesLabel) || '';
  return (
    <div className="itiha-page" style={color ? { color } : undefined}>
      {String(n).padStart(2, '0')} / {String(N).padStart(2, '0')}{lbl ? ` · ${lbl}` : ''}
    </div>
  );
}

function Eyebrow({ children, color, style }) {
  return <div className="itiha-eyebrow" style={{ ...(color ? { color } : null), ...style }}>{children}</div>;
}

function Divider({ width = 48, color = ITIHA.red, style }) {
  return <hr className="itiha-divider" style={{ width, background: color, ...style }} />;
}

// Striped placeholder for "drop image here" cards (Variation B contained imagery)
function StripedPlaceholder({ note, width = '100%', height = '100%', mono = true, dark = true, style }) {
  const stripe = dark
    ? 'repeating-linear-gradient(135deg, #1C1C1C 0 14px, #131313 14px 28px)'
    : 'repeating-linear-gradient(135deg, #E2D6C0 0 14px, #D8CBB3 14px 28px)';
  return (
    <div style={{
      position: 'relative', width, height,
      background: stripe,
      border: `1px solid ${dark ? ITIHA.darkGray : '#C9BB9D'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>
      <div style={{
        fontFamily: mono ? ITIHA.mono : ITIHA.sans,
        fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase',
        color: dark ? 'rgba(232,220,200,0.85)' : 'rgba(26,26,26,0.7)',
        background: dark ? 'rgba(0,0,0,0.55)' : 'rgba(250,245,238,0.85)',
        padding: '8px 14px', border: `1px solid ${dark ? ITIHA.darkGray : '#C9BB9D'}`,
        maxWidth: '80%', textAlign: 'center', lineHeight: 1.5,
      }}>{note}</div>
    </div>
  );
}

// A full-bleed image-slot with cinematic dark overlay for Variation A.
// `id` must be unique per slide so the drop persists.
function FullBleedSlot({ id, placeholder, overlay, vignette = true, bw = false }) {
  const t = (typeof React !== 'undefined' && React.useContext) ? React.useContext(ItihaContext) : null;
  const o = overlay != null ? overlay : ((t && t.overlayDarkness != null) ? t.overlayDarkness / 100 : 0.62);
  const filter = bw ? 'grayscale(1) contrast(1.08)' : undefined;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <image-slot id={id} shape="rect" placeholder={placeholder}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter }}></image-slot>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, rgba(0,0,0,${o * 0.7}) 0%, rgba(0,0,0,${o * 0.45}) 38%, rgba(0,0,0,${o}) 70%, rgba(0,0,0,${Math.min(o + 0.15, 0.95)}) 100%)`,
        pointerEvents: 'none',
      }} />
      {vignette && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

// ── Tweak context ─────────────────────────────────────────────
// Slides read from this so the Tweaks panel can drive their chrome.
const ItihaContext = React.createContext({
  showChapterLabels: false,
  showStamp: true,
  showPageNum: true,
  overlayDarkness: 62,
  accentRed: true,
});
function useItiha() { return React.useContext(ItihaContext); }

// Wrappers that respect tweaks
function ChapterEyebrow({ children, style }) {
  const t = useItiha();
  if (!t.showChapterLabels) return null;
  return <Eyebrow style={style}>{children}</Eyebrow>;
}
function MaybeStamp(props) {
  const t = useItiha();
  if (!t.showStamp) return null;
  return <Stamp {...props} />;
}
function MaybePageNum(props) {
  const t = useItiha();
  if (!t.showPageNum) return null;
  return <PageNum {...props} />;
}

// CSS filter presets for `image_filter`. `bw` preserves the legacy effect of
// `image_bw: true`; the duotone modes desaturate the image and a colored
// `multiply` overlay tints what remains.
const _IMAGE_FILTERS = {
  '':                  null,
  bw:                  { css: 'grayscale(1) contrast(1.08)' },
  sepia:               { css: 'sepia(1) saturate(1.15) contrast(1.05)' },
  archival:            { css: 'sepia(0.72) saturate(0.85) contrast(0.95) brightness(0.95)' },
  warm:                { css: 'sepia(0.3) saturate(1.2) hue-rotate(-8deg) contrast(1.05)' },
  cool:                { css: 'saturate(0.7) hue-rotate(160deg) contrast(1.1) brightness(0.95)' },
  'duotone-red':       { css: 'grayscale(1) contrast(1.25) brightness(0.85)', overlay: 'rgba(192,57,43,0.55)', blend: 'multiply' },
  'duotone-parchment': { css: 'grayscale(1) contrast(1.1) brightness(1.05)',  overlay: 'rgba(232,220,200,0.5)', blend: 'multiply' },
  'duotone-ink':       { css: 'grayscale(1) contrast(1.3) brightness(0.65)',  overlay: 'rgba(13,13,13,0.45)',   blend: 'multiply' },
};

// Resolve which filter to apply given the slide's `image_filter` (new) and
// `image_bw` (legacy boolean). Filter wins if set; otherwise bw maps to "bw".
function _resolveImageFilter(filterKey, bw) {
  const key = filterKey || (bw ? 'bw' : '');
  return _IMAGE_FILTERS[key] || null;
}

// URL-based image layer (YAML-driven mode). Uses an <img> sized to "cover"
// so headless renderers wait on real network/decode events.
function ImageLayer({ url, bw, filter, overlay, position = 'center', vignette = true, light = false }) {
  const t = useItiha();
  const o = overlay != null ? overlay : ((t && t.overlayDarkness != null) ? t.overlayDarkness / 100 : 0.62);
  if (!url) {
    return <div style={{ position: 'absolute', inset: 0, background: light ? '#FAF5EE' : '#1a1a1a' }} />;
  }
  const fx = _resolveImageFilter(filter, bw);
  const cssFilter = fx ? fx.css : undefined;
  // Bare filenames or "_cache/<name>" → served under /images/. URLs pass through.
  const isUrl = url.startsWith('http://') || url.startsWith('https://');
  const src = isUrl ? url : `images/${url}`;
  // Dark theme: dark gradient veil (keeps parchment text readable).
  // Light theme: off-white veil (keeps near-black text readable on photos).
  const veil = light ? '250,245,238' : '0,0,0';
  const vignetteRgba = light ? 'rgba(250,245,238,0.55)' : 'rgba(0,0,0,0.55)';
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <img src={src} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: position, filter: cssFilter,
      }} />
      {fx && fx.overlay && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: fx.overlay, mixBlendMode: fx.blend || 'multiply',
        }} />
      )}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(180deg, rgba(${veil},${o * 0.7}) 0%, rgba(${veil},${o * 0.45}) 38%, rgba(${veil},${o}) 70%, rgba(${veil},${Math.min(o + 0.15, 0.95)}) 100%)`,
      }} />
      {vignette && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at center, transparent 40%, ${vignetteRgba} 100%)`,
        }} />
      )}
    </div>
  );
}

// Texture overlay — paints on top of imagery and below text.
// Accepts a single texture name OR a comma-separated list ("grain,vignette").
// Values: grain · noise · scanlines · paper · halftone · vignette.
function TextureOverlay({ texture }) {
  if (!texture) return null;
  const names = String(texture).split(',').map(s => s.trim()).filter(Boolean);
  return (
    <>
      {names.map((n, i) => (
        <div key={i} className={`itiha-tex itiha-tex--${n}`} />
      ))}
    </>
  );
}

// Per-slide theme tokens. Layouts read `themeFor(slide)` and use the returned
// colors / className. Default is dark (the existing palette). `theme: light`
// flips bg→off-white, text→near-black; CSS overrides above handle class-driven
// elements (.itiha-h1, .itiha-body, .itiha-sub, .itiha-meta, .itiha-pull, .itiha-page).
function themeFor(slide) {
  const isLight = slide && slide.theme === 'light';
  if (isLight) {
    return {
      isLight: true,
      className: 'light',
      bg: ITIHA.offWhite,
      fg: ITIHA.nearBlack,
      h1: ITIHA.ink,
      stampFg: ITIHA.ink,
      pageNumColor: 'rgba(26,26,26,0.6)',
      divider: '#D4C9B6',                  // muted parchment divider on light
      muted55: 'rgba(26,26,26,0.55)',
      muted40: 'rgba(26,26,26,0.45)',
      muted75: 'rgba(26,26,26,0.8)',
      muted35: 'rgba(26,26,26,0.35)',
      handleDot: ITIHA.red,
    };
  }
  return {
    isLight: false,
    className: '',
    bg: ITIHA.ink,
    fg: ITIHA.parchment,
    h1: ITIHA.parchment,
    stampFg: ITIHA.parchment,
    pageNumColor: undefined,                // CSS default (mid-gray)
    divider: ITIHA.darkGray,
    muted55: 'rgba(232,220,200,0.55)',
    muted40: 'rgba(232,220,200,0.4)',
    muted75: 'rgba(232,220,200,0.75)',
    muted35: 'rgba(232,220,200,0.35)',
    handleDot: ITIHA.red,
  };
}

Object.assign(window, { ITIHA, Stamp, PageNum, Eyebrow, Divider, StripedPlaceholder, FullBleedSlot, ImageLayer, ItihaContext, useItiha, ChapterEyebrow, MaybeStamp, MaybePageNum, themeFor, TextureOverlay });
