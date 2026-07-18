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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Image crop",  help: "Drag the sliders to reposition the image inside its frame. 0/0 = top-left, 50/50 = center." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 156 },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",   step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 100 },
      { key: "body_size",     type: "number",   label: "Body size (px)",  default: 45 },
      { key: "body_offset_y", type: "number",   label: "Body offset Y (px)", default: 0, step: 20, help: "Nudge body relative to its block. Negative = up, positive = down. Use to slide body toward the bottom edge." },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Image crop",  help: "Drag the sliders to reposition the image inside its frame. 0/0 = top-left, 50/50 = center." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0, step: 0.05 },
      { key: "headline_y",    type: "number",   label: "Headline y (px from top)", default: 140 },
      { key: "body_y",        type: "number",   label: "Body y (px from bottom)",  default: 200 },
      { key: "headline_size", type: "number",   label: "Headline size (px)",       default: 100 },
      { key: "body_size",     type: "number",   label: "Body size (px)",           default: 45 },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "quote_size",    type: "number",   label: "Quote size (px)", default: 64 },
      { key: "body_size",     type: "number",   label: "Body size (px)",  default: 42 },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Image crop",  help: "Drag the sliders to reposition the image inside its frame. 0/0 = top-left, 50/50 = center." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)", default: 0.82, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 108 },
      { key: "body_size",     type: "number",   label: "Body size (px)", default: 42 },
      { key: "stat_size",     type: "number",   label: "Stat value size (px)", default: 168 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10, help: "Nudge headline. Negative = up, positive = down." },
      { key: "stats_offset_y",    type: "number", label: "Stats offset Y (px)",    default: 0, step: 10, help: "Nudge the stat numerals + labels. Negative = up, positive = down." },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Image crop",  help: "Drag the sliders to reposition the image inside its frame. 0/0 = top-left, 50/50 = center." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)", default: 0.84, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 116 },
      { key: "date_size",     type: "number",   label: "Date size (px)",     default: 52 },
      { key: "text_size",     type: "number",   label: "Cell text size (px)", default: 28 },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Image crop",  help: "Drag the sliders to reposition the image inside its frame. 0/0 = top-left, 50/50 = center." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)", default: 0.82, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 148 },
      { key: "body_size",     type: "number",   label: "Body size (px)", default: 42 },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Image crop",  help: "Drag the sliders to reposition the image inside its frame. 0/0 = top-left, 50/50 = center." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.85, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 88 },
      { key: "item_size",     type: "number",   label: "Item body size (px)", default: 38 },
      { key: "number_size",   type: "number",   label: "Number size (px)",   default: 80 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10, help: "Nudge headline. Negative = up, positive = down." },
      { key: "body_offset_y",     type: "number", label: "List offset Y (px)",      default: 0, step: 10, help: "Nudge the numbered items up/down. Negative = up, positive = down." },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Image crop",  help: "Drag the sliders to reposition the image inside its frame. 0/0 = top-left, 50/50 = center." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.9, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 88 },
      { key: "sub_size",      type: "number",   label: "Sub-headline size (px)", default: 38 },
      { key: "body_size",     type: "number",   label: "Body size (px)",  default: 38 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10, help: "Nudge headline. Negative = up, positive = down." },
      { key: "body_offset_y",     type: "number", label: "Columns offset Y (px)",  default: 0, step: 10, help: "Nudge the two comparison columns up/down. Negative = up, positive = down." },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.15, step: 0.05 },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "name",          type: "textarea", label: "Name",            help: "Big in Bebas. Use *word* for red accent." },
      { key: "dates",         type: "text",     label: "Dates",           help: "e.g. \"1921–2003\" or \"1855–1934\"" },
      { key: "role",          type: "textarea", label: "Role / context",  help: "One- or two-sentence positioning." },
      { key: "quote",         type: "textarea", label: "Pull quote (optional)" },
      { key: "attribution",   type: "text",     label: "Quote attribution" },
      { key: "name_size",     type: "number",   label: "Name size (px)",  default: 132 },
      { key: "body_size",     type: "number",   label: "Body size (px)",  default: 38 },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0, step: 0.05, help: "Keep at 0 for clean BG-removed PNGs." },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 96 },
      { key: "body_size",     type: "number",   label: "Body size (px)",  default: 42 },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.85, step: 0.05 },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 116 },
    ],
  },

  "youtube-cta": {
    label: "CTA · YouTube",
    summary: "Final slide pointing to a full YouTube documentary. Jet black, thumbnail with stamped red play mark, video title in Big Shoulders Display.",
    fields: [
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "eyebrow",       type: "text",     label: "Eyebrow",        default: "Watch The Full Documentary", help: "Small uppercase line above the divider." },
      { key: "thumbnail",     type: "image",    label: "Video thumbnail", help: "Upload the YouTube auto-generated thumbnail (or a custom 16:9 image). Cropped 16:9." },
      { key: "headline",      type: "textarea", label: "Video title",    help: "The documentary's title. Use *word* for red accent." },
      { key: "duration",      type: "text",     label: "Duration",       help: "e.g. \"14 min\". Optional." },
      { key: "channel_label", type: "text",     label: "Channel label",  default: "Itiha Documentaries" },
      { key: "cta",           type: "text",     label: "CTA",            default: "Watch on YouTube", help: "The word \"YouTube\" lights up in Sindoor red." },
      { key: "handle",        type: "text",     label: "Channel handle", default: "@itihahindi" },
      { key: "url_label",     type: "text",     label: "URL label",      help: "Optional. e.g. \"youtube.com/@itihahindi\"." },
      { key: "headline_size", type: "number",   label: "Video title size (px)", default: 84 },
      { key: "cta_size",      type: "number",   label: "CTA size (px)",  default: 64 },
      { key: "headline_offset_y", type: "number", label: "Block offset Y (px)", default: 0, step: 10, help: "Nudge the thumbnail + title block down (positive) or up (negative)." },
    ],
  },

  timeline: {
    label: "Timeline",
    summary: "Vertical timeline — red axis with dated events. For dynasty progressions, conquest dates, indenture timelines.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline",        help: "Use *word* for red accent." },
      {
        key: "items", type: "array", label: "Events (3–6 recommended)",
        item: {
          fields: [
            { key: "date",     type: "text",     label: "Date / period",    help: "e.g. \"1857\" or \"1605–27\"" },
            { key: "headline", type: "textarea", label: "Event headline",   help: "Short Bebas line. *accent* for red." },
            { key: "body",     type: "textarea", label: "Event body" },
          ],
        },
      },
      { key: "image",         type: "image",    label: "Background image (optional)" },
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.88, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 88 },
      { key: "date_size",     type: "number",   label: "Date size (px)", default: 56 },
      { key: "item_headline_size", type: "number", label: "Event headline (px)", default: 28 },
      { key: "item_body_size", type: "number",  label: "Event body (px)", default: 36 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
      { key: "body_offset_y",     type: "number", label: "Timeline offset Y (px)",  default: 0, step: 10, help: "Nudge the events block up/down. Negative = up, positive = down." },
    ],
  },

  map: {
    label: "Map",
    summary: "Map image with Sindoor-red markers. Drop a period-accurate map, place dots at (x%, y%).",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "image",         type: "image",    label: "Map image",       help: "Period map, regional outline, or sketch. Use a high-contrast image for readability." },
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Map crop",     help: "Drag to reposition the map inside its frame." },
      { key: "image_overlay", type: "number",   label: "Map dim (0–1)",  default: 0.25, step: 0.05, help: "Darken/lighten the map so markers stand out." },
      {
        key: "markers", type: "array", label: "Markers",
        item: {
          fields: [
            { key: "x",        type: "number",   label: "X (% across)",    step: 1,    help: "0 = left edge of map, 100 = right edge." },
            { key: "y",        type: "number",   label: "Y (% down)",      step: 1,    help: "0 = top edge of map, 100 = bottom edge." },
            { key: "label",    type: "text",     label: "Label",           help: "Place name in Bebas." },
            { key: "sublabel", type: "text",     label: "Sublabel",        help: "Year, role, or note (small caps red)." },
          ],
        },
      },
      { key: "caption",       type: "textarea", label: "Caption (optional)", help: "Short body line below the map." },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 88 },
      { key: "caption_size",  type: "number",   label: "Caption size (px)", default: 24 },
      { key: "marker_size",   type: "number",   label: "Marker size (px)", default: 18 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
      { key: "caption_offset_x",  type: "number", label: "Caption offset X (px)",  default: 0, step: 10, help: "Nudge the caption left/right. Negative = left, positive = right." },
      { key: "caption_offset_y",  type: "number", label: "Caption offset Y (px)",  default: 0, step: 10, help: "Nudge the caption up/down. Negative = up, positive = down." },
    ],
  },

  "did-you-know": {
    label: "Did You Know?",
    summary: "Surprising-fact slide. Red-square stamp + parchment eyebrow, Bebas fact headline, body, optional source. Great for breather slides inside a longer carousel.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "eyebrow",       type: "text",     label: "Stamp text",     default: "Did You Know?", help: "Overrideable. e.g. \"Today In History\", \"Believe It Or Not?\"" },
      { key: "headline",      type: "textarea", label: "Fact headline",  help: "The surprising claim. Use *word* for red accent." },
      { key: "body",          type: "textarea", label: "Body",           help: "Context for the fact. [bracket] · _italic_ · **bold**." },
      { key: "source",        type: "text",     label: "Source (optional)", help: "e.g. \"Al-Biruni, Tarikh al-Hind\". Rendered as small-caps red prefix." },
      { key: "show_mark",     type: "bool",     label: "Show '?' watermark", default: true, help: "Big translucent red question-mark in the corner. Auto-hidden when an image is present." },
      { key: "image",         type: "image",    label: "Background image (optional)" },
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.85, step: 0.05 },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 108 },
      { key: "body_size",     type: "number",   label: "Body size (px)",  default: 42 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
      { key: "body_offset_y",     type: "number", label: "Body offset Y (px)",     default: 0, step: 10 },
    ],
  },

  "pie-chart": {
    label: "Pie / Donut",
    summary: "Proportion chart. Segments sized by value, Sindoor-red leads. Legend with auto-percentages. For shares, splits, breakdowns.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline",        help: "Use *word* for red accent." },
      {
        key: "segments", type: "array", label: "Segments (2–6 recommended)",
        item: {
          fields: [
            { key: "label", type: "text",   label: "Label" },
            { key: "value", type: "number", label: "Value",  help: "Any number — percentages are computed from the total." },
            { key: "color", type: "text",   label: "Color (optional)", help: "Hex like #C0392B. Defaults to the brand palette." },
          ],
        },
      },
      { key: "donut",         type: "bool",     label: "Donut (ring)",   default: true, help: "Off = full pie." },
      { key: "center_label",  type: "text",     label: "Center label",   help: "Donut only — e.g. a total or a hero number." },
      { key: "show_values",   type: "bool",     label: "Show % in legend", default: true },
      { key: "caption",       type: "textarea", label: "Caption (optional)" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 88 },
      { key: "caption_size",  type: "number",   label: "Caption size (px)",  default: 24 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
    ],
  },

  "line-graph": {
    label: "Line Graph",
    summary: "Single-series trend over time. Sindoor-red line + area fill, gridlines, axis labels. For exports, populations, casualties across years.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline",        help: "Use *word* for red accent." },
      {
        key: "points", type: "array", label: "Points (left → right)",
        help: "Single series. For 2+ lines, use Series below instead.",
        item: {
          fields: [
            { key: "label", type: "text",   label: "X label",  help: "e.g. a year: \"1850\"" },
            { key: "value", type: "number", label: "Y value" },
          ],
        },
      },
      {
        key: "series", type: "array", label: "Series (2+ lines — overrides Points)",
        item: {
          fields: [
            { key: "label", type: "text", label: "Series name" },
            { key: "color", type: "text", label: "Color (optional)", help: "Hex; defaults to brand palette." },
            {
              key: "points", type: "array", label: "Points (left → right)",
              item: {
                fields: [
                  { key: "label", type: "text",   label: "X label" },
                  { key: "value", type: "number", label: "Y value" },
                ],
              },
            },
          ],
        },
      },
      { key: "y_suffix",      type: "text",     label: "Y-axis suffix",  help: "e.g. \"%\", \"K\", \"M\". Optional." },
      { key: "fill",          type: "bool",     label: "Area fill",      default: true, help: "Single-series only." },
      { key: "caption",       type: "textarea", label: "Caption (optional)" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 88 },
      { key: "caption_size",  type: "number",   label: "Caption size (px)",  default: 24 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
    ],
  },

  "bar-chart": {
    label: "Bar Chart",
    summary: "Compare values across categories. Vertical bars, or horizontal for long labels / rankings. Sindoor-red bars, values in Bebas.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline",        help: "Use *word* for red accent." },
      {
        key: "bars", type: "array", label: "Bars (2–7 recommended)",
        item: {
          fields: [
            { key: "label", type: "text",   label: "Label" },
            { key: "value", type: "number", label: "Value" },
            { key: "color", type: "text",   label: "Color (optional)", help: "Hex like #C0392B. Defaults to Sindoor red." },
          ],
        },
      },
      { key: "horizontal",    type: "bool",     label: "Horizontal bars", default: false, help: "On = ranked rows (better for long labels)." },
      { key: "value_suffix",  type: "text",     label: "Value suffix",   help: "e.g. \"%\", \"K\". Optional." },
      { key: "caption",       type: "textarea", label: "Caption (optional)" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 88 },
      { key: "caption_size",  type: "number",   label: "Caption size (px)",  default: 24 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
    ],
  },

  dynasty: {
    label: "Dynasty / Tree",
    summary: "Succession or genealogy tree. Nodes flow top→bottom; group siblings on one row with a shared generation number. For dynasties, lineages, regnal lines.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline",        help: "Use *word* for red accent." },
      {
        key: "nodes", type: "array", label: "Nodes (top → bottom)",
        item: {
          fields: [
            { key: "name",       type: "text",     label: "Name" },
            { key: "dates",      type: "text",     label: "Dates / reign", help: "e.g. \"1556–1605\"" },
            { key: "note",       type: "textarea", label: "Note (optional)" },
            { key: "generation", type: "number",   label: "Generation (optional)", help: "Give siblings the same number to put them on one row. Leave blank for a straight line." },
            { key: "highlight",  type: "bool",     label: "Highlight" },
          ],
        },
      },
      { key: "caption",       type: "textarea", label: "Caption (optional)" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 88 },
      { key: "caption_size",  type: "number",   label: "Caption size (px)",  default: 24 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
    ],
  },

  "before-after": {
    label: "Before / After",
    summary: "Two images split by a diagonal (or vertical) seam, each labelled. For ruins vs reconstruction, 1900 vs now, conquest vs aftermath.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "image_before",  type: "image",    label: "Before image" },
      { key: "image_after",   type: "image",    label: "After image" },
      { key: "label_before",  type: "text",     label: "Before label",   default: "Before" },
      { key: "label_after",   type: "text",     label: "After label",    default: "After" },
      { key: "split",         type: "select",   label: "Split",          options: ["diagonal","vertical"], default: "diagonal" },
      { key: "filter_before", type: "select",   label: "Before filter",  options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "e.g. archival/bw for the old era." },
      { key: "filter_after",  type: "select",   label: "After filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "e.g. leave blank (colour) for the modern era." },
      { key: "caption",       type: "textarea", label: "Caption (optional)" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 88 },
      { key: "caption_size",  type: "number",   label: "Caption size (px)",  default: 24 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
    ],
  },

  document: {
    label: "Primary Source",
    summary: "A framed scan of a document, manuscript, inscription or photograph, with a pulled key line + archival attribution. The documentary signature.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline",        help: "Use *word* for red accent." },
      { key: "image",         type: "image",    label: "Document scan / photo" },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "archival", help: "Defaults to archival for an aged look. Clear it for a clean scan." },
      { key: "image_position",type: "image-position", label: "Crop" },
      { key: "quote",         type: "textarea", label: "Pulled line",     help: "The key line from the source — original or translated. Newlines preserved." },
      { key: "translation",   type: "text",     label: "Translation / gloss", help: "Optional — if the pulled line is in the original language." },
      { key: "attribution",   type: "text",     label: "Attribution",    help: "e.g. \"Ain-i-Akbari, Bk. III, c. 1590 · British Library\"" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 72 },
      { key: "quote_size",    type: "number",   label: "Pulled-line size (px)", default: 40 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
    ],
  },

  annotated: {
    label: "Annotated Image",
    summary: "Numbered red markers on a painting or photo at (x%, y%), with a numbered legend. Visual close-reading of a source image.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "chapter",       type: "text",     label: "Chapter eyebrow" },
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "image",         type: "image",    label: "Image (painting / photo)" },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "" },
      { key: "image_position",type: "image-position", label: "Crop" },
      {
        key: "callouts", type: "array", label: "Callouts (markers, 2–5)",
        item: {
          fields: [
            { key: "x",     type: "number", label: "X (% across)", step: 1, help: "0 = left, 100 = right of the image." },
            { key: "y",     type: "number", label: "Y (% down)",   step: 1, help: "0 = top, 100 = bottom of the image." },
            { key: "label", type: "textarea", label: "What it is",  help: "Shown in the numbered legend." },
          ],
        },
      },
      { key: "caption",       type: "textarea", label: "Caption (optional)" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 80 },
      { key: "marker_size",   type: "number",   label: "Marker size (px)", default: 34 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
    ],
  },

  sources: {
    label: "Sources",
    summary: "Bibliography slide — the books, documents and archives the carousel draws on. Makes the research visible. Usually near the end.",
    fields: [
      { key: "theme",         type: "select",   label: "Theme",          options: ["dark","light"], default: "dark" },
      { key: "texture",       type: "select",   label: "Texture",        options: ["","grain","noise","scanlines","paper","halftone","vignette"], default: "" },
      { key: "eyebrow",       type: "text",     label: "Eyebrow",        default: "Sources", help: "e.g. \"Sources\", \"Further Reading\"." },
      { key: "headline",      type: "textarea", label: "Headline (optional)" },
      {
        key: "sources", type: "array", label: "Sources",
        item: {
          fields: [
            { key: "title",  type: "text", label: "Title",   help: "Book / document / archive name. Rendered in italic." },
            { key: "author", type: "text", label: "Author (optional)" },
            { key: "detail", type: "text", label: "Detail (optional)", help: "e.g. year, publisher, archive, pages." },
          ],
        },
      },
      { key: "note",          type: "textarea", label: "Note (optional)", help: "Closing line, e.g. a methodology caveat." },
      { key: "handle",        type: "text",     label: "Follow handle (optional)", help: "e.g. \"Follow @itiha29 · itiha.info\"" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 96 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.7, step: 0.05 },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "quote_size",    type: "number",   label: "Quote size (px)", default: 48, help: "Bigger for short quotes, smaller for long ones." },
      { key: "text_y",        type: "number",   label: "Text Y (move up/down %)", default: 50, step: 5, help: "0=top, 50=center, 100=bottom. This moves the whole quote block." },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_position",type: "image-position", label: "Image crop",  help: "Drag the sliders to reposition the image inside its frame. 0/0 = top-left, 50/50 = center." },
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
      { key: "image_bw",      type: "bool",     label: "Black & white",  help: "Quick B&W. Overridden by Image filter if set." },
      { key: "image_filter",  type: "select",   label: "Image filter",   options: ["","bw","sepia","archival","warm","cool","duotone-red","duotone-parchment","duotone-ink"], default: "", help: "Editorial treatment. Wins over Black & white." },
      { key: "image_overlay", type: "number",   label: "Overlay (0–1)",  default: 0.7, step: 0.05 },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "wordmark_size", type: "number",   label: "Wordmark size (px)", default: 280 },
      { key: "handle_size",   type: "number",   label: "Handle size (px)",   default: 42 },
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
