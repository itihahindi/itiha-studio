#!/usr/bin/env bash
# Prepare a Claude Code web/remote session to render Kavi Studio designs.
# Idempotent and safe to run on every SessionStart: it no-ops once satisfied,
# and never fails the session — a broken setup just means `bin/kavi` behaves as
# it does normally. See tools/web_render.py for why each step is needed.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE="$ROOT/tools/.web-cache"
VENDOR="$CACHE/vendor"
mkdir -p "$VENDOR"

# Only meaningful in the managed env (pre-installed Chromium present).
if [ ! -d /opt/pw-browsers ]; then
  echo "web-setup: not a managed web env (no /opt/pw-browsers) — nothing to do."
  exit 0
fi

# 1. Playwright Python bindings. We drive the pre-installed Chromium via
#    executable_path, so the exact version only needs a compatible CDP; 1.56.0
#    matches the shipped build (1194) and is a safe default.
if ! python -c "import playwright" 2>/dev/null; then
  echo "web-setup: installing playwright==1.56.0"
  pip install --quiet "playwright==1.56.0" || echo "web-setup: pip install failed (render will be unavailable)"
fi

# 1b. PyYAML — src/content.py needs it to load designs (the rest of
#     requirements.txt, incl. the ~700 MB rembg stack, is not needed to render).
python -c "import yaml" 2>/dev/null || pip install --quiet "pyyaml==6.0.2" || true

# 2. Vendor the CDN JS libs render-host.html expects. unpkg.com is egress-
#    blocked; the npm registry is allowed, so pull them from there once and
#    cache under tools/.web-cache (gitignored).
need=0
for f in react.development.js react-dom.development.js babel.min.js; do
  [ -s "$VENDOR/$f" ] || need=1
done
if [ "$need" = 1 ]; then
  echo "web-setup: vendoring react / react-dom / @babel/standalone from npm"
  tmp="$(mktemp -d)"
  (
    cd "$tmp" || exit 1
    npm pack react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0 >/dev/null 2>&1
    mkdir -p a b c
    tar xzf react-18.3.1.tgz -C a
    tar xzf react-dom-18.3.1.tgz -C b
    tar xzf babel-standalone-7.29.0.tgz -C c
    cp a/package/umd/react.development.js "$VENDOR/"
    cp b/package/umd/react-dom.development.js "$VENDOR/"
    cp c/package/babel.min.js "$VENDOR/"
  ) || echo "web-setup: vendoring failed (render will be unavailable)"
  rm -rf "$tmp"
fi

if [ -s "$VENDOR/react.development.js" ] && [ -s "$VENDOR/babel.min.js" ]; then
  echo "web-setup: ready — render with  tools/web-render.sh <design-slug>"
fi
exit 0
