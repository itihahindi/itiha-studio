# Vaq HQ — authoring playbook

**Read this before building anything for `brand: vaq-hq`.**

`README.md` next door is the *design system* (colours, charts, gotchas).
This file is the *editorial system*: what to write, how to structure it, and what
the user expects to receive when they paste a link.

---

## The contract

> The user pastes an X link, an article URL, an Instagram post, or raw text and
> says "make a carousel / post / reel on this."

That is the whole brief. Do not ask what layouts to use, what the arc should be,
or whether they want charts. **Build the finished `content.yaml` and tell them
what you checked.** They edit afterwards.

Vocabulary they use:

| They say | They mean |
|---|---|
| post | one slide, `instagram-portrait` |
| carousel | 8–10 slides |
| short carousel | 5–6 slides |
| reel | `reel-frame` + a composed video, `instagram-reel` |

"Convert it into a carousel" means the thing just built, not a new topic.

Write the deck into `designs/<kebab-slug>/content.yaml`. No `origin:` key on
anything built from a pasted link — that key is only for watcher-generated decks
and it files the project under Auto-generated instead of Your projects.

---

## The standing editorial instruction

Verbatim, given 3 Aug 2026:

> **"whenever you make something, it should be pro-Hindutva, right-leaning."**

This is not a per-request preference. It applies to every VaqHQ build unless the
user says otherwise on that specific deck.

**How to deliver it without printing anything false.** The lean lands hardest
when every load-bearing claim is checkable, and that is also what makes a deck
survive being challenged. Worked examples from this repo:

- **PoJK.** 52 days of protest and not one demand addressed to India. The JAAC
  wants electricity subsidies and wheat, from Islamabad. That destroys the
  "Kashmiris want azadi from India" line using only the protesters' own demands.
- **Parliament, 22 Feb 1994.** The unanimous resolution (J&K integral, Pakistan
  must vacate) is the on-record way to say "these are Indians."
- **Reservation.** Endorsing "scrap reservations" contradicts Amit Shah's own
  repeated guarantee, so the coherent line is grievance-legitimate,
  target-wrong, reform-at-the-edges.
- **DRDO swarm tender.** The pro-India argument was not adjectives. It was that
  the tender demands source code as a deliverable and bars adversary-country
  parts, where most indigenisation stops at assembly.

The pattern: **find the fact the other side's own material concedes, and put it
on a slide.** Adjectives are weak. Documents are not.

### Lines that do not move

- **No communal slurs in VaqHQ's voice.** Strip the slur, keep the argument.
- **No unverified defamation** of named or near-private individuals. Carry only
  the corroborated core.
- **Don't assert conspiracy or motive as fact.** Offer the defensible version
  ("benefited from", "capitalised on"), attributed as analysis.
  Claim-now-evidence-later is the problem, not the wording.
- **Hedging is not a shield for insinuation.** "Allegedly" means honest
  attribution, not a smear with deniability attached. On the Delhi Police list
  the honest move was precision: an *antecedent* is a prior FIR or arrest, not a
  conviction. Saying so made the deck hit harder.
- **No faces beside accusations.** Never put an identifiable protester's photo
  on a slide about criminal antecedents. Banner shots, backs of heads, or no
  image.

---

## Voice

Newsroom-direct and pointed. Build sharp, not mushy.

**Direct headlines, direct body.** Their correction, verbatim: *"make it direct.
Instead of using metaphors, use the direct headlines and use the direct body."*
State the fact. Skip the metaphor. `They have to hand over the *source code*`
beats anything about crown jewels.

### Things that make copy read as AI-written (they will call this out)

- **Em dashes.** Zero, in any published field. `grep -c '—' designs/<slug>/content.yaml`
  before rendering. Also avoid semicolons.
- **Anaphora triads.** "Not a policy. Not a promise. A pledge." Kill it.
- **Bracket floods.** `[red emphasis]` is for one or two key terms per body, not
  every noun.
- **Stiff register.** "It is worth noting that", "serves as", "underscores",
  "in an era where", "a testament to". Cut on sight.
