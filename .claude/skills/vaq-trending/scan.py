#!/usr/bin/env python3
"""Scan what's actually trending in Indian politics, for VaqHQ post picking.

Google News RSS is the backbone: it is keyless, time-windowed, returns the
publishing outlet per item, and is not behind any of the walls this repo
keeps hitting. One query is noise; the signal is a story that many outlets
covered in the same window, so this runs a beat list, clusters near-duplicate
headlines, and ranks clusters by how many distinct outlets carried them.

    python3 scan.py                 # last 24h, top 12 clusters
    python3 scan.py --hours 48 --top 20
    python3 scan.py --beat economy  # one beat only
    python3 scan.py --json          # machine-readable, for further filtering

Ranking is outlet breadth, not engagement: we cannot see X trends without an
API key, and "many mastheads ran it today" is the closest honest proxy for
"this is the row people are arguing about".
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone, timedelta

UA = "KaviStudios/1.0 (https://itiha.info; itihahindi@gmail.com)"

# Beats, not topics. Each is a Google News query; keep them narrow enough that
# a match is about Indian politics and not a European Parliament press note.
BEATS: dict[str, str] = {
    "parliament": '(Parliament OR "Lok Sabha" OR "Rajya Sabha" OR bill OR ordinance) India',
    "party": "(BJP OR Congress OR RSS OR AAP OR TMC OR DMK) India politics",
    "election": '("Election Commission" OR SIR OR "electoral rolls" OR bypoll OR "assembly election") India',
    "court": '("Supreme Court" OR "High Court") India (verdict OR bench OR plea OR petition)',
    "caste": "(SC/ST OR reservation OR quota OR caste OR OBC) India row",
    "religion": "(temple OR mosque OR waqf OR conversion OR Hindu OR minority) India politics",
    "economy": "(RBI OR GDP OR GST OR budget OR rupee OR inflation OR tariff) India policy",
    "security": '(Army OR "Air Force" OR DRDO OR LoC OR Pakistan OR China) India defence',
    "foreign": "(Trump OR Washington OR Beijing OR visa OR trade deal) India diplomacy",
    "states": "(Uttar Pradesh OR Bihar OR Bengal OR Maharashtra OR Tamil Nadu OR Karnataka) politics",
    "education": "(NEET OR UGC OR IIT OR university OR exam) India policy row",
}

# Outlets whose pages we cannot read (Akamai/Cloudflare or paywall). A story is
# still worth knowing about, but the skill must source the load-bearing fact
# somewhere else, so flag it rather than silently proposing an unverifiable post.
WALLED = {
    "theprint", "news18", "ndtv", "wion", "scroll", "bloomberg", "the ken",
    "economist", "ft.com", "financial times", "wall street journal", "reuters",
    "the hindu",  # metered
}

# Obvious non-India sources that keyword queries drag in.
NOT_INDIA = (
    "europa.eu", "european parliament", "coe.int", "united nations", "un.org",
    "nato", "white house", "gov.uk",
)

STOP = set("""a an the of in on at to for and or with by from is are was were be been
india indian new says say said after before over amid as its his her their this that
new delhi update live latest news video watch full read more big top""".split())


def _fetch(url: str, timeout: int = 20) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def _items(xml: str) -> list[dict]:
    out = []
    for raw in re.findall(r"<item>(.*?)</item>", xml, re.S):
        def tag(name: str) -> str:
            m = re.search(rf"<{name}[^>]*>(.*?)</{name}>", raw, re.S)
            return html.unescape(re.sub("<[^>]+>", "", m.group(1))).strip() if m else ""
        title = tag("title")
        source = tag("source")
        # Google appends " - Outlet" to every headline.
        if source and title.endswith(f" - {source}"):
            title = title[: -len(source) - 3].strip()
        out.append({
            "title": title,
            "link": tag("link"),
            "source": source,
            "published": tag("pubDate"),
        })
    return out


def _key(title: str) -> frozenset:
    words = re.findall(r"[a-z0-9]+", title.lower())
    return frozenset(w for w in words if w not in STOP and len(w) > 2)


def _similar(a: frozenset, b: frozenset) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / min(len(a), len(b))


def scan(hours: int, beats: list[str]) -> list[dict]:
    window = f"when:{max(1, hours // 24)}d" if hours >= 24 else f"when:{hours}h"
    seen_links: set[str] = set()
    pool: list[dict] = []
    for beat in beats:
        q = urllib.parse.quote(f"{BEATS[beat]} {window}")
        url = f"https://news.google.com/rss/search?q={q}&hl=en-IN&gl=IN&ceid=IN:en"
        try:
            items = _items(_fetch(url))
        except Exception as e:  # a dead beat should not kill the scan
            print(f"  (beat {beat} failed: {e})", file=sys.stderr)
            continue
        for it in items:
            low = (it["source"] or "").lower()
            if any(n in low for n in NOT_INDIA):
                continue
            if not it["title"] or it["link"] in seen_links:
                continue
            seen_links.add(it["link"])
            it["beat"] = beat
            it["key"] = _key(it["title"])
            pool.append(it)

    # Cluster near-duplicate headlines: same story, many mastheads.
    clusters: list[dict] = []
    for it in pool:
        for c in clusters:
            if _similar(it["key"], c["key"]) >= 0.55:
                c["items"].append(it)
                c["key"] = c["key"] | it["key"]
                break
        else:
            clusters.append({"key": it["key"], "items": [it]})

    ranked = []
    for c in clusters:
        outlets = {i["source"] for i in c["items"] if i["source"]}
        beats_hit = {i["beat"] for i in c["items"]}
        # Shortest headline is usually the least SEO-stuffed.
        rep = min(c["items"], key=lambda i: len(i["title"]))
        walled = {o for o in outlets if any(w in o.lower() for w in WALLED)}
        ranked.append({
            "headline": rep["title"],
            "outlets": len(outlets),
            "beats": sorted(beats_hit),
            "readable_sources": [
                {"outlet": i["source"], "link": i["link"], "title": i["title"]}
                for i in c["items"]
                if i["source"] and not any(w in i["source"].lower() for w in WALLED)
            ][:4],
            "walled_outlets": sorted(walled),
            "published": rep["published"],
        })
    ranked.sort(key=lambda r: (-r["outlets"], r["headline"]))
    return ranked


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--hours", type=int, default=24)
    ap.add_argument("--top", type=int, default=12)
    ap.add_argument("--beat", action="append", choices=sorted(BEATS), default=None)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    beats = a.beat or sorted(BEATS)
    ranked = scan(a.hours, beats)[: a.top]

    if a.json:
        print(json.dumps(ranked, indent=2))
        return 0

    now = datetime.now(timezone.utc).astimezone()
    print(f"Trending in Indian politics — last {a.hours}h — scanned {now:%Y-%m-%d %H:%M %Z}")
    print(f"beats: {', '.join(beats)}\n")
    for i, r in enumerate(ranked, 1):
        print(f"{i:2d}. [{r['outlets']} outlets · {'/'.join(r['beats'])}] {r['headline']}")
        for s in r["readable_sources"][:3]:
            print(f"      - {s['outlet']}: {s['link'][:110]}")
        if r["walled_outlets"]:
            print(f"      ! walled, do not source from: {', '.join(r['walled_outlets'])}")
        print()
    if not ranked:
        print("nothing clustered — widen --hours or check connectivity")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
