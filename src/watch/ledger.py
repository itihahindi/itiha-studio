"""Format decisions (70% posts / 30% carousels) and duplicate suppression.

The ratio is held by a ledger on disk over a rolling window rather than by a
per-event coin flip, so it actually converges. Editorial overrides still win
on any single event — but because overrides are recorded too, the ledger
pulls the next few events back the other way and the long-run split holds.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from . import LEDGER_PATH, SEEN_PATH, ensure_state

CAROUSEL_TARGET = 0.30
WINDOW = 20  # how many recent builds the ratio is measured over


def _load(path: Path, default):
    try:
        return json.loads(path.read_text())
    except Exception:
        return default


def _save(path: Path, data) -> None:
    ensure_state()
    path.write_text(json.dumps(data, indent=2))


# ── duplicate suppression ────────────────────────────────────────

def seen(fingerprint: str) -> dict | None:
    return _load(SEEN_PATH, {}).get(fingerprint)


def mark_seen(
    fingerprint: str,
    *,
    slug: str,
    fmt: str,
    headline: str = "",
    post_ids: list[str] | None = None,
) -> None:
    data = _load(SEEN_PATH, {})
    data[fingerprint] = {
        "slug": slug,
        "format": fmt,
        "headline": headline,
        "post_ids": sorted(post_ids or []),
        "at": datetime.now(timezone.utc).isoformat(),
    }
    _save(SEEN_PATH, data)


def seen_overlap(post_ids: list[str], *, min_shared: int = 2) -> dict | None:
    """Find an already-handled event that shares posts with this cluster.

    The fingerprint alone is not enough. It derives from the cluster's shared
    entities, and a developing story keeps gaining posts — which changes those
    entities, which changes the fingerprint, so an event that was built an hour
    ago requeues under a new id and gets built twice. Overlapping source posts
    are the stable signal that two clusters are the same story.
    """
    ids = set(post_ids)
    if not ids:
        return None
    for fp, rec in _load(SEEN_PATH, {}).items():
        prior = set(rec.get("post_ids") or [])
        if not prior:
            continue  # recorded before post_ids were tracked
        shared = len(ids & prior)
        if shared >= min_shared or (prior and prior <= ids):
            return {"fingerprint": fp, "shared": shared, **rec}
    return None


# ── 70/30 ────────────────────────────────────────────────────────

def history(limit: int = WINDOW) -> list[dict]:
    return _load(LEDGER_PATH, [])[-limit:]


def carousel_share(limit: int = WINDOW) -> float:
    recent = history(limit)
    if not recent:
        return 0.0
    return sum(1 for r in recent if r.get("format") == "carousel") / len(recent)


def decide(*, fact_count: int = 2, forced: str | None = None) -> tuple[str, str]:
    """Return (format, reason).

    Overrides come first: a story with four or more distinct, separately
    checkable facts genuinely needs the slides, and a single-fact breaking
    item padded to six slides is worse than a good single post.
    """
    if forced in ("post", "carousel"):
        return forced, "forced by caller"
    if fact_count >= 4:
        return "carousel", f"{fact_count} distinct facts — needs the slides"
    if fact_count <= 1:
        return "post", "single-fact item — a carousel would be padding"

    share = carousel_share()
    n = len(history())
    if share < CAROUSEL_TARGET:
        return "carousel", f"carousels at {share:.0%} of last {n}, target {CAROUSEL_TARGET:.0%}"
    return "post", f"carousels at {share:.0%} of last {n}, target {CAROUSEL_TARGET:.0%}"


def record(slug: str, fmt: str, *, fingerprint: str = "") -> None:
    data = _load(LEDGER_PATH, [])
    data.append({
        "slug": slug,
        "format": fmt,
        "fingerprint": fingerprint,
        "at": datetime.now(timezone.utc).isoformat(),
    })
    _save(LEDGER_PATH, data)
