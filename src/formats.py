"""Platform format presets for the motion-graphics library.

Add new formats here as needed; designs reference them by key in `design.json`.
"""

FORMATS = {
    "instagram-portrait":  {"width": 1080, "height": 1350, "aspect": "4:5"},
    "instagram-square":    {"width": 1080, "height": 1080, "aspect": "1:1"},
    "instagram-landscape": {"width": 1080, "height": 566,  "aspect": "1.91:1"},
    "instagram-story":     {"width": 1080, "height": 1920, "aspect": "9:16"},
    "instagram-reel":      {"width": 1080, "height": 1920, "aspect": "9:16"},
    "youtube-thumbnail":   {"width": 1280, "height": 720,  "aspect": "16:9"},
    "youtube-end-card":    {"width": 1920, "height": 1080, "aspect": "16:9"},
}


def get(name: str) -> dict:
    if name not in FORMATS:
        raise ValueError(f"Unknown format: {name}. Known: {', '.join(FORMATS)}")
    return FORMATS[name]
