# -*- coding: utf-8 -*-
"""초등학교 통학구역 / 중학교 학교군 SHP -> pipeline/data/edu_zones.json.gz (서울만, WGS84, 단순화).
사용: python3 -I pipeline/build_edu_zones.py <초등 통학구역 SHP 폴더> <중학교 학교군 SHP 폴더>
필요: pip install pyshp pyproj shapely (개발 환경에서 한 번만). 결과 파일은 저장소에 커밋하고, 단지->구역 판정은 build_master_data.py 가 순수 파이썬으로 한다.
출처: 한국교육시설안전원 초등학교통학구역(15159265), 중학교학교군(15159264), 기준 2026-09-20.
통학구역은 '해당 구역'이며 학교 배정을 보장하지 않는다(공동통학구역은 두 학교가 함께 쓴다)."""
import glob, gzip, json, os, re, sys, warnings
warnings.filterwarnings("ignore")
import shapefile
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

def read(folder, sido="11", tol_m=6.0):
    shp = glob.glob(os.path.join(folder, "*.shp"))[0]; cpg = glob.glob(os.path.join(folder, "*.cpg"))
    enc = (open(cpg[0]).read().strip() if cpg else "euc_kr").replace("-", "_").lower()
    r = shapefile.Reader(shp, encoding=enc); to_ll = Transformer.from_crs("EPSG:5186", "EPSG:4326", always_xy=True); out = []
    for sr in r.iterShapeRecords():
        d = sr.record.as_dict()
        if d["SD_CD"] != sido: continue
        g = shape(sr.shape.__geo_interface__).buffer(0).simplify(tol_m, preserve_topology=True)   # 투영좌표(m) 기준 단순화
        polys = [g] if g.geom_type == "Polygon" else list(g.geoms)
        rings = []
        for p in polys:
            for ring in [p.exterior] + list(p.interiors):
                rings.append([[round(x, 5), round(y, 5)] for x, y in (to_ll.transform(a, b) for a, b in ring.coords)])
        out.append({"id": d["HAKGUDO_ID"], "name": d["HAKGUDO_NM"], "edu": d["EDU_NM"], "gb": d["HAKGUDO_GB"], "baseDt": d["BASE_DT"], "rings": rings})
    return out

if __name__ == "__main__":
    es, ms = read(sys.argv[1]), read(sys.argv[2])
    doc = {"source": {"es": "한국교육시설안전원 초등학교통학구역 (공공데이터포털 15159265)", "ms": "한국교육시설안전원 중학교학교군 (공공데이터포털 15159264)"}, "es": es, "ms": ms}
    p = os.path.join(ROOT, "pipeline", "data", "edu_zones.json.gz"); os.makedirs(os.path.dirname(p), exist_ok=True)
    with gzip.open(p, "wt", encoding="utf8", compresslevel=9) as f: json.dump(doc, f, ensure_ascii=False, separators=(",", ":"))
    print(f"초등 {len(es)}개, 중학교군 {len(ms)}개, {os.path.getsize(p) // 1024}KB")
