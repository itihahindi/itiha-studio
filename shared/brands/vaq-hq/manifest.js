// VAQ HQ — layout field schema (drives the editor forms).
// Six layouts, all sharing the vertical + surface knobs:
//   vertical: live | briefing | longview | ground  (blank = project default)
//   surface:  solid (accent tile) | dark (navy + accent rule)

const _VERTICAL_FIELD = {
  key: "vertical", type: "select", label: "Vertical (show)",
  options: ["", "live", "briefing", "longview", "ground"], default: "",
  help: "Blank inherits the project default from Tweaks. live=Current Affairs · briefing=Geopolitics · longview=Political History · ground=Indian Politics.",
};
const _SURFACE_FIELD = {
  key: "surface", type: "select", label: "Surface",
  options: ["", "solid", "dark"], default: "",
  help: "solid = the vertical's accent colour tile. dark = navy tile with accent rule.",
};
const _KICKER_META = {
  key: "kicker_meta", type: "text", label: "Kicker meta",
  help: "Text next to the badge. Blank = the vertical's show name (e.g. The Briefing).",
};

window.MANIFEST = {
  "cover": {
    label: "Cover",
    summary: "Solid accent opener — badge row, huge vertical-voice headline, subline.",
    fields: [
      _VERTICAL_FIELD,
      { ..._SURFACE_FIELD, help: "Covers default to solid (accent tile)." },
      _KICKER_META,
      { key: "headline",   type: "textarea", label: "Headline", help: "*word* = emphasis (tint on solid, accent highlight on dark)." },
      { key: "subline",    type: "text",     label: "Subline" },
      { key: "swipe_meta", type: "text",     label: "Swipe meta", help: "e.g. Swipe ▸ · 8 slides · 3 min" },
      { key: "headline_size",     type: "number", label: "Headline size (px)", help: "Blank = per-vertical default (122–148)." },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
    ],
  },

  "story": {
    label: "Story",
    summary: "Interior workhorse — kicker, headline, body, optional contained image card.",
    fields: [
      _VERTICAL_FIELD,
      _SURFACE_FIELD,
      _KICKER_META,
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "body",          type: "textarea", label: "Body", help: "[word] = accent emphasis · _italic_ · **bold**." },
      { key: "image",         type: "image",    label: "Image (contained card)" },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "image_caption", type: "text",     label: "Image caption", help: "Mono caption under the card." },
      { key: "headline_size",     type: "number", label: "Headline size (px)", help: "Blank = per-vertical default (84–92)." },
      { key: "body_size",         type: "number", label: "Body size (px)", default: 41 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
      { key: "body_offset_y",     type: "number", label: "Body offset Y (px)", default: 0, step: 10 },
    ],
  },

  "split-story": {
    label: "Split Story",
    summary: "Flat photo block on top with accent divider; kicker + headline + body below.",
    fields: [
      _VERTICAL_FIELD,
      _KICKER_META,
      { key: "image",         type: "image",    label: "Image (top block)" },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "image_height",  type: "number",   label: "Image height (px)", default: 600, step: 20 },
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "body",          type: "textarea", label: "Body" },
      { key: "headline_size", type: "number",   label: "Headline size (px)" },
      { key: "body_size",     type: "number",   label: "Body size (px)", default: 40 },
      { key: "body_offset_y", type: "number",   label: "Body offset Y (px)", default: 0, step: 10 },
    ],
  },

  "quote": {
    label: "Quote",
    summary: "Newsreader-italic pull quote with a giant accent quote mark.",
    fields: [
      _VERTICAL_FIELD,
      _SURFACE_FIELD,
      _KICKER_META,
      { key: "quote",        type: "textarea", label: "Quote" },
      { key: "attribution",  type: "text",     label: "Attribution" },
      { key: "quote_size",   type: "number",   label: "Quote size (px)", default: 72 },
      { key: "quote_offset_y", type: "number", label: "Quote offset Y (px)", default: 0, step: 10 },
    ],
  },

  "stat": {
    label: "Stat",
    summary: "One enormous Archivo number in the vertical's accent.",
    fields: [
      _VERTICAL_FIELD,
      _SURFACE_FIELD,
      _KICKER_META,
      { key: "label",    type: "text",     label: "Label (above, mono)" },
      { key: "value",    type: "text",     label: "Value (big)" },
      { key: "sublabel", type: "text",     label: "Sub-label (below)" },
      { key: "body",     type: "textarea", label: "Body" },
      { key: "stat_size",      type: "number", label: "Value size (px)", default: 250 },
      { key: "body_size",      type: "number", label: "Body size (px)", default: 38 },
      { key: "stats_offset_y", type: "number", label: "Stat offset Y (px)", default: 0, step: 10 },
    ],
  },

  "closing": {
    label: "Closing",
    summary: "Channel signature — mark, wordmark, four accent dots, follow line.",
    fields: [
      { key: "headline",      type: "textarea", label: "Headline (optional)" },
      { key: "body",          type: "textarea", label: "Body (optional)" },
      { key: "handle",        type: "text",     label: "Handle line", help: "e.g. Follow @vaqhq · vaqhq.com" },
      { key: "headline_size", type: "number",   label: "Headline size (px)", default: 60 },
    ],
  },
};

window.MANIFEST_META = {
  fields: [
    { key: "name",    type: "text",     label: "Project name",   help: "Title used internally and on the file system." },
    { key: "format",  type: "select",   label: "Output format",  options: [
      "instagram-portrait", "instagram-square", "instagram-reel",
      "instagram-landscape", "youtube-thumbnail", "youtube-end-card",
    ]},
    { key: "caption", type: "textarea", label: "IG caption" },
    { key: "hashtags",type: "textarea", label: "Hashtags",       help: "Space- or line-separated #tags. Appended to the caption on publish." },
  ],
};

window.MANIFEST_TWEAKS = {
  fields: [
    { key: "vertical",    type: "select", label: "Default vertical (show)",
      options: ["live", "briefing", "longview", "ground"], default: "live",
      help: "Per-slide Vertical overrides this." },
    { key: "showStamp",   type: "bool",   label: "Show Vaq HQ wordmark" },
    { key: "showPageNum", type: "bool",   label: "Show page number" },
    { key: "seriesLabel", type: "text",   label: "Series label", help: "Appended after the page number." },
  ],
};
