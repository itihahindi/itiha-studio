// Itiha — shared slide primitives (tokens, Stamp, Slide chrome, Placeholder)
// All slides are 1080×1350 (4:5 Instagram carousel).

// Tokens are ROLES, not colours. Every value is a CSS variable resolved on the
// slide root, so a deck can swap the whole look (tweaks.palette / tweaks.fonts,
// see LOOK_CSS below) without a layout knowing which palette it is drawing in.
// Pairs: `ground`/`fg` = the dark ground and its text, `paper`/`onPaper` = the
// light ground and its text, `accent`/`onAccent` = graphic accent and text set
// on an accent fill (both follow the slide's theme), `hl` = headline *accent*
// words, `solid`/`onSolid`/`solidAccent` = full-slide poster grounds
// (cover_style: red, cta-red). rgba(name, a) gives a translucent version for
// the names that carry an -rgb triplet (fg, paper, onPaper, accent, veil).
const ITIHA = {
  jet: 'var(--it-jet)',
  ground: 'var(--it-ground)',
  raised: 'var(--it-raised)',
  line: 'var(--it-line)',
  muted: 'var(--it-muted)',
  fg: 'var(--it-fg)',
  paper: 'var(--it-paper)',
  onPaper: 'var(--it-on-paper)',
  paperInk: 'var(--it-paper-ink)',
  accent: 'var(--it-accent)',
  onAccent: 'var(--it-on-accent)',
  hl: 'var(--it-hl)',
  solid: 'var(--it-solid)',
  onSolid: 'var(--it-on-solid)',
  solidAccent: 'var(--it-solid-accent)',
  white: '#FFFFFF',
  display: 'var(--it-display)',
  heavy: 'var(--it-heavy)',
  text: 'var(--it-text)',
  quote: 'var(--it-quote)',
  mono: 'var(--it-mono)',
  rgba: (name, a) => `rgba(var(--it-${name.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}-rgb),${a})`,
  // Display sizes are authored against the classic condensed face; a type set
  // with wider letters scales them through --it-hs so copy keeps fitting.
  series: (light, n) => Array.from({ length: n }, (_, i) => `var(--it-s${light ? 'l' : 'd'}${i + 1})`),
  dsize: (px) => `calc(${px}px * var(--it-hs, 1))`,
  // Small UI labels (attributions, dates, chart labels). Classic sets them in
  // tracked-out caps; the 2026-10 looks lift them to a 21px floor in sentence
  // case through --it-lbl-*. Unset vars fall back to the authored values.
  caps: (px, track) => ({ fontSize: `max(${px}px, var(--it-lbl-min, 0px))`,
                          letterSpacing: `var(--it-lbl-track, ${track})`,
                          textTransform: 'var(--it-lbl-case, uppercase)' }),
  dfont: (px) => ({ fontFamily: 'var(--it-display)', fontSize: `calc(${px}px * var(--it-hs, 1))`,
                    fontWeight: 'var(--it-h-weight)', textTransform: 'var(--it-h-case)',
                    fontStretch: 'var(--it-h-stretch)' }),
};

