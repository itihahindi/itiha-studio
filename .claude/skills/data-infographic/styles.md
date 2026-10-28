# VAQ POSTER: the house look for data graphics

Decided by the user on 2026-10-27, after the 14 house styles in
[styles-original.md](styles-original.md) were judged "generic Claude design"
and white grounds "basic". **This file is the look. styles-original.md is now
only the cookbook** for chart mechanics: its section-3 "How to build it"
steps (dumbbell rows, waffle grids, hemicycle maths, beeswarm layout, Sankey
nodes…) still apply. Its fonts, colours and backgrounds do not.

**Scope: all VAQ work**, not only data graphics. The user asked (2026-10-27)
for VAQ carousels, single posts, quote cards and reels to move to these two
layouts too. The studio pack's migration map is at the top of
`shared/brands/vaq-hq/README.md`. Itiha keeps its own Neel/Haldi system.

Everything below is implemented in [kit/poster.css](kit/poster.css) +
[kit/poster.js](kit/poster.js) (charts) and
[../india-map/poster-map.html](../india-map/poster-map.html) (maps). Build on
those; don't restate the tokens in a page.

## 1. Two grounds, alternating

| `ground` | Page | Type | Story colour | Second colour | `<em>` headline word |
|---|---|---|---|---|---|
| **haldi** (default) | turmeric `#FFD23F` | coal `#111111` | coal | burnt orange `#C2410C` (4.3:1) | yellow letters on a coal slab |
| **coal** | coal `#111111` | cream `#FFF8E7` | haldi `#FFD23F` | VAQ orange `#F4631E` | coal letters on a haldi slab |

- **Alternate post to post** so the feed never runs the same ground twice in
  a row (user: "so my feed won't get burned out").
- No white grounds. `ground: 'paper'` (the old VAQ `#F7F9FB`) exists only for a
  one-off that has to sit inside a white deck.
- Contrast: coal on haldi ≈ 13:1, haldi on coal ≈ 13:1, cream on coal ≈ 17:1.
  Orange **text** on haldi fails (≈ 2:1), which is why haldi's accent is a slab
  and its second colour is the darker burnt orange.
- Map ramps run toward more contrast with the page: haldi
  `#FFF3C4 → #E8590C → #111111`; coal `#3B3631 → #E8590C → #FFD23F`.
- Coal is a dark ground. The original guide's "no dark mode" rule is
  superseded for this one ground at the user's request; the "terminal / neon"
  looks it was guarding against stay banned.

## 2. Two looks

| `look` | Headline | Use |
|---|---|---|
| **poster** (default) | Tanker, condensed caps, `--h-size` 112 (100 for long lines) | almost everything; the thumbnail look |
| **broadsheet** (fallback) | Zodiak 800 sentence case, Boska 900 italic for the `<em>` word | headlines too long or too grave for caps, or with "UTs"-style mixed case |

Everything else in both looks is **Switzer**. Hero numbers use the display
face at 90–170px in the story colour.

**Type sizes (user, 2026-10-28).** A 1080 px post shows at about a third of its
size on a phone. The user first set a floor ("40px is readable, I use 45px"),
then took 10% off everything but the headline when that felt "too populated,
no spacing". These are the settled sizes, set in `kit/poster.css` and the
poster-map template:

| Text | Size |
|---|---|
| Dek | 40px |
| Labels | 700 36px |
| Values | 800 40px |
| Axis, notes, keys, legend | 31px |
| Slug | 27px |
| Source line | 23px, the only small text |
| VAQ HQ mark | 36px |

**Fit the chart to the type, never the type to the chart:**
- At most about 12 rows. A 28- or 30-state list becomes the top few, a
  "… N more …" row and the bottom few, or the biggest movers plus a one-line
  summary ("+ 18 more fell, none rose").
