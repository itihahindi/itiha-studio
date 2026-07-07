# Handoff: Vaq HQ — Vertical Type System

> Brand-kit reference received 2026-07-07 (pasted into Claude Code; mojibake
> from the transfer fixed by hand). This is the canonical identity source for
> the `vaq-hq` brand pack. The sibling `vaq-hq-verticals.html` is the
> framework-free HTML/CSS reference; all tokens live in its `:root` block.

## Overview
Vaq HQ is a digital political-media channel (live news, geopolitics, political history, Indian politics). This handoff documents the **vertical type system**: one shared brand identity that expresses four content "verticals" (shows) through distinct typographic treatments rather than four separate brands. The goal — inspired by how Vox / Bloomberg / NYT run a single type system with per-section signatures — is that each vertical is instantly recognizable while everything still reads as unmistakably Vaq HQ.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and treatments are final. Recreate pixel-accurately using this codebase's patterns. Exact values in **Design Tokens** below.

## The Four Verticals (the core of the system)
All four share the same skeleton. Only the **surface, typeface, weight, case, and accent cue** change. Orange (`#F4631E`) is the hero constant everywhere.

**01 · Current Affairs — "Live"**
- Surface: solid orange `#F4631E`; index/label text in dark `#3A1402`.
- Show name + headline: **Archivo (900 / 800), UPPERCASE**, letter-spacing `-.02em`/`-.025em`.
- Cue: `● LIVE` in orange + show label "Vaq HQ Breaking".
- Voice: urgent, loud, thumbnail/lower-third ready.

**02 · Geopolitics — "The Briefing"**
- Surface: `#15263B` with a **3px orange accent border**.
- Show name + headline: **Newsreader, Semibold (600)**, letter-spacing `-.01em`, line-height `1.06`.
- Cue: solid orange badge "GEOPOLITICS" + "The Briefing".
- Voice: authoritative, composed, masthead gravitas.

**03 · Political History — "The Long View"**
- Surface: deep `#0E1A29`.
- Show name + headline: **Newsreader, ITALIC (500)** — the italic signals "step back in time"; a headline word can be emphasized in orange italic.
- Cue: outline orange badge "HISTORY" + "The Long View".
- Voice: reflective, editorial, softer register of the same serif.

**04 · Indian Politics — "Ground Report"**
- Surface: `#15263B`.
- Show name + headline: **Hanken Grotesk, 800**, letter-spacing `-.02em`.
- Cue: solid orange badge "GROUND REPORT" + a **Devanagari companion** ("ज़मीनी हक़ीक़त", Noto Serif Devanagari 600) for Hindi supers.
- Voice: clean, modern, direct — the home-turf sans.

## Shared Mark
- Logo: inline SVG "V-Transmit" mark (a chevron **V** with two signal arcs). Strokes: chevron + inner arc orange `#F4631E`, outer arc slate `#4A6076`; `stroke-linecap/linejoin: round`, chevron `stroke-width: 15`. (SVG source in `vaq-hq-verticals.html`.)
- Wordmark: **Newsreader 600**, "Vaq" white + "HQ" orange.
- The mark and wordmark **never change** between verticals — that constant is what makes the four voices feel like variety *within* one channel.
- Full multi-colorway logo studies (chakra, heritage marks) exist elsewhere in the user's project — ask if needed.

## Design Tokens

**Colors**
- Background: `#0A1119`
- Surface (card body): `#101D2E`
- Surface alt (sidebar / strip): `#15263B`
- Surface deep (history sidebar): `#0E1A29`
- **Accent / hero orange: `#F4631E`** (never changes per vertical)
- Ink on orange: `#3A1402`; muted on orange: `#7A2C08`
- Headline ink: `#FFFFFF`
- Body: `#9FB0C0`
- Muted (kickers/meta): `#6E8093`; muted-2: `#5C6E80`
- Body text default: `#E6ECF2`
- Hairlines: `rgba(255,255,255,.07)`, `.10`, `.12`

**Typefaces** (Google Fonts)
- Serif / headline voice: **Newsreader** (400–700, incl. italic) — fallback Georgia, serif
- Sans / body + one display: **Hanken Grotesk** (400–800) — fallback system-ui
- Heavy display: **Archivo** (500–900) — used at 800/900
- Mono / kickers & labels: **Space Mono** (400/700)
- Devanagari companion: **Noto Serif Devanagari** (500–700)

**Type scale (from the desktop reference; rescale for 1080×1350 slides)**
- H1 title: 52px / 600 / -.015em / 1.02, Newsreader
- Section headline (h2): 32–34px, weight & family per vertical, line-height 1.0–1.06
- Lede: 16.5px / 1.65 · Body: 15px / 1.55
- Kicker/meta: 11–12px mono, letter-spacing .14–.2em, uppercase
- Badge label: 9.5px sans 700/800, letter-spacing .12em; badge radius 3px, padding 3px 7px

**Spacing / shape**
- Card radius: 16px; hairline 1px borders
- Reference layout details (230px sidebar grid etc.) describe the desktop
  design-system page, not Instagram slides — IG slide layouts come from the
  user's separate IG mocks.

## Status in this repo
- Pack built 2026-07-07 from this kit + `vaq-hq-instagram-system.html`
  (the IG mock adds per-vertical accents: geo #2F6BE0, hist #9A3F73,
  india #0FA08C — orange stays the channel hero).
- Six layouts implemented (cover, story, split-story, quote, stat, closing),
  per-slide `vertical:` + `surface:` knobs, V-Transmit mark + wordmark chrome.
- Claude-Project prompts in prompts.js are a working draft pending the final
  Vaq HQ voice guide; examples.yaml still needs worked examples.
