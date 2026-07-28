#!/usr/bin/env python3
"""Headless render for Kavi Studio designs inside Claude Code web sessions.

Only needed in the managed web/remote environment — a normal machine renders
with `bin/kavi` / `python src/render.py`. Three environment quirks are handled
here so the standard pipeline stays untouched:

  * Chromium is pre-installed at a fixed build. We point Playwright straight at
    that binary via `executable_path`, so a Playwright/browser version mismatch
    can never break the launch.
  * render-host.html loads React / ReactDOM / Babel from unpkg.com, which the
    web egress policy blocks. tools/web-setup.sh vendors those from the npm
    registry (allowed) into tools/.web-cache/vendor; we fulfil them locally.
  * Google Fonts is reachable only through the agent proxy (HTTPS_PROXY), so we
    fetch the font CSS/woff2 in-process (with the proxy CA bundle) and fulfil
    them too. Without a proxy the fonts just fall back — the render still works.

Usage:  python tools/web_render.py <design-slug> [<design-slug> ...]
Output: each design's normal render dir (content.output_dir_for, honouring
        ITIHA_OUTPUT_ROOT). Absolute paths are printed at the end.
"""
from __future__ import annotations

import asyncio
import glob
import json
import os
import ssl
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

import render as R            # noqa: E402  (reuse the repo's overlay server)
import content as content_mod  # noqa: E402
from formats import get as get_format  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402

VENDOR = Path(os.environ.get("KAVI_WEB_VENDOR", ROOT / "tools" / ".web-cache" / "vendor"))
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
CA = os.environ.get("KAVI_PROXY_CA", "/root/.ccr/ca-bundle.crt")

UNPKG = {
    "react@18.3.1/umd/react.development.js": VENDOR / "react.development.js",
    "react-dom@18.3.1/umd/react-dom.development.js": VENDOR / "react-dom.development.js",
    "@babel/standalone@7.29.0/babel.min.js": VENDOR / "babel.min.js",
}


def _chromium_path() -> str:
    hits = sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome"))
    if not hits:
        raise SystemExit("no pre-installed Chromium found under /opt/pw-browsers")
    return hits[-1]


def _make_opener():
    ctx = ssl.create_default_context(cafile=CA) if os.path.exists(CA) else ssl.create_default_context()
    handlers = [urllib.request.HTTPSHandler(context=ctx)]
    if PROXY:
        handlers.insert(0, urllib.request.ProxyHandler({"http": PROXY, "https": PROXY}))
    return urllib.request.build_opener(*handlers)


_OPENER = _make_opener()


def _fetch(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "*/*"})
    with _OPENER.open(req, timeout=30) as r:
        return r.read(), r.headers.get("content-type", "application/octet-stream")


async def _render_one(p, design: str) -> list[Path]:
    dd = ROOT / "designs" / design
    if not dd.is_dir():
        print(f"  !! no such design: {dd}")
        return []
    content = content_mod.load_content(dd)
    cb = json.dumps(content, ensure_ascii=False).encode()
    fmt = get_format(content["format"])
    n = len(content["slides"])
    outdir = content_mod.output_dir_for(dd)
    for stale in outdir.glob("*-slide.png"):
        stale.unlink(missing_ok=True)

    server, port, _ = R._serve_overlay(dd, cb, content.get("brand", "itiha"))
    url = f"http://127.0.0.1:{port}/render-host.html?capture=1"
    written: list[Path] = []
    try:
        browser = await p.chromium.launch(executable_path=_chromium_path())
        ctx = await browser.new_context(
            viewport={"width": fmt["width"], "height": fmt["height"]},
            device_scale_factor=1,
        )

        async def route_ext(route):
            u = route.request.url
            try:
                if "unpkg.com" in u:
                    for key, path in UNPKG.items():
                        if u.endswith(key):
                            await route.fulfill(
                                status=200, body=path.read_bytes(),
                                headers={"content-type": "application/javascript; charset=utf-8",
                                         "access-control-allow-origin": "*"})
                            return
                    await route.abort()
                    return
                body, ct = await asyncio.to_thread(_fetch, u)
                await route.fulfill(status=200, body=body,
                                    headers={"content-type": ct, "access-control-allow-origin": "*"})
            except Exception as e:  # noqa: BLE001 — fonts are best-effort
                print(f"  .. skipped {u[:60]} ({e})")
                await route.abort()

        await ctx.route("**/unpkg.com/**", route_ext)
        await ctx.route("**/fonts.googleapis.com/**", route_ext)
        await ctx.route("**/fonts.gstatic.com/**", route_ext)

        page = await ctx.new_page()
        page.on("pageerror", lambda e: print(f"  [pageerror] {str(e)[:200]}"))
        await page.goto(url, wait_until="networkidle")
        await page.wait_for_function(
            "() => typeof window.__setSlide === 'function' && document.querySelector('#root .itiha-slide')",
            timeout=30_000,
        )
        for i in range(n):
            await page.evaluate(f"window.__setSlide({i})")
            await page.evaluate("""async () => {
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                await document.fonts.ready;
                const imgs = Array.from(document.querySelectorAll('#root img'));
                await Promise.all(imgs.map(img => (img.complete && img.naturalWidth>0) ? null :
                    new Promise(r => { img.addEventListener('load', r); img.addEventListener('error', r); })));
            }""")
            out = outdir / f"{i + 1:02d}-slide.png"
            await page.locator("#root").screenshot(path=str(out))
            written.append(out)
        await browser.close()
    finally:
        server.shutdown()
    print(f"  {design}: {len(written)} slide(s) -> {outdir}")
    return written


async def _main(designs: list[str]) -> int:
    if not VENDOR.exists() or not any(VENDOR.iterdir()):
        raise SystemExit("vendored libs missing — run tools/web-setup.sh first")
    all_written: list[Path] = []
    async with async_playwright() as p:
        for d in designs:
            all_written += await _render_one(p, d)
    if all_written:
        print("\nrendered files:")
        for f in all_written:
            print(f" {f}")
    return 0 if all_written else 1


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python tools/web_render.py <design-slug> [<design-slug> ...]")
        raise SystemExit(2)
    raise SystemExit(asyncio.run(_main(sys.argv[1:])))