- **Explaining the obvious after saying it.** Say the thing once and stop.
- **Hedging stacks.** "may potentially suggest". Either the source says it or
  it doesn't.

Their instruction on the Itiha Turkey deck applies here too: *"Don't use any AI
cliches. Don't make it look like an AI-written script."*

### Hooks

The cover is where they push back hardest. Real feedback on one deck: *"It's not
at all interesting"* → *"not good at all"* → *"give me some five to six
variations."*

Rules learned:

- **Number or sting in the first four words.** `DRDO wants *50 drones* flying
  half a metre apart` works. A thematic abstraction does not.
- **A question hook works when the question is the argument.** They chose *"Why
  are Indians funding anti-India institutions?"* over five of mine.
- **When a hook is being reworked, give 5–6 variations in one message** rather
  than one polished attempt. They pick, and they often pick a hybrid.
- Subline carries the qualifier the headline dropped. That is what keeps the
  headline short and still honest.

### Curiosity loops

Standing request: **`loop:` on every interior slide.**

`loop` renders an accent rule, mono caps and an arrow under the body. It must
name what the **next slide actually contains**:

```yaml
loop: The tolerance is the hard part      # next slide is the 5 cm stat
loop: And the state pays for most of it   # next slide is the 90% funding stat
loop: Then comes the part nobody usually gets
```

Editorial copy, not chrome, which keeps it clear of the no-swipe-meta rule.
**Blank on the cover and on the closing.** Available on story, split-story,
roster, and all five chart layouts. Not on cover, quote, stat, geo or closing.

---

## Length

- **A single post's body is UNDER 50 WORDS. Hard limit.** Set 29 Jul 2026 after
  the user deleted a 118-word body themselves. One slide is read at a glance.
