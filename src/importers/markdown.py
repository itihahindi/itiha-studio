"""Markdown importer.

Doc shape:

  ---
  name: My Carousel
  format: instagram-portrait
  caption: |
    My IG caption
  tweaks:
    showChapterLabels: false
  ---

  ## Slide 1
  Layout: cover
  Eyebrow: Series 01
  Headline: |
    A New Name For An
    Old *Chain.*
  Image: https://example.com/cover.jpg

  ## Slide 2
  Headline: The Crisis After *Emancipation.*
  Body: |
    When slavery was abolished...
  Image: ./assets/caribbean.jpg
  Image-BW: true

Frontmatter and each slide section are parsed as YAML, so field syntax matches
content.yaml exactly. Keys are case-insensitive and hyphens normalize to
underscores (e.g. `Image-BW` → `image_bw`).

Smart defaults: if Layout: is omitted, the first slide is `cover`, the last is
`closing`, and every slide in between is `story`.

Image resolution: see resolve_image() below — Image: lines can be URLs or local
paths relative to the doc; an `assets/slide-<N>.{jpg,png,webp,jpeg}` next to the
doc is picked up automatically when no Image: line is given.
"""

from __future__ import annotations

import re
from pathlib import Path

import yaml

from . import register


# ── Key normalization ──────────────────────────────────────────────

def _norm_key(k: str) -> str:
    return k.strip().lower().replace("-", "_")


