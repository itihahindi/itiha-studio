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
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import yaml


# Wikimedia (and some other CDNs) enforces a strict User-Agent policy and
# returns HTTP 429 for generic UAs. Identify the tool + provide contact info
# per https://meta.wikimedia.org/wiki/User-Agent_policy
_UA = "ItihaStudio/0.1 (https://github.com/itihahindi/itiha-studio; itihahindi@gmail.com)"


def output_root() -> Path:
    """Where rendered PNGs live. Default: ~/Instagram Itiha Renders (outside repo).
    Override with the ITIHA_OUTPUT_ROOT env var."""
    raw = os.environ.get("ITIHA_OUTPUT_ROOT", "~/Instagram Itiha Renders")
    return Path(raw).expanduser().resolve()


def designs_root() -> Path:
    """Where per-project folders (content.yaml + images/) live.
    Defaults to <repo>/designs. Override via ITIHA_DESIGNS_ROOT — needed in
    cloud deploys where /designs must live on a persistent volume."""
    raw = os.environ.get("ITIHA_DESIGNS_ROOT")
    if raw:
        return Path(raw).expanduser().resolve()
    return Path(__file__).resolve().parents[1] / "designs"


def output_dir_for(design_dir: Path) -> Path:
    """Return (and create) the per-design render directory."""
    out = output_root() / design_dir.name
    out.mkdir(parents=True, exist_ok=True)
    return out


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


# Query parameters that don't change the image content — strip before caching
# so the same image fetched via different links dedupes in _cache/.
_NOISE_PARAMS = {"utm_source", "utm_medium", "utm_campaign", "utm_content",
                 "utm_term", "fbclid", "gclid", "ref_src", "ref"}


def _canonical_url(url: str) -> str:
    parts = urllib.parse.urlparse(url)
    if not parts.query:
        return url
    kept = [(k, v) for k, v in urllib.parse.parse_qsl(parts.query, keep_blank_values=True)
            if k not in _NOISE_PARAMS]
    new_query = urllib.parse.urlencode(kept)
    return urllib.parse.urlunparse(parts._replace(query=new_query))


def _download(url: str, dest: Path) -> None:
    """GET `url` and write the body to `dest`. Retries 429/503 with backoff."""
    headers = {
        "User-Agent": _UA,
        "Accept": "image/*,*/*;q=0.8",
    }
    last_error: Exception | None = None
    for attempt in range(3):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            return
        except urllib.error.HTTPError as e:
            last_error = e
            # Honor Retry-After when the server provides one; otherwise back off
            # exponentially. Only retry transient codes.
            if e.code in (429, 503) and attempt < 2:
                ra = e.headers.get("Retry-After") if e.headers else None
                try:
                    wait = max(1, int(ra)) if ra else (attempt + 1) * 2
                except ValueError:
                    wait = (attempt + 1) * 2
                print(f"  …{e.code}; retrying in {wait}s")
                time.sleep(wait)
                continue
            raise
    if last_error is not None:
        raise last_error


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
        canonical = _canonical_url(value)
        h = hashlib.sha1(canonical.encode()).hexdigest()[:16]
        ext = _ext_from_url(canonical)
        local = cache_dir / f"{h}{ext}"
        if not local.exists():
            print(f"  fetch  {canonical}")
            try:
                _download(canonical, local)
            except Exception as e:
                raise ContentError(f"failed to download {canonical}: {e}")
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
    "numbered-list", "comparison", "portrait", "timeline", "map", "did-you-know",
    "pie-chart", "line-graph", "bar-chart", "dynasty", "before-after",
    "document", "annotated", "sources",
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
