"""Claude Design (claude.ai/design) bundle importer.

Accepts either:
  - https://api.anthropic.com/v1/design/h/<hash>     (fetched from the API)
  - /path/to/bundle.zip or .tar.gz                    (already-downloaded)
  - /path/to/extracted/folder                         (already-extracted)

Then:
  1. Detect the bundle shape (carousel today; more later).
  2. For carousel bundles: spin up the bundle's `<…> Capture.html` in headless
     Chromium, drive `window.__setSlide(n)` across every slide, and scrape the
     DOM into a normalized content.yaml-shaped dict.
  3. Save embedded slot images (data URLs in `.image-slots.state.json`) as
     real files under `images/`.
"""

from __future__ import annotations

import base64
import gzip
import io
import json
import re
import socket
import tarfile
import tempfile
import threading
import urllib.parse
import urllib.request
import zipfile
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

from playwright.sync_api import sync_playwright

from . import register, register_url


# ── Bundle acquisition ───────────────────────────────────────────

def _fetch_bundle(url: str) -> Path:
    """Download the bundle to a temp file and return its path."""
    req = urllib.request.Request(url, headers={
        "User-Agent": "motion-graphics/0.1 (claude-design importer)",
        "Accept": "*/*",
    })
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    tmp = Path(tempfile.mkdtemp(prefix="cd-bundle-")) / "bundle.bin"
    tmp.write_bytes(data)
    return tmp


def _extract(path: Path) -> Path:
    """Extract a .tar.gz / .zip / raw-gzip-tar bundle to a temp directory."""
    out = Path(tempfile.mkdtemp(prefix="cd-extract-"))
    raw = path.read_bytes()

    # Try as gzip first (claude.ai/design returns a gzipped tar with no extension)
    try:
        decompressed = gzip.decompress(raw)
        with tarfile.open(fileobj=io.BytesIO(decompressed)) as t:
            t.extractall(out)
        return out
    except (OSError, tarfile.TarError):
        pass

    # Plain tar?
    try:
        with tarfile.open(path) as t:
            t.extractall(out)
        return out
    except tarfile.TarError:
        pass

    # Zip?
    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as z:
            z.extractall(out)
        return out

    raise ValueError(f"unrecognized bundle archive: {path}")


# ── Shape detection ──────────────────────────────────────────────

def _find_carousel_entry(root: Path) -> Path | None:
    """Find a single-slide capture HTML that drives `window.__setSlide`."""
    candidates = list(root.rglob("*Capture*.html"))
    if not candidates:
        # also look inside project/ subfolders
        candidates = list(root.rglob("project/*Capture*.html"))
    return candidates[0] if candidates else None


# ── Headless extraction ──────────────────────────────────────────

