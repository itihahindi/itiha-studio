# Importers

An importer turns a source document into a `content.yaml`-shaped dict. The CLI dispatches by file extension or URL host.

```
src/importers/
├── __init__.py        registry + dispatcher
├── markdown.py        .md / .markdown / .txt
├── claude_design.py   api.anthropic.com URL · .zip / .tar / .tar.gz
└── README.md          this file
```

## Claude Design importer (reference implementation)

`claude_design.py` shows the pattern for a more elaborate importer:

1. **Acquisition.** Fetch the bundle from `https://api.anthropic.com/v1/design/h/<hash>` (gzip+tar), or accept a local archive. Extract to a temp directory.
2. **Shape detection.** Currently only handles bundles containing a `*Capture.html` (single-slide React renderer driven by `window.__setSlide`). Other shapes (template-only design-system bundles) raise a clear error.
3. **Headless extraction.** Boot a Playwright browser pointed at the bundle's Capture.html, walk through every slide, and scrape `.itiha-h1` / `.itiha-body` / `.itiha-eyebrow` / image elements into structured fields. Layout is inferred from structural features (pull-quote class, grid templates, background color).
4. **Image collection.** Decode the data URLs in `.image-slots.state.json` into real files; `_images` carries the copy jobs to the CLI.

When you extend this for another bundle shape (or a third-party tool's export), preserve the contract: return `{name, format, caption, tweaks, slides, _images}`. Layout heuristics live in the JS string passed to `page.evaluate()`.

## The contract

Every importer is a function that takes a source (path or URL) and returns:

```python
{
  "name":    str,                 # title
  "format":  str,                 # e.g. "instagram-portrait"
  "caption": str,                 # IG caption
  "tweaks":  dict,                # global tweaks
  "slides":  [ dict, ... ],       # one dict per slide, in content.yaml shape
  "_images": [(Path, str), ...],  # files to copy into designs/<slug>/images/
}
```

The `_images` field is a list of `(source_path, dest_filename)` tuples. The CLI
copies these into the design's `images/` folder. URLs in `slide["image"]` pass
through untouched — the existing image resolver in `src/content.py` downloads
them on first render.

## Registering

```python
from . import register

@register(".md", ".markdown", ".txt")
def import_doc(source):
    ...
    return {"name": ..., "slides": [...], "_images": [...]}
```

For URL-only sources:

```python
from . import register_url

@register_url("docs.google.com")
def import_doc(source):
    ...
```

Then add a top-level import in `src/importers/__init__.py` so the registration
fires (see how `markdown` is loaded there).

## Adding a `.docx` importer

```python
# src/importers/docx_importer.py
from pathlib import Path
from docx import Document      # pip install python-docx
from . import register

@register(".docx")
def import_doc(source):
    doc = Document(source)
    # Iterate paragraphs and inline images; build the slides list.
    slides = []
    # …extraction logic…
    return {
        "name": Path(source).stem,
        "format": "instagram-portrait",
        "caption": "",
        "tweaks": {},
        "slides": slides,
        "_images": [],
    }
```

Add `python-docx` to `requirements.txt` and add `from . import docx_importer`
to `__init__.py`.

## Adding a Google Docs URL importer

Google Docs has a public-export endpoint:
`https://docs.google.com/document/d/<ID>/export?format=md` returns Markdown.

```python
# src/importers/gdocs.py
import re, urllib.request
from . import register_url
from .markdown import import_doc as md_import

@register_url("docs.google.com")
def import_doc(url):
    m = re.search(r"/document/d/([a-zA-Z0-9_-]+)", url)
    if not m:
        raise ValueError(f"can't extract document id from {url}")
    export_url = f"https://docs.google.com/document/d/{m.group(1)}/export?format=md"
    md = urllib.request.urlopen(export_url).read().decode()
    # Write to a temp file so the markdown importer can resolve relative images.
    import tempfile, pathlib
    tmp = pathlib.Path(tempfile.mkdtemp()) / "gdoc.md"
    tmp.write_text(md)
    return md_import(tmp)
```

The doc must be set to "Anyone with the link" for the export endpoint to work
without auth.

## Adding a Notion importer

Notion's API requires an integration token and explicit page-sharing. The
shape is the same — fetch the page, walk blocks, map headings/paragraphs to
slide fields, collect image URLs, return the dict.

## Conventions across importers

- **Layouts**: if your source can't express layouts, default first slide to
  `cover`, last to `closing`, middle slides to `story`. The Markdown
  importer's `_default_layout()` is the reference.
- **Image refs**: URLs stay as URLs (downloaded lazily by the renderer);
  local paths are bundled into `_images`. Keep the design folder
  self-contained.
- **Field names**: normalize to lowercase + underscores
  (`Image-BW` → `image_bw`). `markdown._norm()` is the reference.
- **Errors**: raise with a slide-numbered message
  (`"slide 3: invalid YAML — …"`). The CLI surfaces it verbatim.
