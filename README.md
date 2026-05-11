# Itiha Studio · motion-graphics

Local pipeline for producing Itiha-brand assets at volume — Instagram carousels, Reel title cards, YouTube thumbnails, quote cards, end cards. Author content in a form-based editor (or paste Markdown), render pixel-precise PNGs, optionally sync status to Notion or publish straight to Instagram.

Built around the canonical [`shared/colors_and_type.css`](shared/colors_and_type.css) tokens lifted from the ITIHA Design System bundle. Three colors per asset (Jet/Ink Black + Parchment + Sindoor Red). Two fonts (Bebas Neue + DM Sans). Sharp corners, no gradients.

---

## Quick start

You need **Python 3.10+** and **Git** installed. The first-time install pulls a headless Chromium (~250 MB) and ML libs for background removal (~700 MB) — set aside about 1.5 GB.

### macOS / Linux

```bash
git clone <repo-url> motion-graphics
cd motion-graphics
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python -m playwright install chromium

# launch the studio
bin/studio
```

### Windows

```powershell
git clone <repo-url> motion-graphics
cd motion-graphics
py -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m playwright install chromium

# launch the studio
python src\studio.py
```

> **Note for Windows users**: the `bin/` shell scripts (`bin/studio`, `bin/preview <slug>`, `bin/render <slug>`, `bin/new <slug>`) are bash-only. Run the equivalents directly:
>
> | Bash | PowerShell / cmd |
> |--|--|
> | `bin/studio` | `python src\studio.py` |
> | `bin/preview <slug>` | `python src\preview.py <slug>` |
> | `bin/render <slug>` | `python src\render.py <slug>` |
> | `bin/new <slug>` | `python src\scaffold.py <slug>` |
> | `bin/publish <slug>` | `python src\instagram.py <slug>` |
>
> If you install [Git for Windows](https://git-scm.com/download/win) and use **Git Bash**, the `bin/` scripts mostly work — but you'll need to swap `.venv/bin/activate` → `.venv/Scripts/activate` inside them, since Windows venvs put activators under `Scripts/`. The PowerShell route above sidesteps that.

The studio prints a `http://127.0.0.1:<port>/` URL and opens your browser. That's the home page — your project picker.

---

## Daily workflow

### 1 · Create a project

Open the studio in your browser. Type a project name in the **New project** form, pick a format, click **Create & open**. Studio scaffolds `designs/<slug>/` with a starter `content.yaml` and a couple of placeholder slides, then takes you into the editor.

### 2 · Edit slides

The editor is a side panel on the right. Each slide has form fields for its layout (cover, story, stat, comparison, portrait, …). Type into them — the preview re-renders live.

- **Layout dropdown** picks the slide type. Form fields adapt.
- **Slide strip** at the top of the panel: click any slide, `+ Slide` to add, `◀ ▶` to reorder, `✕` to remove.
- **Image fields** support drag-and-drop or URL paste. Files land in `designs/<slug>/images/`. Click **Remove BG** to run local `rembg` and get a transparent-PNG copy.
- **Theme**: `dark` (default) or `light` (off-white background, near-black text — use sparingly, one slide per carousel as a breather).
- **Texture**: optional overlay (`grain` / `noise` / `scanlines` / `paper` / `halftone` / `vignette`). Comma-separate to stack: `grain,vignette`.

### 3 · Render

Click **Render** in the top nav. Studio runs headless Chromium, writes one PNG per slide to `designs/<slug>/output/01-slide.png`, etc. Click the project's row in Finder/Explorer to grab the files.

---

## Authoring with a Claude Project

For carousel-heavy workflows, the fastest authoring loop is to keep one Claude.ai Project open with your source PDFs uploaded as Knowledge.

1. In the editor's **Paste** tab, click **Project setup (1×)** → paste the prompt into your Claude Project's *Custom instructions*. One-time.
2. For each carousel: new chat in that Project → click **New topic** → paste the prompt → fill in your topic and series label → send.
3. Claude replies with Markdown wrapped in a ```` ```yaml ``` ```` fence. Click the **Copy code** button → paste into the editor's Markdown textarea → click **Replace slides**.

The system prompt enforces the Itiha voice (`*accent words*` in headlines, `[bracket key terms]` in body, `_italics_` for foreign words) and the schema the parser accepts.

---

## Formats and layouts

Each design names a `format:` in `content.yaml`. The renderer sets the viewport to match exactly.

| Format | Dimensions | Use |
|--|--|--|
| `instagram-portrait` | 1080 × 1350 | IG carousel |
| `instagram-square` | 1080 × 1080 | IG square / quote card |
| `instagram-reel` | 1080 × 1920 | Reel title card |
| `youtube-thumbnail` | 1280 × 720 | YouTube thumbnail |
| `youtube-end-card` | 1920 × 1080 | Video end card |

**Carousel layouts** (pick across slides to vary rhythm):

| Layout | Use |
|--|--|
| `cover` | Opening slide — image, eyebrow row, big headline, swipe-meta. |
| `story` | Image + a single text block. Block anchored top / middle / bottom. |
| `split-story` | Image, headline pinned high, body pinned low. |
| `quote` | Pull quote with red left border + body below. |
| `stat` | Two-column number comparison ("12.5%" vs "Worse."). |
| `dates-grid` | 2×2 grid of (date, fact) cells. |
| `numbered-list` | Vertical list of 3–5 items with big Bebas numerals. For "N reasons" slides. |
| `comparison` | Side-by-side myth-vs-reality / claim-vs-counter. |
| `portrait` | Subject-focused — portrait image, big name, dates, role, optional pull quote. |
| `closing` | Final slide — stats row + follow handle. |
| `interior-light` | Off-white editorial slide (red left border, slide number top-right). |
| `cta-red` | Solid Sindoor Red call-to-action. |

**Standalone-format layouts** (one slide per design folder, native dimensions):

| Layout | Format | Use |
|--|--|--|
| `quote-card` | `instagram-square` | Archival quote (dark or light variant). |
| `reel-title` | `instagram-reel` | Reel title card with optional in-video subtitle pill. |
| `youtube-thumbnail` | `youtube-thumbnail` | Big-type thumbnail. |
| `end-card` | `youtube-end-card` | Video end card with wordmark + handles. |

Layout source: [`shared/layouts.jsx`](shared/layouts.jsx). Field definitions: [`shared/manifest.js`](shared/manifest.js). To add a new layout, add the component to `layouts.jsx`, register it in `window.LAYOUTS` at the bottom, add a manifest entry, and add the name to `KNOWN_LAYOUTS` in [`src/content.py`](src/content.py).

---

## Inline text micro-syntax

- **Headlines** (Bebas Neue): `*word*` → Sindoor Red accent.
- **Body** (DM Sans): `[word]` → red emphasis · `_word_` → italic · `**word**` → bold.
- Block scalars (YAML's `|`) fold single newlines into spaces in body text; double newline = paragraph break. Headlines preserve line breaks literally.

---

## Optional integrations (skip until you need them)

### Notion content calendar

Set `NOTION_TOKEN` + `NOTION_DB_ID` in `.env` (see `.env.example`). Studio's home page then shows a **Notion backlog** section pulled from your Instagram Content Plan database. Clicking a row creates a Studio project + writes back the slug + bumps status to "Write Post". On render, status auto-flips to "Ready to publish" and slide-1.png is attached to the Notion row's Image File. Setup details in [`docs/INSTAGRAM_SETUP.md`](docs/INSTAGRAM_SETUP.md) and the comments in `.env.example`.

### Instagram publishing

`src/instagram.py` ships with a Graph API publisher. One-time wiring in [`docs/INSTAGRAM_SETUP.md`](docs/INSTAGRAM_SETUP.md). After that: `bin/render <slug>` then `bin/publish <slug>` (or `python src\instagram.py <slug>` on Windows).

### Background removal

The **Remove BG** button on uploaded images uses local [rembg](https://github.com/danielgatis/rembg). No API key needed. First click downloads the ~180 MB U²-Net model to `~/.u2net/`. Subsequent calls take 2–5 s on CPU.

---

## Project layout

```
motion-graphics/
├── bin/                 setup · new · preview · render · publish · studio   (bash; Windows: run src/<name>.py directly)
├── src/
│   ├── studio.py        multi-project server with home page (entry point)
│   ├── preview.py       single-project live-reload server (legacy)
│   ├── render.py        headless-Chromium PNG renderer
│   ├── content.py       YAML loader + image resolver
│   ├── formats.py       platform format presets
│   ├── scaffold.py      starter content.yaml templates per format
│   ├── instagram.py     Graph API publisher
│   ├── notion_sync.py   Notion content-plan integration
│   ├── import_cli.py    Markdown / Claude Design importer dispatch
│   └── importers/       importer plug-ins
├── shared/
│   ├── home.html               Studio home page (project picker + backlog)
│   ├── render-host.html        editor / preview shell
│   ├── editor.jsx              side-panel React editor
│   ├── layouts.jsx             every slide layout
│   ├── manifest.js             layout field definitions (drives the editor forms)
│   ├── slides-shared.jsx       React primitives (Stamp, Divider, ImageLayer, …)
│   └── colors_and_type.css     canonical design tokens
├── docs/
│   └── INSTAGRAM_SETUP.md      one-time Graph API setup
├── designs/             one folder per piece of content (your work lives here)
├── samples/             reference Markdown doc for the importer
├── .env.example         copy to .env for Notion / IG / image-host config
└── requirements.txt     Python deps (Playwright, PyYAML, rembg, requests, dotenv, …)
```

---

## End-to-end example (macOS)

```bash
bin/studio                         # opens browser → home page
# Create project from the UI ("Goel's CPI argument" · IG portrait · Create & open)
# Edit slides in the side panel · drag images in · click Render
open designs/goels-cpi-argument/output/   # grab the PNGs
```

### End-to-end example (Windows)

```powershell
python src\studio.py
# Create project from the browser UI · edit · render
explorer designs\goels-cpi-argument\output\
```

---

## Troubleshooting

| Symptom | Likely cause / fix |
|--|--|
| `pip install` fails on `playwright` on Windows | Make sure you're on Python 3.10+ (`py --version`). If using Python 3.13, downgrade to 3.11. |
| `python -m playwright install chromium` fails | Run it again — the download is large and sometimes flaky. Check disk space. |
| Studio launches but home page is blank | Hard-refresh the browser (Cmd-Shift-R / Ctrl-Shift-R). Babel-in-browser caches aggressively. |
| Render produces blank slides | Open the preview, check the browser console for JSX errors. Usually a recently-edited layout. |
| `Remove BG` button does nothing | First call downloads a 180 MB model. Watch the terminal; ~30 s on first run. |
| Notion backlog shows "not configured" | `.env` not loaded — confirm the file is at the repo root and Studio was restarted *after* editing it. |
| Editor input reverts on every keystroke | Stale Studio process. Kill all `python src/studio.py` processes and relaunch. |
| `bin/studio: command not found` on Windows Git Bash | Activate path is wrong on Windows. Either fix the script's `.venv/bin/activate` → `.venv/Scripts/activate` or just run `python src/studio.py` directly. |
