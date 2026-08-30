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
import ssl
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


class _TLSTooOldError(Exception):
    """urllib couldn't negotiate a new enough TLS version for this host."""


def _is_tls_version_error(e: Exception) -> bool:
    """True for the LibreSSL-vs-TLS-1.3 handshake failure.

    macOS ships a system Python linked against LibreSSL 2.8.3, which tops out
    at TLS 1.2. A growing number of hosts now require TLS 1.3 and reject the
    ClientHello outright, which surfaces as this alert. Nothing we can set on
    an SSLContext fixes it — the library simply cannot speak 1.3.

    Servers do not agree on which alert to send when they refuse that
    ClientHello. neh.gov answers TLSV1_ALERT_INTERNAL_ERROR, others send a bare
    handshake failure, and the two originally listed here are only the most
    common. All of them are recoverable by handing the URL to curl, which links
    against a newer stack and still validates certificates, so matching the
    wider set costs nothing and rescues a render that used to die.
    """
    s = str(e)
    return any(alert in s for alert in (
        "TLSV1_ALERT_PROTOCOL_VERSION",
        "UNSUPPORTED_PROTOCOL",
        "TLSV1_ALERT_INTERNAL_ERROR",
        "SSLV3_ALERT_HANDSHAKE_FAILURE",
        "SSLV3_ALERT_ILLEGAL_PARAMETER",
    ))


