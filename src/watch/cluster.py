"""Group recent posts into events, with no LLM in the loop.

Similarity is IDF-weighted cosine over content tokens, plus a bonus for
shared proper nouns and shared numbers — for news those two carry most of
the "same story" signal ("Pradhan", "₹7,086 crore", "52 days").

An event fires when enough DISTINCT, NON-REPOSTING handles land in the same
cluster inside a time window.
"""

from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass, field
from datetime import timedelta

_STOP = set("""
a an the and or but if then than that this these those there here of in on at to for from by with
as is are was were be been being am do does did doing have has had having will would shall should
can could may might must not no nor so such it its it's he she they them his her their our your my
we you i us me who whom which what when where why how all any both each few more most other some
only own same too very just now new news says said say saying after before over under again once
about into out up down off further while during because until against between among through above
below live latest update updates breaking watch read via amp rt https http co com t co
""".split())

_WORD = re.compile(r"[A-Za-zऀ-ॿ][A-Za-z0-9'ऀ-ॿ]+")
_NUM = re.compile(r"\d[\d,.]*\s*(?:crore|lakh|million|billion|per cent|%|km|kg)?", re.I)
_URL = re.compile(r"https?://\S+")
_MENTION = re.compile(r"@\w+")


def _clean(text: str) -> str:
    text = _URL.sub(" ", text)
    text = _MENTION.sub(" ", text)
    return text.replace("#", " ")


def tokens(text: str) -> set[str]:
    return {
        w.lower() for w in _WORD.findall(_clean(text))
        if len(w) > 2 and w.lower() not in _STOP
    }


def proper_nouns(text: str) -> set[str]:
    """Capitalised words that aren't sentence-initial boilerplate.

    Crude on purpose — a real NER model would be another dependency and this
    only needs to separate 'Pradhan'/'Muzaffarabad' from 'The'/'After'.
    """
    out = set()
    for sentence in re.split(r"[.!?\n]", _clean(text)):
        words = _WORD.findall(sentence)
        for i, w in enumerate(words):
            if i == 0:
                continue  # sentence-initial capital carries no signal
            if w[0].isupper() and w.lower() not in _STOP and len(w) > 2:
                out.add(w.lower())
    return out


def numbers(text: str) -> set[str]:
    out = set()
    for m in _NUM.findall(_clean(text)):
        norm = re.sub(r"\s+", " ", m).strip().lower().rstrip(".,")
        if norm and any(ch.isdigit() for ch in norm):
            out.add(norm)
    return out


@dataclass
class Post:
    raw: dict
    toks: set[str] = field(default_factory=set)
    props: set[str] = field(default_factory=set)
    nums: set[str] = field(default_factory=set)

    @property
    def handle(self) -> str:
        return (self.raw.get("via") or self.raw.get("author") or "").lstrip("@").lower()

    @property
    def is_repost(self) -> bool:
        return bool(self.raw.get("is_repost"))

    @property
    def dt(self):
        return self.raw["dt"]


@dataclass
class Cluster:
    posts: list[Post] = field(default_factory=list)

    @property
    def sources(self) -> list[str]:
        """Distinct handles that posted this ORIGINALLY (reposts excluded)."""
        return sorted({p.handle for p in self.posts if not p.is_repost})

    @property
    def all_handles(self) -> list[str]:
        return sorted({p.handle for p in self.posts})

    @property
    def text(self) -> str:
        return "\n".join(p.raw["text"] for p in self.posts)

    @property
    def first_seen(self):
        return min(p.dt for p in self.posts)

    @property
    def last_seen(self):
        return max(p.dt for p in self.posts)

    def top_terms(self, idf: dict[str, float], n: int = 12) -> list[str]:
        score: dict[str, float] = {}
        for p in self.posts:
            for t in p.toks:
                score[t] = score.get(t, 0.0) + idf.get(t, 1.0)
        # Alphabetical tie-break: these all iterate sets, and Python randomises
        # string hashing per process, so an unbroken tie reorders between runs
        # — which silently changes fingerprint() and requeues built events.
        return [t for t, _ in sorted(score.items(), key=lambda kv: (-kv[1], kv[0]))[:n]]

    def shared_entities(self) -> list[str]:
        """Proper nouns appearing in posts from at least two different handles."""
        by_handle: dict[str, set[str]] = {}
        for p in self.posts:
            by_handle.setdefault(p.handle, set()).update(p.props)
        counts: dict[str, int] = {}
        for props in by_handle.values():
            for w in props:
                counts[w] = counts.get(w, 0) + 1
        return sorted([w for w, c in counts.items() if c >= 2],
                      key=lambda w: (-counts[w], w))

    def shared_numbers(self) -> list[str]:
        by_handle: dict[str, set[str]] = {}
        for p in self.posts:
            by_handle.setdefault(p.handle, set()).update(p.nums)
        counts: dict[str, int] = {}
        for nums in by_handle.values():
            for n in nums:
                counts[n] = counts.get(n, 0) + 1
        return sorted([n for n, c in counts.items() if c >= 2],
                      key=lambda n: (-counts[n], n))

    def echo_score(self) -> float:
        """How much VERBATIM phrasing different handles share (0-1).

        Measured on shared word 5-grams, not on vocabulary overlap. Two
        outlets independently reporting one court verdict will share plenty
        of words ("supreme", "bench", "131st") — that is corroboration and
        must not be penalised. What is NOT independent is a shared run of
        identical phrasing, which means one wire story reprinted three times.
        That looks like three sources and is one.
        """
        originals = [p for p in self.posts if not p.is_repost]
        pairs = [
            (a, b)
            for i, a in enumerate(originals)
            for b in originals[i + 1:]
            if a.handle != b.handle
        ]
        if not pairs:
            return 0.0
        return max(_ngram_overlap(a.raw["text"], b.raw["text"]) for a, b in pairs)

    def fingerprint(self) -> str:
        """Stable id for the event, so a second poll doesn't requeue it."""
        core = self.shared_entities()[:5] or sorted(
            {t for p in self.posts for t in p.toks}
        )[:8]
        return hashlib.sha1("|".join(sorted(core)).encode()).hexdigest()[:16]


