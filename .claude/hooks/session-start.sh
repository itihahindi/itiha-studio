#!/bin/bash
# SessionStart hook: prepare Claude Code web/remote sessions to render Kavi
# Studio designs (Playwright + pre-installed Chromium + vendored CDN libs).
# Local machines are unaffected — this is a no-op outside the remote env.
set -uo pipefail

# Only run in Claude Code on the web / remote; local dev uses bin/kavi as usual.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

bash "${CLAUDE_PROJECT_DIR:-.}/tools/web-setup.sh" || true
exit 0