def _curl_download(url: str, dest: Path) -> None:
    """Fetch via the system curl, which is linked against a newer TLS stack.

    Used only as a fallback when urllib's TLS is too old for the host. curl is
    present on macOS, on Windows 10+, and on essentially every Linux.
    """
    import shutil
    import subprocess

    curl = shutil.which("curl")
    if not curl:
        raise _TLSTooOldError("curl not found on PATH")
    dest.parent.mkdir(parents=True, exist_ok=True)
    # No shell: the URL is passed as argv. --fail turns HTTP >=400 into a
    # non-zero exit instead of writing an error page to disk.
    proc = subprocess.run(
        [curl, "--silent", "--show-error", "--fail", "--location",
         "--max-time", "30", "--user-agent", _UA,
         "--header", "Accept: image/*,*/*;q=0.8",
         "--output", str(dest), url],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        dest.unlink(missing_ok=True)
        detail = (proc.stderr or "").strip() or f"curl exit {proc.returncode}"
        raise _TLSTooOldError(detail)


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
        # HTTPError must be caught before URLError — it is a subclass, so the
        # broader clause would otherwise shadow the retry logic entirely.
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
        except urllib.error.URLError as e:
            # Retrying urllib can never clear a TLS-version mismatch, so hand
            # straight off to curl. Any other URLError propagates as before.
            if not _is_tls_version_error(e):
                raise
            print("  …TLS too old for this host; retrying via curl")
            _curl_download(url, dest)
            return
    if last_error is not None:
        raise last_error


_HTML_SIGNATURES = (b"<!doctype", b"<html", b"<!DOCTYPE", b"<HTML")


def _extract_og_image(page_url: str) -> str:
    """Fetch a web page and return its og:image URL (Instagram posts etc.)."""
    import html as _html
    import re as _re
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".html", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        _download(page_url, tmp_path)
        text = tmp_path.read_text(encoding="utf-8", errors="ignore")
    finally:
        tmp_path.unlink(missing_ok=True)
    m = _re.search(r'property="og:image"\s+content="([^"]+)"', text)
    if not m:
        raise ContentError(f"no og:image found on {page_url}")
    return _html.unescape(m.group(1))


def resolve_image(value: str | None, design_dir: Path) -> str | None:
    """Return the page-relative path to the image, idempotent over saves.

    URLs → download to images/_cache/, return "_cache/<file>".
    Instagram post/reel page links → the page's og:image is fetched instead
    (logged-out Instagram serves ~640px; drop a file in images/ for full res).
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
        host = urllib.parse.urlparse(canonical).netloc
        is_page_link = "instagram.com" in host
        ext = ".jpg" if is_page_link else _ext_from_url(canonical)
        local = cache_dir / f"{h}{ext}"
        if not local.exists():
            print(f"  fetch  {canonical}")
            try:
                target = _extract_og_image(canonical) if is_page_link else canonical
                _download(target, local)
            except ContentError:
                raise
            except _TLSTooOldError as e:
                # urllib's TLS was too old AND the curl fallback didn't work.
                # A raw handshake traceback tells the author nothing they can
                # act on, so spell out both real ways forward.
                raise ContentError(
                    f"failed to download {canonical}\n"
                    f"  → this host requires TLS 1.3, but Python here is linked "
                    f"against {ssl.OPENSSL_VERSION}, which cannot negotiate it, "
                    f"and the curl fallback failed ({e})\n"
                    f"  → save the image by hand into "
                    f"designs/{design_dir.name}/images/ and reference it by "
                    f"filename, or reinstall Python against OpenSSL 1.1.1+"
                )
            except Exception as e:
                # Degrade, don't abort. One unreachable host must not take a
                # ten-slide render down with it: warn loudly, hand the raw URL
                # back so the browser can try it directly, and let the URL
                # survive the next save instead of being silently dropped.
                # Local filenames still raise below — those are typos, not
                # network weather.
                print(f"  !!     could not fetch {canonical}: {e}")
                print(f"  !!     leaving the URL in place for the browser to load")
                return value
            if local.read_bytes()[:512].lstrip().startswith(_HTML_SIGNATURES):
                local.unlink()
                print(f"  !!     {canonical} returned a web page, not an image")
                print(f"  !!     paste a direct image URL or drop the file into images/")
                return value
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
    "cover", "story", "split-story", "quote", "stat", "roster", "dates-grid", "closing", "geo",
    "numbered-list", "comparison", "portrait", "timeline", "map", "did-you-know",
    "pie-chart", "line-graph", "bar-chart", "dynasty", "pyramid", "hierarchy", "before-after",
    "line-chart", "pictogram", "city-map",   # vaq-hq chart pack
    "document", "annotated", "sources",
    "interior-light", "cta-red", "youtube-cta",
    # Standalone formats
    "reel-title",         # 1080×1920
    "reel-frame",         # 1080×1920 — vaq-hq header panel for reposted video (src/reel.py)
    "reel-explainer",     # 1080×1920 — vaq-hq inverted reel: video top, caption panel bottom
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
        # Any string field on a slide that holds a file/URL needs to go
        # through resolve_image (so URLs download to images/_cache/ and bare
        # filenames are verified). Extend this set when a new layout
        # introduces another image-typed field.
        for field in ("image", "image_before", "image_after", "thumbnail", "author_image"):
            if field in out:
                out[field] = resolve_image(out[field], design_dir)
        resolved_slides.append(out)

    from formats import get as get_format
    from brands import BRANDS, DEFAULT_BRAND
    fmt_name = data.get("format", "instagram-portrait")
    fmt_dims = get_format(fmt_name)
    brand = data.get("brand") or DEFAULT_BRAND
    if brand not in BRANDS:
        raise ContentError(f"unknown brand {brand!r}. known: {sorted(BRANDS)}")
    out = {
        "name": data.get("name", design_dir.name),
        "brand": brand,
        "format": fmt_name,
        "format_dims": {"width": fmt_dims["width"], "height": fmt_dims["height"]},
        "caption": data.get("caption", ""),
        "hashtags": data.get("hashtags", ""),
        "tweaks": data.get("tweaks", {}),
        "slides": resolved_slides,
    }
    # The save endpoint writes back exactly what the editor posts, and the
    # editor's state is hydrated from this dict — any top-level key omitted
    # here is silently dropped from content.yaml on the next save. So keys
    # like notion_page_id must round-trip through content.json.
    if data.get("notion_page_id"):
        out["notion_page_id"] = str(data["notion_page_id"])
    if isinstance(data.get("ig_published"), dict):
        out["ig_published"] = data["ig_published"]
    return out


def write_content_json(content: dict, design_dir: Path) -> Path:
    out = design_dir / "content.json"
    out.write_text(json.dumps(content, indent=2, ensure_ascii=False))
    return out