// ── Looks ──────────────────────────────────────────────────────
// A look = a palette class (pal-*) plus the it-v2 chrome/type class on the
// slide root, picked per deck in tweaks.palette (lookClass reads it). The bare
// .itiha-slide rule holds the classic 2026 look (ink / parchment / Sindoor,
// Bebas + DM Sans), which every palette then overrides. Accent, headline
// accent and text-on-accent come in -d/-l pairs because a colour that pops on
// the dark ground can vanish on the light one; the .light rule swaps them.
const LOOK_CSS = `
  .itiha-slide{
    --it-jet:#000000; --it-ground:#0D0D0D; --it-ground-rgb:13,13,13; --it-raised:#1C1C1C; --it-line:#2C2C2C; --it-muted:#8A8A8A;
    --it-fg:#E8DCC8; --it-fg-rgb:232,220,200;
    --it-paper:#FAF5EE; --it-paper-rgb:250,245,238;
    --it-on-paper:#1A1A1A; --it-on-paper-rgb:26,26,26; --it-paper-ink:#0D0D0D;
    --it-accent-d:#C0392B; --it-accent-d-rgb:192,57,43; --it-hl-d:#E2604F; --it-on-accent-d:#FFFFFF;
    --it-accent-l:#C0392B; --it-accent-l-rgb:192,57,43; --it-hl-l:#C0392B; --it-on-accent-l:#FFFFFF;
    --it-solid:#C0392B; --it-on-solid:#FFFFFF; --it-on-solid-rgb:255,255,255; --it-solid-accent:#0D0D0D;
    --it-mono:'JetBrains Mono', ui-monospace, monospace;
    --it-bar:3px solid var(--it-accent); --it-bar-k:1; --it-rule-w:1px; --it-item-k:1;
    --it-veil-rgb:0,0,0; --it-blank:#1A1A1A; --it-paper-line:#D4C9B6; --it-paper-raised:#EFE7D9;
    --it-m35:0.35; --it-m40:0.4; --it-m55:0.55; --it-m75:0.75;
    --it-sd1:#C0392B; --it-sd2:#E8DCC8; --it-sd3:#8A8A8A; --it-sd4:#C9BB9D; --it-sd5:#5A5A5A; --it-sd6:#7A2E22;
    --it-sl1:#C0392B; --it-sl2:#1A1A1A; --it-sl3:#8A8A8A; --it-sl4:#7A2E22; --it-sl5:#B0A283; --it-sl6:#4A4A4A;
    --it-display:'Bebas Neue', Impact, sans-serif;
    --it-heavy:'Big Shoulders Display', 'Bebas Neue', Impact, sans-serif;
    --it-text:'DM Sans', system-ui, sans-serif;
    --it-quote:'DM Serif Display', 'Noto Serif Devanagari', Georgia, serif;
    --it-h-case:uppercase; --it-h-lh:0.94; --it-h-track:-0.5px; --it-h-weight:400; --it-h-stretch:normal; --it-hs:1;
    --it-duo-lo-d:#0D0D0D; --it-duo-hi-d:#E8DCC8; --it-duo-lo-l:#0D0D0D; --it-duo-hi-l:#E8DCC8;
    --it-accent:var(--it-accent-d); --it-accent-rgb:var(--it-accent-d-rgb);
    --it-hl:var(--it-hl-d); --it-on-accent:var(--it-on-accent-d);
    --it-duo-lo:var(--it-duo-lo-d); --it-duo-hi:var(--it-duo-hi-d);
  }
  .itiha-slide.light{
    --it-accent:var(--it-accent-l); --it-accent-rgb:var(--it-accent-l-rgb);
    --it-hl:var(--it-hl-l); --it-on-accent:var(--it-on-accent-l);
    --it-duo-lo:var(--it-duo-lo-l); --it-duo-hi:var(--it-duo-hi-l);
  }

  /* ── 2026-10 palettes ─────────────────────────────────────────
     Audience verdict on the classic look: dull in the feed, red unreadable.
     Every text pair below is scored in tools/contrast.py (WCAG 2 + APCA);
     body text is ≥ 9:1 everywhere. dark = the slide's default ground,
     light = theme: light, solid = cover_style: red / cta-red posters.
     Secondary text runs at 0.8+ alpha (--it-m*) instead of the old 0.35–0.55
     greys, which measured as low as APCA Lc 34. Photos get a veil in the
     ground's own hue, and go monochrome where sepia fights the palette. */
  .itiha-slide.pal-haldi{
    --it-jet:#0A0A0A; --it-ground:#111111; --it-ground-rgb:17,17,17; --it-raised:#1E1E1E; --it-line:#3A3A3A; --it-muted:#D2CCBE; --it-blank:#111111;
    --it-fg:#FFF8E7; --it-fg-rgb:255,248,231;
    --it-paper:#FFD23F; --it-paper-rgb:255,210,63; --it-on-paper:#0A0A0A; --it-on-paper-rgb:10,10,10; --it-paper-ink:#0A0A0A;
    --it-paper-line:#0A0A0A; --it-paper-raised:#FFE07A;
    --it-accent-d:#FFD23F; --it-accent-d-rgb:255,210,63; --it-hl-d:#FFD23F; --it-on-accent-d:#0A0A0A;
    --it-accent-l:#0A0A0A; --it-accent-l-rgb:10,10,10; --it-hl-l:#1F2AD1; --it-on-accent-l:#FFD23F;
    --it-solid:#FFD23F; --it-on-solid:#0A0A0A; --it-on-solid-rgb:10,10,10; --it-solid-accent:#1F2AD1;
    --it-veil-rgb:17,17,17; --it-photo-filter:none;
    --it-duo-lo-d:#111111; --it-duo-hi-d:#FFD23F; --it-duo-lo-l:#0A0A0A; --it-duo-hi-l:#FFD23F;
    --it-sd1:#FFD23F; --it-sd2:#FFF8E7; --it-sd3:#8C8C8C; --it-sd4:#B8921C; --it-sd5:#4A4A4A; --it-sd6:#FFE89A;
    --it-sl1:#0A0A0A; --it-sl2:#1F2AD1; --it-sl3:#FFF8E7; --it-sl4:#7A5F00; --it-sl5:#5A5A5A; --it-sl6:#9AA0F0;
  }
  .itiha-slide.pal-neel{
    --it-jet:#1A1AB0; --it-ground:#2323D6; --it-ground-rgb:35,35,214; --it-raised:#3434E4; --it-line:#5B5BEA; --it-muted:#DADAF8; --it-blank:#2323D6;
    --it-fg:#FFFFFF; --it-fg-rgb:255,255,255;
    --it-paper:#FFC2E2; --it-paper-rgb:255,194,226; --it-on-paper:#14105A; --it-on-paper-rgb:20,16,90; --it-paper-ink:#14105A;
    --it-paper-line:#14105A; --it-paper-raised:#FFD9EC;
    --it-accent-d:#FFF04D; --it-accent-d-rgb:255,240,77; --it-hl-d:#FFF04D; --it-on-accent-d:#14105A;
    --it-accent-l:#2323D6; --it-accent-l-rgb:35,35,214; --it-hl-l:#2323D6; --it-on-accent-l:#FFFFFF;
    --it-solid:#FFF04D; --it-on-solid:#14105A; --it-on-solid-rgb:20,16,90; --it-solid-accent:#2323D6;
    --it-veil-rgb:20,16,120; --it-photo-filter:none;
    --it-duo-lo-d:#120F5C; --it-duo-hi-d:#FFF04D; --it-duo-lo-l:#2323D6; --it-duo-hi-l:#FFC2E2;
    --it-sd1:#FFF04D; --it-sd2:#FFFFFF; --it-sd3:#FFC2E2; --it-sd4:#14105A; --it-sd5:#9C9CF2; --it-sd6:#BDB000;
    --it-sl1:#2323D6; --it-sl2:#14105A; --it-sl3:#FFFFFF; --it-sl4:#8A8AEE; --it-sl5:#C2185B; --it-sl6:#5A5A9A;
  }

  /* ── 2026-10 chrome (it-v2: every palette except classic) ──────
     Drops the tells the reference audit traced to the generic AI look:
     tracked-out caps labels, the hairline dash over every headline, 35–55%
     grey metadata. In their place one owned mark: the folio becomes a solid
     tab in the accent colour, flush to the left edge. */
  .itiha-slide.it-v2{--it-m35:0.6; --it-m40:0.72; --it-m55:0.82; --it-m75:0.92;
    --it-lbl-min:24px; --it-lbl-track:0.01em; --it-lbl-case:none;
    /* no accent bars beside quotes (a named AI tell); solid 4px rules, not
       hairlines; list item titles at headline scale; no monospace labels */
    --it-bar:0 solid transparent; --it-bar-k:0; --it-rule-w:4px; --it-item-k:1.4;
    --it-mono:'Schibsted Grotesk', system-ui, sans-serif}
  .itiha-slide.it-v2.light{--it-muted:rgba(var(--it-on-paper-rgb),0.82)}
  .itiha-slide.it-v2 .itiha-divider{display:none}
  .itiha-slide.it-v2 .itiha-sub{letter-spacing:0;text-transform:none;font-weight:700;font-size:26px;line-height:1.3;color:rgba(var(--it-fg-rgb),0.88)}
  .itiha-slide.it-v2.light .itiha-sub{color:rgba(var(--it-on-paper-rgb),0.88)}
  .itiha-slide.it-v2 .itiha-meta{letter-spacing:0.01em;text-transform:none;font-weight:700;font-size:21px;color:var(--it-muted)}
  .itiha-slide.it-v2.light .itiha-meta{color:rgba(var(--it-on-paper-rgb),0.82)}
  .itiha-slide.it-v2 .itiha-eyebrow{letter-spacing:0;text-transform:none;font-weight:800;font-size:26px}
  .itiha-slide.it-v2 .itiha-page{left:0;bottom:44px;padding:12px 24px 12px 56px;background:var(--it-accent);
    color:var(--it-on-accent)!important;font-weight:800;font-size:21px;letter-spacing:0.01em;line-height:1;text-transform:none}
  /* Headline *accent* words. "Accent one word in a contrasting colour" is
     itself a named AI-template tell, so v2 marks the word typographically:
     same ink, Anek's 110% cut against the 75% headline — condensed and
     expanded in one line, the way a poster is set by hand. */
  .itiha-slide.it-v2 .itiha-h1 .accent{font-stretch:110%;letter-spacing:-0.015em;color:inherit!important}
  .itiha-slide.it-v2.cover-red .itiha-page{background:var(--it-on-solid);color:var(--it-solid)!important}
  .itiha-slide.it-v2 .itiha-stamp{font-size:32px;letter-spacing:0;bottom:44px;font-weight:var(--it-h-weight);font-stretch:var(--it-h-stretch)}
  .itiha-slide .it-photo{filter:var(--it-photo-filter, none)}
  /* Haldi's yellow page muddies colour photos under its light veil, so only
     there they go monochrome; on the ink ground they stay in colour (user,
     2026-10-27: "use colors"). */
  .itiha-slide.pal-haldi.light{--it-photo-filter:grayscale(1) contrast(1.12)}

  /* ── 2026-10 type: Anek Latin (Ek Type, Mumbai) condensed 800 for display,
     Schibsted Grotesk (cut for a news group) for reading; quotes take its
     italic. --it-hs rescales every display size authored against Bebas. */
  .itiha-slide.it-v2{
    --it-display:'Anek Latin', 'Bebas Neue', sans-serif; --it-heavy:'Anek Latin', sans-serif;
    --it-text:'Schibsted Grotesk', system-ui, sans-serif; --it-quote:'Schibsted Grotesk', system-ui, sans-serif;
    --it-h-case:none; --it-h-lh:0.9; --it-h-track:-0.015em; --it-h-weight:800; --it-h-stretch:75%; --it-hs:0.92;
  }
`;

