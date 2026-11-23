"""수집 결과(out/)를 앱이 읽는 ../schoolmap/real-data.js 로 변환.
- NEIS 학교 기본정보 (실데이터)         out/neis_schools.json
- NEIS 학원·교습소 -> 구/동별 집계       out/academy_<구>.jsonl
- (선택) 국토부 매매·전월세 실거래 집계  out/trades_<구>.jsonl, out/rents_<구>.jsonl
"""
import glob, json, os, re
from collections import Counter, defaultdict
from datetime import date
from normalize import stats, norm_name, is_jeonse, AREA_BUCKETS

OUT = os.path.join(os.path.dirname(__file__), "out")
TODAY = date.today()
TARGET_DONGS = {"강남구": ["대치동", "도곡동", "개포동", "역삼동"], "서초구": ["반포동", "잠원동"], "송파구": ["잠실동", "신천동", "방이동"],
                "양천구": ["목동"], "노원구": ["중계동", "상계동"], "강동구": ["고덕동", "상일동"]}

def dong_of(addr_detail):
    m = re.search(r"\(([가-힣0-9]+동)", addr_detail or "")
    return m.group(1) if m else None

def schools():
    raw = json.load(open(f"{OUT}/neis_schools.json", encoding="utf8")); res = {}
    for sid, rows in raw.items():
        if len(rows) != 1: continue
        r = rows[0]
        res[sid] = {"code": r["SD_SCHUL_CODE"], "officialName": r["SCHUL_NM"], "addr": r["ORG_RDNMA"], "dong": dong_of(r.get("ORG_RDNDA")), "zip": (r.get("ORG_RDNZC") or "").strip(),
                    "founding": r["FOND_SC_NM"], "coedu": r["COEDU_SC_NM"], "hsType": r.get("HS_SC_NM"), "course": r.get("HS_GNRL_BUSNS_SC_NM"), "homepage": r.get("HMPG_ADRES"),
                    "tel": r.get("ORG_TELNO"), "founded": r.get("FOND_YMD"), "loaded": r.get("LOAD_DTM")}
    return res

def academies():
    """구 단위 집계(키 없이 가능) + 동 단위 집계(NEIS_KEY 로 전체 목록을 받은 경우에만)."""
    res = {}
    cp = f"{OUT}/academy_counts.json"
    if os.path.exists(cp):
        c = json.load(open(cp, encoding="utf8"))
        for gu, v in c["gus"].items(): res[gu] = {"registered": v["registered"], "boseup": v["boseup"], "fetched": c["fetched"], "dongs": {}}
    for path in sorted(glob.glob(f"{OUT}/academy_*.jsonl")):
        gu = os.path.basename(path)[8:-6]; rows = [json.loads(l) for l in open(path, encoding="utf8")]
        open_rows = [r for r in rows if r.get("REG_STTUS_NM") == "개원"]
        g = res.setdefault(gu, {"registered": len(rows), "boseup": 0, "fetched": str(TODAY), "dongs": {}})
        g.update({"open": len(open_rows), "hakwon": sum(r["ACA_INSTI_SC_NM"] == "학원" for r in open_rows), "gyoseupso": sum(r["ACA_INSTI_SC_NM"] == "교습소" for r in open_rows)})
        dongs = defaultdict(lambda: {"total": 0, "boseup": 0})
        for r in open_rows:
            d = dong_of(r.get("FA_RDNDA"))
            if d in TARGET_DONGS.get(gu, []):
                dongs[d]["total"] += 1; dongs[d]["boseup"] += r.get("REALM_SC_NM") == "입시.검정 및 보습"
        g["dongs"] = dict(dongs)
    return res

def trades():
    """국토부 파일이 있을 때만 생성. 키: '<구>|<정규화 단지명>' -> 면적대별 최근 12개월 범위/건수/최근거래일."""
    out = {}
    for gu in TARGET_DONGS:
        tp, rp = f"{OUT}/trades_{gu}.jsonl", f"{OUT}/rents_{gu}.jsonl"
        if not os.path.exists(tp): continue
        by = defaultdict(lambda: {"sale": [], "jeonse": [], "dong": "", "build": 0})
        for l in open(tp, encoding="utf8"):
            r = json.loads(l); b = by[norm_name(r["apt"])]; b["sale"].append(r); b["dong"] = r["dong"]; b["build"] = r["build"]
        if os.path.exists(rp):
            for l in open(rp, encoding="utf8"):
                r = json.loads(l)
                if is_jeonse(r["deposit"], r["monthly"]): by[norm_name(r["apt"])]["jeonse"].append(r)
        for name, b in by.items():
            rec = {"dong": b["dong"], "build": b["build"], "sale": {}, "jeonse": {}}
            for k in AREA_BUCKETS:
                s = stats(b["sale"], k, TODAY); j = stats([{**r, "amount": r["deposit"]} for r in b["jeonse"]], k, TODAY)
                if s: rec["sale"][k] = s
                if j: rec["jeonse"][k] = j
            if rec["sale"] or rec["jeonse"]: out[f"{gu}|{name}"] = rec
    return out

def molit_result():
    """코랩 노트북(eodisalji_collect.ipynb)이 만든 out/molit_result.json 이 있으면 그대로 사용."""
    p = f"{OUT}/molit_result.json"
    return json.load(open(p, encoding="utf8")) if os.path.exists(p) else None

if __name__ == "__main__":
    mr = molit_result()
    data = {"generatedAt": TODAY.isoformat(), "sources": {"schools": "NEIS 교육정보 개방포털 schoolInfo", "academy": "NEIS 교육정보 개방포털 acaInsTiInfo", "trades": "국토교통부 실거래가 (수집 시)"},
            "schools": schools(), "academy": academies(), "trades": (mr or {}).get("trades") or trades(), "kapt": (mr or {}).get("kapt", {}), "molitAsOf": (mr or {}).get("generatedAt")}
    p = os.path.join(os.path.dirname(__file__), "..", "schoolmap", "real-data.js")
    open(p, "w", encoding="utf8").write("window.SG_REAL = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    print("schools", len(data["schools"]), "academy gus", list(data["academy"]), "trade keys", len(data["trades"]), "->", os.path.abspath(p))
