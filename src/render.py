"""Render a carousel to PNGs.

Supports two modes:

  YAML mode  — designs/<name>/content.yaml + shared/ layout library
  Legacy mode — designs/<name>/<entry>.html + per-design JSX

YAML mode is auto-detected by the presence of content.yaml. Both modes drive
the page through `window.__setSlide(n)` and screenshot `#root`.
"""

from __future__ import annotations

import asyncio
import json
import socket
import threading
import urllib.parse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path

from playwright.async_api import async_playwright

import content as content_mod
from formats import get as get_format


ROOT = Path(__file__).resolve().parents[1]
SHARED = ROOT / "shared"


def _ephemeral_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _serve_overlay(design_dir: Path, content_json_bytes: bytes,
                   brand: str = "itiha",
                   version: str = "v1") -> tuple[ThreadingHTTPServer, int]:
    """Serve a virtual filesystem: shared/ + design's images + content.json + version.txt."""

    state = {"content": content_json_bytes, "version": version, "brand": brand}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def _send_file(self, path: Path, content_type: str = None):
            if not path.exists() or not path.is_file():
                self.send_error(404)
                return
            data = path.read_bytes()
            self.send_response(200)
            if content_type:
                self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _send_bytes(self, data: bytes, content_type: str):
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            path = urllib.parse.urlparse(self.path).path
            if path == "/content.json":
                self._send_bytes(state["content"], "application/json")
                return
            if path == "/version.txt":
                self._send_bytes(state["version"].encode(), "text/plain")
                return
            if path.startswith("/images/"):
                rel = urllib.parse.unquote(path[len("/images/"):])
                self._send_file(design_dir / "images" / rel)
                return
            # Otherwise serve from shared/
            rel = urllib.parse.unquote(path.lstrip("/"))
            if not rel:
                rel = "render-host.html"
            if rel == "render-host.html":
                # Substitute the brand-pack placeholder (see studio.py).
                data = (SHARED / rel).read_bytes().replace(
                    b"__BRAND__", state["brand"].encode())
                self._send_bytes(data, "text/html")
                return
            target = SHARED / rel
            # Light MIME mapping; Chromium tolerates missing content-type.
            mime = {
                ".html": "text/html",
                ".jsx":  "text/babel; charset=utf-8",
                ".js":   "application/javascript",
                ".css":  "text/css",
                ".png":  "image/png",
                ".jpg":  "image/jpeg",
                ".jpeg": "image/jpeg",
                ".webp": "image/webp",
                ".json": "application/json",
            }.get(target.suffix.lower())
            self._send_file(target, mime)

    server = ThreadingHTTPServer(("127.0.0.1", _ephemeral_port()), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, server.server_address[1], state


# ── Overflow probe ───────────────────────────────────────────────────
# A slide is a fixed frame with `overflow:hidden`, so copy that runs too
# long does not reflow onto a second page — it slides off the bottom edge
# or gets clipped inside a box, and the only way we have caught that so
# far is a human squinting at the PNG afterwards. This asks the page
# instead, once fonts and images have settled (same await the screenshot
# uses), so a bad body length fails loudly at render time.
#
# Two findings, both scoped to elements that actually carry text:
#   past-<side>  the element's box extends beyond the slide frame
#   clipped      an overflow:hidden box is shorter than its own content
# Bleed is sometimes deliberate (a ghost index, an SFX word crossing a
# panel edge), so anything inside a [data-bleed] element is ignored.
_OVERFLOW_JS = r"""() => {
  const slide = document.querySelector('#root .itiha-slide');
  if (!slide) return [];
  const S = slide.getBoundingClientRect();
  const TOL = 4;
  // Ignore hairline grazes — a descender clipping a rule is not a bug.
  const MIN_OVERLAP = 600;
  const MIN_RATIO = parseFloat(window.__OVERFLOW_RATIO || '0.35');
  const label = (el) => {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > 60 ? t.slice(0, 60) + '…' : t;
  };
  const ownText = (el) => Array.from(el.childNodes)
    .some((n) => n.nodeType === 3 && n.textContent.trim().length);
  const hits = [];
  const edges = [];
  for (const el of Array.from(slide.querySelectorAll('*'))) {
    if (el.closest('[data-bleed]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (parseFloat(cs.opacity || '1') === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (ownText(el)) {
      const sides = {
        bottom: r.bottom - S.bottom,
        top: S.top - r.top,
        right: r.right - S.right,
        left: S.left - r.left,
      };
      for (const side of Object.keys(sides)) {
        if (sides[side] > TOL) {
          // A three-line headline is three elements; group them below so
          // one runaway block is one warning.
          edges.push({ el, side, px: Math.round(sides[side]) });
        }
      }
    }
    if (el !== slide && (cs.overflow === 'hidden' || cs.overflowY === 'hidden')) {
      const spill = el.scrollHeight - el.clientHeight;
      if (spill > TOL && el.clientHeight > 0 && (el.textContent || '').trim().length) {
        hits.push({ kind: 'clipped', px: Math.round(spill), text: label(el) });
      }
    }
  }
  // Text that collides with other text is the other half of the problem:
  // a body long enough to reach the folio or the jump line stays inside
  // the frame, so the edge test above never fires, but the slide is still
  // broken. Compare the visible text leaves against each other.
  const leaves = Array.from(slide.querySelectorAll('*')).filter((el) => {
    if (el.closest('[data-bleed]')) return false;
    if (!ownText(el)) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (parseFloat(cs.opacity || '1') === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1;
  });
  // Two inline spans in one headline ("A body far too" + "long") have
  // bounding boxes that overlap whenever the first one wraps, because an
  // inline box's rect is the union of its line boxes. Those share a block
  // ancestor, so compare only across blocks.
  const blockOf = (el) => {
    let n = el;
    while (n && n !== slide) {
      const d = getComputedStyle(n).display;
      if (d !== 'inline' && d !== 'inline-block' && d !== 'contents') return n;
      n = n.parentElement;
    }
    return slide;
  };
  // Line boxes are the wrong shape to compare. Bebas headlines run
  // line-height 0.94, so their glyphs spill outside the box, while a
  // mono meta line's box is much taller than its caps. Two blocks that
  // sit neatly one under the other still report overlapping line boxes.
  // Approximate the ink instead: centre a band of the font's own size in
  // the line box and trim a little off the top and bottom for the gap
  // between cap height and the em square.
  const ink = (el) => {
    const F = parseFloat(getComputedStyle(el).fontSize) || 0;
    return Array.from(el.getClientRects()).map((r) => {
      const pad = (r.height - F) / 2;
      const top = r.top + pad + F * 0.12;
      const bottom = r.bottom - pad - F * 0.12;
      return { top, bottom, left: r.left, right: r.right, height: Math.max(bottom - top, 1) };
    });
  };
  const worst = new Map();
  for (let i = 0; i < leaves.length; i++) {
    for (let j = i + 1; j < leaves.length; j++) {
      const a = leaves[i], b = leaves[j];
      if (a.contains(b) || b.contains(a)) continue;
      if (blockOf(a) === blockOf(b)) continue;
      // Compare line boxes, not the union bounding box: a wrapped
      // headline's rect covers the full column width on every line, so
      // two stacked blocks "overlap" on paper when they do not.
      let area = 0, ratio = 0;
      for (const ra of ink(a)) {
        for (const rb of ink(b)) {
          const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (w > TOL && h > TOL && w * h > area) {
            area = w * h;
            ratio = h / Math.min(ra.height, rb.height);
          }
        }
      }
      if (area > MIN_OVERLAP && ratio >= MIN_RATIO) {
        // One line per offending block, carrying its worst collision.
        const key = label(a);
        area = Math.round(area);
        const prev = worst.get(key);
        if (!prev || area > prev.px) {
          worst.set(key, { kind: 'overlaps', px: area, ratio: Math.round(ratio * 100) / 100,
                           text: key + '  ><  ' + label(b) });
        }
      }
    }
  }
  for (const h of worst.values()) hits.push(h);

  // Worst escaping line per block, so a headline reports once.
  // Keyed by the element itself: two unrelated blocks can both carry no
  // class, and keying on the class name silently merged them.
  const perBlock = new Map();
  for (const e of edges) {
    const b = blockOf(e.el);
    let bySide = perBlock.get(b);
    if (!bySide) { bySide = new Map(); perBlock.set(b, bySide); }
    const prev = bySide.get(e.side);
    if (prev === undefined || e.px > prev) bySide.set(e.side, e.px);
  }
  for (const [b, bySide] of perBlock) {
    for (const [side, px] of bySide) {
      hits.push({ kind: 'past-' + side, px, text: label(b) });
    }
  }

  // Nested spans repeat the same copy, so one warning per kind + text.
  const out = [], seen = new Set();
  for (const h of hits) {
    const k = h.kind + '|' + h.text;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(h);
  }
  return out;
}"""


def _report_overflow(warnings: list[dict], slide_no: int) -> list[dict]:
    """Print one line per finding and return them tagged with the slide."""
    tagged = []
    for w in warnings:
        if w["kind"].startswith("past-"):
            what = f'text runs {w["kind"].replace("past-", "past the ")} edge by {w["px"]}px'
        elif w["kind"] == "clipped":
            what = f'box clips {w["px"]}px of its own text'
        else:
            what = f'text overlaps text ({w["px"]}px², {int(w.get("ratio", 0) * 100)}% of a line)'
        print(f'  !! slide {slide_no:02d}: {what} -- "{w["text"]}"')
        tagged.append({"slide": slide_no, **w})
    return tagged


def _overflow_summary(found: list[dict]) -> None:
    if not found:
        return
    slides = sorted({w["slide"] for w in found})
    print(f"  overflow: {len(found)} warning(s) on slide(s) " + ", ".join(f"{n:02d}" for n in slides))
    # Machine-readable tail so studio.py can hand these to the editor.
    print("OVERFLOW_JSON:" + json.dumps(found))


async def _render_yaml_mode(design_dir: Path) -> list[Path]:
    print(f"  loading {design_dir.name}/content.yaml")
    content = content_mod.load_content(design_dir)
    content_bytes = json.dumps(content, ensure_ascii=False).encode()
    fmt = get_format(content["format"])
    slide_count = len(content["slides"])
    output_dir = content_mod.output_dir_for(design_dir)

    # Clear stale PNGs so a slide that no longer exists doesn't linger.
    # `missing_ok=True`: two concurrent renders (auto-render + a manual
    # click) race on the same output dir — without it, the loser hits
    # FileNotFoundError after the winner has already swept the file.
    for stale in output_dir.glob("*-slide.png"):
        stale.unlink(missing_ok=True)

    server, port, _ = _serve_overlay(design_dir, content_bytes,
                                     content.get("brand", "itiha"))
    url = f"http://127.0.0.1:{port}/render-host.html?capture=1"
    print(f"  serving on http://127.0.0.1:{port}")

    written: list[Path] = []
    overflow: list[dict] = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context(
                viewport={"width": fmt["width"], "height": fmt["height"]},
                device_scale_factor=1,
            )
            page = await context.new_page()
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_function(
                """() => typeof window.__setSlide === 'function'
                       && document.querySelector('#root .itiha-slide')""",
                timeout=20_000,
            )
            for i in range(slide_count):
                await page.evaluate(f"window.__setSlide({i})")
                await page.evaluate("""async () => {
                    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                    await document.fonts.ready;
                    const imgs = Array.from(document.querySelectorAll('#root img'));
                    await Promise.all(imgs.map(img =>
                        (img.complete && img.naturalWidth > 0)
                            ? null
                            : new Promise(r => { img.addEventListener('load', r); img.addEventListener('error', r); })
                    ));
                }""")
                out = output_dir / f"{i + 1:02d}-slide.png"
                await page.locator("#root").screenshot(path=str(out))
                print(f"  wrote {out}")
                written.append(out)
                overflow += _report_overflow(await page.evaluate(_OVERFLOW_JS), i + 1)
            await browser.close()
    finally:
        server.shutdown()
    _overflow_summary(overflow)
    return written


async def _render_legacy_mode(design_dir: Path) -> list[Path]:
    """Original handler: serves the design dir as-is, drives the existing entry HTML."""
    from http.server import SimpleHTTPRequestHandler

    config = json.loads((design_dir / "design.json").read_text())
    fmt = get_format(config["format"])
    entry = config.get("entry", "Itiha Capture.html")
    slide_count = config["slide_count"]
    output_dir = content_mod.output_dir_for(design_dir)

    for stale in output_dir.glob("*-slide.png"):
        stale.unlink(missing_ok=True)

    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw): super().__init__(*a, directory=str(design_dir), **kw)
        def log_message(self, *_): pass

    server = ThreadingHTTPServer(("127.0.0.1", _ephemeral_port()), H)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_address[1]
    url = f"http://127.0.0.1:{port}/{urllib.parse.quote(entry)}"
    print(f"  serving {design_dir.name} on {url}")

    written: list[Path] = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context(
                viewport={"width": fmt["width"], "height": fmt["height"]},
                device_scale_factor=1,
            )
            page = await context.new_page()
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_function(
                """() => typeof window.__setSlide === 'function'
                       && document.querySelector('#root .itiha-slide')""",
                timeout=20_000,
            )
            for i in range(slide_count):
                await page.evaluate(f"window.__setSlide({i})")
                await page.evaluate("""async () => {
                    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                    await document.fonts.ready;
                    const imgs = Array.from(document.querySelectorAll('#root img'));
                    await Promise.all(imgs.map(img =>
                        (img.complete && img.naturalWidth > 0)
                            ? null
                            : new Promise(r => { img.addEventListener('load', r); img.addEventListener('error', r); })
                    ));
                }""")
                out = output_dir / f"{i + 1:02d}-slide.png"
                await page.locator("#root").screenshot(path=str(out))
                print(f"  wrote {out}")
                written.append(out)
            await browser.close()
    finally:
        server.shutdown()
    return written


async def render_design(design_dir: Path) -> list[Path]:
    if (design_dir / "content.yaml").exists():
        return await _render_yaml_mode(design_dir)
    return await _render_legacy_mode(design_dir)


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: render.py <design-name>")
        return 2
    design_dir = ROOT / "designs" / argv[1]
    if not design_dir.is_dir():
        print(f"no such design: {design_dir}")
        return 1
    files = asyncio.run(render_design(design_dir))
    print(f"\nrendered {len(files)} slide(s) → {content_mod.output_dir_for(design_dir)}")
    return 0


if __name__ == "__main__":
    import sys
    raise SystemExit(main(sys.argv))