# Returns content with text markers (`*x*` accent, `[x]` key, `_x_` italic)
# re-injected from the rendered class names.
_EXTRACTOR_JS = r"""
() => {
  const slide = document.querySelector('#root .itiha-slide');
  if (!slide) return { error: 'no .itiha-slide' };
  const cs = name => slide.querySelector(name);

  const inlineText = (el, opts={}) => {
    if (!el) return null;
    let out = '';
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) { out += node.textContent; return; }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName;
      if (tag === 'BR') { out += '\n'; return; }
      if (node.classList && node.classList.contains('accent')) {
        out += '*' + node.textContent + '*'; return;
      }
      if (node.classList && node.classList.contains('key')) {
        out += '[' + node.textContent + ']'; return;
      }
      const style = node.getAttribute && node.getAttribute('style') || '';
      const isRed = /color\s*:\s*(?:#C0392B|rgb\(192,\s*57,\s*43\))/i.test(style);
      if (tag === 'EM') {
        // <em> with red colour and fontStyle:normal → that's the key-red treatment.
        if (isRed && /font-style\s*:\s*normal/i.test(style)) {
          out += '[' + node.textContent + ']'; return;
        }
        out += '_' + node.textContent + '_'; return;
      }
      if (isRed && node.tagName === 'SPAN') {
        out += '[' + node.textContent + ']'; return;
      }
      for (const c of node.childNodes) walk(c);
    };
    for (const c of el.childNodes) walk(c);
    return out.replace(/\s*\n\s*/g, '\n').trim();
  };

  const text = (sel) => { const e = cs(sel); return e ? e.textContent.trim() : null; };

  // Background colour signals
  const bg = getComputedStyle(slide).backgroundColor;
  const isRedBg = /rgb\(192,\s*57,\s*43\)/.test(bg);
  const isLightBg = /rgb\(250,\s*245,\s*238\)/.test(bg);

  // Distinct structural features → layout
  const hasPull = !!cs('.itiha-pull');
  const grids = slide.querySelectorAll('div[style*="grid-template-columns"]');
  let dateGrid = false, statGrid = false, closingGrid = false;
  for (const g of grids) {
    const cols = (g.style.gridTemplateColumns || '').trim();
    const items = g.children.length;
    if (cols.includes('1fr 1fr') && items === 4) dateGrid = true;
    else if (cols.includes('1fr 1px 1fr') || (cols.match(/1fr/g) || []).length === 2) statGrid = true;
    else if ((cols.match(/1fr/g) || []).length === 3) closingGrid = true;
  }

  // Cover heuristic: a "swipe meta" line OR a Series eyebrow at the top
  const eyebrows = slide.querySelectorAll('.itiha-eyebrow');
  const subs = slide.querySelectorAll('.itiha-sub, .itiha-meta');
  const hasCoverFooter = Array.from(subs).some(s => /swipe|slides|min read/i.test(s.textContent));

  let layout = 'story';
  if (isRedBg) layout = 'cta-red';
  else if (isLightBg) layout = 'interior-light';
  else if (hasPull) layout = 'quote';
  else if (dateGrid) layout = 'dates-grid';
  else if (statGrid) layout = 'stat';
  else if (closingGrid) layout = 'closing';
  else if (hasCoverFooter) layout = 'cover';

  // Eyebrow / chapter classification.
  // The cover ALWAYS uses `eyebrow` (Series 01 is a visible label, not a chapter).
  // Non-cover slides classify "Chapter N · …" / "End · …" as chapter (hidden by tweak).
  const eyebrowText = eyebrows.length ? eyebrows[0].textContent.trim() : null;
  const isChapterText = eyebrowText && /^(chapter\b|end\s*·)/i.test(eyebrowText);
  const chapter = (layout !== 'cover' && isChapterText) ? eyebrowText : null;
  const eyebrow = chapter ? null : eyebrowText;

  // Cover-specific extras: eyebrow_meta (the .itiha-sub next to the eyebrow),
  // subline (the next .itiha-sub above the swipe-meta line).
  let eyebrow_meta = null, subline = null;
  if (layout === 'cover') {
    if (eyebrows.length) {
      const wrap = eyebrows[0].parentElement;
      if (wrap) {
        const sib = wrap.querySelector('.itiha-sub');
        if (sib) eyebrow_meta = sib.textContent.trim();
      }
    }
    for (const s of subs) {
      if (s.classList.contains('itiha-sub') && !/swipe|min read/i.test(s.textContent) && s.textContent.trim() !== eyebrow_meta) {
        subline = s.textContent.trim(); break;
      }
    }
  }

  // Headline + body
  const headline = inlineText(cs('.itiha-h1'));
  const body = inlineText(cs('.itiha-body'));

  // Sub line right under headline (e.g. the Hindi line on A7). Cover handles
  // its own subline above; for other layouts pull whichever .itiha-sub sits
  // inside the headline's wrapper div.
  if (subline === null && layout !== 'cover') {
    const h1 = cs('.itiha-h1');
    if (h1 && h1.parentElement) {
      const el = h1.parentElement.querySelector('.itiha-sub');
      if (el) subline = el.textContent.trim();
    }
  }

  // Image: the <img> rendered inside <image-slot>
  const imgEl = slide.querySelector('image-slot img');
  const imageSrc = imgEl ? imgEl.src : null;
  const imageBw = imgEl && /grayscale\(1\)/.test(imgEl.style.filter || '');

  // Pull-quote specifics
  let quote = null, attribution = null;
  if (layout === 'quote') {
    const pull = cs('.itiha-pull');
    if (pull) quote = inlineText(pull);
    const meta = slide.querySelector('.itiha-meta');
    if (meta) attribution = meta.textContent.trim();
  }

  // Stat layout: two big Bebas numbers
  let stats = null;
  if (layout === 'stat' || layout === 'closing') {
    stats = [];
    for (const g of grids) {
      const items = Array.from(g.children).filter(c => c.tagName === 'DIV' && c.children.length >= 2);
      if (!items.length) continue;
      for (const cell of items) {
        const labelEl = cell.querySelector('.itiha-meta:first-child') || cell.querySelector('.itiha-meta');
        const subEl   = cell.querySelectorAll('.itiha-meta')[1];
        const valEl   = Array.from(cell.children).find(c => /Bebas/i.test(c.style.fontFamily || ''));
        const valColor = valEl ? getComputedStyle(valEl).color.replace(/\s/g, '') : '';
        const valueRed = /rgb\(192,57,43\)/.test(valColor);
        const row = {
          label: labelEl ? labelEl.textContent.trim() : null,
          value: valEl ? valEl.textContent.trim() : null,
          sublabel: subEl ? subEl.textContent.trim() : null,
        };
        if (valueRed) row.value_red = true;
        stats.push(row);
      }
      break; // first matching grid only
    }
  }

  // Dates grid: 4 cells of (Bebas date + body text)
  let items = null;
  if (layout === 'dates-grid') {
    items = [];
    for (const g of grids) {
      const cells = Array.from(g.children).filter(c => c.tagName === 'DIV');
      if (cells.length !== 4) continue;
      for (const c of cells) {
        const dateEl = Array.from(c.children).find(x => /Bebas/i.test(x.style.fontFamily || ''));
        const textEl = c.querySelector('.itiha-body, p');
        items.push({
          date: dateEl ? dateEl.textContent.trim() : null,
          text: textEl ? inlineText(textEl) : null,
        });
      }
      break;
    }
  }

  // Footer meta (swipe row on cover, handle on closing)
  const swipe_meta = (() => {
    for (const m of subs) {
      const t = m.textContent.trim();
      if (/swipe|min read/i.test(t)) return t;
    }
    return null;
  })();

  return {
    layout, eyebrow, eyebrow_meta, chapter,
    headline, subline: subline || null, body, swipe_meta,
    image_src: imageSrc, image_bw: imageBw || undefined,
    quote, attribution, stats, items,
  };
}
"""


