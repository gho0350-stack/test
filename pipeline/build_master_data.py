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

def b(v): return {k: [s["median"], s["min"], s["max"], s["count"], s["last"]] for k, s in (v or {}).items()}

def run():
    m = json.load(gzip.open(os.path.join(ROOT, "pipeline/out/master.json.gz"), "rt", encoding="utf8"))
    zs = open(os.path.join(ROOT, "schoolmap/zones-data.js"), encoding="utf8").read(); Z = json.loads(zs[zs.index("{"):zs.rindex("}") + 1])
    out, skipped, nocoord, border, outside = [], 0, 0, 0, []
    for a in m["apts"]:
        if SKIP.search(a["name"]): skipped += 1; continue
        c = a.get("coord")
        if not c: nocoord += 1; continue
        zid, d = zone_of(c["lng"], c["lat"], Z["zones"])
        if zid is None: outside.append(f"{a['gu']} {a['dong']} {a['name']} ({d}m)"); continue
        if d: border += 1
        hh = int(float(a["households"])) if a.get("households") else None
        ap = a.get("approved") or ""
        rec = {"id": a["uid"], "n": a["name"], "gu": a["gu"], "d": a["dong"], "la": round(c["lat"], 5), "lo": round(c["lng"], 5), "z": zid}
        if hh: rec["hh"] = hh
        yr = int(ap[:4]) if re.match(r"^\d{8}$", ap) else a.get("build_year")
        if yr: rec["yr"] = yr; rec["yk"] = 1 if re.match(r"^\d{8}$", ap) else 0
        if d: rec["zb"] = d                      # 경계 밖 250m 이내라 가까운 학교군으로 편입(단순화 오차 가능)
        if a.get("sale"): rec["sale"] = b(a["sale"])
        if a.get("jeonse"): rec["jeonse"] = b(a["jeonse"])
        ser = {k: {p: [[ym, v] for ym, v, _n in rows] for p, rows in (a["series"].get(k) or {}).items()} for k in ("sale", "jeonse")}
        if any(ser[k] for k in ser): rec["ser"] = ser
        rc = a.get("recent") or {}
        if any(rc.get(k) for k in ("sale", "jeonse")): rec["rc"] = rc
        out.append(rec)
    js = "window.SG_MASTER=" + json.dumps({"asOf": m["generatedAt"], "months": m["months"], "apts": out}, ensure_ascii=False, separators=(",", ":")) + ";\n"
    open(os.path.join(ROOT, "schoolmap/master-data.js"), "w", encoding="utf8").write(js)
    rep = {"단지": len(out), "오피스텔 등 제외": skipped, "좌표 없음 제외": nocoord, "경계 밖 250m 이내 편입": border, "학교군 밖 제외": len(outside), "학교군 밖 예": outside[:10], "KB": round(len(js.encode()) / 1024)}
    print(json.dumps(rep, ensure_ascii=False, indent=1)); return rep

if __name__ == "__main__": run()