// A slide's own `theme` wins, then the deck's (tweaks.theme — the editor's
// Light / Dark switch), then the palette's signature ground: haldi opens on
// its yellow page, neel on its ultramarine (the "dark" ground, white text).
const PALETTE_GROUND = { haldi: 'light' };
function slideTheme(slide, tw) {
  return (slide && slide.theme) || (tw && tw.theme) || PALETTE_GROUND[deckPalette(tw)] || 'dark';
}

// 2026-10 A/B: neel vs haldi, each in light and dark. Decks that set nothing
// get the house palette. Old decks pin the 2026 look with `palette: classic`
// (ink / parchment / Sindoor, Bebas + DM Sans, pixel-identical). Deprecating
// the losing palette = delete its LOOK_CSS block and its editor button.
const HOUSE_PALETTE = 'neel';
function deckPalette(tw) {
  return (tw && tw.palette) || HOUSE_PALETTE;
}

// Deck look → slide-root classes. Called by themeFor() and by the layouts that
// paint their own ground without it, so every slide carries the look.
function lookClass(tw) {
  const pal = deckPalette(tw);
  return pal === 'classic' ? '' : `pal-${pal} it-v2`;
}
function useLook() {
  return lookClass((typeof React !== 'undefined' && React.useContext) ? React.useContext(BrandContext) : null);
}

