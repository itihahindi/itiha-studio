# Itiha Studio — context for Claude

You're working in a local Instagram / YouTube carousel pipeline for **Itiha** (premium Indian-history documentary brand). Author content in a side-panel editor, render pixel-precise PNGs via headless Chromium, optionally sync to Notion or publish to IG.

The user is `itihahindi@gmail.com`. Brand voice is editorial and historical — not academic, not breezy.

---

## Running it
`
```
bin/itiha start     # background daemon, opens browser, prints URL
bin/itiha stop
bin/itiha restart
bin/itiha status
```

`bin/studio` runs in the foreground for live log viewing. On Windows: `python src\studio.py` (the `bin/` scripts are bash-only).

Daemon state lives in `.itiha-studio.pid` / `.itiha-studio.log` (gitignored). First-time setup needs `python -m playwright install chromium` and an `.env` copied from `.env.example`.

---

## Architecture

- **Entry**: [src/studio.py](src/studio.py) — `ThreadingHTTPServer` with home page at `/`, per-design routes at `/d/<slug>/`, and a small REST surface (`/api/projects`, `/api/projects/new`, `/api/projects/delete`, `/api/notion/*`, plus `/d/<slug>/api/{save,render,upload,remove-bg,parse-markdown,open-folder}`).
- **Renderer**: [src/render.py](src/render.py) — Playwright loads the editor page in capture mode and screenshots each slide at its native dimensions.
- **Content**: One folder per project under [designs/](designs/) — `content.yaml` + `images/`. Rendered PNGs live OUTSIDE the repo at `~/Instagram Itiha Renders/<slug>/` (override via `ITIHA_OUTPUT_ROOT` in `.env`). Resolve via `content.output_dir_for(design_dir)` — never hard-code `design_dir / "output"`.
- **Layouts**: [shared/layouts.jsx](shared/layouts.jsx) — every slide is a React component. Registered in `window.LAYOUTS` at the bottom. Adding a layout means: component → manifest entry in [shared/manifest.js](shared/manifest.js) → name in `KNOWN_LAYOUTS` in [src/content.py](src/content.py).
- **Editor**: [shared/editor.jsx](shared/editor.jsx) — Babel-in-browser, side-panel React form. The big `PROJECT_INSTRUCTIONS` string in here is what users paste into their Claude.ai Project as Custom Instructions.
- **Per-slide knobs**: every carousel layout supports `theme: light|dark` and a `texture` overlay (`grain`, `noise`, `scanlines`, `paper`, `halftone`, `vignette`). Helpers in [shared/slides-shared.jsx](shared/slides-shared.jsx) (`themeFor`, `TextureOverlay`).
- **Notion**: [src/notion_sync.py](src/notion_sync.py) — talks to the "Instagram Content Plan" database. Optional; needs `NOTION_TOKEN` + `NOTION_DB_ID` in `.env`.
- **Brand tokens**: [shared/colors_and_type.css](shared/colors_and_type.css) — Jet/Ink Black + Parchment + Sindoor Red. Three fonts: **Bebas Neue** (default display / headlines), **Big Shoulders Display ExtraBlack** (heavy accent — `--font-heavy` / `ITIHA.heavy`, used in the `youtube-cta` layout), **DM Sans** (body). Sharp corners, no gradients.
- **Image resolution**: [src/content.py](src/content.py) `load_content` walks a fixed set of image-typed slide fields — currently `{image, image_before, image_after, thumbnail}`. When a new layout introduces another image field, add it to that set (otherwise URLs won't download to `_cache/` and bare filenames won't be validated).
- **Body typography**: the `Body` component ([shared/layouts.jsx](shared/layouts.jsx)) applies size-adaptive line-height — ≤36 → 1.7, ≤48 → 1.55, >48 → 1.4. Defaults were bumped mid-2026-06 (story/split 45 · quote/stat/closing/interior/did-you-know 42 · numbered/comparison/portrait 38 · timeline 36) because 32-px body was unreadable on phones. Existing slides that hard-code smaller sizes keep them; delete the override to pick up the new default.

---

## Authoring workflow (single step)

The intended flow is **Claude Project + book PDFs → paste**:

1. User opens a Claude.ai Project with book PDFs uploaded as Knowledge. Custom Instructions = the `PROJECT_INSTRUCTIONS` string from `editor.jsx` (one-time setup; **Project setup (1×)** button in the editor). The full worked carousel + per-layout snippets live in [shared/examples.yaml](shared/examples.yaml) — uploaded once as Project Knowledge via the **Examples (1×)** button. These two files must stay in sync when a new layout is added.
2. For each carousel: new chat → paste `TOPIC_PROMPT` with the topic filled in → Claude returns YAML inside a ` ```yaml ``` ` fence.
3. User clicks "Copy code" in claude.ai → pastes into the editor's **Paste** tab → "Replace slides".

The yaml fence is load-bearing: claude.ai strips `*asterisks*` and `##` headers when copying rendered markdown, but preserves text verbatim inside code blocks. Don't suggest reverting that.

**NotebookLM is not in this loop.** It used to be a separate step; we collapsed it. Don't reintroduce it.

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
| "Add a new slide layout" | [shared/layouts.jsx](shared/layouts.jsx) (component + register in `window.LAYOUTS`) + [shared/manifest.js](shared/manifest.js) (field schema) + [src/content.py](src/content.py) `KNOWN_LAYOUTS`. If the layout ships a new image-typed field, also add it to the `resolve_image` loop in `content.py`. |
| "Add a field to an existing layout" | [shared/manifest.js](shared/manifest.js) + the layout component in [shared/layouts.jsx](shared/layouts.jsx) |
| "Add a format (new dimensions)" | [src/formats.py](src/formats.py) + [src/scaffold.py](src/scaffold.py) starters + home.html format dropdown |
| "Wire a new home-page endpoint" | [src/studio.py](src/studio.py) `do_POST` / `do_GET` routes + [shared/home.html](shared/home.html) |
| "Tweak Notion sync" | [src/notion_sync.py](src/notion_sync.py) |
| "Tweak the paste prompt" | `PROJECT_INSTRUCTIONS` / `TOPIC_PROMPT` constants in [shared/editor.jsx](shared/editor.jsx). Keep [shared/examples.yaml](shared/examples.yaml) in sync (worked snippets live there, not in the instructions). |
| "Bump default body/headline sizes" | Destructure defaults in [shared/layouts.jsx](shared/layouts.jsx) **and** field defaults in [shared/manifest.js](shared/manifest.js) — both must change together. Line-height is size-adaptive inside the `Body` component. |
| "Add editor toolbar feature" | [shared/editor.jsx](shared/editor.jsx) — auto-render toggle, limit counters (`LimitCounter`), project-setup buttons all live near the bottom of the `Editor` function. Persist per-user prefs to `localStorage` under the `itiha:` prefix. |
| "Change the phone preview" | `PhonePreview` in [shared/render-host.html](shared/render-host.html). Has a `sizeMode` toggle: `'fit'` (viewport-relative) vs `'real'` (locked to 410 px outer = 390 px screen ≈ iPhone 14 CSS viewport). |
