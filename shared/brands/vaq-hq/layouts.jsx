// VAQ HQ — slide layouts, v2 (1080×1350)
// Daylight newsroom (A) + poster wall (B): light paper interiors with the
// vertical's top rule and highlighter emphasis; solid accent tiles for
// covers and photo-less emphasis slides. No swipe-meta (Itiha owns that
// convention). Textures: grid / riso / dots / signal.

const PAD = 72;
const CHROME_H = 130;

// ── COVER ─────────────────────────────────────────────────────
// Poster tile by default (surface: solid); `surface: light` gives the
// newsroom cover. Ghost index numeral on by default.
function CoverSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, 'solid');
  const {
    headline = '', subline, kicker_meta, texture,
    headline_size, headline_offset_y = 0, show_index,
  } = slide;
  const hSize = headline_size || headlineDefaultSize(v, 'cover');
  const pal = surface.onSolid ? solidPalette(v) : null;
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      {show_index !== false && <VGhostIndex n={index + 1} v={v} onSolid={surface.onSolid} />}
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} meta={kicker_meta} />
        <div style={{ flex: 1 }} />
        <div style={{ transform: `translateY(${headline_offset_y - 40}px)` }}>
          <VHeadline text={headline} v={v} size={hSize} onSolid={surface.onSolid} />
          {subline && (
            <div style={{
              marginTop: 36, fontFamily: VAQ.sans, fontWeight: 600, fontSize: 34, lineHeight: 1.4,
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
  const surface = surfaceFor(slide, v, 'light');
  const {
    headline = '', body, kicker_meta, texture,
    image, image_caption, image_credit, image_position, image_height = 470,
    headline_size, body_size = 41, headline_offset_y = 0, body_offset_y = 0,
  } = slide;
  const hSize = headline_size || headlineDefaultSize(v, 'inner');
  const capParts = [image_caption, image_credit].filter(Boolean);
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} meta={kicker_meta} />
        {!image && <div style={{ flex: 0.8 }} />}
        <div style={{ marginTop: image ? 52 : 0, transform: `translateY(${headline_offset_y}px)` }}>
          <VHeadline text={headline} v={v} size={hSize} onSolid={surface.onSolid} />
        </div>
        {image && (
          <div style={{ marginTop: 44 }}>
            <div style={{
              borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${surface.onSolid ? 'rgba(255,255,255,.35)' : VAQ.hairL}`,
              height: image_height, background: surface.onSolid ? 'rgba(0,0,0,.15)' : '#E4EAF0',
            }}>
              <img src={image.startsWith('http') ? image : `images/${image}`} style={{
                width: '100%', height: '100%', objectFit: 'cover',
                objectPosition: image_position || 'center',
              }} />
            </div>
            {capParts.length > 0 && (
              <div style={{
                marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 20,
                fontFamily: VAQ.mono, fontSize: 20, letterSpacing: '.08em',
                color: surface.onSolid ? solidPalette(v).muted : VAQ.mutedL,
              }}>
                <span>{image_caption || ''}</span>
                <span style={{ textTransform: 'uppercase' }}>{image_credit || ''}</span>
              </div>
            )}
          </div>
        )}
        {body && (
          <div style={{ marginTop: image ? 46 : 52, transform: `translateY(${body_offset_y}px)` }}>
            <VBody text={body} v={v} size={body_size} onSolid={surface.onSolid} />
          </div>
        )}
        <div style={{ flex: image ? 1 : 1.2 }} />
        <div style={{ height: CHROME_H - 40 }} />
      </div>
      <VChrome n={index + 1} onSolid={surface.onSolid} v={v} />
    </VSlide>
  );
}

// ── SPLIT-STORY ───────────────────────────────────────────────
// Flat photo block on top, accent divider, paper text block below.
function SplitStorySlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, 'light');
  const {
    headline = '', body, kicker_meta, texture,
    image, image_position, image_height = 580, image_credit,
    headline_size, body_size = 40, body_offset_y = 0,
  } = slide;
  const hSize = headline_size || Math.round(headlineDefaultSize(v, 'inner') * 0.94);
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: image_height, background: '#E4EAF0' }}>
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
        <VKicker v={v} onSolid={false} meta={kicker_meta} />
        <div style={{ marginTop: 38 }}>
          <VHeadline text={headline} v={v} size={hSize} onSolid={false} />
        </div>
        {body && (
          <div style={{ marginTop: 38, transform: `translateY(${body_offset_y}px)` }}>
            <VBody text={body} v={v} size={body_size} />
          </div>
        )}
      </div>
      <VChrome n={index + 1} onSolid={false} v={v} />
    </VSlide>
  );
}

// ── QUOTE ─────────────────────────────────────────────────────
function QuoteSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, 'light');
  const { quote = '', attribution, kicker_meta, texture, quote_size = 72, quote_offset_y = 0 } = slide;
  const pal = surface.onSolid ? solidPalette(v) : null;
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} meta={kicker_meta} />
        <div style={{ flex: 1 }} />
        <div style={{ transform: `translateY(${quote_offset_y - 40}px)` }}>
          <div style={{
            fontFamily: VAQ.serif, fontSize: 210, lineHeight: 0.4, fontWeight: 600,
            color: surface.onSolid ? pal.em : v.accent, height: 96,
          }}>“</div>
          <div style={{
            fontFamily: VAQ.serif, fontStyle: 'italic', fontWeight: 500,
            fontSize: quote_size, lineHeight: 1.24, letterSpacing: '-.01em',
            color: surface.onSolid ? pal.head : VAQ.inkL, textWrap: 'balance',
          }}>{quote}</div>
          {attribution && (
            <div style={{
              marginTop: 44, fontFamily: VAQ.mono, fontSize: 25, letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: surface.onSolid ? pal.muted : VAQ.mutedL,
            }}>— {attribution}</div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ height: CHROME_H - 50 }} />
      </div>
      <VChrome n={index + 1} onSolid={surface.onSolid} v={v} />
    </VSlide>
  );
}

// ── STAT ──────────────────────────────────────────────────────
function StatSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, 'light');
  const {
    label, value = '', sublabel, body, kicker_meta, texture,
    stat_size = 250, body_size = 38, stats_offset_y = 0,
  } = slide;
  const pal = surface.onSolid ? solidPalette(v) : null;
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} meta={kicker_meta} />
        <div style={{ flex: 1 }} />
        <div style={{ transform: `translateY(${stats_offset_y}px)` }}>
          {label && (
            <div style={{ fontFamily: VAQ.mono, fontWeight: 700, fontSize: 26, letterSpacing: '.18em',
              textTransform: 'uppercase', color: surface.onSolid ? pal.muted : VAQ.mutedL,
              marginBottom: 26 }}>{label}</div>
          )}
          <div style={{
            fontFamily: VAQ.display, fontWeight: 900, fontSize: stat_size, lineHeight: 0.92,
            letterSpacing: '-.03em', color: surface.onSolid ? pal.head : v.accent,
          }}>{value}</div>
          {sublabel && (
            <div style={{ marginTop: 30, fontFamily: VAQ.sans, fontWeight: 700, fontSize: 42,
              color: surface.onSolid ? pal.head : VAQ.inkL, letterSpacing: '-.01em' }}>{sublabel}</div>
          )}
          {body && (
            <div style={{ marginTop: 40, maxWidth: 860 }}>
              <VBody text={body} v={v} size={body_size} onSolid={surface.onSolid} />
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ height: CHROME_H - 50 }} />
      </div>
      <VChrome n={index + 1} onSolid={surface.onSolid} v={v} />
    </VSlide>
  );
}

// ── CLOSING ───────────────────────────────────────────────────
// Paper signature: mark, wordmark, four accent dots, follow line.
function ClosingSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const { headline, body, handle, headline_size = 58, texture } = slide;
  const surface = { mode: 'light', bg: VAQ.paper, onSolid: false };
  return (
    <VSlide v={v} surface={surface} texture={texture}>
      <div style={{
        position: 'absolute', inset: `${PAD}px`, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>
        <VMark size={150} />
        <div style={{ marginTop: 44, fontFamily: VAQ.serif, fontWeight: 600, fontSize: 92, letterSpacing: '-.01em', lineHeight: 1 }}>
          <span style={{ color: VAQ.inkL }}>Vaq</span>{' '}
          <span style={{ color: VAQ.orange }}>HQ</span>
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 46 }}>
          {Object.values(VERTICALS).map(vv => (
            <span key={vv.key} style={{ width: 18, height: 18, borderRadius: 6, background: vv.accent }} />
          ))}
        </div>
        {headline && (
          <div style={{ marginTop: 64, maxWidth: 840 }}>
            <div style={{ fontFamily: VAQ.serif, fontWeight: 600, fontSize: headline_size,
              lineHeight: 1.12, letterSpacing: '-.015em', color: VAQ.inkL, textWrap: 'balance' }}>
              {String(headline).split('\n').map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        )}
        {body && (
          <div style={{ marginTop: 34, maxWidth: 760 }}>
            <VBody text={body} v={v} size={34} color={VAQ.bodyL} style={{ textAlign: 'center' }} />
          </div>
        )}
        {handle && (
          <div style={{ marginTop: 60, fontFamily: VAQ.mono, fontSize: 25, letterSpacing: '.2em',
            textTransform: 'uppercase', color: VAQ.mutedL }}>{handle}</div>
        )}
      </div>
    </VSlide>
  );
}

window.LAYOUTS = {
  'cover':       CoverSlide,
  'story':       StorySlide,
  'split-story': SplitStorySlide,
  'quote':       QuoteSlide,
  'stat':        StatSlide,
  'closing':     ClosingSlide,
};
