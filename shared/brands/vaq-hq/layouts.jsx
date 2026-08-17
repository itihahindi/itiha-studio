// VAQ HQ — slide layouts, v2 (1080×1350)
// Daylight newsroom (A) + poster wall (B): light paper interiors with the
// vertical's top rule and highlighter emphasis; solid accent tiles for
// covers and photo-less emphasis slides. No swipe-meta (Itiha owns that
// convention). Textures: grid / riso / dots / signal.

const PAD = 72;
const CHROME_H = 130;

// The kicker (vertical / show label) is a flex row, so align_x has to move it
// on the main axis — text-align can't. It's chrome: it takes the horizontal
// knob but is never re-anchored vertically. 'left' resolves to flex-start,
// which is the row's default, so an unset align_x is a no-op.
const kickerAlign = (slide) => ({ justifyContent: alignFor(slide).flexAlign });

// ── COVER ─────────────────────────────────────────────────────
// Poster tile by default (surface: solid); `surface: light` gives the
// newsroom cover. Ghost index numeral on by default.
function CoverSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, v.coverSurface || 'solid');
  const {
    headline = '', subline, kicker_meta, texture,
    image, image_position, image_height = 560, image_credit,
    headline_size, headline_offset_y = 0, show_index,
  } = slide;
  // With an image panel the headline drops to interior scale so the
  // composition still fits the tile.
  const hSize = headline_size || headlineDefaultSize(v, image ? 'inner' : 'cover');
  const pal = surface.onSolid ? solidPalette(v) : null;

  // Dark hero. With an image it's the cinematic sports cover (edge-to-edge photo
  // + scrim). With no image it's The Docket's text poster, so the headline block
  // balances mid-slide instead of hugging a scrim that isn't there.
  if (surface.onDark) {
    const dSize = headline_size || headlineDefaultSize(v, 'cover');
    const dInk = inkFor(v, surface);
    return (
      <VSlide v={v} surface={surface} texture={texture}>
        {image && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <img src={image.startsWith('http') ? image : `images/${image}`} style={{
              width: '100%', height: '100%', objectFit: 'cover',
              objectPosition: image_position || 'center',
            }} />
            <div style={{ position: 'absolute', inset: 0, background:
              'linear-gradient(180deg, rgba(30,30,30,.62) 0%, rgba(30,30,30,0) 24%, rgba(30,30,30,0) 40%, rgba(30,30,30,.74) 72%, rgba(30,30,30,.97) 100%)' }} />
          </div>
        )}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: v.accent, zIndex: 4 }} />
        <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column', zIndex: 3 }}>
          {show_index === true && <VGhostIndex n={index + 1} v={v} onSolid={false} />}
          <VKicker v={v} onDark meta={kicker_meta} style={kickerAlign(slide)} />
          <div style={{ flex: image ? 1 : 0.62 }} />
          <div {...alignBlock(slide,
                 { left: 0, right: 0, transform: `translateY(${headline_offset_y}px)` },
                 { top: 110 + headline_offset_y, bottom: (CHROME_H - 20) - headline_offset_y })}>
            <div className="vaq-rule" style={{ width: 88, height: 9, background: v.accent, marginBottom: 30 }} />
            <VHeadline text={headline} v={v} size={dSize} onDark />
            {subline && (
              <div className="vaq-measure" style={{ marginTop: 30, fontFamily: bodyFontFor(v),
                fontWeight: v.bodyFont ? 400 : 600, fontSize: 38,
                lineHeight: 1.45, color: dInk.body, maxWidth: 860 }}>{subline}</div>
            )}
            {image_credit && (
              <div style={{ marginTop: 26, fontFamily: metaFontFor(v), fontSize: 18, letterSpacing: '.1em',
                textTransform: 'uppercase', color: dInk.muted }}>{image_credit}</div>
            )}
          </div>
          {!image && <div style={{ flex: 1 }} />}
          <div style={{ height: CHROME_H - 20 }} />
        </div>
        <div style={{ position: 'absolute', left: PAD, right: PAD, bottom: 56,
          display: 'flex', justifyContent: 'flex-end', zIndex: 4 }}>
          {t.showStamp !== false && <VWordmark size={30} onDark />}
        </div>
      </VSlide>
    );
  }

  // The group's tuned nudge against the flow position. Like the quote's, the
  // built-in part stays in the transform and out of the align_y insets — only
  // the author's headline_offset_y travels with an explicit anchor.
  const coverOff = headline_offset_y - (image ? 20 : 40);
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      {show_index === true && <VGhostIndex n={index + 1} v={v} onSolid={surface.onSolid} />}
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} onDark={surface.onDark} meta={kicker_meta} style={kickerAlign(slide)} />
        {image && (
          <div style={{
            marginTop: 44, position: 'relative', borderRadius: 14, overflow: 'hidden',
            border: `1px solid ${surface.onSolid ? 'rgba(255,255,255,.35)' : VAQ.hairL}`,
            height: image_height, background: 'rgba(0,0,0,.15)',
          }}>
            <img src={image.startsWith('http') ? image : `images/${image}`} style={{
              width: '100%', height: '100%', objectFit: 'cover',
              objectPosition: image_position || 'center',
            }} />
            {image_credit && (
              <div style={{
                position: 'absolute', right: 18, bottom: 18,
                fontFamily: VAQ.mono, fontSize: 18, letterSpacing: '.1em', textTransform: 'uppercase',
                color: '#fff', background: 'rgba(10,17,25,.55)', padding: '5px 12px', borderRadius: 6,
              }}>{image_credit}</div>
            )}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div {...alignBlock(slide,
               { left: 0, right: 0, transform: `translateY(${coverOff}px)` },
               { top: 110 + headline_offset_y, bottom: (CHROME_H - 20) - headline_offset_y })}>
          <VHeadline text={headline} v={v} size={hSize} onSolid={surface.onSolid} onDark={surface.onDark} />
          {subline && (
            <div className="vaq-measure" style={{
              marginTop: 36, fontFamily: VAQ.sans, fontWeight: 600, fontSize: 38, lineHeight: 1.4,
              color: surface.onSolid ? pal.body : VAQ.bodyL,
              maxWidth: 840,
            }}>{subline}</div>
          )}
        </div>
        <div style={{ height: CHROME_H - 20 }} />
      </div>
      <VChrome n={null} onSolid={surface.onSolid} v={v} />
    </VSlide>
  );
}

// ── STORY ─────────────────────────────────────────────────────
// The light interior workhorse: kicker, headline, body, optional contained
// image with hairline frame + mono caption/credit. `surface: solid` turns it
// into a B-style type poster (for slides with no photo).
function StorySlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v);
  const {
    headline = '', body, kicker_meta, texture, loop,
    image, image_caption, image_credit, image_position, image_height = 470,
    headline_size, body_size = 46, headline_offset_y = 0, body_offset_y = 0,
  } = slide;
  const hSize = headline_size || headlineDefaultSize(v, 'inner');
  const ink = inkFor(v, surface);
  const capParts = [image_caption, image_credit].filter(Boolean);
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} onDark={surface.onDark} meta={kicker_meta} style={kickerAlign(slide)} />
        {!image && <div style={{ flex: 0.8 }} />}
        {/* headline · frame · body move as one. They are stacked block boxes,
            so the wrapper is layout-neutral while align_y is unset, and gives
            align_y a single box to re-anchor once it isn't. */}
        <div {...alignBlock(slide, { left: 0, right: 0 }, { top: 110, bottom: CHROME_H - 40 })}>
          <div style={{ marginTop: image ? 52 : 0, transform: `translateY(${headline_offset_y}px)` }}>
            <VHeadline text={headline} v={v} size={hSize} onSolid={surface.onSolid} onDark={surface.onDark} />
          </div>
          {image && (
            <div style={{ marginTop: 44 }}>
              <div style={{
                borderRadius: 14, overflow: 'hidden',
                border: `1px solid ${ink.hair}`,
                height: image_height, background: ink.well,
              }}>
                <img src={image.startsWith('http') ? image : `images/${image}`} style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  objectPosition: image_position || 'center',
                }} />
              </div>
              {capParts.length > 0 && (
                <div style={{
                  marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 20,
                  fontFamily: metaFontFor(v), fontSize: 20, letterSpacing: '.08em',
                  color: ink.muted,
                }}>
                  <span>{image_caption || ''}</span>
                  <span style={{ textTransform: 'uppercase' }}>{image_credit || ''}</span>
                </div>
              )}
            </div>
          )}
          {body && (
            <div style={{ marginTop: image ? 46 : 52, transform: `translateY(${body_offset_y}px)` }}>
              <VBody text={body} v={v} size={body_size} onSolid={surface.onSolid} onDark={surface.onDark} />
            </div>
          )}
          <VLoop text={loop} v={v} onSolid={surface.onSolid} onDark={surface.onDark} />
        </div>
        <div style={{ flex: image ? 1 : 1.2 }} />
        <div style={{ height: CHROME_H - 40 }} />
      </div>
      <VChrome n={index + 1} onSolid={surface.onSolid} onDark={surface.onDark} v={v} />
    </VSlide>
  );
}