def _norm(obj):
    if isinstance(obj, dict):
        return {_norm_key(k): _norm(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_norm(x) for x in obj]
    return obj


# ── Frontmatter + slide split ──────────────────────────────────────

_FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
# Accept `## Slide N`, `### Slide N`, `### **Slide N**`, `### **Slide N (Title)**`.
_SLIDE_HEAD_RE = re.compile(
    r"^#{2,3}\s+\*{0,2}(?:slide\s+)?(\d+)\b[^\n]*$",
    re.IGNORECASE | re.MULTILINE,
)
# Anything in the BMP-supplementary emoji ranges + common dingbats.
_EMOJI_RE = re.compile(
    "[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF\U0001F000-\U0001F02F]"
)


def _parse_doc(text: str) -> tuple[dict, list[str]]:
    fm = {}
    rest = text
    m = _FM_RE.match(text)
    if m:
        fm = yaml.safe_load(m.group(1)) or {}
        rest = text[m.end():]
    sections = []
    headers = list(_SLIDE_HEAD_RE.finditer(rest))
    if not headers:
        raise ValueError("no slide sections found (expected `## Slide N` headers)")
    for i, h in enumerate(headers):
        start = h.end()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(rest)
        sections.append(rest[start:end].strip())
    return fm, sections


# ── Image resolution ───────────────────────────────────────────────

_IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif")


def _find_sidecar(doc_dir: Path, slide_n: int) -> Path | None:
    """Look for assets/slide-<N>.<ext> next to the doc."""
    base = doc_dir / "assets"
    for ext in _IMG_EXTS:
        cand = base / f"slide-{slide_n}{ext}"
        if cand.exists():
            return cand
        # also accept slide-01.jpg
        cand = base / f"slide-{slide_n:02d}{ext}"
        if cand.exists():
            return cand
    return None


def _is_url(s) -> bool:
    return isinstance(s, str) and s.startswith(("http://", "https://"))


def resolve_image(value, doc_dir: Path, slide_n: int) -> tuple[str | None, list[tuple[Path, str]]]:
    """Return (image_field_value_for_yaml, copy_jobs).

    copy_jobs is a list of (source_path, dest_filename_in_images/) to perform
    after the design folder is created. URLs are returned as-is for the existing
    image resolver to download on first render.
    """
    if _is_url(value):
        return value, []
    if value:
        # Local path — resolve relative to the doc.
        src = (doc_dir / value).resolve() if not Path(value).is_absolute() else Path(value)
        if not src.exists():
            raise FileNotFoundError(f"image not found: {src}")
        dest_name = src.name
        return dest_name, [(src, dest_name)]
    # No Image: line — try the sidecar.
    side = _find_sidecar(doc_dir, slide_n)
    if side:
        return side.name, [(side, side.name)]
    return None, []


# ── Smart layout defaults ──────────────────────────────────────────

def _default_layout(index: int, total: int) -> str:
    if index == 0:
        return "cover"
    if index == total - 1:
        return "closing"
    return "story"


# ── Loose fallback: NotebookLM-style "**Text:**" blocks ────────────

def _loose_parse_slide(raw: str, index: int, total: int) -> dict:
    """Best-effort parse for a slide section that isn't YAML.

    Handles NotebookLM's typical shape:
        **Image Idea:** A map of India ...
        **Text:**
        **Are Hidden Forces Trying to "Break" India?** 🚨
        Swipe to uncover ...
    Strips emoji, drops **Image Idea:** / **Layout:** label blocks, takes the
    first non-empty line of the remaining text as the headline and the rest
    as body. Layout defaults from slide position.
    """
    text = _EMOJI_RE.sub("", raw)

    # Prefer the **Text:** block if present.
    m = re.search(r"\*\*Text:\*\*\s*\n?(.+?)(?=\n\s*\*\*(?:Image|Layout|Visual|Audio)\b|\Z)",
                  text, re.DOTALL | re.IGNORECASE)
    if m:
        text = m.group(1)
    else:
        # Otherwise drop any `**Label:**` lines that aren't ours.
        text = re.sub(r"^\*\*(?:image idea|visual|layout|audio|video|caption|hashtag)[^*]*\*\*[^\n]*$",
                      "", text, flags=re.IGNORECASE | re.MULTILINE)

    # Strip bold (**…**) and stray *…* that aren't our headline-accent syntax.
    # Keep our syntax intact by only stripping double asterisks; we'll let
    # single asterisks pass and the renderer treats them as accents.
    text = re.sub(r"\*\*([^*\n]+)\*\*", r"\1", text)

    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    if not lines:
        return {"layout": _default_layout(index, total)}

    headline = lines[0]
    body = "\n\n".join(lines[1:]) if len(lines) > 1 else None

    out: dict = {
        "layout": _default_layout(index, total),
        "headline": headline,
    }
    if body:
        out["body"] = body
    return out


# ── Importer ───────────────────────────────────────────────────────

def _clean_llm_output(text: str) -> str:
    """Strip the common ways an LLM wraps Markdown output.

    Handles: triple-backtick code fences (with or without a language tag),
    leading commentary before the first `---` or `## Slide`, and trailing
    sign-offs ("Let me know if…", "Hope this helps", etc.).
    """
    s = text.strip()

    # Strip any standalone triple-backtick line (opening or closing fence).
    # Handles both ```markdown / ```yaml / bare ``` — and works whether the
    # fence is at the boundaries or interleaved with prose.
    s = "\n".join(ln for ln in s.split("\n") if not re.match(r"^\s*```", ln))

    # If the doc has frontmatter, drop everything before the first `---` line.
    # Otherwise drop everything before the first `## Slide` heading.
    lines = s.split("\n")
    fm_start = next((i for i, ln in enumerate(lines) if ln.strip() == "---"), None)
    slide_start = next((i for i, ln in enumerate(lines)
                        if re.match(r"^##\s+(?:slide\s+)?\d+\b", ln.strip(), re.IGNORECASE)), None)
    drop_before = fm_start if fm_start is not None else slide_start
    if drop_before:
        lines = lines[drop_before:]

    # Trim trailing commentary lines (common LLM sign-offs).
    sign_off_re = re.compile(
        r"^(let me know|hope (this|that)|feel free|would you|i('ve| have)|here('s|s)|"
        r"note:|tip:|---*\s*end|that's it|happy to|let me adjust)",
        re.IGNORECASE,
    )
    while lines and (not lines[-1].strip() or sign_off_re.match(lines[-1].strip())):
        lines.pop()

    return "\n".join(lines).strip()


def parse_markdown_text(text: str, doc_dir: Path | None = None, name_hint: str = "pasted") -> dict:
    """Parse a Markdown doc (string) into a content dict.

    `doc_dir` is the directory used to resolve relative image paths and sidecar
    `assets/slide-N.*` files. Pass `None` for paste-from-clipboard flows where
    there is no filesystem context — local image refs are silently dropped (the
    user can upload via the editor) and URLs pass through untouched.
    """
    text = _clean_llm_output(text)
    fm, sections = _parse_doc(text)
    tweaks = fm.get("tweaks") or fm.get("Tweaks") or {}
    fm = _norm({k: v for k, v in fm.items() if k.lower() != "tweaks"})
    fm["tweaks"] = tweaks if isinstance(tweaks, dict) else {}

    slides: list[dict] = []
    images_to_copy: list[tuple[Path, str]] = []

    expected_keys = {"layout", "headline", "body", "image", "eyebrow", "chapter",
                      "quote", "stats", "items", "handle", "subline"}
    for i, raw in enumerate(sections):
        data = None
        try:
            parsed = yaml.safe_load(raw)
        except yaml.YAMLError:
            parsed = None
        if isinstance(parsed, dict):
            normalized = _norm(parsed)
            if any(k in normalized for k in expected_keys):
                data = normalized
        if data is None:
            # Fallback for NotebookLM-style loose Markdown.
            data = _loose_parse_slide(raw, i, len(sections))

        if "layout" not in data:
            data["layout"] = _default_layout(i, len(sections))

        img_value = data.get("image")
        if doc_dir is not None:
            rewritten, jobs = resolve_image(img_value, doc_dir, i + 1)
            if rewritten is not None:
                data["image"] = rewritten
            elif "image" in data:
                del data["image"]
            images_to_copy.extend(jobs)
        else:
            # Paste flow: keep URLs, drop relative-path local refs.
            if img_value and not _is_url(img_value):
                data.pop("image", None)

        slides.append(data)

    out = {
        "name": fm.get("name", name_hint),
        "format": fm.get("format", "instagram-portrait"),
        "caption": fm.get("caption", ""),
        "hashtags": fm.get("hashtags", ""),
        "tweaks": fm.get("tweaks", {}),
        "slides": slides,
        "_images": images_to_copy,
    }
    return out


@register(".md", ".markdown", ".txt")
def import_doc(source: str | Path) -> dict:
    source = Path(source)
    return parse_markdown_text(source.read_text(), doc_dir=source.parent, name_hint=source.stem)
