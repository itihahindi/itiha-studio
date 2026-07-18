"""Publish a rendered carousel to Instagram via the official API.

Required env vars (see docs/INSTAGRAM_SETUP.md):
  IG_USER_ID         — Instagram professional-account numeric ID
  IG_ACCESS_TOKEN    — long-lived access token with content-publish permission
  IMAGE_HOST         — "cloudinary" (default) | "tunnel" | "notion"

Per-brand overrides: IG_USER_ID_VAQ_HQ / IG_ACCESS_TOKEN_VAQ_HQ etc. (brand slug
uppercased, dashes → underscores) fall back to the plain names.

Instagram fetches images from public URLs; it never accepts raw bytes, and it
only accepts JPEG. So the flow is:

  1. Convert the rendered *-slide.png files to JPEG (ig-jpg/ next to them).
  2. Host each JPEG at a public URL. Default host is Cloudinary (free tier,
     unsigned upload preset). "notion" (attach to the design's Notion row,
     signed ~1h URLs) and "tunnel" (static server + cloudflared) also work,
     but the user prefers images NOT go to Notion — keep cloudinary default.
  3. POST {ig-user-id}/media           is_carousel_item=true, image_url=…  → child container
  4. POST {ig-user-id}/media           media_type=CAROUSEL, children=…     → parent container
     (a single-slide design skips 3/4 and makes one plain image container)
  5. POST {ig-user-id}/media_publish   creation_id=…                       → live post

Token flavors: tokens starting with "EAA" are Facebook-login flavored and go to
graph.facebook.com; anything else is assumed Instagram-login flavored and goes
to graph.instagram.com. Override with IG_GRAPH_HOST if the guess is wrong.
"""

from __future__ import annotations

import os
import time
import urllib.parse
from pathlib import Path

import requests
import yaml

import content as content_mod
import notion_sync

IG_API_VERSION = os.environ.get("IG_API_VERSION", "v23.0")
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # Instagram's per-image cap


# ── env / Graph helpers ────────────────────────────────────────

def _env_for_brand(key: str, brand: str) -> str:
    suffix = brand.upper().replace("-", "_")
    return (os.environ.get(f"{key}_{suffix}") or os.environ.get(key, "")).strip()


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


# ── step 2, host = notion ──────────────────────────────────────

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


def _stamp_notion_page_id(design_dir: Path, page_id: str) -> None:
    """Mirror studio.py's textual stamp: insert after the name: line, no reformat."""
    yaml_path = design_dir / "content.yaml"
    text = yaml_path.read_text()
    if "notion_page_id:" in text:
        return
    lines = text.splitlines(keepends=True)
    for i, ln in enumerate(lines):
        if ln.startswith("name:"):
            lines.insert(i + 1, f"notion_page_id: {page_id}\n")
            break
    yaml_path.write_text("".join(lines))


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


# ── step 2, alternate hosts ────────────────────────────────────

def _upload_cloudinary(image: Path) -> str:
    name = os.environ.get("CLOUDINARY_CLOUD_NAME", "").strip()
    preset = os.environ.get("CLOUDINARY_UPLOAD_PRESET", "").strip()
    if not name or not preset:
        raise RuntimeError(
            "CLOUDINARY_CLOUD_NAME / CLOUDINARY_UPLOAD_PRESET not set in .env — "
            "see docs/INSTAGRAM_SETUP.md step 3 (free, ~5 min)."
        )
    with open(image, "rb") as f:
        r = requests.post(
            f"https://api.cloudinary.com/v1_1/{name}/image/upload",
            data={"upload_preset": preset},
            files={"file": (image.name, f, "image/jpeg")}, timeout=120,
        )
    r.raise_for_status()
    return r.json()["secure_url"]


def _public_urls(jpegs: list[Path], design_dir: Path, config: dict, log=print) -> list[str]:
    host = os.environ.get("IMAGE_HOST", "cloudinary").lower()
    if host == "cloudinary":
        log(f"  uploading {len(jpegs)} JPEG(s) to Cloudinary…")
        return [_upload_cloudinary(j) for j in jpegs]
    if host == "notion":
        return _host_via_notion(jpegs, design_dir, config, log)
    if host == "tunnel":
        base = os.environ["TUNNEL_PUBLIC_URL"].rstrip("/")
        return [f"{base}/{urllib.parse.quote(j.parent.name)}/{urllib.parse.quote(j.name)}"
                for j in jpegs]
    raise RuntimeError(f"Unknown IMAGE_HOST: {host!r}")