def _strip_none(obj):
    """Recursively drop None/empty/False from dicts and through lists."""
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            vv = _strip_none(v)
            if vv in (None, "", [], {}, False): continue
            out[k] = vv
        return out
    if isinstance(obj, list):
        return [_strip_none(x) for x in obj]
    return obj


def _serve_dir(directory: Path) -> tuple[ThreadingHTTPServer, int]:
    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(directory), **kw)
        def log_message(self, *_): pass
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]
    server = ThreadingHTTPServer(("127.0.0.1", port), H)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, port


def _save_state_images(bundle_root: Path) -> dict[str, tuple[Path, str]]:
    """Find .image-slots.state.json, decode the data URLs into real files.

    Returns slot_id → (src_path, dest_filename) for the import CLI to copy.
    """
    candidates = list(bundle_root.rglob(".image-slots.state.json"))
    if not candidates:
        return {}
    state = json.loads(candidates[0].read_text())
    out: dict[str, tuple[Path, str]] = {}
    out_dir = Path(tempfile.mkdtemp(prefix="cd-images-"))
    for slot_id, val in state.items():
        url = val["u"] if isinstance(val, dict) else val
        m = re.match(r"data:image/(\w+);base64,(.+)", url or "")
        if not m: continue
        ext = m.group(1).lower()
        if ext == "jpeg": ext = "jpg"
        dest = out_dir / f"{slot_id}.{ext}"
        dest.write_bytes(base64.b64decode(m.group(2)))
        out[slot_id] = (dest, dest.name)
    return out


