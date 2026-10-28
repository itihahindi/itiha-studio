"""The outbox: finished posts made outside the editor, waiting to go out.

Hand-built pieces (HyperFrames reels, infographics, maps) don't live in designs/,
so the studio home page had no way to show them. Each one gets a folder:

    <outbox>/<slug>/post.yaml      title, brand, caption, hashtags, status, ...
    <outbox>/<slug>/<media files>  PNG / JPG / MP4, posted in `media:` order

<outbox> defaults to `<renders root>/_outbox` and can be moved with KAVI_OUTBOX
in .env (e.g. into iCloud Drive, so the phone sees the files when posting).

post.yaml:

    title: Bullet train, from 508 km to 4,500 km
    brand: vaq-hq                  # brands.py slug
    kind: image                    # image | carousel | reel
    media: [map-haldi.png]         # optional; default = every media file, sorted
    caption: |
      ...
    hashtags: '#VaqHQ #BulletTrain'
    status: ready                  # ready | posted
    made: 2026-10-28
    post_by: 2026-11-04            # optional: news that goes stale
    posted_at:                     # set by Mark posted
    source: infographics/india-bullet-train-map/page.html
    notes: ...
"""

from __future__ import annotations

import datetime as dt
import os
import re
from pathlib import Path

import yaml

import content as content_mod

MEDIA_EXT = {".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mov"}
VIDEO_EXT = {".mp4", ".mov"}
STATUSES = ("ready", "posted")


def outbox_root() -> Path:
    raw = os.environ.get("KAVI_OUTBOX")
    root = Path(raw).expanduser().resolve() if raw else content_mod.output_root() / "_outbox"
    root.mkdir(parents=True, exist_ok=True)
    return root


def post_dir(slug: str) -> Path:
    """Resolve a post folder, refusing anything that escapes the outbox."""
    if not slug or "/" in slug or "\\" in slug or slug.startswith("."):
        raise ValueError(f"invalid outbox slug: {slug!r}")
    root = outbox_root()
    d = (root / slug).resolve()
    if d.parent != root or not (d / "post.yaml").is_file():
        raise FileNotFoundError(f"no such outbox post: {slug}")
    return d


def _date(v) -> str | None:
    if v in (None, ""):
        return None
    return v.isoformat() if isinstance(v, (dt.date, dt.datetime)) else str(v)


def _read(d: Path) -> dict:
    try:
        data = yaml.safe_load((d / "post.yaml").read_text()) or {}
    except yaml.YAMLError as e:
        return {"slug": d.name, "title": d.name, "error": f"post.yaml: {e}", "media": [], "status": "ready"}
    files = sorted(f.name for f in d.iterdir() if f.suffix.lower() in MEDIA_EXT and not f.name.startswith("."))
    media = [m for m in (data.get("media") or files) if (d / m).is_file()]
    post_by = _date(data.get("post_by"))
    status = data.get("status") if data.get("status") in STATUSES else "ready"
    return {
        "slug": d.name,
        "title": data.get("title") or d.name,
        "brand": data.get("brand") or "vaq-hq",
        "kind": data.get("kind") or ("reel" if media and Path(media[0]).suffix.lower() in VIDEO_EXT
                                     else "carousel" if len(media) > 1 else "image"),
        "media": [{"name": m, "video": Path(m).suffix.lower() in VIDEO_EXT} for m in media],
        "caption": (data.get("caption") or "").strip(),
        "hashtags": (data.get("hashtags") or "").strip(),
        "status": status,
        "made": _date(data.get("made")),
        "post_by": post_by,
        "stale": bool(post_by and status == "ready" and post_by < dt.date.today().isoformat()),
        "posted_at": _date(data.get("posted_at")),
        "source": data.get("source") or "",
        "notes": (data.get("notes") or "").strip(),
    }


def list_posts() -> list[dict]:
    """Ready posts first (soonest post_by, then newest), then posted (newest first)."""
    posts = [_read(d) for d in outbox_root().iterdir() if d.is_dir() and (d / "post.yaml").is_file()]
    ready = sorted((p for p in posts if p["status"] == "ready"),
                   key=lambda p: (p["post_by"] or "9999", "~" if not p["made"] else _neg(p["made"])))
    posted = sorted((p for p in posts if p["status"] == "posted"),
                    key=lambda p: p["posted_at"] or "", reverse=True)
    return ready + posted


def _neg(iso: str) -> str:
    # newest first inside the ascending sort: invert each digit
    return "".join(chr(ord("9") - ord(c) + ord("0")) if c.isdigit() else c for c in iso)


def set_status(slug: str, status: str) -> dict:
    """Flip ready <-> posted by editing the two lines in place, so the hand-written
    caption block keeps its formatting (a yaml round-trip would re-flow it)."""
    if status not in STATUSES:
        raise ValueError(f"status must be one of {STATUSES}")
    d = post_dir(slug)
    path = d / "post.yaml"
    text = path.read_text()
    stamp = dt.date.today().isoformat() if status == "posted" else ""

    def put(text: str, key: str, value: str) -> str:
        line = f"{key}: {value}".rstrip()
        pat = re.compile(rf"^{key}:.*$", re.M)
        if pat.search(text):
            return pat.sub(line, text, count=1)
        return text.rstrip("\n") + "\n" + line + "\n"

    text = put(text, "status", status)
    text = put(text, "posted_at", stamp)
    path.write_text(text)
    return _read(d)
