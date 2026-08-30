"""Publish a rendered design to Instagram via the official Graph API.

Required env vars (see docs/INSTAGRAM_SETUP.md):
  IG_USER_ID         — Instagram professional-account numeric ID
  IG_ACCESS_TOKEN    — long-lived access token with content-publish permission
  IMAGE_HOST         — "cloudinary" (default) | "tunnel" | "notion"

Per-brand overrides: IG_USER_ID_VAQ_HQ / IG_ACCESS_TOKEN_VAQ_HQ etc. (brand slug
uppercased, dashes → underscores) fall back to the plain names.

Instagram fetches media from public URLs; it never accepts raw bytes. Images
must be JPEG. So the flow is:

  Carousel / single image (any format except reel/story):
    1. Convert the rendered *-slide.png files to JPEG (ig-jpg/ next to them).
    2. Host each JPEG at a public URL (Cloudinary by default).
    3. POST {ig-user-id}/media         is_carousel_item=true, image_url=…  → child container
    4. POST {ig-user-id}/media         media_type=CAROUSEL, children=…     → parent container
       (a single-slide design skips 3/4 and makes one plain image container)
    5. POST {ig-user-id}/media_publish creation_id=…                       → live post

  Reel (format instagram-reel, after Compose Reel produced reel.mp4):
    1. Transcode reel.mp4 to a publish copy (ig-video/reel-ig.mp4): H.264 yuv420p,
       AAC, faststart, capped bitrate so it stays under Cloudinary's 100 MB
       free-tier limit. Instagram re-encodes on its side anyway.
    2. Host the copy (Cloudinary video upload) and slide 1 as the cover JPEG.
    3. POST {ig-user-id}/media         media_type=REELS, video_url=…, cover_url=…
    4. Poll the container until FINISHED (video processing takes 30s–5min).
    5. POST {ig-user-id}/media_publish creation_id=…

After a successful publish the post id / permalink / time are stamped into the
design's content.yaml under `ig_published:` so the editor can show it and warn
before re-posting.

Token flavors: tokens starting with "EAA" are Facebook-login flavored and go to
graph.facebook.com; anything else is assumed Instagram-login flavored and goes
to graph.instagram.com. Override with IG_GRAPH_HOST if the guess is wrong.
Instagram-login tokens expire after 60 days; `--refresh-token` renews one and
publish_design refreshes automatically once the stored token is 30+ days old.
"""

from __future__ import annotations

import datetime as _dt
import os
import re
import subprocess
import time
import urllib.parse
from pathlib import Path

import requests
import yaml

import content as content_mod
import notion_sync

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"

IG_API_VERSION = os.environ.get("IG_API_VERSION", "v23.0")
MAX_IMAGE_BYTES = 8 * 1024 * 1024        # Instagram's per-image cap
MAX_VIDEO_BYTES = 95 * 1024 * 1024       # Cloudinary free tier: 100 MB per video
AUTO_REFRESH_AFTER_DAYS = 30             # refresh on publish once the token is this old
VIDEO_FORMATS = {"instagram-reel", "instagram-story"}


# ── env / Graph helpers ────────────────────────────────────────

def _suffix(brand: str) -> str:
    return brand.upper().replace("-", "_")


def _env_for_brand(key: str, brand: str) -> str:
    return (os.environ.get(f"{key}_{_suffix(brand)}") or os.environ.get(key, "")).strip()


def _env_key_for_brand(key: str, brand: str) -> str:
    """The .env key that actually holds this brand's value (brand-specific if set)."""
    specific = f"{key}_{_suffix(brand)}"
    return specific if os.environ.get(specific, "").strip() else key


