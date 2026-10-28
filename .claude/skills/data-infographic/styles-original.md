# Infographic & Data-Visualisation Style Guide

A house style guide for publication-grade charts, infographics and data graphics. Paste this whole file into a new thread, name the style you want (e.g. **"Use style: SCIENCE NOTE"**), give the topic and data, and the graphic should follow the rules below.

The guide contains only the styles that were approved during review. Rejected looks are listed under **Never use**, so they don't creep back in.

---

## 0. How to use this guide

Paste this file into a thread, then send a prompt like this:

```
Use style: <STYLE NAME from the index>
Topic / story: <what the graphic is about, the one finding it should show>
Data: <paste data, or "invent plausible fictional data and label it as illustrative">
Format: <1:1 | 4:5 | 16:9 | 9:16>  (default 16:9, 1920×1080)
Output: PNG only
Extras (optional): <second chart, stat callouts, specific annotation>
```

If no format is given, use **16:9 at 1920×1080**. Always deliver a **PNG**. Don't hand back HTML or code files unless asked.

---

## 1. Style index (quick pick)

| # | Style | Best for | Headline font | Body / data font | Accent | Native ratio |
|---|---|---|---|---|---|---|
| 01 | **THE LEDGER** | Finance, markets, economics, trade, annotated time series | Playfair Display | Source Serif 4 + Inter Tight | Claret `#990F3D` on salmon paper | 4:5 / 16:9 |
| 02 | **SWISS BULLETIN** | Rankings, before/after, country comparisons, shares | Inter Tight 800 | Inter Tight | Red `#E3120B` | 4:5 / 1:1 |
| 04 | **CLEAN FIGURE** | Research findings, studies, multi-panel evidence | Source Serif 4 | Inter | Okabe–Ito blue/orange | 4:5 / 1:1 |
| 05 | **FLOW DESK** (light) | Flows, budgets, energy, where-the-money-goes (Sankey) | IBM Plex Sans Condensed | IBM Plex Mono | Amber `#FFA028` | 16:9 |
| 08 | **BOLD WEEKLY** | Big-statement magazine graphics, surveys, parts-of-whole | Archivo (condensed 900) | Archivo | Blue `#1D4ED8` | 1:1 / 4:5 |
| 09 | **DATA BRIEF** | Distributions, climate, "how things shifted" | IBM Plex Serif | IBM Plex Sans | Teal `#0F766E` → warm ramp | 4:5 / 9:16 |
| 10 | **MARKET LIGHT** | Stocks, price action, sector moves | Barlow Condensed | JetBrains Mono | Green `#0E9F6E` / red `#E02424` | 16:9 |
| 11 | **WIRE MAP** | US state data, regional comparisons, tile maps | Libre Franklin 800 | Libre Franklin | Orange `#EA580C` ramp | 1:1 / 16:9 |
| 13 | **RESULTS DESK** ★ | Elections, votes, seat shares, coalitions, compositions | Schibsted Grotesk 900 | Schibsted Grotesk | Party palette + live red | 16:9 |
| 14 | **SPORTS DESK** | League tables, rankings over time, form, head-to-heads | Oswald 700 | Inter | Orange `#FF4F00` + blue `#0057FF` | 16:9 |
| 15 | **SCIENCE NOTE** ★ | Almost anything: distributions, dot plots, comparisons, explainers | Red Hat Display 900 | Red Hat Text | Violet `#5B3FD0` + coral | 4:5 / 16:9 |
| 16 | **MACRO MONITOR** ★ | Rates, macro indicators, returns tables, curves | Space Grotesk 700 | DM Mono | Lime `#C6F432` highlight | 4:5 / 16:9 |
| 17 | **GLOBAL WIRE** | World maps, country comparisons, global totals | Figtree 800/900 | Figtree | Teal `#007C89` | 16:9 (never wider) |
| 18 | **EXPLAINER** ★ | Demographics, population, before/after, visual explainers | Bricolage Grotesque 800 (narrow) | Bricolage Grotesque | Green `#0B6E4F` + amber `#E09F3E` | 4:5 / 9:16 |

★ = strongest favourites. **SCIENCE NOTE (15)** is the default all-rounder when no style is named.

---

## 2. Global rules (apply to every style)

### 2.1 Ratios & canvas

| Use | Ratio | Pixel size (export) |
|---|---|---|
| YouTube thumbnail, X/LinkedIn post, slides | **16:9** | 1920×1080 |
| Instagram/LinkedIn feed (tall) | **4:5** | 1080×1350 |
| Square feed post | **1:1** | 1080×1080 |
| Stories, Reels, Shorts | **9:16** | 1080×1920 |

- **Hard limit: never wider than 16:9.** No 2:1, 3:1 or banner/panoramic layouts. If the content wants to be wide, stack it into a 16:9 layout instead.
- Tall and square formats are fine.
- Design at the CSS size, then export at 1.5× or 2× device scale so text stays crisp.
- Keep ~40–48 px outer margins at 1080-wide sizes, and 56–64 px at 1920-wide.
- Keep all key content inside the central 90% so it survives platform cropping. On 16:9 thumbnails, keep the bottom-right corner clear of key data, because YouTube puts the duration badge there.

### 2.2 Anatomy of every graphic (top to bottom)

1. **Kicker**: a small uppercase topic label in the accent colour, with 1.2–2 px letter-spacing (e.g. `CLIMATE · DATA BRIEF`).
2. **Headline**: states the finding, not just the topic. Use "Heat pumps now outsell furnaces in 29 states", not "Heat pump sales".
3. **Dek / standfirst**: one or two sentences saying what is measured, the unit, the place and the time span.
4. **Chart title + unit line** (optional when the dek already covers it), e.g. "GWh per year, by country".
5. **The chart(s)**: one hero chart. Add a second supporting chart only if it adds a new angle.
6. **Footer**: `Source: <name> · Illustrative data` on the left and a small publication/desk mark on the right.

