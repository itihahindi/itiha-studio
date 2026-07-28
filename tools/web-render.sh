#!/usr/bin/env bash
# Render one or more Kavi Studio designs in a Claude Code web/remote session.
#   tools/web-render.sh the-redraw [other-slug ...]
# Ensures the environment is prepared, then renders. PNGs land in each design's
# normal output dir (content.output_dir_for / ITIHA_OUTPUT_ROOT); paths print
# at the end so they can be attached back to you.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ "$#" -lt 1 ]; then
  echo "usage: tools/web-render.sh <design-slug> [<design-slug> ...]"
  exit 2
fi

bash "$ROOT/tools/web-setup.sh"
exec python "$ROOT/tools/web_render.py" "$@"
