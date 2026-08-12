# Kavi Studios — context for Claude

You're working in a local Instagram / YouTube carousel pipeline. The shell is **Kavi Studios**; it hosts multiple brands, each with its own asset pack under `shared/brands/<slug>/`:

- **`itiha`** — premium Indian-history documentary brand. Voice is editorial and historical — not academic, not breezy.
- **`vaq-hq`** — Vaq HQ, digital political-media channel (added 2026-07). Design language: "daylight newsroom + poster wall" from a user-judged bake-off (reference in `shared/brands/vaq-hq/reference/`). **TWO-TONE CONSOLIDATION 2026-07-27**: audience complaints that per-vertical colors/layouts made the feed unrecognizable killed the per-vertical liveries. The system is now exactly two colors on paper — light paper `#F7F9FB` ground, **hero orange `#F4631E` as the only accent** (badge chips, top rules, highlighter emphasis, solid poster tiles), and **navy via `surface: dark`** as the counterweight poster / cinematic photo hero. One type system: Archivo caps headlines, Hanken Grotesk body, Space Mono meta, Newsreader pull quotes, Noto Serif Devanagari companion. The seven verticals (live, briefing, longview, ground, sports, legal, tech) survive as **editorial labels only** — kicker/badge text, show-name meta, ground's Devanagari — sharing `V_BASE` in `slides-shared.jsx`. **Don't reintroduce per-vertical accents, faces, or kit objects.** Retired in that consolidation: briefing blue / longview plum / ground teal / sports red / legal `#E0554E` / tech `#2540FF` accents, the serif/serif-italic/sans/athletic/docket/cathode headline faces, The Docket's dark end-to-end kit, Cathode's graphite kit, and the Saira Condensed / Space Grotesk / IBM Plex / Source Serif 4 / Inter font loads. (Earlier the same day the sports/tech show-name wordmarks "The Arena"/"Cathode" were retired — those two set `show` = kicker so VKicker's dupMeta renders the badge alone.) `vertical:` is a per-slide field with a project default in `tweaks.vertical`; `surface: solid|light|dark` = orange poster tile / paper interior / navy poster. The `surfaceFor(slide, v)` + `inkFor(v, surface)` indirection remains in code (it reads optional `v.light`/`v.dark` palettes) but no vertical ships one anymore — layouts must still resolve through it, not hard-code tokens. Implements 6 layouts (cover, story, split-story, quote, stat, closing) — other KNOWN_LAYOUTS names render as 'unknown layout' on vaq projects. Images sit in hairline frames with mono caption/credit — never full-bleed with dark veils. Textures are VAQ-native (`grid`/`riso`/`dots`/`signal`), NOT Itiha's archival set. No swipe-meta on covers (Itiha owns that convention). Deliberately NOT the Itiha language: light not dark, framed not cinematic.

Every design's `content.yaml` has a top-level `brand:` key (defaults to `itiha`). Author content in a side-panel editor, render pixel-precise PNGs via headless Chromium, optionally sync to Notion or publish to IG.

The user is `itihahindi@gmail.com`.

---

## Running it
`
```
bin/kavi start     # background daemon, opens browser, prints URL
bin/kavi stop
bin/kavi restart
bin/kavi status
```

`bin/itiha` is a back-compat alias for `bin/kavi`.

`bin/studio` runs in the foreground for live log viewing. On Windows: `python src\studio.py` (the `bin/` scripts are bash-only).

Daemon state lives in `.kavi-studio.pid` / `.kavi-studio.log` (gitignored). First-time setup needs `python -m playwright install chromium` and an `.env` copied from `.env.example`.

---

## Architecture

- **Entry**: [src/studio.py](src/studio.py) — `ThreadingHTTPServer` with home page at `/`, per-design routes at `/d/<slug>/`, and a small REST surface (`/api/projects`, `/api/projects/new`, `/api/projects/delete`, `/api/notion/*`, plus `/d/<slug>/api/{save,render,upload,remove-bg,parse-markdown,open-folder}`).
- **Renderer**: [src/render.py](src/render.py) — Playwright loads the editor page in capture mode and screenshots each slide at its native dimensions.
- **Brands**: [src/brands.py](src/brands.py) is the registry (`BRANDS`, `DEFAULT_BRAND`). Each pack at `shared/brands/<slug>/` must ship `slides-shared.jsx`, `layouts.jsx`, `manifest.js`, `prompts.js`, `tokens.css`, `examples.yaml`, and define the window globals `LAYOUTS`, `MANIFEST*`, `BrandContext`, `BRAND`. [shared/render-host.html](shared/render-host.html) loads `brands/__BRAND__/…`; the placeholder is substituted server-side in **three** places — `studio.py` (`_handle_design_get`), `render.py` (`_serve_overlay`), `preview.py` — keep them in sync. The `.itiha-slide` CSS class is the cross-brand capture contract (`render.py` waits on it); every pack's slide wrapper must keep emitting it.
- **Content**: One folder per project under [designs/](designs/) — `content.yaml` + `images/`. Rendered PNGs live OUTSIDE the repo at `~/Instagram Itiha Renders/<slug>/` (override via `ITIHA_OUTPUT_ROOT` in `.env`). Resolve via `content.output_dir_for(design_dir)` — never hard-code `design_dir / "output"`.
- **Layouts**: [shared/brands/itiha/layouts.jsx](shared/brands/itiha/layouts.jsx) (per brand) — every slide is a React component. Registered in `window.LAYOUTS` at the bottom. Adding a layout means: component → manifest entry in [shared/brands/itiha/manifest.js](shared/brands/itiha/manifest.js) → name in `KNOWN_LAYOUTS` in [src/content.py](src/content.py) (KNOWN_LAYOUTS is currently shared across brands).
- **Editor**: [shared/editor.jsx](shared/editor.jsx) — Babel-in-browser, side-panel React form. Brand-agnostic: reads identity + prompts from `window.BRAND` (defined by the pack's `prompts.js`). Image fields carry a **Die-cut** button → `/d/<slug>/api/remove-bg` (rembg); since 2026-07-30 the endpoint also accepts pasted URLs (downloads into `images/` server-side first). The post-metadata block (IG caption + hashtags + **Copy caption** button, which copies both for pasting into Instagram) shows on the first slide of every project, not just covers. `PROJECT_INSTRUCTIONS` / `TOPIC_PROMPT` live in [shared/brands/itiha/prompts.js](shared/brands/itiha/prompts.js) as `window.BRAND.projectInstructions` / `.topicPrompt` — that's what users paste into their Claude.ai Project as Custom Instructions.
- **Per-slide knobs**: every carousel layout supports `theme: light|dark` and a `texture` overlay (`grain`, `noise`, `scanlines`, `paper`, `halftone`, `vignette`). Helpers in [shared/brands/itiha/slides-shared.jsx](shared/brands/itiha/slides-shared.jsx) (`themeFor`, `TextureOverlay`).
- **Notion**: [src/notion_sync.py](src/notion_sync.py) — talks to the "Instagram Content Plan" database. Optional; needs `NOTION_TOKEN` + `NOTION_DB_ID` in `.env`.
- **Itiha brand tokens**: [shared/brands/itiha/tokens.css](shared/brands/itiha/tokens.css) + the `ITIHA` object in its `slides-shared.jsx` — Jet/Ink Black + Parchment + Sindoor Red. Four fonts: **Bebas Neue** (default display / headlines — caps-only, which is why it must never set quote text), **Big Shoulders Display ExtraBlack** (heavy accent — `--font-heavy` / `ITIHA.heavy`, used in the `youtube-cta` layout), **DM Sans** (body), **DM Serif Display italic** (`ITIHA.quoteSerif` — the quote voice since 2026-07-30, chosen as DM Sans's serif sibling; Noto Serif Devanagari fallback keeps Hindi quotes in family; `.itiha-pull` carries it brand-wide). Sharp corners, no gradients.
- **Itiha quote layout (consolidated 2026-07-30)**: the standalone `quote-card` was folded into `quote` and retired everywhere (registry, manifest, `KNOWN_LAYOUTS`, editor picker) — square quote posts are just an `instagram-square` project using `quote`. The layout: serif quote under a giant red quote mark, optional chapter/headline top block, optional **die-cut author strip** along the bottom (`author_image` left + red divider + name + `author_role` right; `author_style: cutout|framed`, `author_height`); `text_y` (%) switches from the carousel bottom anchor to a card-style centered anchor.
- **`emphasisV2` feature toggle (itiha tweaks, added 2026-08-01)**: A/B flag for the recurring "red is unreadable / overused" audience complaint — Sindoor `#C0392B` is only ~3.5:1 against ink, so red running text recedes next to 14:1 parchment. With the flag on, headline `*accents*` render in brighter vermilion `#E2604F` on dark themes (Sindoor stays on light), and body `[keys]` render full-contrast bold with a thick red underline instead of red text; graphic red (dividers, eyebrows, stat numerals, stamps) is untouched. Mechanism: `themeFor` reads `BrandContext` and appends an `em-v2` class to the slide root; CSS lives next to `.itiha-body .key` in `slides-shared.jsx`. Noor runs treatment B; A/B renders are archived at `~/Instagram Itiha Renders/noor-AB-test/{A,B}`. Don't remove the flag mid-experiment — if v2 wins it becomes the default (and the emphasis-frequency cap goes into `prompts.js`).
- **Image resolution**: [src/content.py](src/content.py) `load_content` walks a fixed set of image-typed slide fields — currently `{image, image_before, image_after, thumbnail}`. When a new layout introduces another image field, add it to that set (otherwise URLs won't download to `_cache/` and bare filenames won't be validated).
- **Body typography**: the `Body` component ([shared/brands/itiha/layouts.jsx](shared/brands/itiha/layouts.jsx)) applies size-adaptive line-height — ≤36 → 1.7, ≤48 → 1.55, >48 → 1.4. Defaults were bumped mid-2026-06 (story/split 45 · quote/stat/closing/interior/did-you-know 42 · numbered/comparison/portrait 38 · timeline 36) because 32-px body was unreadable on phones. Existing slides that hard-code smaller sizes keep them; delete the override to pick up the new default.

---

## Authoring workflow (single step)

The intended flow is **Claude Project + book PDFs → paste**:

1. User opens a Claude.ai Project with book PDFs uploaded as Knowledge. Custom Instructions = `window.BRAND.projectInstructions` from the brand pack's `prompts.js` (one-time setup; **Project setup (1×)** button in the editor). The full worked carousel + per-layout snippets live in [shared/brands/itiha/examples.yaml](shared/brands/itiha/examples.yaml) — uploaded once as Project Knowledge via the **Examples (1×)** button. These two files must stay in sync when a new layout is added.
2. For each carousel: new chat → paste `TOPIC_PROMPT` with the topic filled in → Claude returns YAML inside a ` ```yaml ``` ` fence.
3. User clicks "Copy code" in claude.ai → pastes into the editor's **Paste** tab → "Replace slides".

The yaml fence is load-bearing: claude.ai strips `*asterisks*` and `##` headers when copying rendered markdown, but preserves text verbatim inside code blocks. Don't suggest reverting that.

**NotebookLM is not in this loop.** It used to be a separate step; we collapsed it. Don't reintroduce it.

---

## Handle watcher (Vaq HQ) — `src/watch/`

Watches a list of X handles and queues an event when ≥3 of them post about the same thing. `bin/vaq-watch login | poll | queue | brief <id> | built <id> <slug> | status`. Config in [watchlist.yaml](watchlist.yaml); all state under `.watch/` (gitignored).

- **It stops at a brief. It never writes `content.yaml` and never publishes.** Three handles agreeing is corroboration of virality, not of fact — and the categories they converge on fastest (resignations, tolls, rulings, seat counts) are exactly the ones CLAUDE.local.md carves out for real verification. `poll` tags those in `needs_verification`.
- **Reposts never count toward the handle threshold.** A retweet is an echo, not a second source.
- **An event also needs ≥2 source families** (`min_families`, families declared per handle in `watchlist.yaml`). A raw handle count is not independence: @MeghUpdates, @rishibagree, @OpIndia_com and @thetatvaindia carry each other's claims within the hour, reworded enough that `echo_score` stays low. They're one family, so the four together can never fire an event — something outside the network has to carry it too. This is about propagation, not accuracy.
- **The clustering maths has two traps, both fixed, both silent when wrong:** the cosine numerator is `Σ idf²` over the intersection (dot product of idf-weighted vectors), not `Σ idf` — the latter understates every match; and IDF is computed against a floored corpus of 50 docs, because on a small store "appears in every document" is an artifact of the store being tiny and drops shared terms to ~0 weight, splitting one story into N clusters. A flat constant added to every weight also fixes that, but it dilutes rare shared terms and loses real cross-source matches. Measured separation on the fixtures: same-story pairs 0.44-1.00, unrelated 0.00-0.24, threshold 0.32.
- **`echo_score` measures verbatim 5-gram reuse, not vocabulary overlap.** Independent reports of one verdict legitimately share words; shared *phrasing* means one wire story reprinted. Don't "improve" this back into a similarity score — that flagged genuine corroboration as echo.
- **70/30 post:carousel is held by a ledger** (`.watch/ledger.json`) over a rolling 20 builds, not a per-event coin flip, so it converges. Overrides (≥4 hard facts → carousel, ≤1 → post) are recorded too, which is what pulls the ratio back. Bare years are excluded from the fact count — counting them tipped everything into the carousel override.
- **Anything feeding `fingerprint()` needs a deterministic tie-break.** It derives from set iteration, and Python randomises string hashing per process; unbroken ties reorder between runs and requeue already-built events under a new id.
- **Every deck gets an image if the sources supplied one.** Standing rule from 2026-07-29. Run `bin/vaq-watch images <id> --slug <slug>` before drafting: it downloads what the source posts uploaded and builds a contact sheet. Only fall back to the brand's solid poster treatment when the harvest genuinely comes up empty.
  - **Upgrade the URL or the image is a thumbnail.** X serves timeline images at `name=small` / `360x360` (300-400px), which is soft on a 1080px slide. `images.py` rewrites `/media/` to `name=orig` and video posters to a `:large` suffix — two different forms, because query params do nothing on the `amplify_video_thumb` path.
  - **Look at the contact sheet before wiring anything in.** The first real harvest returned an NDTV on-air promo, complete with their anchor and logo, which would have gone straight onto a VaqHQ cover. Anything under 600px on the long edge is dropped automatically; branding and wrong subjects need eyes.
  - Still no `image_credit` on slides — attribution goes in the caption. And the no-faces-next-to-accusations rule still wins: a public figure photographed making the statement a deck is about is fine, an identifiable private person beside an allegation is not.
- **A single post's body is under 50 words. Hard limit.** Standing rule from 2026-07-29; one slide is read at a glance, so the detail belongs in the caption, which stays long-form. Carousels are exempt (the reader has committed to swiping). `bin/vaq-watch check <slug>` enforces it, and also fails on em dashes and `image_credit` — run it before rendering. A shorter body frees vertical space, so raise `body_size` rather than leaving a gap.
- No LLM in the pipeline — clustering is plain IDF-weighted cosine. The drafting step is a separate human-supervised session that reads `.watch/queue/`.

Reading X uses a **persistent logged-in Chromium profile** (`.watch/profile/`), not an API. The user accepted the ToS/account risk on 2026-07-29. Delays in `session.py` are deliberately slow and jittered; don't tighten them to speed up polls.

---

## Voice / micro-syntax

- **Headlines** (Bebas Neue): `*word*` → Sindoor Red accent.
- **Body** (DM Sans): `[word]` → red emphasis · `_word_` → italic · `**word**` → bold.
- YAML block scalars (`|`) fold single newlines into spaces in body text; double newline = paragraph break. Headlines preserve line breaks literally.

---

## Things that have burned us — don't redo them

- **No Claude API automation.** We built a "Transform notes → YAML" feature that called the Anthropic API directly; a single test reported ~134k input tokens per call (never diagnosed). User pulled the plug on 2026-05-11 — "I'll remove this automation part out... this is costing a lot of tokens." The copy-paste-from-claude.ai flow is what we use. Don't propose rebuilding it.
- **Concurrent renders on the same design race.** Auto-render (2.5s after save settles, toggleable in the editor toolbar) can collide with a manual Render click. `render.py`'s stale-PNG sweep uses `unlink(missing_ok=True)` so the crash is gone, but two Playwright instances can still spin up. A proper per-slug `threading.Lock` around the render endpoint in `studio.py` is the follow-up if this shows up again.
- **Preview is scaled, output is not.** [shared/render-host.html](shared/render-host.html) uses `--preview-scale: 0.45` so a 1080×1350 slide fits on screen. In capture mode (`body.capture`) the scale is removed. Anything that touches positioning math needs to respect the scale in the preview but use native pixel units in the layout itself.
- **Hard-refresh after .jsx / .html edits.** Babel-in-browser caches aggressively (Cmd-Shift-R / Ctrl-Shift-R). Backend-only edits need `bin/itiha restart` instead.
- **State cache is mtime-driven.** [src/studio.py](src/studio.py) `_design_state` only rebuilds when `content.yaml` mtime changes. If you rebuild on every poll, inputs revert on every keystroke (the browser polls `version.txt` every 500ms and rehydrates from `content.json`). The save endpoint must update the cached mtime after writing the file.
- **Notion data-source vs database ID.** `/databases/{id}/query` is the legacy endpoint; new multi-source DBs need `/data_sources/{id}/query`. `_query_db` tries the legacy first, falls back to data-source on 404. If a user pastes the wrong UUID flavor we still work.
- **Notion is slow.** Backlog query routinely takes 15-30s. Timeouts are 30s. Don't drop them.
- **Light theme suppresses the dark image overlay.** `{!t.isLight && <ImageLayer ... />}` — otherwise the off-white background turns muddy grey.
- **Saves silently drop top-level YAML keys that don't round-trip.** The save endpoint writes back exactly what the editor posts, and the editor hydrates from `content.json` = `load_content()`'s output. Any top-level key not included there (the way `brand`, `notion_page_id` and `origin` now are) is deleted from `content.yaml` on the next save. When adding a top-level field, add it to the dict `load_content` returns.
- **`origin: watcher` files a deck under Auto-generated** on the home page instead of Your projects, with an `AUTO` badge. Stamped automatically by `bin/vaq-watch built`; absent means hand-made. The section hides itself entirely when empty, so Itiha-only work never sees it. Counts are deliberately per-section: "Your projects (99)" excludes the auto decks, or the number contradicts what is under the heading.
- **`__BRAND__` substitution lives in three servers.** `studio.py`, `render.py`, and `preview.py` each serve `render-host.html` with the placeholder replaced. Change the mechanism in one, change all three.

---

## File / branch hygiene

- Repo: https://github.com/itihahindi/itiha-studio (private)
- Main branch: `main`
- Secrets live only in `.env` (gitignored). Pre-push, grep for `sk-ant-|ntn_|secret_|EAAA|ghp_|AKIA` to be safe.
- Rendered PNGs live at `~/Instagram Itiha Renders/<slug>/` (outside the repo) — set `ITIHA_OUTPUT_ROOT` in `.env` to relocate. `content.yaml` and `images/` are the only design assets that get committed.
- Don't add `*.md` docs unless the user asks. Keep this file and `README.md` as the only top-level docs.

---

## When the user asks for X, look here first

| Ask | File |
|--|--|
| "Add a new slide layout" | [shared/brands/&lt;brand&gt;/layouts.jsx](shared/brands/itiha/layouts.jsx) (component + register in `window.LAYOUTS`) + that brand's [manifest.js](shared/brands/itiha/manifest.js) (field schema) + [src/content.py](src/content.py) `KNOWN_LAYOUTS`. If the layout ships a new image-typed field, also add it to the `resolve_image` loop in `content.py`. |
| "Add a field to an existing layout" | the brand's [manifest.js](shared/brands/itiha/manifest.js) + layout component in its [layouts.jsx](shared/brands/itiha/layouts.jsx) |
| "Add a format (new dimensions)" | [src/formats.py](src/formats.py) + [src/scaffold.py](src/scaffold.py) starters + home.html format dropdown |
| "Add a new brand" | new pack dir under [shared/brands/](shared/brands/) (six contract files) + [src/brands.py](src/brands.py) `BRANDS` + home.html `BRAND_LABELS`/`BRAND_COLORS` + brand `<option>` in the new-project form |
| "Wire a new home-page endpoint" | [src/studio.py](src/studio.py) `do_POST` / `do_GET` routes + [shared/home.html](shared/home.html) |
| "Tweak Notion sync" | [src/notion_sync.py](src/notion_sync.py) |
| "Tweak the paste prompt" | `window.BRAND.projectInstructions` / `.topicPrompt` in [shared/brands/&lt;brand&gt;/prompts.js](shared/brands/itiha/prompts.js). Keep that brand's `examples.yaml` in sync (worked snippets live there, not in the instructions). |
| "Bump default body/headline sizes" | Destructure defaults in the brand's [layouts.jsx](shared/brands/itiha/layouts.jsx) **and** field defaults in its [manifest.js](shared/brands/itiha/manifest.js) — both must change together. Line-height is size-adaptive inside the `Body` component. |
| "Add editor toolbar feature" | [shared/editor.jsx](shared/editor.jsx) — auto-render toggle, limit counters (`LimitCounter`), project-setup buttons all live near the bottom of the `Editor` function. Persist per-user prefs to `localStorage` under the `itiha:` prefix. |
| "Change the phone preview" | `PhonePreview` in [shared/render-host.html](shared/render-host.html). Has a `sizeMode` toggle: `'fit'` (viewport-relative) vs `'real'` (locked to 410 px outer = 390 px screen ≈ iPhone 14 CSS viewport). |
| "Tune what the watcher fires on" | thresholds in [watchlist.yaml](watchlist.yaml); clustering + echo maths in [src/watch/cluster.py](src/watch/cluster.py); desk routing keywords in [src/watch/route.py](src/watch/route.py); the 70/30 split in [src/watch/ledger.py](src/watch/ledger.py) |