// ── SPLIT-STORY ───────────────────────────────────────────────
// Flat photo block on top, accent divider, paper text block below.
function SplitStorySlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v);
  const {
    headline = '', body, kicker_meta, texture, loop,
    image, image_position, image_height = 580, image_credit,
    headline_size, body_size = 45, body_offset_y = 0,
  } = slide;
  const hSize = headline_size || Math.round(headlineDefaultSize(v, 'inner') * 0.94);
  const ink = inkFor(v, surface);
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: image_height, background: ink.well }}>
        {image && (
          <img src={image.startsWith('http') ? image : `images/${image}`} style={{
            width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: image_position || 'center',
          }} />
        )}
        {image_credit && (
          <div style={{
            position: 'absolute', right: 20, bottom: 22,
            fontFamily: VAQ.mono, fontSize: 18, letterSpacing: '.1em', textTransform: 'uppercase',
            color: '#fff', background: 'rgba(10,17,25,.55)', padding: '5px 12px', borderRadius: 6,
          }}>{image_credit}</div>
        )}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, background: v.accent }} />
      </div>
      <div style={{
        position: 'absolute', top: image_height + 10, left: 0, right: 0, bottom: 0,
        padding: `50px ${PAD}px 0`, display: 'flex', flexDirection: 'column',
      }}>
        <VKicker v={v} onSolid={surface.onSolid} onDark={surface.onDark} meta={kicker_meta} style={kickerAlign(slide)} />
        {/* Headline + body re-anchor together. The lower column carries its
            gutters as padding, and absolute children resolve against its
            padding box, so the re-anchor has to restate them as left/right. */}
        <div {...alignBlock(slide, { left: PAD, right: PAD },
               { top: 128, bottom: CHROME_H - 30 })}>
          <div style={{ marginTop: 38 }}>
            <VHeadline text={headline} v={v} size={hSize} onSolid={surface.onSolid} onDark={surface.onDark} />
          </div>
          {body && (
            <div style={{ marginTop: 38, transform: `translateY(${body_offset_y}px)` }}>
              <VBody text={body} v={v} size={body_size} onSolid={surface.onSolid} onDark={surface.onDark} />
            </div>
          )}
          <VLoop text={loop} v={v} onSolid={surface.onSolid} onDark={surface.onDark} />
        </div>
      </div>
      <VChrome n={index + 1} onSolid={surface.onSolid} onDark={surface.onDark} v={v} />
    </VSlide>
  );
}

// ── QUOTE ─────────────────────────────────────────────────────
function QuoteSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v);
  const { quote = '', attribution, kicker_meta, texture, quote_size = 72, quote_offset_y = 0 } = slide;
  const ink = inkFor(v, surface);
  // A vertical can override the pull-quote voice (Cathode uses Space Grotesk,
  // upright); the default is the reading serif, italic.
  const qFont = v.quoteFont || v.bodyFont || VAQ.serif;
  const qItalic = v.quoteItalic === false ? 'normal' : 'italic';
  // -40 is the block's own tuned nudge against the centred flow position, not
  // an author offset — so it stays in the transform and is kept out of the
  // align_y insets. Only quote_offset_y follows the block when it re-anchors.
  // The top inset also allows for the oversized quote mark, whose ink sits
  // well above its 96px box.
  const qOff = quote_offset_y - 40;
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} onDark={surface.onDark} meta={kicker_meta} style={kickerAlign(slide)} />
        <div style={{ flex: 1 }} />
        <div {...alignBlock(slide,
               { left: 0, right: 0, transform: `translateY(${qOff}px)` },
               { top: 150 + quote_offset_y, bottom: (CHROME_H - 50) - quote_offset_y })}>
          <div style={{
            fontFamily: qFont, fontSize: 210, lineHeight: 0.4, fontWeight: 600,
            color: ink.em, height: 96,
          }}>“</div>
          <div style={{
            fontFamily: qFont, fontStyle: qItalic, fontWeight: 500,
            fontSize: quote_size, lineHeight: 1.24, letterSpacing: '-.01em',
            color: ink.head, textWrap: 'balance',
          }}>{quote}</div>
          {attribution && (
            <div style={{
              marginTop: 44, fontFamily: metaFontFor(v), fontSize: 25, letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: ink.muted,
            }}>— {attribution}</div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ height: CHROME_H - 50 }} />
      </div>
      <VChrome n={index + 1} onSolid={surface.onSolid} onDark={surface.onDark} v={v} />
    </VSlide>
  );
}

// ── STAT ──────────────────────────────────────────────────────
function StatSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v);
  const {
    label, value = '', sublabel, body, kicker_meta, texture,
    stat_size = 250, body_size = 43, stats_offset_y = 0,
  } = slide;
  const ink = inkFor(v, surface);
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} onDark={surface.onDark} meta={kicker_meta} style={kickerAlign(slide)} />
        <div style={{ flex: 1 }} />
        <div {...alignBlock(slide,
               { left: 0, right: 0, transform: `translateY(${stats_offset_y}px)` },
               { top: 110 + stats_offset_y, bottom: (CHROME_H - 50) - stats_offset_y })}>
          {label && (
            <div style={{ fontFamily: metaFontFor(v), fontWeight: 700, fontSize: 26, letterSpacing: '.18em',
              textTransform: 'uppercase', color: ink.muted,
              marginBottom: 26 }}>{label}</div>
          )}
          <div style={{
            fontFamily: v.numFont || VAQ.display, fontWeight: 900, fontSize: stat_size, lineHeight: 0.92,
            letterSpacing: '-.03em', color: surface.onSolid ? ink.head : v.accent,
          }}>{value}</div>
          {sublabel && (
            <div style={{ marginTop: 30, fontFamily: bodyFontFor(v), fontWeight: 700, fontSize: 42,
              color: ink.head, letterSpacing: '-.01em' }}>{sublabel}</div>
          )}
          {body && (
            <div className="vaq-measure" style={{ marginTop: 40, maxWidth: 860 }}>
              <VBody text={body} v={v} size={body_size} onSolid={surface.onSolid} onDark={surface.onDark} />
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ height: CHROME_H - 50 }} />
      </div>
      <VChrome n={index + 1} onSolid={surface.onSolid} onDark={surface.onDark} v={v} />
    </VSlide>
  );
}

// ── CLOSING ───────────────────────────────────────────────────
// Paper signature: mark, wordmark, four accent dots, follow line.
function ClosingSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const { headline, body, handle, headline_size = 58, texture } = slide;
  // Follows the vertical's surface so a dark show (The Docket) doesn't end on a
  // white card. Still light for every daylight vertical.
  const surface = surfaceFor(slide, v);
  const ink = inkFor(v, surface);
  const sFont = v.bodyFont || VAQ.serif;
  // The signature is centred by brand, not by accident, so this is the one
  // layout where align's "left" default must NOT mean flex-start. Only an
  // explicit align_x / align_y moves it; blank keeps the centred stack.
  const a = alignFor(slide);
  const closeAlign = {
    ...(slide.align_x ? { alignItems: a.flexAlign, textAlign: a.textAlign } : null),
    ...(a.ay ? { justifyContent: a.ay === 'top' ? 'flex-start' : a.ay === 'bottom' ? 'flex-end' : 'center' } : null),
  };
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div data-align-x={slide.align_x || undefined} style={{
        position: 'absolute', inset: `${PAD}px`, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        ...closeAlign,
      }}>
        <VMark size={150} />
        <div style={{ marginTop: 44, fontFamily: sFont, fontWeight: 600, fontSize: 92, letterSpacing: '-.01em', lineHeight: 1 }}>
          <span style={{ color: ink.head }}>Vaq</span>{' '}
          <span style={{ color: VAQ.orange }}>HQ</span>
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 46 }}>
          {Object.values(VERTICALS).map(vv => (
            <span key={vv.key} style={{ width: 18, height: 18, borderRadius: 6, background: vv.accent }} />
          ))}
        </div>
        {headline && (
          <div className="vaq-measure" style={{ marginTop: 64, maxWidth: 840 }}>
            <div style={{ fontFamily: sFont, fontWeight: 600, fontSize: headline_size,
              lineHeight: 1.12, letterSpacing: '-.015em', color: ink.head, textWrap: 'balance' }}>
              {String(headline).split('\n').map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        )}
        {body && (
          <div className="vaq-measure" style={{ marginTop: 34, maxWidth: 760 }}>
            <VBody text={body} v={v} size={38} onDark={surface.onDark} color={ink.body}
              style={{ textAlign: slide.align_x || 'center' }} />
          </div>
        )}
        {handle && (
          <div style={{ marginTop: 60, fontFamily: metaFontFor(v), fontSize: 25, letterSpacing: '.2em',
            textTransform: 'uppercase', color: ink.muted }}>{handle}</div>
        )}
      </div>
    </VSlide>
  );
}

