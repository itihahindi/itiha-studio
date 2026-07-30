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
    headline = '', body, kicker_meta, texture,
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
    headline = '', body, kicker_meta, texture,
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
    headline = '', kicker_meta, texture, rows = [],
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
};
