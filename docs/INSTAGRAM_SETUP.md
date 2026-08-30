# Instagram publishing setup

One-time setup (~20 min for both brands) that unlocks the **Post IG / Post Reel**
button in the editor and the `bin/publish <design>` CLI. After it, publishing a
finished carousel or reel is one click: the studio converts the render, uploads
it to Cloudinary, builds the post through Instagram's official API, publishes,
and shows the live link. The post id and permalink are stamped into the design's
`content.yaml` (`ig_published:`) so the editor shows "Published" and warns
before posting the same design twice.

Two things to configure: **Meta** (one app, one token per Instagram account) and
**Cloudinary** (public hosting — Instagram's API only fetches media from public
URLs, it never accepts uploaded bytes).

Nothing here needs Meta App Review or business verification: an app in
**Development mode** can publish to any Instagram account that has been added
to it, which is exactly the two accounts we own.

---

## Part A — Meta (~10 min, once; +3 min per extra account)

### 1. Both Instagram accounts must be professional

Instagram app → Settings → Account type → **Business** or **Creator** (either
works). Do this for `@itiha29` and `@vak_hq`. Skip any Facebook-Page linking
prompts — not needed on this route.

### 2. Create one Meta app with Instagram login

1. https://developers.facebook.com/ → My Apps → **Create App**.
2. Use case: **Instagram** (choose the Instagram-only option, not "Other") →
   app type **Business**. Any name, e.g. "Kavi Studio". Leave it in
   Development mode.
3. App dashboard → **Instagram** → **API setup with Instagram business login**.
4. Section **Generate access tokens** → **Add account** → log in as `@vak_hq` →
   approve every permission:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
   - `instagram_business_manage_insights` (optional now; needed for the weekly
     analytics reports we want later)
5. **Generate token** next to the account → copy the long-lived token (it is
   shown once). Note the **Instagram account ID** beside it (a long number).
6. Repeat 4–5 logged in as `@itiha29` for the Itiha token.

If "Add account" refuses an account: App dashboard → **App roles → Roles → Add
people → Instagram tester** → then in the Instagram app for that account:
Settings → **Website permissions / Apps and websites → Tester invites → Accept**.
Then retry step 4.

### 3. Fill `.env`

```
# VAQ HQ (@vak_hq) — designs with brand: vaq-hq post here
IG_USER_ID_VAQ_HQ=<account id from step 5>
IG_ACCESS_TOKEN_VAQ_HQ=<token>

# Itiha (@itiha29) — the default account
IG_USER_ID=<account id>
IG_ACCESS_TOKEN=<token>
```

Then `bin/kavi restart` (the daemon reads `.env` at start) and verify:

```
bin/publish vaq-hq --whoami     # → vaq-hq: @vak_hq · id … · BUSINESS · N posts
bin/publish itiha --whoami
```

### Token expiry (Instagram-login tokens live 60 days)

- `bin/publish vaq-hq --refresh-token` renews a token any time after it is 24h
  old and writes the new one into `.env` with an `IG_TOKEN_REFRESHED_VAQ_HQ`
  date stamp.
- Every publish auto-refreshes once the stamp is 30+ days old, so posting at
  least monthly keeps a token alive with no scheduler.
- A token unused for 60 days dies: regenerate it from the app dashboard
  (step 2.5) and paste it in again. `Invalid OAuth access token` = this.

---

## Part B — Cloudinary (~5 min)

1. Sign up free at https://cloudinary.com.
2. Dashboard → note the **Cloud name**.
3. Settings → Upload → **Upload presets → Add upload preset** → Signing mode
   **Unsigned** → save; note the preset name. Leave the preset's resource type
   on **Auto** so the same preset accepts JPEGs and MP4s.
4. `.env`:

```
IMAGE_HOST=cloudinary
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_UPLOAD_PRESET=<preset name>
```

Verify Part B alone, with zero Instagram calls:

```
bin/publish <any-rendered-design> --dry-run
```

It converts the slides to JPEG, uploads them, and prints the hosted URLs; open
one in a browser to confirm it serves an image.

Free-tier limits that matter: 10 MB per image (our JPEGs are 1–3 MB) and
**100 MB per video** — the reel publisher transcodes a publish copy under that.

Alternate hosts, if ever needed: `IMAGE_HOST=tunnel` (static server +
cloudflared, `TUNNEL_PUBLIC_URL`) or `IMAGE_HOST=notion` (attaches JPEGs to the
design's Notion row; kept off — images must not go to Notion).

---

## Publishing

- **Carousel / single image**: Render → **Post IG**. Caption = Project tab
  caption + hashtags. Feed posts must be 4:5 to 1.91:1 (portrait, square,
  landscape formats); 9:16 formats are refused with a hint to compose a reel.
- **Reel**: Compose Reel (produces `reel.mp4`) → **Post Reel**. The studio
  transcodes `ig-video/reel-ig.mp4` (H.264, capped bitrate, < 100 MB), uploads
  it plus slide 1 as the cover, creates a `REELS` container with
  `share_to_feed`, waits for Instagram's processing (30 s–5 min), publishes.
- **CLI**: `bin/publish <design>` (auto-detects reel vs image from the format;
  `--as-reel` / `--as-image` override), `--dry-run` for hosting only.
- **Quota**: `bin/publish vaq-hq --quota` — Instagram allows **25 API posts per
  rolling 24 h** per account; publish checks this first.
- A design linked to a Notion backlog row gets its status bumped to
  **Published** after a successful post.

### Troubleshooting

- `Invalid OAuth access token` → expired; `--refresh-token`, or regenerate.
- `(#10) / (#200) permission` → token missing `instagram_business_content_publish`;
  regenerate with all permissions approved.
- `Media uploaded is not in a supported format` / container `ERROR` → the hosted
  URL did not return the media; open the printed URL, then re-check Part B.
- Reel container stuck `IN_PROGRESS` → Instagram is transcoding; the publisher
  waits up to 10 min. Longer than that: the video is probably outside spec
  (must be MP4/MOV, H.264 + AAC, ≤ 30 fps, 3 s–15 min, ≤ 1 GB). The publish
  copy is already normalised, so check the source clip.
- `a publish is already running for this design` → the editor's double-click
  guard; wait for the first one.

---

## Appendix — legacy Facebook-login route

The pre-2025 route (Facebook Page linked to the IG account, token via Graph API
Explorer + `fb_exchange_token`, Page token against `graph.facebook.com`) still
works and has one advantage: Page tokens never expire. The code auto-detects it —
tokens starting with `EAA` are sent to `graph.facebook.com` instead of
`graph.instagram.com` (override with `IG_GRAPH_HOST`). Only bother if the 60-day
refresh becomes annoying.
