"""Scaffold a new carousel folder under designs/<slug>/.

Creates content.yaml with a 3-slide starter (cover → story → closing) plus
images/ and output/ folders. Edit content.yaml, then run `bin/preview <slug>`.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


# ── Per-format starter templates ─────────────────────────────────
# Each starter is parameterised on `{title}`. The `format:` field is filled in
# by make_starter_yaml() so we don't have to hard-code it in each template.

_CAROUSEL_STARTER = """\
name: "{title}"
format: {fmt}
brand: {brand}

# IG caption used by `bin/publish`. Multi-line via YAML's | block scalar.
caption: |
  Replace this with your IG caption.

  #hashtags #here

# Optional global tweaks. Per-slide overrides win.
tweaks:
  showChapterLabels: false
  showStamp: true
  showPageNum: true
  overlayDarkness: 62
  showGrain: true

slides:
  - layout: cover
    eyebrow: "Series 01"
    eyebrow_meta: "{title} · 3 Parts"
    headline: |
      Your Big
      Headline With An
      *Accent.*
    subline: "One-line subtitle"
    swipe_meta: "Swipe ▸ · 3 Slides · 1 min read"

  - layout: story
    headline: |
      The Story
      Begins *Here.*
    body: |
      Your body copy goes here. Use [red emphasis] for key terms,
      _italics_ for foreign words, and **bold** for selective stress.
    image_bw: true

  - layout: closing
    headline: |
      The Closing
      *Line.*
    stats:
      - value: "1825"
        label: "Year it began"
      - value: "100K"
        label: "People affected"
      - value: "12"
        label: "Colonies involved"
    body: |
      A short, declarative paragraph that lands the final point. Optional.
    handle: "Follow @yourhandle"
"""


_REEL_STARTER = """\
name: "{title}"
format: {fmt}
brand: {brand}

caption: |
  Replace this with your IG Reel caption.

  #hashtags #here

tweaks:
  showStamp: true

slides:
  - layout: reel-title
    eyebrow: "Series 01"
    headline: |
      Your Hook
      In *Two Lines*
    subline: "Optional one-line sub"
    handle: "@itiha29"
"""


_THUMBNAIL_STARTER = """\
name: "{title}"
format: {fmt}
brand: {brand}

slides:
  - layout: youtube-thumbnail
    eyebrow: "Series 01"
    headline: |
      Two-Line
      *Hook* Headline
    subline: "Optional subline"
"""


_END_CARD_STARTER = """\
name: "{title}"
format: {fmt}
brand: {brand}

slides:
  - layout: end-card
    tagline: "History Simplified"
"""


_STARTERS_BY_FORMAT = {
    "instagram-portrait":  _CAROUSEL_STARTER,
    "instagram-square":    _CAROUSEL_STARTER,
    "instagram-reel":      _REEL_STARTER,
    "youtube-thumbnail":   _THUMBNAIL_STARTER,
    "youtube-end-card":    _END_CARD_STARTER,
}


def make_starter_yaml(title: str, fmt: str = "instagram-portrait",
                      brand: str = "itiha") -> str:
    """Return the starter content.yaml text for a (title, format, brand)."""
    template = _STARTERS_BY_FORMAT.get(fmt, _CAROUSEL_STARTER)
    return template.format(title=title, fmt=fmt, brand=brand)


# Legacy alias — old code referenced this directly.
STARTER = _CAROUSEL_STARTER


def _slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "untitled"


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: scaffold.py <slug-or-title>")
        return 2
    raw = argv[1]
    slug = _slugify(raw)
    title = raw.replace("-", " ").title() if slug == raw else raw

    root = Path(__file__).resolve().parents[1] / "designs" / slug
    if root.exists():
        print(f"already exists: {root}")
        return 1
    (root / "images").mkdir(parents=True)
    (root / "content.yaml").write_text(make_starter_yaml(title, "instagram-portrait"))
    print(f"created  designs/{slug}/")
    print(f"  content.yaml")
    print(f"  images/")
    print()
    print(f"next:    bin/preview {slug}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