def _env_set(key: str, value: str) -> None:
    """Set KEY=value in .env in place (replace the line or append), and in os.environ."""
    lines = ENV_PATH.read_text().splitlines(keepends=True) if ENV_PATH.exists() else []
    pat = re.compile(rf"^{re.escape(key)}=")
    done = False
    for i, ln in enumerate(lines):
        if pat.match(ln):
            lines[i] = f"{key}={value}\n"
            done = True
            break
    if not done:
        if lines and not lines[-1].endswith("\n"):
            lines[-1] += "\n"
        lines.append(f"{key}={value}\n")
    ENV_PATH.write_text("".join(lines))
    os.environ[key] = value


def _graph_base(token: str) -> str:
    host = os.environ.get("IG_GRAPH_HOST", "").strip()
    if not host:
        host = "graph.facebook.com" if token.startswith("EAA") else "graph.instagram.com"
    return f"https://{host}/{IG_API_VERSION}"


def _graph(method: str, url: str, params: dict, timeout: int = 60) -> dict:
    r = requests.request(method, url, params=params if method == "GET" else None,
                         data=None if method == "GET" else params, timeout=timeout)
    if not r.ok:
        raise RuntimeError(f"Graph API {r.status_code} on {url.split('?')[0]}: {r.text[:600]}")
    return r.json()


def _creds(brand: str) -> tuple[str, str]:
    ig_user = _env_for_brand("IG_USER_ID", brand)
    token = _env_for_brand("IG_ACCESS_TOKEN", brand)
    if not ig_user or not token:
        key = _suffix(brand)
        raise RuntimeError(
            f"IG_USER_ID_{key} / IG_ACCESS_TOKEN_{key} (or the plain IG_USER_ID / "
            "IG_ACCESS_TOKEN) not set in .env — see docs/INSTAGRAM_SETUP.md."
        )
    return ig_user, token


# ── account / token maintenance ────────────────────────────────

def whoami(brand: str) -> dict:
    """Which account does this brand's token publish to? First test after setup."""
    ig_user, token = _creds(brand)
    base = _graph_base(token)
    r = _graph("GET", f"{base}/{ig_user}",
               {"fields": "id,username,account_type,media_count,followers_count",
                "access_token": token})
    r["brand"] = brand
    r["graph_host"] = base
    return r


def publishing_quota(brand: str) -> dict:
    """Instagram allows 25 API-published posts per rolling 24h per account."""
    ig_user, token = _creds(brand)
    base = _graph_base(token)
    r = _graph("GET", f"{base}/{ig_user}/content_publishing_limit",
               {"fields": "quota_usage,config", "access_token": token})
    data = (r.get("data") or [{}])[0]
    return {"used": data.get("quota_usage"),
            "total": (data.get("config") or {}).get("quota_total", 25)}


def refresh_token(brand: str, log=print) -> dict:
    """Renew an Instagram-login long-lived token (valid 60 days; refreshable after 24h)."""
    _, token = _creds(brand)
    if token.startswith("EAA"):
        raise RuntimeError("Facebook-login (EAA…) Page tokens don't expire — nothing to refresh.")
    r = requests.get("https://graph.instagram.com/refresh_access_token",
                     params={"grant_type": "ig_refresh_token", "access_token": token},
                     timeout=30)
    if not r.ok:
        raise RuntimeError(f"refresh failed {r.status_code}: {r.text[:400]}")
    data = r.json()
    new_token = data["access_token"]
    today = _dt.date.today().isoformat()
    _env_set(_env_key_for_brand("IG_ACCESS_TOKEN", brand), new_token)
    _env_set(f"IG_TOKEN_REFRESHED_{_suffix(brand)}", today)
    days = int(data.get("expires_in", 0)) // 86400
    log(f"  token for {brand} refreshed — valid ~{days} days (stamped {today})")
    return {"brand": brand, "expires_in_days": days, "refreshed": today}


def _token_age_days(brand: str) -> int | None:
    stamp = os.environ.get(f"IG_TOKEN_REFRESHED_{_suffix(brand)}", "").strip()
    if not stamp:
        return None
    try:
        return (_dt.date.today() - _dt.date.fromisoformat(stamp)).days
    except ValueError:
        return None


