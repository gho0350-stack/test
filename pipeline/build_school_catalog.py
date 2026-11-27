# -*- coding: utf-8 -*-
"""학교 목록(data/schools_seed.csv)을 기준으로 앱·파이프라인 입력을 한 번에 만든다.
 - out/neis_schools.json : NEIS 학교 기본정보 행(학교 목록 out/schools_all.json 에서). 기존 파일에 있는 학교는 기존 행 유지
 - schoolmap/schools-data.js : 앱이 쓰는 학교 목록(id, 표시 이름, 지역)
 - schoolmap/zones-data.js 의 schoolZone : 학교 좌표(out/school_geo.json)를 고등학교 학교군 원본 경계(pipeline/data/edu_zones.json.gz)에 넣어 판정
학교를 늘리려면 data/schools_seed.csv 에 한 줄(학교 id, NEIS 정식 명칭, 지역 id)을 추가하고 collect-data 를 한 번 실행하면 된다."""
import csv, gzip, json, os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
P = lambda *a: os.path.join(ROOT, *a)

def short(name):
    n = {"단국대학교사범대학부속고등학교": "단대부고", "중앙대학교사범대학부속고등학교": "중대부고"}.get(name)
    if n: return n
    n = re.sub(r"여자고등학교$", "여고", name); return re.sub(r"고등학교$", "고", n)

def pip(x, y, ring):
    c = False; j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]; xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi: c = not c
        j = i
    return c

def hs_zone(x, y, zones):
    for z in zones:
        inside = False
        for r in z["rings"]:
            if pip(x, y, r): inside = not inside
        if inside: return z["id"]
    return None

def run(log=print):
    seed = list(csv.DictReader(open(P("data", "schools_seed.csv"), encoding="utf-8-sig")))
    allr = {x["SCHUL_NM"]: x for x in json.load(open(P("pipeline", "out", "schools_all.json"), encoding="utf8")) if x["SCHUL_KND_SC_NM"] == "고등학교"}
    old = json.load(open(P("pipeline", "out", "neis_schools.json"), encoding="utf8")) if os.path.exists(P("pipeline", "out", "neis_schools.json")) else {}
    neis, miss = {}, []
    for s in seed:
        rows = old.get(s["school_id"]) or ([allr[s["official_name"]]] if s["official_name"] in allr else [])
        if rows: neis[s["school_id"]] = rows
        else: miss.append(s["official_name"])
    json.dump(neis, open(P("pipeline", "out", "neis_schools.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    js = "window.SG_SCHOOLS=" + json.dumps([{"id": s["school_id"], "name": s.get("display") or short(s["official_name"]), "region": s["region"]} for s in seed], ensure_ascii=False, separators=(",", ":")) + ";\n"
    open(P("schoolmap", "schools-data.js"), "w", encoding="utf8").write(js)
    # 학교 -> 고등학교 학교군
    geo = json.load(open(P("pipeline", "out", "school_geo.json"), encoding="utf8")) if os.path.exists(P("pipeline", "out", "school_geo.json")) else {}
    zd = json.load(gzip.open(P("pipeline", "data", "edu_zones.json.gz"), "rt", encoding="utf8"))
    zs = open(P("schoolmap", "zones-data.js"), encoding="utf8").read(); i = zs.index("{"); Z = json.loads(zs[i:zs.rindex("}") + 1])
    sz, nz = {}, []
    for s in seed:
        g = geo.get(s["official_name"])
        z = hs_zone(g["lng"], g["lat"], zd["hs"]) if g else None
        if z: sz[s["school_id"]] = z
        else: nz.append(s["official_name"])
    Z["schoolZone"] = sz
    open(P("schoolmap", "zones-data.js"), "w", encoding="utf8").write("window.SG_ZONES = " + json.dumps(Z, ensure_ascii=False, separators=(",", ":")) + ";\n")
    log(f"학교 {len(seed)}개 · NEIS 행 {len(neis)} (없음 {miss}) · 학교군 판정 {len(sz)} (미판정 {nz})")
    return {"schools": len(seed), "neis_missing": miss, "zone_missing": nz}

if __name__ == "__main__": run()