### 2.3 Rules & regulations

**Data honesty**
- Every number in the headline, dek or a stat callout must match the plotted data. Compute it from the data, never type it from memory.
- Fictional data must be labelled in the footer as "Fictional", "Illustrative data" or "Simulated data".
- Bars always start at zero. Line charts may use a cropped y-axis.
- Use the true minus sign `−` (U+2212), thousands separators (`1,299`), and tabular numerals (`font-variant-numeric: tabular-nums`).
- Units go in the dek, subtitle or axis, never only in a legend.

**Colour**
- Light mode only. The background is white, off-white or a light paper tint.
- Use one accent colour for the story and greys for context. Two accents only when comparing two highlighted series.
- Use colour-blind-safe pairs (blue/orange, violet/coral, green/amber). Never encode meaning with red vs green alone. Add ▲/▼, +/− or labels.
- Diverging scales are always symmetric around zero, with a near-white midpoint.

**Labelling**
- Label lines, bars and dots directly. Use a legend only when there are three or more categories and direct labels would collide.
- Nudge labels apart (minimum 14–18 px vertical gap) so they never overlap.
- Use 1–3 annotations per chart, no more. Each one is a short phrase with a thin leader line.
- Keep axis labels small (11–13 px) and muted grey. Gridlines are hairlines (1 px, very light) and horizontal only, unless the chart needs vertical guides.
- No chart junk: no 3D effects, drop shadows on data, gradients on bars, or decorative icons.

**Typography**
- Two font families per graphic at most: headline + body/data. A mono can stand in as the data font in desk styles.
- Hierarchy at 1080-wide: headline 40–64 px, dek 15–19 px, chart text 11–15 px, footer 11–12.5 px.
- Headline line-height 0.9–1.15, with tight tracking (−0.5 to −1.6 px) on large sans headlines.
- Limit headlines to 2 lines, or 3 for tall formats.

**Production**
- Build as HTML/SVG with D3 v7 and Google Fonts, then export a PNG by headless browser screenshot at 1.5–2× scale.
- Wait for fonts (`document.fonts.ready`) and any map data to load before capturing.
- Check the PNG before delivering: no clipped text, no overlaps, no text running off the canvas, headline numbers matching the data.

### 2.4 Never use (rejected looks)

