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

## ⟶ DIRECTION CHANGE 2026-10-27: VAQ POSTER, two grounds (shipped in the pack)

The user picked a new house look on the data-graphics work and asked for **all
VAQ work** (carousels, single posts, quote cards, reels, charts) to move to it:
*"white is looking basic… Haldi yellow with coal black… two designs so my feed
won't get burned out."* The live spec, with built examples, is
[../../../.claude/skills/data-infographic/styles.md](../../../.claude/skills/data-infographic/styles.md);
the tokens are in `.claude/skills/data-infographic/kit/poster.css`. **The pack renders it
as `tweaks.look: poster` (see "How the pack does it" below); the rest of this
README after this section describes the `classic` look**, which old decks keep
because they carry no `look`.

**Target spec**

| | Haldi ground (default) | Coal ground |
|---|---|---|
| page | `#FFD23F` | `#111111` |
| text / headline | coal `#111111` | cream `#FFF8E7` |
| story colour (hero numbers, key marks) | coal | haldi `#FFD23F` |
| second colour ("fell", second series) | burnt orange `#C2410C` | VAQ orange `#F4631E` |
| `*word*` emphasis | haldi letters on a coal slab (cap height only) | coal letters on a haldi slab |
| context marks | coal at 30% | cream at 32% |

- **Alternate grounds post to post** in the feed. A deck uses one ground; a
  single slide may flip to the other for a poster beat.
- **Type (Indian Type Foundry, Fontshare CSS:**
  `https://api.fontshare.com/v2/css?f[]=tanker@400&f[]=switzer@400,500,600,700,800,900&f[]=zodiak@700,800&f[]=boska@900i&display=block`**)**
  - Headlines and hero numbers: **Tanker** caps (the "poster" look).
  - Everything else: **Switzer**. Body ≥ the current VAQ sizes; labels ≥ 20px at 1080.
  - Fallback look **"broadsheet"** for long or grave headlines and quote slides:
    **Zodiak** 800 sentence case, **Boska** 900 italic for the emphasis word.
  - Retired: Archivo, Hanken Grotesk, Space Mono, Newsreader (and never Inter,
    Plex, Space Grotesk, Red Hat, Figtree). Keep **Noto Serif Devanagari** for
    Hindi lines until a Devanagari face is chosen.
- No white or near-white grounds. No textures by default (the look is flat
  colour and type; `texture:` stays as an opt-in). No dashboard chrome.
- Contrast: coal on haldi ≈ 13:1, haldi on coal ≈ 13:1, cream on coal ≈ 17:1.
  Orange **text** on haldi fails (≈ 2:1): that's why haldi uses the slab and
  burnt orange.

**How the pack does it** (built 2026-10-27 on `feat/vaq-poster-pack`)

- **Deck switches**: `tweaks.look: poster | broadsheet | classic` and
  `tweaks.ground: haldi | coal`, pinned above the slide strip as editor quick
  switches. **Unset look = classic**, so every deck made before the switch
  re-renders pixel-identically (verified on vaq-demo, vaq-chart-kit,
  ram-mandir-donation-theft and pojk-52-days: 31/31 slides identical) with no
  pinning. New VAQ projects get `look: poster` + `ground: haldi` from
  `src/scaffold.py`; AUTHORING.md tells Claude Code to set both on new decks.
