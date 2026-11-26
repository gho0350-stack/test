# -*- coding: utf-8 -*-
"""out/master.json.gz + schoolmap/zones-data.js -> schoolmap/master-data.js
각 단지의 좌표가 어느 고등학교 학교군 경계 안에 있는지 판정(point-in-polygon)해 zone 을 붙인다.
경계 밖/경계 근처(단순화 오차) 단지는 가장 가까운 경계까지 거리를 보고서에 남긴다. 오피스텔 등 아파트가 아닌 이름은 제외."""
import gzip, json, math, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SKIP = re.compile(r"오피스텔|레지던스|도시형|생활주택")

def pip(x, y, ring):
    c = False; j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]; xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi: c = not c
        j = i
    return c

def dist_m(x, y, ring):
    best = 1e18; k = math.cos(math.radians(y)) * 111320
    for i in range(len(ring) - 1):
        (x1, y1), (x2, y2) = ring[i], ring[i + 1]
        ax, ay, bx, by = (x1 - x) * k, (y1 - y) * 110540, (x2 - x) * k, (y2 - y) * 110540
        dx, dy = bx - ax, by - ay; t = 0 if dx == dy == 0 else max(0, min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(ax + t * dx, ay + t * dy))
    return best

def zone_of(x, y, zones, tol=250):
    for z in zones:
        if any(pip(x, y, r) for r in z["rings"]): return z["id"], 0
    d = min(((dist_m(x, y, r), z["id"]) for z in zones for r in z["rings"]), default=(1e18, None))
    return (d[1], round(d[0])) if d[0] <= tol else (None, round(d[0]))

def load_edu():
    """초등 통학구역/중학교 학교군(build_edu_zones.py 결과). 없으면 건너뛴다."""
    p = os.path.join(ROOT, "pipeline/data/edu_zones.json.gz")
    if not os.path.exists(p): return None
    d = json.load(gzip.open(p, "rt", encoding="utf8"))
    def prep(zs): return [dict(z, bb=(min(x for r in z["rings"] for x, _ in r), min(y for r in z["rings"] for _, y in r), max(x for r in z["rings"] for x, _ in r), max(y for r in z["rings"] for _, y in r))) for z in zs]
    return {"es": prep(d["es"]), "ms": prep(d["ms"])}

def hit_edu(x, y, zs):
    for z in zs:
        bx0, by0, bx1, by1 = z["bb"]
        if not (bx0 <= x <= bx1 and by0 <= y <= by1): continue
        inside = False
        for r in z["rings"]:
            if pip(x, y, r): inside = not inside     # 짝수-홀수 규칙: 구멍(내부 링)은 제외
        if inside: return z
    return None

def load_school_geo():
    p = os.path.join(ROOT, "pipeline/out/school_geo.json")
    return json.load(open(p, encoding="utf8")) if os.path.exists(p) else {}

def hav_m(lat1, lng1, lat2, lng2):
    k = math.cos(math.radians(lat1)) * 111320
    return math.hypot((lng2 - lng1) * k, (lat2 - lat1) * 110540)

def load_ms_members():
    """중학교군(학구ID) -> 소속 중학교 이름 목록. 학구도 연계정보(한국교육시설안전원, 공공데이터포털 15159266) 서울 행."""
    p = os.path.join(ROOT, "pipeline/out/zone_links_seoul.json.gz")
    if not os.path.exists(p): return {}
    m = {}
    for x in json.load(gzip.open(p, "rt", encoding="utf8")):
        if x.get("학교급구분") == "중학교": m.setdefault(x["학구ID"], []).append(x["학교명"])
    return m

def es_names(zname):
    """'서울미아초통학구역' -> ['서울미아초등학교'], '서울금옥초서울옥수초공동통학구역' -> 두 학교."""
    t = re.sub(r"(공동)?통학구역$", "", zname)
    parts = re.split(r"(?<=초)(?=서울)", t)
    return [re.sub(r"초$", "초등학교", p) for p in parts if p]

def avg12(rows, as_of):
    """월별 시리즈 [ym, 월 중앙값, 건수] 중 기준일 직전 12개월(달력 기준)을 건수로 가중평균. 단일 거래 달은 그 거래가가 그대로 들어가 거래가 평균에 가깝다."""
    y, mth = int(as_of[:4]), int(as_of[5:7]); lo = y * 12 + mth - 11
    rows = [r for r in (rows or []) if int(r[0][:4]) * 12 + int(r[0][4:6]) >= lo]
    n = sum(r[2] for r in rows)
    return round(sum(r[1] * r[2] for r in rows) / n, 2) if n else None

def b(v, ser=None, as_of=''):
    out = {}
    for k, s in (v or {}).items():
        av = avg12((ser or {}).get(k) or [], as_of)
        out[k] = [s["median"], s["min"], s["max"], s["count"], s["last"], av]
    return out

