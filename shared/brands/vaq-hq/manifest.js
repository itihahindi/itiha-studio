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
  options: ["", "light", "solid"], default: "",
  help: "light = paper interior with the vertical's top rule. solid = accent poster tile (use for photo-less slides).",
};
const _TEXTURE_FIELD = {
  key: "texture", type: "select", label: "Texture",
  options: ["", "grid", "riso", "dots", "signal"], default: "",
  help: "VAQ-native overlays: grid = ruled newsroom paper · riso = print grain · dots = Ben-Day corner field · signal = ghosted mark arcs. Combine with commas.",
};
const _KICKER_META = {
  key: "kicker_meta", type: "text", label: "Kicker meta",
  help: "Text next to the badge. Blank = the vertical's show name (e.g. The Briefing).",
};

window.MANIFEST = {
  "cover": {
    label: "Cover",
    summary: "Poster-tile opener — ghost index, badge row, huge vertical-voice headline.",
    fields: [
      _VERTICAL_FIELD,
      { ..._SURFACE_FIELD, help: "Covers default to solid (accent poster tile); light = newsroom cover." },
      _KICKER_META,
      { key: "headline",   type: "textarea", label: "Headline", help: "*word* = emphasis (white/tint on solid; highlighter block on light)." },
      { key: "subline",    type: "text",     label: "Subline" },
      { key: "image",         type: "image",    label: "Cover image (framed panel)", help: "Optional. Headline auto-shrinks to fit." },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "image_height",  type: "number",   label: "Image height (px)", default: 560, step: 20 },
      { key: "image_credit",  type: "text",     label: "Image credit", help: "Pill overlay, bottom-right of the panel." },
      { key: "show_index", type: "bool",     label: "Ghost index numeral", default: false, help: "Opt-in oversized 01/02 on poster tiles." },
      _TEXTURE_FIELD,
      { key: "headline_size",     type: "number", label: "Headline size (px)", help: "Blank = per-vertical default (106–118)." },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
    ],
  },

  "story": {
    label: "Story",
    summary: "Light interior workhorse — kicker, headline, body, optional framed image with caption/credit. surface: solid = type poster.",
    fields: [
      _VERTICAL_FIELD,
      _SURFACE_FIELD,
      _KICKER_META,
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "body",          type: "textarea", label: "Body", help: "[word] = accent emphasis · _italic_ · **bold**." },
      { key: "image",         type: "image",    label: "Image (framed)" },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "image_height",  type: "number",   label: "Image height (px)", default: 470, step: 20 },
      { key: "image_caption", type: "text",     label: "Image caption", help: "Mono caption under the frame (left)." },
      { key: "image_credit",  type: "text",     label: "Image credit", help: "e.g. PTI · under the frame (right)." },
      _TEXTURE_FIELD,
      { key: "headline_size",     type: "number", label: "Headline size (px)", help: "Blank = per-vertical default (84–92)." },
      { key: "body_size",         type: "number", label: "Body size (px)", default: 46 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
      { key: "body_offset_y",     type: "number", label: "Body offset Y (px)", default: 0, step: 10 },
    ],
  },

  "split-story": {
    label: "Split Story",
    summary: "Flat photo block on top with accent divider; paper text block below.",
    fields: [
      _VERTICAL_FIELD,
      _KICKER_META,
      { key: "image",         type: "image",    label: "Image (top block)" },
      { key: "image_position",type: "image-position", label: "Image crop" },
      { key: "image_height",  type: "number",   label: "Image height (px)", default: 580, step: 20 },
      { key: "image_credit",  type: "text",     label: "Image credit", help: "Pill overlay, bottom-right of the photo." },
      _TEXTURE_FIELD,
      { key: "headline",      type: "textarea", label: "Headline" },
      { key: "body",          type: "textarea", label: "Body" },
      { key: "headline_size", type: "number",   label: "Headline size (px)" },
      { key: "body_size",     type: "number",   label: "Body size (px)", default: 45 },
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
      _TEXTURE_FIELD,
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
      _TEXTURE_FIELD,
      { key: "label",    type: "text",     label: "Label (above, mono)" },
      { key: "value",    type: "text",     label: "Value (big)" },
      { key: "sublabel", type: "text",     label: "Sub-label (below)" },
      { key: "body",     type: "textarea", label: "Body" },
      { key: "stat_size",      type: "number", label: "Value size (px)", default: 250 },
      { key: "body_size",      type: "number", label: "Body size (px)", default: 43 },
      { key: "stats_offset_y", type: "number", label: "Stat offset Y (px)", default: 0, step: 10 },
    ],
  },

  "reel-frame": {
    label: "Reel Frame",
    summary: "1080×1920 header panel over a reposted video — paste a link, render, Compose Reel.",
    fields: [
      _VERTICAL_FIELD,
      _KICKER_META,
      { key: "video_url",  type: "text",     label: "Video URL",
        help: "YouTube / Shorts / Instagram link. Fetched at best quality by Compose Reel." },
      { key: "headline",   type: "textarea", label: "Headline", help: "*word* = highlighter emphasis." },
      { key: "subline",    type: "text",     label: "Subline" },
      { key: "credit",     type: "text",     label: "Credit", help: "e.g. via @channel — bottom-right of the panel." },
      _TEXTURE_FIELD,
      { key: "panel_height",      type: "number", label: "Panel height (px)", default: 560, step: 20,
        help: "The video fills everything below this line." },
      { key: "headline_size",     type: "number", label: "Headline size (px)", default: 66 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
    ],
  },

  "closing": {
    label: "Closing",
    summary: "Paper channel signature — mark, wordmark, four accent dots, follow line.",
    fields: [
      _TEXTURE_FIELD,
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
