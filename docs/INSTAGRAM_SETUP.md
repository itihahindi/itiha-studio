# Instagram publishing setup

One-time setup (~15 min total) that unlocks the **Post IG** button in the editor
and the `bin/publish <design>` CLI. After it, publishing a finished carousel is
one click: the studio converts the rendered slides to JPEG, uploads them to
Cloudinary, builds the carousel via Instagram's official API, publishes, and
shows the live post link.

Two accounts to configure: **Meta** (API credentials) and **Cloudinary** (image
hosting — Instagram's API only fetches images from public URLs, it never accepts
uploaded bytes).

---

## Part A — Meta credentials (~10 min)

### 1. Make the Instagram account professional

Instagram app → Settings → Account type → switch to **Business** or **Creator**
(either works). Skip any Facebook-Page linking prompts — not needed on this route.

### 2. Create a Meta app with Instagram login

1. https://developers.facebook.com/ → My Apps → **Create App**.
2. Use case: **Instagram** → app type **Business**. Any name (e.g. "Kavi Studio").
3. In the app dashboard: **Instagram → API setup with Instagram business login**.
4. Under "Generate access tokens": **Add account** → log in with the Instagram
   account → approve the permissions:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
   - `instagram_business_manage_insights` (optional now, needed for the future
     weekly-analytics reports)
5. Click **Generate token** next to the account → copy the long-lived token.
6. Note the **Instagram account ID** shown next to the account (a long number).

### 3. Fill `.env`

```
IG_USER_ID=<the numeric account ID>
IG_ACCESS_TOKEN=<the long-lived token>
```

Publishing for both brands from different IG accounts? Per-brand overrides win
over the plain names (brand slug uppercased, dashes → underscores):

```
IG_USER_ID_VAQ_HQ=…
IG_ACCESS_TOKEN_VAQ_HQ=…
```

### Token expiry

The token lives ~60 days. Refresh it any time after it's 24h old (do it monthly):

```
curl "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=<CURRENT_TOKEN>"
```

Paste the returned token back into `.env`. If it fully expires, regenerate from
the app dashboard (step 2.5).

---

## Part B — Cloudinary image host (~5 min)

1. Sign up free at https://cloudinary.com (the free tier is far more than enough).
2. Dashboard → note your **Cloud name**.
3. Settings → Upload → **Add upload preset** → Signing mode: **Unsigned** → save,
   note the preset name.
4. Fill `.env`:

```
IMAGE_HOST=cloudinary
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_UPLOAD_PRESET=<preset name>
```

Slides are converted to JPEG (quality 90) before upload — Instagram's API only
accepts JPEG — so no PNG/alpha issues apply.

Alternate hosts, if ever needed: `IMAGE_HOST=tunnel` (static server + cloudflared,
`TUNNEL_PUBLIC_URL`) or `IMAGE_HOST=notion` (attaches JPEGs to the design's
Notion row; kept off — the user prefers images not go to Notion).

---

## Publishing

- **Editor**: Render, then **Post IG** (bottom toolbar). It asks for confirmation,
  posts, and links the live post. Caption = the Project tab's caption + hashtags.
- **CLI**: `bin/publish <design-name>` — same flow, streaming progress.
- **Dry run**: `bin/publish <design-name> --dry-run` converts + uploads and prints
  the hosted URLs but makes zero Instagram calls. Use it to verify Part B alone.

A design linked to a Notion backlog row gets its status bumped to **Published**
after a successful post.

### Limits & troubleshooting

- Instagram allows **25 API-published posts per 24h** per account; carousels
  are 2–10 slides (a 1-slide design posts as a single image).
- Carousels crop every slide to the first slide's aspect ratio — moot here,
  all rendered slides in a design share dimensions.
- `Invalid OAuth access token` → token expired; refresh or regenerate (Part A).
- `(#10) / (#200) permission` errors → the token is missing
  `instagram_business_content_publish`; regenerate with all permissions approved.
- `Media uploaded is not in a supported format` → the hosted URL didn't return
  an image; open the printed URL in a browser to check, then verify Part B.

---

## Appendix — legacy Facebook-login route

The pre-2025 route (Facebook Page linked to the IG account, token via Graph API
Explorer + `fb_exchange_token`, Page token against `graph.facebook.com`) still
works and has one advantage: Page tokens never expire. The code auto-detects it —
tokens starting with `EAA` are sent to `graph.facebook.com` instead of
`graph.instagram.com` (override with `IG_GRAPH_HOST`). Only bother if the 60-day
refresh becomes annoying.