// Video zone for reel-frame: <video> of the yt-dlp download when it exists,
// dark placeholder otherwise (and always in capture mode). The source file is
// cache-keyed server-side on the URL, so after changing Video URL the old clip
// may keep playing until the next Compose refreshes the download.
function ReelVideoZone({ top, fade = 0, paper, videoUrl }) {
  const isCapture = document.body.classList.contains('capture');
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => { setFailed(false); }, [videoUrl]);
  const showVideo = !isCapture && videoUrl && !failed;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top, bottom: 0,
      background: '#0E141C', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20, overflow: 'hidden',
    }}>
      {showVideo ? (
        <video src="output/source.mp4" autoPlay muted loop playsInline
          onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <React.Fragment>
          <VMark size={64} mono />
          <div style={{
            fontFamily: VAQ.mono, fontSize: 22, letterSpacing: '.2em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,.4)',
            maxWidth: 800, textAlign: 'center',
          }}>{videoUrl ? (isCapture ? 'video linked' : 'compose once to preview the video')
              : 'paste a link in Video URL'}</div>
        </React.Fragment>
      )}
      {/* Soft hand-off: paper bleeds over the video's top edge. Preview only —
          the composer paints the same gradient into the MP4 (src/reel.py). */}
      {!isCapture && fade > 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: fade,
          background: `linear-gradient(180deg, ${paper || VAQ.paper} 0%, ${(paper || VAQ.paper)}00 100%)`,
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

// ── REEL-FRAME ────────────────────────────────────────────────
// 1080×1920 header panel for reposted video (Tatva-style, in VAQ language):
// paper panel up top — wordmark row, kicker, highlighter headline, subline,
// via-credit — and a placeholder video zone below. src/reel.py crops the
// panel strip from the rendered PNG and stacks the fetched video under it,
// so everything above `panel_height` is the frame; below it is replaced.
function ReelFrameSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, 'light');
  const {
    headline = '', subline, kicker_meta, texture, credit, video_url,
    panel_height = 560, panel_fade = 120, headline_size = 66, headline_offset_y = 0,
  } = slide;
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      {/* Video zone. In the live preview this plays the downloaded source
          (served from the design's output dir) so the framing is judgeable
          before compose. Capture mode keeps the flat placeholder — the
          composer only uses the panel strip above `panel_height` anyway. */}
      <ReelVideoZone top={panel_height} fade={panel_fade} paper={surface.bg} videoUrl={video_url} />
      {/* Header panel — everything the composer keeps. */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: panel_height,
        padding: `${PAD - 20}px ${PAD - 8}px 30px`, boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <VWordmark size={34} />
          <VKicker v={v} onSolid={false} meta={kicker_meta} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Inner wrapper so the headline keeps stretching to the panel width
              — aligning the flex column itself would shrink-wrap it. */}
          <div {...alignBlock(slide,
                 { left: PAD - 8, right: PAD - 8, transform: `translateY(${headline_offset_y}px)` },
                 { top: 110 + headline_offset_y, bottom: 70 - headline_offset_y })}>
            <VHeadline text={headline} v={v} size={headline_size} />
            {subline && (
              <div className="vaq-measure" style={{
                marginTop: 26, fontFamily: VAQ.sans, fontWeight: 600, fontSize: 34,
                lineHeight: 1.4, color: VAQ.bodyL, maxWidth: 900,
              }}>{subline}</div>
            )}
          </div>
        </div>
        {credit && (
          <div style={{
            fontFamily: VAQ.mono, fontSize: 20, letterSpacing: '.1em',
            textTransform: 'uppercase', color: VAQ.mutedL, textAlign: 'right',
          }}>{credit}</div>
        )}
      </div>
    </VSlide>
  );
}

// ── REEL-EXPLAINER ────────────────────────────────────────────
// Inverted reel: video on TOP, dark text panel BELOW. The video is the hero and
// the panel is the caption, which is the shape short-form geopolitics accounts
// converged on — a static panel above a small video wastes the part of the frame
// the eye lands on first.
//
// `panel_height` here is the height of the BOTTOM strip, so src/reel.py must
// crop from (canvas - panel_h) and stack [vid] over [panel]. That is what
// `panel_anchor: 'bottom'` signals to the composer — keep the two in sync.
//
// Deliberately NOT the reference's yellow-on-black with a red chip: the only
// accent here is VAQ orange, per the 2026-07-27 two-tone consolidation.
function ReelExplainerSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  // Always the dark counterweight — a paper panel under bright video reads as a
  // different brand, and the reference's contrast is doing real work.
  const surface = surfaceFor(slide, v, 'dark');
  const ink = inkFor(v, surface);
  const {
    headline = '', chip, body, body_label, kicker_meta, texture, credit, video_url,
    panel_height = 760, panel_fade = 160, headline_size = 74, body_size = 30,
  } = slide;
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      {/* Video occupies everything ABOVE the panel. Anchored off the BOTTOM, not
          computed from 1920, so the frame still composes if the design is left
          in instagram-portrait by mistake. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: panel_height, overflow: 'hidden' }}>
        <ReelVideoZone top={0} videoUrl={video_url} />
        {/* Wordmark watermark, over the video, top-right. */}
        <div style={{ position: 'absolute', top: PAD - 24, right: PAD - 8, opacity: .82 }}>
          <VWordmark size={30} onDark />
        </div>
      </div>
      {/* Bottom panel — the strip the composer keeps. The gradient sits INSIDE
          it so the composed MP4 gets the same hand-off the preview shows. */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: panel_height,
        background: surface.bg, boxSizing: 'border-box',
        padding: `${panel_fade * 0.55}px ${PAD - 8}px ${PAD + 40}px`,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
      }}>
        {panel_fade > 0 && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: -panel_fade, height: panel_fade,
            background: `linear-gradient(180deg, ${surface.bg}00 0%, ${surface.bg} 100%)`,
            pointerEvents: 'none',
          }} />
        )}
        {(chip || kicker_meta) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
            {chip && (
              <span style={{
                background: VAQ.orange, color: '#FFF', fontFamily: VAQ.mono, fontWeight: 700,
                fontSize: 22, letterSpacing: '.14em', textTransform: 'uppercase',
                padding: '8px 16px', borderRadius: 3,
              }}>{chip}</span>
            )}
            {kicker_meta && (
              <span style={{
                fontFamily: VAQ.mono, fontSize: 21, letterSpacing: '.14em',
                textTransform: 'uppercase', color: ink.muted,
              }}>{kicker_meta}</span>
            )}
          </div>
        )}
        <VHeadline text={headline} v={v} size={headline_size} onDark />
        {/* The label is a run-in float rather than a sibling: VBody emits <p>,
            so a plain span before it would break onto its own line. Floating it
            shortens only the first line box, which is the effect wanted, and it
            keeps the body going through VBody so [key term], _italic_ and
            **bold** still parse. */}
        {body && (
          <div className="vaq-measure" style={{ marginTop: 24, maxWidth: 980 }}>
            {body_label && (
              <span style={{
                float: 'left', marginRight: 12,
                fontFamily: VAQ.mono, fontWeight: 700, color: VAQ.orange,
                fontSize: body_size, lineHeight: body_size <= 38 ? 1.65 : 1.58,
                letterSpacing: '.06em', textTransform: 'uppercase',
              }}>{body_label}</span>
            )}
            <VBody text={body} v={v} size={body_size} onDark color={ink.body} />
          </div>
        )}
        {credit && (
          <div style={{
            marginTop: 'auto', fontFamily: VAQ.mono, fontSize: 19, letterSpacing: '.1em',
            textTransform: 'uppercase', color: ink.muted,
          }}>{credit}</div>
        )}
      </div>
    </VSlide>
  );
}

// ── ROSTER ────────────────────────────────────────────────────
// A ranked / chronological league table: one row per entry
// (flag · name · value), sized to fit the whole list on one slide, with an
// optional `featured: true` row pulled out in the vertical's accent. Built for
// "every X to do Y" list posts. Rows are authored in YAML as:
//   rows:
//   - {flag: "🇺🇸", name: Orbital Sciences, year: "1990"}
//   - {flag: "🇮🇳", name: Skyroot Aerospace, year: "2026", featured: true}
function RosterSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v);
  const ink = inkFor(v, surface);
  const {
    headline = '', kicker_meta, texture, rows = [], loop,
    headline_size, row_size,
  } = slide;
  const n = rows.length || 1;
  // Shrink type + padding as the list grows so 13+ rows still fit the column.
  const rSize = row_size || (n >= 13 ? 34 : n >= 10 ? 38 : 44);
  const rowPad = n >= 13 ? 16 : n >= 10 ? 20 : 26;
  const rAy = alignFor(slide).ay;
  const rosterY = rAy === 'top' ? 'flex-start' : rAy === 'bottom' ? 'flex-end' : 'center';
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} onDark={surface.onDark} meta={kicker_meta} style={kickerAlign(slide)} />
        {headline && (
          // stretch: the table below owns the column, so the headline takes
          // align_x only — re-anchoring it would drop it onto the rows.
          <div {...alignBlock(slide, { marginTop: 28, marginBottom: 10 }, { stretch: true })}>
            <VHeadline text={headline} v={v} size={headline_size || 58}
              onSolid={surface.onSolid} onDark={surface.onDark} />
          </div>
        )}
        {/* The table is the main block, and it already fills the column — so
            align_y moves it on the flex axis instead of re-anchoring it.
            align_x is left alone: these rows are a three-column table. */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: rosterY }}>
          {rows.map((r, i) => {
            const feat = !!r.featured;
            const nameColor = feat
              ? (surface.onSolid ? '#FFFFFF' : VAQ.inkL)
              : ink.head;
            const yearColor = feat
              ? (surface.onSolid ? '#FFFFFF' : v.accent)
              : ink.muted;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: `${rowPad}px ${feat ? 18 : 0}px`,
                marginLeft: feat ? -18 : 0, marginRight: feat ? -18 : 0,
                borderTop: i === 0 ? 'none' : `1px solid ${ink.hair}`,
                borderRadius: feat ? 10 : 0,
                borderLeft: feat ? `5px solid ${v.accent}` : 'none',
                paddingLeft: feat ? 16 : 0,
                background: feat
                  ? (surface.onSolid ? 'rgba(255,255,255,.16)' : v.tint)
                  : 'transparent',
              }}>
                <span style={{ fontSize: Math.round(rSize * 1.04), lineHeight: 1,
                  width: Math.round(rSize * 1.5), flex: 'none', textAlign: 'center' }}>{r.flag}</span>
                <span style={{ fontFamily: VAQ.sans, fontWeight: feat ? 800 : 600, fontSize: rSize,
                  letterSpacing: '-.01em', color: nameColor, flex: 1 }}>{r.name}</span>
                <span style={{ fontFamily: metaFontFor(v), fontWeight: 700, fontSize: Math.round(rSize * 0.84),
                  letterSpacing: '.04em', color: yearColor }}>{r.year}</span>
              </div>
            );
          })}
        </div>
          <VLoop text={loop} v={v} onSolid={surface.onSolid} onDark={surface.onDark} />
        <div style={{ height: CHROME_H - 58 }} />
      </div>
      <VChrome n={index + 1} onSolid={surface.onSolid} onDark={surface.onDark} v={v} />
    </VSlide>
  );
}