def _maybe_auto_refresh(brand: str, log=print) -> None:
    """Piggyback token renewal on manual publishes so no scheduler is needed.
    A token untouched for 60 days dies; refreshing every 30+ days on publish
    keeps it alive for anyone posting at least monthly."""
    _, token = _creds(brand)
    if token.startswith("EAA"):
        return
    age = _token_age_days(brand)
    if age is not None and age < AUTO_REFRESH_AFTER_DAYS:
        return
    try:
        refresh_token(brand, log=log)
    except Exception as e:  # a <24h-old token refuses to refresh — harmless
        log(f"  (token auto-refresh skipped: {e})")
        if age is None:
            _env_set(f"IG_TOKEN_REFRESHED_{_suffix(brand)}", _dt.date.today().isoformat())


# ── step 1: PNG → JPEG ─────────────────────────────────────────

def _to_jpegs(pngs: list[Path], out_dir: Path, log=print) -> list[Path]:
    from PIL import Image

    out_dir.mkdir(parents=True, exist_ok=True)
    jpegs = []
    for png in pngs:
        dst = out_dir / (png.stem + ".jpg")
        img = Image.open(png).convert("RGB")
        for quality in (90, 78):
            img.save(dst, "JPEG", quality=quality, optimize=True)
            if dst.stat().st_size <= MAX_IMAGE_BYTES:
                break
        jpegs.append(dst)
    log(f"  converted {len(jpegs)} slide(s) to JPEG")
    return jpegs


def _check_feed_ratio(png: Path) -> None:
    """Feed posts accept 4:5 (0.8) through 1.91:1; anything taller is rejected."""
    from PIL import Image

    w, h = Image.open(png).size
    ratio = w / h
    if ratio < 0.79 or ratio > 1.92:
        raise RuntimeError(
            f"{png.name} is {w}×{h} ({ratio:.2f}:1) — Instagram feed only takes 4:5 to 1.91:1. "
            "A 9:16 design publishes as a reel: run Compose Reel first, then Post Reel."
        )


# ── step 1b: reel.mp4 → publish copy ───────────────────────────

def _reel_publish_copy(src: Path, out_dir: Path, log=print) -> Path:
    """Normalise the composed reel for upload: H.264 yuv420p + AAC + faststart,
    bitrate-capped so it stays under Cloudinary's free-tier 100 MB."""
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / "reel-ig.mp4"
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime \
            and dst.stat().st_size <= MAX_VIDEO_BYTES:
        log(f"  publish copy up to date ({dst.stat().st_size // 1_000_000} MB)")
        return dst
    for crf, maxrate in (("23", "6M"), ("26", "4M")):
        log(f"  transcoding publish copy (crf {crf}, cap {maxrate})…")
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-i", str(src),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", crf,
            "-maxrate", maxrate, "-bufsize", "12M", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(dst),
        ], check=True)
        if dst.stat().st_size <= MAX_VIDEO_BYTES:
            break
    if dst.stat().st_size > MAX_VIDEO_BYTES:
        raise RuntimeError(f"publish copy is still {dst.stat().st_size // 1_000_000} MB "
                           f"(> {MAX_VIDEO_BYTES // 1_000_000} MB) — shorten the reel.")
    log(f"  publish copy {dst.stat().st_size // 1_000_000} MB")
    return dst


# ── step 2, host = notion (kept, but off by user decision) ─────

def _notion_upload(path: Path) -> str:
    """Upload a file to Notion-managed storage, return the file_upload id."""
    r1 = requests.post(
        f"{notion_sync.NOTION_API}/file_uploads",
        json={"filename": path.name, "content_type": "image/jpeg"},
        headers=notion_sync._headers(), timeout=30,
    )
    r1.raise_for_status()
    upload = r1.json()
    with open(path, "rb") as f:
        r2 = requests.post(
            upload["upload_url"],
            headers={
                "Authorization": f"Bearer {notion_sync.NOTION_TOKEN}",
                "Notion-Version": notion_sync.NOTION_VERSION,
            },
            files={"file": (path.name, f, "image/jpeg")}, timeout=120,
        )
    r2.raise_for_status()
    return upload["id"]


