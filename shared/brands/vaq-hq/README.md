# Vaq HQ — brand pack

Digital political-media channel. Light paper ground, hero orange, navy counterweight.
Deliberately **not** the Itiha language: light not dark, framed not cinematic.

Files: `slides-shared.jsx` (tokens + primitives) · `layouts.jsx` (slide components)
`manifest.js` (editor field schema) · `prompts.js` (brand identity + paste prompts)
`tokens.css` · `examples.yaml` · `reference/` (the 2026-07 brand-kit mocks)

**This file is the design system. [AUTHORING.md](AUTHORING.md) is the editorial
system** — voice, hooks, deck arcs, length limits, caption shape, verification.
Read that one before writing a deck.

---

## The two-tone rule

Since the **2026-07-27 consolidation** there is exactly one visual system:

| | |
|---|---|
| paper | `#F7F9FB` |
| accent | `#F4631E` — the **only** accent |
| dark surface | `#1E1E1E` |
| ink on light | `#0A1119` · body `#33475C` · muted `#5C7089` |

Audience feedback killed the seven per-vertical liveries: different colours per show
made the feed read as several different accounts. **Do not reintroduce per-vertical
accents, typefaces or kit objects.** Retired: briefing blue, longview plum, ground
teal, sports red, legal `#E0554E`, tech `#2540FF`, the Docket/Cathode sub-kits.

A vertical now contributes **editorial identity only** — badge text, show name, and
ground's Devanagari companion. All seven share `V_BASE`.

`live · briefing · longview · ground · sports · legal · tech`

**Surfaces** are the variety knob, not colour:
`light` (paper interior) · `solid` (orange poster tile) · `dark` (navy/near-black poster).

Type: Archivo caps headlines · Hanken Grotesk body · Space Mono meta ·
Newsreader pull quotes · Noto Serif Devanagari companion.

---

## Layouts

| Layout | For |
|---|---|
| `cover` | poster-tile opener |
| `story` | the interior workhorse |
| `split-story` | photo block over paper text |
| `quote` | Newsreader pull quote |
| `stat` | one enormous Archivo numeral |
| `roster` | flag · name · value table |
| `geo` | country-level map (Natural Earth 110m) |
| `closing` | channel signature |
| `reel-frame` | 1080×1920 header panel over video |
| **`bar-chart`** | `emphasis` · `sequence` · `stack` · `diverge` |
| **`line-chart`** | trend over time, 1–2 series |
| **`pictogram`** | a proportion, as unit cells |
| **`pie-chart`** | part-to-whole, max 6 slices |
| **`city-map`** | one metro area, distance rings |

Adding a layout means: component → `window.LAYOUTS` → `manifest.js` entry →
name in `KNOWN_LAYOUTS` in `src/content.py`.

---

## Charts

**Encode by emphasis, not category.** A categorical slot needs OKLCH chroma ≥ 0.10
to carry identity, and every navy that clears it comes out a saturated blue — a
second accent, which the consolidation exists to prevent. So: **subject in orange,
context in slate.** That pair separates on *lightness* (ΔE 34.1 normal vision,
21.5 under protanopia), so it survives colour blindness better than any hue pair.

Palettes are **computed and validated**, never eyeballed. Validator vendored at
`tools/dataviz/validate_palette.js`:

```
node tools/dataviz/validate_palette.js "#FF8B5D,#F4631E,#D54E00,#A23900" \
     --ordinal --surface "#F7F9FB"                      # ALL PASS
node tools/dataviz/validate_palette.js "#FFCEBC,#FFA380,#F4631E,#D54E00" \
     --ordinal --mode dark --surface "#1E1E1E"          # ALL PASS
```

| token | light | dark |
|---|---|---|
| ordinal ramp | `#FF8B5D #F4631E #D54E00 #A23900` | `#FFCEBC #FFA380 #F4631E #D54E00` |
| context fill | `#94A7BA` (2.34:1) | `#76889B` (4.58:1) |
| second identity | `#3E4F60` (7.98:1) | — |

**Brand orange is 2.99:1 on paper**, a hair under the 3:1 mark floor. The relief
rule therefore binds: **every value is directly labelled.** A slide has no tooltip
and no table view, so the label is the only channel — it is not optional.