// ── GEO ───────────────────────────────────────────────────────
// Real country geometry, decoded from the bundled Natural Earth 110m set
// (shared/geo/). Countries are picked by name, highlighted in the brand
// palette, and optionally joined by dotted flow lines.
//
// Projection is equirectangular (x = lon + 180, y = 90 - lat), which is what
// lets `region` be a plain viewBox crop and lets markers take real lat/lon.

const _px = (lon) => lon + 180;
const _py = (lat) => 90 - lat;

function _pathOf(rings) {
  if (!rings) return '';
  return rings.map((r) => 'M' + r.map((p) => `${_px(p[0]).toFixed(2)},${_py(p[1]).toFixed(2)}`).join('L') + 'Z').join(' ');
}

// The base map is one path for all 177 countries — built once, not per slide.
let _BASE_PATH = null;
function _basePath() {
  if (_BASE_PATH === null) _BASE_PATH = window.GEO ? _pathOf(window.GEO.allRings()) : '';
  return _BASE_PATH;
}
const _countryPathCache = {};
function _countryPath(name) {
  const key = window.GEO && window.GEO.resolve(name);
  if (!key) return '';
  if (!(key in _countryPathCache)) _countryPathCache[key] = _pathOf(window.GEO.rings(key));
  return _countryPathCache[key];
}

// Distinct brand accents, cycled so a multi-country selection is legible
// without the author picking colours by hand.
const _BRAND_CYCLE = ['#F4631E', '#2F6BE0', '#0FA08C', '#9A3F73', '#FF3333', '#2540FF', '#E0554E'];

// A map wants water, not newsprint — so this layout runs its own deep-navy
// palette instead of the daylight-newsroom surface tokens. All three are
// per-slide overridable.
const _OCEAN_DEFAULT  = '#0A1F3C';
const _LANDC_DEFAULT  = '#17395E';
const _BORDER_DEFAULT = 'rgba(255,255,255,.16)';

// A vertical's accent can sit very close to the navy ocean (the briefing blue
// vanishes on it), so flow lines and labels default to whatever reads against
// the water rather than to v.accent. Authors can still name any colour.
function _isDark(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return true;                       // rgba()/unknown → assume dark water
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
}

// [lonMin, latMin, lonMax, latMax]
const _REGIONS = {
  'world':          [-180, -58, 180,  84],
  'africa':         [ -20, -37,  55,  38],
  'europe':         [ -14,  33,  46,  72],
  'asia':           [  40, -12, 150,  58],
  'south-asia':     [  55,   0, 105,  38],
  'southeast-asia': [  90, -12, 142,  29],
  'east-asia':      [  95,  18, 148,  54],
  'central-asia':   [  46,  33,  92,  56],
  'middle-east':    [  25,  10,  65,  45],
  'north-america':  [-170,   7, -50,  72],
  'south-america':  [ -82, -56, -33,  13],
  'americas':       [-130, -56, -32,  72],
  'oceania':        [ 110, -48, 180,   0],
  'indo-pacific':   [  55, -48, 180,  46],
};

// Pan, authored with the editor's X/Y sliders as "50% 50%" (centred). 0% pulls
// the window west / north, 100% east / south, at one full screen of travel each
// way. Y is inverted against latitude: dragging the slider down moves the view
// south, which is a decreasing latitude.
function _parsePan(s) {
  if (!s) return { fx: 0, fy: 0 };
  const parts = String(s).trim().split(/\s+/);
  const px = parseFloat(parts[0]);
  const py = parseFloat(parts.length > 1 ? parts[1] : parts[0]);
  return {
    fx: isFinite(px) ? (px - 50) / 50 : 0,
    fy: isFinite(py) ? (50 - py) / 50 : 0,
  };
}

// Camera box around whatever the slide actually references — highlighted
// countries, pins, and any country named only by a link. This is what makes
// the crop follow the content: add Indonesia to an India slide and the view
// widens to hold both, with no region to pick by hand.
function _autoBounds(countries, markers, links) {
  if (!window.GEO) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, any = false;
  const add = (a, b, c, d) => {
    if (![a, b, c, d].every(isFinite)) return;
    x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c); y1 = Math.max(y1, d); any = true;
  };
  const byName = (n) => { const bb = window.GEO.bboxFit(n); if (bb) add(bb[0], bb[1], bb[2], bb[3]); };
  (countries || []).forEach((c) => byName(typeof c === 'string' ? c : (c && c.name)));
  (links || []).forEach((l) => { if (l) { byName(l.from); byName(l.to); } });
  (markers || []).forEach((m) => {
    if (m && m.lon != null && m.lat != null) add(+m.lon, +m.lat, +m.lon, +m.lat);
  });
  return any ? [x0, y0, x1, y1] : null;
}

function GeoSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v);
  const {
    headline = '', body, kicker_meta, texture, map_caption, map_credit,
    region = 'auto', zoom = 1, map_padding = 0.18,
    map_pan, center_lon, center_lat,
    countries = [], links = [], markers = [],
    graticule = false, borders = true, labels = true,
    ocean = _OCEAN_DEFAULT, land_color = _LANDC_DEFAULT, border_color = _BORDER_DEFAULT,
    map_height, marker_size = 16, label_size = 26,
    headline_size, body_size = 42, headline_offset_y = 0, body_offset_y = 0,
  } = slide;
  const ink = inkFor(v, surface);
  const hSize = headline_size || headlineDefaultSize(v, 'inner');

  // 'auto' (the default) frames whatever the slide references and falls back to
  // the world when nothing is selected yet. A named region pins the crop.
  let R = _REGIONS[region];
  if (!R) {
    const fit = _autoBounds(countries, markers, links);
    if (fit) {
      // Floors stop a single small country (Singapore, Bahrain) zooming to an
      // absurd scale where the simplified coastline falls apart.
      const cx = (fit[0] + fit[2]) / 2, cy = (fit[1] + fit[3]) / 2;
      const p = 1 + Math.max(0, Number(map_padding)) * 2;
      const w = Math.max(fit[2] - fit[0], 7) * p;
      const h = Math.max(fit[3] - fit[1], 6) * p;
      R = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
    } else {
      R = _REGIONS.world;
    }
  }
  // Absolute recentre, for putting the camera somewhere specific rather than
  // nudging from wherever the fit landed. Keeps the current span.
  if (center_lon != null || center_lat != null) {
    const w = R[2] - R[0], h = R[3] - R[1];
    const cx = center_lon != null ? Number(center_lon) : (R[0] + R[2]) / 2;
    const cy = center_lat != null ? Number(center_lat) : (R[1] + R[3]) / 2;
    if (isFinite(cx) && isFinite(cy)) R = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
  }
  // Zoom scales the crop about its own centre — works on auto fits and named
  // regions alike. >1 moves closer, <1 pulls back.
  const z = Number(zoom) > 0 ? Number(zoom) : 1;
  if (z !== 1) {
    const cx = (R[0] + R[2]) / 2, cy = (R[1] + R[3]) / 2;
    const w = (R[2] - R[0]) / z, h = (R[3] - R[1]) / z;
    R = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
  }
  // Panel height is bounded — a tall region must never push the body off the
  // slide. The crop is then widened to the panel's aspect (rather than the
  // panel bent to the region's), so preserveAspectRatio="none" never distorts.
  const PANEL_W = 1080 - PAD * 2;
  const mH = map_height || Math.max(300, Math.min(470,
    Math.round(PANEL_W * (R[3] - R[1]) / (R[2] - R[0]))));
  let [lonMin, latMin, lonMax, latMax] = R;
  const wantAR = PANEL_W / mH;
  if ((lonMax - lonMin) / (latMax - latMin) < wantAR) {
    const need = (latMax - latMin) * wantAR, c = (lonMin + lonMax) / 2;
    lonMin = c - need / 2; lonMax = c + need / 2;
  } else {
    const need = (lonMax - lonMin) / wantAR, c = (latMin + latMax) / 2;
    latMin = c - need / 2; latMax = c + need / 2;
  }
  const spanX = lonMax - lonMin, spanY = latMax - latMin;
  // Pan last, so a nudge is measured against the window you can actually see
  // rather than the pre-aspect crop. Deliberately unclamped — panning off the
  // edge into open ocean is a legitimate composition.
  const _pan = _parsePan(map_pan);
  if (_pan.fx || _pan.fy) {
    const dx = _pan.fx * spanX, dy = _pan.fy * spanY;
    lonMin += dx; lonMax += dx; latMin += dy; latMax += dy;
  }
  // Degrees per screen pixel. SVG <circle r> is in user units, so an endpoint
  // dot sized in raw px balloons into a blob as soon as the crop zooms in —
  // convert px→degrees instead. (Strokes escape this via non-scaling-stroke.)
  const uPerPx = spanX / PANEL_W;
  const onWater = _isDark(ocean) ? '#FFFFFF' : '#0A1F3C';
  const capParts = [map_caption, map_credit].filter(Boolean);

  // Countries may be authored as bare strings ("India") or objects with their
  // own colour/label. Unspecified colours walk the brand cycle, starting from
  // the vertical's own accent so a single selection looks native to the show.
  const cycle = [v.accent].concat(_BRAND_CYCLE.filter((c) => c !== v.accent));
  const picked = (Array.isArray(countries) ? countries : []).map((c, i) => {
    const o = typeof c === 'string' ? { name: c } : (c || {});
    return {
      name: o.name, label: o.label != null ? o.label : o.name,
      color: o.color || cycle[i % cycle.length],
      opacity: o.opacity != null ? Number(o.opacity) : 1,
      d: _countryPath(o.name),
      c: window.GEO ? window.GEO.centroid(o.name) : null,
    };
  }).filter((c) => c.name);
  const missing = picked.filter((c) => !c.d).map((c) => c.name);

  const pctX = (lon) => (lon - lonMin) / spanX * 100;
  const pctY = (lat) => (latMax - lat) / spanY * 100;

  const grat = [];
  if (graticule) {
    for (let lon = Math.ceil(lonMin / 30) * 30; lon <= lonMax; lon += 30)
      grat.push(<line key={`m${lon}`} x1={_px(lon)} y1={_py(latMax)} x2={_px(lon)} y2={_py(latMin)}
        stroke="#FFFFFF" strokeOpacity={0.1} strokeWidth={1} vectorEffect="non-scaling-stroke" />);
    for (let lat = Math.ceil(latMin / 30) * 30; lat <= latMax; lat += 30)
      grat.push(<line key={`p${lat}`} x1={_px(lonMin)} y1={_py(lat)} x2={_px(lonMax)} y2={_py(lat)}
        stroke="#FFFFFF" strokeOpacity={0.1} strokeWidth={1} vectorEffect="non-scaling-stroke" />);
  }

  // Flow lines. Endpoints resolve through the same country index, so links are
  // authored by name too. The arc is a quadratic bezier bowed perpendicular to
  // the chord; dash/gap are screen px thanks to non-scaling-stroke.
  const flows = (Array.isArray(links) ? links : []).map((l, i) => {
    if (!l || !window.GEO) return null;
    const a = window.GEO.centroid(l.from), b = window.GEO.centroid(l.to);
    if (!a || !b) return null;
    const x1 = _px(a[0]), y1 = _py(a[1]), x2 = _px(b[0]), y2 = _py(b[1]);
    const dx = x2 - x1, dy = y2 - y1;
    const bow = l.curve != null ? Number(l.curve) : 0.18;
    const cx = (x1 + x2) / 2 - dy * bow, cy = (y1 + y2) / 2 + dx * bow;
    const w = l.width != null ? Number(l.width) : 4;
    const dash = l.dash != null ? Number(l.dash) : 0.1;
    const gap = l.gap != null ? Number(l.gap) : 14;
    return {
      key: i, d: `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`,
      color: l.color || onWater, w, dash, gap,
      opacity: l.opacity != null ? Number(l.opacity) : 0.95,
      animate: l.animate === true,
      ends: [[x1, y1], [x2, y2]],
    };
  }).filter(Boolean);

  return (
    <VSlide v={v} surface={surface} texture={texture}>
      {/* Motion is preview-only: render.py screenshots a single frame, and
          body.capture freezes it so PNG output stays deterministic. */}
      <style>{`
        @keyframes vaqGeoDash { to { stroke-dashoffset: -400; } }
        .vaq-geo-flow { animation: vaqGeoDash 12s linear infinite; }
        body.capture .vaq-geo-flow { animation: none; }
      `}</style>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} onDark={surface.onDark} meta={kicker_meta} style={kickerAlign(slide)} />
        <div {...alignBlock(slide, { left: 0, right: 0 }, { top: 110, bottom: CHROME_H - 40 })}>
          <div style={{ marginTop: 46, transform: `translateY(${headline_offset_y}px)` }}>
            <VHeadline text={headline} v={v} size={hSize} onSolid={surface.onSolid} onDark={surface.onDark} />
          </div>
          <div style={{ marginTop: 44 }}>
            <div style={{
              position: 'relative', borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${ink.hair}`, height: mH, background: ocean,
            }}>
              <svg viewBox={`${_px(lonMin)} ${_py(latMax)} ${spanX} ${spanY}`} preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
                {grat}
                <path d={_basePath()} fill={land_color} fillRule="evenodd"
                  stroke={borders ? border_color : 'none'} strokeWidth={borders ? 1 : 0}
                  vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                {picked.map((c, i) => c.d && (
                  <path key={i} d={c.d} fill={c.color} fillOpacity={c.opacity} fillRule="evenodd"
                    stroke={c.color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                ))}
                {flows.map((f) => (
                  <g key={f.key} opacity={f.opacity}>
                    <path className={f.animate ? 'vaq-geo-flow' : undefined}
                      d={f.d} fill="none" stroke={f.color} strokeWidth={f.w}
                      strokeLinecap="round" strokeDasharray={`${f.dash} ${f.gap}`}
                      vectorEffect="non-scaling-stroke" />
                    {f.ends.map((p, ei) => (
                      <circle key={ei} cx={p[0]} cy={p[1]} r={f.w * 0.9 * uPerPx} fill={f.color} />
                    ))}
                  </g>
                ))}
              </svg>

              {/* Labels and pins are HTML on top of the SVG — type must not
                  scale with the region crop. */}
              {labels && picked.map((c, i) => c.c && c.label && (
                <div key={i} style={{
                  position: 'absolute', left: `${pctX(c.c[0])}%`, top: `${pctY(c.c[1])}%`,
                  transform: 'translate(-50%,-50%)', whiteSpace: 'nowrap', pointerEvents: 'none',
                  fontFamily: bodyFontFor(v), fontWeight: 800, fontSize: label_size,
                  letterSpacing: '-.01em', color: onWater,
                  textShadow: _isDark(ocean) ? '0 1px 3px rgba(0,0,0,.85), 0 0 10px rgba(0,0,0,.6)'
                                             : '0 0 6px rgba(255,255,255,.95)',
                }}>{c.label}</div>
              ))}

              {markers.map((m, i) => {
                const mx = m.x != null ? Number(m.x) : pctX(Number(m.lon));
                const my = m.y != null ? Number(m.y) : pctY(Number(m.lat));
                if (!isFinite(mx) || !isFinite(my)) return null;
                const leftSide = m.align === 'left';
                const pin = m.color || v.accent;
                const halo = _isDark(ocean) ? '0 1px 3px rgba(0,0,0,.85), 0 0 10px rgba(0,0,0,.6)'
                                           : '0 0 6px rgba(255,255,255,.95)';
                return (
                  <div key={i} style={{ position: 'absolute', left: `${mx}%`, top: `${my}%`, transform: 'translate(-50%,-50%)' }}>
                    {m.ring && [3.1, 1.95].map((k, ri) => (
                      <div key={ri} style={{
                        position: 'absolute', left: '50%', top: '50%',
                        width: marker_size * k * 2, height: marker_size * k * 2,
                        transform: 'translate(-50%,-50%)', borderRadius: '50%',
                        border: `2px solid ${pin}`, opacity: ri === 0 ? 0.22 : 0.42,
                      }} />
                    ))}
                    <div style={{
                      position: 'relative', width: marker_size, height: marker_size, borderRadius: '50%',
                      background: pin, boxShadow: `0 0 0 4px rgba(0,0,0,.45)`,
                    }} />
                    {(m.label || m.sublabel) && (
                      <div style={{
                        position: 'absolute', top: -6, whiteSpace: 'nowrap',
                        textAlign: leftSide ? 'right' : 'left',
                        [leftSide ? 'right' : 'left']: marker_size + 12,
                      }}>
                        {m.label && (
                          <div style={{
                            fontFamily: bodyFontFor(v), fontWeight: 800, fontSize: 27,
                            letterSpacing: '-.01em', color: onWater, lineHeight: 1.1, textShadow: halo,
                          }}>{m.label}</div>
                        )}
                        {m.sublabel && (
                          <div style={{
                            marginTop: 3, fontFamily: metaFontFor(v), fontSize: 17,
                            letterSpacing: '.1em', textTransform: 'uppercase',
                            color: pin, textShadow: halo,
                          }}>{m.sublabel}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Fail loudly in the editor rather than silently dropping a
                  country the author misspelled. */}
              {missing.length > 0 && (
                <div style={{
                  position: 'absolute', left: 14, bottom: 12, padding: '6px 12px', borderRadius: 6,
                  background: 'rgba(220,38,38,.92)', color: '#fff',
                  fontFamily: VAQ.mono, fontSize: 15, letterSpacing: '.06em',
                }}>UNKNOWN: {missing.join(', ')}</div>
              )}
            </div>
            {capParts.length > 0 && (
              <div style={{
                marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 20,
                fontFamily: metaFontFor(v), fontSize: 20, letterSpacing: '.08em', color: ink.muted,
              }}>
                <span>{map_caption || ''}</span>
                <span style={{ textTransform: 'uppercase' }}>{map_credit || ''}</span>
              </div>
            )}
          </div>
          {body && (
            <div style={{ marginTop: 46, transform: `translateY(${body_offset_y}px)` }}>
              <VBody text={body} v={v} size={body_size} onSolid={surface.onSolid} onDark={surface.onDark} />
            </div>
          )}
        </div>
        <div style={{ height: CHROME_H - 20 }} />
      </div>
      <VChrome n={index + 1} onSolid={surface.onSolid} onDark={surface.onDark} v={v} />
    </VSlide>
  );
}


// ── CHART SHELL ───────────────────────────────────────────────
// Every chart layout is the same slide: kicker, headline, the plot, an
// optional legend, an optional source line. Only the plot differs.
function VChartSlide({ slide, index, children, legend }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v);
  const {
    headline, kicker_meta, texture, source, body, loop,
    headline_size, body_size = 38, chart_offset_y = 0,
  } = slide;
  const viz = vizFor(v, surface);
  const hSize = headline_size || 68;
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} onDark={surface.onDark} meta={kicker_meta} style={kickerAlign(slide)} />
        {headline && (
          <div style={{ marginTop: 30 }}>
            <VHeadline text={headline} v={v} size={hSize} onSolid={surface.onSolid} onDark={surface.onDark} />
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          transform: `translateY(${chart_offset_y}px)` }}>
          <div style={{ marginTop: 40 }}>{children}</div>
          {legend}
          <VSource text={source} v={v} viz={viz} />
          {body && (
            <div style={{ marginTop: 30 }}>
              <VBody text={body} v={v} size={body_size} onSolid={surface.onSolid} onDark={surface.onDark} />
            </div>
          )}
          <VLoop text={loop} v={v} onSolid={surface.onSolid} onDark={surface.onDark} />
        </div>
        {/* Full chrome clearance: a chart's source line is the last thing on
            the slide and lands closest to the page number. */}
        <div style={{ height: CHROME_H }} />
      </div>
      <VChrome n={index + 1} onSolid={surface.onSolid} onDark={surface.onDark} v={v} />
    </VSlide>
  );
}

// ── BAR-CHART ─────────────────────────────────────────────────
// Horizontal bars: long Indian category names don't fit under a column.
// mode: emphasis (default — the subject in orange, the field in slate)
//     · sequence (ordinal orange ramp, for genuinely ordered bands)
//     · stack    (one bar, part-to-whole, 2px surface gaps, legend required)
function BarChartSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v);
  const viz = vizFor(v, surface);
  const {
    mode = 'emphasis', rows, value_prefix = '', value_suffix = '', decimals,
    max, bar_size = VIZ.bar, label_size = 30,
  } = slide;
  const data = vizRows(rows);
  if (!data.length) return <VChartSlide slide={slide} index={index}><div /></VChartSlide>;

  const total = data.reduce((a, r) => a + r.value, 0);
  const top = Number(max) || Math.max(...data.map(r => r.value));

  // ---- stack: one bar, segments in the ordinal ramp, legend carries identity
  if (mode === 'stack') {
    const legend = (
      <VLegend v={v} viz={viz} items={data.map((r, i) => ({
        name: `${r.label} · ${vizFmt(r.value, value_prefix, value_suffix, decimals)}`,
        color: r.color || viz.ramp[i % viz.ramp.length],
      }))} />
    );
    return (
      <VChartSlide slide={slide} index={index} legend={legend}>
        <div style={{ display: 'flex', width: '100%', height: bar_size * 1.9, borderRadius: VIZ.round,
          overflow: 'hidden', gap: VIZ.gap }}>
          {data.map((r, i) => {
            const pct = total ? (r.value / total) * 100 : 0;
            const fill = r.color || viz.ramp[i % viz.ramp.length];
            // Only label inside the segment when the text genuinely fits.
            const room = (pct / 100) * (1080 - PAD * 2);
            const txt = vizFmt(r.value, value_prefix, value_suffix, decimals);
            const fits = room > txt.length * 20 + 44;
            return (
              <div key={i} style={{ width: `${pct}%`, background: fill, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                {fits && <span style={vizNum(v, label_size, i >= 2 ? '#FFFFFF' : '#3A1402', 700)}>{txt}</span>}
              </div>
            );
          })}
        </div>
      </VChartSlide>
    );
  }

  // ---- diverge: above/below a baseline. Warm pole (orange) reads positive,
  // cool pole (slate) negative, with the surface itself as the neutral
  // midpoint — never a third hue sitting at zero.
  if (mode === 'diverge') {
    const maxAbs = Number(max) || Math.max(...data.map(r => Math.abs(r.value))) || 1;
    return (
      <VChartSlide slide={slide} index={index}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 38 }}>
          {data.map((r, i) => {
            const neg = r.value < 0;
            const w = (Math.abs(r.value) / maxAbs) * 50;
            return (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                  marginBottom: 12, gap: 24 }}>
                  <span style={{ fontFamily: bodyFontFor(v), fontWeight: 700, fontSize: label_size + 4,
                    color: viz.ink.head, letterSpacing: '-.01em' }}>{r.label}</span>
                  <span style={vizNum(v, label_size + 6, viz.ink.head, 700)}>
                    {(r.value > 0 ? '+' : '') + vizFmt(r.value, value_prefix, value_suffix, decimals)}
                  </span>
                </div>
                <div style={{ position: 'relative', width: '100%', height: bar_size }}>
                  <div style={{ position: 'absolute', left: '50%', top: -6, bottom: -6, width: VIZ.hair,
                    background: viz.axis }} />
                  <div style={{ position: 'absolute', top: 0, height: bar_size,
                    left: neg ? `${50 - w}%` : '50%', width: `${w}%`,
                    background: neg ? viz.ctx : viz.accent,
                    borderRadius: neg ? `${VIZ.round}px 0 0 ${VIZ.round}px` : `0 ${VIZ.round}px ${VIZ.round}px 0` }} />
                </div>
                {r.note && (
                  <div style={{ marginTop: 12, fontFamily: metaFontFor(v), fontSize: 20, letterSpacing: '.04em',
                    color: viz.ink.muted }}>{r.note}</div>
                )}
              </div>
            );
          })}
        </div>
      </VChartSlide>
    );
  }

  // ---- emphasis / sequence: a row per bar, value directly labelled at the tip
  const anyEm = data.some(r => r.emphasis);
  return (
    <VChartSlide slide={slide} index={index}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
        {data.map((r, i) => {
          const pct = top ? Math.max(0, (r.value / top)) * 100 : 0;
          const fill = r.color
            || (mode === 'sequence' ? viz.ramp[Math.min(i, viz.ramp.length - 1)]
            : (anyEm ? (r.emphasis ? viz.accent : viz.ctx) : viz.accent));
          return (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                marginBottom: 12, gap: 24 }}>
                <span style={{ fontFamily: bodyFontFor(v), fontWeight: r.emphasis ? 800 : 600, fontSize: label_size + 4,
                  color: r.emphasis || !anyEm ? viz.ink.head : viz.ink.body, letterSpacing: '-.01em' }}>{r.label}</span>
                <span style={vizNum(v, label_size + 6, r.emphasis || !anyEm ? viz.ink.head : viz.ink.body, 700)}>
                  {vizFmt(r.value, value_prefix, value_suffix, decimals)}
                </span>
              </div>
              {/* track is the surface, not a filled block: the bar is the only ink */}
              <div style={{ width: '100%', height: bar_size, background: 'transparent',
                borderTop: `${VIZ.hair}px solid ${viz.grid}` , paddingTop: 0 }}>
                <div style={{ width: `${pct}%`, height: bar_size, background: fill,
                  borderRadius: `0 ${VIZ.round}px ${VIZ.round}px 0` }} />
              </div>
              {r.note && (
                <div style={{ marginTop: 10, fontFamily: metaFontFor(v), fontSize: 20, letterSpacing: '.04em',
                  color: viz.ink.muted }}>{r.note}</div>
              )}
            </div>
          );
        })}
      </div>
    </VChartSlide>
  );
}

// ── LINE-CHART ────────────────────────────────────────────────
// Trend over time. One series is the norm (no legend — the headline names
// it); a second is allowed and takes slate, with a legend. Labels are
// SELECTIVE: first, last, and the extreme — never a number on every point.
function LineChartSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v);
  const viz = vizFor(v, surface);
  const {
    series, x_labels = [], y_min, y_max, value_prefix = '', value_suffix = '',
    decimals, area = false, label_size = 26, chart_height = 470,
  } = slide;

  const sets = (Array.isArray(series) ? series : []).slice(0, 2).map((s, i) => ({
    name: s.name || '',
    values: (Array.isArray(s.values) ? s.values : []).map(Number),
    color: i === 0 ? viz.accent : viz.ctx,
  })).filter(s => s.values.length > 1);
  if (!sets.length) return <VChartSlide slide={slide} index={index}><div /></VChartSlide>;

  const all = sets.flatMap(s => s.values);
  const lo = y_min !== undefined && y_min !== null && y_min !== '' ? Number(y_min) : Math.min(...all);
  const hi = y_max !== undefined && y_max !== null && y_max !== '' ? Number(y_max) : Math.max(...all);
  const span = hi - lo || 1;
  const W = 1080 - PAD * 2, H = chart_height;
  const PADL = 8, PADR = 8, PADT = 46, PADB = 8;               // room for the end label
  const px = (i, n) => PADL + (i / (n - 1)) * (W - PADL - PADR);
  const py = (val) => PADT + (1 - (val - lo) / span) * (H - PADT - PADB);

  const legend = sets.length > 1
    ? <VLegend v={v} viz={viz} items={sets.map(s => ({ name: s.name, color: s.color }))} />
    : null;

  return (
    <VChartSlide slide={slide} index={index} legend={legend}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        {/* solid hairline gridlines, one step off the surface — never dashed */}
        {[0, 0.5, 1].map((f, i) => (
          <line key={i} x1={0} x2={W} y1={PADT + f * (H - PADT - PADB)} y2={PADT + f * (H - PADT - PADB)}
            stroke={f === 1 ? viz.axis : viz.grid} strokeWidth={VIZ.hair} />
        ))}
        {sets.map((s, si) => {
          const n = s.values.length;
          const d = s.values.map((val, i) => `${i ? 'L' : 'M'}${px(i, n)},${py(val)}`).join(' ');
          const areaD = `${d} L${px(n - 1, n)},${H - PADB} L${px(0, n)},${H - PADB} Z`;
          const iMax = s.values.indexOf(Math.max(...s.values));
          // first, last, and the peak — the three that carry the story
          const marks = [...new Set([0, iMax, n - 1])];
          return (
            <g key={si}>
              {area && si === 0 && <path d={areaD} fill={s.color} opacity={0.10} />}
              <path d={d} fill="none" stroke={s.color} strokeWidth={VIZ.line}
                strokeLinejoin="round" strokeLinecap="round" />
              {marks.map((i) => (
                <g key={i}>
                  {/* 2px surface ring keeps the dot legible where it crosses */}
                  <circle cx={px(i, n)} cy={py(s.values[i])} r={VIZ.dot}
                    fill={s.color} stroke={surface.bg} strokeWidth={VIZ.gap} />
                  <text x={px(i, n)} y={py(s.values[i]) - VIZ.dot - 16} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                    style={vizNum(v, label_size, viz.ink.head, 700)}>
                    {vizFmt(s.values[i], value_prefix, value_suffix, decimals)}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      {x_labels.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          {x_labels.map((l, i) => (
            <span key={i} style={{ fontFamily: metaFontFor(v), fontSize: 22, letterSpacing: '.06em',
              textTransform: 'uppercase', color: viz.ink.muted }}>{l}</span>
          ))}
        </div>
      )}
    </VChartSlide>
  );
}

// ── PICTOGRAM ─────────────────────────────────────────────────
// A unit chart: N cells, the share of them filled. The one chart form the
// Venngage piece singles out for social, and the right one for a proportion
// read at arm's length — a phone reader counts blocks faster than they read
// a pie's angles.
function PictogramSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v);
  const viz = vizFor(v, surface);
  const {
    value = 0, total = 100, columns = 10, unit_label, sublabel,
    value_suffix = '%', value_prefix = '', decimals, shape = 'square',
    grid_height = 560, figure_size = 132,
  } = slide;
  const n = Math.max(1, Math.round(Number(total) || 100));
  const cols = Math.max(1, Math.round(Number(columns) || 10));
  // Fill exactly, not to the nearest whole cell: 88.5% of a 100-cell grid is
  // 88 blocks and a half, and rounding it to 89 would put a number on the
  // plot that contradicts the label printed right above it.
  const exact = (Number(value) / (Number(total) === 100 ? 100 : n)) * n;
  const full = Math.max(0, Math.floor(exact + 1e-9));
  const frac = Math.min(1, Math.max(0, exact - full));
  const W = 1080 - PAD * 2;
  const rows = Math.ceil(n / cols);
  // Fit the grid to BOTH axes. Sizing off the width alone overflows the canvas
  // as soon as the row count climbs (a 100-cell 10-wide grid is square, and a
  // square 936px grid does not fit under a headline on a 1350px slide).
  const gap = VIZ.gap * 2;
  const cell = Math.max(8, Math.min(
    Math.floor((W - (cols - 1) * gap) / cols),
    Math.floor(((Number(grid_height) || 560) - (rows - 1) * gap) / rows),
  ));

  return (
    <VChartSlide slide={slide} index={index}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, marginBottom: 34 }}>
          {/* Deliberate deviation from the dataviz "hero figure = the UI sans"
              rule: Archivo display numerals ARE the VAQ voice (the `stat`
              layout is built on them), so the sans would read as the foreign
              element here — the inverse of what that rule guards against. */}
          <span style={{ fontFamily: VAQ.display, fontWeight: 900, fontSize: figure_size, lineHeight: 0.9,
            letterSpacing: '-.03em', color: surface.onSolid ? viz.ink.head : viz.accent }}>
            {vizFmt(value, value_prefix, value_suffix, decimals)}
          </span>
          {unit_label && (
            <span style={{ fontFamily: bodyFontFor(v), fontWeight: 700, fontSize: 38, color: viz.ink.head,
              letterSpacing: '-.01em' }}>{unit_label}</span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
          gap: VIZ.gap * 2, width: 'max-content' }}>
          {Array.from({ length: rows * cols }).map((_, i) => {
            if (i >= n) return <span key={i} />;
            const radius = shape === 'dot' ? '50%' : 4;
            const empty = { width: cell, height: cell, background: viz.ctx, opacity: 0.34,
                            borderRadius: radius, display: 'block' };
            if (i < full) return <span key={i} style={{ ...empty, background: viz.accent, opacity: 1 }} />;
            // The partial cell's two halves are SIBLINGS, not nested: opacity
            // on a parent clamps its children, so a 0.34 track would wash the
            // filled part out to a tint of the accent.
            if (i === full && frac > 0.02) return (
              <span key={i} style={{ width: cell, height: cell, borderRadius: radius,
                position: 'relative', overflow: 'hidden', display: 'block' }}>
                <span style={{ position: 'absolute', inset: 0, background: viz.ctx, opacity: 0.34 }} />
                <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0,
                  width: `${frac * 100}%`, background: viz.accent }} />
              </span>
            );
            return <span key={i} style={empty} />;
          })}
        </div>
        {sublabel && (
          <div style={{ marginTop: 30, fontFamily: bodyFontFor(v), fontWeight: 600, fontSize: 32,
            color: viz.ink.body, letterSpacing: '-.01em' }}>{sublabel}</div>
        )}
      </div>
    </VChartSlide>
  );
}

// ── PIE-CHART ─────────────────────────────────────────────────
// Part-to-whole, at a glance only. The rules that keep it honest:
//   · 6 slices maximum. Past that adjacent classes blur and it wants a table.
//   · Never for comparing close values — that is a bar. Use this when the
//     reader's question is "how is the whole divided", not "which is bigger".
//   · Never 2 slices. That is a stat tile with extra ink.
//
// COLOUR: this is the one layout that leaves the two-tone system, because a
// part-to-whole needs true categorical identity and VAQ has one accent. Slice
// colours come from the dataviz skill's documented palette, re-validated
// against VAQ's own surfaces INCLUDING the ring-closure pair (in a pie the
// last slice touches the first, which a linear pairlist never tests):
//   node scripts/validate_palette.js "#c98500,#199e70,#3987e5,#d55181,#008300" \
//        --mode dark --surface "#1E1E1E"          → ALL PASS
//   …and the light steps against #F7F9FB          → ALL PASS (contrast WARN,
//   relieved by the direct labels + legend this layout always ships)
// Slot 0 is a NEUTRAL GREY on purpose: in a fossil-vs-clean split the fossil
// share is context, not an identity, and grey separates from every hue on
// lightness rather than hue. Don't hand-pick slice colours — a semantic guess
// put violet beside blue (ΔE 1.9 under protanopia) and red beside magenta.
const PIE_SLOTS_DARK  = ['#8A97A3', '#c98500', '#199e70', '#3987e5', '#d55181', '#008300'];
const PIE_SLOTS_LIGHT = ['#6B7A88', '#eda100', '#1baf7a', '#2a78d6', '#e87ba4', '#008300'];

function PieChartSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v);
  const viz = vizFor(v, surface);
  const {
    rows, value_prefix = '', value_suffix = '', decimals,
    donut = 0.56, size = 440, center_label, center_value,
    show_percent = false, slice_label_size = 26,
  } = slide;
  const data = vizRows(rows).slice(0, 6);
  if (!data.length) return <VChartSlide slide={slide} index={index}><div /></VChartSlide>;

  const slots = surface.onDark ? PIE_SLOTS_DARK : PIE_SLOTS_LIGHT;
  const total = data.reduce((a, r) => a + r.value, 0) || 1;
  const R = size / 2, r = R * Math.max(0, Math.min(0.85, donut));
  const C = size / 2 + 10;                 // a little air for the gap stroke
  const S = size + 20;

  // Arc geometry. Angles run clockwise from 12 o'clock.
  const pt = (rad, ang) => [C + rad * Math.sin(ang), C - rad * Math.cos(ang)];
  let acc = 0;
  const slices = data.map((row, i) => {
    const frac = row.value / total;
    const a0 = acc * 2 * Math.PI, a1 = (acc + frac) * 2 * Math.PI;
    acc += frac;
    const big = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = pt(R, a0), [x1, y1] = pt(R, a1);
    const [u1, w1] = pt(r, a1), [u0, w0] = pt(r, a0);
    const d = r > 0
      ? `M${x0},${y0} A${R},${R} 0 ${big} 1 ${x1},${y1} L${u1},${w1} A${r},${r} 0 ${big} 0 ${u0},${w0} Z`
      : `M${C},${C} L${x0},${y0} A${R},${R} 0 ${big} 1 ${x1},${y1} Z`;
    const mid = (a0 + a1) / 2;
    const [lx, ly] = pt(r > 0 ? (R + r) / 2 : R * 0.62, mid);
    return { ...row, frac, d, lx, ly, color: row.color || slots[i % slots.length] };
  });

  // On-slice labels carry the bare number: the unit is on every legend row, and
  // a suffix like " GW" is what pushes the text past the ring band.
  const fmt = (row) => show_percent
    ? `${Math.round(row.frac * 100)}%`
    : vizFmt(row.value, '', '', decimals);
  // Space Mono advances ~0.6em. A donut label has the ring's width to live in;
  // a pie label has the radius. Anything that doesn't fit goes to the legend
  // rather than being drawn over its own edge.
  const band = r > 0 ? (R - r) : R * 0.8;
  const fits = (row) => fmt(row).length * slice_label_size * 0.62 < band - 14;

  const legend = (
    <VLegend v={v} viz={viz} items={slices.map(s => ({
      name: `${s.label} · ${vizFmt(s.value, value_prefix, value_suffix, decimals)}`,
      color: s.color,
    }))} />
  );

  return (
    <VChartSlide slide={slide} index={index} legend={legend}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ display: 'block', overflow: 'visible' }}>
          {slices.map((s, i) => (
            // 2px surface gap, drawn as a stroke in the surface colour — never
            // a border, which would add ink that isn't data.
            <path key={i} d={s.d} fill={s.color} stroke={surface.bg} strokeWidth={VIZ.gap}
              strokeLinejoin="round" />
          ))}
          {slices.map((s, i) => {
            // Only label a slice wide enough to hold the text, in both
            // directions. Everything else is carried by the legend, so nothing
            // is gated behind a sliver.
            if (s.frac < 0.09 || !fits(s)) return null;
            return (
              <text key={i} x={s.lx} y={s.ly + 9} textAnchor="middle"
                style={vizNum(v, slice_label_size, _pieInk(s.color), 700)}>{fmt(s)}</text>
            );
          })}
          {(center_value || center_label) && r > 0 && (
            <g>
              {center_value && (
                <text x={C} y={C + (center_label ? 4 : 14)} textAnchor="middle"
                  style={{ fontFamily: VAQ.display, fontWeight: 900, fontSize: 62,
                    letterSpacing: '-.02em', fill: viz.ink.head }}>{center_value}</text>
              )}
              {center_label && (
                <text x={C} y={C + 44} textAnchor="middle"
                  style={{ fontFamily: metaFontFor(v), fontWeight: 700, fontSize: 21,
                    letterSpacing: '.12em', fill: viz.ink.muted }}>{center_label}</text>
              )}
            </g>
          )}
        </svg>
      </div>
    </VChartSlide>
  );
}

// A label sitting INSIDE a coloured fill is the one place text may leave the
// ink tokens: pick white or near-black by the fill's luminance so it always
// clears contrast against its own slice.
function _pieInk(hex) {
  const c = String(hex).replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255)
    .map(u => (u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4));
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.35 ? '#101010' : '#FFFFFF';
}

// ── CITY-MAP ──────────────────────────────────────────────────
// A local map for one metro area. `geo` is Natural Earth 110m — country
// outlines — so zooming it to a city gives a featureless slab. This draws
// from real lat/lon on a locally-correct projection instead, and the thing
// it actually encodes is DISTANCE: concentric rings from a centre, with
// places pinned on them. Use it for "how far out is this really".
//
// Projection: equirectangular about (center_lat, center_lon) with the
// longitude axis scaled by cos(center_lat). Without that correction a
// Bengaluru map is stretched ~2.6% east-west; with it, a ring drawn as a
// circle is a true circle on the ground.
const KM_PER_DEG = 111.32;

function CityMapSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, 'light');
  const viz = vizFor(v, surface);
  const {
    center_lat = 12.9794, center_lon = 77.5912, span_km = 70,
    rings, places, routes, map_height = 620, map_caption,
    field_color, ring_label = true, scale_bar = true, pin_size = 15, label_size = 24,
  } = slide;

  const W = 1080 - PAD * 2, H = Number(map_height) || 620;
  const lat0 = Number(center_lat), lon0 = Number(center_lon);
  const K = W / (Number(span_km) / KM_PER_DEG);           // px per degree latitude
  const cosLat = Math.cos(lat0 * Math.PI / 180);
  const X = (lon) => W / 2 + (lon - lon0) * cosLat * K;
  const Y = (lat) => H / 2 - (lat - lat0) * K;
  const kmToPx = (km) => (km / KM_PER_DEG) * K;

  const field = field_color || '#0A1F3C';
  const ringList = (Array.isArray(rings) ? rings : [10, 20, 30]).map(Number).filter(n => n > 0);
  const pts = (Array.isArray(places) ? places : []).map(p => ({
    name: p.name || '', lat: Number(p.lat), lon: Number(p.lon),
    emphasis: !!p.emphasis, note: p.note || '', align: p.align || 'right',
  })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  const routeList = (Array.isArray(routes) ? routes : []).map(r => ({
    from: r.from, to: r.to, label: r.label || '', label_offset: r.label_offset,
  })).filter(r => Array.isArray(r.from) && Array.isArray(r.to));

  return (
    <VChartSlide slide={slide} index={index}>
      <div>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
          style={{ display: 'block', borderRadius: 14, overflow: 'hidden' }}>
          <rect x={0} y={0} width={W} height={H} fill={field} />
          {/* faint local grid — orientation only, never a data gridline */}
          {Array.from({ length: 9 }).map((_, i) => (
            <g key={i} stroke="rgba(255,255,255,.055)" strokeWidth={VIZ.hair}>
              <line x1={(i + 1) * W / 10} x2={(i + 1) * W / 10} y1={0} y2={H} />
              {i < 6 && <line x1={0} x2={W} y1={(i + 1) * H / 7} y2={(i + 1) * H / 7} />}
            </g>
          ))}
          {/* Distance rings. Labels ride the upper-left diagonal rather than
              due east: the eastward radius is where pins cluster on a map
              centred at a CBD, and stacking three ring labels along it walks
              them straight through those labels. */}
          {ringList.map((km, i) => {
            const rr = kmToPx(km), D = 0.7071;
            return (
              <g key={i}>
                <circle cx={X(lon0)} cy={Y(lat0)} r={rr} fill="none"
                  stroke="rgba(255,255,255,.26)" strokeWidth={VIZ.hair} />
                {ring_label && (
                  <text x={X(lon0) - rr * D} y={Y(lat0) - rr * D - 10} textAnchor="middle"
                    style={{ fontFamily: metaFontFor(v), fontSize: 19, fill: 'rgba(255,255,255,.5)',
                      letterSpacing: '.08em' }}>{km} KM</text>
                )}
              </g>
            );
          })}
          {routeList.map((r, i) => {
            const mx = (X(r.from[1]) + X(r.to[1])) / 2, my = (Y(r.from[0]) + Y(r.to[0])) / 2;
            // Offset the label perpendicular to the line so it clears both
            // endpoints' own labels.
            const dx = X(r.to[1]) - X(r.from[1]), dy = Y(r.to[0]) - Y(r.from[0]);
            const len = Math.hypot(dx, dy) || 1;
            const off = Number(r.label_offset) || 30;
            return (
              <g key={i}>
                <line x1={X(r.from[1])} y1={Y(r.from[0])} x2={X(r.to[1])} y2={Y(r.to[0])}
                  stroke={viz.accent} strokeWidth={VIZ.line} strokeLinecap="round"
                  strokeDasharray={`1 ${VIZ.line * 2.6}`} />
                {r.label && (
                  <text x={mx + (-dy / len) * off} y={my + (dx / len) * off + 7}
                    textAnchor="middle" style={{ fontFamily: metaFontFor(v), fontWeight: 700, fontSize: 21,
                      fill: '#FFFFFF', letterSpacing: '.04em' }}>{r.label}</text>
                )}
              </g>
            );
          })}
          {/* Centre cross marks the ORIGIN OF THE RINGS, so it only earns its
              place when rings are drawn — otherwise it is a stray mark at an
              arbitrary point. Also suppressed when a pin already sits on the
              centre, where its arms would poke out from under that pin. */}
          {ringList.length > 0
            && !pts.some(p => Math.hypot(X(p.lon) - X(lon0), Y(p.lat) - Y(lat0)) < pin_size + 8) && (
            <g stroke="rgba(255,255,255,.55)" strokeWidth={VIZ.hair}>
              <line x1={X(lon0) - 13} x2={X(lon0) + 13} y1={Y(lat0)} y2={Y(lat0)} />
              <line x1={X(lon0)} x2={X(lon0)} y1={Y(lat0) - 13} y2={Y(lat0) + 13} />
            </g>
          )}
          {pts.map((p, i) => {
            const cx = X(p.lon), cy = Y(p.lat), left = p.align === 'left';
            const r = p.emphasis ? pin_size + 3 : pin_size;
            return (
              <g key={i}>
                {p.emphasis && (
                  <circle cx={cx} cy={cy} r={r + 13} fill="none" stroke={viz.accent}
                    strokeWidth={VIZ.hair} opacity={0.7} />
                )}
                <circle cx={cx} cy={cy} r={r} fill={p.emphasis ? viz.accent : '#B3C7DA'}
                  stroke={field} strokeWidth={VIZ.gap} />
                <text x={left ? cx - r - 14 : cx + r + 14} y={cy + 8} textAnchor={left ? 'end' : 'start'}
                  style={{ fontFamily: bodyFontFor(v), fontWeight: 800, fontSize: label_size,
                    fill: '#FFFFFF', letterSpacing: '-.01em' }}>{p.name}</text>
                {p.note && (
                  <text x={left ? cx - r - 14 : cx + r + 14} y={cy + 8 + label_size + 4}
                    textAnchor={left ? 'end' : 'start'}
                    style={{ fontFamily: metaFontFor(v), fontSize: label_size - 6,
                      fill: 'rgba(255,255,255,.66)', letterSpacing: '.03em' }}>{p.note}</text>
                )}
              </g>
            );
          })}
          {scale_bar && (() => {
            // Adaptive: a fixed 10 km bar is a 27px stub on a 340 km map and a
            // third of the frame on a 30 km one. Snap to a round number near a
            // fifth of the span.
            const nice = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
            const target = Number(span_km) / 5;
            const km = nice.reduce((a, b) => Math.abs(b - target) < Math.abs(a - target) ? b : a);
            return (
              <g>
                <line x1={26} y1={H - 30} x2={26 + kmToPx(km)} y2={H - 30}
                  stroke="rgba(255,255,255,.7)" strokeWidth={VIZ.hair * 1.6} strokeLinecap="square" />
                <text x={26} y={H - 42} style={{ fontFamily: metaFontFor(v), fontSize: 19,
                  fill: 'rgba(255,255,255,.7)', letterSpacing: '.08em' }}>{km} KM</text>
              </g>
            );
          })()}
        </svg>
        {map_caption && (
          <div style={{ marginTop: 16, fontFamily: metaFontFor(v), fontSize: 21,
            letterSpacing: '.04em', color: viz.ink.muted }}>{map_caption}</div>
        )}
      </div>
    </VChartSlide>
  );
}

window.LAYOUTS = {
  'cover':       CoverSlide,
  'story':       StorySlide,
  'split-story': SplitStorySlide,
  'quote':       QuoteSlide,
  'stat':        StatSlide,
  'roster':      RosterSlide,
  'geo':         GeoSlide,
  'closing':     ClosingSlide,
  'reel-frame':  ReelFrameSlide,
  'reel-explainer': ReelExplainerSlide,
  'bar-chart':   BarChartSlide,
  'line-chart':  LineChartSlide,
  'pictogram':   PictogramSlide,
  'city-map':    CityMapSlide,
  'pie-chart':   PieChartSlide,
};
