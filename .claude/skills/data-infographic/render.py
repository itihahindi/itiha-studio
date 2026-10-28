"""Render an infographic page to PNG and check it for broken text.

    ./.venv/bin/python .claude/skills/data-infographic/render.py page.html out.png [--scale 2]

The page must contain one element with id="canvas" sized to the target
format in CSS px (e.g. 1080x1350). The PNG is that element at --scale×.

Script/link URLs may use these prefixes, rewritten to file:// paths here so
a page works from any folder:
    @kit/  → .claude/skills/data-infographic/kit/   (poster.css, poster.js: the house look)
    @map/  → .claude/skills/india-map/   (india-map.js, the IndiaMap module)
    @geo/  → shared/geo/                 (india.js, india-districts.js, india-pc.js)

Waits for document.fonts.ready, then for window.__ready === true if the page
defines window.__ready (set it false at the top of your script and true
after drawing). Then it checks every piece of text and prints `!!` lines for
text past the canvas edge, text clipped by an overflow:hidden box, and text
sitting on top of other text. Fix every `!!` before delivering.
"""
from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

SKILL = Path(__file__).resolve().parent
REPO = SKILL.parents[2]

CHECK_JS = r"""
() => {
  const canvas = document.getElementById('canvas');
  const C = canvas.getBoundingClientRect();
  const boxes = [];
  const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.textContent.trim()) continue;
    const host = n.parentElement;
    if (host.closest('[data-bleed]')) continue;
    const cs = getComputedStyle(host);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    let rects;
    if (host instanceof SVGElement) rects = [host.getBoundingClientRect()];
    else { const r = document.createRange(); r.selectNodeContents(n); rects = [...r.getClientRects()]; }
    rects.filter(r => r.width > 0 && r.height > 0).forEach(r =>
      boxes.push({ r, host, text: n.textContent.trim().slice(0, 40) }));
  }
  const out = [];
  const tol = 2;
  boxes.forEach(b => {
    const r = b.r;
    if (r.left < C.left - tol || r.right > C.right + tol || r.top < C.top - tol || r.bottom > C.bottom + tol)
      out.push(`off canvas: "${b.text}"`);
    for (let a = b.host.parentElement; a && a !== canvas.parentElement; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.overflow === 'hidden' || s.overflowX === 'hidden' || s.overflowY === 'hidden') {
        const A = a.getBoundingClientRect();
        if (r.right > A.right + tol || r.bottom > A.bottom + tol || r.left < A.left - tol || r.top < A.top - tol)
          out.push(`clipped: "${b.text}"`);
        break;
      }
    }
  });
  // Text on text: compare ink bands (font-size tall, centred in the line box),
  // not line boxes, so tight leading doesn't false-alarm.
  const ink = (b) => {
    const fs = parseFloat(getComputedStyle(b.host).fontSize) || b.r.height;
    const h = Math.min(b.r.height, fs * 0.78), cy = (b.r.top + b.r.bottom) / 2;
    return { l: b.r.left, r: b.r.right, t: cy - h / 2, b: cy + h / 2 };
  };
  const I = boxes.map(ink);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    if (boxes[i].host === boxes[j].host) continue;
    if (boxes[i].host.contains(boxes[j].host) || boxes[j].host.contains(boxes[i].host)) continue;
    const a = I[i], b = I[j];
    const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
    if (w <= 1 || h <= 1) continue;
    const small = Math.min((a.r - a.l) * (a.b - a.t), (b.r - b.l) * (b.b - b.t));
    if (w * h > 0.08 * small && w * h > 120) out.push(`overlap: "${boxes[i].text}" × "${boxes[j].text}"`);
  }
  return [...new Set(out)];
}
"""


def render(html_path: Path, png_path: Path, scale: float = 2.0, transparent: bool = False) -> list[str]:
    src = html_path.read_text()
    src = (src.replace('"@kit/', f'"{(SKILL / "kit").as_uri()}/')
              .replace('"@map/', f'"{(SKILL.parent / "india-map").as_uri()}/')
              .replace('"@geo/', f'"{(REPO / "shared" / "geo").as_uri()}/'))
    # Same folder as the page so relative image paths keep working.
    with tempfile.NamedTemporaryFile("w", suffix=".html", dir=html_path.parent, delete=False,
                                     prefix=".render-") as tmp:
        tmp.write(src)
        tmp_path = Path(tmp.name)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 2000, "height": 2000}, device_scale_factor=scale)
            errors: list[str] = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: m.type in ("error", "warning") and errors.append(m.text))
            page.goto(tmp_path.as_uri(), wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            try:
                page.wait_for_function("window.__ready === undefined || window.__ready === true", timeout=20000)
            except Exception:
                # A throw in the page script never sets __ready; show why.
                for e in errors:
                    print(f"!! page: {e}")
                raise SystemExit("!! page never set window.__ready = true (see errors above)")
            page.wait_for_timeout(150)
            canvas = page.locator("#canvas")
            box = canvas.bounding_box()
            page.set_viewport_size({"width": int(box["x"] + box["width"]) + 1,
                                    "height": int(box["y"] + box["height"]) + 1})
            problems = page.evaluate(CHECK_JS)
            png_path.parent.mkdir(parents=True, exist_ok=True)
            canvas.screenshot(path=str(png_path), omit_background=transparent)
            browser.close()
    finally:
        tmp_path.unlink(missing_ok=True)
    for e in errors:
        print(f"!! page: {e}")
    for pr in problems:
        print(f"!! {pr}")
    print(f"wrote {png_path} ({int(box['width'] * scale)}×{int(box['height'] * scale)})")
    return errors + problems


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("html", type=Path)
    ap.add_argument("png", type=Path)
    ap.add_argument("--scale", type=float, default=2.0)
    ap.add_argument("--transparent", action="store_true",
                    help="keep the page's transparent areas transparent (logos, overlays)")
    a = ap.parse_args(argv)
    return 1 if render(a.html.resolve(), a.png.resolve(), a.scale, a.transparent) else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