// One-time global CSS for the slide world (separate from design-canvas chrome)
if (typeof document !== 'undefined' && !document.getElementById('itiha-slide-styles')) {
  const s = document.createElement('style');
  s.id = 'itiha-slide-styles';
  s.textContent = LOOK_CSS + `
    .itiha-slide{position:relative;width:var(--slide-width,1080px);height:var(--slide-height,1350px);overflow:hidden;color:${ITIHA.fg};font-family:${ITIHA.text};-webkit-font-smoothing:antialiased}
    /* Type overlays must not block drops onto the image-slot underneath. */
    .itiha-slide > div[style*="position: absolute"]:not(:first-child){pointer-events:none}
    .itiha-slide image-slot{pointer-events:auto}
    .itiha-slide *{box-sizing:border-box}
    .itiha-stamp{position:absolute;right:56px;bottom:48px;font-family:${ITIHA.display};font-size:24px;letter-spacing:2px;line-height:1;display:flex;align-items:baseline;gap:0}
    .itiha-stamp .w{color:var(--stamp-fg,${ITIHA.fg})}
    .itiha-stamp .d{color:${ITIHA.accent};margin-left:1px}
    .itiha-page{position:absolute;left:56px;bottom:48px;font-family:${ITIHA.text};font-weight:600;font-size:16px;letter-spacing:4px;color:${ITIHA.muted};text-transform:uppercase}
    .itiha-eyebrow{font-family:${ITIHA.text};font-weight:600;font-size:14px;letter-spacing:5px;color:${ITIHA.accent};text-transform:uppercase}
    .itiha-divider{display:block;width:48px;height:3px;background:${ITIHA.accent};border:0}
    .itiha-h1{font-family:${ITIHA.display};color:${ITIHA.fg};line-height:var(--it-h-lh);letter-spacing:var(--it-h-track);margin:0;text-transform:var(--it-h-case);font-weight:var(--it-h-weight);font-stretch:var(--it-h-stretch)}
    .itiha-h1 .accent{color:${ITIHA.accent}}
    .itiha-sub{font-family:${ITIHA.text};font-weight:600;font-size:15px;letter-spacing:4px;text-transform:uppercase;color:${ITIHA.rgba("fg",0.55)}}
    .itiha-body{font-family:${ITIHA.text};font-weight:400;font-size:28px;line-height:1.6;color:${ITIHA.fg};text-wrap:pretty}
    .itiha-body.light{color:${ITIHA.onPaper}}
    .itiha-body .key{color:${ITIHA.accent};font-weight:500}
    /* ── Emphasis v2 (A/B, tweaks.emphasisV2) ──────────────────────
       Sindoor #C0392B is ~3.5:1 on ink — below the 4.5:1 body-text floor —
       so red running text goes muddy on dark. v2: headline accents lift to a
       brighter vermilion on dark (same hue family, ~6:1); body [keys] keep
       full-contrast parchment/ink and carry the red as a thick underline
       instead of colored text. Graphic red (dividers, eyebrows, numerals)
       is untouched. */
    .itiha-slide.em-v2 .itiha-h1 .accent{color:${ITIHA.hl}}
    .itiha-slide.em-v2.light .itiha-h1 .accent{color:${ITIHA.hl}}
    .itiha-slide.em-v2 .itiha-body .key{color:inherit;font-weight:700;text-decoration:underline;text-decoration-color:${ITIHA.hl};text-decoration-thickness:3.5px;text-underline-offset:7px}
    .itiha-slide.em-v2.light .itiha-body .key{text-decoration-color:${ITIHA.hl}}
    /* Sindoor cover (cover_style: red, 2026-10-04) — a break from the dark
       look for feed fatigue. White on Sindoor ≈ 5.5:1, ink accents ≈ 3.5:1
       (headline-size only). Red graphic marks flip to ink. */
    .itiha-slide.cover-red .itiha-h1{color:${ITIHA.onSolid}}
    .itiha-slide.cover-red .itiha-h1 .accent,.itiha-slide.cover-red.em-v2 .itiha-h1 .accent{color:${ITIHA.solidAccent}}
    .itiha-slide.cover-red .itiha-sub{color:${ITIHA.onSolid};font-size:24px;letter-spacing:1.5px;line-height:1.45}
    .itiha-slide.cover-red .itiha-meta{color:${ITIHA.rgba("onSolid",0.85)}!important}
    .itiha-slide.cover-red .itiha-page{color:${ITIHA.rgba("onSolid",0.85)}!important}
    .itiha-slide.cover-red .itiha-stamp .w{color:${ITIHA.onSolid}!important}
    .itiha-slide.cover-red .itiha-stamp .d{color:${ITIHA.solidAccent}}
    .itiha-meta{font-family:${ITIHA.text};font-weight:500;font-size:15px;letter-spacing:2.4px;text-transform:uppercase;color:${ITIHA.muted}}
    .itiha-pull{font-family:${ITIHA.quote};font-style:italic;font-size:64px;line-height:1.28;color:${ITIHA.fg};letter-spacing:0}
    /* Light-theme per-slide overrides: triggered by .itiha-slide.light */
    .itiha-slide.light{color:${ITIHA.onPaper}}
    .itiha-slide.light .itiha-h1{color:${ITIHA.paperInk}}
    .itiha-slide.light .itiha-body{color:${ITIHA.onPaper}}
    .itiha-slide.light .itiha-pull{color:${ITIHA.paperInk}}
    .itiha-slide.light .itiha-sub{color:${ITIHA.rgba("onPaper",0.6)}}
    .itiha-slide.light .itiha-meta{color:${ITIHA.rgba("onPaper",0.55)}}
    .itiha-slide.light .itiha-page{color:${ITIHA.rgba("onPaper",0.6)}}
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
    /* No z-index: a texture is painted in DOM order, so it lands on the image
       and veil (rendered before it) and UNDER the text blocks every layout
       renders after it. z-index:2 used to lift it over the type, which made
       the grid in particular unreadable (user report, 2026-10-24). */
    .itiha-tex{position:absolute;inset:0;pointer-events:none}
    .itiha-texfile{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen}
    .light .itiha-texfile{mix-blend-mode:multiply}
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
    /* Minimal drafting grid: fine lines, a stronger line every fourth module
       so it reads as structure rather than graph paper. Alphas are baked into
       the line colours (no layer opacity) and kept low enough that body text
       over it keeps its contrast. Light theme flips to the paper's ink. */
    .itiha-tex--grid{
      background-image:
        linear-gradient(rgba(var(--it-fg-rgb),0.16) 2px, transparent 2px),
        linear-gradient(90deg, rgba(var(--it-fg-rgb),0.16) 2px, transparent 2px),
        linear-gradient(rgba(var(--it-fg-rgb),0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(var(--it-fg-rgb),0.07) 1px, transparent 1px);
      background-size:240px 240px,240px 240px,60px 60px,60px 60px}
    .light .itiha-tex--grid{
      background-image:
        linear-gradient(rgba(var(--it-on-paper-rgb),0.14) 2px, transparent 2px),
        linear-gradient(90deg, rgba(var(--it-on-paper-rgb),0.14) 2px, transparent 2px),
        linear-gradient(rgba(var(--it-on-paper-rgb),0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(var(--it-on-paper-rgb),0.06) 1px, transparent 1px);
      background-size:240px 240px,240px 240px,60px 60px,60px 60px}
    .itiha-tex--vignette{opacity:1;
      background:radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 100%)}
    /* ── Text alignment ────────────────────────────────────────────
       alignBlock() stamps data-align-x on a text block; these rules fix up
       the children that text-align alone can't move: the divider rule (a
       fixed-width <hr>) and any max-width-constrained body paragraph. */
    [data-align-x="left"]   > .itiha-divider{margin-left:0;margin-right:auto}
    [data-align-x="center"] > .itiha-divider{margin-left:auto;margin-right:auto}
    [data-align-x="right"]  > .itiha-divider{margin-left:auto;margin-right:0}
    [data-align-x="left"]   .itiha-body{margin-left:0;margin-right:auto}
    [data-align-x="center"] .itiha-body{margin-left:auto;margin-right:auto}
    [data-align-x="right"]  .itiha-body{margin-left:auto;margin-right:0}
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
  // tweaks.footer: 'page' (01 / 09) or 'site' (itiha.info) — the series label
  // is appended either way; showPageNum still hides the whole footer.
  const site = (t && t.footer === 'site') ? ((t.footerSite || '').trim() || 'itiha.info') : null;
  const lead = site || `${String(n).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
  return (
    <div className="itiha-page" style={color ? { color } : undefined}>
      {lead}{lbl ? ` · ${lbl}` : ''}
    </div>
  );
}

function Eyebrow({ children, color, style }) {
  return <div className="itiha-eyebrow" style={{ ...(color ? { color } : null), ...style }}>{children}</div>;
}

function Divider({ width = 48, color = ITIHA.accent, style }) {
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
      border: `1px solid ${dark ? ITIHA.line : '#C9BB9D'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>
      <div style={{
        fontFamily: mono ? ITIHA.mono : ITIHA.text,
        fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase',
        color: dark ? 'rgba(232,220,200,0.85)' : 'rgba(26,26,26,0.7)',
        background: dark ? 'rgba(0,0,0,0.55)' : 'rgba(250,245,238,0.85)',
        padding: '8px 14px', border: `1px solid ${dark ? ITIHA.line : '#C9BB9D'}`,
        maxWidth: '80%', textAlign: 'center', lineHeight: 1.5,
      }}>{note}</div>
    </div>
  );
}

// Readability veil over full-bleed photos. Text blocks on Itiha slides sit
// between ~30% and ~85% of the height, so the ramp reaches full strength by
// 48% and only the top sixth stays light enough to show the photo. The old
// curve (0.45·o at 38%) left headlines on bright photos at ~1.5:1 contrast;
// this one holds ≥4:1 against parchment at the default o = 0.75 (measured
// 2026-10-02 on the ramananda-tirtha-hyderabad photos, 95th-pct background).
function veilGradient(veil, o) {
  return `linear-gradient(180deg, rgba(${veil},${o * 0.55}) 0%, rgba(${veil},${o * 0.45}) 15%, rgba(${veil},${o * 0.85}) 30%, rgba(${veil},${o}) 48%, rgba(${veil},${Math.min(o + 0.2, 0.95)}) 100%)`;
}

// A full-bleed image-slot with cinematic dark overlay for Variation A.
// `id` must be unique per slide so the drop persists.
function FullBleedSlot({ id, placeholder, overlay, vignette = true, bw = false }) {
  const t = (typeof React !== 'undefined' && React.useContext) ? React.useContext(BrandContext) : null;
  const o = overlay != null ? overlay : ((t && t.overlayDarkness != null) ? t.overlayDarkness / 100 : 0.75);
  const filter = bw ? 'grayscale(1) contrast(1.08)' : undefined;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <image-slot id={id} shape="rect" placeholder={placeholder}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter }}></image-slot>
      <div style={{
        position: 'absolute', inset: 0,
        background: veilGradient('var(--it-veil-rgb)', o),
        pointerEvents: 'none',
      }} />
      {vignette && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, ${ITIHA.rgba('veil', 0.55)} 100%)`,
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

// ── Tweak context ─────────────────────────────────────────────
// Slides read from this so the Tweaks panel can drive their chrome.
const BrandContext = React.createContext({
  showChapterLabels: false,
  showStamp: true,
  showPageNum: true,
  overlayDarkness: 75,
  accentRed: true,
});
function useItiha() { return React.useContext(BrandContext); }

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
const _DUO_LAYERS = [
  { background: 'var(--it-duo-hi)', blend: 'multiply' },
  { background: 'var(--it-duo-lo)', blend: 'lighten' },
];
const _IMAGE_FILTERS = {
  '':                  null,
  bw:                  { css: 'grayscale(1) contrast(1.08)' },
  sepia:               { css: 'sepia(1) saturate(1.15) contrast(1.05)' },
  archival:            { css: 'sepia(0.72) saturate(0.85) contrast(0.95) brightness(0.95)' },
  warm:                { css: 'sepia(0.3) saturate(1.2) hue-rotate(-8deg) contrast(1.05)' },
  cool:                { css: 'saturate(0.7) hue-rotate(160deg) contrast(1.1) brightness(0.95)' },
  'duotone-red':       { css: 'grayscale(1) contrast(1.25) brightness(0.85)', overlay: ITIHA.rgba('accent', 0.55), blend: 'multiply' },
  'duotone-parchment': { css: 'grayscale(1) contrast(1.1) brightness(1.05)',  overlay: ITIHA.rgba('fg', 0.5), blend: 'multiply' },
  'duotone-ink':       { css: 'grayscale(1) contrast(1.3) brightness(0.65)',  overlay: 'rgba(13,13,13,0.45)',   blend: 'multiply' },
  // Two-ink print in the deck's palette (2026-10): grey photo × light ink
  // (multiply sends white → light ink), then lighten with the dark ink
  // (black → dark ink). --it-duo-lo/-hi swap with the slide's theme.
  duotone:             { css: 'grayscale(1) contrast(1.15)', layers: _DUO_LAYERS },
  // Same two inks over a real dot screen: the blurred photo is multiplied by
  // a radial-dot grid and a contrast(20) wrapper thresholds the result, so
  // darker areas print as bigger dots — newspaper halftone, done in CSS.
  halftone:            { halftone: true, layers: _DUO_LAYERS },
};

// Resolve which filter to apply given the slide's `image_filter` (new) and
// `image_bw` (legacy boolean). Filter wins if set; otherwise bw maps to "bw".
function _resolveImageFilter(filterKey, bw) {
  const key = filterKey || (bw ? 'bw' : '');
  return _IMAGE_FILTERS[key] || null;
}

// URL-based image layer (YAML-driven mode). Uses an <img> sized to "cover"
// so headless renderers wait on real network/decode events.
function ImageLayer({ url, bw, filter, overlay, position = 'center', zoom, vignette = true, light = false }) {
  const t = useItiha();
  const o = overlay != null ? overlay : ((t && t.overlayDarkness != null) ? t.overlayDarkness / 100 : 0.75);
  if (!url) {
    return <div style={{ position: 'absolute', inset: 0, background: light ? ITIHA.paper : 'var(--it-blank)' }} />;
  }
  const fx = _resolveImageFilter(filter, bw);
  const cssFilter = fx ? fx.css : undefined;
  // Bare filenames or "_cache/<name>" → served under /images/. URLs pass through.
  const isUrl = url.startsWith('http://') || url.startsWith('https://');
  const src = isUrl ? url : `images/${url}`;
  // Dark theme: dark gradient veil (keeps parchment text readable).
  // Light theme: off-white veil (keeps near-black text readable on photos).
  const veil = light ? 'var(--it-paper-rgb)' : 'var(--it-veil-rgb)';
  const vignetteRgba = light ? ITIHA.rgba('paper', 0.55) : ITIHA.rgba('veil', 0.55);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* `object-position` can only shift an image along an axis where it
          actually OVERFLOWS. A landscape photo cover-fitted into this portrait
          slide overflows horizontally only, so the Y half of image_position is
          inert — it has nothing to slide against. image_zoom scales the layer
          past `cover` so there IS vertical overflow, and transform-origin
          (driven by the same image_position) becomes the vertical pan: the
          point you picked stays put while the rest grows around it.
          zoom unset/1 → byte-identical to the old behaviour. */}
      {fx && fx.halftone ? (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff', filter: 'contrast(20)' }}>
          <img src={src} style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: position,
            filter: 'grayscale(1) brightness(1.25) contrast(1.15) blur(2.5px)',
            ...(Number(zoom) > 1 ? { transform: `scale(${Number(zoom)})`, transformOrigin: position } : null),
          }} />
          <div style={{
            position: 'absolute', inset: '-50%', mixBlendMode: 'multiply', transform: 'rotate(-18deg)',
            backgroundImage: 'radial-gradient(circle at center, #000 0, #fff 72%)', backgroundSize: '11px 11px',
          }} />
        </div>
      ) : (
        <img src={src} className="it-photo" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: position, filter: cssFilter,
          ...(Number(zoom) > 1
            ? { transform: `scale(${Number(zoom)})`, transformOrigin: position }
            : null),
        }} />
      )}
      {fx && (fx.layers || (fx.overlay ? [{ background: fx.overlay, blend: fx.blend }] : [])).map((l, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: l.background, mixBlendMode: l.blend || 'multiply',
        }} />
      ))}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: veilGradient(veil, o),
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
// Procedural: grain · noise · scanlines · paper · halftone · vignette · grid.
// Scan layers: file:<name>[:opacity%][:blend] — <name> resolves to
// shared/brands/itiha/textures/ unless it starts with images/ (this design's
// folder), brands/ (any pack, e.g. brands/vaq-hq/textures/…) or http(s).
// Default blend comes from CSS: screen on dark slides (scans lift the black),
// multiply on light (they sink into the parchment); a :blend suffix overrides.
// Resolution order: slide texture → tweaks.textureLight/textureDark by theme
// → tweaks.texture. `none` opts a slide out of the deck default.
// `house` = the curated Itiha stock per theme (2026-08-30):
const ITIHA_HOUSE = {
  dark:  'grain, file:Texturelabs_Film_197M.jpg:20:screen',
  light: 'file:Texturelabs_Paper_290L.jpg:15',
};
function TextureOverlay({ texture, slide, above }) {
  const tw = (typeof React !== 'undefined' && React.useContext) ? React.useContext(BrandContext) : null;
  const isLight = slideTheme(slide, tw) === 'light';
  let value = texture;
  if (!value && tw) value = (isLight ? tw.textureLight : tw.textureDark) || tw.texture;
  // 2026-10 looks print on stock by default: flat brights read as a web
  // template, the house scans make them read as paper. Classic stays bare.
  if (!value && deckPalette(tw) !== 'classic') value = 'house';
  if (!value || value === 'none') return null;
  if (value === 'house') value = isLight ? ITIHA_HOUSE.light : ITIHA_HOUSE.dark;
  const names = String(value).split(',').map(s => s.trim()).filter(Boolean);
  // `above` keeps the old over-everything stacking for the comic page, where
  // the paper is meant to print over the inked art and lettering.
  const lift = above ? { zIndex: 2 } : undefined;
  return (
    <>
      {names.map((n, i) => {
        if (n.startsWith('file:')) {
          const m = n.slice(5).match(/^(.*?)(?::(\d{1,3}))?(?::([a-z-]+))?$/);
          const file = m ? m[1] : n.slice(5);
          const op = m && m[2] ? Math.min(100, parseInt(m[2], 10)) / 100 : 0.5;
          const blend = m && m[3];
          const src = /^https?:/.test(file) || file.startsWith('images/') || file.startsWith('brands/')
            ? file : `brands/itiha/textures/${file}`;
          return <div key={i} className="itiha-tex itiha-texfile" style={{
            backgroundImage: `url(${src})`, backgroundSize: 'cover',
            opacity: op, ...(blend ? { mixBlendMode: blend } : null), ...lift,
          }} />;
        }
        return <div key={i} className={`itiha-tex itiha-tex--${n}`} style={lift} />;
      })}
    </>
  );
}

