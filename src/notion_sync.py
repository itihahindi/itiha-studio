"""Notion sync — read the IG Content Plan backlog, write status / slug / image back.

Configured via two env vars (see .env.example):

  NOTION_TOKEN   — Notion internal integration secret (starts with `secret_`)
  NOTION_DB_ID   — Instagram Content Plan database ID (UUID)

If either is missing the module operates in no-op mode: `is_configured()` returns
False and the studio's home page hides the backlog section.

Status flow Studio drives:
  Idea / In Development           → user picks from backlog
  → Write Post                    → set when Studio opens the project
  → Ready to publish              → set when Studio finishes a successful render
  → Published                     → (future) set by the publish endpoint

Type → Studio format mapping:
  carousel       → instagram-portrait
  reel (insta)   → instagram-reel
  Photo (post)   → instagram-square
  Story          → instagram-portrait     (no dedicated story layout yet)
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv


# Load .env from repo root (one dir up from src/).
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "").strip()
NOTION_DB_ID = os.environ.get("NOTION_DB_ID", "").strip()
NOTION_API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


def _headers(extra: dict | None = None) -> dict:
    h = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }
    if extra:
        h.update(extra)
    return h


def is_configured() -> bool:
    return bool(NOTION_TOKEN and NOTION_DB_ID)


# ── Notion Type → Studio format ────────────────────────────────

TYPE_TO_FORMAT = {
    "carousel":     "instagram-portrait",
    "reel (insta)": "instagram-reel",
    "Photo (post)": "instagram-square",
    "Story":        "instagram-portrait",
}


# ── Property helpers ───────────────────────────────────────────

def _plain_title(prop: Any) -> str:
    if not prop: return ""
    return "".join(t.get("plain_text", "") for t in prop.get("title", []))


def _rich_text(prop: Any) -> str:
    if not prop: return ""
    return "".join(t.get("plain_text", "") for t in prop.get("rich_text", []))


def _select_value(prop: Any) -> str | None:
    if not prop: return None
    s = prop.get("select")
    return s.get("name") if s else None


def _status_value(prop: Any) -> str | None:
    if not prop: return None
    s = prop.get("status")
    return s.get("name") if s else None


def _multi_select_value(prop: Any) -> list[str]:
    if not prop: return []
    return [o.get("name") for o in prop.get("multi_select", [])]


def _date_value(prop: Any) -> str | None:
    if not prop: return None
    d = prop.get("date")
    return d.get("start") if d else None


# ── Public API ─────────────────────────────────────────────────

def _query_db(body: dict) -> dict:
    """POST a query, trying the legacy /databases/{id}/query first and falling
    back to the new /data_sources/{id}/query if the user pasted a data-source
    UUID instead of the database ID. Returns the parsed response."""
    r = requests.post(
        f"{NOTION_API}/databases/{NOTION_DB_ID}/query",
        json=body, headers=_headers(), timeout=30,
    )
    if r.status_code == 404:
        # User likely pasted a data-source ID rather than a database ID.
        # The new API path works for both single-source and multi-source DBs.
        r = requests.post(
            f"{NOTION_API}/data_sources/{NOTION_DB_ID}/query",
            json=body, headers=_headers(), timeout=30,
        )
    r.raise_for_status()
    return r.json()


def list_backlog() -> list[dict]:
    """Return rows that aren't Published, sorted by Publish Date then created time."""
    if not is_configured():
        return []
    body = {
        "filter": {
            "property": "Status",
            "status": {"does_not_equal": "Published"},
        },
        "sorts": [
            {"property": "Publish Date", "direction": "ascending"},
            {"timestamp": "created_time", "direction": "ascending"},
        ],
        "page_size": 100,
    }
    data = _query_db(body)
    out = []
    for row in data.get("results", []):
        props = row.get("properties", {})
        out.append({
            "id":           row["id"],
            "url":          row.get("url"),
            "post":         _plain_title(props.get("Post")),
            "type":         _select_value(props.get("Type")),
            "status":       _status_value(props.get("Status")),
            "topic":        _multi_select_value(props.get("Topic")),
            "tags":         _multi_select_value(props.get("Tags")),
            "studio_slug":  _rich_text(props.get("Studio slug")),
            "publish_date": _date_value(props.get("Publish Date")),
        })
    return out


def fetch_page(page_id: str) -> dict | None:
    if not is_configured():
        return None
    r = requests.get(
        f"{NOTION_API}/pages/{page_id}",
        headers=_headers(), timeout=30,
    )
    if r.status_code == 404:
        return None
    r.raise_for_status()
    return r.json()


def update_status(page_id: str, status: str) -> None:
    if not is_configured(): return
    body = {"properties": {"Status": {"status": {"name": status}}}}
    r = requests.patch(
        f"{NOTION_API}/pages/{page_id}",
        json=body, headers=_headers(), timeout=30,
    )
    r.raise_for_status()


def set_studio_slug(page_id: str, slug: str) -> None:
    if not is_configured(): return
    body = {"properties": {"Studio slug": {"rich_text": [{"text": {"content": slug}}]}}}
    r = requests.patch(
        f"{NOTION_API}/pages/{page_id}",
        json=body, headers=_headers(), timeout=30,
    )
    r.raise_for_status()


def attach_image(page_id: str, image_path: Path) -> None:
    """Upload `image_path` to Notion and set it as the row's `Image File`.

    Uses the three-step file_uploads flow:
      1. create file_upload  → upload_url + id
      2. POST file to upload_url (multipart)
      3. PATCH page property to reference the file_upload id
    """
    if not is_configured(): return
    image_path = Path(image_path)
    if not image_path.exists():
        raise FileNotFoundError(image_path)

    # 1. Create upload session
    r1 = requests.post(
        f"{NOTION_API}/file_uploads",
        json={"filename": image_path.name, "content_type": "image/png"},
        headers=_headers(), timeout=30,
    )
    r1.raise_for_status()
    upload = r1.json()
    upload_id = upload["id"]
    upload_url = upload["upload_url"]

    # 2. Send the bytes (multipart). Different content-type — don't reuse _headers().
    with open(image_path, "rb") as f:
        files = {"file": (image_path.name, f, "image/png")}
        r2 = requests.post(
            upload_url,
            headers={
                "Authorization": f"Bearer {NOTION_TOKEN}",
                "Notion-Version": NOTION_VERSION,
            },
            files=files, timeout=60,
        )
    r2.raise_for_status()

    # 3. Attach the upload to the page's Image File property
    body = {
        "properties": {
            "Image File": {
                "files": [
                    {
                        "type": "file_upload",
                        "file_upload": {"id": upload_id},
                        "name": image_path.name,
                    }
                ]
            }
        }
    }
    r3 = requests.patch(
        f"{NOTION_API}/pages/{page_id}",
        json=body, headers=_headers(), timeout=30,
    )
    r3.raise_for_status()
