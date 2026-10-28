---
name: india-map
description: Draw data maps of India on the official outline (PoJK, Gilgit-Baltistan, Aksai Chin inside India) at state, district (755) or Lok Sabha constituency (543) level, and turn them into scroll-stopping VAQ poster posts with one giant number. Use for any map of India with data, a choropleth, "which states/districts", district-wise or constituency-wise maps, or a map-based infographic.
---

# India maps

The map module and the poster that wraps it. Data comes from the
**india-data** skill; the PNG is rendered by **data-infographic**'s
`render.py`, the same way as every other graphic.

Finished examples, each one a `page.html` plus its source data:

| Post | Level | Look |
|---|---|---|
| [india-exports-by-state](../../../infographics/india-exports-by-state/) | state | poster / haldi, and broadsheet / coal |
| [jamnagar-district-exports](../../../infographics/jamnagar-district-exports/) | district | poster / coal |
| [india-factories-asi](../../../infographics/india-factories-asi/) | state | poster / haldi |
| [india-manufacturing-share](../../../infographics/india-manufacturing-share/) | state | poster / coal |
| [lok-sabha-seats-map](../../../infographics/lok-sabha-seats-map/) | state | WIRE MAP (pre-poster) |

## The outline is non-negotiable

`shared/geo/india.js`, `india-districts.js` and `india-pc.js` are India's
**official** outline, checked against the Survey of India outline
([build-geo.sh](build-geo.sh) rebuilds them and re-runs the check). J&K
includes PoJK; Ladakh includes Gilgit-Baltistan, Aksai Chin and the Shaksgam
valley; Arunachal Pradesh is whole. The user asked for the full map including
the disputed territory (2026-10-27); maps published in India must show it.

- Never draw India from Natural Earth admin-1, GADM, OSM, a world-atlas
  TopoJSON or a tile grid. They draw de-facto lines.
- Never hatch, dash or label the north as "disputed", and never crop it out to
  make room. Missing data is a flat neutral like anywhere else.
- Credit the boundaries in the footer: `Map: DataMeet (CC BY 4.0)`, plus
  `datta07 (MIT)` on district / constituency maps.

## 1. Start from the poster

Copy [poster-map.html](poster-map.html) to `infographics/<slug>/page.html` and
edit only its `CONFIG` block. It wears the house look from
data-infographic's styles.md (VAQ POSTER):

- `look: 'poster'` (default): Tanker caps headline, Switzer everywhere else.
  `look: 'broadsheet'` (fallback): Zodiak + Boska italic, for long or grave
  headlines.
- `ground: 'haldi'` (turmeric page, coal type, default) or `'coal'` (coal page,
  haldi type). **Alternate with the previous post.** The ramp, label inks,
  borders, hero colour and no-data fill all follow the ground; leave `ramp`
  unset unless the data needs a diverging scale.

Thumbnail rules: one finding; a headline of ≤ 8 words with the number in it;
**one giant number** on the map (`annotate`); everything else small. The page
`throw`s if `checks()` finds a number in the copy that the data doesn't back.

## 2. Load the level you need

```html
<script src="@geo/india.js"></script>            <!-- always: states -->
<script src="@geo/india-districts.js"></script>  <!-- level: 'district' (755) -->
<script src="@geo/india-pc.js"></script>         <!-- level: 'pc' (543 Lok Sabha seats) -->
<script src="@map/india-map.js"></script>
```

- **District** geometry is ~2022 (755 districts). Mirpur and Muzaffarabad
  (PoJK) are districts of J&K; Leh includes Gilgit-Baltistan and Aksai Chin.
  Districts created since are not in it.
- **Constituency** geometry is the 2008 delimitation. **Assam was re-delimited
  in 2023: never publish an Assam seat map from it.** Gilgit-Baltistan and
  Aksai Chin have no seat and draw as plain land.
- All-India district / constituency maps are **pattern maps**: no per-unit
  labels, a legend, and one to three heroes. For numbers on every unit,
  `focus: 'Uttar Pradesh'` a single state.

## 3. Match the data

State rows: `{state, value}`; "Orissa", "J&K", "NCT of Delhi", "Andaman and
Nicobar Islands", "DNH & DD", "Dadra,NH,Daman,Diu" and "UP" all resolve.
District rows: `{name, state, value}` or `{code: <LGD code>, value}`. Prefer
LGD codes when the source has them. Constituency rows: `{name, state, value}`
or `{code: <PC no.>, state, value}`.

Near-misses ("Baramulla" vs "Baramula") are matched and listed in `m.fuzzy`;
misses go to `m.unknown`; both print as `!! page:`. **Check every fuzzy match
and fix every unknown.** A wrong match silently paints the wrong district.

