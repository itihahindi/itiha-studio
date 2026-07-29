"""CLI for the Vaq HQ handle watcher.

    bin/vaq-watch login            one-time X sign-in (headed browser)
    bin/vaq-watch poll             read the watchlist, cluster, queue events
    bin/vaq-watch poll --from f    cluster a saved JSON fixture (no browser)
    bin/vaq-watch queue            list queued events awaiting a build
    bin/vaq-watch brief <id>       print one event's full brief
    bin/vaq-watch images <id>      download source images + contact sheet
    bin/vaq-watch check <slug>     lint a design against house style
    bin/vaq-watch dismiss <id>     drop a false positive (no ledger entry)
    bin/vaq-watch status           ledger, ratio, store size
    bin/vaq-watch built <id> <slug>  mark an event built (records the ratio)

`poll` never writes a content.yaml and never publishes. It stops at a brief
in .watch/queue/ for a human-supervised build.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import yaml

if __package__ in (None, ""):  # allow `python src/watch/cli.py`
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from watch import POSTS_DIR, QUEUE_DIR, ROOT, WATCHLIST_PATH, ensure_state
    from watch import cluster as C
    from watch import ledger, route
else:
    from . import POSTS_DIR, QUEUE_DIR, ROOT, WATCHLIST_PATH, ensure_state
    from . import cluster as C
    from . import ledger, route

STORE = POSTS_DIR / "store.json"
STORE_HOURS = 72  # keep three days so slow-burning stories still cluster

# Share of verbatim 5-grams above which "3 sources" is really 1 wire story.
ECHO_LIMIT = 0.25


def _session():
    """Import the browser layer lazily — `poll --from` and `queue` shouldn't
    need Playwright installed at all."""
    if __package__ in (None, ""):
        from watch import session
    else:
        from . import session
    return session


# ── watchlist ────────────────────────────────────────────────────

def load_watchlist() -> dict:
    if not WATCHLIST_PATH.exists():
        sys.exit(f"No watchlist at {WATCHLIST_PATH}. Copy the template and add handles.")
    data = yaml.safe_load(WATCHLIST_PATH.read_text()) or {}
    handles = data.get("handles") or []
    norm = []
    for h in handles:
        if isinstance(h, str):
            norm.append({"handle": h.lstrip("@"), "vertical": None, "family": None})
        elif isinstance(h, dict):
            name = (h.get("handle") or "").lstrip("@")
            if name:
                norm.append({
                    "handle": name,
                    "vertical": h.get("vertical"),
                    "family": h.get("family"),
                })
    data["handles"] = norm
    data["families"] = {
        h["handle"].lower(): h["family"] for h in norm if h.get("family")
    }
    data.setdefault("min_sources", 3)
    data.setdefault("min_families", 2)
    data.setdefault("threshold", 0.32)
    data.setdefault("window_hours", 18)
    data.setdefault("per_handle", 25)
    return data


# ── rolling post store ───────────────────────────────────────────

def load_store() -> dict[str, dict]:
    try:
        raw = json.loads(STORE.read_text())
    except Exception:
        return {}
    cutoff = datetime.now(timezone.utc) - timedelta(hours=STORE_HOURS)
    out = {}
    for pid, row in raw.items():
        try:
            row["dt"] = datetime.fromisoformat(row["ts"].replace("Z", "+00:00"))
        except Exception:
            continue
        if row["dt"] >= cutoff:
            out[pid] = row
    return out


def save_store(store: dict[str, dict]) -> None:
    ensure_state()
    serial = {}
    for pid, row in store.items():
        row = dict(row)
        row.pop("dt", None)
        serial[pid] = row
    STORE.write_text(json.dumps(serial, indent=2))


# ── brief construction ───────────────────────────────────────────

def slugify(words: list[str]) -> str:
    base = "-".join(w.lower() for w in words if w)[:48]
    base = re.sub(r"[^a-z0-9-]+", "-", base).strip("-")
    return re.sub(r"-{2,}", "-", base) or "event"


def build_brief(cl: C.Cluster, idf: dict, wl: dict, design_index=None) -> dict:
    ents = cl.shared_entities()
    nums = cl.shared_numbers()
    terms = cl.top_terms(idf)

    hints = []
    by_handle = {h["handle"].lower(): h.get("vertical") for h in wl["handles"]}
    for h in cl.sources:
        if by_handle.get(h):
            hints.append(by_handle[h])
    vertical, scores = route.route(cl.text, hints)

    # Provisional only — the build session reads the real text and overrides.
    # Distinct corroborated figures is the cheapest proxy for "how many
    # separately checkable facts is this carrying", but bare years are not
    # facts (every story about 2026 mentions 2026) and counting them tipped
    # everything into the carousel override, which would have quietly
    # defeated the 70/30 split.
    hard_nums = [n for n in nums if not re.fullmatch(r"(19|20)\d{2}", n)]
    fact_count = max(1, len(hard_nums) + (1 if len(ents) >= 4 else 0))
    fmt, reason = ledger.decide(fact_count=fact_count)

    echo = cl.echo_score()

    return {
        "fingerprint": cl.fingerprint(),
        "slug_suggestion": slugify((ents[:3] or terms[:3])),
        "sources": cl.sources,
        "source_families": sorted(C.family_set(cl.sources, wl["families"])),
        "all_handles": cl.all_handles,
        "post_count": len(cl.posts),
        "first_seen": cl.first_seen.isoformat(),
        "last_seen": cl.last_seen.isoformat(),
        "vertical": vertical,
        "series_label": route.SERIES_LABEL[vertical],
        "vertical_scores": {k: round(v, 2) for k, v in sorted(
            scores.items(), key=lambda kv: -kv[1]) if v > 0},
        "format": fmt,
        "format_reason": reason,
        "provisional_fact_count": fact_count,
        "echo_score": round(echo, 3),
        "echo_warning": (
            f"{echo:.0%} of one source's phrasing appears verbatim in another — "
            "likely one wire story reprinted, not independent confirmations. "
            "Treat this as ONE source, not three."
        ) if echo >= ECHO_LIMIT else "",
        "shared_entities": ents[:12],
        "shared_numbers": nums[:12],
        "top_terms": terms,
        "needs_verification": _verification_flags(cl.text),
        "possible_duplicate_of": possible_duplicate(ents, terms, design_index or []),
        "posts": [
            {
                # Post id is what dedupes a developing story across polls —
                # see ledger.seen_overlap. Do not drop it from the brief.
                "id": p.raw.get("id", ""),
                "handle": p.handle,
                "author": p.raw.get("author"),
                "url": p.raw.get("url"),
                "ts": p.raw.get("ts"),
                "is_repost": p.is_repost,
                "has_video": p.raw.get("has_video"),
                "images": p.raw.get("images", [])[:4],
                "text": p.raw.get("text"),
            }
            for p in sorted(cl.posts, key=lambda p: p.dt)
        ],
    }


def existing_design_index() -> list[tuple[str, set[str]]]:
    """Tokenised slug + name of every design already on disk.

    The watcher only knows about decks IT built. Hand-made ones are invisible
    to it, so it happily re-proposes a story that was covered manually days
    ago — which is how the Durov charge and the PoJK crackdown both came back.
    Post-id overlap cannot catch that: a hand-built deck has no source posts
    recorded at all.
    """
    out = []
    designs = ROOT / "designs"
    if not designs.is_dir():
        return out
    for d in sorted(designs.iterdir()):
        if not d.is_dir() or not (d / "content.yaml").exists():
            continue
        name = ""
        try:
            name = (yaml.safe_load((d / "content.yaml").read_text()) or {}).get("name", "")
        except Exception:
            pass
        toks = {
            t for t in re.split(r"[^a-z0-9]+", f"{d.name} {name}".lower())
            if len(t) > 2
        }
        if toks:
            out.append((d.name, toks))
    return out


def possible_duplicate(entities: list[str], terms: list[str],
                       index: list[tuple[str, set[str]]],
                       *, min_shared: int = 2, rare_df: int = 2) -> list[str]:
    """Existing designs whose slug/name overlaps this cluster's subject.

    Two shared tokens normally, but ONE is enough when that token is rare
    across the whole designs folder. "bill" or "leak" is shared by many decks
    and means little on its own; "pojk" or "durov" appears in one or two and
    is effectively a subject id. Without the rarity rule the PoJK crackdown
    slipped through, because its only shared token was the one that mattered.
    """
    subject = {t.lower() for t in (entities[:8] + terms[:8])}
    df: dict[str, int] = {}
    for _, toks in index:
        for t in toks:
            df[t] = df.get(t, 0) + 1

    hits = []
    for slug, toks in index:
        shared = subject & toks
        if not shared:
            continue
        distinctive = [t for t in shared if df.get(t, 99) <= rare_df]
        if len(shared) >= min_shared or distinctive:
            hits.append(f"{slug} ({', '.join(sorted(shared))})")
    return hits


_VERIFY_TRIGGERS = [
    ("resignation / appointment", r"\bresign|\bsworn in|\btakes charge|\bappointed|\bportfolio\b"),
    ("court ruling", r"\bverdict|\bjudgment|\bjudgement|\bacquit|\bconvict|\bsentenc|\bstruck down"),
    ("cabinet / legislation", r"\bcabinet\b|\bbill\b|\bamendment\b|\bordinance\b|\bnotified\b|\bgazette"),
    ("casualty toll", r"\bkilled\b|\bdead\b|\bdeath toll|\binjured\b|\bcasualt"),
    ("seat / vote counts", r"\bseats?\b|\bmajority\b|\bvotes?\b|\bmargin\b"),
    ("money figures", r"₹|\bcrore\b|\blakh\b|\bbillion\b|\bmillion\b"),
]


def _verification_flags(text: str) -> list[str]:
    """Institutional/numeric claims that must be checked before print.

    This is the carve-out from CLAUDE.local.md: ordinary contested clips are
    'just make it, I'll verify', but these categories are the costly kind of
    error and get checked properly regardless of how many handles agree.
    """
    low = text.lower()
    return [label for label, pattern in _VERIFY_TRIGGERS if re.search(pattern, low)]


# ── commands ─────────────────────────────────────────────────────

def cmd_login(_args) -> None:
    ok = asyncio.run(_session().login())
    sys.exit(0 if ok else 1)


def cmd_poll(args) -> None:
    ensure_state()
    wl = load_watchlist()
    store = load_store()
    before = len(store)

    if args.from_file:
        rows = json.loads(Path(args.from_file).read_text())
        for r in rows:
            r.setdefault("via", r.get("author", ""))
            r["dt"] = datetime.fromisoformat(r["ts"].replace("Z", "+00:00"))
        print(f"Loaded {len(rows)} posts from {args.from_file}")
    else:
        handles = [h["handle"] for h in wl["handles"]]
        if not handles:
            sys.exit("watchlist.yaml has no handles.")
        print(f"Reading {len(handles)} handles (slow by design)...")
        rows = asyncio.run(_session().fetch_handles(handles, wl["per_handle"]))

    for r in rows:
        store[r["id"]] = r
    save_store(store)
    print(f"Store: {before} → {len(store)} posts (last {STORE_HOURS}h)")

    posts = C.prepare(list(store.values()))
    clusters = C.cluster(
        posts,
        threshold=wl["threshold"],
        window_hours=wl["window_hours"],
    )
    idf = C.build_idf(posts)
    hits = C.fired(
        clusters,
        min_sources=wl["min_sources"],
        min_families=wl["min_families"],
        families=wl["families"],
    )
    near = [c for c in clusters
            if len(c.sources) >= wl["min_sources"] and c not in hits]
    print(f"Clustered {len(posts)} posts → {len(clusters)} clusters, "
          f"{len(hits)} with ≥{wl['min_sources']} sources across "
          f"≥{wl['min_families']} families")
    for c in near:
        fams = ", ".join(sorted(C.family_set(c.sources, wl["families"])))
        print(f"  – held back: {', '.join(c.sources)} — all one family ({fams})")

    design_index = existing_design_index()
    queued = 0
    for cl in hits:
        fp = cl.fingerprint()
        if ledger.seen(fp):
            continue
        # A developing story gains posts, which shifts the shared entities the
        # fingerprint is built from — so the same event returns under a new id.
        # Overlapping source posts are what actually identify it.
        ids = [p.raw.get("id", "") for p in cl.posts]
        dup = ledger.seen_overlap(ids)
        if dup:
            label = dup.get("slug") or "dismissed"
            print(f"  – already handled as {label} "
                  f"({dup['shared']} shared post(s)); skipping {fp}")
            continue
        path = QUEUE_DIR / f"{fp}.json"
        if path.exists() and not args.refresh:
            continue
        brief = build_brief(cl, idf, wl, design_index)
        path.write_text(json.dumps(brief, indent=2, ensure_ascii=False))
        queued += 1
        flag = "  ⚠ echo" if brief["echo_score"] >= ECHO_LIMIT else ""
        if brief["possible_duplicate_of"]:
            flag += "  ⚠ maybe covered: " + brief["possible_duplicate_of"][0]
        print(f"  + {fp}  {brief['format']:8} {brief['vertical']:9} "
              f"{', '.join(brief['sources'][:4])}{flag}")

    print(f"Queued {queued} new event(s) → .watch/queue/")
    if queued:
        print("Nothing has been built or published. Run a build session to draft them.")


def cmd_images(args) -> None:
    """Download every image the source posts uploaded, at full resolution.

    Run this BEFORE drafting. Every deck should carry a real image if the
    handles supplied one, and the only way to know whether they did is to
    fetch and look: contact-sheet first, wire in second. Past harvests have
    returned channel promos, wrong subjects and scanned newspapers.
    """
    path = QUEUE_DIR / f"{args.id}.json"
    if not path.exists():
        sys.exit(f"No queued event {args.id}. Run `bin/vaq-watch queue` to list.")
    brief = json.loads(path.read_text())

    if __package__ in (None, ""):
        from watch import images as IM
    else:
        from . import images as IM

    dest = (ROOT / "designs" / args.slug / "images") if args.slug \
        else (ROOT / ".watch" / "candidates" / args.id)
    recs = IM.harvest(brief.get("posts", []), dest)
    if not recs:
        print("No usable images. Source from Wikimedia Commons, or use the "
              "brand's solid poster treatment for photo-less slides.")
        return

    sheet = IM.contact_sheet(recs, dest / "_contact-sheet.png")
    print(f"\n{len(recs)} candidate(s) in {dest}")
    print(f"Contact sheet: {sheet}")
    print("LOOK AT THE SHEET before wiring any of these into a slide.")


def cmd_queue(_args) -> None:
    files = sorted(QUEUE_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        print("Queue is empty.")
        return
    for f in files:
        b = json.loads(f.read_text())
        print(f"{b['fingerprint']}  {b['format']:8} {b['vertical']:9} "
              f"{len(b['sources'])} src  {b['slug_suggestion']}")
        if b.get("echo_warning"):
            print(f"    ⚠ {b['echo_warning']}")
        if b.get("needs_verification"):
            print(f"    ✓ verify: {', '.join(b['needs_verification'])}")
        for d in b.get("possible_duplicate_of") or []:
            print(f"    ⚠ possibly already covered by designs/{d}")


def cmd_brief(args) -> None:
    path = QUEUE_DIR / f"{args.id}.json"
    if not path.exists():
        sys.exit(f"No queued event {args.id}")
    print(path.read_text())


def stamp_origin(slug: str) -> bool:
    """Mark a design as watcher-built so the home page files it under
    Auto-generated instead of Your projects. Inserted after `name:` for
    visibility, the same way studio.py stamps notion_page_id."""
    yaml_path = ROOT / "designs" / slug / "content.yaml"
    if not yaml_path.exists():
        return False
    text = yaml_path.read_text()
    if re.search(r"^origin:", text, re.M):
        return True
    lines = text.splitlines(keepends=True)
    for i, ln in enumerate(lines):
        if ln.startswith("name:"):
            lines.insert(i + 1, "origin: watcher\n")
            break
    else:
        lines.insert(0, "origin: watcher\n")
    yaml_path.write_text("".join(lines))
    return True


def cmd_built(args) -> None:
    path = QUEUE_DIR / f"{args.id}.json"
    if not path.exists():
        sys.exit(f"No queued event {args.id}")
    b = json.loads(path.read_text())
    fmt = args.format or b["format"]
    ledger.record(args.slug, fmt, fingerprint=args.id)
    ledger.mark_seen(args.id, slug=args.slug, fmt=fmt,
                     post_ids=[p.get("id", "") for p in b.get("posts", [])])
    if not stamp_origin(args.slug):
        print(f"  !! designs/{args.slug}/content.yaml not found — not stamped")
    path.unlink()
    print(f"Recorded {args.slug} as {fmt}. Carousel share now "
          f"{ledger.carousel_share():.0%} over last {len(ledger.history())}.")


# House rules that are cheap to check and expensive to miss in a render.
POST_BODY_MAX_WORDS = 50


def _body_words(text: str) -> int:
    """Count words as a reader sees them: the [red] / _italic_ / **bold**
    markers are formatting, not words."""
    clean = re.sub(r"[\[\]_*]", "", text or "")
    return len(clean.split())


def cmd_check(args) -> None:
    """Lint a design against VaqHQ house style before it goes out."""
    design = ROOT / "designs" / args.slug
    yaml_path = design / "content.yaml"
    if not yaml_path.exists():
        sys.exit(f"No design at designs/{args.slug}")
    raw = yaml_path.read_text()
    data = yaml.safe_load(raw) or {}
    slides = data.get("slides") or []
    problems: list[str] = []

    if "—" in raw:
        n = raw.count("—")
        problems.append(f"{n} em dash{'es' if n > 1 else ''} — house style forbids them")

    for i, s in enumerate(slides, 1):
        if "image_credit" in s:
            problems.append(f"slide {i}: image_credit — attribution goes in the caption")

    # A single-slide design is a "post". Its body has to stay glanceable;
    # anything longer belongs in the caption.
    if len(slides) == 1:
        n = _body_words(slides[0].get("body", ""))
        if n > POST_BODY_MAX_WORDS:
            problems.append(
                f"single post body is {n} words, limit is {POST_BODY_MAX_WORDS}"
            )
        else:
            print(f"  body: {n}/{POST_BODY_MAX_WORDS} words")

    if problems:
        for p in problems:
            print(f"  FAIL  {p}")
        sys.exit(1)
    print(f"designs/{args.slug}: clean ({len(slides)} slide"
          f"{'s' if len(slides) != 1 else ''})")


def cmd_dismiss(args) -> None:
    """Drop an event without building it.

    Clustering groups on shared vocabulary, so two posts about different
    stories involving the same person land together — at min_sources 2 that
    is enough to fire. Those need to go away permanently WITHOUT touching the
    ledger: recording a non-existent build would skew the 70/30 split.
    """
    path = QUEUE_DIR / f"{args.id}.json"
    if not path.exists():
        sys.exit(f"No queued event {args.id}")
    b = json.loads(path.read_text())
    ledger.mark_seen(args.id, slug="", fmt="dismissed", headline=args.reason or "",
                     post_ids=[p.get("id", "") for p in b.get("posts", [])])
    path.unlink()
    print(f"Dismissed {args.id} ({', '.join(b['sources'])})"
          + (f": {args.reason}" if args.reason else ""))
    print("Not recorded in the ledger — the ratio only counts decks that exist.")


def cmd_status(_args) -> None:
    store = load_store()
    hist = ledger.history()
    queued = list(QUEUE_DIR.glob("*.json"))
    print(f"Store:   {len(store)} posts (last {STORE_HOURS}h)")
    print(f"Queue:   {len(queued)} event(s) awaiting a build")
    print(f"Ratio:   {ledger.carousel_share():.0%} carousels over last {len(hist)} "
          f"(target {ledger.CAROUSEL_TARGET:.0%})")
    for r in hist[-8:]:
        print(f"  {r['at'][:16]}  {r['format']:8} {r['slug']}")


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(prog="vaq-watch")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("login").set_defaults(fn=cmd_login)

    p = sub.add_parser("poll")
    p.add_argument("--from", dest="from_file", help="cluster a JSON fixture instead of browsing")
    p.add_argument("--refresh", action="store_true", help="rewrite briefs already queued")
    p.set_defaults(fn=cmd_poll)

    sub.add_parser("queue").set_defaults(fn=cmd_queue)
    sub.add_parser("status").set_defaults(fn=cmd_status)

    p = sub.add_parser("brief")
    p.add_argument("id")
    p.set_defaults(fn=cmd_brief)

    p = sub.add_parser("images")
    p.add_argument("id")
    p.add_argument("--slug", help="download straight into designs/<slug>/images/")
    p.set_defaults(fn=cmd_images)

    p = sub.add_parser("check")
    p.add_argument("slug")
    p.set_defaults(fn=cmd_check)

    p = sub.add_parser("dismiss")
    p.add_argument("id")
    p.add_argument("--reason", help="why it was dropped (kept in seen.json)")
    p.set_defaults(fn=cmd_dismiss)

    p = sub.add_parser("built")
    p.add_argument("id")
    p.add_argument("slug")
    p.add_argument("--format", choices=["post", "carousel"])
    p.set_defaults(fn=cmd_built)

    args = ap.parse_args(argv)
    args.fn(args)


if __name__ == "__main__":
    main()
