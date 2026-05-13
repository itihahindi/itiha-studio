// Layout library for YAML-driven carousels.
// Each layout component takes a normalized `slide` object from content.json
// and the slide `index`. Layouts are registered into window.LAYOUTS keyed by name.

// ── Inline text micro-syntax ────────────────────────────────────
// Headlines (Bebas Neue, large):
//   "Old *Chain.*"     →  "Old " + <span class="accent">Chain.</span>     (Sindoor Red)
// Body (DM Sans):
//   "[Mauritius]"      →  <span class="key">Mauritius</span>              (Sindoor Red, weight 500)
//   "_kuli_"           →  <em>kuli</em>                                   (italic)
//   "**bold**"         →  <strong>bold</strong>
// Use newlines in YAML block scalars to break lines; rendered as <br/>.

function _splitLines(text) {
  return String(text == null ? '' : text).split('\n');
}

function renderHeadline(text) {
  const lines = _splitLines(text);
  const out = [];
  lines.forEach((line, li) => {
    const segments = [];
    let last = 0;
    const re = /\*([^*]+)\*/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) segments.push(line.slice(last, m.index));
      segments.push(<span key={`a-${li}-${m.index}`} className="accent">{m[1]}</span>);
      last = m.index + m[0].length;
    }
    if (last < line.length) segments.push(line.slice(last));
    out.push(<React.Fragment key={`l-${li}`}>{segments}</React.Fragment>);
    if (li < lines.length - 1) out.push(<br key={`br-${li}`} />);
  });
  return out;
}

function renderBody(text) {
  if (text == null) return null;
  // Body text uses Markdown-ish wrapping rules: single newlines fold to spaces
  // (natural wrap), double newlines (\n\n) are paragraph breaks.
  const paragraphs = String(text).split(/\n\s*\n/);
  const renderInline = (s, pi) => {
    const folded = s.replace(/\s*\n\s*/g, ' ').trim();
    const tokens = [];
    const re = /(\*\*[^*]+\*\*)|(\[[^\]]+\])|(_[^_]+_)/g;
    let last = 0, m;
    while ((m = re.exec(folded)) !== null) {
      if (m.index > last) tokens.push(folded.slice(last, m.index));
      if (m[1]) tokens.push(<strong key={`s-${pi}-${m.index}`}>{m[1].slice(2, -2)}</strong>);
      else if (m[2]) tokens.push(<span key={`k-${pi}-${m.index}`} className="key">{m[2].slice(1, -1)}</span>);
      else if (m[3]) tokens.push(<em key={`i-${pi}-${m.index}`} style={{ fontStyle: 'italic' }}>{m[3].slice(1, -1)}</em>);
      last = m.index + m[0].length;
    }
    if (last < folded.length) tokens.push(folded.slice(last));
    return tokens;
  };
  const out = [];
  paragraphs.forEach((para, pi) => {
    out.push(<React.Fragment key={`bp-${pi}`}>{renderInline(para, pi)}</React.Fragment>);
    if (pi < paragraphs.length - 1) {
      out.push(<br key={`bpa-${pi}`} />);
      out.push(<br key={`bpb-${pi}`} />);
    }
  });
  return out;
}

function Headline({ text, size = 132, style }) {
  return <h1 className="itiha-h1" style={{ fontSize: size, ...style }}>{renderHeadline(text)}</h1>;
}

function Body({ text, size = 28, maxWidth = 880, style, className }) {
  return (
    <p className={`itiha-body${className ? ' ' + className : ''}`} style={{ fontSize: size, maxWidth, ...style }}>
      {renderBody(text)}
    </p>
  );
}

// ── Layout components ───────────────────────────────────────────