def _notion_create_page(title: str) -> str:
    """Create a row in the content-plan DB, return its page id."""
    props = {"Post": {"title": [{"text": {"content": title}}]}}
    r = requests.post(
        f"{notion_sync.NOTION_API}/pages",
        json={"parent": {"database_id": notion_sync.NOTION_DB_ID}, "properties": props},
        headers=notion_sync._headers(), timeout=30,
    )
    if r.status_code in (400, 404):
        # DB id might be a data-source UUID (multi-source DBs) — retry that flavor.
        r = requests.post(
            f"{notion_sync.NOTION_API}/pages",
            json={"parent": {"type": "data_source_id", "data_source_id": notion_sync.NOTION_DB_ID},
                  "properties": props},
            headers=notion_sync._headers(), timeout=30,
        )
    r.raise_for_status()
    return r.json()["id"]


def _notion_attach_blocks(page_id: str, upload_ids: list[str]) -> list[str]:
    """Attach uploads as image blocks on the page; return the new block ids."""
    children = [
        {"object": "block", "type": "image",
         "image": {"type": "file_upload", "file_upload": {"id": uid}}}
        for uid in upload_ids
    ]
    r = requests.patch(
        f"{notion_sync.NOTION_API}/blocks/{page_id}/children",
        json={"children": children},
        headers=notion_sync._headers(), timeout=60,
    )
    r.raise_for_status()
    return [b["id"] for b in r.json().get("results", [])]


def _notion_block_url(block_id: str) -> str:
    """Fresh signed download URL for an attached image block (~1h validity)."""
    r = requests.get(
        f"{notion_sync.NOTION_API}/blocks/{block_id}",
        headers=notion_sync._headers(), timeout=30,
    )
    r.raise_for_status()
    image = r.json().get("image", {})
    url = (image.get("file") or {}).get("url") or (image.get("external") or {}).get("url")
    if not url:
        raise RuntimeError(f"Notion block {block_id} has no downloadable file URL yet")
    return url


def _insert_top_level(design_dir: Path, key: str, block: str) -> None:
    """Textually replace-or-insert a top-level `key:` block right after `name:`,
    leaving the rest of the hand-formatted YAML untouched."""
    yaml_path = design_dir / "content.yaml"
    lines = yaml_path.read_text().splitlines(keepends=True)
    # drop an existing block: the key line plus any indented continuation lines
    out, skipping = [], False
    for ln in lines:
        if ln.startswith(f"{key}:"):
            skipping = True
            continue
        if skipping and (ln.startswith(" ") or ln.startswith("\t")):
            continue
        skipping = False
        out.append(ln)
    for i, ln in enumerate(out):
        if ln.startswith("name:"):
            out.insert(i + 1, block if block.endswith("\n") else block + "\n")
            break
    else:
        out.insert(0, block if block.endswith("\n") else block + "\n")
    yaml_path.write_text("".join(out))


def _stamp_notion_page_id(design_dir: Path, page_id: str) -> None:
    if "notion_page_id:" in (design_dir / "content.yaml").read_text():
        return
    _insert_top_level(design_dir, "notion_page_id", f"notion_page_id: {page_id}\n")


