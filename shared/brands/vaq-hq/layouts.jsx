// VAQ HQ — slide layouts (1080×1350 Instagram carousel)
// Vox-style flat editorial tiles built from the IG-system mock: solid accent
// surfaces or navy tiles with an accent rule, huge per-vertical type, kicker
// cues, and the constant Vaq HQ mark. Deliberately NOT the Itiha language —
// no film grain, no cinematic full-bleed veils.

const PAD = 72;   // slide inset
const CHROME_H = 130; // space reserved above bottom chrome

// ── COVER ─────────────────────────────────────────────────────
// Solid accent tile by default — the loud grid opener.
function CoverSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, 'solid');
  const {
    headline = '', subline, kicker_meta, swipe_meta,
    headline_size, headline_offset_y = 0,
  } = slide;
  const hSize = headline_size || headlineDefaultSize(v, 'cover');
  return (
    <VSlide v={v} surface={surface}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} meta={kicker_meta} />
        <div style={{ flex: 1 }} />
        <div style={{ transform: `translateY(${headline_offset_y - 60}px)` }}>
          <VHeadline text={headline} v={v} size={hSize} onSolid={surface.onSolid} />
          {subline && (
            <div style={{
              marginTop: 34, fontFamily: VAQ.sans, fontWeight: 500, fontSize: 34, lineHeight: 1.4,
              color: surface.onSolid ? 'rgba(255,255,255,.85)' : VAQ.body,
              maxWidth: 820,
            }}>{subline}</div>
          )}
        </div>
        <div style={{ height: CHROME_H }} />
      </div>
      {swipe_meta && (
        <div style={{
          position: 'absolute', left: PAD, bottom: 118,
          fontFamily: VAQ.mono, fontSize: 21, letterSpacing: '.18em', textTransform: 'uppercase',
          color: surface.onSolid ? v.onAccentMuted : VAQ.muted,
        }}>{swipe_meta}</div>
      )}
      <VChrome n={null} onSolid={surface.onSolid} v={v} />
    </VSlide>
  );
}

// ── STORY ─────────────────────────────────────────────────────
// The interior workhorse: dark tile, kicker, headline, body, optional
// contained image card (flat, hairline border, rounded).
function StorySlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, 'dark');
  const {
    headline = '', body, kicker_meta, image, image_caption, image_position,
    headline_size, body_size = 41, headline_offset_y = 0, body_offset_y = 0,
  } = slide;
  const hSize = headline_size || headlineDefaultSize(v, 'inner');
  return (
    <VSlide v={v} surface={surface}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} meta={kicker_meta} />
        {/* Type-only slides center the headline+body group (weighted high);
            with an image the column flows from the top. */}
        {!image && <div style={{ flex: 0.8 }} />}
        <div style={{ marginTop: image ? 54 : 0, transform: `translateY(${headline_offset_y}px)` }}>
          <VHeadline text={headline} v={v} size={hSize} onSolid={surface.onSolid} />
        </div>
        {image && (
          <div style={{ marginTop: 44 }}>
            <div style={{
              borderRadius: 20, overflow: 'hidden', border: `1px solid ${VAQ.hairline3}`,
              height: 430, background: VAQ.card,
            }}>
              <img src={image.startsWith('http') ? image : `images/${image}`} style={{
                width: '100%', height: '100%', objectFit: 'cover',
                objectPosition: image_position || 'center',
              }} />
            </div>
            {image_caption && (
              <div style={{ marginTop: 16, fontFamily: VAQ.mono, fontSize: 20, letterSpacing: '.08em',
                color: VAQ.muted }}>{image_caption}</div>
            )}
          </div>
        )}
        {body && (
          <div style={{ marginTop: image ? 44 : 52, transform: `translateY(${body_offset_y}px)` }}>
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
// Flat photo block on top (no cinematic veil — a thin accent divider
// separates image from text), kicker + headline + body below.
function SplitStorySlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, 'dark');
  const {
    headline = '', body, kicker_meta, image, image_position, image_height = 600,
    headline_size, body_size = 40, body_offset_y = 0,
  } = slide;
  const hSize = headline_size || Math.round(headlineDefaultSize(v, 'inner') * 0.92);
  return (
    <VSlide v={v} surface={surface}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: image_height, background: VAQ.card }}>
        {image && (
          <img src={image.startsWith('http') ? image : `images/${image}`} style={{
            width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: image_position || 'center',
          }} />
        )}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, background: v.accent }} />
      </div>
      <div style={{
        position: 'absolute', top: image_height, left: 0, right: 0, bottom: 0,
        padding: `52px ${PAD}px 0`, display: 'flex', flexDirection: 'column',
      }}>
        <VKicker v={v} onSolid={false} meta={kicker_meta} />
        <div style={{ marginTop: 40 }}>
          <VHeadline text={headline} v={v} size={hSize} onSolid={false} />
        </div>
        {body && (
          <div style={{ marginTop: 40, transform: `translateY(${body_offset_y}px)` }}>
            <VBody text={body} v={v} size={body_size} />
          </div>
        )}
      </div>
      <VChrome n={index + 1} onSolid={false} v={v} />
    </VSlide>
  );
}