function Cover({ slide, index }) {
  const { eyebrow, eyebrow_meta, headline, subline, swipe_meta,
          image, image_bw, image_overlay, image_position, headline_size,
          headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} overlay={image_overlay} position={image_position} />}
      <TextureOverlay texture={slide.texture} />
      {(eyebrow || eyebrow_meta) && (
        <div style={{ position: 'absolute', left: 72, top: 84, display: 'flex', alignItems: 'center', gap: 18 }}>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {eyebrow && eyebrow_meta && <span style={{ width: 24, height: 1, background: t.muted35 }} />}
          {eyebrow_meta && <span className="itiha-sub" style={{ fontSize: 13 }}>{eyebrow_meta}</span>}
        </div>
      )}
      <div style={{ position: 'absolute', left: 72, top: 360 + headline_offset_y, right: 72 }}>
        <Divider style={{ marginBottom: 56 }} />
        <Headline text={headline} size={headline_size || 188} style={{ textShadow: t.isLight ? 'none' : '0 2px 24px rgba(0,0,0,0.6)' }} />
      </div>
      <div style={{ position: 'absolute', left: 72, bottom: 220, right: 72 }}>
        {subline && <div className="itiha-sub" style={{ marginBottom: 14 }}>{subline}</div>}
        {swipe_meta && <div className="itiha-meta" style={{ color: t.muted40 }}>{swipe_meta}</div>}
      </div>
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Image + a single content block (eyebrow → divider → headline → optional subline → optional body).
// The block can be anchored top / middle / bottom. Image gets a fade-to-black at the bottom by default.
function Story({ slide, index }) {
  const { chapter, headline, subline, body, image, image_bw, image_overlay, image_position,
          headline_size = 120, body_size = 28, block_y = 'bottom', custom_overlay } = slide;
  const t = themeFor(slide);
  // Light theme: fade image to off-white at the text edge instead of black.
  const overlayCss = custom_overlay || (t.isLight
    ? (block_y === 'bottom'
        ? 'linear-gradient(180deg, rgba(250,245,238,0.0) 0%, rgba(250,245,238,0.0) 45%, rgba(250,245,238,0.55) 62%, rgba(250,245,238,0.92) 78%, rgba(250,245,238,1) 100%)'
        : 'linear-gradient(180deg, rgba(250,245,238,0.55) 0%, rgba(250,245,238,0.4) 30%, rgba(250,245,238,0.7) 70%, rgba(250,245,238,0.95) 100%)')
    : (block_y === 'bottom'
        ? 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.0) 28%, rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.55) 62%, rgba(13,13,13,0.92) 78%, rgba(13,13,13,1) 100%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.7) 70%, rgba(13,13,13,0.95) 100%)'));

  const blockStyle = block_y === 'top'
    ? { position: 'absolute', left: 72, top: 130, right: 72 }
    : block_y === 'middle'
      ? { position: 'absolute', left: 72, top: 480, right: 72 }
      : { position: 'absolute', left: 72, bottom: 200, right: 72 };

  return (
    <div className={`itiha-slide ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0} position={image_position} vignette={false} />}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: overlayCss }} />
      <TextureOverlay texture={slide.texture} />
      <div style={blockStyle}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
        {subline && <div className="itiha-sub" style={{ marginTop: 22 }}>{subline}</div>}
        {body && <Body text={body} size={body_size} style={{ marginTop: 30 }} />}
      </div>
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Image full-bleed, headline pinned high (or middle), body pinned low.
function SplitStory({ slide, index }) {
  const { chapter, headline, subline, body, image, image_bw, image_overlay, image_position,
          headline_size = 132, body_size = 28, headline_y = 140, body_y = 200 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} overlay={image_overlay} position={image_position} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: headline_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
        {subline && <div className="itiha-sub" style={{ marginTop: 22 }}>{subline}</div>}
      </div>
      {body && (
        <div style={{ position: 'absolute', left: 72, bottom: body_y, right: 72 }}>
          <Body text={body} size={body_size} />
        </div>
      )}
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Pull-quote layout: headline up top, large quote in middle with red left border, body below.
function Quote({ slide, index }) {
  const { chapter, headline, quote, attribution, body, image, image_bw, image_overlay, image_position,
          headline_size = 124, quote_size = 64, body_size = 26,
          headline_offset_y = 0, body_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} overlay={image_overlay} position={image_position} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 130 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{ position: 'absolute', left: 72, bottom: 200 - body_offset_y, right: 72, display: 'flex', flexDirection: 'column', gap: 40 }}>
        {quote && (
          <div style={{ borderLeft: `3px solid ${ITIHA.red}`, paddingLeft: 28 }}>
            <div className="itiha-pull" style={{ fontSize: quote_size }}>
              {quote.split('\n').map((l, i, a) => <React.Fragment key={i}>{l}{i < a.length - 1 && <br/>}</React.Fragment>)}
            </div>
            {attribution && (
              <div className="itiha-meta" style={{ marginTop: 18, fontSize: 16 }}>
                {attribution}
              </div>
            )}
          </div>
        )}
        {body && <Body text={body} size={body_size} />}
      </div>
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Two-column stat comparison (e.g. "12.5%" vs "Worse.")
function Stat({ slide, index }) {
  const { chapter, headline, stats = [], body, image, image_bw, image_overlay, image_position,
          headline_size = 124, body_size = 26, stat_size = 168,
          headline_offset_y = 0, body_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0.82} position={image_position} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{
        position: 'absolute', left: 72, top: 580, right: 72,
        display: 'grid',
        gridTemplateColumns: stats.length === 2 ? '1fr 1px 1fr' : `repeat(${stats.length}, 1fr)`,
        gap: 48, alignItems: 'start',
      }}>
        {stats.map((s, i) => (
          <React.Fragment key={i}>
            <div>
              {s.label && <div className="itiha-meta">{s.label}</div>}
              <div style={{
                fontFamily: ITIHA.bebas, fontSize: stat_size, lineHeight: 0.9,
                color: s.value_red ? ITIHA.red : t.h1, marginTop: 12,
              }}>
                {s.value && s.value.split('%').length === 2
                  ? <>{s.value.split('%')[0]}<span style={{ color: ITIHA.red }}>%</span></>
                  : s.value}
              </div>
              {s.sublabel && <div className="itiha-meta" style={{ marginTop: 8 }}>{s.sublabel}</div>}
            </div>
            {stats.length === 2 && i === 0 && (
              <div style={{ width: 1, height: 280, background: t.divider }} />
            )}
          </React.Fragment>
        ))}
      </div>
      {body && (
        <div style={{ position: 'absolute', left: 72, bottom: 220 - body_offset_y, right: 72 }}>
          <Body text={body} size={body_size} style={{ color: t.muted75 }} maxWidth={900} />
        </div>
      )}
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// 2×2 grid of (date, text) cells.
function DatesGrid({ slide, index }) {
  const { chapter, headline, items = [], image, image_bw, image_overlay, image_position,
          headline_size = 132, date_size = 52, text_size = 22,
          headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0.84} position={image_position} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{
        position: 'absolute', left: 72, top: 600, right: 72,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, rowGap: 44,
      }}>
        {items.map((it, i) => (
          <div key={i} style={{ borderTop: `1px solid ${t.divider}`, paddingTop: 20 }}>
            <div style={{ fontFamily: ITIHA.bebas, fontSize: date_size, color: ITIHA.red, lineHeight: 1, letterSpacing: 1 }}>{it.date}</div>
            <Body text={it.text} size={text_size} style={{ marginTop: 12, lineHeight: 1.55 }} />
          </div>
        ))}
      </div>
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Closing slide: big headline, horizontal stats row, body, handle line.
function Closing({ slide, index }) {
  const { chapter, headline, stats = [], body, handle, image, image_bw, image_overlay, image_position,
          headline_size = 178, body_size = 26,
          headline_offset_y = 0, body_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0.82} position={image_position} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 140 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      {stats.length > 0 && (
        <div style={{
          position: 'absolute', left: 72, top: 820, right: 72,
          display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 28,
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ borderTop: `1px solid ${t.divider}`, paddingTop: 16 }}>
              <div style={{ fontFamily: ITIHA.bebas, fontSize: 64, color: t.h1, lineHeight: 1 }}>{s.value}</div>
              <div className="itiha-meta" style={{ marginTop: 10 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {body && (
        <div style={{ position: 'absolute', left: 72, bottom: 250 - body_offset_y, right: 72 }}>
          <Body text={body} size={body_size} maxWidth={920} />
        </div>
      )}
      {handle && (
        <div style={{ position: 'absolute', left: 72, bottom: 130, right: 72, display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ width: 8, height: 8, background: ITIHA.red, borderRadius: 0 }} />
          <span className="itiha-sub" style={{ color: t.h1, fontSize: 16 }}>{handle}</span>
        </div>
      )}
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// ─── Templates from the design system bundle ────────────────────
// These map 1:1 to project/templates/ in the ITIHA design system.

// 1080×1080 quote card — dark or light variant. Single quote, red left border.
function QuoteCard({ slide, index }) {
  const { eyebrow, quote, attribution, variant = 'dark',
          image, image_bw, image_overlay, image_position, text_y = 50 } = slide;
  const isLight = variant === 'light';
  const bg = isLight ? ITIHA.offWhite : ITIHA.ink;
  const fg = isLight ? ITIHA.nearBlack : ITIHA.parchment;
  const stampFg = isLight ? ITIHA.ink : ITIHA.parchment;
  return (
    <div className="itiha-slide" style={{ background: bg, color: fg }}>
      {image && <ImageLayer light={isLight} url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0.7} position={image_position} vignette={false} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 96, right: 96, top: `${text_y}%`, transform: 'translateY(-50%)', boxSizing: 'border-box' }}>
        <div style={{ borderLeft: `3px solid ${ITIHA.red}`, paddingLeft: 48 }}>
          {eyebrow && (
            <div style={{
              fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 22,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: ITIHA.red, marginBottom: 40,
            }}>{eyebrow}</div>
          )}
          <div style={{
            fontFamily: ITIHA.sans, fontSize: 48, lineHeight: 1.45,
            fontStyle: 'italic', color: fg,
          }}>
            {quote && renderBody(quote)}
          </div>
          {attribution && (
            <div style={{
              marginTop: 44, fontFamily: ITIHA.sans, fontWeight: 600,
              fontSize: 18, letterSpacing: '0.25em', textTransform: 'uppercase',
              color: ITIHA.midGray, fontStyle: 'normal',
            }}>{attribution}</div>
          )}
        </div>
      </div>
      <Stamp color={stampFg} />
    </div>
  );
}

// 1080×1920 Reel title card. Pure black, centered top-half, optional pill at bottom.
function ReelTitle({ slide, index }) {
  const { eyebrow, headline, subline, pill, handle = '@itiha29',
          image, image_bw, image_overlay, image_position,
          headline_size = 180, text_y = 50 } = slide;
  return (
    <div className="itiha-slide" style={{ background: ITIHA.jet }}>
      {image && <ImageLayer url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0.55} position={image_position} vignette={false} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 96, right: 96, top: `${text_y}%`, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        {eyebrow && (
          <div style={{
            fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 26,
            letterSpacing: '0.35em', textTransform: 'uppercase',
            color: ITIHA.red, marginBottom: 40,
          }}>{eyebrow}</div>
        )}
        <Divider style={{ marginBottom: 48 }} />
        <Headline text={headline} size={headline_size} />
        {subline && (
          <div style={{
            marginTop: 44, fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 28,
            letterSpacing: '0.25em', textTransform: 'uppercase',
            color: 'rgba(232,220,200,0.6)',
          }}>{subline}</div>
        )}
      </div>
      {pill && (
        <div style={{
          position: 'absolute', left: 96, bottom: 480,
          background: 'rgba(0,0,0,0.85)', color: ITIHA.white,
          padding: '14px 28px', borderRadius: 4,
          fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 30,
        }}>{pill}</div>
      )}
      {handle && (
        <div style={{
          position: 'absolute', left: 96, bottom: 80,
          fontFamily: ITIHA.sans, fontWeight: 500, fontSize: 22,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: ITIHA.midGray,
        }}>{handle}</div>
      )}
      <div className="itiha-stamp" style={{ right: 80, bottom: 80, fontSize: 44 }}>
        <span className="w">ITIHA</span><span className="d">.</span>
      </div>
    </div>
  );
}

// 1280×720 YouTube thumbnail. Big headline (Bebas), red eyebrow, parchment subline.
function YoutubeThumbnail({ slide, index }) {
  const { eyebrow, headline, subline, image, image_bw, image_overlay = 0.55,
          image_position, headline_size = 156 } = slide;
  return (
    <div className="itiha-slide" style={{ background: ITIHA.jet }}>
      {image
        ? <ImageLayer url={image} bw={image_bw} overlay={image_overlay} position={image_position} vignette={false} />
        : (
          // Subtle archival "photo placeholder" — radial bronze tones, no gradient on the page itself.
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 80% 50%, #3a1812 0%, transparent 55%),
                         radial-gradient(ellipse at 20% 80%, ${ITIHA.charcoal} 0%, transparent 60%),
                         ${ITIHA.jet}`,
          }} />
        )}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', inset: 0, padding: '120px 144px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 920 }}>
          {eyebrow && (
            <div style={{
              fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 26,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: ITIHA.red, marginBottom: 32,
            }}>{eyebrow}</div>
          )}
          <Headline text={headline} size={headline_size} />
          {subline && (
            <div style={{
              marginTop: 40, fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 28,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'rgba(232,220,200,0.6)',
            }}>{subline}</div>
          )}
        </div>
      </div>
      <div className="itiha-stamp" style={{ right: 72, bottom: 52, fontSize: 56 }}>
        <span className="w">ITIHA</span><span className="d">.</span>
      </div>
    </div>
  );
}

