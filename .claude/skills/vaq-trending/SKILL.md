---
name: vaq-trending
description: Scan what is trending in Indian politics right now and return a ranked list of VaqHQ post candidates, each with a hook, a format, the load-bearing fact and a source that is actually readable. Use when asked what's trending, what should we post, for a daily VAQ brief, or for post ideas.
---

# VaqHQ trending brief

Produces a **pick list**, not a deck. The user reads it, says "build 2 and 5",
and only then do you write `designs/<slug>/content.yaml`.

## 1. Scan

```bash
./.venv/bin/python .claude/skills/vaq-trending/scan.py --hours 24 --top 12
```

`--beat` limits to one of: caste, court, economy, education, election, foreign,
parliament, party, religion, security, states. `--json` for machine-readable.

The script queries Google News RSS across those beats, drops non-India sources,
clusters near-duplicate headlines and ranks clusters by **how many distinct
outlets carried the story**. That is the honest proxy for "trending": we have no
X API key, so engagement is invisible, but twenty mastheads running the same row
today is a real signal.

**The links it prints are Google redirect URLs.** They do not resolve with curl
(Google serves a JS hop). Treat them as identifiers. To read the story, either
`WebSearch` the headline and fetch the publisher directly, or go to the outlet's
own section page.

**Walled outlets are flagged per cluster.** ThePrint, News18, NDTV, WION, Scroll,
Bloomberg, Reuters and metered The Hindu will not open. A story is still worth
proposing, but the load-bearing fact has to come from somewhere readable: ANI,
PTI via OrissaPOST or Assam Tribune, FPJ, Siasat, Business Standard, Deccan
Herald, Livemint, Indian Express, LiveLaw and Bar and Bench for courts, PIB for
government action, and the primary source itself wherever one exists (NCRB,
RBI, TIC, MoSPI, a judgment, a bill).

## 2. Filter before proposing

Drop a candidate if any of these is true:

- **The core fact only exists behind a wall.** If you cannot verify it, you
  cannot write a slide about it.
- **It is a claim about a named private individual that is still being
  investigated**, unless the deck can be built on what is on record (the FIR
  exists, the institute said X) rather than on whether the allegation is true.
- **There is no number, document or on-record quote in it.** VaqHQ decks are
  built on checkable things; a pure reaction row gives you nothing to put on
  slide 4.

## 3. Angle

The standing editorial instruction (see `shared/brands/vaq-hq/AUTHORING.md`)
is pro-Hindutva and right-leaning, and it lands hardest when every load-bearing
claim is checkable. So for each candidate, find the fact that carries the lean
by itself: a tender that demands source code, a protest whose own demands are
addressed to Islamabad, an Act that a government made stricter twice. Never
reach for an adjective where a number will do, and never assert a ranking or a
motive the sources do not support.

If the honest read cuts against the lean, say so in the brief rather than
burying it. A deck that gets fact-checked in the comments costs more than a
deck not posted.

## 4. Output

For each candidate, in ranked order:

```
N. HOOK           A cover headline. Number or sting in the first four words.
   Format         post (1 slide) · short carousel (5-6) · carousel (8-10) · reel
   Why it works   One line: the argument, and who it annoys.
   Load-bearing   The single fact the deck stands on, with the number.
   Source         Outlet + how to verify (a readable link, or "search <headline>").
   Chartable      What data exists for a bar/line slide, or "none".
   Watch out      Sub judice, named individuals, a figure only one outlet reports,
                  a claim that needs attribution rather than assertion. Or "clean".
```

End with one line: which candidate you would build first and why.

## 5. Standing guardrails

- **Suicide, death or grief stories**: include Tele-MANAS 14416 and KIRAN
  1800-599-0019 in the caption, and do not put an accusation on the cover while
  an investigation is days old.
- **A named accused is not a convict.** "Booked", "named in an FIR" and
  "arrested" are three different things; check which one is true today.
- **Images**: public domain or CC from Wikimedia Commons (needs the contact-URL
  User-Agent), credited by author and licence in the caption, in hairline
  frames. Never full-bleed with a dark veil, that is Itiha's language.
- **Voice**: no em dashes, two short sentences a slide, body under 50 words,
  `loop:` on every interior slide. No "not X, it's Y" constructions, no slogan
  parallelism, no fragment triplets.

## 6. If asked to build one

Read `shared/brands/vaq-hq/AUTHORING.md` first, then write the deck into
`designs/<kebab-slug>/content.yaml`, render with
`./.venv/bin/python src/render.py <slug>`, check the overflow warnings the
renderer prints, and hand back the studio link from `bin/kavi status`.
