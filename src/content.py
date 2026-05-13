"""Load a carousel from content.yaml, resolve images, emit content.json.

Image resolution rules (per slide's `image` field):
  - null/missing            → no image (layout shows a #1a1a1a fill).
  - "https://…" or "http://…" → download once, cache under images/_cache/<hash>.<ext>,
    rewrite to a path relative to the design root.
  - "filename.jpg"          → look for designs/<slug>/images/filename.jpg.

We emit a content.json next to content.yaml. It's identical in shape to the YAML
except `image` fields are rewritten to local paths the render-host can fetch.
"""

from __future__ import annotations

import hashlib
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

import yaml


class ContentError(Exception):
    pass


def _is_url(s: str) -> bool:
    return isinstance(s, str) and (s.startswith("http://") or s.startswith("https://"))


def _ext_from_url(url: str) -> str:
    path = urllib.parse.urlparse(url).path
    suffix = Path(path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        return suffix
    return ".jpg"  # default; image element doesn't care about the extension


def _download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={
        "User-Agent": "motion-graphics/0.1 (image fetcher)",
        "Accept": "image/*,*/*;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)


def resolve_image(value: str | None, design_dir: Path) -> str | None:
    """Return the page-relative path to the image, idempotent over saves.

    URLs → download to images/_cache/, return "_cache/<file>".
    Local filename → verify it exists, return bare filename (no "images/" prefix).
    Tolerate inputs that already start with "images/" (from older YAML files).
    """
    if not value:
        return None
    images_dir = design_dir / "images"
    if _is_url(value):
        cache_dir = images_dir / "_cache"
        h = hashlib.sha1(value.encode()).hexdigest()[:16]
        ext = _ext_from_url(value)
        local = cache_dir / f"{h}{ext}"
        if not local.exists():
            print(f"  fetch  {value}")
            try:
                _download(value, local)
            except Exception as e:
                raise ContentError(f"failed to download {value}: {e}")
        return f"_cache/{local.name}"

    # Tolerate either bare filename or "images/<name>"
    rel = value[len("images/"):] if value.startswith("images/") else value
    if not (images_dir / rel).exists():
        raise ContentError(
            f"image not found: {images_dir / rel}\n"
            f"  → drop the file into designs/{design_dir.name}/images/ "
            f"or use a URL"
        )
    return rel


KNOWN_LAYOUTS = {
    # Carousel layouts (1080×1350 etc.)
    "cover", "story", "split-story", "quote", "stat", "dates-grid", "closing",
    "numbered-list", "comparison", "portrait",
    "interior-light", "cta-red",
    # Standalone formats
    "quote-card",         # 1080×1080
    "reel-title",         # 1080×1920
    "youtube-thumbnail",  # 1280×720
    "end-card",           # 1920×1080
}


def load_content(design_dir: Path) -> dict:
    yaml_path = design_dir / "content.yaml"
    if not yaml_path.exists():
        raise ContentError(f"content.yaml missing in {design_dir}")
    data = yaml.safe_load(yaml_path.read_text())
    if not isinstance(data, dict):
        raise ContentError("content.yaml must be a mapping at the top level")
    slides = data.get("slides") or []
    if not isinstance(slides, list) or not slides:
        raise ContentError("content.yaml must have a non-empty `slides:` list")

    resolved_slides = []
    for i, slide in enumerate(slides):
        if not isinstance(slide, dict):
            raise ContentError(f"slide {i + 1}: must be a mapping")
        layout = slide.get("layout")
        if layout not in KNOWN_LAYOUTS:
            raise ContentError(
                f"slide {i + 1}: unknown layout {layout!r}. "
                f"known: {sorted(KNOWN_LAYOUTS)}"
            )
        out = dict(slide)
        if "image" in out:
            out["image"] = resolve_image(out["image"], design_dir)
        resolved_slides.append(out)

    from formats import get as get_format
    fmt_name = data.get("format", "instagram-portrait")
    fmt_dims = get_format(fmt_name)
    return {
        "name": data.get("name", design_dir.name),
        "format": fmt_name,
        "format_dims": {"width": fmt_dims["width"], "height": fmt_dims["height"]},
        "caption": data.get("caption", ""),
        "hashtags": data.get("hashtags", ""),
        "tweaks": data.get("tweaks", {}),
        "slides": resolved_slides,
    }


def write_content_json(content: dict, design_dir: Path) -> Path:
    out = design_dir / "content.json"
    out.write_text(json.dumps(content, indent=2, ensure_ascii=False))
    return out