`pie-chart` is the one exception to two-tone, because part-to-whole genuinely needs
categorical identity. Its slots come from the dataviz reference palette, re-validated
against VAQ's surfaces **including the ring-closure pair** (in a pie the last slice
touches the first, which a linear pairlist never tests). Slot 0 is a neutral grey on
purpose — in a fossil-vs-clean split the fossil share is context, not an identity.
Don't hand-pick slice colours: a semantic guess put violet beside blue (ΔE 1.9 under
protanopia) and red beside magenta.

**Mark specs** are the dataviz screen specs × 2.75, because a 1080-wide slide is
viewed at ~390px: bar 63 · line 6 · dot r11 · surface gap 6 · hairline 3 · radius 11.
Gridlines are solid hairlines, never dashed.

**Curiosity loops.** `loop:` puts a one-line cliffhanger under the body that names
what the *next* slide actually contains. Editorial copy, not chrome — which keeps it
clear of the no-swipe-meta rule. Leave it blank on covers and on the closing.

---

## Reels

`panel_height` for **zero crop** = `1920 − (1080 × srcH ÷ srcW)`.
16:9 → 1312 · 1.67:1 → 1274 · 1:1 → 840. A tall panel skips feed/square; expected.

- **Portrait 9:16 sources are the trap.** `compose_reel` cover-crops *centred*, so a
  panel eats half its height off the top and clips the speaker's head. Pre-crop
  top-anchored first, then the composer crops nothing.
- **Check head position across many timestamps** — it drifts, and the worst frame is
  what clips.
- **Re-check the composed mp4**, not the still frame, at several timestamps.
- **Split-screen reaction videos**: find the seam and crop to the panel you want.
  Watch for the source's first seconds being a static logo card while the audio has
  already started.
- **A/V sync**: measure, don't guess. Correlate mouth movement (or burned-in caption
  changes) against the audio envelope. Sources drift; one clip this repo has handled
  ran **+333 ms** audio-late. Re-encoding a VFR source to hard CFR without anchoring
  the audio adds a frame of its own — use `-r 30 -fps_mode cfr`.
- Hindi/Kannada speech **won't transcribe reliably**. Quote the source's own English
  text; never fabricate a translation.

---

## House style

- **Single-post body under 50 words.** Hard limit. Carousels exempt. A short body
  frees vertical space, so **raise `body_size`** rather than leaving a gap.
- **No em dashes.** `grep -c '—'` before rendering.
- **No `image_credit` on slides** — licence attribution goes in the caption.
  Descriptive `image_caption` (what/where/when) is fine.
- Captions are long-form, structured with bold-ish lead-ins, ending with sources,
  image credits and the handle.
- Direct headlines. State the fact; skip the metaphor.
- `bin/vaq-watch check <slug>` lints word count, em dashes and `image_credit` — but
  it lives on the unmerged watcher branch, so on `main` run those three by hand.

---

## Verification

Light by default for ordinary contested clips. **Except institutional and numeric
facts** — ministerial portfolios, cabinet decisions, court rulings, seat counts,
casualty tolls, gift amounts, scheme outlays. Those get verified properly; being
wrong there is the costly kind of error.

- Attribute contested claims, name the source, say what is *not* independently
  verified, and state what **is** corroborated.
- Don't assert motive or conspiracy as fact. Offer the defensible version.
- No communal slurs in VaqHQ's voice. Strip the slur, keep the argument.
- No faces beside accusations.
- The lean is delivered through **checkable** arguments. That is also what makes a
  deck survive being challenged.

---

## Gotchas

- **`kicker_meta: 2017` parses as an integer** in YAML, and `.trim()` on a number
  throws — which used to blank every slide from that one onward. `VKicker` now
  coerces, but note that a render can report success while writing blank PNGs.
  If slides look empty, that is the signature of a JS throw partway down the deck.
- **SVG `<text>` takes `fill`, not `color`.** `vizNum()` sets both; anything new that
  draws text in SVG must too, or it renders black and vanishes on a dark slide.
- **`geo` auto-assigns country colours** from a pre-consolidation cycle. Always set
  `color:` explicitly — orange for the subject, `#94A7BA` for context.
- **A single `geo` link takes whatever arc the curve gives it.** A route with a
  chokepoint needs a waypoint country, or it will draw a land path under a headline
  about a sea strait.
- **`.jsx` / `.html` edits need a browser hard-refresh** (Cmd-Shift-R); Babel caches
  aggressively. `.py` edits need `bin/kavi restart`.
- **`bin/kavi status` can report a false positive** — it trusts the pid file. Confirm
  with `curl` on the port. The port changes on every start.
