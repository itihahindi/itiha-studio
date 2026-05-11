# Instagram publishing setup

The publish path uses Instagram's official Graph API. It needs three things from you:

1. An Instagram **Business** or **Creator** account (not personal).
2. A Facebook **Page** linked to that Instagram account.
3. A Facebook **App** with a long-lived Page access token.

Once set up, `bin/publish <design-name>` will: upload each rendered PNG to a public host, build a carousel container, and publish it as a single carousel post with the caption from `design.json`.

---

## Step 1 — Convert your IG account

Instagram app → Settings → Account type → switch to **Business** (or Creator). Pick a category. Skip linking a Facebook Page if it offers; you'll do it from the Facebook side next.

## Step 2 — Create / link a Facebook Page

Facebook → Pages → Create new Page (or use an existing one). Then in the Page's Settings → Linked Accounts → connect your Instagram Business account.

## Step 3 — Create a Facebook App

1. Go to https://developers.facebook.com/ → My Apps → Create App.
2. Type: **Business**. Give it any name.
3. From the new app's dashboard, add the **Instagram Graph API** product.
4. Add the **Facebook Login** product as well (needed to mint tokens).

## Step 4 — Get a long-lived Page access token

Easiest path is the Graph API Explorer:

1. Open https://developers.facebook.com/tools/explorer/
2. Select your app from the dropdown.
3. "Get Token" → "Get User Access Token" → grant these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `business_management`
4. Submit. You now have a short-lived **user** token. Exchange it for a long-lived **user** token:
   ```
   GET https://graph.facebook.com/v23.0/oauth/access_token
       ?grant_type=fb_exchange_token
       &client_id=<APP_ID>
       &client_secret=<APP_SECRET>
       &fb_exchange_token=<SHORT_USER_TOKEN>
   ```
5. With the long-lived user token, fetch your Page's access token (this one **never expires** as long as you keep the password):
   ```
   GET https://graph.facebook.com/v23.0/me/accounts?access_token=<LONG_USER_TOKEN>
   ```
   Find your page in the response and copy its `access_token`. That's `IG_ACCESS_TOKEN`.

## Step 5 — Find your IG Business Account ID

```
GET https://graph.facebook.com/v23.0/<PAGE_ID>?fields=instagram_business_account&access_token=<PAGE_TOKEN>
```

The numeric `id` in `instagram_business_account` is `IG_USER_ID`.

## Step 6 — Pick an image host

Instagram's Graph API won't accept image bytes — it fetches images from public URLs. Two ways to give it one:

### Option A — Cloudinary (simpler, recommended)

1. Sign up at https://cloudinary.com (free tier is more than enough).
2. Dashboard → note your **Cloud name**.
3. Settings → Upload → "Add upload preset" → set **Signing mode = Unsigned** → save the preset name.
4. Set in `.env`:
   ```
   IMAGE_HOST=cloudinary
   CLOUDINARY_CLOUD_NAME=<your cloud name>
   CLOUDINARY_UPLOAD_PRESET=<your preset name>
   ```

### Option B — Local tunnel via cloudflared

Useful if you don't want a third-party host.

1. Install cloudflared:  download from https://github.com/cloudflare/cloudflared/releases (macOS arm64 .pkg).
2. Serve your output folder with any static server, e.g.:
   ```bash
   cd ~/motion-graphics/designs/itiha-indenture/output
   python3 -m http.server 8088
   ```
3. In a second terminal:
   ```bash
   cloudflared tunnel --url http://localhost:8088
   ```
4. Copy the `https://*.trycloudflare.com` URL it prints.
5. Set in `.env`:
   ```
   IMAGE_HOST=tunnel
   TUNNEL_PUBLIC_URL=https://your-random-name.trycloudflare.com
   ```
6. Keep both terminals open while you run `bin/publish`.

## Step 7 — Wire it up

```bash
cp .env.example .env
$EDITOR .env       # paste in IG_USER_ID, IG_ACCESS_TOKEN, and image-host creds
bin/render itiha-indenture
bin/publish itiha-indenture
```

If anything fails, the error message will name the specific Graph API call. Most common issues:

- `(#10) Application does not have permission for this action` — your token is missing `instagram_content_publish`. Repeat Step 4.
- `Media uploaded is not in a supported format` — the image URL is unreachable or returned HTML instead of a PNG. Hit the URL in your browser to verify.
- Image looks blank in the post — Cloudinary may have stripped the alpha. Re-upload with the preset set to keep PNGs untouched (Delivery type: `upload`, Fetch format: `auto` off).
