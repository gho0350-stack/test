"""샘플 GeoJSON 생성기. 좌표는 위례 일대를 흉내 낸 가짜 값이며 실제 지형과 다릅니다.
실행: python3 tools/make_sample_geo.py  (wirye-map 폴더에서)"""
import json, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'data')

def fc(features):
    return {"type": "FeatureCollection", "features": features}

def line(props, coords):
    return {"type": "Feature", "properties": props, "geometry": {"type": "LineString", "coordinates": coords}}

def poly(props, ring):
    ring = ring + [ring[0]]
    return {"type": "Feature", "properties": props, "geometry": {"type": "Polygon", "coordinates": [ring]}}

def dump(name, obj):
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))

# ── 영역 (북위례 / 남위례) ─────────────────────────────
north = [[127.1330,37.4720],[127.1400,37.4735],[127.1500,37.4750],[127.1620,37.4765],[127.1690,37.4790],
         [127.1680,37.4860],[127.1600,37.4890],[127.1480,37.4875],[127.1370,37.4870],[127.1315,37.4830],[127.1310,37.4770]]
south = [[127.1290,37.4650],[127.1400,37.4668],[127.1500,37.4690],[127.1600,37.4705],[127.1670,37.4700],
         [127.1685,37.4640],[127.1660,37.4590],[127.1560,37.4585],[127.1440,37.4605],[127.1340,37.4610],[127.1285,37.4620]]
zones = fc([poly({"zone_id": "wirye_north"}, north), poly({"zone_id": "wirye_south"}, south)])
dump('zones.geojson', zones)

# ── 하천 (rank 1: 탄천, 2: 장지천·창곡천, 3: 소하천) ─────
stream_a = [[127.1690,37.4725],[127.1600,37.4730],[127.1500,37.4712],[127.1400,37.4690],[127.1300,37.4672],[127.1195,37.4660]]
water = fc([
    line({"name": "탄천", "rank": 1}, [[127.1175,37.5050],[127.1150,37.4950],[127.1130,37.4850],[127.1150,37.4750],[127.1190,37.4650],[127.1180,37.4550],[127.1150,37.4450]]),
    line({"name": "장지천", "rank": 2}, [[127.1700,37.4975],[127.1500,37.4930],[127.1330,37.4905],[127.1135,37.4860]]),
    line({"name": "창곡천", "rank": 2}, [[127.1700,37.4520],[127.1550,37.4560],[127.1400,37.4585],[127.1280,37.4580],[127.1185,37.4600]]),
    line({"name": "위례 수변축(샘플)", "rank": 3}, stream_a),
    line({"name": "북쪽 소하천(샘플)", "rank": 3}, [[127.1450,37.4930],[127.1430,37.4895],[127.1385,37.4880],[127.1330,37.4905]]),
    line({"name": "남쪽 소하천(샘플)", "rank": 3}, [[127.1620,37.4585],[127.1590,37.4562],[127.1550,37.4560]]),
])
dump('base_waterways.geojson', water)

# ── 공원·녹지 ────────────────────────────────────────
belt = [[x, y + 0.0010] for x, y in stream_a] + [[x, y - 0.0010] for x, y in reversed(stream_a)]
def box(cx, cy, w, h):
    return [[cx-w, cy-h],[cx+w, cy-h],[cx+w, cy+h],[cx-w, cy+h]]
parks = fc([
    poly({"kind": "hill", "name": "동쪽 산(샘플)"}, [[127.1720,37.4900],[127.1900,37.4900],[127.1900,37.4500],[127.1720,37.4540],[127.1740,37.4700]]),
    poly({"kind": "hill", "name": "남쪽 산(샘플)"}, [[127.1100,37.4400],[127.1900,37.4400],[127.1900,37.4500],[127.1720,37.4540],[127.1600,37.4500],[127.1400,37.4520],[127.1200,37.4480]]),
    poly({"kind": "park", "name": "위례 수변공원(샘플)"}, belt),
    poly({"kind": "park", "name": "북위례 공원(샘플)"}, box(127.1505, 37.4840, 0.0030, 0.0008)),
    poly({"kind": "park", "name": "남위례 공원(샘플)"}, box(127.1470, 37.4605, 0.0035, 0.0007)),
])
dump('base_parks.geojson', parks)