- ❌ **Dark mode** of any kind: dark backgrounds, "terminal black" or night themes. A thin dark header strip is the maximum (see MACRO MONITOR).
- ❌ **Vintage / antique cartography**: parchment backgrounds, EB Garamond-style old-book type, shaded-relief hillshade terrain, ornamental double frames, "Plate XIV" atlas framing.
- ❌ **Risograph / zine / print-texture looks**: halftone dots, two-ink misregistration, paper grain, playful isometric 3D blocks, neon pink and blue.
- ❌ **Over-academic clutter**: journal header bars, DOIs, author lists with affiliations, "Fig. 3 |" captions, p-value brackets everywhere.
- ❌ **Banner/panoramic ratios** wider than 16:9.
- ❌ Real publication names, logos or bylines. Use invented desk names such as "THE LEDGER", "WIRE" or "RESULTS DESK".
- ⚠️ Not preferred (neutral, don't default to these): cool-blue serif broadsheet with slope charts, and the consulting/annual-report "Boardroom" look (navy, waterfall + marimekko).

### 2.5 Font pairing cheat-sheet

| Style | Headline | Body / labels | Data / numbers | Why it works |
|---|---|---|---|---|
| THE LEDGER | Playfair Display 700 | Source Serif 4 (dek), Inter Tight (chart) | Inter Tight | High-contrast serif authority with a clean grotesk for data |
| SWISS BULLETIN | Inter Tight 800 | Inter Tight 400–500 | Inter Tight 700 | One family across weights gives a disciplined Swiss feel |
| CLEAN FIGURE | Source Serif 4 600 | Inter | Inter | Bookish headline, neutral scientific labels |
| FLOW DESK | IBM Plex Sans Condensed 600 | IBM Plex Mono | IBM Plex Mono | Same superfamily, so it reads technical but unified |
| BOLD WEEKLY | Archivo 900, width 68% | Archivo 400–800 | Archivo 900 | Condensed poster headline and normal-width body from one variable font |
| DATA BRIEF | IBM Plex Serif 500 | IBM Plex Sans | IBM Plex Sans | Serif/sans twins from one superfamily |
| MARKET LIGHT | Barlow Condensed 600 | JetBrains Mono | JetBrains Mono | Condensed news headline plus trading-screen mono |
| WIRE MAP | Libre Franklin 800 | Libre Franklin 400–700 | Libre Franklin | Classic news-agency grotesk |
| RESULTS DESK | Schibsted Grotesk 900 | Schibsted Grotesk 500–700 | Schibsted Grotesk 800 | A newsroom typeface built for headlines and tables |
| SPORTS DESK | Oswald 700 (uppercase) | Inter | Inter 700 | Loud condensed sports headline, calm readable data |
| SCIENCE NOTE | Red Hat Display 900 | Red Hat Text | Red Hat Text | Display/Text optical pair, friendly but credible |
| MACRO MONITOR | Space Grotesk 700 | DM Mono | DM Mono | Quirky modern grotesk plus soft mono for numbers |
| GLOBAL WIRE | Figtree 800–900 | Figtree 400–700 | Figtree 700 | Geometric, open and international |
| EXPLAINER | Bricolage Grotesque 800, width 80% | Bricolage Grotesque 400–600 | Bricolage Grotesque 800 | Characterful variable grotesk with editorial personality |

Google Fonts load string (all styles):
```
https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Inter+Tight:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@400;600&family=IBM+Plex+Serif:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Archivo:wdth,wght@62..125,400..900&family=Barlow+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Libre+Franklin:wght@400;500;600;700;800;900&family=Schibsted+Grotesk:wght@400;500;600;700;800;900&family=Oswald:wght@500;600;700&family=Red+Hat+Display:wght@500;700;900&family=Red+Hat+Text:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700;800;900&family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&display=block
```

---

## 3. The styles

Each style lists: **Ratios · References · Fonts & pairing · Colours · How to build it · Do · Don't**.

---

### 01 · THE LEDGER: financial broadsheet

**Ratios:** 4:5 portrait (native 760×1000 design), 16:9 for thumbnails (chart left, stats right).

**References:** the salmon-paper business daily. Calm, authoritative, annotated line charts, with a serif headline over a grotesk chart.

**Fonts & pairing**
- Headline: Playfair Display 700, 42 px (at 760 wide), line-height 1.08, tracking −0.4 px.
- Dek: Source Serif 4 400, 19 px, line-height 1.42.
- Kicker: Inter Tight 600, 14 px, uppercase, tracking 1.4 px, claret.
- Chart title: Inter Tight 600, 16 px. Unit line: Inter Tight 14 px `#66605C`.
- Axis/labels: Inter Tight 13 px. Annotations: Source Serif 4 *italic* 13 px.
- Big stats: Playfair Display 700, 40 px, claret.

**Colours**
| Token | Hex |
|---|---|
| Paper background | `#F3E5D8` |
| Ink | `#33302E` |
| Secondary text | `#66605C` / dek `#4D4845` |
| Gridlines | `#D8C7B9` |
| Divider rule | `#C9B8AA` |
| Accent 1 (hero series) | Claret `#990F3D` |
| Accent 2 (second series) | Teal `#0D7680` |
| Context series | `#9E9590`, `#C2B6AC` |
| Event band | `#E7D3C4` |

**How to build it**
1. Put a short 64×3 px ink rule at top-left, then the kicker, headline and dek.
2. Add a chart title with the unit line beneath (e.g. "Index, January 2023 = 100").
3. Line chart: horizontal gridlines only. Draw the baseline (e.g. 100 or 0) as a darker 1.2 px ink line. Put y labels on the left and year ticks along the bottom with 6 px tick marks.
4. Line weights: hero 3 px claret, second 2.4 px teal, context 1.6 px greys. Use monotone curves.
5. End each line with a 3.5 px dot and a **direct label** in the series colour at the right edge. No legend.
6. Mark the key event with a shaded vertical band (`#E7D3C4`) and a two-line italic serif note.
7. Annotate the peak or trough with a thin curved leader: bold value plus date.
8. Under the chart, add a thin rule and a **three-stat row** (big claret Playfair number with a two-line grotesk caption).
9. Footer: source left, "© The Ledger" right, Inter Tight 12.5 px.

**Do:** annotate the turning point, use direct labels, keep one hero line, use warm-paper calm.
**Don't:** use more than 4 lines, use legends, use bright colours, or put gridlines in both directions.

---

### 02 · SWISS BULLETIN: weekly news magazine

**Ratios:** 4:5 (native 760×1000), 1:1, or 16:9 with the chart taking 65% of the width.

**References:** the red-flag weekly news magazine. Swiss grid, heavy grotesk headline, striped rows and dumbbell charts.

**Fonts & pairing:** Inter Tight only.
- Section label: 700, 14 px, uppercase, tracking 1 px, red.
- Headline: 800, 50 px, tracking −1.6 px, line-height 1.
- Dek: 400, 19 px, line-height 1.35, max ~640 px wide.
- Chart title 700 17 px; unit line 400 15 px `#555`; labels 500 15 px; values 700 14 px.

**Colours**
| Token | Hex |
|---|---|
| Background | `#FBFAF7` |
| Ink | `#121212` |
| Signature red | `#E3120B` |
| Dark red | `#9C0D07` |
| Start-value grey | `#9AA5AE` |
| Greys | `#6B7680`, `#C3CAD0` |
| Row stripe | `#F0EEE8` |
| Gridlines | `#D9D9D9` |

**How to build it**
1. Run a 6 px full-width red line across the very top. Below it, place a 56×14 px red flag rectangle top-left, then the section label, headline and dek.
2. **Dumbbell chart:** rows 33 px tall with alternating `#F0EEE8` stripes. Put x-axis labels at the **top**. The zero line is a 1.2 px ink line.
3. Start value: grey dot r=6. End value: red dot r=7. Both get a 1.5 px stroke in the background colour. Connect them with a 2 px ink line.
4. A right-hand column headed "×CHANGE" shows bold multiples (×2.3). Show "*new*" in italic red when the base is near zero.
5. Legend: two dots with labels below the chart, plus one italic takeaway line on the right.
6. **Share bar** (second chart): a single 100% horizontal bar of 34 px with segments in red / dark red / ink / greys. Put white bold % inside each segment and the label underneath.
7. Footer: 1 px `#DDD` top rule, source left, the publication name uppercase on the right.

**Do:** use ranked order, stripes for readability, one red series, and the multiples column.
**Don't:** use more than two highlight colours, round corners, or soft pastel fills.

---

### 04 · CLEAN FIGURE: research findings (not too academic)

**Ratios:** 4:5 or 1:1 for a 2×2 grid, 16:9 for 1×2 or 1×3 panels.

**References:** a top science-journal figure, stripped of the academic paperwork. It should read like a research brief in a quality newspaper.

**Fonts & pairing**
- Kicker: Inter 600, 12.5 px, uppercase, tracking 1.4 px, blue (e.g. `RESEARCH BRIEF · COASTAL ECOLOGY`).
- Headline: Source Serif 4 600, 26–32 px, line-height 1.2.
- Dek: Inter 15 px `#444`.
- Panel titles: Inter 700, 14 px, plain language ("Growth falls as sediment rises"). Units: Inter 12 px grey.
- Axes and ticks: Inter 11.5 px. Footer note: Inter 12.5 px `#555`.

**Colours** (Okabe–Ito, colour-blind safe)
| Token | Hex |
|---|---|
| Background | `#FFFFFF` |
| Ink / axes | `#111111` |
| Blue | `#0072B2` |
| Orange | `#D55E00` |
| Green | `#009E73` |
| Control grey | `#BDBDBD` |
| Heatmap | RdBu diverging, symmetric −1…0…+1 |

**How to build it**
1. Lay out panels in a 2×2 grid, each with a bold plain-language title and a unit line. Small letters (a, b, c) are optional; titles matter more.
2. Axes: 0.9 px black with outward ticks. Put the y unit in the panel subtitle rather than a rotated label.
3. Chart recipes:
   - **Scatter + fit:** semi-transparent dots (r 2.6, 55% opacity), OLS line 1.8 px, 95% CI band at 18% opacity. Label the groups at the line ends.
   - **Bars + spread:** bars with a 0.8 px black outline, mean ± standard error whiskers, jittered hollow dots for individual points. Write the effect in words ("−62% vs none").
   - **Correlation heatmap:** lower triangle only, values printed in cells (white text when |r| > 0.6), small colour bar.
   - **Step curves (survival or share-remaining):** 1.7 px step lines, small censor ticks, end labels in the series colour, % y-axis.
4. Footer: one line explaining the marks plus the source ("Lines show fits with 95% confidence bands… Source: simulated field data").

**Do:** use plain-English titles, at most 3–4 panels, generous white space, and colour-blind palettes.
**Don't:** use journal header bars, DOIs, author/affiliation lines, "Fig. 3 |" captions, stacks of p-value brackets, or more than 4 panels.

---

### 05 · FLOW DESK: light-mode terminal Sankey

**Ratios:** 16:9 (Sankey wants width). Headline column on the left (≈30%), flows on the right (≈70%). On 4:5, put the KPI tiles below.

**References:** a financial-terminal energy monitor, **in daylight**: amber function bar, ticker strip, mono numbers, flow diagram. Original dark version rejected. **Light only.**

**Fonts & pairing**
- Headline: IBM Plex Sans Condensed 600, 38–44 px, tracking −0.3 px.
- Everything else: IBM Plex Mono. Function bar 600 13 px, ticker 12 px, node labels 500 12.5 px uppercase, values 12 px.

**Colours**
| Token | Hex |
|---|---|
| Background | `#FFFFFF` |
| Ticker strip | `#F3F5F8`, text `#5B6673` |
| Ink | `#0E1621`; muted `#6B7684` |
| Function bar | amber `#FFA028` with ink text |
| Up / down | `#0F9D58` ▲ / `#D93025` ▼ |
| Grid | `#F1F3F6` |
| Flow nodes | solar `#E8A600`, wind `#2BA3D9`, hydro `#1F6FC5`, nuclear `#8A5CF6`, gas `#F2683C`, coal `#6B7785`, oil `#D64545`, carrier `#F08C00`, secondary carrier `#4A5866`, end uses `#AAB4BF`, losses `#E5484D` |

**How to build it**
1. Top amber bar: `CODE <GO> · FUNCTION NAME` on the left, date and time on the right.
2. Ticker strip: 4–5 instruments with coloured ▲/▼ moves.
3. Kicker `■ GRID / FLOWS / 2026 YTD` in amber, then the condensed headline and a mono dek ("Primary energy → carrier → end use · TWh").
4. **Sankey** (d3-sankey): node width 9–10 px, padding 14–16 px, three columns (source → carrier → use). Links use a source-to-target gradient at 35–45% opacity. Losses get the red node.
5. Labels: uppercase mono name plus value and share ("RESIDENTIAL 280 TWh · 21%"), with a 3 px white halo where they sit over links.
6. **KPI tiles:** 4 tiles (border `#E3E7EC`, fill `#FAFBFC`). Each has an uppercase label (11 px), a value (25 px), a coloured delta, and a sparkline with a 12% area fill.
7. Footer: `SRC: … (FICTIONAL)` left, `ILLUSTRATIVE DATA · NOT FOR TRADING` right, mono 11 px.

**Do:** use light ground, mono numbers, percent shares on end nodes, and one red "losses" node.
**Don't:** use a dark background, neon glows, or more than ~15 nodes.

---

### 08 · BOLD WEEKLY: condensed-grotesk magazine

**Ratios:** 1:1 (native 960×960), 4:5. On 16:9, put the headline on the left and the two charts on the right.

**References:** a bold business-weekly magazine. Huge condensed uppercase headline, black rules, a single electric blue.

**Fonts & pairing:** Archivo (variable width) only.
- Tag box: Archivo 700, 13 px, tracking 1.5 px, white on blue.
- Headline: Archivo 900, `font-stretch: 68%`, 84 px, line-height 0.9, uppercase, tracking −1 px.
- Dek: Archivo 400, 18 px, line-height 1.4.
- Chart titles: Archivo 800, 14 px, uppercase. Unit lines 14 px `#555`.
- Big numbers: Archivo 900, 44 px. Labels 500 15 px. Values 700 14 px.

**Colours**
| Token | Hex |
|---|---|
| Background | `#FFFFFF` |
| Ink | `#0B0B0B` |
| Blue | `#1D4ED8` |
| Light blue | `#9DB8F7` |
| Neutral square | `#DCDFE5` |
| Below-average grey | `#9AA1AB` |
| Gridlines | `#EEEEEE` |

**How to build it**
1. 14 px black bar across the very top, then the blue tag box (`WORK`) and the two-line condensed headline.
2. **Waffle chart** (left): 10×10 grid of 29 px squares with 4 px gaps. Fill row by row with blue, light blue, then grey. Below it, put big coloured percentages with short captions ("14% Fully remote").
3. **Lollipop ranking** (right): rows 38 px, stems 2.5 px, dots r=8. Items above the average are blue, the rest grey. Add a dashed black average line with an italic label ("All workers 43%"). Put bold values to the right of each dot.
4. Add an italic footnote for the sample. The footer has a 3 px black top rule, source left, and the magazine mark right.

**Do:** pair one big headline with one big number, use a single blue, and keep strong black rules.
**Don't:** use more than three waffle categories, rainbow colours, or a headline longer than ~6 words.

---

### 09 · DATA BRIEF: clean research note

**Ratios:** 4:5 or 9:16 tall (native 620×960). On 16:9, put the ridgeline right and the text left.

**References:** a clean think-tank or data-desk brief. Quiet serif headline, plenty of white, one elegant chart.

**Fonts & pairing**
- Kicker: IBM Plex Sans 600, 12 px, uppercase, tracking 1.5 px, teal.
- Headline: IBM Plex Serif 500, 31 px, line-height 1.15.
- Dek: IBM Plex Sans 14.5 px, line-height 1.45, `#4A4A4A`.
- Labels: IBM Plex Sans 500 14 px (row labels), 12.5–13 px axes. Footer 11.5 px `#777`.

**Colours**
| Token | Hex |
|---|---|
| Background | `#FFFFFF` |
| Ink | `#1A1A1A` |
| Kicker teal | `#0F766E` |
| Ridge ramp | interpolate `#8DB9D6` (oldest/coolest) → `#C8442C` (newest/hottest) |
| Baselines | `#D8D8D8` |

**How to build it**
1. Kicker, a two-line serif headline that states the shift ("Summers aren't just hotter. They are less predictable."), and the dek.
2. **Ridgeline:** 6–8 rows with a row step of ~70 px. Each ridge can rise ~100–120 px, so they overlap.
3. Fill each ridge from the cool→warm ramp by row at 90% opacity, with a **2 px white stroke** separating overlaps. Add a thin grey baseline per row.
4. Row labels on the left. On the right, a computed metric per row coloured to match its ridge ("Days ≥ 35°C: 1% … 21%").
5. Add a dashed threshold line with a two-line label placed beside it so it doesn't collide.
6. Put the x-axis with units (°, %, $) under the last ridge, plus a one-line axis title.

**Do:** use one chart, a temperature-style ramp, white separation strokes, and a computed right-hand metric.
**Don't:** use heavy outlines, more than 8 ridges, or a second chart competing with the first.

---

### 10 · MARKET LIGHT: daylight trading desk

**Ratios:** 16:9 (native 1400×760, scale to 1920×1080). Price chart ≈60% left, treemap ≈35% right.

**References:** a trading-screen chart moved onto off-white paper. Ticker strip, candlesticks, sector heat-treemap.

**Fonts & pairing**
- Headline: Barlow Condensed 600, 46 px, tracking −0.3 px.
- Everything else: JetBrains Mono. Ticker 12.5 px, dek 13 px, axes 12 px, annotations 700 13 px, treemap tickers 700 11–22 px (scaled to tile area).

**Colours**
| Token | Hex |
|---|---|
| Background | `#FAFAF7` |
| Ink | `#16181D` |
| Strip border | `#E4E4DE` |
| Up | `#0E9F6E` |
| Down | `#E02424` |
| Moving average | amber `#D97706` |
| Gridlines | `#E8E8E2` |
| Treemap scale | `#E8524F` (−3.5%) → `#F1F1EC` (0) → `#16A673` (+3.5%) |
| Sector header fill | `#E6E6E0` |

**How to build it**
1. Ticker strip: the focus ticker's last close and change (computed from the data), 3–4 other instruments, date and time right-aligned.
2. Headline with the computed % move ("Northwind jumps 12% in three months on a record quarter"), then a mono dek describing the chart.
3. **Candlesticks:** up candles are hollow (background fill, green 1.3 px stroke); down candles are solid red. Wicks 1.2 px. Price axis on the **right**.
4. Moving-average line 1.8 px amber with a small label.
5. Event annotation: vertical leader from the candle plus bold mono text ("Q3 results · +11.2%").
6. **Volume bars** underneath, coloured by direction at 35% opacity, with month labels along the bottom.
7. **Treemap:** grouped by sector, with an 11 px bold sector header and 2 px padding. Each tile shows the bold ticker plus the % change. Use white text when |change| > 2%.
8. Footer: `SRC: … (FICTIONAL)` left, `ILLUSTRATIVE · NOT INVESTMENT ADVICE` right.

**Do:** use hollow up-candles, the right-side price axis, and computed headline numbers.
**Don't:** use a dark theme, neon, 3D, or more than ~20 treemap tiles.

---

### 11 · WIRE MAP: news-agency tile map

**Ratios:** 1:1 or 16:9 (native 920×760). Map ≈75% of the width, legend and trend in a narrow right column.

**References:** a wire-service or news-agency graphic. Franklin grotesk, orange sequential ramp, tile-grid cartogram.

**Fonts & pairing:** Libre Franklin only.
- Kicker: 700, 12.5 px, tracking 1.2 px, `#C2410C`, preceded by a 10 px solid orange square.
- Headline: 800, 36 px, tracking −0.8 px.
- Dek: 400, 15.5 px, `#444`.
- Tile text: abbreviation 700 11.5 px, value 500 11.5 px. Legend 13 px. Footer 12 px `#777`.

**Colours** (6-step sequential orange)
`#FFF1E2` → `#FDD0A2` → `#FDA662` → `#F47B2B` → `#D9520B` → `#9A3A06`
Ink `#121212`. Tile text is white on the darkest two steps and `#3A2412` otherwise.

**How to build it**
1. Tile-grid US map: square tiles of 54 px with a 5 px gap and 3 px corner radius. Layout (abbr, col, row):
   ```
   AK,0,0 ME,10,0 VT,9,1 NH,10,1 WA,0,2 ID,1,2 MT,2,2 ND,3,2 MN,4,2 IL,5,2 WI,6,2 MI,7,2 NY,8,2 RI,9,2 MA,10,2
   OR,0,3 NV,1,3 WY,2,3 SD,3,3 IA,4,3 IN,5,3 OH,6,3 PA,7,3 NJ,8,3 CT,9,3 CA,0,4 UT,1,4 CO,2,4 NE,3,4 MO,4,4
   KY,5,4 WV,6,4 VA,7,4 MD,8,4 DE,9,4 AZ,1,5 NM,2,5 KS,3,5 AR,4,5 TN,5,5 NC,6,5 SC,7,5 DC,8,5 OK,3,6 LA,4,6
   MS,5,6 AL,6,6 GA,7,6 HI,0,7 TX,3,7 FL,8,7
   ```
2. Each tile shows the abbreviation top-left, the value top-right, and a **mini sparkline** (1.3 px) of the trend in the lower half.
3. Legend: a vertical stepped legend with a dashed rule at the meaningful threshold, labelled in italic ("↑ outsell furnaces").
4. Below the legend, a national trend mini area chart with a bold end value.
5. Compute the headline count from the data ("…in 29 states").

**Do:** use threshold steps rather than a continuous scale, label the threshold, and put sparklines in tiles.
**Don't:** use real geographic outlines for state-level data in this style, more than 6 colour steps, or rainbow ramps.

---

### 13 · RESULTS DESK ★: election-night live graphic

**Ratios:** 16:9 (native 1160×820). Hemicycle left (~50%), table and coalitions right. On 4:5, stack the hemicycle on top and the table below.

**References:** a broadcaster's or newspaper's election-night results page. LIVE badge, parliament chart, coalition maths.

**Fonts & pairing:** Schibsted Grotesk only.
- Live badge: 700, 12 px, white on red, text "● LIVE". Kicker 700 13 px, tracking 1.4 px ("VARNIA DECIDES 2026 · 98% COUNTED").
- Headline: 900, 46 px, tracking −1.4 px, line-height 1.02.
- Dek: 400, 17 px, `#444`.
- Table: headers 700 12 px `#777`, party names 600 15 px, seats 800 16 px, change 600 15 px.
- Hemicycle centre number: 900, 64 px, in the winning party's colour.

**Colours**
| Token | Hex |
|---|---|
| Background | `#FFFFFF` |
| Ink | `#0F0F10` |
| Live red / party A | `#E3242B` |
| Party B (blue) | `#1F5AA6` |
| Party C (green) | `#3FA34D` |
| Party D (yellow) | `#F2B700` |
| Party E (purple) | `#5B3A8C` |
| Others | `#A3A8AF` |
| Gain / loss | `#0F7B3F` / `#C0262D` |
| Row rules | `#EEEEEE` |

**How to build it**
1. **Hemicycle:** 10 rows, radii from 134 to 290 px. Give each row a seat count proportional to its radius, then fix rounding on the outer row. Place seats at angles from π to 0, sort all seats by angle (then radius), and assign parties left to right in political order. Seat dot radius ≈6.6 px.
2. Draw a dashed vertical majority line through the centre, labelled "151 FOR MAJORITY". Put the winner's seat count huge in the centre gap with the party name underneath.
3. **Results table:** colour chip, party name, mini bar, seats (right-aligned, bold), +/− change in green or red, with a 1 px `#EEE` rule under each row. Sort by seats.
4. **Paths to majority:** 3–4 coalition options as stacked 18 px bars from party colours, with a dashed majority line. Show the total at the end, with a green ✓ if it reaches the majority and grey if not.
5. Party legend with dots under the hemicycle.

**Also great for:** budget allocations, board compositions, vote shares, any "who has how much and can they combine" story.

**Do:** use the live badge, majority line, coalition maths and party colours consistently.
**Don't:** use pie charts, 3D parliament renders, or more than ~8 parties without grouping into "Others".

---

### 14 · SPORTS DESK: condensed sports analysis

**Ratios:** **16:9** (1920×1080). The bump chart takes ~60% of the width, and the league table on the right is aligned to final positions.

**References:** a modern sports data desk. Loud uppercase condensed headline, orange and black, form-guide squares.

**Fonts & pairing**
- Headline: Oswald 700, 56–64 px, uppercase, tracking −0.5 px, **one line**. Compute it from the data ("HARBOUR CITY: FROM 10TH TO 1ST").
- Kicker: Inter 700, 13 px, tracking 2 px, orange ("NORTHERN LEAGUE · MATCHWEEK 14").
- Body, labels, table: Inter (400–700). Week numbers 600 12 px `#888`.

**Colours**
| Token | Hex |
|---|---|
| Background | `#F7F7F5` |
| Ink | `#0B0B0C` |
| Hero team | orange `#FF4F00` |
| Rival team | blue `#0057FF` |
| Other teams | `#C4C7CC` (lines), lighter if busy |
| Grid | `#E9E9E5` |
| Form: W / D / L | `#1FA463` / `#B8BCC2` / `#E5484D` |
| Top bar | 10 px, half orange, half black |

**How to build it**
1. **Bump chart:** weeks on x, rank on y (1 at the top), with smooth bump curves (`curveBumpX`).
2. Other teams: thin light-grey lines with no labels on the left.
3. The two highlighted teams get 5 px lines with a rank number inside an 11 px circle at every week.
4. Add **2–3 annotations** on the hero line ("Bottom after week 4", "Top for the first time, week 12") and one on the rival ("Led for 10 weeks").
5. **League table aligned to the chart:** each row sits at its final-rank y position, joined to the line end by a dashed connector. Columns: Pos, Team, P, W, D, L, Pts, Last 5 (15×16 px form squares with letters). Tint the highlighted rows (orange or blue at ~12%).
6. **Stat chips** under the headline: points, unbeaten run, places climbed. All computed.
7. Footer: source left, "THE SPORTS DESK" right.

**Do:** highlight two teams, line the table up with the chart, compute every stat, use a one-line headline.
**Don't:** label all ten lines at both ends, wrap the headline onto a second line, or leave empty right-side space.

---

### 15 · SCIENCE NOTE ★: the default all-rounder

**Ratios:** 4:5 (native 760×960), 1:1, 16:9 (text left 35%, chart right 65%), 9:16.

**References:** a public-health or science explainer from a quality data newsroom. Friendly but rigorous, violet with one coral highlight.

**Fonts & pairing**
- Kicker: Red Hat Display 700, 13 px, tracking 1.6 px, violet ("HEALTH · INEQUALITY").
- Headline: Red Hat Display 900, 40 px, tracking −0.8 px, line-height 1.05.
- Dek: Red Hat Text 400, 16 px, line-height 1.45, `#4A4855`.
- Group labels: Red Hat Display 700, 16 px. Annotations: Red Hat Display 700, 14 px. Axes: Red Hat Text 13 px `#777`.

**Colours**
| Token | Hex |
|---|---|
| Background | `#FFFFFF` |
| Ink | `#17161C` |
| Primary violet | `#5B3FD0` (dots at ~72% opacity) |
| Highlight coral | `#F25C2B` (outliers, the story) |
| Gridlines | `#EEEDF3` |
| Row separators | `#E2E0EA` |

**How to build it (beeswarm default)**
1. One row per group, ~128 px tall. Group label on the left.
2. Dots r=5.6 px, violet with a white 0.8 px stroke. Lay them out with a force simulation (strong forceX to the value, weak forceY to the row centre, collide radius 6.4 px).
3. Values past the meaningful threshold become solid coral, with one coral bold callout counting them, right-aligned ("8 regions with a gap of 12+ years").
4. Median marker: a black 2 px vertical tick per row with a "median X.X" label above.
5. Light vertical gridlines. The x-axis has a unit on the last tick ("16 yrs") and direction cues ("Smaller gap ←" / "→ Larger gap").

**Other chart types that fit:** dot plots, dot-and-range (CI) plots, strip plots, small-multiple histograms, simple ranked bars (violet with a coral highlight), slope charts. Keep the violet-plus-coral logic.

**Do:** use violet for the mass, coral for the story, medians, direction cues, and lots of white.
**Don't:** use more than one highlight colour, gradients, or dense gridlines.

---

### 16 · MACRO MONITOR ★: daylight rates desk

**Ratios:** 4:5 (native 840×960) for curve on top and table below. On 16:9, curve left and heat table right.

**References:** a macro or rates research note on a terminal, in light mode. Thin dark header strip, lime highlight, mono tables.

**Fonts & pairing**
- Headline: Space Grotesk 700, 40 px, tracking −1 px, line-height 1.05.
- Everything else: DM Mono. Header strip 12 px, dek 13 px `#666`, axes 12 px, table values 11.5 px, section titles 500 13 px.

**Colours**
| Token | Hex |
|---|---|
| Background | `#FBFBF9` |
| Ink | `#14161A` |
| Header strip | `#14161A` with `#E9E9E4` text and lime `#C6F432` label (thin strip only, not a dark mode) |
| Highlight | lime `#C6F432` at ~35% opacity |
| Current line | `#14161A`, 3.2 px |
| Previous lines | `#8C8F86` 1.8 px; older `#C9CBC4` dashed 1.6 px |
| Heat scale | `#E8524F` (−6) → `#F4F4EF` (0) → `#16A673` (+6), clamped |
| Gridlines | `#E8E8E3` |

**How to build it**
1. Thin dark strip: `RATES · CURVE NAME` on the left (lime label), key levels on the right ("2Y 3.70 ▼4 · 10Y 4.12 ▼3").
2. Headline phrased as a question-answer or "what's next" angle, plus a mono dek.
3. **Curve chart:** point scale of maturities (1M…30Y). Draw three dated curves, with the current one boldest. Put end labels at the right.
4. Draw a **lime highlight box** around the key region with a short mono annotation ("2s10s now +42bp").
5. **Heat table:** 48×34 px cells with 2 px gaps and signed values inside (white text when |v| > 5). Month letters across the top, years down the side.
6. Totals column: black cells with lime text for positives and red cells for negatives. Future or empty cells get a dashed outline.

**Do:** use one lime highlight, mono numbers, a black totals column, and signed values (+/−).
**Don't:** use a full dark background, more than one highlight colour, or unsigned numbers.

---

### 17 · GLOBAL WIRE: world-desk map graphic

**Ratios:** **16:9 maximum** (1920×1080), or 4:5 with the map on top and bars below. **Never a 3:1 banner.**

**References:** an international wire-service world graphic. Clean Equal Earth map, teal bubbles, ranked bars, big headline number.

**Fonts & pairing:** Figtree only.
- Kicker: 800, 13 px, tracking 1.5 px, teal, preceded by a 12 px teal dot.
- Headline: 800, 44 px, tracking −1.2 px, line-height 1.02.
- Dek: 400, 17 px, `#47525C`.
- Big stat: 900, 72–84 px, tracking −3 px, teal, with a 15 px caption.
- Map labels: 800 17 px white (inside big bubbles), 700 13 px dark with a white halo (others). Bars: names 600 14 px, values 700 13 px.

**Colours**
| Token | Hex |
|---|---|
| Background | `#FFFFFF` |
| Ink | `#101418` |
| Ocean / sphere | `#F6F8F9`; graticule `#E6EBEE` 0.6 px |
| Land (no data / data) | `#E9E8E4` / `#DCE9EA`, white 0.7 px borders |
| Bubbles | teal `#007C89` at 55%, stroke `#005A63` 1.2 px |
| Bars | top two `#007C89`, rest `#8CC5CB` |

**How to build it (16:9 layout)**
1. Top band across the full width: kicker, a two-line headline (max ~1000 px wide), and the dek. Put the big stat block top-right.
2. Map: Equal Earth projection (`d3.geoEqualEarth`, world-atlas 110m), Antarctica removed, filling about the left 70% below the header.
3. Bubbles use a square-root scale (max radius ~58 px). Fix centroids for awkward countries (USA, Canada, Norway, France).
4. Only label the large bubbles. **Merge dense regions** into one callout with a leader line ("Europe 252 · 11 countries combined").
5. Size legend: nested circles with dashed leader lines, placed in empty ocean (South Pacific, bottom-left).
6. Right column (~25%): top 10–12 ranked bars with values.

**Do:** stay within 16:9, show one big number, merge clutter into regional callouts, and compute totals.
**Don't:** go panoramic, label every bubble, use choropleth and bubbles together, or use dark oceans.

---

### 18 · EXPLAINER ★: visual-desk explainer

**Ratios:** 4:5 or 9:16 tall (native 680×960). On 16:9, put the pyramid centre-right and the headline plus before/after stats on the left.

**References:** a visual-journalism explainer. Warm white, characterful narrow grotesk, green and amber, one clear "before → after".

**Fonts & pairing:** Bricolage Grotesque only.
- Kicker: 700, 13 px, tracking 1.6 px, green.
- Headline: 800, 44 px, `font-stretch: 80%`, tracking −1.2 px, line-height 0.98.
- Dek: 400, 16 px, line-height 1.4, `#3C4F47`.
- Side labels ("MEN" / "WOMEN"): 800 14 px in the side colour. Axis and age labels 11.5–12 px. Before/after numbers: 800 40 px.

**Colours**
| Token | Hex |
|---|---|
| Background | warm white `#FFFDF8` |
| Ink | deep green-black `#132A22` |
| Left series (men) | green `#0B6E4F` |
| Right series (women) | amber `#E09F3E` |
| Comparison outline | `#132A22`, 1.8 px step line |
| Muted text | `#7D8A84` |

**How to build it (population pyramid default)**
1. Bars: 26 px tall with a 2 px gap, left and right of a ~56 px centre gutter holding the age labels (every other band).
2. The emphasis group (e.g. 65+) is at 100% opacity; all other bars are at 55%.
3. Draw the comparison year as a stepped black outline on each side, with no fill.
4. Put the % axis on both sides.
5. Before → after block: grey big number "9%" → arrow → green big number "25%", each with a caption. Add a small two-item legend (filled square = projection, outline = earlier year).

**Other chart types that fit:** before/after dot (dumbbell) charts, stacked 100% bars, unit or icon arrays, annotated area charts. Keep the green-and-amber pair and the before → after numbers.

**Do:** pair a clear before/after story with a warm background and emphasis-by-opacity.
**Don't:** use pink/blue gender stereotypes, more than two series colours, or cold pure-white backgrounds.

---

## 4. Pre-delivery checklist

- [ ] The ratio is 16:9, 4:5, 1:1 or 9:16. Nothing wider than 16:9.
- [ ] Light background. No dark mode.
- [ ] Kicker → headline (states the finding) → dek → chart → source footer are all present.
- [ ] Every headline and stat number is computed from the plotted data.
- [ ] Fictional data is labelled "Illustrative / Fictional / Simulated".
- [ ] Only the style's two font families are used, with tabular numerals.
- [ ] Direct labels are used, no overlaps, no clipped text, nothing runs off the canvas.
- [ ] One accent (two at most), with greys for context.
- [ ] 1–3 annotations, each short.
- [ ] No banned looks (vintage atlas, riso/zine, academic clutter, real brand names).
- [ ] Exported as a PNG at 1.5–2× scale and checked visually before delivery.

---

## 5. Decision log (how this guide was made)

| Round | Shown | Kept | Rejected / changed |
|---|---|---|---|
| 1 | 01 Ledger, 02 Swiss Bulletin, 03 Relief Atlas, 04 Journal Figure, 05 Night Desk, 06 Riso Isometric | 01, 02, 04 (less academic), 05 (light only) | 03 hated (vintage atlas), 06 hated (riso/zine), 05 dark mode banned, 04's journal header/DOI/authors removed |
| 2 | 07 Morning Edition, 08 Bold Weekly, 09 Data Brief, 10 Market Light, 11 Wire Map, 12 Boardroom | 08, 09, 10, 11 | 07 and 12 not picked |
| 3 | 13 Results Desk, 14 Sports Desk, 15 Science Note, 16 Macro Monitor, 17 Global Wire, 18 Explainer | All six; 13, 15, 16, 18 are favourites | 14 needs a fuller build (aligned league table, annotations, stat chips); 17 must be ≤16:9 |

Standing preferences: professional publisher look, light mode only, simple PNG deliverables, varied chart types, and ratios no wider than 16:9 for social media and YouTube thumbnails.
