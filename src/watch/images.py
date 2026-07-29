"""Harvest images the source posts uploaded, at usable resolution.

X serves timeline images at `name=small` or `name=360x360`. Those are 300-400px
wide and look soft on a 1080px slide, so every URL is upgraded before download.
Two different forms, because X uses two:

  /media/<id>?format=png&name=small     → name=orig
  /amplify_video_thumb/.../img/<id>.jpg → :large suffix (query params do
                                          nothing on this path)

Nothing here decides what goes ON a slide. It downloads candidates and builds
a contact sheet, because the standing rule is to look at every image before
wiring it in: past harvests returned scanned newspapers, wrong subjects, and a
scouts-and-guides poster.
"""

from __future__ import annotations

import hashlib
import io
import re
import urllib.request
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

# Below this on the long edge an image is a thumbnail, not a source photo.
MIN_EDGE = 600

_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
)

_VIDEO_THUMB = ("/amplify_video_thumb/", "/ext_tw_video_thumb/", "/tweet_video_thumb/")


def upgrade(url: str) -> str:
    """Rewrite an X image URL to the largest form it serves."""
    if "pbs.twimg.com" not in url:
        return url

    bare = url.split("?")[0]

    if any(seg in bare for seg in _VIDEO_THUMB):
        # Video posters ignore ?name= entirely; the :size suffix is what works.
        return re.sub(r":(large|medium|small|thumb|orig)$", "", bare) + ":large"

    fmt = (parse_qs(urlsplit(url).query).get("format") or [""])[0]
    path = urlsplit(bare).path
    m = re.search(r"\.(jpg|jpeg|png|webp)$", path, re.I)
    if m and not fmt:
        fmt = m.group(1).lower()
    path = re.sub(r"\.(jpg|jpeg|png|webp)$", "", path, flags=re.I)
    return f"https://pbs.twimg.com{path}?format={fmt or 'jpg'}&name=orig"


def _fetch(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": _UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def harvest(posts: list[dict], dest: Path, *, min_edge: int = MIN_EDGE) -> list[dict]:
    """Download every image referenced by `posts` into dest/.

    Returns one record per kept image. Skips duplicates by content hash (the
    same wire photo runs on several handles) and anything below min_edge.
    """
    from PIL import Image

    dest.mkdir(parents=True, exist_ok=True)
    seen: set[str] = set()
    kept: list[dict] = []

    for p in posts:
        handle = p.get("author") or p.get("handle") or "unknown"
        for raw in p.get("images") or []:
            url = upgrade(raw)
            try:
                blob = _fetch(url)
            except Exception as exc:  # noqa: BLE001 — one bad URL must not stop the harvest
                print(f"  !! {handle}: {type(exc).__name__} on {url[:70]}")
                continue

            digest = hashlib.sha1(blob).hexdigest()[:12]
            if digest in seen:
                continue
            seen.add(digest)

            try:
                im = Image.open(io.BytesIO(blob))
                w, h = im.size
            except Exception:
                print(f"  !! {handle}: not a decodable image: {url[:70]}")
                continue

            if max(w, h) < min_edge:
                print(f"  ·  skip {w}x{h} (below {min_edge}px): {handle}")
                continue

            ext = (im.format or "JPEG").lower().replace("jpeg", "jpg")
            path = dest / f"{digest}.{ext}"
            path.write_bytes(blob)
            kept.append({
                "file": path.name,
                "path": str(path),
                "w": w, "h": h,
                "handle": handle,
                "post_url": p.get("url", ""),
                "source_url": url,
            })
            print(f"  +  {w}x{h}  {path.name}  via @{handle}")

    return kept


def contact_sheet(records: list[dict], out: Path, *, cols: int = 4, cell: int = 380) -> Path | None:
    """Grid every candidate into one PNG, numbered, for a single visual pass."""
    from PIL import Image, ImageDraw

    if not records:
        return None
    rows = (len(records) + cols - 1) // cols
    pad, label = 12, 34
    sheet = Image.new("RGB", (cols * (cell + pad) + pad,
                              rows * (cell + pad + label) + pad), (18, 18, 18))
    draw = ImageDraw.Draw(sheet)

    for i, rec in enumerate(records):
        try:
            im = Image.open(rec["path"]).convert("RGB")
        except Exception:
            continue
        im.thumbnail((cell, cell))
        x = pad + (i % cols) * (cell + pad)
        y = pad + (i // cols) * (cell + pad + label)
        sheet.paste(im, (x + (cell - im.width) // 2, y + (cell - im.height) // 2))
        draw.text((x + 4, y + cell + 8),
                  f"[{i}] {rec['w']}x{rec['h']} @{rec['handle']}"[:46],
                  fill=(210, 210, 210))

    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    return out
