// Layout manifest — declarative field definitions for every layout.
// The side-panel editor renders forms from this manifest, so adding a new
// field to a layout component means:
//   1. Use the field in layouts.jsx.
//   2. Add an entry here.
// The editor picks it up automatically.

window.MANIFEST = {

  // ─── Carousel layouts ────────────────────────────────────────

  cover: {
    label: "Cover",
    summary: "Opening slide — image, eyebrow, big headline, swipe meta.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark", help: "Light = off-white background, near-black text." },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "", help: "Overlay style. Combine multiple with comma: \"grain,vignette\"." },
      { key: "eyebrow",       type: "text",     label: "Eyebrow",        help: "Top-left red label." },
      { key: "eyebrow_meta",  type: "text",     label: "Eyebrow meta",   help: "Text next to the eyebrow with a divider." },
      { key: "headline",      type: "textarea", label: "Headline",       help: "Use *word* for Sindoor Red accent. Newlines become line breaks." },
      { key: "subline",       type: "text",     label: "Subline" },
      { key: "swipe_meta",    type: "text",     label: "Footer meta",    help: "e.g. \"Swipe ▸ · 9 Slides · 4 min read\"" },
      { key: "image",         type: "image",    label: "Cover image" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_position",type: "text",     label: "Image crop",     help: "CSS object-position, e.g. \"center 35%\"" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 188 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10, help: "Nudge headline. Negative = up, positive = down." },
    ],
  },

  story: {
    label: "Story",
    summary: "Image + a single text block (eyebrow, divider, headline, optional body).",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark", help: "Light = off-white background, near-black text." },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "", help: "Overlay style. Combine multiple with comma: \"grain,vignette\"." },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow", help: "Hidden unless showChapterLabels is on." },
      { key: "headline",      type: "textarea", label: "Headline",        help: "Use *word* for red accent." },
      { key: "subline",       type: "text",     label: "Sub-headline" },
      { key: "body",          type: "textarea", label: "Body",            help: "[word] = red emphasis · _word_ = italic · **word** = bold." },
      { key: "block_y",       type: "select",   label: "Text position",   options: ["top","middle","bottom"], default: "bottom" },
      { key: "image",         type: "image",    label: "Image" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_position",type: "text",     label: "Image crop" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",   step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 120 },
      { key: "body_size",     type: "number",   label: "Body size (px)",  default: 28 },
    ],
  },

  "split-story": {
    label: "Split Story",
    summary: "Headline pinned high, body pinned low — image fills between them.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "", help: "Overlay style. Combine multiple with comma: \"grain,vignette\"." },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "subline",       type: "text",     label: "Sub-headline" },
      { key: "body",          type: "textarea", label: "Body" },
      { key: "image",         type: "image",    label: "Image" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_position",type: "text",     label: "Image crop",     help: "CSS object-position, e.g. \"center 35%\"" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0, step: 0.05 },
      { key: "headline_y",    type: "number",   label: "Headline y (px from top)", default: 140 },
      { key: "body_y",        type: "number",   label: "Body y (px from bottom)",  default: 200 },
      { key: "headline_size", type: "number",   label: "Headline size (px)",       default: 132 },
      { key: "body_size",     type: "number",   label: "Body size (px)",           default: 28 },
    ],
  },

  quote: {
    label: "Pull Quote",
    summary: "Image, headline up top, big pull quote in middle, body below.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "", help: "Overlay style. Combine multiple with comma: \"grain,vignette\"." },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "quote",         type: "textarea", label: "Pull quote",      help: "Newlines preserved. Wrap in your own quotation marks." },
      { key: "attribution",   type: "text",     label: "Attribution",     help: "e.g. \"— Recruiter's pitch, 1860s\"" },
      { key: "body",          type: "textarea", label: "Body" },
      { key: "image",         type: "image",    label: "Image" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "quote_size",    type: "number",   label: "Quote size (px)", default: 64 },
      { key: "body_size",     type: "number",   label: "Body size (px)",  default: 26 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10, help: "Nudge headline. Negative = up, positive = down." },
      { key: "body_offset_y",     type: "number", label: "Body offset Y (px)",     default: 0, step: 10, help: "Nudge quote+body. Negative = up, positive = down." },
    ],
  },

  stat: {
    label: "Stat Comparison",
    summary: "Two-column number comparison with optional supporting body.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "", help: "Overlay style. Combine multiple with comma: \"grain,vignette\"." },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline" },
      {
        key: "stats", type: "array", label: "Stats",
        item: {
          fields: [
            { key: "label",     type: "text",  label: "Label (above)" },
            { key: "value",     type: "text",  label: "Value (big)",   help: "Numerals + Bebas; a trailing % renders in red automatically." },
            { key: "value_red", type: "bool",  label: "Value all-red" },
            { key: "sublabel",  type: "text",  label: "Sub-label (below)" },
          ],
        },
      },
      { key: "body",          type: "textarea", label: "Body (below)" },
      { key: "image",         type: "image",    label: "Background image" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_position",type: "text",     label: "Image crop",     help: "CSS object-position, e.g. \"center 35%\"" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)", default: 0.82, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 124 },
      { key: "body_size",     type: "number",   label: "Body size (px)", default: 26 },
      { key: "stat_size",     type: "number",   label: "Stat value size (px)", default: 168 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10, help: "Nudge headline. Negative = up, positive = down." },
      { key: "body_offset_y",     type: "number", label: "Body offset Y (px)",     default: 0, step: 10, help: "Nudge body. Negative = up, positive = down." },
    ],
  },

  "dates-grid": {
    label: "Dates Grid",
    summary: "2×2 grid of (date, fact) cells.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "", help: "Overlay style. Combine multiple with comma: \"grain,vignette\"." },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline" },
      {
        key: "items", type: "array", label: "Cells (4 recommended)",
        item: {
          fields: [
            { key: "date", type: "text",     label: "Date / period" },
            { key: "text", type: "textarea", label: "Fact",          help: "Supports body micro-syntax." },
          ],
        },
      },
      { key: "image",         type: "image",    label: "Background image" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_position",type: "text",     label: "Image crop",     help: "CSS object-position, e.g. \"center 35%\"" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)", default: 0.84, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 132 },
      { key: "date_size",     type: "number",   label: "Date size (px)",     default: 52 },
      { key: "text_size",     type: "number",   label: "Cell text size (px)", default: 22 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10, help: "Nudge headline. Negative = up, positive = down." },
    ],
  },

  closing: {
    label: "Closing",
    summary: "Final slide: big headline, horizontal stats row, body, follow handle.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "", help: "Overlay style. Combine multiple with comma: \"grain,vignette\"." },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline" },
      {
        key: "stats", type: "array", label: "Stats row",
        item: {
          fields: [
            { key: "value", type: "text", label: "Value" },
            { key: "label", type: "text", label: "Label" },
          ],
        },
      },
      { key: "body",          type: "textarea", label: "Body" },
      { key: "handle",        type: "text",     label: "Follow handle",  help: "e.g. \"Follow @itiha29 · itiha.info\"" },
      { key: "image",         type: "image",    label: "Background image" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_position",type: "text",     label: "Image crop",     help: "CSS object-position, e.g. \"center 35%\"" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)", default: 0.82, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 178 },
      { key: "body_size",     type: "number",   label: "Body size (px)", default: 26 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10, help: "Nudge headline. Negative = up, positive = down." },
      { key: "body_offset_y",     type: "number", label: "Body offset Y (px)",     default: 0, step: 10, help: "Nudge body. Negative = up, positive = down." },
    ],
  },

  "numbered-list": {
    label: "Numbered List",
    summary: "Vertical list of 3–5 items with big Bebas numerals. For \"N reasons / N truths\" slides.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline",        help: "Use *word* for red accent." },
      {
        key: "items", type: "array", label: "Items (3–5 recommended)",
        item: {
          fields: [
            { key: "number",   type: "text",     label: "Number (optional)",  help: "Defaults to 01, 02, etc. Pass \"i.\" / \"ii.\" for roman." },
            { key: "headline", type: "textarea", label: "Item headline",      help: "Use *word* for red accent." },
            { key: "body",     type: "textarea", label: "Item body" },
          ],
        },
      },
      { key: "image",         type: "image",    label: "Background image (optional)" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_position",type: "text",     label: "Image crop",     help: "CSS object-position, e.g. \"center 35%\"" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.85, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 88 },
      { key: "item_size",     type: "number",   label: "Item body size (px)", default: 24 },
      { key: "number_size",   type: "number",   label: "Number size (px)",   default: 80 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10, help: "Nudge headline. Negative = up, positive = down." },
    ],
  },

  comparison: {
    label: "Comparison",
    summary: "Two-column side-by-side. For myth-vs-reality / claim-vs-counter slides.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "left_label",    type: "text",     label: "Left · label",   help: "e.g. \"MYTH\" / \"CLAIM\" / \"BEFORE\"" },
      { key: "left_headline", type: "textarea", label: "Left · sub-headline" },
      { key: "left_body",     type: "textarea", label: "Left · body" },
      { key: "right_label",   type: "text",     label: "Right · label",  help: "e.g. \"REALITY\" / \"COUNTER\" / \"AFTER\"" },
      { key: "right_headline",type: "textarea", label: "Right · sub-headline" },
      { key: "right_body",    type: "textarea", label: "Right · body" },
      { key: "image",         type: "image",    label: "Background image (optional)" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_position",type: "text",     label: "Image crop",     help: "CSS object-position, e.g. \"center 35%\"" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.9, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 88 },
      { key: "sub_size",      type: "number",   label: "Sub-headline size (px)", default: 38 },
      { key: "body_size",     type: "number",   label: "Body size (px)",  default: 22 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10, help: "Nudge headline. Negative = up, positive = down." },
    ],
  },

  portrait: {
    label: "Hero Portrait",
    summary: "Subject-focused slide. Image on left half · big name in Bebas · dates · role · optional pull quote.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "image",         type: "image",    label: "Portrait image",  help: "Best with a BG-removed PNG or a tight portrait crop." },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.15, step: 0.05 },
      { key: "image_position",type: "text",     label: "Image crop" },
      { key: "name",          type: "textarea", label: "Name",            help: "Big in Bebas. Use *word* for red accent." },
      { key: "dates",         type: "text",     label: "Dates",           help: "e.g. \"1921–2003\" or \"1855–1934\"" },
      { key: "role",          type: "textarea", label: "Role / context",  help: "One- or two-sentence positioning." },
      { key: "quote",         type: "textarea", label: "Pull quote (optional)" },
      { key: "attribution",   type: "text",     label: "Quote attribution" },
      { key: "name_size",     type: "number",   label: "Name size (px)",  default: 156 },
      { key: "body_size",     type: "number",   label: "Body size (px)",  default: 24 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10, help: "Nudge name + dates + role + quote. Negative = up, positive = down." },
    ],
  },

  "interior-light": {
    label: "Interior · Light",
    summary: "Off-White editorial slide — red left border, slide-number top-right.",
    fields: [
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "num",           type: "text",     label: "Slide number",   help: "e.g. \"04\". Defaults to slide index." },
      { key: "eyebrow",       type: "text",     label: "Eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline",       help: "Use *word* for red accent." },
      { key: "body",          type: "textarea", label: "Body" },
      { key: "image",         type: "image",    label: "Image (optional)", help: "Best with a bg-removed PNG so the subject sits cleanly on off-white." },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0, step: 0.05, help: "Keep at 0 for clean BG-removed PNGs." },
      { key: "image_position",type: "text",     label: "Image crop" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 96 },
      { key: "body_size",     type: "number",   label: "Body size (px)",  default: 26 },
    ],
  },

  "cta-red": {
    label: "CTA · Red",
    summary: "Solid Sindoor Red final slide.",
    fields: [
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "eyebrow",       type: "text",     label: "Eyebrow",        default: "Final Slide" },
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "cta",           type: "text",     label: "CTA line",       help: "e.g. \"↗ Link in bio · @itiha29\"" },
      { key: "image",         type: "image",    label: "Image (optional)", help: "Subtle photo behind the red. Set overlay high (0.85+) to keep red dominant." },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.85, step: 0.05 },
      { key: "image_position",type: "text",     label: "Image crop" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 130 },
    ],
  },

  // ─── Standalone formats ─────────────────────────────────────

  "quote-card": {
    label: "Quote Card",
    summary: "Standalone 1080×1080 quote (dark or light).",
    fields: [
      { key: "variant",       type: "select",   label: "Variant", options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "eyebrow",       type: "text",     label: "Eyebrow" },
      { key: "quote",         type: "textarea", label: "Quote" },
      { key: "attribution",   type: "text",     label: "Attribution" },
      { key: "image",         type: "image",    label: "Image (optional)" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.7, step: 0.05 },
      { key: "image_position",type: "text",     label: "Image crop" },
      { key: "text_y",        type: "number",   label: "Text Y (%)",     default: 50, step: 5, help: "0=top, 50=center, 100=bottom." },
    ],
  },

  "reel-title": {
    label: "Reel Title",
    summary: "Standalone 1080×1920 title card (Reel / Story).",
    fields: [
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "eyebrow",       type: "text",     label: "Eyebrow",        help: "e.g. \"Episode 04\"" },
      { key: "headline",      type: "textarea", label: "Headline",       help: "Use *word* for red accent." },
      { key: "subline",       type: "text",     label: "Subline" },
      { key: "pill",          type: "text",     label: "Subtitle pill",  help: "Optional in-video subtitle pill near bottom." },
      { key: "handle",        type: "text",     label: "Handle",         default: "@itiha29" },
      { key: "image",         type: "image",    label: "Image (optional)" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.55, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 180 },
      { key: "text_y",        type: "number",   label: "Text Y (%)",     default: 50, step: 5, help: "0=top, 50=center, 100=bottom. Use to dodge the IG cover crop." },
    ],
  },

  "youtube-thumbnail": {
    label: "YouTube Thumbnail",
    summary: "Standalone 1280×720 thumbnail.",
    fields: [
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "eyebrow",       type: "text",     label: "Eyebrow",        help: "e.g. \"Episode 04 · The Sacking\"" },
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "subline",       type: "text",     label: "Subline" },
      { key: "image",         type: "image",    label: "Image (optional)" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_position",type: "text",     label: "Image crop",     help: "CSS object-position, e.g. \"center 35%\"" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.55, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 156 },
    ],
  },

  "end-card": {
    label: "End Card",
    summary: "Standalone 1920×1080 video outro.",
    fields: [
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "tagline",       type: "text",     label: "Tagline",         default: "History Simplified" },
      {
        key: "handles", type: "array", label: "Social handles",
        item: {
          fields: [
            { key: "platform", type: "text", label: "Platform (short)",  help: "e.g. YT, IG, WEB" },
            { key: "text",     type: "text", label: "Handle" },
          ],
        },
      },
      { key: "image",         type: "image",    label: "Background image (optional)" },
      { key: "image_bw",      type: "bool",     label: "Black & white" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.7, step: 0.05 },
      { key: "image_position",type: "text",     label: "Image crop" },
      { key: "wordmark_size", type: "number",   label: "Wordmark size (px)", default: 280 },
    ],
  },
};

