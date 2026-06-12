"""Itiha Studio — multi-design server with home page.

  bin/studio

Serves a project picker at `/` and the per-design editor at `/d/<slug>/`.

Routes:
  GET  /                         → home.html (project grid + new-project form)
  GET  /api/projects             → list of {slug, name, format}
  POST /api/projects/new         → create a new design from {name, format}
  GET  /d/<slug>/                → render-host.html for that design
  GET  /d/<slug>/<file>          → content.json, version.txt, error.txt,
                                   images/<rel>, or any shared/<file>
  POST /d/<slug>/api/save        → write content.yaml
  POST /d/<slug>/api/render      → run render.py for this design
  POST /d/<slug>/api/upload      → multipart image upload
  POST /d/<slug>/api/parse-markdown → loose-Markdown → content dict
  POST /d/<slug>/api/open-folder → reveal output/ folder in Finder/explorer

Per-design state is built lazily and cached in-memory. External edits to
content.yaml require a page reload (no watcher in v1).
"""

from __future__ import annotations

import cgi
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.parse
import webbrowser
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path

import yaml

import content as content_mod
from preview import (
    _dump_content_yaml,
    _safe_filename,
)
from scaffold import _slugify, make_starter_yaml
from formats import FORMATS
import notion_sync


ROOT = Path(__file__).resolve().parents[1]
SHARED = ROOT / "shared"
DESIGNS = content_mod.designs_root()

MIME = {
    ".html": "text/html",
    ".jsx":  "text/babel; charset=utf-8",
    ".js":   "application/javascript",
    ".css":  "text/css",
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif":  "image/gif",
    ".json": "application/json",
    ".svg":  "image/svg+xml",
    ".ttf":  "font/ttf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
}


def _ephemeral_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


# ── Per-design state cache ─────────────────────────────────────

_STATES: dict[str, dict] = {}
_STATES_LOCK = threading.Lock()


def _design_state(slug: str) -> dict:
    """Return the cached state for a design. Rebuild only when the YAML's
    mtime changed since the last rebuild — otherwise the version stays
    stable so the browser's version-poller doesn't see phantom "external
    edits" on every tick.
    """
    design_dir = DESIGNS / slug
    yaml_path = design_dir / "content.yaml"
    try:
        mtime = yaml_path.stat().st_mtime_ns
    except FileNotFoundError:
        mtime = 0
    with _STATES_LOCK:
        st = _STATES.get(slug)
        if st is None:
            st = {"content": b"{}", "version": "0", "error": "", "mtime": -1}
            _STATES[slug] = st
        if st["mtime"] != mtime:
            _rebuild_state(slug, st)
            st["mtime"] = mtime
    return st


def _rebuild_state(slug: str, st: dict) -> None:
    """Read content.yaml and update the cached bytes / version / error.
    Caller must hold _STATES_LOCK."""
    design_dir = DESIGNS / slug
    try:
        content = content_mod.load_content(design_dir)
        st["content"] = json.dumps(content, ensure_ascii=False).encode()
        st["error"] = ""
    except Exception as e:
        st["error"] = str(e)
    st["version"] = str(int(time.time() * 1000))


# ── Project listing / creation ─────────────────────────────────

def _list_projects() -> list[dict]:
    if not DESIGNS.is_dir():
        return []
    out = []
    for entry in sorted(DESIGNS.iterdir(), key=lambda p: p.name.lower()):
        if not entry.is_dir():
            continue
        yaml_path = entry / "content.yaml"
        if not yaml_path.exists():
            continue
        try:
            data = yaml.safe_load(yaml_path.read_text()) or {}
        except yaml.YAMLError:
            data = {}
        out.append({
            "slug":   entry.name,
            "name":   data.get("name") or entry.name,
            "format": data.get("format") or "instagram-portrait",
        })
    return out


def _stamp_notion_id(slug: str, page_id: str) -> None:
    """Write `notion_page_id: <id>` into the design's content.yaml so render
    can sync status back."""
    yaml_path = DESIGNS / slug / "content.yaml"
    if not yaml_path.exists():
        return
    text = yaml_path.read_text()
    if f"notion_page_id:" in text:
        return  # already stamped
    # Insert near the top, after the `name:` line for visibility.
    lines = text.splitlines(keepends=True)
    for i, ln in enumerate(lines):
        if ln.startswith("name:"):
            lines.insert(i + 1, f"notion_page_id: {page_id}\n")
            break
    yaml_path.write_text("".join(lines))


