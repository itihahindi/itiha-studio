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

// SVG pie-wedge path from `startAngle` to `endAngle` (degrees, 0 = 12 o'clock).
function _polarToCartesian(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function _wedgePath(cx, cy, r, startAngle, endAngle) {
  const start = _polarToCartesian(cx, cy, r, endAngle);
  const end = _polarToCartesian(cx, cy, r, startAngle);
  const largeArc = (endAngle - startAngle) <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function Headline({ text, size = 132, style }) {
  return <h1 className="itiha-h1" style={{ fontSize: size, ...style }}>{renderHeadline(text)}</h1>;
}

function Body({ text, size = 28, maxWidth = 880, style, className }) {
  // Line-height tightens as size grows — at body text 45px+, the CSS-class
  // default 1.75 pushes paragraphs off the slide. Stays loose at small sizes
  // where the eye needs the rest.
  const lineHeight = size <= 36 ? 1.7
                   : size <= 48 ? 1.55
                   :              1.4;
  return (
    <p className={`itiha-body${className ? ' ' + className : ''}`} style={{ fontSize: size, lineHeight, maxWidth, ...style }}>
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
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay} position={image_position} />}
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
        <Headline text={headline} size={headline_size || 156} style={{ textShadow: t.isLight ? 'none' : '0 2px 24px rgba(0,0,0,0.6)' }} />
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
          headline_size = 100, body_size = 45, block_y = 'bottom', custom_overlay,
          body_offset_y = 0 } = slide;
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
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0} position={image_position} vignette={false} />}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: overlayCss }} />
      <TextureOverlay texture={slide.texture} />
      <div style={blockStyle}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
        {subline && <div className="itiha-sub" style={{ marginTop: 22 }}>{subline}</div>}
        {body && <Body text={body} size={body_size} style={{ marginTop: 30 + body_offset_y }} />}
      </div>
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Image full-bleed, headline pinned high (or middle), body pinned low.
function SplitStory({ slide, index }) {
  const { chapter, headline, subline, body, image, image_bw, image_overlay, image_position,
          headline_size = 100, body_size = 45, headline_y = 140, body_y = 200 } = slide;
  const t = themeFor(slide);
  const ctx = useItiha();
  // Only show the chapter-eyebrow + divider pair when the eyebrow will
  // actually render — otherwise the divider hangs alone above the headline
  // and reads like a stray coat-lapel detail.
  const showEyebrowBlock = !!chapter && !!ctx.showChapterLabels;
  return (
    <div className={`itiha-slide ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay} position={image_position} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: headline_y, right: 72 }}>
        {showEyebrowBlock && (
          <>
            <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>
            <Divider style={{ marginBottom: 28 }} />
          </>
        )}
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
          headline_size = 108, quote_size = 64, body_size = 42,
          headline_offset_y = 0, body_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay} position={image_position} />}
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
          headline_size = 108, body_size = 42, stat_size = 168,
          headline_offset_y = 0, body_offset_y = 0, stats_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.82} position={image_position} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{
        position: 'absolute', left: 72, top: 580 + stats_offset_y, right: 72,
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
                {(() => {
                  const v = s.value == null ? '' : String(s.value);
                  return v.split('%').length === 2
                    ? <>{v.split('%')[0]}<span style={{ color: ITIHA.red }}>%</span></>
                    : v;
                })()}
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
          headline_size = 116, date_size = 52, text_size = 28,
          headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.84} position={image_position} />}
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
          headline_size = 148, body_size = 42,
          headline_offset_y = 0, body_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {<ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.82} position={image_position} />}
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
          image, image_bw, image_overlay, image_position, text_y = 50,
          quote_size = 48 } = slide;
  const isLight = variant === 'light';
  const bg = isLight ? ITIHA.offWhite : ITIHA.ink;
  const fg = isLight ? ITIHA.nearBlack : ITIHA.parchment;
  const stampFg = isLight ? ITIHA.ink : ITIHA.parchment;
  return (
    <div className="itiha-slide" style={{ background: bg, color: fg }}>
      {image && <ImageLayer light={isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.7} position={image_position} vignette={false} />}
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
            fontFamily: ITIHA.sans, fontSize: quote_size, lineHeight: 1.45,
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
      {image && <ImageLayer url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.55} position={image_position} vignette={false} />}
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
        ? <ImageLayer url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay} position={image_position} vignette={false} />
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
      {image && <ImageLayer url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.7} position={image_position} vignette={false} />}
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
  const { num, eyebrow, headline, body, headline_size = 96, body_size = 42,
          image, image_bw, image_overlay, image_position } = slide;
  return (
    <div className="itiha-slide" style={{ background: ITIHA.offWhite, color: ITIHA.nearBlack }}>
      {image && <ImageLayer url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0} position={image_position} vignette={false} />}
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

// Final-slide CTA pointing to a full YouTube documentary. Jet black so the
// thumbnail and the red play-mark carry the eye. Uses Big Shoulders Display
// for the video title + CTA — heavier than Bebas Neue, reads as a movie
// poster credit rather than another slide.
function YouTubeCTA({ slide, index }) {
  const {
    eyebrow = 'Watch The Full Documentary',
    thumbnail, headline,
    duration, channel_label = 'Itiha Documentaries',
    cta = 'Watch on YouTube',
    handle = '@itihahindi',
    url_label,
    headline_size = 84,
    cta_size = 64,
    headline_offset_y = 0,
  } = slide;

  // Word-by-word renderer that lights "YouTube" in Sindoor Red.
  const renderCta = (text) => {
    const tokens = (text || '').split(/(\s+)/);
    return tokens.map((tok, i) => {
      const isYT = /^you?-?tube$/i.test(tok);
      return isYT
        ? <span key={i} style={{ color: ITIHA.red }}>{tok}</span>
        : <span key={i}>{tok}</span>;
    });
  };

  // Match ImageLayer's URL convention: bare filename → served under images/,
  // full URL passes through unchanged.
  const thumbSrc = thumbnail
    ? (/^https?:\/\//.test(thumbnail) ? thumbnail : `images/${thumbnail}`)
    : null;

  return (
    <div className="itiha-slide" style={{ background: ITIHA.jet, color: ITIHA.parchment }}>
      <TextureOverlay texture={slide.texture} />

      {/* Eyebrow + small red divider — Eyebrow (not ChapterEyebrow) so the
          tweaks toggle for showChapterLabels doesn't hide it. */}
      <div style={{ position: 'absolute', left: 72, top: 130, right: 72 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Divider style={{ marginTop: 18 }} />
      </div>

      {/* Thumbnail — always rendered (so the layout reads even without an
          image yet), 16:9, parchment hairline border, stamped red play mark. */}
      <div style={{
        position: 'absolute', left: 72, top: 240 + headline_offset_y, right: 72,
        aspectRatio: '16 / 9',
        overflow: 'hidden',
        boxShadow: `inset 0 0 0 1px rgba(232,220,200,0.20)`,
        background: thumbnail
          ? ITIHA.charcoal
          : 'repeating-linear-gradient(135deg, #131313 0 14px, #0c0c0c 14px 28px)',
      }}>
        {thumbSrc && (
          <img src={thumbSrc} style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          }} />
        )}
        {/* Sindoor-red play mark — square corners stay editorial. */}
        <svg width="168" height="118" viewBox="0 0 168 118" style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.55))',
        }}>
          <rect x="0" y="0" width="168" height="118" fill={ITIHA.red} />
          <polygon points="64,30 64,88 116,59" fill={ITIHA.parchment} />
        </svg>
      </div>

      {/* Video title (Big Shoulders Display ExtraBlack) — sits below the
          thumbnail (thumbnail ends around y=766 with default offset). */}
      <div style={{ position: 'absolute', left: 72, top: 830 + headline_offset_y, right: 72 }}>
        <h2 style={{
          fontFamily: ITIHA.heavy,
          fontWeight: 900,
          fontSize: headline_size,
          lineHeight: 0.95,
          letterSpacing: '-0.005em',
          textTransform: 'uppercase',
          color: ITIHA.parchment,
          margin: 0,
        }}>{renderHeadline(headline)}</h2>

        {(duration || channel_label) && (
          <div style={{
            marginTop: 32,
            fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 16,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'rgba(232,220,200,0.6)',
          }}>
            {duration && <span>{duration}</span>}
            {duration && channel_label && <span style={{ margin: '0 14px', color: ITIHA.red }}>·</span>}
            {channel_label && <span>{channel_label}</span>}
          </div>
        )}
      </div>

      {/* CTA block — pinned to bottom. */}
      <div style={{ position: 'absolute', left: 72, bottom: 140, right: 72 }}>
        <Divider style={{ marginBottom: 24 }} />
        <div style={{
          fontFamily: ITIHA.heavy,
          fontWeight: 900,
          fontSize: cta_size,
          lineHeight: 1,
          letterSpacing: '0.005em',
          textTransform: 'uppercase',
          color: ITIHA.parchment,
        }}>{renderCta(cta)}</div>
        {(handle || url_label) && (
          <div style={{
            marginTop: 20,
            fontFamily: ITIHA.sans, fontWeight: 500, fontSize: 18,
            letterSpacing: 0, color: 'rgba(232,220,200,0.72)',
          }}>
            {handle}{url_label && <span style={{ color: 'rgba(232,220,200,0.45)' }}>{` · ${url_label}`}</span>}
          </div>
        )}
      </div>

      <MaybePageNum n={index + 1} color="rgba(232,220,200,0.5)" />
      <MaybeStamp color={ITIHA.parchment} />
    </div>
  );
}

// Carousel variant: solid Sindoor Red CTA — usually the final slide.
function CtaRed({ slide, index }) {
  const { eyebrow = 'Final Slide', headline, cta, headline_size = 116,
          image, image_bw, image_overlay, image_position } = slide;
  return (
    <div className="itiha-slide" style={{ background: ITIHA.red, color: ITIHA.white }}>
      {image && <ImageLayer url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.85} position={image_position} vignette={false} />}
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
          headline_size = 88, item_size = 38, number_size = 80,
          headline_offset_y = 0, body_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {image && <ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.85} position={image_position} vignette={false} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{ position: 'absolute', left: 72, top: 460 + body_offset_y, right: 72,
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
          headline_size = 88, sub_size = 38, body_size = 38,
          headline_offset_y = 0, body_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {image && <ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.9} position={image_position} vignette={false} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{
        position: 'absolute', left: 72, top: 540 + body_offset_y, right: 72, bottom: 200 - body_offset_y,
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
          name_size = 132, body_size = 38,
          headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide ${t.className}`} style={{ background: t.bg }}>
      <TextureOverlay texture={slide.texture} />
      {image && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', overflow: 'hidden' }}>
          <ImageLayer url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.15} position={image_position} vignette={false} />
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


// Vertical timeline. A red axis on the left; each item gets a date in big Bebas
// red, optional headline + body. Best for dynasty progressions, conquest dates,
// indenture timelines, etc.
function Timeline({ slide, index }) {
  const { chapter, headline, items = [],
          image, image_bw, image_overlay, image_position,
          headline_size = 88, date_size = 56, item_headline_size = 28, item_body_size = 36,
          headline_offset_y = 0, body_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {image && <ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.88} position={image_position} vignette={false} />}
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{ position: 'absolute', left: 96, top: 460 + body_offset_y, right: 72, bottom: 160 - body_offset_y }}>
        <div style={{ position: 'relative', paddingLeft: 50, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ position: 'absolute', left: 6, top: 14, height: `calc(100% - ${30 + item_body_size * 1.5}px)`, width: 2, background: ITIHA.red, opacity: 0.55 }} />
          {items.map((it, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: -50, top: 18,
                width: 14, height: 14, background: ITIHA.red,
                transform: 'translateX(-1px)',
                boxShadow: t.isLight ? '0 0 0 4px rgba(250,245,238,1)' : '0 0 0 4px rgba(13,13,13,1)',
              }} />
              <div style={{
                fontFamily: ITIHA.bebas, fontSize: date_size, color: ITIHA.red,
                lineHeight: 1, letterSpacing: 1,
              }}>{it.date}</div>
              {it.headline && (
                <div className="itiha-h1" style={{ fontSize: item_headline_size, marginTop: 8, lineHeight: 1.05 }}>
                  {renderHeadline(it.headline)}
                </div>
              )}
              {it.body && <Body text={it.body} size={item_body_size} maxWidth={820} style={{ marginTop: 10, lineHeight: 1.55 }} />}
            </div>
          ))}
        </div>
      </div>
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Geographic slide. A user-supplied map image (period-accurate map, regional
// outline, etc.) is placed in a framed area; markers at (x%, y%) coordinates
// drop Sindoor-red dots with optional Bebas labels + sublabels. The map sits
// in a bordered box below the headline; no body — keep the slide focused.
function MapSlide({ slide, index }) {
  const { chapter, headline, caption, markers = [],
          image, image_bw, image_overlay, image_position,
          headline_size = 88, caption_size = 24, marker_size = 18,
          headline_offset_y = 0, caption_offset_x = 0, caption_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{
        position: 'absolute', left: 72, right: 72, top: 460, bottom: caption ? 240 : 160,
        border: `1px solid ${t.divider}`, overflow: 'hidden',
      }}>
        {image ? (
          <ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter}
            overlay={image_overlay != null ? image_overlay : 0.25}
            position={image_position} vignette={false} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: t.isLight ? '#EFE5D2' : '#161616',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: t.muted55, fontFamily: ITIHA.mono, fontSize: 12, letterSpacing: 2,
            textTransform: 'uppercase',
          }}>Drop a map image</div>
        )}
        {markers.map((m, i) => {
          const x = Number(m.x != null ? m.x : 50);
          const y = Number(m.y != null ? m.y : 50);
          const labelShadow = t.isLight
            ? '0 0 6px rgba(250,245,238,0.95), 0 0 2px rgba(250,245,238,0.95)'
            : '0 0 6px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.95)';
          return (
            <div key={i} style={{
              position: 'absolute', left: `${x}%`, top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}>
              <div style={{
                width: marker_size, height: marker_size, background: ITIHA.red,
                borderRadius: '50%',
                boxShadow: `0 0 0 4px ${t.isLight ? 'rgba(250,245,238,0.85)' : 'rgba(13,13,13,0.85)'}, 0 0 0 6px rgba(192,57,43,0.4)`,
              }} />
              {m.label && (
                <div style={{
                  position: 'absolute', left: marker_size + 10, top: -4,
                  fontFamily: ITIHA.bebas, fontSize: 28, color: t.h1,
                  lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: 1,
                  textShadow: labelShadow,
                }}>{m.label}</div>
              )}
              {m.sublabel && (
                <div style={{
                  position: 'absolute', left: marker_size + 10, top: 28,
                  fontFamily: ITIHA.sans, fontSize: 12, color: ITIHA.red,
                  letterSpacing: 2.5, textTransform: 'uppercase',
                  fontWeight: 600, whiteSpace: 'nowrap',
                  textShadow: labelShadow,
                }}>{m.sublabel}</div>
              )}
            </div>
          );
        })}
      </div>
      {caption && (
        <div style={{
          position: 'absolute',
          left: 72 + caption_offset_x, right: 72 - caption_offset_x,
          bottom: 130 - caption_offset_y,
        }}>
          <Body text={caption} size={caption_size} maxWidth={920} style={{ lineHeight: 1.55 }} />
        </div>
      )}
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}