_NGRAM_N = 5


def _ngrams(text: str, n: int = _NGRAM_N) -> set[tuple[str, ...]]:
    words = [w.lower() for w in _WORD.findall(_clean(text))]
    if len(words) < n:
        return set()
    return {tuple(words[i:i + n]) for i in range(len(words) - n + 1)}


def _ngram_overlap(a: str, b: str) -> float:
    ga, gb = _ngrams(a), _ngrams(b)
    if not ga or not gb:
        return 0.0
    # Containment, not Jaccard: a short wire snippet lifted whole into a
    # longer post is still copy-paste, and Jaccard would hide it.
    return len(ga & gb) / min(len(ga), len(gb))


def _cosine(a: Post, b: Post, idf: dict[str, float]) -> float:
    inter = a.toks & b.toks
    if not inter:
        return 0.0
    # Dot product of two idf-weighted binary vectors is Σ idf², not Σ idf.
    # Summing idf here understates every match against the ||a||·||b||
    # denominator and pushed real matches below any sane threshold.
    num = sum(idf.get(t, 1.0) ** 2 for t in inter)
    da = math.sqrt(sum(idf.get(t, 1.0) ** 2 for t in a.toks))
    db = math.sqrt(sum(idf.get(t, 1.0) ** 2 for t in b.toks))
    if not da or not db:
        return 0.0
    base = num / (da * db)

    # Proper nouns and figures are the strongest same-event signal in news.
    bonus = 0.06 * min(len(a.props & b.props), 4)
    bonus += 0.08 * min(len(a.nums & b.nums), 3)
    return min(1.0, base + bonus)


# IDF is computed against at least this many documents, even when the store
# holds fewer. See build_idf.
_CORPUS_FLOOR = 50


def build_idf(posts: list[Post]) -> dict[str, float]:
    """IDF against a floored corpus size.

    On a small store, "this term appears in every document" is an artifact of
    the store being tiny, not evidence the term is a stopword — so raw IDF
    weighted three posts about ONE story at nearly nothing and split them
    into three clusters. Flooring the document count fixes that while keeping
    weights proportional to ABSOLUTE document frequency, so genuinely rare
    terms (a place name, a case number) still dominate a match.

    Adding a flat constant to every weight also fixes the small-corpus case,
    but it dilutes those rare shared terms and cost us real cross-source
    matches. Don't swap this back for a floor on the weight.
    """
    n = max(len(posts), _CORPUS_FLOOR)
    df: dict[str, int] = {}
    for p in posts:
        for t in p.toks:
            df[t] = df.get(t, 0) + 1
    return {t: math.log((n + 1) / (c + 0.5)) for t, c in df.items()}


def prepare(rows: list[dict]) -> list[Post]:
    out = []
    for r in rows:
        text = r.get("text") or ""
        if len(text) < 25:
            continue  # too short to cluster meaningfully
        out.append(Post(
            raw=r,
            toks=tokens(text),
            props=proper_nouns(text),
            nums=numbers(text),
        ))
    return out


def cluster(
    posts: list[Post],
    *,
    threshold: float = 0.32,
    window_hours: int = 18,
) -> list[Cluster]:
    """Greedy single-link clustering inside a rolling time window."""
    idf = build_idf(posts)
    window = timedelta(hours=window_hours)
    clusters: list[Cluster] = []

    for post in sorted(posts, key=lambda p: p.dt):
        best: Cluster | None = None
        best_sim = 0.0
        for c in clusters:
            if post.dt - c.last_seen > window:
                continue
            sim = max(_cosine(post, m, idf) for m in c.posts)
            if sim > best_sim:
                best_sim, best = sim, c
        if best is not None and best_sim >= threshold:
            best.posts.append(post)
        else:
            clusters.append(Cluster(posts=[post]))

    return clusters


def fired(
    clusters: list[Cluster],
    *,
    min_sources: int = 3,
    min_families: int = 2,
    families: dict[str, str] | None = None,
) -> list[Cluster]:
    """Clusters backed by enough independent handles, newest event first.

    A raw handle count is not independence. Accounts inside one amplification
    network carry each other's claims within minutes, reworded enough that
    echo_score stays low — three of them is one claim propagating, not three
    confirmations. Requiring sources from at least two families is what stops
    an aligned cluster from firing on its own. A handle with no declared
    family counts as its own.
    """
    families = families or {}
    hits = []
    for c in clusters:
        srcs = c.sources
        if len(srcs) < min_sources:
            continue
        if len(family_set(srcs, families)) < min_families:
            continue
        hits.append(c)
    hits.sort(key=lambda c: c.last_seen, reverse=True)
    return hits


def family_set(handles: list[str], families: dict[str, str]) -> set[str]:
    return {families.get(h.lower(), f"solo:{h.lower()}") for h in handles}
