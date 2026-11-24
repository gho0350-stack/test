"""학구도 SHP -> 앱용 학교군 경계(zones-data.js).
사용: python3 -I pipeline/build_zones.py <고등학교학교군 SHP가 있는 폴더>
필요: pip install pyshp pyproj shapely  (개발 PC/세션에서 한 번만 실행, 결과 zones-data.js 를 커밋)
- 좌표계: 한국 2000 중부원점(EPSG:5186) -> WGS84
- 학교 -> 학교군: 학교 좌표(카카오 지오코딩)가 경계 안에 있는지 계산 (학교학구도 연계정보 CSV 로 교차 검증 예정)
- 경계 포함 여부는 '학교군 해당'이며 특정 학교 배정을 뜻하지 않는다."""
import glob, json, os, sys, warnings
warnings.filterwarnings("ignore")
import shapefile
from pyproj import Transformer
from shapely.geometry import shape, Point
from shapely.ops import transform

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

def main(folder, sido="11", tol=0.0004):
    shp = glob.glob(os.path.join(folder, "*.shp"))[0]; cpg = glob.glob(os.path.join(folder, "*.cpg"))
    enc = (open(cpg[0]).read().strip() if cpg else "euc_kr").replace("-", "_").lower()
    r = shapefile.Reader(shp, encoding=enc); tr = Transformer.from_crs("EPSG:5186", "EPSG:4326", always_xy=True)
    zones, geoms = [], {}
    for sr in r.iterShapeRecords():
        d = sr.record.as_dict()
        if d["SD_CD"] != sido: continue
        g = transform(tr.transform, shape(sr.shape.__geo_interface__)).simplify(tol, preserve_topology=True)
        polys = [g] if g.geom_type == "Polygon" else list(g.geoms)
        zones.append({"id": d["HAKGUDO_ID"], "name": d["HAKGUDO_NM"], "edu": d["EDU_NM"], "baseDt": d["BASE_DT"], "gb": d["HAKGUDO_GB"],
                      "rings": [[[round(x, 5), round(y, 5)] for x, y in p.exterior.coords] for p in polys]})
        geoms[d["HAKGUDO_ID"]] = shape(sr.shape.__geo_interface__)   # 판정은 원본 경계로
    k = json.load(open(os.path.join(ROOT, "pipeline", "out", "kakao_neis_result.json"), encoding="utf8"))
    school_zone = {}
    for sid, s in k["schools"].items():
        x, y = Transformer.from_crs("EPSG:4326", "EPSG:5186", always_xy=True).transform(s["x"], s["y"])
        hit = [zid for zid, g in geoms.items() if g.contains(Point(x, y))]
        if len(hit) == 1: school_zone[sid] = hit[0]
    out = {"source": "한국교육시설안전원 고등학교학교군 (공공데이터포털 15159263)", "sido": sido, "zones": zones, "schoolZone": school_zone}
    path = os.path.join(ROOT, "schoolmap", "zones-data.js")
    open(path, "w", encoding="utf8").write("window.SG_ZONES = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"학교군 {len(zones)}개, 학교 매칭 {len(school_zone)}/{len(k['schools'])}, {os.path.getsize(path) // 1024}KB -> {os.path.abspath(path)}")

if __name__ == "__main__":
    main(sys.argv[1])
