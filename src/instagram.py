"""Publish a rendered carousel to Instagram via the Graph API.

Required env vars (see docs/INSTAGRAM_SETUP.md):
  IG_USER_ID         — your Instagram Business/Creator account numeric ID
  IG_ACCESS_TOKEN    — long-lived Page access token with instagram_content_publish
  IMAGE_HOST         — either "cloudinary" or "tunnel"
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET   (if IMAGE_HOST=cloudinary)
  TUNNEL_PUBLIC_URL  — public base URL pointing at the design's output/ dir (if IMAGE_HOST=tunnel)

Carousel publish flow (Graph API):
  1. For each image, upload to a public host → public URL
  2. POST {ig-user-id}/media          is_carousel_item=true, image_url=<url>  → returns container id
  3. POST {ig-user-id}/media          media_type=CAROUSEL, children=<ids>     → returns parent container id
  4. POST {ig-user-id}/media_publish  creation_id=<parent id>                 → publishes
"""

from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.request
from pathlib import Path

GRAPH = "https://graph.facebook.com/v23.0"


def _http(method: str, url: str, fields: dict | None = None, files: dict | None = None) -> dict:
    if files:
        boundary = "----motiongraphicsboundary"
        body = bytearray()
        for k, v in (fields or {}).items():
            body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
        for k, (name, data, mime) in files.items():
            body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{name}\"\r\nContent-Type: {mime}\r\n\r\n".encode()
            body += data + b"\r\n"
        body += f"--{boundary}--\r\n".encode()
        req = urllib.request.Request(url, data=bytes(body), method=method,
                                     headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    else:
        data = urllib.parse.urlencode(fields or {}).encode() if fields else None
        req = urllib.request.Request(url, data=data, method=method)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def _upload_cloudinary(image: Path) -> str:
    name = os.environ["CLOUDINARY_CLOUD_NAME"]
    preset = os.environ["CLOUDINARY_UPLOAD_PRESET"]
    url = f"https://api.cloudinary.com/v1_1/{name}/image/upload"
    r = _http("POST", url,
              fields={"upload_preset": preset},
              files={"file": (image.name, image.read_bytes(), "image/png")})
    return r["secure_url"]


def _public_url_via_tunnel(image: Path, output_dir: Path) -> str:
    base = os.environ["TUNNEL_PUBLIC_URL"].rstrip("/")
    rel = image.relative_to(output_dir)
    return f"{base}/{urllib.parse.quote(str(rel))}"


def _public_url(image: Path, output_dir: Path) -> str:
    host = os.environ.get("IMAGE_HOST", "cloudinary").lower()
    if host == "cloudinary":
        return _upload_cloudinary(image)
    if host == "tunnel":
        return _public_url_via_tunnel(image, output_dir)
    raise RuntimeError(f"Unknown IMAGE_HOST: {host!r}")


def _create_carousel_item(image_url: str, ig_user: str, token: str) -> str:
    r = _http("POST", f"{GRAPH}/{ig_user}/media",
              fields={"is_carousel_item": "true", "image_url": image_url, "access_token": token})
    return r["id"]


def _create_carousel(children: list[str], caption: str, ig_user: str, token: str) -> str:
    r = _http("POST", f"{GRAPH}/{ig_user}/media",
              fields={"media_type": "CAROUSEL", "children": ",".join(children),
                      "caption": caption, "access_token": token})
    return r["id"]


def _wait_finished(container_id: str, token: str, timeout: int = 90) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = _http("GET", f"{GRAPH}/{container_id}?fields=status_code&access_token={token}")
        status = r.get("status_code")
        if status == "FINISHED":
            return
        if status == "ERROR":
            raise RuntimeError(f"Container {container_id} status ERROR: {r}")
        time.sleep(2)
    raise TimeoutError(f"Container {container_id} did not finish within {timeout}s")


def _publish(container_id: str, ig_user: str, token: str) -> str:
    r = _http("POST", f"{GRAPH}/{ig_user}/media_publish",
              fields={"creation_id": container_id, "access_token": token})
    return r["id"]


def publish_design(design_dir: Path) -> str:
    for var in ("IG_USER_ID", "IG_ACCESS_TOKEN"):
        if not os.environ.get(var):
            raise RuntimeError(
                f"Missing env var {var}. See docs/INSTAGRAM_SETUP.md for setup."
            )

    import yaml as _yaml
    yaml_path = design_dir / "content.yaml"
    if not yaml_path.exists():
        raise RuntimeError(f"No content.yaml in {design_dir}")
    config = _yaml.safe_load(yaml_path.read_text()) or {}
    caption = config.get("caption", "") or ""
    hashtags = (config.get("hashtags") or "").strip()
    if hashtags:
        caption = (caption.rstrip() + "\n\n" + hashtags) if caption else hashtags
    output_dir = design_dir / "output"
    images = sorted(output_dir.glob("*.png"))
    if not images:
        raise RuntimeError(f"No rendered PNGs in {output_dir} — run render first.")
    if len(images) > 10:
        raise RuntimeError(
            f"Instagram carousels support 2–10 images; got {len(images)}. Trim before publishing."
        )

    ig_user = os.environ["IG_USER_ID"]
    token = os.environ["IG_ACCESS_TOKEN"]

    print(f"  uploading {len(images)} image(s) to public host…")
    urls = [_public_url(img, output_dir) for img in images]

    print("  creating carousel-item containers…")
    item_ids = [_create_carousel_item(u, ig_user, token) for u in urls]
    for cid in item_ids:
        _wait_finished(cid, token)

    print("  creating carousel container…")
    carousel_id = _create_carousel(item_ids, caption, ig_user, token)
    _wait_finished(carousel_id, token)

    print("  publishing…")
    post_id = _publish(carousel_id, ig_user, token)
    print(f"\npublished as media id {post_id}")
    return post_id


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: instagram.py <design-name>")
        return 2
    design_dir = Path(__file__).resolve().parents[1] / "designs" / argv[1]
    if not design_dir.is_dir():
        print(f"no such design: {design_dir}")
        return 1
    publish_design(design_dir)
    return 0


if __name__ == "__main__":
    import sys
    raise SystemExit(main(sys.argv))
