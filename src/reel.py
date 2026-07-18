"""Compose a branded reel: fetch a video with yt-dlp, stack it under the
rendered VAQ header panel, encode a 1080×1920 MP4 ready for Instagram.

Flow (design needs one `reel-frame` slide, format instagram-reel):
  1. Render first — 01-slide.png in the output dir is the frame.
  2. yt-dlp downloads `video_url` at best video+audio (cached in the output
     dir; re-downloads only when the URL changes).
  3. ffmpeg crops the top `panel_height` strip from the frame PNG, cover-crops
     the video to fill the rest, vstacks them, keeps the source audio.

Outputs: <output-dir>/reel.mp4 (9:16) and square.mp4 (1:1) — same panel strip,
the video cover-fills whatever the canvas leaves below it.

Instagram links use the user's own browser session (see _cookie_args).

CLI: reel.py <design-name>
"""

from __future__ import annotations

import json
import os
import subprocess
import urllib.parse
from pathlib import Path

import yaml

import content as content_mod


def _run(cmd: list[str], timeout: int = 600) -> subprocess.CompletedProcess:
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if proc.returncode != 0:
        tail = (proc.stderr or proc.stdout or "").strip()[-800:]
        raise RuntimeError(f"{cmd[0]} failed: {tail}")
    return proc


def _yt_dlp_bin() -> str:
    """Prefer the Homebrew binary — it tracks YouTube's anti-bot changes far
    better than anything installable on this venv's Python 3.9. The venv shim
    shadows it on PATH when .venv is active, so check brew's path first."""
    import shutil

    override = os.environ.get("YT_DLP_BIN", "").strip()
    for cand in ([override] if override else []) + ["/opt/homebrew/bin/yt-dlp", "/usr/local/bin/yt-dlp"]:
        if cand and Path(cand).exists():
            return cand
    found = shutil.which("yt-dlp")
    if found:
        return found
    raise RuntimeError("yt-dlp not found — `brew install yt-dlp`")


def _cookie_args(url: str) -> list[str]:
    """Instagram hides most posts from logged-out visitors, so IG links reuse
    the user's own browser session. IG_COOKIES_FILE beats IG_COOKIES_BROWSER
    (default chrome; set it empty to disable). May trigger a one-time macOS
    Keychain prompt — Allow it."""
    if "instagram.com" not in urllib.parse.urlparse(url).netloc:
        return []
    cookies_file = os.environ.get("IG_COOKIES_FILE", "").strip()
    if cookies_file:
        return ["--cookies", cookies_file]
    browser = os.environ.get("IG_COOKIES_BROWSER", "chrome").strip()
    return ["--cookies-from-browser", browser] if browser else []


def _download(url: str, out_dir: Path, log=print) -> Path:
    """Fetch best video+audio via the yt-dlp CLI; cache keyed on the URL."""
    marker = out_dir / "source.url"
    existing = sorted(out_dir.glob("source.mp4")) + sorted(out_dir.glob("source.webm"))
    if existing and marker.exists() and marker.read_text().strip() == url:
        log(f"  reusing downloaded video ({existing[0].name})")
        return existing[0]
    for old in existing:
        old.unlink()

    log("  fetching video (best quality + audio)…")
    _run([
        _yt_dlp_bin(), url,
        "-f", "bv*+ba/b", "--merge-output-format", "mp4",
        "-o", str(out_dir / "source.%(ext)s"),
        "--no-playlist", "--no-warnings", "--quiet",
        *_cookie_args(url),
    ], timeout=900)
    files = sorted(out_dir.glob("source.mp4")) + sorted(out_dir.glob("source.webm"))
    if not files:
        raise RuntimeError("yt-dlp reported success but no source file appeared")
    marker.write_text(url)
    log(f"  got {files[0].name}")
    return files[0]


def _probe_duration(video: Path) -> float:
    proc = _run(["ffprobe", "-v", "quiet", "-print_format", "json",
                 "-show_format", str(video)])
    try:
        return float(json.loads(proc.stdout)["format"]["duration"])
    except Exception:
        return 0.0


def compose_reel(design_dir: Path, log=print) -> dict:
    yaml_path = design_dir / "content.yaml"
    if not yaml_path.exists():
        raise RuntimeError(f"No content.yaml in {design_dir}")
    config = yaml.safe_load(yaml_path.read_text()) or {}

    slide = next((s for s in config.get("slides", [])
                  if (s or {}).get("layout") == "reel-frame"), None)
    if slide is None:
        raise RuntimeError("No reel-frame slide in this design — add one first.")
    url = str(slide.get("video_url") or "").strip()
    if not url:
        raise RuntimeError("The reel-frame slide has no Video URL.")

    output_dir = content_mod.output_dir_for(design_dir)
    frame = output_dir / "01-slide.png"
    if not frame.exists():
        raise RuntimeError(f"No rendered frame at {frame} — render first.")

    from PIL import Image
    with Image.open(frame) as im:
        width, height = im.size

    panel_h = int(slide.get("panel_height") or 560)
    panel_h -= panel_h % 2  # h264 yuv420p needs even dims
    video_h = height - panel_h
    if video_h <= 0:
        raise RuntimeError(f"panel_height {panel_h} leaves no room for video in {width}×{height}")

    source = _download(url, output_dir, log)

    # Same branded panel strip, two canvases: 9:16 reel + 1:1 square.
    variants = {"reel.mp4": height, "square.mp4": width}
    results = {}
    for name, canvas_h in variants.items():
        vid_h = canvas_h - panel_h
        if vid_h < 200:
            log(f"  skipping {name}: panel_height {panel_h} leaves only {vid_h}px of video")
            continue
        out = output_dir / name
        log(f"  compositing {name} ({width}×{canvas_h})…")
        filter_complex = (
            f"[0:v]scale={width}:{vid_h}:force_original_aspect_ratio=increase,"
            f"crop={width}:{vid_h},setsar=1[vid];"
            f"[1:v]crop={width}:{panel_h}:0:0[panel];"
            f"[panel][vid]vstack=inputs=2[out]"
        )
        _run([
            "ffmpeg", "-y", "-i", str(source), "-i", str(frame),
            "-filter_complex", filter_complex,
            "-map", "[out]", "-map", "0:a?",
            "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart", "-shortest",
            str(out),
        ])
        results[name] = str(out)

    if not results:
        raise RuntimeError("no output composed — lower panel_height")
    duration = _probe_duration(output_dir / next(iter(results)))
    log(f"  done ({duration:.1f}s): " + " · ".join(results))
    return {"outputs": sorted(results), "duration": round(duration, 1)}


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: reel.py <design-name>")
        return 2
    design_dir = Path(__file__).resolve().parents[1] / "designs" / argv[1]
    if not design_dir.is_dir():
        print(f"no such design: {design_dir}")
        return 1
    compose_reel(design_dir)
    return 0


if __name__ == "__main__":
    import sys
    raise SystemExit(main(sys.argv))