def _read_notion_id(slug: str) -> str | None:
    """Read the `notion_page_id` top-level key from a design's content.yaml."""
    yaml_path = DESIGNS / slug / "content.yaml"
    if not yaml_path.exists():
        return None
    try:
        data = yaml.safe_load(yaml_path.read_text()) or {}
    except yaml.YAMLError:
        return None
    pid = data.get("notion_page_id")
    return str(pid) if pid else None


def _delete_project(slug: str) -> None:
    """Remove a design folder. Refuses anything that doesn't resolve inside DESIGNS."""
    if not slug or "/" in slug or "\\" in slug or slug in (".", ".."):
        raise ValueError(f"invalid slug: {slug!r}")
    target = (DESIGNS / slug).resolve()
    designs_root = DESIGNS.resolve()
    if designs_root not in target.parents:
        raise ValueError(f"slug escapes designs root: {slug!r}")
    if not target.is_dir():
        raise FileNotFoundError(f"no such design: {slug}")
    shutil.rmtree(target)
    with _STATES_LOCK:
        _STATES.pop(slug, None)


def _create_project(name: str, fmt: str) -> str:
    """Create a new design folder; return the slug."""
    base = _slugify(name)
    if not base:
        raise ValueError("project name must contain letters or numbers")
    if fmt and fmt not in FORMATS:
        raise ValueError(f"unknown format: {fmt}")
    slug = base
    i = 2
    while (DESIGNS / slug).exists():
        slug = f"{base}-{i}"
        i += 1
    root = DESIGNS / slug
    (root / "images").mkdir(parents=True)
    (root / "content.yaml").write_text(make_starter_yaml(name, fmt or "instagram-portrait"))
    return slug


# ── Request handler ────────────────────────────────────────────

def _basic_auth_creds() -> tuple[str, str] | None:
    """Return (user, pass) if STUDIO_USER/STUDIO_PASS are set; else None.
    Unset → no auth (local dev). Set → every request must carry matching
    HTTP Basic credentials."""
    u = os.environ.get("STUDIO_USER")
    p = os.environ.get("STUDIO_PASS")
    if u and p:
        return u, p
    return None