def _host_via_notion(jpegs: list[Path], design_dir: Path, config: dict, log=print) -> list[str]:
    if not notion_sync.is_configured():
        raise RuntimeError("IMAGE_HOST=notion needs NOTION_TOKEN + NOTION_DB_ID in .env")
    page_id = str(config.get("notion_page_id") or "").strip()
    if not page_id:
        title = config.get("name") or design_dir.name
        page_id = _notion_create_page(str(title))
        _stamp_notion_page_id(design_dir, page_id)
        log(f"  created Notion row for {title!r}")
    log(f"  uploading {len(jpegs)} JPEG(s) to Notion…")
    upload_ids = [_notion_upload(j) for j in jpegs]
    block_ids = _notion_attach_blocks(page_id, upload_ids)
    if len(block_ids) != len(jpegs):
        raise RuntimeError(f"attached {len(block_ids)} blocks for {len(jpegs)} uploads")
    return [_notion_block_url(b) for b in block_ids]


# ── step 2: hosting (cloudinary default) ───────────────────────

def _cloudinary_conf() -> tuple[str, str]:
    name = os.environ.get("CLOUDINARY_CLOUD_NAME", "").strip()
    preset = os.environ.get("CLOUDINARY_UPLOAD_PRESET", "").strip()
    if not name or not preset:
        raise RuntimeError(
            "CLOUDINARY_CLOUD_NAME / CLOUDINARY_UPLOAD_PRESET not set in .env — "
            "see docs/INSTAGRAM_SETUP.md Part B (free, ~5 min)."
        )
    return name, preset


def _upload_cloudinary(path: Path, resource_type: str = "image") -> str:
    name, preset = _cloudinary_conf()
    mime = "video/mp4" if resource_type == "video" else "image/jpeg"
    with open(path, "rb") as f:
        r = requests.post(
            f"https://api.cloudinary.com/v1_1/{name}/{resource_type}/upload",
            data={"upload_preset": preset},
            files={"file": (path.name, f, mime)},
            timeout=600 if resource_type == "video" else 120,
        )
    if not r.ok:
        raise RuntimeError(f"Cloudinary {r.status_code}: {r.text[:400]}")
    return r.json()["secure_url"]


def _tunnel_url(path: Path) -> str:
    base = os.environ["TUNNEL_PUBLIC_URL"].rstrip("/")
    return f"{base}/{urllib.parse.quote(path.parent.name)}/{urllib.parse.quote(path.name)}"


def _public_urls(jpegs: list[Path], design_dir: Path, config: dict, log=print) -> list[str]:
    host = os.environ.get("IMAGE_HOST", "cloudinary").lower()
    if host == "cloudinary":
        log(f"  uploading {len(jpegs)} JPEG(s) to Cloudinary…")
        return [_upload_cloudinary(j) for j in jpegs]
    if host == "notion":
        return _host_via_notion(jpegs, design_dir, config, log)
    if host == "tunnel":
        return [_tunnel_url(j) for j in jpegs]
    raise RuntimeError(f"Unknown IMAGE_HOST: {host!r}")


def _public_video_url(video: Path, log=print) -> str:
    host = os.environ.get("IMAGE_HOST", "cloudinary").lower()
    if host == "cloudinary":
        log(f"  uploading {video.name} ({video.stat().st_size // 1_000_000} MB) to Cloudinary…")
        return _upload_cloudinary(video, resource_type="video")
    if host == "tunnel":
        return _tunnel_url(video)
    raise RuntimeError(f"IMAGE_HOST={host!r} cannot host video — use cloudinary or tunnel.")


# ── steps 3–5: containers + publish ────────────────────────────

def _wait_finished(base: str, container_id: str, token: str, timeout: int = 120,
                   log=print) -> None:
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        r = _graph("GET", f"{base}/{container_id}",
                   {"fields": "status_code,status", "access_token": token})
        status = r.get("status_code")
        if status == "FINISHED":
            return
        if status == "ERROR":
            raise RuntimeError(f"Container {container_id} status ERROR: {r.get('status') or r}")
        if status != last:
            log(f"  container {status or '…'}")
            last = status
        time.sleep(3 if timeout > 120 else 1.5)
    raise TimeoutError(f"Container {container_id} did not finish within {timeout}s")


