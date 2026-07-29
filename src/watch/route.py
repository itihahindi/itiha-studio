"""Route a detected event to a Vaq HQ vertical (desk).

Mirrors the desk map in CLAUDE.local.md. Scoring is keyword hits weighted by
specificity — a handle-level hint in watchlist.yaml wins over keywords, and
keywords win over the 'live' default.
"""

from __future__ import annotations

import re

# Ordered most-specific first. Each entry: (vertical, weight, [terms])
# Terms are matched as whole words, case-insensitively, against the pooled
# text of every post in a cluster.
_RULES: list[tuple[str, float, list[str]]] = [
    ("legal", 3.0, [
        "supreme court", "high court", "bench", "verdict", "judgment", "judgement",
        "petition", "plea", "affidavit", "chargesheet", "fir", "acquitted",
        "convicted", "bail", "summons", "contempt", "tribunal", "nclt", "cji",
        "justice", "litigation", "defamation", "injunction", "writ",
    ]),
    ("tech", 3.0, [
        "data breach", "breach", "leaked", "hacked", "hackers", "ransomware",
        "cybersecurity", "cert-in", "server", "database", "encryption",
        "platform", "app", "ai", "algorithm", "outage", "phishing", "malware",
        "telegram", "whatsapp", "openai", "startup", "semiconductor",
    ]),
    ("sports", 3.0, [
        "match", "innings", "wicket", "goal", "olympics", "medal", "tournament",
        "world cup", "series", "captain", "squad", "final", "semifinal",
        "cricket", "football", "hockey", "badminton", "kabaddi", "athlete",
        "commonwealth", "asian games",
    ]),
    ("briefing", 2.5, [
        "border", "loc", "lac", "china", "pakistan", "bangladesh", "nepal",
        "myanmar", "sri lanka", "afghanistan", "russia", "ukraine", "israel",
        "united nations", "bilateral", "treaty", "diplomat", "embassy",
        "ministry of external affairs", "mea", "geopolitics", "trade deal",
        "sanctions", "summit", "visa", "corridor",
    ]),
    ("longview", 2.0, [
        "anniversary", "years ago", "history", "historic", "war of",
        "independence", "partition", "colonial", "empire", "dynasty",
        "commemorat*", "legacy", "archive",
    ]),
    ("ground", 2.0, [
        "protest", "protesters", "police", "lathi", "detained", "arrested",
        "rally", "march", "dharna", "strike", "bandh", "agitation",
        "water cannon", "crackdown", "clash", "violence", "assembly",
        "constituency", "election", "poll", "voters", "cm ", "chief minister",
        "bjp", "congress", "opposition", "parliament", "lok sabha",
        "rajya sabha", "minister", "cabinet", "resign",
    ]),
    ("live", 1.0, [
        "breaking", "just in", "developing", "alert", "confirmed", "sources say",
    ]),
]

VERTICALS = ("live", "briefing", "longview", "ground", "sports", "legal", "tech")

SERIES_LABEL = {
    "live": "VAQ HQ BREAKING",
    "briefing": "THE BRIEFING",
    "longview": "THE LONG VIEW",
    "ground": "GROUND REPORT",
    "sports": "THE ARENA",
    "legal": "THE DOCKET",
    "tech": "CATHODE",
}


def route(text: str, handle_hints: list[str] | None = None) -> tuple[str, dict[str, float]]:
    """Pick a vertical for pooled cluster text.

    handle_hints are per-handle `vertical:` values from watchlist.yaml; each
    contributes a fixed nudge so a wire account tagged `sports` biases its own
    stories without overriding a strong keyword signal from another desk.
    """
    low = text.lower()
    scores: dict[str, float] = {v: 0.0 for v in VERTICALS}

    for vertical, weight, terms in _RULES:
        for term in terms:
            term = term.strip()
            # A trailing '*' means prefix match ("commemorat*" → commemorating).
            if term.endswith("*"):
                pattern = r"\b" + re.escape(term[:-1])
            else:
                pattern = r"\b" + re.escape(term) + r"\b"
            hits = len(re.findall(pattern, low))
            if hits:
                # Diminishing returns: the 5th mention of "police" is not 5x
                # the signal of the first.
                scores[vertical] += weight * (1 + 0.35 * (min(hits, 4) - 1))

    for hint in handle_hints or []:
        if hint in scores:
            scores[hint] += 2.0

    best = max(scores.items(), key=lambda kv: kv[1])
    if best[1] <= 0:
        return "live", scores
    return best[0], scores
