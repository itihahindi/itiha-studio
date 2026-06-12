"""Live-preview server with editor.

  bin/preview <design-name>

Serves the render-host.html app, watches content.yaml + images/ for external
edits, and exposes two write endpoints used by the in-browser editor:

  POST /api/save      JSON body → designs/<slug>/content.yaml
  POST /api/upload    multipart  → designs/<slug>/images/<safe-name>
"""

from __future__ import annotations

import asyncio
import cgi
import io
import json
import re
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
from watchfiles import awatch

import content as content_mod


ROOT = Path(__file__).resolve().parents[1]
SHARED = ROOT / "shared"


def _ephemeral_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


# ── Content writer: editor → content.yaml ────────────────────────

# Keys whose values are intentionally multi-line and should use YAML's | block
# style for human-readable output.
_BLOCK_KEYS = {"headline", "body", "subline", "quote", "caption", "hashtags"}


def _normalize_for_yaml(obj):
    """Drop empty strings / undefined fields so the YAML stays tidy."""
    if isinstance(obj, dict):
        return {k: _normalize_for_yaml(v) for k, v in obj.items()
                if v not in (None, "", [], {})}
    if isinstance(obj, list):
        return [_normalize_for_yaml(x) for x in obj]
    return obj


class _BlockStr(str): pass

def _block_str_representer(dumper, data):
    return dumper.represent_scalar("tag:yaml.org,2002:str", str(data), style="|")

yaml.add_representer(_BlockStr, _block_str_representer)


def _annotate_block(obj):
    """Wrap multi-line strings in _BlockStr so PyYAML serializes them with |."""
    if isinstance(obj, dict):
        return {k: _annotate_block(v) if k not in _BLOCK_KEYS or not (isinstance(v, str) and "\n" in v)
                   else _BlockStr(v.rstrip() + "\n")
                for k, v in obj.items()}
    if isinstance(obj, list):
        return [_annotate_block(x) for x in obj]
    return obj


def _dump_content_yaml(content: dict) -> str:
    """Pretty-print the content dict back to YAML for human editing."""
    # Strip server-only keys; the loader re-derives them.
    public = {k: v for k, v in content.items() if k not in ("format_dims",)}
    public = _normalize_for_yaml(public)
    public = _annotate_block(public)
    return yaml.dump(public, sort_keys=False, allow_unicode=True, width=100)


def _safe_filename(name: str) -> str:
    """slugify-ish but keep the extension."""
    stem = Path(name).stem
    suffix = Path(name).suffix.lower()
    stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", stem).strip("-").lower() or "image"
    return f"{stem}{suffix or '.jpg'}"


# ── Server ───────────────────────────────────────────────────────