- **Surfaces**: on a poster deck, blank / `light` = the deck ground,
  `dark` or `solid` = the other ground (the orange tile is retired, user
  2026-10-27), `haldi` / `coal` name one. Layout fallbacks (the cover's tile,
  the explainer's navy panel) are ignored: a deck holds one ground.
- **Per slide**: `look: broadsheet` for a grave or long headline inside a
  poster deck.
- **Mechanism**: `verticalFor` returns the vertical with `look`, `ground` and
  the poster faces on the existing `bodyFont` / `metaFont` / `quoteFont` /
  `numFont` hooks; `surfaceFor`, `inkFor` and `vizFor` resolve every colour
  from `GROUNDS` in `slides-shared.jsx` (ink, muted, story `em`, second `em2`,
  slab, rule, hair, well, ctx, ramp). Classic verticals carry no `look`, and
  every poster branch keys on `isPoster(v)`, which is what keeps classic
  untouched. Don't write a hex into a layout; add a key to `GROUNDS`.
- **Chrome**: tag-box slug + meta + `@vaq_hq` (`tweaks.handle` overrides);
  footer = 3px rule, `03 / 09` folio, the approved Tanker mark with HQ in a
  box (same lockup as [marks/make.py](marks/make.py)). Jump line = Switzer
  "NEXT …". Closing = the mark at 190px, tagline, headline, handle tag.
- **Type**: Tanker 400 headlines (default sizes cover 156, inner 112, chart
  100, list 88), `*word*` on a cap-height slab; Switzer 500 body with
  `[key]` = full-ink 800 + second-colour underline (never a coloured word);
  quotes in Zodiak 700 under a Boska mark. Broadsheet: Zodiak 800 sentence
  case, Boska 900 italic on the slab.
- **Charts and maps**: story = `em`, context = `ctx` (a solid mix, not an
  alpha), second series / "fell" pole / diverge negatives = `em2`. Pie slots
  are story, second, then ink-to-page steps (no third hue). `geo` defaults to
  the page as sea, a context tint for land, borders cut in the page colour;
  authored `ocean` / `land_color` / country colours still win. `city-map`
  keeps a dark field (coal) with haldi marks.
- **Textures** are off unless a slide or `tweaks.texture` asks.
- **Test decks**: `designs/zz-vaq-poster-lab-{haldi,coal}` (all 13 carousel
  layouts + label cover) and `zz-vaq-poster-reels-{haldi,coal}`.

Open: the user hasn't yet judged the lab renders; Devanagari lines still fall
back to Noto Serif Devanagari; the reel-frame lab slide carries a pre-existing
subline/credit collision from its source deck (also in classic).

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

A vertical now contributes **editorial identity only** — badge text and show name.
All seven share `V_BASE`. (Ground's Devanagari companion was retired 2026-08-29.)

`live · briefing · longview · ground · sports · legal · tech`

**Surfaces** are the variety knob, not colour:
`light` (paper interior) · `solid` (orange poster tile) · `dark` (navy/near-black poster).

Type: Archivo caps headlines · Hanken Grotesk body · Space Mono meta ·
Newsreader pull quotes · Noto Serif Devanagari companion.

---

## Print refresh (2026-08-29, branch `feat/vaq-design-refresh`)

User feedback: the pack read as a generic AI template — the orange top bar,
pill/eyebrow chips, the short accent dash over headlines, the `— LOOP →` line
and the four closing dots were the giveaways. Colour and type stay; the chrome
is now newspaper, not UI:

| Was | Now |
|---|---|
| 10px orange bar across the top | gone — no accent on the sheet edge |
| orange pill badge + mono meta | **masthead**: Archivo slug in ink with a short orange underline, mono dateline, closed by a *double* hairline rule |
| `*word*` = orange highlighter slab | `*word*` = **Newsreader italic in orange** set inside the Archivo caps |
| `— LOOP TEXT →` mono line | **jump line**: hairline above, right-set serif italic "Next: …" (no arrow, no accent) |
| 88×9 orange dash over dark-cover headlines | gone |
| rounded 14px hairline photo frames | square frames; split-story photo ends on a 1px ink cutline |
| four accent dots on the closing | **colophon**: double rules + "Politics, decoded." |
| `02 / 08` mono page number | `2 of 8` in serif italic |

Textures gained a print set — `paper` · `newsprint` · `halftone` · `ink` —
alongside the originals (`grid` `riso` `dots` `signal`); they stack with commas.
`texture: file:<name>.png[:opacity%]` multiplies in any PNG dropped into
`textures/` (subfolders fine), or `file:images/<name>.png` from the design's own
`images/`, or a `brands/…` path or http(s) URL. A third segment sets the blend:
`file:Texturelabs_Film_176M.jpg:45:screen` (multiply is the default on paper and
orange, screen on dark). Texturelabs scans in `textures/` are under the
Texturelabs free licence: fine inside renders, not for redistribution as files. `designs/vaq-texture-sampler` shows
all four new ones on light / dark / solid.

---

## Collage & poster vocabulary (2026-08-29)

Second pass on the same feedback, from five references the user shared (GRIDD
zine covers, .ties posters). Same two colours; a louder register when a story
wants it. All opt-in per slide; the newsroom chrome stays the default.

| Device | How |
|---|---|
| headline in a label block (each line boxed in navy, sentence-case sans) | `headline_style: label` on cover / story. `cover_style: label` also drops the masthead |
| die-cut subject with drop shadow | Die-cut the image in the editor (rembg), then `image_style: cutout` |
| one-colour print duotone (orange or navy) | `image_style: duotone` + `image_tint: orange\|navy`; `image_halftone: true` adds a dot screen masked to the subject |
| B&W cutout | `image_style: mono` |
| tilted print / photo | `image_tilt: -6` (degrees), `image_width: 78%` |
| zine starbursts | `bursts: [{pos: right, color: orange, size: 360, points: 10, rotate: 12, front: false}]` — colours `orange navy ink paper white slate tint`; `x`/`y` px override `pos` |
| giant condensed poster type + subject on a studio backdrop, wordmark only | `cover_style: poster` with `headline` (`*word*` → orange), `tag`, `image_align`, `image_height` (900), `headline_size` (210). Archivo now loads with its `wdth` axis for this |
| grid paper · speckled dark ground · ink splatter | `texture: squares` · `speck` · `splat` (stack with commas, e.g. `speck, splat`) |

**Deck-wide stock.** Set once in `tweaks:` and every slide inherits it — the
print rule is one paper per issue, so this is *less* chaotic than per-slide picks:

```yaml
tweaks:
  texture: file:Texturelabs_Paper_290L.jpg:50        # every slide
  textureDark: file:Texturelabs_Film_176M.jpg:40     # navy surfaces instead
  textureSolid: file:Texturelabs_InkPaint_410M.jpg:40   # orange tiles instead
```

`texture: house` is the shorthand for the user's favourite stocks (2026-08-29):
newsprint + Grunge_340M on paper · 45° halftone + Film_197M on navy · halftone
on orange. Film_176M is the dustier navy alternative. A slide's own `texture:`
still wins; `texture: none` opts a slide out.

`designs/vaq-style-lab` recreates the five references in VAQ colours — copy a
slide from there rather than starting from the field list. Primitives live in
`slides-shared.jsx` (`VBursts`, `VCutout`, `VPosterHeadline`, `VHeadline label`);
`styles.css` (imported by `tokens.css`) carries the same rules as plain classes.

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