// "Did You Know?" fact card. A bold red-square stamp + parchment eyebrow at top,
// the fact as a Bebas headline, optional body for context, optional source line.
// A faint Sindoor-red `?` sits as a corner watermark when there's no image —
// it doubles as a brand-coherent visual hook for the format.
function DidYouKnow({ slide, index }) {
  const {
    eyebrow = 'Did You Know?',
    headline, body, source,
    image, image_bw, image_overlay, image_position,
    headline_size = 108, body_size = 42,
    headline_offset_y = 0, body_offset_y = 0,
    show_mark = true,
  } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      {image && <ImageLayer light={t.isLight} url={image} bw={image_bw} filter={slide.image_filter} overlay={image_overlay != null ? image_overlay : 0.85} position={image_position} vignette={false} />}
      <TextureOverlay texture={slide.texture} />

      {show_mark && !image && (
        <div style={{
          position: 'absolute', right: -60, top: -80,
          opacity: t.isLight ? 0.07 : 0.06,
          fontFamily: ITIHA.bebas, fontSize: 880, lineHeight: 0.85,
          color: ITIHA.red, pointerEvents: 'none',
          userSelect: 'none',
        }}>?</div>
      )}

      <div style={{
        position: 'absolute', left: 72, top: 110 + headline_offset_y,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ width: 14, height: 14, background: ITIHA.red }} />
        <div style={{
          fontFamily: ITIHA.sans, fontWeight: 700, fontSize: 22,
          letterSpacing: '0.4em', textTransform: 'uppercase',
          color: t.h1,
        }}>{eyebrow}</div>
      </div>

      <div style={{ position: 'absolute', left: 72, top: 240 + headline_offset_y, right: 72 }}>
        <Divider style={{ marginBottom: 36 }} />
        <Headline text={headline} size={headline_size} />
      </div>

      {body && (
        <div style={{ position: 'absolute', left: 72, bottom: (source ? 290 : 210) - body_offset_y, right: 72 }}>
          <Body text={body} size={body_size} maxWidth={920} />
        </div>
      )}

      {source && (
        <div style={{
          position: 'absolute', left: 72, bottom: 200, right: 72,
          fontFamily: ITIHA.sans, fontWeight: 500, fontSize: 14,
          letterSpacing: 2.5, textTransform: 'uppercase',
          color: t.muted55,
        }}>— {source}</div>
      )}

      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}