# ── 간선도로 ─────────────────────────────────────────
roads = fc([
    line({"name": "서측 간선(샘플)", "cls": "major"}, [[127.1245,37.4950],[127.1250,37.4800],[127.1262,37.4700],[127.1270,37.4600]]),
    line({"name": "북측 가로(샘플)", "cls": "major"}, [[127.1260,37.4800],[127.1400,37.4790],[127.1550,37.4800],[127.1700,37.4815]]),
    line({"name": "남측 가로(샘플)", "cls": "major"}, [[127.1275,37.4640],[127.1400,37.4650],[127.1550,37.4670],[127.1700,37.4665]]),
    line({"name": "동측 간선(샘플)", "cls": "major"}, [[127.1580,37.4900],[127.1585,37.4770],[127.1590,37.4680],[127.1600,37.4560]]),
    line({"name": "중앙 간선(샘플)", "cls": "major"}, [[127.1420,37.4880],[127.1425,37.4780],[127.1430,37.4680],[127.1440,37.4590]]),
])
dump('base_roads.geojson', roads)

# ── 소로 격자 (영역 안쪽만) ───────────────────────────
def inside(pt, ring):
    x, y = pt; ok = False; n = len(ring)
    for i in range(n):
        x1, y1 = ring[i]; x2, y2 = ring[(i+1) % n]
        if (y1 > y) != (y2 > y) and x < (x2-x1)*(y-y1)/(y2-y1)+x1:
            ok = not ok
    return ok

def in_zone(pt):
    return inside(pt, north) or inside(pt, south)

local = []
step = 0.0002
lat = 37.455; i = 0
while lat < 37.495:
    lon = 127.128
    run = []
    while lon < 127.172:
        a = (lon, lat); b = (lon+step, lat)
        if in_zone(a) and in_zone(b):
            run.append(a)
            if not in_zone((lon+2*step, lat)):
                run.append(b)
        else:
            if len(run) > 1: local.append(line({"cls": "sub" if i % 3 == 0 else "local"}, [list(p) for p in run]))
            run = []
        lon += step
    if len(run) > 1: local.append(line({"cls": "sub" if i % 3 == 0 else "local"}, [list(p) for p in run]))
    lat += 0.0012; i += 1
lon = 127.128; j = 0
while lon < 127.172:
    lat = 37.455; run = []
    while lat < 37.495:
        a = (lon, lat); b = (lon, lat+step)
        if in_zone(a) and in_zone(b):
            run.append(a)
            if not in_zone((lon, lat+2*step)):
                run.append(b)
        else:
            if len(run) > 1: local.append(line({"cls": "sub" if j % 3 == 0 else "local"}, [list(p) for p in run]))
            run = []
        lat += step
    if len(run) > 1: local.append(line({"cls": "sub" if j % 3 == 0 else "local"}, [list(p) for p in run]))
    lon += 0.0016; j += 1
dump('base_local_roads.geojson', fc(local))

# ── 노선 (기존 / 공사중 / 계획) ───────────────────────
lines = fc([
    line({"line_id": "l_8"}, [[127.1255,37.4900],[127.1262,37.4786],[127.1266,37.4701],[127.1330,37.4650],[127.1365,37.4625],[127.1430,37.4600]]),
    line({"line_id": "l_wirye"}, [[127.1266,37.4701],[127.1350,37.4706],[127.1455,37.4726],[127.1500,37.4742],[127.1620,37.4770],[127.1685,37.4800]]),
    line({"line_id": "l_sinsa"}, [[127.1455,37.4726],[127.1350,37.4755],[127.1262,37.4786],[127.1100,37.4870],[127.0900,37.4960]]),
])
dump('lines.geojson', lines)
print('ok', len(local), 'local road segments')
