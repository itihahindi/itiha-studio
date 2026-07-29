"""Read recent posts from X handles via a persistent logged-in browser profile.

You log in ONCE with `bin/vaq-watch login`: a real Chromium window opens on
x.com and you type your credentials into X's own page. Playwright keeps the
resulting session in .watch/profile/ (gitignored). Nothing here stores,
reads, or transmits a password, and no credentials appear in any config file.

Pacing is intentionally slow and jittered. A watchlist read should look like
somebody scrolling their feed, not a scraper. Don't tighten these numbers to
make polls faster; the whole point of the delay is that this runs on an
account you care about.
"""

from __future__ import annotations

import asyncio
import json
import os
import random
from datetime import datetime, timezone

from playwright.async_api import async_playwright

from . import PROFILE_DIR, SESSION_STATE, ensure_state

# Deliberately unhurried. Each handle read costs ~10-25s of wall clock.
_HANDLE_DELAY = (7.0, 18.0)     # seconds between handles
_SCROLL_DELAY = (1.2, 2.8)      # seconds between scroll steps
_SCROLL_STEPS = 3               # ~20-40 posts per handle, enough for a poll

_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
)

# Pulls the fields we cluster on out of the timeline DOM. Kept small and
# defensive: X reshuffles its markup regularly, so anything that doesn't
# match the expected shape is skipped rather than guessed at.
_EXTRACT_JS = """
() => {
  const out = [];
  document.querySelectorAll('article[data-testid="tweet"]').forEach(art => {
    const timeEl = art.querySelector('time');
    if (!timeEl) return;
    const link = timeEl.closest('a');
    const href = link ? link.getAttribute('href') : '';
    const m = href && href.match(/^\\/([^\\/]+)\\/status\\/(\\d+)/);
    if (!m) return;
    const textEl = art.querySelector('div[data-testid="tweetText"]');
    const socialEl = art.querySelector('[data-testid="socialContext"]');
    const social = socialEl ? socialEl.innerText.trim() : '';
    const imgs = [];
    art.querySelectorAll('[data-testid="tweetPhoto"] img').forEach(i => {
      if (i.src) imgs.push(i.src);
    });
    out.push({
      id: m[2],
      author: m[1],
      text: textEl ? textEl.innerText : '',
      ts: timeEl.getAttribute('datetime'),
      url: 'https://x.com' + href.split('?')[0],
      social: social,
      has_video: !!art.querySelector('[data-testid="videoPlayer"], video'),
      images: imgs,
    });
  });
  return out;
}
"""


class NotLoggedIn(RuntimeError):
    pass


async def _jitter(bounds: tuple[float, float]) -> None:
    await asyncio.sleep(random.uniform(*bounds))


async def login() -> bool:
    """Open a headed browser so the user can sign in to X once.

    Returns True once an auth cookie is present. The window stays open until
    login succeeds or the user closes it.
    """
    ensure_state()
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(
            str(PROFILE_DIR),
            headless=False,
            user_agent=_UA,
            viewport={"width": 1280, "height": 900},
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = ctx.pages[0] if ctx.pages else await ctx.new_page()
        await page.goto("https://x.com/login", wait_until="domcontentloaded")

        # flush=True throughout: this runs under a daemon/cron with stdout
        # redirected, where Python block-buffers and nothing appears until
        # the process exits — which is exactly backwards for a prompt that
        # exists to tell you to go and do something.
        print("A browser window is open. Log in to X there, then come back.", flush=True)
        print("Waiting for the session cookie (Ctrl-C to give up)...", flush=True)

        for _ in range(600):  # up to ~10 minutes
            try:
                cookies = await ctx.cookies()
            except Exception:
                break  # window closed
            if any(c["name"] == "auth_token" and c["value"] for c in cookies):
                # Export the session as decrypted JSON while this context is
                # alive and can still read it. Polls restore from this file
                # and never touch the Chromium profile again.
                await asyncio.sleep(2)
                await ctx.storage_state(path=str(SESSION_STATE))
                os.chmod(SESSION_STATE, 0o600)
                print(f"Logged in. Session saved to {SESSION_STATE}", flush=True)
                await ctx.close()
                return True
            await asyncio.sleep(1)

        await ctx.close()
        return False


def have_session() -> bool:
    try:
        state = json.loads(SESSION_STATE.read_text())
    except Exception:
        return False
    return any(
        c.get("name") == "auth_token" and c.get("value")
        for c in state.get("cookies", [])
    )


async def fetch_handles(handles: list[str], per_handle: int = 25) -> list[dict]:
    """Read recent posts for each handle. Skips handles that fail, never raises
    for one bad handle — a protected or renamed account shouldn't kill a poll.
    """
    ensure_state()
    if not have_session():
        raise NotLoggedIn("No X session found. Run `bin/vaq-watch login` first.")

    posts: list[dict] = []

    async with async_playwright() as p:
        # A plain browser + storage_state, NOT a persistent context. The
        # profile's own cookie DB is Keychain-encrypted and a headless
        # relaunch purges what it cannot decrypt.
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
        )
        ctx = await browser.new_context(
            storage_state=str(SESSION_STATE),
            user_agent=_UA,
            viewport={"width": 1280, "height": 1400},
        )
        try:
            page = await ctx.new_page()

            for idx, handle in enumerate(handles):
                handle = handle.lstrip("@")
                if idx:
                    await _jitter(_HANDLE_DELAY)
                try:
                    got = await _fetch_one(page, handle, per_handle)
                    posts.extend(got)
                    print(f"  @{handle}: {len(got)} posts", flush=True)
                except Exception as exc:  # noqa: BLE001 — one handle must not kill the poll
                    print(f"  !! @{handle}: {type(exc).__name__}: {exc}", flush=True)

            # X rotates ct0/auth cookies during a session; write the refreshed
            # state back so the login doesn't age out after a few polls.
            try:
                await ctx.storage_state(path=str(SESSION_STATE))
                os.chmod(SESSION_STATE, 0o600)
            except Exception as exc:  # noqa: BLE001
                print(f"  !! could not refresh session state: {exc}", flush=True)
        finally:
            await ctx.close()
            await browser.close()

    return posts


async def _fetch_one(page, handle: str, per_handle: int) -> list[dict]:
    await page.goto(f"https://x.com/{handle}", wait_until="domcontentloaded")
    try:
        await page.wait_for_selector('article[data-testid="tweet"]', timeout=20_000)
    except Exception:
        return []

    seen: dict[str, dict] = {}
    for _ in range(_SCROLL_STEPS):
        for row in await page.evaluate(_EXTRACT_JS):
            if row["id"] not in seen:
                seen[row["id"]] = row
        if len(seen) >= per_handle:
            break
        await page.mouse.wheel(0, 2400)
        await _jitter(_SCROLL_DELAY)

    out = []
    for row in seen.values():
        social = (row.get("social") or "").lower()
        # A repost is an echo, not an independent source — tag it so the
        # clusterer can refuse to count it toward the handle threshold.
        row["is_repost"] = "repost" in social or "retweet" in social
        row["is_pinned"] = "pinned" in social
        # `author` is who wrote it; `via` is whose timeline we found it on.
        row["via"] = handle
        row["text"] = (row.get("text") or "").strip()
        if not row["text"]:
            continue
        try:
            row["dt"] = datetime.fromisoformat(row["ts"].replace("Z", "+00:00"))
        except Exception:
            row["dt"] = datetime.now(timezone.utc)
        out.append(row)

    out.sort(key=lambda r: r["dt"], reverse=True)
    return out[:per_handle]