def run():
    m = json.load(gzip.open(os.path.join(ROOT, "pipeline/out/master.json.gz"), "rt", encoding="utf8"))
    zs = open(os.path.join(ROOT, "schoolmap/zones-data.js"), encoding="utf8").read(); Z = json.loads(zs[zs.index("{"):zs.rindex("}") + 1])
    # 앱에 싣는 구역: 샘플 학교가 속한 일반학교군 + 3단계로 묶인 학교군(용량 절감). 학교를 늘리면 자동으로 넓어진다.
    sch_zone = set(Z["schoolZone"].values()); name2id = {z["name"].replace("학교군", ""): z["id"] for z in Z["zones"]}
    meta = open(os.path.join(ROOT, "schoolmap/admission-rules.js"), encoding="utf8").read(); mi = meta.find("window.SG_RULES_META=")
    pairs = json.loads(meta[mi + len("window.SG_RULES_META="):meta.rindex(";")])["integrated"] if mi >= 0 else []
    need = set(sch_zone) | {name2id[x] for p in pairs for x in p if any(name2id.get(y) in sch_zone for y in p) and x in name2id}
    edu = load_edu(); geo = load_school_geo(); msm = load_ms_members(); n_es = n_ms = n_ed = n_mn = 0; msn, msn_ix = [], {}
    out, skipped, nocoord, border, outside, notneeded = [], 0, 0, 0, [], 0; details = {}
    for a in m["apts"]:
        if SKIP.search(a["name"]): skipped += 1; continue
        c = a.get("coord")
        if not c: nocoord += 1; continue
        zid, d = zone_of(c["lng"], c["lat"], Z["zones"])
        if zid is None: outside.append(f"{a['gu']} {a['dong']} {a['name']} ({d}m)"); continue
        if zid not in need: notneeded += 1; continue
        if d: border += 1
        hh = int(float(a["households"])) if a.get("households") else None
        ap = a.get("approved") or ""
        rec = {"id": a["uid"], "n": a["name"], "gu": a["gu"], "d": a["dong"], "la": round(c["lat"], 5), "lo": round(c["lng"], 5), "z": zid}
        if hh: rec["hh"] = hh
        yr = int(ap[:4]) if re.match(r"^\d{8}$", ap) else a.get("build_year")
        if yr: rec["yr"] = yr; rec["yk"] = 1 if re.match(r"^\d{8}$", ap) else 0
        if edu:
            ze = hit_edu(c["lng"], c["lat"], edu["es"]); zm = hit_edu(c["lng"], c["lat"], edu["ms"])
            if ze:
                rec["es"] = es_names(ze["name"]); n_es += 1
                ds = [(round(hav_m(c["lat"], c["lng"], geo[n]["lat"], geo[n]["lng"]) / 10) * 10 if n in geo else None) for n in rec["es"]]   # 단지->초등학교 직선거리(m)
                if any(v is not None for v in ds): rec["ed"] = ds; n_ed += 1
            if zm:
                rec["ms"] = zm["name"]; n_ms += 1
                mem = msm.get(zm["id"], []); near = sorted(((hav_m(c["lat"], c["lng"], geo[n]["lat"], geo[n]["lng"]), n) for n in mem if n in geo))[:3]
                if mem: rec["mc"] = len(mem)                      # 같은 중학교군에 속한 중학교 수
                if near:
                    rec["mn"] = [[msn_ix.setdefault(n, len(msn_ix)), round(dm / 10)] for dm, n in near]; n_mn += 1   # 가까운 순 [학교 번호, 직선거리(10m)]
                    for n in msn_ix:
                        if n not in msn: msn.append(n)
        if d: rec["zb"] = d                      # 경계 밖 250m 이내라 가까운 학교군으로 편입(단순화 오차 가능)
        if a.get("sale"): rec["sale"] = b(a["sale"], a["series"].get("sale"), a.get("asof", m["generatedAt"]))
        if a.get("jeonse"): rec["jeonse"] = b(a["jeonse"], a["series"].get("jeonse"), a.get("asof", m["generatedAt"]))
        ser = {k: {p: [[ym, v] for ym, v, _n in rows] for p, rows in (a["series"].get(k) or {}).items()} for k in ("sale", "jeonse")}
        det = {}
        if any(ser[k] for k in ser): det["ser"] = ser
        rc = a.get("recent") or {}
        if any(rc.get(k) for k in ("sale", "jeonse")): det["rc"] = rc
        if det: details.setdefault(a["uid"][:5], {})[a["uid"]] = det      # 월별 추이·개별 거래는 상세 화면을 열 때만 구 단위 파일에서 불러온다
        out.append(rec)
    msn = sorted(msn_ix, key=msn_ix.get)
    js = "window.SG_MASTER=" + json.dumps({"asOf": m["generatedAt"], "months": m["months"], "msn": msn, "apts": out}, ensure_ascii=False, separators=(",", ":")) + ";\n"
    open(os.path.join(ROOT, "schoolmap/master-data.js"), "w", encoding="utf8").write(js)
    dd = os.path.join(ROOT, "schoolmap/master-detail"); os.makedirs(dd, exist_ok=True)
    for f in os.listdir(dd): os.remove(os.path.join(dd, f))        # 옛 파일 정리(이 폴더는 생성 결과물만 담는다)
    for code, d in details.items(): open(os.path.join(dd, code + ".json"), "w", encoding="utf8").write(json.dumps(d, ensure_ascii=False, separators=(",", ":")))
    rep = {"단지": len(out), "오피스텔 등 제외": skipped, "좌표 없음 제외": nocoord, "경계 밖 250m 이내 편입": border, "학교군 밖 제외": len(outside), "앱 대상 학교군 밖(미탑재)": notneeded, "학교군 밖 예": outside[:10], "초등 통학구역 판정": n_es if edu else "자료 없음", "중학교 학교군 판정": n_ms if edu else "자료 없음", "초등학교 거리 계산": n_ed, "중학교 가까운 학교 계산": n_mn, "중학교군 소속 학교 수 자료": len(msm), "학교 좌표 보유": len(geo), "KB": round(len(js.encode()) / 1024), "상세 파일 KB": sum(len(json.dumps(v, ensure_ascii=False, separators=(",", ":")).encode()) for v in details.values()) // 1024}
    print(json.dumps(rep, ensure_ascii=False, indent=1)); return rep

if __name__ == "__main__": run()
