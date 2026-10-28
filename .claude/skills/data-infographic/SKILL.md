---
name: data-infographic
description: Build a single-image, data-driven chart or infographic (PNG) for VAQ HQ or Itiha in the VAQ POSTER house look (Tanker / Switzer on haldi or coal grounds), and render / check any graphic page (maps included). Use when asked for an infographic, a data post, a chart post, "something data driven like drishtadyumn", a dumbbell / waffle / beeswarm / hemicycle / line / ranking chart, or a chart in one of the original style names (SCIENCE NOTE, RESULTS DESK…). Maps of India: the india-map skill. Finding the numbers: the india-data skill.
---

# Data infographic

One post, one finding, one PNG. Built as an HTML/SVG page, screenshotted at 2×
by headless Chromium. This is **not** a studio deck: nothing goes in
`designs/`, and the editor is not involved.

The look is **[styles.md](styles.md)**, VAQ POSTER (user's pick,
2026-10-27): Tanker headlines and hero numbers, Switzer for everything else;
two alternating grounds, **haldi** (turmeric page, coal type) and **coal**
(coal page, haldi type); **broadsheet** (Zodiak + Boska) as the fallback
look. [styles-original.md](styles-original.md) is the user's earlier guide,
kept as the cookbook for chart mechanics only. Its fonts and colours are
retired.

Three skills work together:

| Skill | Does |
|---|---|
| **india-data** | finds, fetches and verifies the numbers |
| **india-map** | maps of India (state / district / constituency) and the poster-map template |
| **data-infographic** (this one) | every other chart, the house look (`kit/`), and `render.py` for all of them |

## 1. Build on the kit

Every chart page is the same skeleton (copy one of the built examples in
styles.md §5, e.g. `infographics/factories-waffle/page.html`):

```html
<link rel="stylesheet" href="@kit/poster.css">
<div id="canvas"></div>
<script src="@kit/poster.js"></script>
<script>
window.POST = {
  ground: 'haldi',            // or 'coal': alternate with the previous post
  look: 'poster',             // or 'broadsheet' for long / grave headlines
  hSize: 100,                 // optional, when the headline wraps badly
  tag: 'Topic · year',
  headline: 'Finding with a <em>number</em>',
  dek: 'What, unit, year. The second fact.',
  source: '<b>Source:</b> … (vintage, coverage)',
  data: [...],                // built from the raw source file in the folder
  checks(d, PK) { PK.check(..., 'what failed'); },   // every number in the copy
};
function draw(svg, box, PK) { /* SVG in box.w × box.h, using var(--…) colours */ }
PK.run();
</script>
```

`PK.run()` lays out slug, headline, dek and footer, gives `draw` the space
that's left, runs `checks` first, and sets `__ready`. Helpers: `PK.el(parent,
tag, attrs, text)`, `PK.scale(d0, d1, r0, r1)`, `PK.num(v, dp)` (Indian
grouping, true minus), `PK.signed(v, dp)`, `PK.check(ok, msg)`. Colours are
CSS tokens (`var(--orange)` = story, `var(--orange-2)` = second, `var(--ctx)` =
context, `var(--grid)`, `var(--paper)`); text classes `pk-label`, `pk-value`,
`pk-axis`, `pk-key`, `pk-note`, `pk-big`. Never hard-code a hex in a page:
the same page must work on both grounds.

Pick the format from styles.md §5 by the story. Say in one line which format
and ground you chose.

Format: 4:5, 1080×1350 CSS, rendered at 2× (2160×2700); `ratio` in POST for
1:1, 9:16 or 16:9. Never wider than 16:9.

## 2. Data: real, sourced, verified

Use the **india-data** skill. Real data only (fictional only on request,
labelled "Illustrative data"); the raw source file saved next to the page;
headline numbers cross-checked; vintage and coverage in the footer.

## 3. Copy

Slug → headline → dek → chart → footer (styles.md §3).

- **The headline states the finding**, with a number in it. Not the topic.
- **Every number in the headline and dek is recomputed in the page script**,
  and the script `throw`s if it doesn't match. A failed check is a render error,
  which is the point. See the reference build.
- VAQ voice: no em dashes, direct, no "not X, it's Y", no slogan triplets.
  Dek ≤ 2 lines at 40px.
- Type sizes are fixed (styles.md §2, user 2026-10-28): dek 40, labels 36,
  values 40, secondary 31, source 23. Cut chart elements to fit, never
  shrink type.
- Footer left: `Source: …`. Add `Map: DataMeet (CC BY 4.0)` on any India map;
  the licence requires it. Footer right: the brand mark, **VAQ HQ · @vaq_hq** or
  **Itiha · @itiha29**. (The guide bans *real publication* names because they
  aren't ours; our own mark is the point.)

## 4. India maps

Use the **india-map** skill: the IndiaMap module, the official-outline
boundaries (state, district, constituency), the DGCI&S district crosswalk and
the poster-map template.

## 5. Other charts

For non-map charts, load D3 from a pinned URL:
`https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js`. Follow the style's
"How to build it" recipe in styles.md. Label directly; no legend for one series.

## 6. Render, check, look

```bash
./.venv/bin/python .claude/skills/data-infographic/render.py \
  infographics/<slug>/page.html "$HOME/Instagram Itiha Renders/<slug>/<slug>.png"
```

(Use `ITIHA_OUTPUT_ROOT` from `.env` instead of `~/Instagram Itiha Renders` if
it is set. Renders never go in the repo; `infographics/<slug>/page.html` does.)

- The page needs one `#canvas` element at the format's CSS size. Set
  `window.__ready = false` before drawing and `true` after.
- Script prefixes the renderer rewrites: `@kit/` → this skill's `kit/`,
  `@geo/` → `shared/geo/`, `@map/` → `.claude/skills/india-map/`.
- Every `!!` line is a defect: text off the canvas, clipped, or on top of
  other text, or a page error. Fix and re-render until there are none.
- Then **look at it**: `sips -Z 1100 <png> --out <scratchpad>/p.png` and Read
  it. The checker can't see a label sitting on an island, a pale state
  vanishing into the page, or a name running into a border. Crop the north
  (`sips -c 760 900 --cropOffset 560 60`) to confirm the full outline.

## 7. Deliver

Give the PNG path, the one-line style choice, and a caption for posting:
two or three lines of context, the sources, `Map: DataMeet (CC BY 4.0)`, and
the handle. The user posts manually from the Instagram app.