// Per-slide theme tokens. Layouts read `themeFor(slide)` and use the returned
// colors / className. Default is dark (the existing palette). `theme: light`
// flips bg→off-white, text→near-black; CSS overrides above handle class-driven
// elements (.itiha-h1, .itiha-body, .itiha-sub, .itiha-meta, .itiha-pull, .itiha-page).
function themeFor(slide) {
  // Reads the tweak context (always called unconditionally at the top of a
  // layout component, so the hook rules hold). emphasisV2 is the A/B flag for
  // the 2026-08-01 red-legibility experiment — it only appends a CSS class.
  const tw = (typeof React !== 'undefined' && React.useContext) ? React.useContext(BrandContext) : null;
  // emphasisV2 won its A/B and is the DEFAULT since 2026-08-30 — only an
  // explicit `emphasisV2: false` in tweaks restores treatment A (red body text).
  const em = (!tw || tw.emphasisV2 !== false) ? ' em-v2' : '';
  const look = lookClass(tw);
  const isLight = slideTheme(slide, tw) === 'light';
  if (isLight) {
    return {
      isLight: true,
      className: ['light' + em, look].filter(Boolean).join(' '),
      bg: ITIHA.paper,
      fg: ITIHA.onPaper,
      h1: ITIHA.paperInk,
      stampFg: ITIHA.paperInk,
      pageNumColor: ITIHA.rgba('onPaper', 0.6),
      divider: 'var(--it-paper-line)',
      muted55: ITIHA.rgba('onPaper', 'var(--it-m55)'),
      muted40: ITIHA.rgba('onPaper', 'max(var(--it-m40), 0.45)'),
      muted75: ITIHA.rgba('onPaper', 'max(var(--it-m75), 0.8)'),
      muted35: ITIHA.rgba('onPaper', 'var(--it-m35)'),
      handleDot: ITIHA.accent,
    };
  }
  return {
    isLight: false,
    className: [em.trim(), look].filter(Boolean).join(' '),
    bg: ITIHA.ground,
    fg: ITIHA.fg,
    h1: ITIHA.fg,
    stampFg: ITIHA.fg,
    pageNumColor: undefined,                // CSS default (mid-gray)
    divider: ITIHA.line,
    muted55: ITIHA.rgba('fg', 'var(--it-m55)'),
    muted40: ITIHA.rgba('fg', 'var(--it-m40)'),
    muted75: ITIHA.rgba('fg', 'var(--it-m75)'),
    muted35: ITIHA.rgba('fg', 'var(--it-m35)'),
    handleDot: ITIHA.accent,
  };
}