// ── QUOTE ─────────────────────────────────────────────────────
// Newsreader italic pull-quote with a giant accent quote mark.
function QuoteSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, 'dark');
  const { quote = '', attribution, kicker_meta, quote_size = 72, quote_offset_y = 0 } = slide;
  return (
    <VSlide v={v} surface={surface}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} meta={kicker_meta} />
        <div style={{ flex: 1 }} />
        <div style={{ transform: `translateY(${quote_offset_y - 40}px)` }}>
          <div style={{
            fontFamily: VAQ.serif, fontSize: 210, lineHeight: 0.4, fontWeight: 600,
            color: surface.onSolid ? v.tint : v.accent, height: 96,
          }}>“</div>
          <div style={{
            fontFamily: VAQ.serif, fontStyle: 'italic', fontWeight: 500,
            fontSize: quote_size, lineHeight: 1.24, letterSpacing: '-.01em',
            color: VAQ.ink, textWrap: 'balance',
          }}>{quote}</div>
          {attribution && (
            <div style={{
              marginTop: 44, fontFamily: VAQ.mono, fontSize: 25, letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: surface.onSolid ? v.onAccentMuted : VAQ.muted,
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
// One enormous Archivo number in the vertical's accent.
function StatSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const surface = surfaceFor(slide, v, 'dark');
  const {
    label, value = '', sublabel, body, kicker_meta,
    stat_size = 250, body_size = 38, stats_offset_y = 0,
  } = slide;
  return (
    <VSlide v={v} surface={surface}>
      <div style={{ position: 'absolute', inset: `${PAD - 8}px ${PAD}px`, display: 'flex', flexDirection: 'column' }}>
        <VKicker v={v} onSolid={surface.onSolid} meta={kicker_meta} />
        <div style={{ flex: 1 }} />
        <div style={{ transform: `translateY(${stats_offset_y}px)` }}>
          {label && (
            <div style={{ fontFamily: VAQ.mono, fontWeight: 700, fontSize: 26, letterSpacing: '.18em',
              textTransform: 'uppercase', color: surface.onSolid ? v.onAccentMuted : VAQ.muted,
              marginBottom: 26 }}>{label}</div>
          )}
          <div style={{
            fontFamily: VAQ.display, fontWeight: 900, fontSize: stat_size, lineHeight: 0.92,
            letterSpacing: '-.03em', color: surface.onSolid ? '#fff' : v.accent,
          }}>{value}</div>
          {sublabel && (
            <div style={{ marginTop: 30, fontFamily: VAQ.sans, fontWeight: 700, fontSize: 42,
              color: VAQ.ink, letterSpacing: '-.01em' }}>{sublabel}</div>
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
// Channel signature: centered mark + wordmark, the four accent dots,
// follow line. Sits on the deepest navy (page bg).
function ClosingSlide({ slide, index }) {
  const t = useTweaks();
  const v = verticalFor(slide, t);
  const { headline, body, handle, headline_size = 60 } = slide;
  const surface = { mode: 'navy', bg: VAQ.bg, onSolid: false };
  return (
    <VSlide v={v} surface={surface}>
      <div style={{
        position: 'absolute', inset: `${PAD}px`, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>
        <VMark size={150} />
        <div style={{ marginTop: 44, fontFamily: VAQ.serif, fontWeight: 600, fontSize: 92, letterSpacing: '-.01em', lineHeight: 1 }}>
          <span style={{ color: '#fff' }}>Vaq</span>{' '}
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
              lineHeight: 1.12, letterSpacing: '-.015em', color: VAQ.ink, textWrap: 'balance' }}>
              {String(headline).split('\n').map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        )}
        {body && (
          <div style={{ marginTop: 34, maxWidth: 760 }}>
            <VBody text={body} v={v} size={34} color={VAQ.body} style={{ textAlign: 'center' }} />
          </div>
        )}
        {handle && (
          <div style={{ marginTop: 60, fontFamily: VAQ.mono, fontSize: 25, letterSpacing: '.2em',
            textTransform: 'uppercase', color: VAQ.muted }}>{handle}</div>
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