# ── steps 3–5: containers + publish ────────────────────────────

def _wait_finished(base: str, container_id: str, token: str, timeout: int = 120) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = _graph("GET", f"{base}/{container_id}",
                   {"fields": "status_code", "access_token": token})
        status = r.get("status_code")
        if status == "FINISHED":
            return
        if status == "ERROR":
            raise RuntimeError(f"Container {container_id} status ERROR: {r}")
        time.sleep(1.5)
    raise TimeoutError(f"Container {container_id} did not finish within {timeout}s")


def publish_design(design_dir: Path, dry_run: bool = False, log=print) -> dict:
    yaml_path = design_dir / "content.yaml"
    if not yaml_path.exists():
        raise RuntimeError(f"No content.yaml in {design_dir}")
    config = yaml.safe_load(yaml_path.read_text()) or {}
    brand = str(config.get("brand") or "itiha")

    ig_user = _env_for_brand("IG_USER_ID", brand)
    token = _env_for_brand("IG_ACCESS_TOKEN", brand)
    if not dry_run and (not ig_user or not token):
        raise RuntimeError(
            "IG_USER_ID / IG_ACCESS_TOKEN not set in .env — "
            "see docs/INSTAGRAM_SETUP.md (10-minute one-time setup)."
        )

    caption = (config.get("caption") or "").rstrip()
    hashtags = (config.get("hashtags") or "").strip()
    if hashtags:
        caption = f"{caption}\n\n{hashtags}" if caption else hashtags

    output_dir = content_mod.output_dir_for(design_dir)
    images = sorted(output_dir.glob("*-slide.png"))
    if not images:
        raise RuntimeError(f"No rendered slides in {output_dir} — render first.")
    if len(images) > 10:
        raise RuntimeError(f"Instagram carousels max out at 10 slides; got {len(images)}.")

    jpegs = _to_jpegs(images, output_dir / "ig-jpg", log)
    urls = _public_urls(jpegs, design_dir, config, log)
    if dry_run:
        log("  dry run — skipping Instagram calls. Hosted URLs:")
        for u in urls:
            log(f"    {u.split('?')[0]}")
        return {"dry_run": True, "urls": urls}

    base = _graph_base(token)
    if len(urls) == 1:
        log("  creating image container…")
        parent = _graph("POST", f"{base}/{ig_user}/media",
                        {"image_url": urls[0], "caption": caption,
                         "access_token": token})["id"]
        _wait_finished(base, parent, token)
    else:
        log(f"  creating {len(urls)} carousel-item containers…")
        item_ids = []
        for u in urls:
            item_ids.append(_graph("POST", f"{base}/{ig_user}/media",
                                   {"is_carousel_item": "true", "image_url": u,
                                    "access_token": token})["id"])
        for cid in item_ids:
            _wait_finished(base, cid, token)
        log("  creating carousel container…")
        parent = _graph("POST", f"{base}/{ig_user}/media",
                        {"media_type": "CAROUSEL", "children": ",".join(item_ids),
                         "caption": caption, "access_token": token})["id"]
        _wait_finished(base, parent, token)

    log("  publishing…")
    post_id = _graph("POST", f"{base}/{ig_user}/media_publish",
                     {"creation_id": parent, "access_token": token})["id"]

    permalink = None
    try:
        permalink = _graph("GET", f"{base}/{post_id}",
                           {"fields": "permalink", "access_token": token}).get("permalink")
    except Exception:
        pass  # cosmetic — the post is live either way

    page_id = str(config.get("notion_page_id") or "").strip()
    if page_id and notion_sync.is_configured():
        try:
            notion_sync.update_status(page_id, "Published")
        except Exception as e:
            log(f"  (Notion status update failed: {e})")

    log(f"  live: {permalink or f'media id {post_id}'}")
    return {"post_id": post_id, "permalink": permalink}


def main(argv: list[str]) -> int:
    args = [a for a in argv[1:] if not a.startswith("--")]
    dry_run = "--dry-run" in argv
    if len(args) != 1:
        print("usage: instagram.py <design-name> [--dry-run]")
        return 2
    design_dir = Path(__file__).resolve().parents[1] / "designs" / args[0]
    if not design_dir.is_dir():
        print(f"no such design: {design_dir}")
        return 1
    publish_design(design_dir, dry_run=dry_run)
    return 0


if __name__ == "__main__":
    import sys
    raise SystemExit(main(sys.argv))