// Top-level fields (name / format / caption / tweaks).
window.MANIFEST_META = {
  fields: [
    { key: "name",    type: "text",     label: "Project name",   help: "Title used internally and on the file system." },
    { key: "format",  type: "select",   label: "Output format",  options: [
      "instagram-portrait", "instagram-square", "instagram-reel",
      "instagram-landscape", "youtube-thumbnail", "youtube-end-card",
    ]},
    { key: "caption", type: "textarea", label: "IG caption",     help: "Post-level. Mention book + author for SEO when relevant. Used by bin/publish." },
    { key: "hashtags",type: "textarea", label: "Hashtags",       help: "Space- or line-separated #tags. Appended to the caption on publish." },
  ],
};

window.MANIFEST_TWEAKS = {
  fields: [
    { key: "showChapterLabels", type: "bool",   label: "Show chapter eyebrows" },
    { key: "showStamp",         type: "bool",   label: "Show ITIHA. stamp" },
    { key: "showPageNum",       type: "bool",   label: "Show page number" },
    { key: "overlayDarkness",   type: "number", label: "Default image overlay (0–100)", default: 62 },
    { key: "showGrain",         type: "bool",   label: "Film grain on opt-in slides" },
    { key: "seriesLabel",       type: "text",   label: "Series label",   help: "Appended after page number, e.g. INDENTURE." },
  ],
};
