"""Brand registry for the Kavi Studios shell.

Each brand ships an asset pack under shared/brands/<slug>/ containing:
  slides-shared.jsx   tokens + primitives (must export window.BrandContext)
  layouts.jsx         slide components (must export window.LAYOUTS)
  manifest.js         editor field schema (window.MANIFEST*)
  prompts.js          window.BRAND identity + Claude-Project prompts
  tokens.css          palette vars + @import for the brand's fonts
  examples.yaml       worked examples uploaded to the Claude Project

A design opts in via the top-level `brand:` key in content.yaml (defaults to
itiha so pre-multi-brand designs keep working). The servers substitute the
__BRAND__ placeholder in render-host.html with this slug.
"""

BRANDS = {
    "itiha": "Itiha",
    "vaq-hq": "VAQ HQ",
}

DEFAULT_BRAND = "itiha"