- Short names: Arunachal, J&K, A&N Islands, UP.
- Three to four axis ticks. Label every fourth or fifth year, plus the last.
- Label only the values the story needs.
- The dek is one or two lines; the detail goes in the caption. All four faces are Indian Type Foundry,
free from Fontshare. Never use Inter, IBM Plex, Red Hat, Space Grotesk,
Figtree, Bricolage, DM Sans or Archivo: those read as the AI default.

## 3. Anatomy (top to bottom)

1. **Slug**: tag box (`Topic · year`, uppercase) left, `@vaq_hq` right.
2. **Headline**: the finding, with its number, ≤ 8 words in poster. One
   `<em>` word or number gets the slab.
3. **Dek**: one or two lines at 40px: what is measured, unit, year. Everything else goes in the caption.
4. **Chart**: one hero chart; one giant number on it or beside it.
5. **Footer**: 3px rule; `Source:` with year, vintage and coverage caveats on
   the left; the **VAQ HQ** mark on the right.

Format: 4:5, 1080×1350 CSS, rendered 2× (2160×2700). `ratio: '1x1' | '9x16' |
'16x9'` in POST for the others; never wider than 16:9.

## 4. Chart roles

- **Story** marks (`var(--orange)`, which is coal on haldi and haldi on coal):
  the subject, the states in the headline, the bars that matter.
- **Context** marks (`var(--ctx)`): everything else, translucent ink. They are 46% coal on haldi and 42% cream on coal; 30% read as faint olive on phones (2026-10-28).
- **Second identity** (`var(--orange-2)`): a second series or the "fell /
  below" pole. Two colours plus context, never more.
- Label directly; legend only for three or more encoded categories.
- Signed changes use the true minus (`PK.signed`); Indian grouping for ₹ and
  counts (`PK.num` → 1,01,684).
- Gridlines `var(--grid)`, solid, never dashed. No shadows on data, no
  gradients on marks, no textures, no 3D.

## 5. The 14 formats

Mechanics from styles-original.md §3; skin from this file. Built examples
are linked.

| Format (original style) | When | Example |
|---|---|---|
| Annotated line + event band + 3-stat row (01 LEDGER) | money over time, one turning point | — |
| Dumbbell rows + change column (02 SWISS) | before/after by state | [state-exports-change](../../../infographics/state-exports-change/) |
| One 100% share bar (02 SWISS) | part of a whole, 3–5 parts | — |
| Multi-panel figure, ≤ 4 panels (04 CLEAN FIGURE) | evidence from a study | — |
| Sankey (05 FLOW DESK) | where money / energy goes | — |
| Waffle + lollipop ranking (08 BOLD WEEKLY) | "X of every 100" | [factories-waffle](../../../infographics/factories-waffle/) |
| Ridgeline (09 DATA BRIEF) | distributions shifting over decades | — |
| Candlestick + treemap (10 MARKET LIGHT) | prices, sector moves | — |
| India choropleth (11 WIRE MAP → india-map) | a number per state / district / seat | [india-map skill](../india-map/SKILL.md) |
| Hemicycle + coalition bars (13 RESULTS DESK) | seats, majorities, alliances | — |
| Bump chart + aligned table (14 SPORTS DESK) | rank over time | — |
| Beeswarm / dot strip (15 SCIENCE NOTE) | where every state falls vs a benchmark | [manufacturing-beeswarm](../../../infographics/manufacturing-beeswarm/) |
| Curve + heat table (16 MACRO MONITOR) | rates, monthly returns | — |
| Population pyramid + before→after (18 EXPLAINER) | demographics | — |

GLOBAL WIRE (17) world maps aren't built: India-POV world geometry lives in
`shared/geo/world.js` + `geo.js` if one is needed.

## 6. Never

- White or near-white grounds (except `paper` one-offs), cream-and-serif
  "editorial template" looks, neon or terminal looks, riso / halftone / paper
  grain, vintage atlas framing, academic paperwork, dashboard chrome.
- Generic web fonts (§2), a coloured single word as the only emphasis, emoji.
- Real publication names or logos. VAQ HQ's own mark is the brand.
- Any India outline other than the official one (india-map skill).