// ── Text alignment ────────────────────────────────────────────
// Two per-slide knobs, both optional:
//   align_x: left | center | right   — horizontal, always safe to apply
//   align_y: top  | middle | bottom  — vertical, OPT-IN
//
// align_y is deliberately opt-in. Every layout below was composed against
// hand-tuned absolute offsets (headline at top:360, body at bottom:200, …).
// When align_y is unset, alignBlock returns the caller's legacy geometry
// untouched, so existing designs render pixel-identically. Only when the
// author picks a value do we re-anchor the block. Combining the two knobs
// gives the full nine-way grid (top-left … bottom-right).

// "Unset" and "explicitly left" are NOT the same thing, and the difference
// matters. `.itiha-divider` is an <hr>, and the UA stylesheet gives <hr>
// `margin-inline: auto` — which the brand CSS never reset, so that rule has
// always rendered dead-centre above a left-ranged headline on every existing
// slide. Honouring align_x: left properly means ranging it left, which would
// visibly move the rule on every design already in the repo. So: unset emits
// no attribute and inherits the legacy quirk (existing designs untouched),
// while an explicit "left" opts into coherent behaviour.
const _AX_FLEX = { left: 'flex-start', center: 'center', right: 'flex-end' };

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
//   legacy — the block's existing absolute-position style object.
//   opts.top / opts.bottom — insets used when align_y re-anchors the block.
//     Default to the 110/140 gutter most carousel layouts already use.
//   opts.stretch — pass true for blocks whose legacy style sets BOTH top and
//     bottom (grids that fill the gap). Those keep their height and only take
//     the horizontal treatment, since re-anchoring would collapse the box.
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
    // Carry over the layout-specific display/grid/gap bits, but drop the
    // legacy vertical anchors so they can't fight the new one.
    const { top: _t, bottom: _b, transform: _tr, position: _p, left: _l, right: _r, ...rest } = legacy;
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

Object.assign(window, { ITIHA, lookClass, useLook, slideTheme, deckPalette, Stamp, PageNum, Eyebrow, Divider, StripedPlaceholder, FullBleedSlot, ImageLayer, BrandContext, useItiha, ChapterEyebrow, MaybeStamp, MaybePageNum, themeFor, TextureOverlay, alignFor, alignBlock });
