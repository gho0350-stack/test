# -*- coding: utf-8 -*-
"""대학·학과 원본(out/reference.json.gz) -> data/university_master.csv, data/major_master.csv (분류 플래그 포함).
분류는 서비스 자체 정의이며 국가 공식 분류가 아니다. 규칙은 코드가 아니라 아래 RULES 와 data/admission_category.csv 에 문서화한다."""
import csv, gzip, json, os, re, sys
from collections import Counter
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SKY_UNIV = ("서울대학교", "연세대학교", "고려대학교")
UNDERGRAD_KINDS = ("대학교", "교육대학", "산업대학")   # 실서버 schlKndNm 값 기준
SUF = r"(\((본과|예과|본|예|.*)\))?$"      # "의학과(본과)", "의학부(의예)" 같은 변형 허용
RULES = {   # 의치한약수: 학과명 기준 (실서버 변형 확인: 의학과(본과)/의학부(의예)/의예과)
    "MED": (r"^(의예과|의학과|의학부|의과대학)" + SUF, r"한의|치의|수의"), "DENT": (r"^(치의예과|치의학과|치의학부)" + SUF, None), "KMED": (r"^(한의예과|한의학과|한의학부)" + SUF, None),
    "PHARM": (r"^(약학과|약학부|약학대학)" + SUF, None), "VET": (r"^(수의예과|수의학과|수의학부)" + SUF, None)}
INSEOUL_EXCLUDE_NAME = ("사이버", "방송통신", "원격", "디지털")

def g(d, *keys):
    for k in keys:
        if d.get(k) not in (None, ""): return str(d[k]).strip()
    return ""

def classify_major(m, univ_kind):
    name = g(m, "korMjrNm"); school = g(m, "schlNm"); area = g(m, "mjrAreaNm"); degree = g(m, "pbnfDgriCrseDivNm"); status = g(m, "schlMjrStatNm")
    kind = g(m, "schlKndNm") or univ_kind
    seoul = area.startswith("서울")
    ok_kind = kind in UNDERGRAD_KINDS and not any(x in school for x in INSEOUL_EXCLUDE_NAME)   # 대학교·교육대학·산업대학. 전문대·사이버·방송통신·각종학교·대학원 제외
    ok_degree = degree in ("학사", "학석사통합")                                                # "전문학사"·"석사" 등 제외
    ok_status = not any(x in status for x in ("폐지", "폐과", "폐쇄"))                         # 학과 상태 값은 실서버 기준(기존/변경/신설/분리/통합 허용)
    ok = ok_kind and ok_degree and ok_status
    flags = {cat: ok and bool(re.search(inc, name)) and not (exc and re.search(exc, name)) for cat, (inc, exc) in RULES.items()}
    flags["SEOUL_CAMPUS"] = seoul
    flags["SKY"] = ok and seoul and school in SKY_UNIV      # 서울대, 연세 신촌(서울 캠퍼스), 고려 서울 (강원·세종 등 분교 제외)
    flags["INSEOUL"] = ok and seoul
    return flags

def build(ref):
    kind = {g(u, "schlNm"): g(u, "schlKndNm") for u in ref["univ"]}
    um = [{"school_id": g(u, "schlId"), "name": g(u, "schlNm"), "kind": g(u, "schlKndNm"), "estb": g(u, "schlEstbDivNm"), "area": g(u, "pbnfAreaNm"), "address": g(u, "postNoAdrs"), "url": g(u, "schlUrlAdrs"), "survey_year": g(u, "svyYr")} for u in ref["univ"]]
    mm = []
    for x in ref["major"]:
        f = classify_major(x, kind.get(g(x, "schlNm"), ""))
        mm.append({"major_id": g(x, "kediMjrId"), "school": g(x, "schlNm"), "college": g(x, "clgNm"), "major": g(x, "korMjrNm"), "std_class_id": g(x, "stdClftMjrId"), "area": g(x, "mjrAreaNm"), "area_sigungu": g(x, "mjrAreaSignguNm"),
                   "degree": g(x, "pbnfDgriCrseDivNm"), "status": g(x, "schlMjrStatNm"), "day_night": g(x, "dghtDivNm"), "quota": g(x, "eschlPscpNum"), "survey_year": g(x, "svyYr"), "school_kind": g(x, "schlKndNm"), **{k.lower(): int(v) for k, v in f.items()}})
    return um, mm

def write(um, mm):
    for name, rows in (("university_master.csv", um), ("major_master.csv", mm)):
        if not rows: continue
        with open(os.path.join(ROOT, "data", name), "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)

def report(um, mm):
    c = Counter(); kinds = Counter(u["kind"] for u in um); degs = Counter(x["degree"] for x in mm); stat = Counter(x["status"] for x in mm)
    for x in mm:
        for k in ("med", "dent", "kmed", "pharm", "vet", "sky", "inseoul", "seoul_campus"): c[k] += x[k]
    missing = {s: [k for k in ("med",) if not any(x["school"] == s and x[k] for x in mm)] for s in SKY_UNIV}
    return {"SKY 대학 중 의대 학과가 잡히지 않은 곳(수동 확인 필요)": [s for s, v in missing.items() if v], "의대 학과가 잡힌 학교 수": len({x["school"] for x in mm if x["med"]}), "대학 수": len(um), "학과 수": len(mm), "분류별 학과 수": dict(c), "대학 종류 값": dict(kinds), "학위과정 값": dict(degs), "학과 상태 값": dict(stat)}

if __name__ == "__main__":
    with gzip.open(os.path.join(ROOT, "pipeline", "out", "reference.json.gz"), "rt", encoding="utf8") as f: ref = json.load(f)
    um, mm = build(ref); write(um, mm); print(json.dumps(report(um, mm), ensure_ascii=False, indent=1))
