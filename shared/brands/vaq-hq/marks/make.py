"""VAQ HQ marks in the VAQ POSTER look (Tanker; haldi / coal), for Instagram and YouTube.

    ./.venv/bin/python shared/brands/vaq-hq/marks/make.py

Writes one HTML page per asset next to this file and renders each to
~/Instagram Itiha Renders/vaq-brand-marks/ (or $ITIHA_OUTPUT_ROOT) at exact
platform pixel sizes. Tanker and Switzer are Indian Type Foundry fonts from
Fontshare (ITF Free Font License: free for commercial use; read the licence
text before registering the mark as a trademark).
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
OUT = Path(os.environ.get("ITIHA_OUTPUT_ROOT", Path.home() / "Instagram Itiha Renders")) / "vaq-brand-marks"
RENDER = REPO / ".claude/skills/data-infographic/render.py"
PY = REPO / ".venv/bin/python"

GROUNDS = {
    # page, VAQ letters, slab, letters on the slab
    "haldi": ("#FFD23F", "#111111", "#111111", "#FFD23F"),
    "coal": ("#111111", "#FFF8E7", "#FFD23F", "#111111"),
}
TAGLINE = "Politics, decoded."

HEAD = """<!doctype html><html><head><meta charset="utf-8">
<style>
@import url('https://api.fontshare.com/v2/css?f[]=tanker@400&f[]=switzer@600,700,800&display=block');
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: transparent; }
#canvas { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;
  font-family: 'Tanker', 'Arial Narrow', sans-serif; text-transform: uppercase; }
.vaq { line-height: .8; letter-spacing: -.01em; }
/* A logo is one line, so the slab is a real box around the letters (tail of
   the Q included), not the cap-height strip the multi-line headlines use. */
.hq { display: inline-block; line-height: 1; padding: .04em .1em .1em; background: var(--slab); }
.tag { font-family: 'Switzer', sans-serif; font-weight: 800; text-transform: none; letter-spacing: -.01em; }
</style></head><body>
"""


def page(name: str, w: int, h: int, body: str, bg: str = "transparent") -> Path:
    p = HERE / f"{name}.html"
    p.write_text(HEAD + f'<div id="canvas" style="width:{w}px;height:{h}px;background:{bg}">{body}</div>'
                 + "<script>document.fonts.ready.then(()=>{window.__ready=true});window.__ready=false;</script>"
                 + "</body></html>")
    return p


def lockup_stacked(size: int, ground: str) -> str:
    """VAQ over a slabbed HQ: for round profile crops."""
    _, ink, slab, on = GROUNDS[ground]
    return (f'<div style="display:flex;flex-direction:column;align-items:center;gap:{int(size * .07)}px">'
            f'<div class="vaq" style="font-size:{size}px;color:{ink}">VAQ</div>'
            f'<div class="hq" style="font-size:{int(size * .56)}px;color:{on};--slab:{slab}">HQ</div></div>')


def lockup_row(size: int, ground: str, tagline: bool = False) -> str:
    """VAQ  HQ on one line, optional tagline under it: banners, overlays."""
    _, ink, slab, on = GROUNDS[ground]
    tag = (f'<div class="tag" style="font-size:{int(size * .2)}px;color:{ink};margin-top:{int(size * .08)}px">'
           f'{TAGLINE}</div>') if tagline else ""
    return (f'<div style="display:flex;flex-direction:column;align-items:center">'
            f'<div style="display:flex;align-items:center;gap:{int(size * .12)}px">'
            f'<span class="vaq" style="font-size:{size}px;color:{ink}">VAQ</span>'
            f'<span class="hq" style="font-size:{size}px;color:{on};--slab:{slab}">HQ</span></div>{tag}</div>')


def ghost(ground: str, w: int, h: int) -> str:
    """Huge cropped VAQ behind the banner's safe area: shows on TV / desktop only."""
    _, ink, _, _ = GROUNDS[ground]
    return (f'<div class="vaq" data-bleed style="position:absolute;left:-{int(w * .03)}px;top:50%;transform:translateY(-52%);'
            f'font-size:{int(h * 1.25)}px;color:{ink};opacity:.07;white-space:nowrap">VAQ VAQ</div>')


ASSETS = []
for g, (bg, *_rest) in GROUNDS.items():
    # Instagram profile: uploaded square, shown as a circle (~110 px on phones). Keep the
    # lockup inside the inscribed circle.
    ASSETS.append((f"instagram-profile-{g}", 1080, 1080, lockup_stacked(480, g), bg, False))
    # YouTube profile: 800×800, shown as a circle.
    ASSETS.append((f"youtube-profile-{g}", 800, 800, lockup_stacked(355, g), bg, False))
    # YouTube banner: 2560×1440; only the centre 1546×423 shows on every device.
    ASSETS.append((f"youtube-banner-{g}", 2560, 1440, ghost(g, 2560, 1440) + lockup_row(262, g, True), bg, False))
    # Transparent wordmark for overlays (reels, thumbnails): ink chosen to sit on the
    # opposite ground, so 'haldi' = for light backgrounds, 'coal' = for dark ones.
    ASSETS.append((f"wordmark-for-{'light' if g == 'haldi' else 'dark'}-bg", 1400, 460, lockup_row(300, g), "transparent", True))
# YouTube watermark (video branding, shown small in a corner): a solid haldi badge reads
# on any footage, where a transparent mark would vanish on busy frames.
ASSETS.append(("youtube-watermark", 300, 300, lockup_stacked(130, "haldi"), "#FFD23F", False))

OUT.mkdir(parents=True, exist_ok=True)
bad = 0
for name, w, h, body, bg, transparent in ASSETS:
    p = page(name, w, h, body, bg)
    cmd = [str(PY), str(RENDER), str(p), str(OUT / f"{name}.png"), "--scale", "1"] + (["--transparent"] if transparent else [])
    r = subprocess.run(cmd, capture_output=True, text=True)
    lines = [l for l in (r.stdout + r.stderr).splitlines() if l.strip()]
    print(f"{name:32s} {w}×{h}  " + (lines[-1] if lines else ""))
    bad += any(l.startswith("!!") for l in lines)
print(f"\n{len(ASSETS)} marks in {OUT}")
sys.exit(1 if bad else 0)
