"""Importer plug-ins.

An importer turns a source document into a normalized dict that matches the
shape of content.yaml. Each importer is registered against one or more
file extensions (".md", ".docx") and/or URL hostnames ("docs.google.com").

To add a new importer:

  1. Create a file under src/importers/<your-format>.py.
  2. Define `def import_doc(source: Path | str) -> dict:` that returns a dict
     with shape:
       {
         "name": str,
         "format": str,        # e.g. "instagram-portrait"
         "caption": str,
         "tweaks": dict,
         "slides": [ { "layout": ..., "headline": ..., ... }, ... ],
         "_images": [(source, dest_filename), ...]   # files to copy/download
       }
  3. Register it with `@register(".your-ext")` or `@register_url("hostname")`.
  4. Update src/importers/README.md.

The bin/import CLI dispatches automatically.
"""

from __future__ import annotations

from pathlib import Path
from typing import Callable
from urllib.parse import urlparse


_EXT_IMPORTERS: dict[str, Callable] = {}
_URL_IMPORTERS: dict[str, Callable] = {}


def register(*extensions: str):
    """Register an importer for one or more file extensions (".md", ".docx")."""
    def deco(func: Callable) -> Callable:
        for ext in extensions:
            _EXT_IMPORTERS[ext.lower()] = func
        return func
    return deco


def register_url(*hostnames: str):
    """Register an importer for one or more URL hostnames ('docs.google.com')."""
    def deco(func: Callable) -> Callable:
        for h in hostnames:
            _URL_IMPORTERS[h.lower()] = func
        return func
    return deco


def dispatch(source: str) -> Callable:
    parsed = urlparse(source)
    if parsed.scheme in ("http", "https"):
        host = parsed.netloc.lower()
        for known, func in _URL_IMPORTERS.items():
            if host == known or host.endswith("." + known):
                return func
        raise ValueError(f"No importer registered for URL host {host!r}")
    ext = Path(source).suffix.lower()
    if ext not in _EXT_IMPORTERS:
        known = sorted(set(_EXT_IMPORTERS) | {f"{h} (url)" for h in _URL_IMPORTERS})
        raise ValueError(f"No importer registered for {ext!r}. Known: {known}")
    return _EXT_IMPORTERS[ext]


# Auto-load all importer modules in this package so registrations happen.
from . import markdown        # noqa: F401,E402
from . import claude_design   # noqa: F401,E402