// 1920×1080 video end card — centered wordmark, red underline, tagline, handles.
function EndCard({ slide, index }) {
  const {
    tagline = 'History Simplified',
    handles = [
      { platform: 'YT',  text: '@itiha' },
      { platform: 'IG',  text: '@itiha29' },
      { platform: 'WEB', text: 'itiha.info' },
    ],
    wordmark_size = 280,
    image, image_bw, image_overlay, image_position,
  } = slide;
  return (
    <div className="itiha-slide" style={{
      background: ITIHA.jet, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {image && <ImageLayer url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0.7} position={image_position} vignette={false} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{
        fontFamily: ITIHA.bebas, fontSize: wordmark_size,
        letterSpacing: 0, color: ITIHA.parchment, textTransform: 'uppercase',
        lineHeight: 1, display: 'flex',
      }}>
        ITIHA<span style={{ color: ITIHA.red }}>.</span>
      </div>
      <div style={{ width: 140, height: 4, background: ITIHA.red, margin: '44px 0 36px' }} />
      <div style={{
        fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 22,
        letterSpacing: '0.45em', textTransform: 'uppercase', color: ITIHA.midGray,
      }}>{tagline}</div>
      <div style={{
        marginTop: 80, display: 'flex', gap: 80,
        fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 22,
        letterSpacing: '0.3em', textTransform: 'uppercase', color: ITIHA.parchment,
      }}>
        {handles.map((h, i) => (
          <div key={i}><span style={{ color: ITIHA.red, marginRight: 14 }}>{h.platform}</span>{h.text}</div>
        ))}
      </div>
    </div>
  );
}

// Carousel variant: Off-White interior slide w/ red left border + slide number top-right.
function InteriorLight({ slide, index }) {
  const { num, eyebrow, headline, body, headline_size = 96, body_size = 26,
          image, image_bw, image_overlay, image_position } = slide;
  return (
    <div className="itiha-slide" style={{ background: ITIHA.offWhite, color: ITIHA.nearBlack }}>
      {image && <ImageLayer url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0} position={image_position} vignette={false} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{
        position: 'absolute', top: 56, right: 56,
        fontFamily: ITIHA.bebas, fontSize: 56, color: ITIHA.red, lineHeight: 1,
      }}>{num || String(index + 1).padStart(2, '0')}</div>
      <div style={{
        position: 'absolute', inset: 0, padding: '120px 112px',
        borderLeft: `3px solid ${ITIHA.red}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        {eyebrow && (
          <div style={{
            fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 14,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: ITIHA.red, marginBottom: 32,
          }}>{eyebrow}</div>
        )}
        <h1 className="itiha-h1" style={{ fontSize: headline_size, color: ITIHA.ink, marginBottom: 36 }}>
          {renderHeadline(headline)}
        </h1>
        {body && (
          <p className="itiha-body" style={{ fontSize: body_size, maxWidth: 840, color: ITIHA.nearBlack }}>
            {renderBody(body)}
          </p>
        )}
      </div>
      <MaybePageNum n={index + 1} color={ITIHA.midGray} />
      <div className="itiha-stamp" style={{ right: 56, bottom: 48 }}>
        <span className="w" style={{ color: ITIHA.ink }}>ITIHA</span><span className="d">.</span>
      </div>
    </div>
  );
}

// Carousel variant: solid Sindoor Red CTA — usually the final slide.
function CtaRed({ slide, index }) {
  const { eyebrow = 'Final Slide', headline, cta, headline_size = 130,
          image, image_bw, image_overlay, image_position } = slide;
  return (
    <div className="itiha-slide" style={{ background: ITIHA.red, color: ITIHA.white }}>
      {image && <ImageLayer url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0.85} position={image_position} vignette={false} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{
        position: 'absolute', inset: 0, padding: '120px 96px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        {eyebrow && (
          <div style={{
            fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 22,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: ITIHA.white, opacity: 0.8, marginBottom: 36,
          }}>{eyebrow}</div>
        )}
        <h1 className="itiha-h1" style={{ fontSize: headline_size, color: ITIHA.white }}>
          {renderHeadline(headline)}
        </h1>
        {cta && (
          <div style={{
            marginTop: 56, fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 24,
            letterSpacing: '0.25em', textTransform: 'uppercase', color: ITIHA.white,
          }}>{cta}</div>
        )}
      </div>
      <MaybePageNum n={index + 1} color="rgba(255,255,255,0.7)" />
      <div className="itiha-stamp" style={{ right: 56, bottom: 48 }}>
        <span className="w" style={{ color: ITIHA.white }}>ITIHA</span><span className="d" style={{ color: ITIHA.white }}>.</span>
      </div>
    </div>
  );
}

// ─── Newer layouts: numbered reasons / comparison / hero portrait ─────────────

// Vertical list of 3–5 items with big Bebas numerals. For "N reasons" or
// "N things" slides. Each item has an optional custom `number` (use it to
// pass roman numerals like "i.", "ii.") plus headline + body.
function NumberedList({ slide, index }) {
  const { chapter, headline, items = [],
          image, image_bw, image_overlay, image_position,
          headline_size = 88, item_size = 24, number_size = 80,
          headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {image && <ImageLayer light={t.isLight} url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0.85} position={image_position} vignette={false} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{ position: 'absolute', left: 72, top: 460, right: 72,
                    display: 'flex', flexDirection: 'column', gap: 28 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 28,
                                borderTop: `1px solid ${t.divider}`, paddingTop: 22 }}>
            <div style={{ fontFamily: ITIHA.bebas, fontSize: number_size, color: ITIHA.red,
                          lineHeight: 0.9, flex: '0 0 auto', minWidth: 100, letterSpacing: 1 }}>
              {it.number != null ? String(it.number) : String(i + 1).padStart(2, '0')}
            </div>
            <div style={{ flex: 1 }}>
              {it.headline && (
                <div className="itiha-h1" style={{ fontSize: 38, marginBottom: 10, lineHeight: 1 }}>
                  {renderHeadline(it.headline)}
                </div>
              )}
              {it.body && <Body text={it.body} size={item_size} maxWidth={780} style={{ lineHeight: 1.55 }} />}
            </div>
          </div>
        ))}
      </div>
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Side-by-side two-column comparison. Each column has its own label / heading /
// body. Optional center 1px divider. Made for myth-vs-reality / claim-vs-counter
// argument slides.
function Comparison({ slide, index }) {
  const { chapter, headline,
          left_label, left_headline, left_body,
          right_label, right_headline, right_body,
          image, image_bw, image_overlay, image_position,
          headline_size = 88, sub_size = 38, body_size = 22,
          headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {image && <ImageLayer light={t.isLight} url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0.9} position={image_position} vignette={false} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{
        position: 'absolute', left: 72, top: 540, right: 72, bottom: 200,
        display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 40, alignItems: 'start',
      }}>
        <div>
          {left_label && (
            <div className="itiha-eyebrow" style={{ marginBottom: 18, color: t.muted75 }}>{left_label}</div>
          )}
          {left_headline && (
            <div className="itiha-h1" style={{ fontSize: sub_size, marginBottom: 18, lineHeight: 1.02 }}>
              {renderHeadline(left_headline)}
            </div>
          )}
          {left_body && <Body text={left_body} size={body_size} maxWidth={420} style={{ lineHeight: 1.6 }} />}
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: t.divider }} />
        <div>
          {right_label && (
            <div className="itiha-eyebrow" style={{ marginBottom: 18, color: ITIHA.red }}>{right_label}</div>
          )}
          {right_headline && (
            <div className="itiha-h1" style={{ fontSize: sub_size, marginBottom: 18, lineHeight: 1.02 }}>
              {renderHeadline(right_headline)}
            </div>
          )}
          {right_body && <Body text={right_body} size={body_size} maxWidth={420} style={{ lineHeight: 1.6 }} />}
        </div>
      </div>
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Subject-focused portrait slide. Big name in Bebas, dates, role, optional pull
// quote. Image is rendered on the LEFT half so the type sits in a clean right
// column — best with a bg-removed portrait or one cropped tight to the subject.
function Portrait({ slide, index }) {
  const { chapter, image, image_bw, image_overlay, image_position,
          name, dates, role, quote, attribution,
          name_size = 156, body_size = 24,
          headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide ${t.className}`} style={{ background: t.bg }}>
      <TextureOverlay texture={slide.texture} />
      {image && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', overflow: 'hidden' }}>
          <ImageLayer url={image} bw={image_bw} overlay={image_overlay != null ? image_overlay : 0.15} position={image_position} vignette={false} />
        </div>
      )}
      <div style={{
        position: 'absolute',
        left: image ? '54%' : 72, top: 130 + headline_offset_y, right: 72, bottom: 140,
        display: 'flex', flexDirection: 'column',
      }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        {name && (
          <h1 className="itiha-h1" style={{ fontSize: name_size, marginBottom: 14, lineHeight: 0.92 }}>
            {renderHeadline(name)}
          </h1>
        )}
        {dates && (
          <div className="itiha-sub" style={{ marginBottom: 18, color: ITIHA.red, fontSize: 18, letterSpacing: 3 }}>
            {dates}
          </div>
        )}
        {role && <Body text={role} size={body_size} maxWidth={image ? 460 : 800} style={{ lineHeight: 1.55, marginBottom: 28 }} />}
        {quote && (
          <div style={{ borderLeft: `3px solid ${ITIHA.red}`, paddingLeft: 22, marginTop: 'auto' }}>
            <div className="itiha-pull" style={{ fontSize: 36, lineHeight: 1.1 }}>
              {quote.split('\n').map((l, i, a) => <React.Fragment key={i}>{l}{i < a.length - 1 && <br/>}</React.Fragment>)}
            </div>
            {attribution && (
              <div className="itiha-meta" style={{ marginTop: 14, fontSize: 14 }}>{attribution}</div>
            )}
          </div>
        )}
      </div>
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}


window.LAYOUTS = {
  // Carousel layouts (full-bleed image + type)
  cover: Cover,
  story: Story,
  'split-story': SplitStory,
  quote: Quote,
  stat: Stat,
  'dates-grid': DatesGrid,
  closing: Closing,
  // Argument / structure layouts
  'numbered-list': NumberedList,
  comparison:      Comparison,
  portrait:        Portrait,
  // Carousel variants from the design system templates
  'interior-light': InteriorLight,
  'cta-red': CtaRed,
  // Standalone formats
  'quote-card': QuoteCard,
  'reel-title': ReelTitle,
  'youtube-thumbnail': YoutubeThumbnail,
  'end-card': EndCard,
};
