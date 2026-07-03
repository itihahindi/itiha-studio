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
                   version: str = "v1") -> tuple[ThreadingHTTPServer, int]:
    """Serve a virtual filesystem: shared/ + design's images + content.json + version.txt."""

    state = {"content": content_json_bytes, "version": version}

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

    server, port, _ = _serve_overlay(design_dir, content_bytes)
    url = f"http://127.0.0.1:{port}/render-host.html?capture=1"
    print(f"  serving on http://127.0.0.1:{port}")

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