def _publish_container(base: str, ig_user: str, token: str, creation_id: str) -> str:
    return _graph("POST", f"{base}/{ig_user}/media_publish",
                  {"creation_id": creation_id, "access_token": token})["id"]


def _permalink(base: str, post_id: str, token: str) -> str | None:
    try:
        return _graph("GET", f"{base}/{post_id}",
                      {"fields": "permalink", "access_token": token}).get("permalink")
    except Exception:
        return None  # cosmetic — the post is live either way


def _stamp_published(design_dir: Path, record: dict) -> None:
    body = yaml.safe_dump({k: v for k, v in record.items() if v is not None},
                          default_flow_style=False, allow_unicode=True, sort_keys=False)
    block = "ig_published:\n" + "".join(f"  {ln}\n" for ln in body.splitlines())
    _insert_top_level(design_dir, "ig_published", block)


def _caption_for(config: dict) -> str:
    caption = (config.get("caption") or "").rstrip()
    hashtags = (config.get("hashtags") or "").strip()
    if hashtags:
        caption = f"{caption}\n\n{hashtags}" if caption else hashtags
    return caption


def publish_design(design_dir: Path, dry_run: bool = False, log=print,
                   kind: str | None = None) -> dict:
    """kind: None (auto: reel for reel/story formats with a composed reel.mp4,
    otherwise image/carousel) | "image" | "reel"."""
    yaml_path = design_dir / "content.yaml"
    if not yaml_path.exists():
        raise RuntimeError(f"No content.yaml in {design_dir}")
    config = yaml.safe_load(yaml_path.read_text()) or {}
    brand = str(config.get("brand") or "itiha")
    fmt = str(config.get("format") or "instagram-portrait")
    output_dir = content_mod.output_dir_for(design_dir)

    if kind is None:
        kind = "reel" if fmt in VIDEO_FORMATS else "image"

    ig_user = token = base = None
    if not dry_run:
        ig_user, token = _creds(brand)
        _maybe_auto_refresh(brand, log=log)
        _, token = _creds(brand)          # re-read: refresh may have rotated it
        base = _graph_base(token)
        try:
            q = publishing_quota(brand)
            log(f"  quota: {q['used']}/{q['total']} API posts used in the last 24h")
            if q["used"] is not None and q["used"] >= q["total"]:
                raise RuntimeError("Instagram's 25-posts-per-24h API quota is used up — try later.")
        except RuntimeError:
            raise
        except Exception as e:
            log(f"  (quota check skipped: {e})")

    caption = _caption_for(config)
    images = sorted(output_dir.glob("*-slide.png"))

    if kind == "reel":
        video = output_dir / "reel.mp4"
        if not video.exists():
            raise RuntimeError(f"No reel.mp4 in {output_dir} — run Compose Reel first.")
        copy = _reel_publish_copy(video, output_dir / "ig-video", log)
        cover_url = None
        if images:
            cover_jpg = _to_jpegs(images[:1], output_dir / "ig-jpg", log)[0]
            cover_url = _public_urls([cover_jpg], design_dir, config, log)[0]
        video_url = _public_video_url(copy, log)
        if dry_run:
            log("  dry run — skipping Instagram calls. Hosted URLs:")
            log(f"    video: {video_url.split('?')[0]}")
            if cover_url:
                log(f"    cover: {cover_url.split('?')[0]}")
            return {"dry_run": True, "kind": "reel", "urls": [video_url, cover_url]}
        log("  creating reel container…")
        params = {"media_type": "REELS", "video_url": video_url, "caption": caption,
                  "share_to_feed": "true", "access_token": token}
        if cover_url:
            params["cover_url"] = cover_url
        parent = _graph("POST", f"{base}/{ig_user}/media", params)["id"]
        _wait_finished(base, parent, token, timeout=600, log=log)
    else:
        if not images:
            raise RuntimeError(f"No rendered slides in {output_dir} — render first.")
        if len(images) > 10:
            raise RuntimeError(f"Instagram carousels max out at 10 slides; got {len(images)}.")
        _check_feed_ratio(images[0])
        jpegs = _to_jpegs(images, output_dir / "ig-jpg", log)
        urls = _public_urls(jpegs, design_dir, config, log)
        if dry_run:
            log("  dry run — skipping Instagram calls. Hosted URLs:")
            for u in urls:
                log(f"    {u.split('?')[0]}")
            return {"dry_run": True, "kind": "carousel" if len(urls) > 1 else "image",
                    "urls": urls}
        if len(urls) == 1:
            kind = "image"
            log("  creating image container…")
            parent = _graph("POST", f"{base}/{ig_user}/media",
                            {"image_url": urls[0], "caption": caption,
                             "access_token": token})["id"]
            _wait_finished(base, parent, token, log=log)
        else:
            kind = "carousel"
            log(f"  creating {len(urls)} carousel-item containers…")
            item_ids = []
            for u in urls:
                item_ids.append(_graph("POST", f"{base}/{ig_user}/media",
                                       {"is_carousel_item": "true", "image_url": u,
                                        "access_token": token})["id"])
            for cid in item_ids:
                _wait_finished(base, cid, token, log=log)
            log("  creating carousel container…")
            parent = _graph("POST", f"{base}/{ig_user}/media",
                            {"media_type": "CAROUSEL", "children": ",".join(item_ids),
                             "caption": caption, "access_token": token})["id"]
            _wait_finished(base, parent, token, log=log)

    log("  publishing…")
    post_id = _publish_container(base, ig_user, token, parent)
    permalink = _permalink(base, post_id, token)

    record = {
        "kind": kind,
        "post_id": str(post_id),
        "permalink": permalink,
        "at": _dt.datetime.now().astimezone().isoformat(timespec="minutes"),
        "account": ig_user,
    }
    try:
        _stamp_published(design_dir, record)
    except Exception as e:
        log(f"  (could not stamp ig_published into content.yaml: {e})")

    page_id = str(config.get("notion_page_id") or "").strip()
    if page_id and notion_sync.is_configured():
        try:
            notion_sync.update_status(page_id, "Published")
        except Exception as e:
            log(f"  (Notion status update failed: {e})")

    log(f"  live: {permalink or f'media id {post_id}'}")
    return record


