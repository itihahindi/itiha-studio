"""`bin/import <doc>` — turn a document into a designs/<slug>/ folder.

Dispatches to the right importer by file extension (or URL host). Each importer
returns a normalized dict; we serialize to content.yaml, copy/download images
into images/, and you're ready to `bin/preview <slug>`.
"""

from __future__ import annotations

import re
import shutil
import sys
import urllib.parse
from pathlib import Path

import yaml

from importers import dispatch


ROOT = Path(__file__).resolve().parents[1]


def _slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "imported"


def _default_slug(source: str) -> str:
    parsed = urllib.parse.urlparse(source)
    if parsed.scheme in ("http", "https"):
        # docs.google.com/document/d/<id>/...  →  use last path segment
        seg = [s for s in parsed.path.split("/") if s][-1] if parsed.path.strip("/") else parsed.netloc
        return _slugify(seg)
    return _slugify(Path(source).stem)


def _dump_yaml(data: dict) -> str:
    # Strip private keys (leading underscore) before writing content.yaml.
    public = {k: v for k, v in data.items() if not k.startswith("_")}
    # Block style for readability; preserve unicode; keep dict insertion order.
    return yaml.dump(public, sort_keys=False, allow_unicode=True, width=100)


def main(argv: list[str]) -> int:
    if len(argv) < 2 or len(argv) > 3:
        print("usage: import_cli.py <doc-path-or-url> [<slug>]")
        return 2
    source = argv[1]
    slug = argv[2] if len(argv) == 3 else _default_slug(source)

    design_dir = ROOT / "designs" / slug
    if design_dir.exists():
        print(f"already exists: {design_dir}\n"
              f"  → delete it first, or pass a different slug: bin/import {source} <other-slug>")
        return 1

    try:
        importer = dispatch(source)
    except ValueError as e:
        print(f"error: {e}")
        return 1

    print(f"  importing  {source}")
    try:
        data = importer(source)
    except Exception as e:
        print(f"  failed:   {e}")
        return 1

    # Materialize the design folder.
    (design_dir / "images").mkdir(parents=True)

    for src_path, dest_name in data.get("_images", []):
        dest = design_dir / "images" / dest_name
        if dest.exists():
            continue
        shutil.copy2(src_path, dest)
        print(f"  copied    images/{dest_name}")

    (design_dir / "content.yaml").write_text(_dump_yaml(data))
    print(f"  wrote     designs/{slug}/content.yaml")
    print()
    print(f"next:       bin/preview {slug}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