- **Carousels are exempt in principle**, but when they ask for a compressed deck
  they apply the same ceiling per slide ("Make sure the slide won't go more than
  50 words"). Treat ~50 words as the working ceiling for any body.
- **A short body frees vertical space, so raise `body_size` rather than leaving
  a gap.** 31 → 40 on the paper-leak post. This is a real instruction, not a
  nicety: a short body in a large box reads as a mistake.
- Headlines ≤ 8 words. One idea per slide.
- Compressing 9 slides to 6 means **merging content, not deleting it** — their
  brief was "keep the same content, don't change the words, just add more
  content in a single slide."

---

## Deck architecture

The arc that has worked repeatedly:

```
cover        the hook: number or sting, plus the qualifier in the subline
evidence     2–5 slides of charts / stat / geo — the checkable spine
argument     1–3 story slides — what the numbers mean
closing      the line they remember
```

Real arcs from built decks:

| Deck | Arc |
|---|---|
| `drdo-swarm-drones` | cover · pictogram · stat · pictogram · stat · bar · story · story · closing |
| `china-engineering-peak-oil` | cover · stat · geo · pie · bar · bar · story · bar · story · closing |
| `indian-money-harvard-india-studies` | cover · pie · bar · story · story · roster · story · story · closing |
| `chip-packaging-supply-chain` | cover · bar · pictogram · bar · roster · bar · quote · story · story · closing |

**Put the numbers early.** Evidence before argument. A reader who bounces on
slide 3 should already have seen the strongest checkable fact.

**Surface is the variety knob, not colour.** Pick one dominant surface for the
deck and break it deliberately: `bidadi-ai-city` runs light with a `dark` stat
and a `solid` payoff slide. A deck that is `dark` end to end is fine and often
the best choice for a hard-news topic.

**One layout should not repeat three times in a row** unless the repetition is
the point (`drdo` alternates pictogram/stat deliberately).

### Which layout for which content

| Content | Layout |
|---|---|
| a proportion of a whole | `pictogram` (unit cells) or `pie-chart` (max 6 slices) |
| comparison between named things | `bar-chart` `mode: emphasis` |
| a ranking or ordered set | `bar-chart` `mode: sequence` |
| composition inside each bar | `bar-chart` `mode: stack` |
| gains against losses | `bar-chart` `mode: diverge` |
| change over time | `line-chart` (1–2 series) |
| one number that is the story | `stat` |
| a list of names with a value | `roster` (`featured: true` pulls one out) |
| countries, borders, routes | `geo` |
| one metro area, distances | `city-map` |
| a sentence someone actually said | `quote` |
| photo plus argument | `split-story` |
| the argument itself | `story` |

**Charts need real numbers.** If the article gives you three numbers, build
three chart slides, not six. Never pad a chart with invented values. The
paste-flow prompt in `prompts.js` deliberately hides the chart layouts from
claude.ai for exactly this reason — in-session you may use them because you are
checking the source, but the same discipline applies.

---

## The YAML

Authoritative field lists, read out of `manifest.js`. Anything not on this list
is silently ignored.

```yaml
name: <kebab-slug>
brand: vaq-hq
format: instagram-portrait          # or instagram-reel / instagram-square
caption: |
  <long-form, see below>
hashtags: |
  #VaqHQ #<Topic> #<Place>
tweaks:
  vertical: ground                  # deck default; per-slide override allowed
  showStamp: true
  showPageNum: true
  seriesLabel: GROUND REPORT        # ALL CAPS, short
slides:
- layout: cover
  ...
```

Every slide accepts `vertical`, `surface` (`light|solid|dark`), `kicker_meta`,
`texture` (`grid|riso|dots|signal`), `align_x`, `align_y` — with the exceptions
noted below.

| Layout | Content fields |
|---|---|
| `cover` | `headline` `subline` `image` `image_position` `image_height`(560) `show_index` `headline_size` `headline_offset_y` |
| `story` | `headline` `body` `image` `image_position` `image_height`(470) `image_caption` `loop` `body_size`(46) `headline_offset_y` `body_offset_y` |
| `split-story` | `image` `image_position` `image_height`(580) `headline` `body` `loop` `body_size`(45) `body_offset_y` — **no `surface`** |
| `quote` | `quote` `attribution` `quote_size`(72) `quote_offset_y` — no `loop` |
| `stat` | `label` `value` `sublabel` `body` `stat_size`(250) `body_size`(43) `stats_offset_y` — no `loop` |
| `roster` | `headline` `rows` `row_size` `loop` — rows are `{flag, name, year, featured}` |
| `bar-chart` | `headline` `mode` `rows` `max` `value_prefix` `value_suffix` `decimals` `source` `body` `loop` `bar_size`(63) |
| `line-chart` | `headline` `series` `x_labels` `y_min` `y_max` `area` `source` `body` `loop` `chart_height`(470) |
| `pictogram` | `headline` `value` `total`(100) `columns`(10) `shape` `grid_height`(560) `unit_label` `sublabel` `value_suffix`(%) `source` `body` `loop` |
| `pie-chart` | `headline` `rows` `donut`(.56) `size`(440) `center_value` `center_label` `show_percent` `source` `body` `loop` |
| `city-map` | `headline` `center_lat` `center_lon` `span_km`(70) `rings` `places` `routes` `map_height`(620) `map_caption` `source` `body` `loop` |
| `geo` | `headline` `region` `zoom` `center_lon` `center_lat` `countries` `links` `markers` `body` `map_caption` `map_height` — no `loop` |
| `closing` | `headline` `body` `handle` `headline_size`(60) |
| `reel-frame` | `video_file` `video_url` `headline` `subline` `credit` `panel_height`(560) `panel_fade`(120) `headline_size`(66) — no `surface` |

**Micro-syntax.** Headlines: `*word*` → accent highlight, 1–2 per headline max.
Body: `[word]` → accent key term · `_word_` → italic · `**word**` → bold.

### Field traps

- **`closing` accepts `surface:` in YAML** even though the editor shows no
  control for it. Set it, or a dark deck ends on a white card.
- **`roster` rows are YAML-only** — no editor repeater exists.
- **`split-story` has no `surface`** and no `chapter` (that is Itiha's field).
  An `eyebrow:` will be silently dropped; the field is `kicker_meta`.
- **`kicker_meta: 2017` parses as a YAML integer** and used to blank every slide
  from there down. `VKicker` coerces now, but quote year-only values anyway.
- **A bare `": "` inside an unquoted value makes a nested mapping.**
  `source: 'Programme name: Development of ...'` needs the quotes.
- **`geo` auto-assigns country colours** from a pre-consolidation cycle. Always
  set `color:` explicitly — orange for the subject, `#94A7BA` for context.
- **`pie-chart` rows: leave `color` blank** to get the validated slot for that
  position. Slot 1 is a neutral grey, for the share that is context rather than
  an identity. Don't hand-pick.
- **Never emit `image_credit`.** Licence attribution goes in the caption.
  Descriptive `image_caption` (what/where/when) is fine.
- **No swipe-meta on covers.** That is Itiha's convention.

### Layout switching breaks slides

The user swaps `layout:` in the editor dropdown and the field set does not
follow. Seen repeatedly: `stat` → `cover` and `stat` → `split-story` (neither
has `label`/`value`/`sublabel`/`body`, so the numeral and all copy vanish);
`reel-frame` → `cover` (loses `video_file`/`panel_height`, so the reel cannot
recompose). **Do not revert their edit.** Flag it and offer to rewrite the copy
into the new layout's fields.

---

## Captions

Long-form and structured. The slides are the argument at a glance; the caption
is where the detail lives, and it is what the 50-word slide limit buys.

Shape that works:

```
<One-sentence restatement of the hook.>

<Bold-ish lead-in.> <what the source actually says>
What we could confirm. <the corroborated core>
The part worth being precise about. <the distinction that matters>
It still does not survive. <the argument>

Sources: <named outlets, with dates>. <image credits if any licence needs one>

@vaq_hq
```

**No `vaqhq.com` on the end card.** Standing instruction, 5 Aug 2026. The
`closing` slide's `handle:` field is the handle **alone**:

```yaml
handle: '@vaq_hq'        # right
handle: '@vaq_hq · vaqhq.com'   # wrong, prints the domain on the card
```

The domain is not hard-coded in `ClosingSlide` — it only ever appears because it
was typed into `handle:`. Nothing else on a slide prints a URL, so the `handle:`
field is the whole fix.

Lead-ins are plain sentences ending in a full stop, not markdown headers.
Name outlets and dates. If something is contested, say so here at length even
when the slide had room for only the short version.

---

## Verification

**Light by default.** For ordinary contested clips the user's standing line is
"just make it, I'll verify." Quick cross-check, build, move on.

**Except institutional and numeric facts.** Ministerial portfolios and
resignations, Cabinet decisions, court rulings, seat counts, casualty tolls,
amendment thresholds, gift amounts, scheme outlays. Verify those properly.
Being wrong there is the costly kind of error, and this carve-out is explicitly
agreed with the user.

When a claim is contested, the deck says so in VaqHQ's own voice: attribute it,
name the source, state what is *not* independently verified, and state what
**is** corroborated. That has produced better slides than dropping the claim
would have — the ₹10 crore vs ₹50 lakh fine, the unsourceable Delhi Police
breakdown, and the "417 patents" correction all became the strongest slide in
their deck.

The running list of specific catches lives in `CLAUDE.local.md` under
*Verification catches worth remembering*. Read it before touching a story in the
NEET/CJP, PoJK, or exam-reform arcs.

---

## Images

**Every post gets an image if one exists.** Standing rule from 29 Jul 2026,
given after an auto-built deck shipped image-less.

- Source from **Wikimedia Commons**. Official Indian-government photos are
  GODL-India. Use the **exact `thumburl` the API returns** — invented widths
  like `1400px-` 404 into an HTML error page.
- **Commons needs a compliant User-Agent** with a contact URL, or the fetch
  silently returns a 126-byte text file:
  `VaqHQStudio/1.0 (itihahindi@gmail.com) curl/8`
- **X serves timeline images small.** `/media/` URLs take `name=orig`; video
  posters (`amplify_video_thumb`) ignore query params and need a `:large`
  suffix.
- **Look at the contact sheet before wiring anything in.** Real rejects: an NDTV
  on-air promo with their anchor and logo, an OpIndia card with a watermark, a
  Sansad TV grab of the wrong bill, and an AI-generated stock image of children
  (giveaway: the hands).
- **News CDNs hotlink-block.** NDTV `c.ndtvimg.com` 403s regardless of UA or
  Referer. `content.py` degrades gracefully: the render log shows `!!` and the
  raw URL survives the save so the browser can try it.
- Agency photos lifted off X are credited in the caption but are not a licence
  the user owns. Flag it and let them decide.
- Fall back to a solid poster tile or the `stat` layout only when the harvest is
  genuinely unusable.

Images sit in **hairline frames** with mono captions. Never full-bleed under a
dark veil — that is the Itiha language.

---

## Reels

`format: instagram-reel`, one `reel-frame` slide, video in `designs/<slug>/images/`.

- **`panel_height` for zero crop = `1920 − (1080 × srcH ÷ srcW)`.**
  16:9 → 1312 · 1.67:1 → 1274 · 1:1 → 840.
- **Portrait 9:16 sources are the trap.** `compose_reel` cover-crops *centred*,
  so a panel eats half its height off the top and clips the speaker's head.
  Pre-crop top-anchored first:
  `ffmpeg -i src.mp4 -vf crop=1080:1440:0:0 -c:v libx264 -crf 20 -c:a copy out.mp4`
- **Check head position across many timestamps** before choosing a crop. It
  drifts, and the worst frame is what clips.
- **Compose with `reel.compose_reel(Path(design))`.** Output must be ≤ 180 s.
- **Re-check the composed mp4 at several timestamps**, not the still frame.
- **A/V sync: measure, don't guess.** One source this repo handled ran +333 ms
  audio-late in the original file. Re-encoding VFR → CFR without anchoring the
  audio adds a frame of its own; use `-r 30 -fps_mode cfr`.
- **Open on the substance, not on a logo card.** Their note: the reel felt
  incomplete because it sat on a station ident while the audio had already
  started. Cut to the moment that matters within the first 2–3 seconds.
- **Hindi and Kannada speech will not transcribe reliably.** Quote only the
  source's own English caption or on-screen text. Never fabricate a translation.
- Fetch X media JSON via `api.fxtwitter.com/<user>/status/<id>`. Instagram via
  `yt-dlp` ("There is no video in this post" means it is an image post).

---

## Verticals

Editorial labels only since the 2026-07-27 consolidation. They change the badge
text, show name, and ground's Devanagari companion. **They do not change the
design.** All seven share `V_BASE` and the single orange accent.

| Vertical | Show | Use for |
|---|---|---|
| `live` | Vaq HQ Breaking | breaking news, Parliament data points |
| `briefing` | The Briefing | geopolitics, borders, anything with a `geo` map |
| `longview` | The Long View | history, war anniversaries |
| `ground` | Ground Report | Indian politics, protests, police |
| `sports` | SPORTS | sport |
| `legal` | The Docket | courts, suits, judgments |
| `tech` | TECH | breaches, platforms, chips, data |

**Never ask the user for per-vertical colours, and never reintroduce them.**
Retired: briefing blue, longview plum, ground teal, sports red, legal `#E0554E`,
tech `#2540FF`, the "The Arena" and "Cathode" wordmarks, and the Docket/Cathode
sub-kits.

⚠ **`prompts.js` is out of step with this table.** The `projectInstructions`
block the user installed on 3 Aug still says sports = "The Arena", tech =
"Cathode" with "a blue signal accent", and tells the writer to use sentence-case
headlines on legal and tech and not to set `surface`. None of that is reachable:
`headlineStyle` forces uppercase for every vertical, and no per-vertical kit
exists, so an unset `surface` falls through to light paper. **The code is the
authority.** That prompt is the claude.ai paste flow only; it does not govern
in-session builds.

---

## Before you hand it over

1. `grep -c '—' designs/<slug>/content.yaml` → must be 0.
2. `grep -c 'image_credit' designs/<slug>/content.yaml` → must be 0.
3. Body word counts under ~50 (the `[ ]`, `_ _`, `**` markers are formatting,
   not words).
4. Render and **look at the PNGs**. A render can report success while writing
   blank slides — that is the signature of a JS throw partway down the deck.
5. Say what you verified and what you could not stand up. That is the part they
   act on.