# ── CLI ────────────────────────────────────────────────────────

def main(argv: list[str]) -> int:
    args = [a for a in argv[1:] if not a.startswith("--")]
    flags = [a for a in argv[1:] if a.startswith("--")]
    brand = args[0] if args else "itiha"

    if "--whoami" in flags:
        r = whoami(brand)
        print(f"{brand}: @{r.get('username')} · id {r.get('id')} · {r.get('account_type')} · "
              f"{r.get('media_count')} posts · {r.get('followers_count')} followers · "
              f"via {r.get('graph_host')}")
        return 0
    if "--quota" in flags:
        q = publishing_quota(brand)
        print(f"{brand}: {q['used']}/{q['total']} API posts used in the last 24h")
        return 0
    if "--refresh-token" in flags:
        refresh_token(brand)
        return 0

    if len(args) != 1:
        print("usage: instagram.py <design-name> [--dry-run] [--as-reel|--as-image]\n"
              "       instagram.py [brand] --whoami | --quota | --refresh-token")
        return 2
    kind = "reel" if "--as-reel" in flags else "image" if "--as-image" in flags else None
    design_dir = ROOT / "designs" / args[0]
    if not design_dir.is_dir():
        print(f"no such design: {design_dir}")
        return 1
    publish_design(design_dir, dry_run="--dry-run" in flags, kind=kind)
    return 0


if __name__ == "__main__":
    import sys
    raise SystemExit(main(sys.argv))
