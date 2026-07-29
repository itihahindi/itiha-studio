"""Handle-watching → event-detection → draft-queue pipeline for Vaq HQ.

Reads recent posts from a watchlist of X handles, groups them into events,
and queues an event for a build when enough INDEPENDENT handles converge on
it. Nothing in here calls an LLM API — clustering is plain arithmetic. The
writing step happens in a Claude Code session that reads the queue.

Deliberate design decisions, so they don't get "fixed" later:

  * The pipeline stops at a queued brief. It never writes content.yaml and
    never publishes. Three handles agreeing is corroboration of virality,
    not of fact, and institutional/numeric claims need a human.
  * Reposts don't count toward the handle threshold. A retweet is an echo,
    not a second source.
  * The 70/30 post:carousel split is held by a ledger on disk, not by a
    coin flip, so it converges over time instead of per-run.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATE_DIR = ROOT / ".watch"
PROFILE_DIR = STATE_DIR / "profile"
# Decrypted cookies as JSON. We do NOT read the session back out of
# Chromium's own profile DB: on macOS those values are encrypted against the
# login Keychain, a headless relaunch cannot decrypt them, and Chromium's
# response to cookies it cannot decrypt is to DELETE them — so polling
# silently destroys the very session it needs. See session.py.
SESSION_STATE = STATE_DIR / "x-session.json"
QUEUE_DIR = STATE_DIR / "queue"
POSTS_DIR = STATE_DIR / "posts"
LEDGER_PATH = STATE_DIR / "ledger.json"
SEEN_PATH = STATE_DIR / "seen.json"
WATCHLIST_PATH = ROOT / "watchlist.yaml"


def ensure_state() -> None:
    for d in (STATE_DIR, PROFILE_DIR, QUEUE_DIR, POSTS_DIR):
        d.mkdir(parents=True, exist_ok=True)