**DGCI&S district names** have a ready crosswalk:
[district-crosswalk-dgcis.json](district-crosswalk-dgcis.json). It maps source
names to map names (several new districts fold into one map district: sum
them) and lists what can't be mapped:

- **Andhra Pradesh** reports its 13 pre-2022 districts while the map has 26.
  Leave AP blank at district level and say so in the footer. Never paint old
  totals on new shapes.
- **"Unspecified"** rows have no place. Count them and disclose the share.

Build the page data in Python from the source file plus the crosswalk, write
it next to the page as `map-data.json`, and report coverage (% of the total
that landed on the map). See `infographics/jamnagar-district-exports/`.

## 4. API

```js
const m = IndiaMap.draw(svg, {
  width, height,                 // px of the map box
  level: 'state',                // 'state' | 'district' | 'pc'
  focus: 'Uttar Pradesh',        // optional: draw and fit one state (or an array)
  data, bins, colors,            // colors.length === bins.length + 1
  color: row => '#hex',          // or decide each fill yourself (highlight maps)
  format: v => '₹' + v,          // inline label text (row.label overrides)
  inkDark, inkLight,             // label ink; picked per fill by contrast
  names: ['Uttar Pradesh'],      // print the unit name above its value
  annotate: [{ state: 'Gujarat', title: 'Gujarat', value: '$116 bn', note: '…',
               at: [59.9, 19.3], anchor: 'start' }],   // hero; or dx/dy px offsets
  heroSize, heroTitleSize, heroInk, heroFont, heroHalo,
  labels,                        // default: on for states and focused maps
  stateBorder, stateBorderWidth, // state lines over district / pc maps
  missingFill,                   // default flat '#E6E5E1'; 'hatch' for a hatch
  align: 'left' | 'center' | 'right', valign, dx, dy, zoom, padding,
  labelFont, labelSize, nameSize, border, borderWidth, emphasisInk, outline, ...
});
IndiaMap.legend(host, { title, bins, colors, format, low, high, noData, swatch });
IndiaMap.smallTable(host, m.small, { title: 'Too small to see' });   // state level
m.xy(lon, lat) · m.unitPoint(unit) · m.match(row) · m.unknown · m.fuzzy · m.placeLeaders()
IndiaMap.ramp(['#FDEBE0', '#F4631E', '#6E2000'], 6)   // OKLab ramp from anchors
IndiaMap.quantileBins(values, 5)                     // nice quantile thresholds
```

Row flags: `emphasis` (navy outline), `hideLabel`, `small` (send a state to
the side table), `showName`, `callout` (e.g. `IndiaMap.SPOTS.bay`).

## 5. Layout that works at 4:5 (learned the hard way)

- Map `align: 'right', dx: -60`. That opens the **Arabian Sea** (lower left)
  for the hero number and the **Pakistan-side blank** (upper left) for the
  small-UT table (`smallAt: [61.4, 36.7]`). `dx: -60` keeps the NE callouts
  (Nagaland, Manipur, Mizoram) on the canvas.
- Hero for a western state: `at: [59.9, 19.3], anchor: 'start'`. For Tamil
  Nadu / the south: `at: [91.4, 10.9], anchor: 'end'` (the Bay, south of the
  A&N chain). Leaders are measured from the real text box, with a paper halo
  so they read across dark fills.
- Dek directly under the headline (`top: 'below-headline'`). The legend and
  table move themselves below the dek if they'd collide.
- A state callout that fights the hero (Goa next to a Gujarat hero, Sikkim
  under the legend) goes into the side table with `small: true`.
- Labels for tiny values: format `< 0.1`, or `hideLabel` the islands.
- Long headlines: `hSize` in CONFIG. Never let a word hyphen-break.

## 6. Colour

Set by the ground (see above). Sequential ramps run toward more contrast with
the page: haldi `#FFF3C4 → #E8590C → #111111`, coal `#3B3631 → #E8590C →
#FFD23F`. Diverging (`ramp` override): symmetric around zero with the page
colour as the midpoint and burnt orange vs coal (haldi) or orange vs haldi
(coal) as the poles, with `low` / `high` cues in the legend. Highlight maps
(which states have X): story colour for yes, the no-data fill for no. Bin
edges should be round numbers a reader would say out loud.

## 7. Render and look

Same as data-infographic: `render.py`, fix every `!!`, then **look**. The
checker can't see a label on an island, a pale state lost on the page, or a
hero number brushing a coastline. Crop the north
(`sips -c 760 900 --cropOffset 560 60 <png>`) to confirm the full outline.
