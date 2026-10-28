"""Fetch an Indian government / financial data file and show what's in it.

    python3 .claude/skills/india-data/fetch.py URL [--out PATH] [--sheet N] [--rows N] [--grep TEXT]

- Saves the file (default: a scratch path printed at the end) and prints a
  summary: JSON shape and first records, every row of an .xlsx sheet as TSV
  (no openpyxl needed), or the page count / first text of a PDF.
- Sends a normal browser User-Agent; Wikimedia gets the contact UA it requires.
- NEVER turns off TLS verification. A certificate error means find the same
  data on another host (e.g. niryat.gov.in → trade-analytics.commerce.gov.in),
  not bypass the check.
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
import tempfile
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

BROWSER_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/128.0 Safari/537.36")
WIKI_UA = "KaviStudio/1.0 (https://github.com/itihahindi/itiha-studio; itihahindi@gmail.com)"


def get(url: str, tries: int = 3) -> tuple[bytes, str]:
    ua = WIKI_UA if "wikimedia.org" in url or "wikipedia.org" in url else BROWSER_UA
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept": "*/*"})
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=60, context=ssl.create_default_context()) as r:
                return r.read(), r.headers.get("Content-Type", "")
        except urllib.error.URLError as e:
            if isinstance(e.reason, ssl.SSLCertVerificationError):
                sys.exit(f"!! TLS certificate problem at {url}: {e.reason}\n"
                         "   Do not bypass it. Look for the same data on another host or a published file.")
            last = e
        except Exception as e:  # noqa: BLE001 - report and retry
            last = e
        time.sleep(2 * (i + 1))
    sys.exit(f"!! could not fetch {url}: {last}")


def xlsx_rows(path: Path, sheet: int = 1) -> list[list[str]]:
    """Every row of one sheet, as strings, with empty cells kept in place."""
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        xml = z.read("xl/sharedStrings.xml").decode("utf8")
        shared = [re.sub(r"<[^>]+>", "", si) for si in re.findall(r"<si>(.*?)</si>", xml, re.S)]
    names = sorted((n for n in z.namelist() if re.match(r"xl/worksheets/sheet\d+\.xml", n)),
                   key=lambda n: int(re.search(r"(\d+)", n.rsplit("/", 1)[1]).group(1)))
    xml = z.read(names[sheet - 1]).decode("utf8")

    def col(ref: str) -> int:
        n = 0
        for ch in re.match(r"[A-Z]+", ref).group(0):
            n = n * 26 + ord(ch) - 64
        return n - 1

    out = []
    for row in re.findall(r"<row[^>]*>(.*?)</row>", xml, re.S):
        cells: dict[int, str] = {}
        for m in re.finditer(r'<c r="([A-Z]+\d+)"([^>]*?)(?:/>|>(.*?)</c>)', row, re.S):
            ref, attrs, body = m.groups()
            body = body or ""
            v = re.search(r"<v>(.*?)</v>", body, re.S)
            t = re.search(r"<t[^>]*>(.*?)</t>", body, re.S)
            if 't="s"' in attrs and v:
                val = shared[int(v.group(1))]
            elif t:
                val = t.group(1)
            else:
                val = v.group(1) if v else ""
            cells[col(ref)] = (val.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").strip())
        out.append([cells.get(i, "") for i in range(max(cells) + 1)] if cells else [])
    return out


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--out", type=Path)
    ap.add_argument("--sheet", type=int, default=1)
    ap.add_argument("--rows", type=int, default=60)
    ap.add_argument("--grep", help="only print rows / records containing this text")
    a = ap.parse_args(argv)

    data, ctype = get(a.url)
    ext = Path(a.url.split("?")[0]).suffix.lower()
    if not ext:
        ext = ".json" if "json" in ctype else ".pdf" if "pdf" in ctype else ".html" if "html" in ctype else ".bin"
    out = a.out or Path(tempfile.mkdtemp(prefix="india-data-")) / f"download{ext}"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(data)
    print(f"{len(data):,} bytes · {ctype or 'unknown type'}")

    if data[:4] == b"PK\x03\x04" and ext in (".xlsx", ".bin", ""):
        rows = xlsx_rows(out, a.sheet)
        shown = [r for r in rows if not a.grep or any(a.grep.lower() in c.lower() for c in r)]
        for r in shown[: a.rows]:
            print("\t".join(r))
        print(f"-- {len(rows)} rows in sheet {a.sheet}")
    elif data[:4] == b"%PDF":
        pages = len(re.findall(rb"/Type\s*/Page[^s]", data))
        print(f"PDF, ~{pages} pages. Read it with the Read tool (pages: '1-5'), which handles PDFs,")
        print("or the anthropic-skills:pdf skill for table extraction.")
    else:
        try:
            j = json.loads(data)
            recs = j if isinstance(j, list) else next((v for v in j.values() if isinstance(v, list)), [j]) if isinstance(j, dict) else [j]
            print(f"JSON: {type(j).__name__}" + (f", keys {list(j)[:10]}" if isinstance(j, dict) else f", {len(j)} records"))
            shown = [r for r in recs if not a.grep or a.grep.lower() in json.dumps(r).lower()]
            for r in shown[: a.rows]:
                print(json.dumps(r, ensure_ascii=False)[:300])
        except ValueError:
            text = re.sub(r"\s+", " ", re.sub(r"<script.*?</script>|<style.*?</style>|<[^>]+>", " ",
                                              data.decode("utf8", "replace"), flags=re.S))
            print(text[:1500])
            if len(data) < 2000:
                print("!! tiny response: likely a bot wall, a redirect stub or an error page")
    print(f"saved {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
