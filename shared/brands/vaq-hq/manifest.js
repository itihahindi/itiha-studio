// VAQ HQ — layout field schema (drives the editor forms).
// Six layouts, all sharing the vertical + surface knobs:
//   vertical: live | briefing | longview | ground  (blank = project default)
//   surface:  solid (accent tile) | dark (navy + accent rule)

const _VERTICAL_FIELD = {
  key: "vertical", type: "select", label: "Vertical (show)",
  options: ["", "live", "briefing", "longview", "ground", "sports", "legal", "tech"], default: "",
  help: "Editorial label only — every vertical shares the same two-tone look (orange + navy on paper). Sets the badge text: live=Current Affairs · briefing=Geopolitics · longview=Political History · ground=Indian Politics · sports=Sports · legal=Legal · tech=Technology.",
};
const _SURFACE_FIELD = {
  key: "surface", type: "select", label: "Surface",
  options: ["", "light", "solid", "dark"], default: "",
  help: "Blank = the layout's default. light = paper interior with the orange top rule. solid = orange poster tile (breaking / photo-less slides). dark = navy poster or cinematic photo hero.",
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
const _ALIGN_X_FIELD = {
  key: "align_x", type: "select", label: "Align ↔",
  options: ["", "left", "center", "right"], default: "",
  help: "Horizontal alignment of the text blocks. Blank = this layout's default.",
};
const _ALIGN_Y_FIELD = {
  key: "align_y", type: "select", label: "Align ↕",
  options: ["", "top", "middle", "bottom"], default: "",
  help: "Vertical anchor for the main text block. Blank = this layout's tuned position.",
};

window.MANIFEST = {
  "cover": {
    label: "Cover",
    summary: "Poster-tile opener — ghost index, badge row, huge vertical-voice headline.",
    fields: [
      _VERTICAL_FIELD,
      { ..._SURFACE_FIELD, help: "Covers default to solid (accent poster tile); light = newsroom cover." },
      _KICKER_META,
      _ALIGN_X_FIELD,
      _ALIGN_Y_FIELD,
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
      _ALIGN_X_FIELD,
      _ALIGN_Y_FIELD,
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
      _ALIGN_X_FIELD,
      _ALIGN_Y_FIELD,
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
      _ALIGN_X_FIELD,
      _ALIGN_Y_FIELD,
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
      _ALIGN_X_FIELD,
      _ALIGN_Y_FIELD,
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
    summary: "1080×1920 header panel over a video — upload a file OR paste a link, render, Compose Reel.",
    fields: [
      _VERTICAL_FIELD,
      _KICKER_META,
      _ALIGN_X_FIELD,
      _ALIGN_Y_FIELD,
      { key: "video_file", type: "video",    label: "Video file (upload)",
        help: "Upload an MP4 / MOV from your computer. Used instead of the link when set." },
      { key: "video_url",  type: "text",     label: "…or Video URL",
        help: "YouTube / Shorts / Instagram link. Fetched at best quality by Compose Reel. Ignored when a file is uploaded above." },
      { key: "headline",   type: "textarea", label: "Headline", help: "*word* = highlighter emphasis." },
      { key: "subline",    type: "text",     label: "Subline" },
      { key: "credit",     type: "text",     label: "Credit", help: "e.g. via @channel — bottom-right of the panel." },
      _TEXTURE_FIELD,
      { key: "panel_height",      type: "number", label: "Panel height (px)", default: 560, step: 20,
        help: "The video fills everything below this line." },
      { key: "panel_fade",        type: "number", label: "Panel fade (px)", default: 120, step: 20,
        help: "Paper bleeds this many px over the video's top edge instead of a hard cut. 0 = hard cut." },
      { key: "headline_size",     type: "number", label: "Headline size (px)", default: 66 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
    ],
  },

  "roster": {
    label: "Roster",
    summary: "League table — flag · name · year rows, sized to fit the whole list. Mark one row featured:true to pull it out in the accent. Rows authored in YAML.",
    fields: [
      _VERTICAL_FIELD,
      _SURFACE_FIELD,
      _KICKER_META,
      _ALIGN_X_FIELD,
      { ..._ALIGN_Y_FIELD, help: "Where the table sits in the column. Blank = centred, as tuned." },
      { key: "headline", type: "textarea", label: "Headline (optional)" },
      _TEXTURE_FIELD,
      { key: "row_size", type: "number", label: "Row text size (px)", help: "Blank = auto by row count (13+ → 34)." },
      { key: "headline_size", type: "number", label: "Headline size (px)", default: 58 },
    ],
  },

  "geo": {
    label: "Geo Map",
    summary: "Real world map (Natural Earth 10m, India point-of-view — Kashmir & Aksai Chin shown as India). Highlight countries by name in brand colours, join them with dotted flow lines.",
    fields: [
      _VERTICAL_FIELD,
      _SURFACE_FIELD,
      _KICKER_META,
      { key: "headline", type: "textarea", label: "Headline" },
      { key: "region", type: "select", label: "Region",
        options: ["auto", "world", "africa", "europe", "asia", "south-asia", "southeast-asia",
                  "east-asia", "central-asia", "middle-east", "north-america", "south-america",
                  "americas", "oceania", "indo-pacific"],
        default: "auto",
        help: "auto = frame the countries/pins on this slide, re-fitting whenever you add one (falls back to world when nothing is selected). Any named region pins the crop instead. Either way it widens to the panel's aspect, so it never stretches." },
      { key: "zoom", type: "number", label: "Zoom", default: 1, step: 0.1,
        help: "Scales the crop about its centre. 1 = as fitted · 1.5 = closer · 0.7 = pulled back. Works with auto and named regions." },
      { key: "map_padding", type: "number", label: "Auto-fit padding", default: 0.18, step: 0.02,
        help: "Breathing room around the fitted countries, as a fraction of their span. Only affects region: auto." },
      { key: "map_pan", type: "image-position", label: "Pan (move the map)",
        help: "Drag X/Y to move the map inside the frame. 50% 50% = centred · X 0%→west, 100%→east · Y 0%→north, 100%→south. One full frame of travel each way; combine with Zoom to reach anywhere." },
      { key: "center_lon", type: "number", label: "Centre longitude", step: 1,
        help: "Absolute recentre, e.g. 78 for India. Overrides where the fit landed; keeps the current span. Blank = auto." },
      { key: "center_lat", type: "number", label: "Centre latitude", step: 1,
        help: "Absolute recentre, e.g. 22. Blank = auto." },
      {
        key: "countries", type: "array", label: "Highlighted countries",
        item: {
          fields: [
            { key: "name",  type: "text",   label: "Country",
              help: "Everyday names work — USA, UK, UAE, Ivory Coast, DR Congo. An unknown name shows a red UNKNOWN chip on the map." },
            { key: "color", type: "color",  label: "Fill colour", help: "Blank = auto-assigned from the brand cycle (each country gets a different one)." },
            { key: "label", type: "text",   label: "Label override", help: "Blank = the country name. Labels toggle off globally below." },
            { key: "opacity", type: "number", label: "Fill opacity", default: 1, step: 0.05 },
          ],
        },
      },
      {
        key: "links", type: "array", label: "Connection lines",
        item: {
          fields: [
            { key: "from",    type: "text",   label: "From country" },
            { key: "to",      type: "text",   label: "To country" },
            { key: "color",   type: "color",  label: "Line colour", help: "Blank = the vertical's accent." },
            { key: "width",   type: "number", label: "Thickness (px)", default: 3, step: 0.5 },
            { key: "gap",     type: "number", label: "Dot spacing (px)", default: 12, step: 1 },
            { key: "dash",    type: "number", label: "Dot length (px)", default: 0.1, step: 0.5,
              help: "Near-zero with round caps = dots. Raise it for dashes." },
            { key: "opacity", type: "number", label: "Opacity", default: 0.95, step: 0.05 },
            { key: "curve",   type: "number", label: "Arc bow", default: 0.18, step: 0.02,
              help: "0 = straight. Negative bows the other way." },
            { key: "animate", type: "bool",   label: "Animate", default: false,
              help: "Dots travel along the line in the browser preview. PNG output is a still, so exports freeze it." },
          ],
        },
      },
      {
        key: "markers", type: "array", label: "Pins (by lat/long)",
        item: {
          fields: [
            { key: "lon",      type: "number", label: "Longitude", step: 0.5 },
            { key: "lat",      type: "number", label: "Latitude",  step: 0.5 },
            { key: "label",    type: "text",   label: "Label" },
            { key: "sublabel", type: "text",   label: "Sub-label" },
            { key: "color",    type: "color",  label: "Pin colour" },
            { key: "ring",     type: "bool",   label: "Radar rings", default: false },
            { key: "align",    type: "select", label: "Label side", options: ["", "left"], default: "" },
          ],
        },
      },
      { key: "ocean",        type: "color", label: "Ocean colour",  help: "Default deep navy #0A1F3C." },
      { key: "land_color",   type: "color", label: "Land colour",   help: "Unhighlighted countries. Default #17395E." },
      { key: "border_color", type: "color", label: "Border colour", help: "Country outlines." },
      { key: "borders",   type: "bool", label: "Country borders", default: true },
      { key: "labels",    type: "bool", label: "Country labels",  default: true, help: "Names on highlighted countries." },
      { key: "graticule", type: "bool", label: "Lat/long grid",    default: false },
      { key: "body", type: "textarea", label: "Body", help: "[word] = accent emphasis · _italic_ · **bold**." },
      { key: "map_caption", type: "text", label: "Map caption", help: "Mono caption under the frame (left)." },
      { key: "map_credit",  type: "text", label: "Map credit",  help: "Mono, under the frame (right)." },
      _TEXTURE_FIELD,
      { key: "map_height", type: "number", label: "Map height (px)", step: 20,
        help: "Blank = auto (300–470) from the region's aspect. Setting it stretches the map." },
      { key: "marker_size", type: "number", label: "Pin size (px)", default: 16 },
      { key: "label_size",  type: "number", label: "Country label size (px)", default: 26 },
      { key: "headline_size", type: "number", label: "Headline size (px)", help: "Blank = per-vertical default (84–92)." },
      { key: "body_size", type: "number", label: "Body size (px)", default: 42 },
      { key: "headline_offset_y", type: "number", label: "Headline offset Y (px)", default: 0, step: 10 },
      { key: "body_offset_y", type: "number", label: "Body offset Y (px)", default: 0, step: 10 },
    ],
  },

  "closing": {
    label: "Closing",
    summary: "Paper channel signature — mark, wordmark, four accent dots, follow line.",
    fields: [
      _TEXTURE_FIELD,
      // The signature is centred by brand, so this one layout gets a blank
      // option: "left" would mean re-aligning, not "leave it as it renders".
      { ..._ALIGN_X_FIELD, options: ["", "left", "center", "right"], default: "",
        help: "Blank keeps the centred signature. Set a value to re-align the whole stack." },
      { ..._ALIGN_Y_FIELD, help: "Where the stack sits. Blank = centred, as tuned." },
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
      options: ["live", "briefing", "longview", "ground", "sports", "legal", "tech"], default: "live",
      help: "Per-slide Vertical overrides this." },
    { key: "showStamp",   type: "bool",   label: "Show Vaq HQ wordmark" },
    { key: "showPageNum", type: "bool",   label: "Show page number" },
    { key: "seriesLabel", type: "text",   label: "Series label", help: "Appended after the page number." },
  ],
};
