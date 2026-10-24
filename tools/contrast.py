"""Contrast report for the Itiha palettes.

Every text-on-ground pair a palette actually paints is listed here with the
role it plays, then scored two ways:

  WCAG 2.x ratio   the legal floor — 4.5:1 normal text, 3:1 large; AAA 7:1
  APCA Lc          WCAG 3's perceptual contrast — 90 preferred for body
                   copy, 75 body minimum, 60 headlines, 45 big display only

Translucent text (rgba of the fg at 0.6 etc.) is composited onto its ground
before scoring, which is how the screen sees it. Run:

  python tools/contrast.py            # table, failures flagged
  python tools/contrast.py --json     # machine-readable
"""
from __future__ import annotations

import json
import sys

# Role → (minimum WCAG ratio, minimum APCA Lc)
FLOORS = {
    "body":     (7.0, 75),   # paragraphs, list text, captions people read
    "headline": (4.5, 60),   # display type ≥ 60px
    "accent":   (4.5, 60),   # *accent* words inside headlines
    "meta":     (4.5, 60),   # footer, labels, sublines (≥ 20px bold)
    "graphic":  (3.0, 45),   # rules, marker dots, numerals ≥ 100px
}


def _hex(c: str) -> tuple[float, float, float]:
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _mix(fg: str, bg: str, alpha: float) -> str:
    f, b = _hex(fg), _hex(bg)
    return "#" + "".join(f"{round((alpha * x + (1 - alpha) * y) * 255):02X}" for x, y in zip(f, b))


def wcag(fg: str, bg: str) -> float:
    def lum(c):
        def ch(v):
            return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
        r, g, b = (ch(v) for v in _hex(c))
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    a, b = lum(fg), lum(bg)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def apca(fg: str, bg: str) -> float:
    """APCA-W3 0.0.98G-4g. Returns |Lc| (polarity dropped)."""
    def y(c):
        r, g, b = (v ** 2.4 for v in _hex(c))
        return 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    t, s = y(fg), y(bg)
    clamp = lambda v: v if v > 0.022 else v + (0.022 - v) ** 1.414
    t, s = clamp(t), clamp(s)
    if abs(s - t) < 0.0005:
        return 0.0
    if s > t:
        sapc = (s ** 0.56 - t ** 0.57) * 1.14
        out = 0 if sapc < 0.1 else sapc - 0.027
    else:
        sapc = (s ** 0.65 - t ** 0.62) * 1.14
        out = 0 if sapc > -0.1 else sapc + 0.027
    return abs(out * 100)


# ── Palettes ──────────────────────────────────────────────────────────
# Mirror of LOOK_CSS in shared/brands/itiha/slides-shared.jsx. `muted` is
# the alpha the look uses for secondary text (the --it-m* ramp's floor).
PALETTES = {
    "classic": dict(
        ground="#0D0D0D", fg="#E8DCC8", accent_d="#C0392B", hl_d="#E2604F", on_accent_d="#FFFFFF",
        paper="#FAF5EE", on_paper="#1A1A1A", paper_ink="#0D0D0D", accent_l="#C0392B", hl_l="#C0392B", on_accent_l="#FFFFFF",
        solid="#C0392B", on_solid="#FFFFFF", solid_accent="#0D0D0D", muted=0.55,
    ),
    # Turmeric yellow + ink. Poster register (Vox/AJ+ family, warmer yellow).
    "haldi": dict(
        ground="#111111", fg="#FFF8E7", accent_d="#FFD23F", hl_d="#FFD23F", on_accent_d="#0A0A0A",
        paper="#FFD23F", on_paper="#0A0A0A", paper_ink="#0A0A0A", accent_l="#0A0A0A", hl_l="#1F2AD1", on_accent_l="#FFD23F",
        solid="#FFD23F", on_solid="#0A0A0A", solid_accent="#1F2AD1", muted=0.8,
    ),
    # Ultramarine (miniature-painting lapis) + lotus pink + lemon.
    "neel": dict(
        ground="#2323D6", fg="#FFFFFF", accent_d="#FFF04D", hl_d="#FFF04D", on_accent_d="#14105A",
        paper="#FFC2E2", on_paper="#14105A", paper_ink="#14105A", accent_l="#2323D6", hl_l="#2323D6", on_accent_l="#FFFFFF",
        solid="#FFF04D", on_solid="#14105A", solid_accent="#2323D6", muted=0.85,
    ),
}


def pairs(p: dict) -> list[tuple[str, str, str, str]]:
    """(role, label, fg, bg) for every pair the slides paint."""
    m = p["muted"]
    return [
        ("body",     "body on dark",              p["fg"],        p["ground"]),
        ("headline", "headline on dark",          p["fg"],        p["ground"]),
        ("accent",   "*accent* on dark",          p["hl_d"],      p["ground"]),
        ("graphic",  "accent mark on dark",       p["accent_d"],  p["ground"]),
        ("meta",     f"muted text on dark ({m})", _mix(p["fg"], p["ground"], m), p["ground"]),
        ("meta",     "text on accent fill (dark)", p["on_accent_d"], p["accent_d"]),
        ("body",     "body on light",             p["on_paper"],  p["paper"]),
        ("headline", "headline on light",         p["paper_ink"], p["paper"]),
        ("accent",   "*accent* on light",         p["hl_l"],      p["paper"]),
        ("graphic",  "accent mark on light",      p["accent_l"],  p["paper"]),
        ("meta",     f"muted text on light ({m})", _mix(p["on_paper"], p["paper"], m), p["paper"]),
        ("meta",     "text on accent fill (light)", p["on_accent_l"], p["accent_l"]),
        ("headline", "headline on poster",        p["on_solid"],  p["solid"]),
        ("accent",   "*accent* on poster",        p["solid_accent"], p["solid"]),
    ]


def report(names: list[str] | None = None) -> list[dict]:
    rows = []
    for name, p in PALETTES.items():
        if names and name not in names:
            continue
        for role, label, fg, bg in pairs(p):
            w, lc = wcag(fg, bg), apca(fg, bg)
            fw, fl = FLOORS[role]
            rows.append(dict(palette=name, role=role, pair=label, fg=fg, bg=bg,
                             wcag=round(w, 2), apca=round(lc, 1), ok=w >= fw and lc >= fl))
    return rows


def main(argv: list[str]) -> int:
    names = [a for a in argv[1:] if not a.startswith("--")]
    rows = report(names or None)
    if "--json" in argv:
        print(json.dumps(rows, indent=1))
        return 0
    cur = None
    for r in rows:
        if r["palette"] != cur:
            cur = r["palette"]
            print(f"\n{cur}")
        flag = "  " if r["ok"] else "!!"
        print(f" {flag} {r['pair']:<32} {r['fg']} on {r['bg']}  {r['wcag']:>5.2f}:1  Lc {r['apca']:>5.1f}  [{r['role']}]")
    bad = [r for r in rows if not r["ok"]]
    print(f"\n{len(rows) - len(bad)}/{len(rows)} pairs pass." + (" Failures marked !!" if bad else ""))
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
