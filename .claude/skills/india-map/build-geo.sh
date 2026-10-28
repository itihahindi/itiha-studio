#!/usr/bin/env bash
# Rebuild shared/geo/india.js, india-districts.js and india-pc.js from source.
# Needs node (npx mapshaper) and python3. Run from anywhere; works in a temp dir.
#
#   bash .claude/skills/india-map/build-geo.sh
#
# After a rebuild, re-run the outline check at the bottom and read its output:
# anything over ~200 km² that is NOT a coastal sliver means the source has
# changed its boundary. Do not ship it; the official outline is a hard rule.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../../.." && pwd)"
W="$(mktemp -d)"; cd "$W"
ms() { npx -y mapshaper@0.6.102 "$@" 2>&1 | grep -iv warn | tail -1; }

DM=https://github.com/datameet/maps/raw/master
DT=https://github.com/datta07/INDIAN-SHAPEFILES/raw/main/INDIA
for f in Admin2.shp Admin2.dbf Admin2.shx Admin2.prj; do curl -sL -o "$f" "$DM/States/$f"; done
curl -sL -o india-soi.geojson "$DM/Country/india-soi.geojson"
curl -sL -o districts.geojson "$DT/INDIA_DISTRICTS.geojson"
curl -sL -o pc.json "$DT/INDIA_PARLIMENTARY_BOUNDARIES.json"

# States (DataMeet, CC BY 4.0)
ms -i Admin2.shp -simplify interval=2500 keep-shapes -clean -o simp.json format=geojson precision=0.001
ms -i simp.json -points inner -o pts.json format=geojson
# Districts (datta07, MIT)
ms -i districts.geojson -simplify interval=1500 keep-shapes -clean -o sd.json format=geojson precision=0.001
ms -i sd.json -dissolve stname -o sd-states.json format=geojson precision=0.001
ms -i sd.json -points inner -o sd-pts.json format=geojson
# Constituencies (datta07, MIT); state by largest overlap with DataMeet states
ms -i pc.json -simplify interval=2500 keep-shapes -clean -join Admin2.shp largest-overlap fields=ST_NM -o sp.json format=geojson precision=0.001
ms -i sp.json -dissolve ST_NM -o sp-states.json format=geojson precision=0.001
ms -i sp.json -points inner -o sp-pts.json format=geojson

python3 - "$REPO" <<'EOF'
import json, sys, collections
repo = sys.argv[1]
R = lambda v: round(v, 3)
def rings(g):
    if not g: return []
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    return [[[R(x), R(y)] for x, y in ring] for poly in polys for ring in poly]
STN = {'ANDAMAN & NICOBAR': 'Andaman & Nicobar', 'JAMMU & KASHMIR': 'Jammu & Kashmir',
       'DADRA,NAGAR HAVELI,DAMAN & DIU': 'Dadra and Nagar Haveli and Daman and Diu'}
sname = lambda s: STN.get(s) or s.title().replace(' And ', ' and ')
def splice(path, var, data):
    # keep the hand-written header, replace the data line
    src = open(path).read().split('\n')
    head = [l for l in src if l.startswith('//')]
    open(path, 'w').write('\n'.join(head) + f'\nwindow.{var}=' + json.dumps(data, separators=(',', ':')) + ';\n')

g, p = json.load(open('simp.json')), json.load(open('pts.json'))
splice(f'{repo}/shared/geo/india.js', 'INDIA_GEO', {
    's': {f['properties']['ST_NM']: rings(f['geometry']) for f in g['features']},
    'l': {f['properties']['ST_NM']: [R(c) for c in f['geometry']['coordinates']] for f in p['features'] if f['geometry']}})

d, dp, ds = (json.load(open(x)) for x in ('sd.json', 'sd-pts.json', 'sd-states.json'))
splice(f'{repo}/shared/geo/india-districts.js', 'INDIA_DIST', {
    'u': [[f['properties']['dtname'], sname(f['properties']['stname']), f['properties']['Dist_LGD'] or None,
           [R(c) for c in q['geometry']['coordinates']], rings(f['geometry'])] for f, q in zip(d['features'], dp['features'])],
    's': {sname(f['properties']['stname']): rings(f['geometry']) for f in ds['features']}})

c, cp, cs = (json.load(open(x)) for x in ('sp.json', 'sp-pts.json', 'sp-states.json'))
units = [[f['properties']['PC_NAME'] or None, f['properties']['ST_NM'],
          f['properties']['PC_CODE'] if f['properties']['PC_CODE'] != -1 else None,
          [R(v) for v in q['geometry']['coordinates']], rings(f['geometry'])] for f, q in zip(c['features'], cp['features'])]
n = sum(1 for u in units if u[0])
assert n == 543, f'{n} constituencies, expected 543'
splice(f'{repo}/shared/geo/india-pc.js', 'INDIA_PC', {
    'u': units, 's': {f['properties']['ST_NM']: rings(f['geometry']) for f in cs['features']}})
print('states', len(g['features']), '· districts', len(d['features']), '· constituencies', n)
EOF

echo "Outline check: Survey of India area missing from each layer (km², lon,lat):"
ms -i Admin2.shp -dissolve -o u-states.json format=geojson
ms -i districts.geojson -dissolve -o u-dist.json format=geojson
ms -i pc.json -dissolve -o u-pc.json format=geojson
for u in u-states u-dist u-pc; do
  echo "== $u"
  npx -y mapshaper@0.6.102 -i india-soi.geojson -erase $u.json -explode -each 'a=Math.round(this.area/1e6)' \
    -filter 'a>200' -each 'c=this.centroidX.toFixed(2)+","+this.centroidY.toFixed(2)' -o format=csv - 2>/dev/null | cut -d, -f2-
done
echo "Expect only coastal slivers (Kutch ~70E 23N, Mumbai ~73E 19N). Anything north of 32N is a boundary change: stop."