def _build_server() -> ThreadingHTTPServer:
    creds = _basic_auth_creds()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_): pass

        def _check_auth(self) -> bool:
            """Return True if request passes basic-auth (or auth disabled)."""
            if creds is None:
                return True
            import base64, hmac
            header = self.headers.get("Authorization", "")
            if not header.startswith("Basic "):
                self._send_auth_challenge(); return False
            try:
                got = base64.b64decode(header[6:]).decode("utf-8", "replace")
                got_u, _, got_p = got.partition(":")
            except Exception:
                self._send_auth_challenge(); return False
            ok = (hmac.compare_digest(got_u, creds[0])
                  and hmac.compare_digest(got_p, creds[1]))
            if not ok:
                self._send_auth_challenge(); return False
            return True

        def _send_auth_challenge(self):
            self.send_response(401)
            self.send_header("WWW-Authenticate", 'Basic realm="Itiha Studio"')
            self.send_header("Content-Length", "0")
            self.end_headers()

        def _send_bytes(self, data: bytes, ct: str, code: int = 200):
            self.send_response(code)
            self.send_header("Content-Type", ct)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _send_file(self, path: Path, ct: str | None = None):
            if not path.exists() or not path.is_file():
                self.send_error(404); return
            data = path.read_bytes()
            mime = ct or MIME.get(path.suffix.lower())
            self.send_response(200)
            if mime: self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _read_json_body(self):
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode()
            return json.loads(raw) if raw else {}

        # ── GET routing ────────────────────────────────────────
        def do_GET(self):
            if not self._check_auth(): return
            path = urllib.parse.urlparse(self.path).path

            if path == "/" or path == "/index.html":
                self._send_file(SHARED / "home.html", "text/html"); return

            if path == "/api/projects":
                self._send_bytes(
                    json.dumps(_list_projects(), ensure_ascii=False).encode(),
                    "application/json"); return

            if path == "/api/notion/backlog":
                try:
                    payload = {
                        "configured": notion_sync.is_configured(),
                        "rows": notion_sync.list_backlog() if notion_sync.is_configured() else [],
                    }
                    self._send_bytes(
                        json.dumps(payload, ensure_ascii=False).encode(),
                        "application/json")
                except Exception as e:
                    self._send_bytes(f"notion backlog failed: {e}".encode(),
                                     "text/plain", code=500)
                return

            # Per-design routes
            m = re.match(r"^/d/([^/]+)(/.*)?$", path)
            if m:
                slug, sub = m.group(1), (m.group(2) or "/")
                return self._handle_design_get(slug, sub)

            # Any other path → treat as a shared/ static asset.
            rel = urllib.parse.unquote(path.lstrip("/")) or "home.html"
            self._send_file(SHARED / rel)

        def _handle_design_get(self, slug: str, sub: str):
            design_dir = DESIGNS / slug
            if not design_dir.is_dir():
                self.send_error(404, f"no such design: {slug}"); return
            st = _design_state(slug)

            # Strip leading slash on `sub`
            if sub == "/" or sub == "":
                # Editor entry point; serve render-host with preview flag injected
                # via JS (`?preview=1` query param on the URL is the cleanest).
                # Browser will already have the query; we just serve the HTML.
                # But the user's path is /d/<slug>/ which has no ?preview=1.
                # Redirect to /d/<slug>/render-host.html?preview=1
                self.send_response(302)
                self.send_header("Location", f"/d/{slug}/render-host.html?preview=1")
                self.end_headers()
                return

            rel = sub.lstrip("/")
            rel = urllib.parse.unquote(rel)

            if rel == "content.json":
                self._send_bytes(st["content"], "application/json"); return
            if rel == "version.txt":
                self._send_bytes(st["version"].encode(), "text/plain"); return
            if rel == "error.txt":
                self._send_bytes(st.get("error", "").encode(), "text/plain"); return
            if rel.startswith("images/"):
                self._send_file(design_dir / rel); return

            # Otherwise serve from shared/
            self._send_file(SHARED / rel)

        # ── POST routing ───────────────────────────────────────
        def do_POST(self):
            if not self._check_auth(): return
            path = urllib.parse.urlparse(self.path).path

            if path == "/api/projects/new":
                return self._create_project()

            if path == "/api/projects/delete":
                return self._delete_project_route()

            if path == "/api/notion/open":
                return self._open_notion()

            m = re.match(r"^/d/([^/]+)/api/(.+)$", path)
            if m:
                slug, endpoint = m.group(1), m.group(2)
                return self._handle_design_post(slug, endpoint)

            self.send_error(404)

        def _create_project(self):
            try:
                body = self._read_json_body()
                name = (body.get("name") or "").strip()
                fmt = (body.get("format") or "instagram-portrait").strip()
                if not name:
                    self._send_bytes(b"name is required", "text/plain", code=400); return
                slug = _create_project(name, fmt)
                self._send_bytes(json.dumps({"slug": slug}).encode(), "application/json")
            except Exception as e:
                self._send_bytes(f"create failed: {e}".encode(), "text/plain", code=500)

        def _delete_project_route(self):
            try:
                body = self._read_json_body()
                slug = (body.get("slug") or "").strip()
                if not slug:
                    self._send_bytes(b"slug is required", "text/plain", code=400); return
                _delete_project(slug)
                self._send_bytes(b'{"ok":true}', "application/json")
            except FileNotFoundError as e:
                self._send_bytes(str(e).encode(), "text/plain", code=404)
            except ValueError as e:
                self._send_bytes(str(e).encode(), "text/plain", code=400)
            except Exception as e:
                self._send_bytes(f"delete failed: {e}".encode(), "text/plain", code=500)

        def _open_notion(self):
            """Create a Studio project from a Notion backlog row, link them both ways."""
            try:
                body = self._read_json_body()
                page_id = (body.get("page_id") or "").strip()
                if not page_id:
                    self._send_bytes(b"page_id is required", "text/plain", code=400); return
                if not notion_sync.is_configured():
                    self._send_bytes(b"Notion is not configured (set NOTION_TOKEN / NOTION_DB_ID in .env)",
                                     "text/plain", code=400); return

                # Fetch the Notion page to read title + type
                page = notion_sync.fetch_page(page_id)
                if page is None:
                    self._send_bytes(b"Notion page not found", "text/plain", code=404); return
                props = page.get("properties", {})
                title = notion_sync._plain_title(props.get("Post")) or "Untitled"
                ntype = notion_sync._select_value(props.get("Type")) or "carousel"
                fmt = notion_sync.TYPE_TO_FORMAT.get(ntype, "instagram-portrait")

                # If Studio slug already set + folder exists, just navigate to it
                existing_slug = notion_sync._rich_text(props.get("Studio slug"))
                if existing_slug and (DESIGNS / existing_slug).is_dir():
                    slug = existing_slug
                else:
                    slug = _create_project(title, fmt)
                    _stamp_notion_id(slug, page_id)
                    notion_sync.set_studio_slug(page_id, slug)
                    # Bump to "Write Post" only if the current status was Idea / In Development
                    cur_status = notion_sync._status_value(props.get("Status"))
                    if cur_status in ("Idea", "In Development"):
                        notion_sync.update_status(page_id, "Write Post")
                self._send_bytes(json.dumps({"slug": slug}).encode(), "application/json")
            except Exception as e:
                self._send_bytes(f"notion open failed: {e}".encode(),
                                 "text/plain", code=500)

        def _handle_design_post(self, slug: str, endpoint: str):
            design_dir = DESIGNS / slug
            if not design_dir.is_dir():
                self.send_error(404, f"no such design: {slug}"); return
            st = _design_state(slug)

            if endpoint == "save":
                try:
                    incoming = self._read_json_body()
                    yaml_text = _dump_content_yaml(incoming)
                    yaml_path = design_dir / "content.yaml"
                    yaml_path.write_text(yaml_text)
                    with _STATES_LOCK:
                        _rebuild_state(slug, st)
                        st["mtime"] = yaml_path.stat().st_mtime_ns
                    self._send_bytes(
                        json.dumps({"ok": True, "version": st["version"]}).encode(),
                        "application/json")
                except Exception as e:
                    self._send_bytes(f"save failed: {e}".encode(), "text/plain", code=500)
                return

            if endpoint == "render":
                try:
                    proc = subprocess.run(
                        [sys.executable, str(ROOT / "src" / "render.py"), slug],
                        cwd=str(ROOT),
                        capture_output=True, text=True, timeout=180,
                    )
                    if proc.returncode != 0:
                        msg = proc.stderr.strip() or proc.stdout.strip() or "render failed"
                        self._send_bytes(msg.encode(), "text/plain", code=500); return
                    output_dir = content_mod.output_dir_for(design_dir)
                    files = sorted(output_dir.glob("*-slide.png"))

                    # If this design is linked to a Notion row, bump status + attach thumbnail.
                    notion_id = _read_notion_id(slug)
                    notion_synced = False
                    notion_error = None
                    if notion_id and notion_sync.is_configured():
                        try:
                            notion_sync.update_status(notion_id, "Ready to publish")
                            if files:
                                notion_sync.attach_image(notion_id, files[0])
                            notion_synced = True
                        except Exception as e:
                            notion_error = str(e)

                    self._send_bytes(json.dumps({
                        "ok": True, "count": len(files),
                        "output_dir": str(output_dir),
                        "notion_synced": notion_synced,
                        "notion_error": notion_error,
                    }).encode(), "application/json")
                except subprocess.TimeoutExpired:
                    self._send_bytes(b"render timed out (>180s)", "text/plain", code=504)
                except Exception as e:
                    self._send_bytes(f"render failed: {e}".encode(), "text/plain", code=500)
                return

            if endpoint == "open-folder":
                try:
                    out = content_mod.output_dir_for(design_dir)
                    if sys.platform == "darwin":
                        subprocess.Popen(["open", str(out)])
                    elif sys.platform == "win32":
                        # os.startfile is the natural Windows way to open a folder.
                        os.startfile(str(out))  # noqa: S606
                    else:
                        subprocess.Popen(["xdg-open", str(out)])
                    self._send_bytes(b'{"ok":true}', "application/json")
                except Exception as e:
                    self._send_bytes(f"open failed: {e}".encode(), "text/plain", code=500)
                return

            if endpoint == "parse-markdown":
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                    raw = self.rfile.read(length).decode()
                    from importers.markdown import parse_markdown_text
                    parsed = parse_markdown_text(raw, doc_dir=None, name_hint=slug)
                    parsed.pop("_images", None)
                    self._send_bytes(json.dumps(parsed, ensure_ascii=False).encode(),
                                     "application/json")
                except Exception as e:
                    self._send_bytes(f"parse failed: {e}".encode(), "text/plain", code=400)
                return

            if endpoint == "remove-bg":
                try:
                    body = self._read_json_body()
                    filename = (body.get("filename") or "").strip()
                    if not filename:
                        self._send_bytes(b"filename is required", "text/plain", code=400); return
                    src = design_dir / "images" / filename
                    if not src.exists():
                        self._send_bytes(f"image not found: {filename}".encode(),
                                         "text/plain", code=404); return
                    # Output is always PNG (alpha required).
                    out_name = Path(filename).stem + "-bgremoved.png"
                    dst = design_dir / "images" / out_name
                    n = 1
                    while dst.exists():
                        dst = design_dir / "images" / f"{Path(filename).stem}-bgremoved-{n}.png"
                        n += 1
                    from rembg import remove
                    from PIL import Image
                    import io as _io
                    raw = src.read_bytes()
                    cut = remove(raw)
                    # `remove` returns bytes already in PNG form when input is bytes.
                    dst.write_bytes(cut)
                    self._send_bytes(
                        json.dumps({"filename": dst.name}).encode(),
                        "application/json")
                except Exception as e:
                    self._send_bytes(f"remove-bg failed: {e}".encode(), "text/plain", code=500)
                return

            if endpoint == "upload":
                try:
                    ctype = self.headers.get("Content-Type", "")
                    if "multipart/form-data" not in ctype:
                        self._send_bytes(b"expected multipart/form-data", "text/plain", code=400); return
                    fs = cgi.FieldStorage(
                        fp=self.rfile, headers=self.headers,
                        environ={"REQUEST_METHOD": "POST", "CONTENT_TYPE": ctype},
                    )
                    if "file" not in fs:
                        self._send_bytes(b"missing 'file' field", "text/plain", code=400); return
                    item = fs["file"]
                    raw = item.file.read()
                    name = _safe_filename(item.filename or "upload.jpg")
                    images_dir = design_dir / "images"
                    images_dir.mkdir(exist_ok=True)
                    target = images_dir / name
                    n = 1
                    while target.exists():
                        target = images_dir / f"{Path(name).stem}-{n}{Path(name).suffix}"
                        n += 1
                    target.write_bytes(raw)
                    self._send_bytes(json.dumps({"filename": target.name}).encode(), "application/json")
                except Exception as e:
                    self._send_bytes(f"upload failed: {e}".encode(), "text/plain", code=500)
                return

            self.send_error(404)

    host = os.environ.get("STUDIO_HOST", "127.0.0.1")
    port_env = os.environ.get("STUDIO_PORT")
    port = int(port_env) if port_env else _ephemeral_port()
    return ThreadingHTTPServer((host, port), Handler)


def main(argv: list[str]) -> int:
    DESIGNS.mkdir(parents=True, exist_ok=True)
    server = _build_server()
    host, port = server.server_address[0], server.server_address[1]
    # Show a clickable loopback URL even when bound to 0.0.0.0; the actual
    # public hostname is fronted by the platform (Fly / reverse proxy).
    display_host = "127.0.0.1" if host in ("0.0.0.0", "::") else host
    url = f"http://{display_host}:{port}/"
    print(f"\n  Itiha Studio: {url}  (bound on {host}:{port})")
    print("  Ctrl-C to stop\n")
    # Only auto-open a browser when running locally on the loopback.
    if host in ("127.0.0.1", "localhost"):
        try:
            webbrowser.open(url)
        except Exception:
            pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopping.")
    finally:
        server.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