// Donut / pie chart. Segments are sized by value; Sindoor red leads the
// palette (use it for the segment you want to emphasize). Legend sits below
// with labels + auto-computed percentages. Optional center figure on donuts.
function PieChart({ slide, index }) {
  const { chapter, headline, segments = [], donut = true, show_values = true,
          center_label, caption,
          headline_size = 88, caption_size = 24, headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  // Theme-aware default palette — parchment/tan read on dark, ink/grey on light.
  const palette = t.isLight
    ? ['#C0392B', '#1A1A1A', '#8A8A8A', '#7A2E22', '#B0A283', '#4A4A4A']
    : ['#C0392B', '#E8DCC8', '#8A8A8A', '#C9BB9D', '#5A5A5A', '#7A2E22'];
  const total = segments.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
  const size = 420;
  const cx = size / 2, cy = size / 2;
  const colorFor = (seg, i) => seg.color || palette[i % palette.length];

  // Donut: thick stroked circle segments via dash-offset (fills cleanly to the
  // viewBox edge, leaving a centered hole). Full pie: SVG wedge paths, since a
  // stroke can't reach the center.
  let arcs;
  if (donut) {
    const stroke = 84;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    arcs = segments.map((seg, i) => {
      const dash = (Number(seg.value) || 0) / total * circ;
      const el = (
        <circle key={i} r={r} cx={cx} cy={cy} fill="none"
          stroke={colorFor(seg, i)} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={-offset}
          transform={`rotate(-90 ${cx} ${cy})`} />
      );
      offset += dash;
      return el;
    });
  } else if (segments.length === 1) {
    arcs = <circle cx={cx} cy={cy} r={size / 2} fill={colorFor(segments[0], 0)} />;
  } else {
    let start = 0;
    arcs = segments.map((seg, i) => {
      const frac = (Number(seg.value) || 0) / total;
      const d = _wedgePath(cx, cy, size / 2, start * 360, (start + frac) * 360);
      start += frac;
      return <path key={i} d={d} fill={colorFor(seg, i)} />;
    });
  }
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 420, display: 'flex', justifyContent: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs}
          {donut && center_label && (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
              style={{ fontFamily: ITIHA.bebas, fontSize: 92, fill: t.h1 }}>{center_label}</text>
          )}
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 72, right: 72, top: 900,
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 36px' }}>
        {segments.map((seg, i) => {
          const pct = Math.round((Number(seg.value) || 0) / total * 100);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 16, height: 16, background: colorFor(seg, i), flex: '0 0 auto' }} />
              <span className="itiha-body" style={{ fontSize: 22, lineHeight: 1.2 }}>{seg.label}</span>
              {show_values && <span style={{ marginLeft: 'auto', fontFamily: ITIHA.bebas, fontSize: 34, color: ITIHA.red, lineHeight: 1 }}>{pct}%</span>}
            </div>
          );
        })}
      </div>
      {caption && (
        <div style={{ position: 'absolute', left: 72, bottom: 130, right: 72 }}>
          <Body text={caption} size={caption_size} maxWidth={920} style={{ lineHeight: 1.55 }} />
        </div>
      )}
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Line graph. Single series via `points`, or multiple via `series` (each
// { label, color?, points }) for comparison trends. Sindoor-red leads; area
// fill only on single-series. Gridlines, y-axis ticks, x-axis labels, and a
// legend when there's more than one series.
function LineGraph({ slide, index }) {
  const { chapter, headline, points = [], series, y_suffix = '', fill = true,
          caption, headline_size = 88, caption_size = 24, headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  const palette = t.isLight
    ? ['#C0392B', '#1A1A1A', '#8A8A8A', '#7A2E22']
    : ['#C0392B', '#E8DCC8', '#8A8A8A', '#C9BB9D'];
  // Normalize to a list of series. Single-series `points` → one unlabeled series.
  const seriesList = (Array.isArray(series) && series.length)
    ? series.map(s => ({ ...s, points: s.points || [] }))
    : [{ label: null, points }];
  const multi = seriesList.length > 1;
  const W = 936, H = 480;
  const padL = 76, padR = 20, padT = 24, padB = 56;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const allVals = seriesList.flatMap(s => s.points.map(p => Number(p.value) || 0));
  const maxV = Math.max(1, ...allVals);
  const minV = Math.min(0, ...allVals);
  const range = (maxV - minV) || 1;
  // X labels come from the series with the most points.
  const xRef = seriesList.reduce((a, b) => (b.points.length > a.points.length ? b : a), seriesList[0]).points;
  const nPts = xRef.length;
  const X = i => padL + (nPts <= 1 ? plotW / 2 : (i / (nPts - 1)) * plotW);
  const Y = v => padT + plotH - ((v - minV) / range) * plotH;
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map(f => minV + f * range);
  const colorFor = (s, i) => s.color || palette[i % palette.length];
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      {multi && (
        <div style={{ position: 'absolute', left: 72, right: 72, top: 430, display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {seriesList.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 22, height: 4, background: colorFor(s, i) }} />
              <span className="itiha-body" style={{ fontSize: 20 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ position: 'absolute', left: 72, right: 72, top: multi ? 510 : 500 }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
          {gridVals.map((gv, i) => {
            const yy = Y(gv);
            return (
              <g key={i}>
                <line x1={padL} y1={yy} x2={padL + plotW} y2={yy} stroke={t.divider} strokeWidth="1" />
                <text x={padL - 14} y={yy} textAnchor="end" dominantBaseline="central"
                  style={{ fontFamily: ITIHA.sans, fontSize: 19, fontWeight: 500, fill: t.muted55 }}>
                  {Math.round(gv)}{y_suffix}
                </text>
              </g>
            );
          })}
          {!multi && fill && (
            <polygon points={`${padL},${padT + plotH} ${seriesList[0].points.map((p, i) => `${X(i)},${Y(Number(p.value) || 0)}`).join(' ')} ${padL + plotW},${padT + plotH}`}
              fill="rgba(192,57,43,0.14)" />
          )}
          {seriesList.map((s, si) => {
            const color = colorFor(s, si);
            const pts = s.points.map((p, i) => `${X(i)},${Y(Number(p.value) || 0)}`).join(' ');
            return (
              <g key={si}>
                <polyline points={pts} fill="none" stroke={color} strokeWidth="4"
                  strokeLinejoin="round" strokeLinecap="round" />
                {s.points.map((p, i) => (
                  <circle key={i} cx={X(i)} cy={Y(Number(p.value) || 0)} r="7" fill={color}
                    stroke={t.bg} strokeWidth="3" />
                ))}
              </g>
            );
          })}
          {xRef.map((p, i) => (
            <text key={i} x={X(i)} y={padT + plotH + 30} textAnchor="middle"
              style={{ fontFamily: ITIHA.sans, fontSize: 19, fontWeight: 500, fill: t.muted55 }}>{p.label}</text>
          ))}
        </svg>
      </div>
      {caption && (
        <div style={{ position: 'absolute', left: 72, bottom: 150, right: 72 }}>
          <Body text={caption} size={caption_size} maxWidth={920} style={{ lineHeight: 1.55 }} />
        </div>
      )}
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Bar chart. Vertical bars by default; set `horizontal: true` for ranked rows
// (better for long category labels). Single series, Sindoor-red bars with
// per-bar color override. Values shown in Bebas.
function BarChart({ slide, index }) {
  const { chapter, headline, bars = [], horizontal = false, value_suffix = '',
          caption, headline_size = 88, caption_size = 24, headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  const maxV = Math.max(1, ...bars.map(b => Number(b.value) || 0));
  const colorFor = b => b.color || ITIHA.red;
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      {horizontal ? (
        <div style={{ position: 'absolute', left: 72, right: 72, top: 480, bottom: caption ? 240 : 160,
                      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
          {bars.map((b, i) => {
            const w = (Number(b.value) || 0) / maxV * 100;
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span className="itiha-body" style={{ fontSize: 24 }}>{b.label}</span>
                  <span style={{ fontFamily: ITIHA.bebas, fontSize: 42, color: ITIHA.red, lineHeight: 1 }}>{b.value}{value_suffix}</span>
                </div>
                <div style={{ height: 26, background: t.divider }}>
                  <div style={{ height: '100%', width: `${w}%`, background: colorFor(b), minWidth: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ position: 'absolute', left: 72, right: 72, top: 500, bottom: caption ? 250 : 170,
                      display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
            {bars.map((b, i) => {
              const h = (Number(b.value) || 0) / maxV * 100;
              return (
                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
                                      alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div style={{ fontFamily: ITIHA.bebas, fontSize: 40, color: ITIHA.red, lineHeight: 1, marginBottom: 10 }}>{b.value}{value_suffix}</div>
                  <div style={{ width: '100%', height: `${h}%`, background: colorFor(b), minHeight: 3 }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <span className="itiha-body" style={{ fontSize: 20, lineHeight: 1.25 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {caption && (
        <div style={{ position: 'absolute', left: 72, bottom: 130, right: 72 }}>
          <Body text={caption} size={caption_size} maxWidth={920} style={{ lineHeight: 1.55 }} />
        </div>
      )}
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Dynasty / genealogy tree. `nodes` lay out top-to-bottom; each is its own
// generation by default, or group siblings into one row by giving them the
// same `generation` number. Red connectors between rows. `highlight` rings a node.
function Dynasty({ slide, index }) {
  const { chapter, headline, nodes = [], caption,
          headline_size = 88, caption_size = 24, headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  const hasGen = nodes.some(n => n && n.generation != null);
  let rows;
  if (hasGen) {
    const map = {};
    nodes.forEach((nd, i) => {
      const g = nd.generation != null ? nd.generation : i + 1;
      (map[g] = map[g] || []).push(nd);
    });
    rows = Object.keys(map).sort((a, b) => Number(a) - Number(b)).map(k => map[k]);
  } else {
    rows = nodes.map(nd => [nd]);
  }
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{ position: 'absolute', left: 72, right: 72, top: 450, bottom: caption ? 210 : 140,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {rows.map((row, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div style={{ width: 2, height: 30, background: ITIHA.red, opacity: 0.6, flex: '0 0 auto' }} />}
            <div style={{ display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap' }}>
              {row.map((nd, ni) => (
                <div key={ni} style={{
                  border: `1px solid ${nd.highlight ? ITIHA.red : t.divider}`,
                  background: nd.highlight ? 'rgba(192,57,43,0.12)' : 'transparent',
                  padding: '14px 24px', minWidth: 200, textAlign: 'center',
                }}>
                  <div style={{ fontFamily: ITIHA.bebas, fontSize: 40, color: t.h1, lineHeight: 1 }}>{nd.name}</div>
                  {nd.dates && (
                    <div style={{ fontFamily: ITIHA.sans, fontSize: 14, letterSpacing: 2.5, color: ITIHA.red,
                                  marginTop: 7, textTransform: 'uppercase', fontWeight: 600 }}>{nd.dates}</div>
                  )}
                  {nd.note && <Body text={nd.note} size={16} maxWidth={260} style={{ marginTop: 6, color: t.muted75 }} />}
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
      {caption && (
        <div style={{ position: 'absolute', left: 72, bottom: 120, right: 72 }}>
          <Body text={caption} size={caption_size} maxWidth={920} style={{ lineHeight: 1.55 }} />
        </div>
      )}
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Before / after split. Two images divided by a diagonal (default) or vertical
// seam, each tagged with a label. Per-image filter (filter_before / filter_after)
// lets you contrast eras — e.g. before bw, after colour.
function BeforeAfter({ slide, index }) {
  const { chapter, headline, caption,
          image_before, image_after, label_before = 'Before', label_after = 'After',
          split = 'diagonal', image_bw, image_filter, filter_before, filter_after,
          headline_size = 88, caption_size = 24, headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  const diagonal = split !== 'vertical';
  const clipBefore = diagonal ? 'polygon(0 0, 62% 0, 38% 100%, 0 100%)' : 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
  const clipAfter  = diagonal ? 'polygon(62% 0, 100% 0, 100% 100%, 38% 100%)' : 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
  const tag = (text, pos) => (
    <div style={{
      position: 'absolute', ...pos, zIndex: 4,
      fontFamily: ITIHA.sans, fontWeight: 700, fontSize: 18, letterSpacing: '0.35em',
      textTransform: 'uppercase', color: ITIHA.white,
      background: 'rgba(0,0,0,0.55)', padding: '8px 16px',
    }}>{text}</div>
  );
  return (
    <div className={`itiha-slide ${t.className}`} style={{ background: t.bg }}>
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 110 + headline_offset_y, right: 72, zIndex: 5 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 18 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        <Headline text={headline} size={headline_size} style={{ textShadow: t.isLight ? 'none' : '0 2px 24px rgba(0,0,0,0.6)' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 440, bottom: caption ? 210 : 110, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, clipPath: clipBefore }}>
          <ImageLayer light={t.isLight} url={image_before} bw={image_bw} filter={filter_before || image_filter} overlay={0.18} vignette={false} />
        </div>
        <div style={{ position: 'absolute', inset: 0, clipPath: clipAfter }}>
          <ImageLayer light={t.isLight} url={image_after} bw={image_bw} filter={filter_after || image_filter} overlay={0.18} vignette={false} />
        </div>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}
          preserveAspectRatio="none" viewBox="0 0 100 100">
          {diagonal
            ? <line x1="62" y1="0" x2="38" y2="100" stroke={ITIHA.red} strokeWidth="0.7" />
            : <line x1="50" y1="0" x2="50" y2="100" stroke={ITIHA.red} strokeWidth="0.7" />}
        </svg>
        {label_before && tag(label_before, { left: 32, top: 28 })}
        {label_after && tag(label_after, { right: 32, bottom: 28 })}
      </div>
      {caption && (
        <div style={{ position: 'absolute', left: 72, bottom: 110, right: 72 }}>
          <Body text={caption} size={caption_size} maxWidth={920} style={{ lineHeight: 1.55 }} />
        </div>
      )}
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}


// Primary-source document slide. A framed scan of a manuscript, treaty,
// inscription or photograph, with a pulled key line (often a translation) and an
// archival attribution. The documentary signature — "here is what the source says."
function DocumentSlide({ slide, index }) {
  const { chapter, headline, image, image_position, image_bw, image_filter,
          quote, translation, attribution,
          headline_size = 72, quote_size = 40, headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 96 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 16 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 22 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{
        position: 'absolute', left: 110, right: 110, top: 330, height: 500,
        border: `8px solid ${t.isLight ? '#FFFFFF' : '#161616'}`,
        boxShadow: t.isLight ? '0 10px 44px rgba(0,0,0,0.28)' : '0 10px 44px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        <ImageLayer light={t.isLight} url={image} bw={image_bw}
          filter={image_filter !== undefined ? image_filter : 'archival'}
          overlay={0} position={image_position} vignette={false} />
      </div>
      {quote && (
        <div style={{ position: 'absolute', left: 110, right: 110, top: 880,
                      borderLeft: `3px solid ${ITIHA.red}`, paddingLeft: 26 }}>
          <div className="itiha-pull" style={{ fontSize: quote_size, lineHeight: 1.05 }}>
            {quote.split('\n').map((l, i, a) => <React.Fragment key={i}>{l}{i < a.length - 1 && <br/>}</React.Fragment>)}
          </div>
          {translation && <Body text={translation} size={20} style={{ marginTop: 14, color: t.muted75, fontStyle: 'italic' }} />}
        </div>
      )}
      {attribution && (
        <div style={{ position: 'absolute', left: 110, right: 110, bottom: 120,
                      fontFamily: ITIHA.sans, fontWeight: 600, fontSize: 14, letterSpacing: 2.5,
                      textTransform: 'uppercase', color: t.muted55 }}>
          — {attribution}
        </div>
      )}
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Annotated image. Numbered red markers dropped on a painting or photograph at
// (x%, y%), with a numbered legend below — visual close-reading of a source image.
function Annotated({ slide, index }) {
  const { chapter, headline, image, image_position, image_bw, image_filter,
          callouts = [], caption, headline_size = 80, marker_size = 34, headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 96 + headline_offset_y, right: 72 }}>
        {chapter && <ChapterEyebrow style={{ marginBottom: 16 }}>{chapter}</ChapterEyebrow>}
        <Divider style={{ marginBottom: 22 }} />
        <Headline text={headline} size={headline_size} />
      </div>
      <div style={{ position: 'absolute', left: 72, right: 72, top: 330, height: 520,
                    border: `1px solid ${t.divider}`, overflow: 'hidden' }}>
        <ImageLayer light={t.isLight} url={image} bw={image_bw} filter={image_filter}
          overlay={0.15} position={image_position} vignette={false} />
        {callouts.map((c, i) => {
          const x = Number(c.x != null ? c.x : 50), y = Number(c.y != null ? c.y : 50);
          return (
            <div key={i} style={{
              position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)',
              width: marker_size, height: marker_size, borderRadius: '50%', background: ITIHA.red,
              border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: ITIHA.bebas, fontSize: marker_size * 0.62, color: '#fff', lineHeight: 1,
              boxShadow: '0 2px 10px rgba(0,0,0,0.55)',
            }}>{i + 1}</div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 72, right: 72, top: 890,
                    display: 'flex', flexDirection: 'column', gap: 12 }}>
        {callouts.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
            <span style={{ flex: '0 0 auto', width: 28, height: 28, borderRadius: '50%',
                           background: ITIHA.red, color: '#fff', fontFamily: ITIHA.bebas, fontSize: 19,
                           display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                           transform: 'translateY(2px)' }}>{i + 1}</span>
            <Body text={c.label} size={20} maxWidth={860} style={{ lineHeight: 1.4 }} />
          </div>
        ))}
      </div>
      {caption && (
        <div style={{ position: 'absolute', left: 72, bottom: 120, right: 72 }}>
          <Body text={caption} size={18} maxWidth={920} style={{ color: t.muted75 }} />
        </div>
      )}
      <MaybePageNum n={index + 1} color={t.pageNumColor} />
      <MaybeStamp color={t.stampFg} />
    </div>
  );
}

// Sources / bibliography slide. Lists the books, documents and archives the
// carousel draws on — making the research visible. The credibility differentiator.
function Sources({ slide, index }) {
  const { eyebrow = 'Sources', headline, sources = [], note, handle,
          headline_size = 96, headline_offset_y = 0 } = slide;
  const t = themeFor(slide);
  return (
    <div className={`itiha-slide itiha-grain ${t.className}`} style={{ background: t.bg }}>
      <TextureOverlay texture={slide.texture} />
      <div style={{ position: 'absolute', left: 72, top: 120 + headline_offset_y, right: 72 }}>
        {eyebrow && <Eyebrow style={{ marginBottom: 18 }}>{eyebrow}</Eyebrow>}
        <Divider style={{ marginBottom: 28 }} />
        {headline && <Headline text={headline} size={headline_size} />}
      </div>
      <div style={{ position: 'absolute', left: 72, right: 72, top: headline ? 460 : 360, bottom: 200,
                    display: 'flex', flexDirection: 'column', gap: 22, overflow: 'hidden' }}>
        {sources.map((s, i) => (
          <div key={i} style={{ borderTop: `1px solid ${t.divider}`, paddingTop: 16 }}>
            <div style={{ fontFamily: ITIHA.sans, fontSize: 24, fontWeight: 600, fontStyle: 'italic', color: t.h1, lineHeight: 1.3 }}>{s.title}</div>
            {(s.author || s.detail) && (
              <div className="itiha-meta" style={{ marginTop: 6 }}>
                {s.author}{s.author && s.detail ? ' · ' : ''}{s.detail}
              </div>
            )}
          </div>
        ))}
      </div>
      {note && (
        <div style={{ position: 'absolute', left: 72, right: 72, bottom: handle ? 188 : 130 }}>
          <Body text={note} size={20} maxWidth={920} style={{ color: t.muted75 }} />
        </div>
      )}
      {handle && (
        <div style={{ position: 'absolute', left: 72, bottom: 124, right: 72, display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ width: 8, height: 8, background: ITIHA.red }} />
          <span className="itiha-sub" style={{ color: t.h1, fontSize: 16 }}>{handle}</span>
        </div>
      )}
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
  timeline:        Timeline,
  map:             MapSlide,
  'did-you-know':  DidYouKnow,
  'pie-chart':     PieChart,
  'line-graph':    LineGraph,
  'bar-chart':     BarChart,
  dynasty:         Dynasty,
  'before-after':  BeforeAfter,
  document:        DocumentSlide,
  annotated:       Annotated,
  sources:         Sources,
  // Carousel variants from the design system templates
  'interior-light': InteriorLight,
  'cta-red': CtaRed,
  'youtube-cta': YouTubeCTA,
  // Standalone formats
  'quote-card': QuoteCard,
  'reel-title': ReelTitle,
  'youtube-thumbnail': YoutubeThumbnail,
  'end-card': EndCard,
};