def _build_server(design_dir: Path, state: dict) -> ThreadingHTTPServer:

    def rebuild_from_disk():
        try:
            content = content_mod.load_content(design_dir)
            state["content"] = json.dumps(content, ensure_ascii=False).encode()
            state["error"] = ""
        except Exception as e:
            state["error"] = str(e)
        state["version"] = str(int(time.time() * 1000))

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_): pass

        def _send_bytes(self, data: bytes, ct: str, code: int = 200):
            self.send_response(code)
            self.send_header("Content-Type", ct)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _send_file(self, path: Path, ct: str | None):
            if not path.exists() or not path.is_file():
                self.send_error(404); return
            data = path.read_bytes()
            self.send_response(200)
            if ct: self.send_header("Content-Type", ct)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _read_json_body(self):
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode()
            return json.loads(raw)

        def do_GET(self):
            path = urllib.parse.urlparse(self.path).path
            if path == "/content.json":
                self._send_bytes(state["content"], "application/json"); return
            if path == "/version.txt":
                self._send_bytes(state["version"].encode(), "text/plain"); return
            if path == "/error.txt":
                self._send_bytes(state.get("error", "").encode(), "text/plain"); return
            if path.startswith("/images/"):
                rel = urllib.parse.unquote(path[len("/images/"):])
                self._send_file(design_dir / "images" / rel, None); return
            rel = urllib.parse.unquote(path.lstrip("/")) or "render-host.html"
            target = SHARED / rel
            mime = {
                ".html": "text/html", ".jsx": "text/babel; charset=utf-8",
                ".js": "application/javascript", ".css": "text/css",
                ".png": "image/png", ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg", ".webp": "image/webp",
                ".json": "application/json",
            }.get(target.suffix.lower())
            self._send_file(target, mime)

        def do_POST(self):
            path = urllib.parse.urlparse(self.path).path

            if path == "/api/save":
                try:
                    incoming = self._read_json_body()
                    yaml_text = _dump_content_yaml(incoming)
                    (design_dir / "content.yaml").write_text(yaml_text)
                    rebuild_from_disk()
                    self._send_bytes(
                        json.dumps({"ok": True, "version": state["version"]}).encode(),
                        "application/json",
                    )
                except Exception as e:
                    self._send_bytes(f"save failed: {e}".encode(), "text/plain", code=500)
                return

            if path == "/api/render":
                try:
                    proc = subprocess.run(
                        [sys.executable, str(ROOT / "src" / "render.py"), design_dir.name],
                        cwd=str(ROOT),
                        capture_output=True, text=True, timeout=180,
                    )
                    if proc.returncode != 0:
                        msg = proc.stderr.strip() or proc.stdout.strip() or "render failed"
                        self._send_bytes(msg.encode(), "text/plain", code=500); return
                    output_dir = content_mod.output_dir_for(design_dir)
                    files = sorted(output_dir.glob("*-slide.png"))
                    self._send_bytes(json.dumps({
                        "ok": True, "count": len(files),
                        "output_dir": str(output_dir),
                    }).encode(), "application/json")
                except subprocess.TimeoutExpired:
                    self._send_bytes(b"render timed out (>180s)", "text/plain", code=504)
                except Exception as e:
                    self._send_bytes(f"render failed: {e}".encode(), "text/plain", code=500)
                return

            if path == "/api/open-folder":
                # Localhost-only, fixed path. macOS `open`; on Linux: xdg-open.
                try:
                    out = content_mod.output_dir_for(design_dir)
                    opener = "open" if sys.platform == "darwin" else "xdg-open"
                    subprocess.Popen([opener, str(out)])
                    self._send_bytes(b'{"ok":true}', "application/json")
                except Exception as e:
                    self._send_bytes(f"open failed: {e}".encode(), "text/plain", code=500)
                return

            if path == "/api/parse-markdown":
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                    raw = self.rfile.read(length).decode()
                    from importers.markdown import parse_markdown_text
                    parsed = parse_markdown_text(raw, doc_dir=None, name_hint=design_dir.name)
                    # Strip the private `_images` field — paste flow doesn't carry files.
                    parsed.pop("_images", None)
                    self._send_bytes(json.dumps(parsed, ensure_ascii=False).encode(),
                                     "application/json")
                except Exception as e:
                    self._send_bytes(f"parse failed: {e}".encode(), "text/plain", code=400)
                return

            if path == "/api/upload":
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
                    # avoid clobbering existing files
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

    port = _ephemeral_port()
    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def _rebuild(design_dir: Path, state: dict) -> None:
    try:
        content = content_mod.load_content(design_dir)
        state["content"] = json.dumps(content, ensure_ascii=False).encode()
        state["error"] = ""
    except Exception as e:
        state["error"] = str(e)
        print(f"  error: {e}")
    state["version"] = str(int(time.time() * 1000))


async def _watch_loop(design_dir: Path, state: dict):
    watch_paths = [design_dir / "content.yaml", design_dir / "images"]
    watch_paths = [str(p) for p in watch_paths if p.exists()]
    async for _changes in awatch(*watch_paths, debounce=300, recursive=True):
        # Coalesce: rebuild once per change burst. (Includes our own /api/save
        # writes — that's fine; state already updated synchronously there.)
        _rebuild(design_dir, state)


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: preview.py <design-name>")
        return 2
    design_dir = ROOT / "designs" / argv[1]
    if not design_dir.is_dir():
        print(f"no such design: {design_dir}")
        return 1
    if not (design_dir / "content.yaml").exists():
        print(f"preview requires content.yaml — {design_dir} has none")
        return 1

    state: dict = {"content": b"{}", "version": "0", "error": ""}
    _rebuild(design_dir, state)

    server = _build_server(design_dir, state)
    port = server.server_address[1]
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{port}/render-host.html?preview=1"
    print(f"\n  preview ready: {url}")
    print("  click \"Edit\" in the bottom toolbar to open the form editor")
    print("  press Ctrl-C to stop\n")
    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        asyncio.run(_watch_loop(design_dir, state))
    except KeyboardInterrupt:
        print("\nstopping.")
    finally:
        server.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