def _extract_carousel(entry_html: Path, bundle_root: Path) -> dict:
    served_dir = entry_html.parent
    server, port = _serve_dir(served_dir)
    url = f"http://127.0.0.1:{port}/{urllib.parse.quote(entry_html.name)}"

    # Pre-stage images from the state JSON so we can map src → local filename.
    slot_images = _save_state_images(bundle_root)
    # Build a reverse lookup from rendered data-URL prefix → slot_id by reading
    # the rendered <image-slot id> in the DOM.

    slides: list[dict] = []
    image_copy_jobs: list[tuple[Path, str]] = []
    seen_dest_names: set[str] = set()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            ctx = browser.new_context(viewport={"width": 1080, "height": 1350}, device_scale_factor=1)
            page = ctx.new_page()
            page.goto(url, wait_until="networkidle")
            page.wait_for_function(
                "() => typeof window.__setSlide === 'function' && document.querySelector('#root .itiha-slide')",
                timeout=20_000,
            )
            n = page.evaluate("() => (window.VARIATION_A || window.SLIDES || []).length") or 0
            if not n:
                # Try to detect by repeatedly setSlide(i) until error
                n = 9   # safe default for known itiha shape
            for i in range(n):
                page.evaluate(f"window.__setSlide({i})")
                page.evaluate("""async () => {
                    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                    await document.fonts.ready;
                }""")
                # also grab the slot id (for the image filename mapping)
                slot_id = page.evaluate(
                    "() => { const el = document.querySelector('#root .itiha-slide image-slot'); return el ? el.getAttribute('id') : null; }"
                )
                extracted = page.evaluate(_EXTRACTOR_JS)
                if isinstance(extracted, dict):
                    if slot_id and slot_id in slot_images:
                        src_path, dest_name = slot_images[slot_id]
                        extracted["image"] = dest_name
                        if dest_name not in seen_dest_names:
                            image_copy_jobs.append((src_path, dest_name))
                            seen_dest_names.add(dest_name)
                    elif extracted.get("image_src"):
                        # No state image but rendered img has a src — could be a public URL.
                        src = extracted["image_src"]
                        if src.startswith("http"):
                            extracted["image"] = src
                    extracted.pop("image_src", None)
                    slides.append(_strip_none(extracted))
            browser.close()
    finally:
        server.shutdown()

    return {"slides": slides, "_images": image_copy_jobs}


# ── Entry points (registry) ──────────────────────────────────────

def _import_from_extracted(root: Path, name_hint: str) -> dict:
    entry = _find_carousel_entry(root)
    if not entry:
        raise ValueError(
            f"could not find a *Capture.html in {root}. "
            f"This importer currently supports Claude Design carousel bundles. "
            f"For template/design-system bundles, hand-pick the files for now."
        )
    payload = _extract_carousel(entry, root)
    return {
        "name": name_hint,
        "format": "instagram-portrait",
        "caption": "",
        "tweaks": {"showChapterLabels": False, "showStamp": True, "showPageNum": True,
                   "overlayDarkness": 62, "showGrain": True},
        "slides": payload["slides"],
        "_images": payload["_images"],
    }


@register_url("api.anthropic.com")
def import_from_url(source: str) -> dict:
    parsed = urllib.parse.urlparse(source)
    if "/v1/design/h/" not in parsed.path:
        raise ValueError(f"not a Claude Design URL: {source}")
    # Drop any ?open_file= or other query params before fetching.
    clean = parsed._replace(query="", fragment="").geturl()
    print(f"  downloading bundle from {clean}")
    archive = _fetch_bundle(clean)
    root = _extract(archive)
    # The archive's top-level folder is usually the project slug.
    children = [c for c in root.iterdir() if c.is_dir()]
    name_hint = children[0].name if children else parsed.path.split("/")[-1]
    work_root = children[0] if children else root
    return _import_from_extracted(work_root, name_hint)


@register(".zip", ".tar", ".tar.gz", ".tgz")
def import_from_archive(source: str) -> dict:
    path = Path(source)
    print(f"  extracting {path.name}")
    root = _extract(path)
    children = [c for c in root.iterdir() if c.is_dir()]
    name_hint = children[0].name if children else path.stem
    work_root = children[0] if children else root
    return _import_from_extracted(work_root, name_hint)
