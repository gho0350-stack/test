# -*- coding: utf-8 -*-
"""대학·학과 원본(out/reference.json.gz) -> data/university_master.csv, data/major_master.csv (분류 플래그 포함).
분류는 서비스 자체 정의이며 국가 공식 분류가 아니다. 규칙은 코드가 아니라 아래 RULES 와 data/admission_category.csv 에 문서화한다."""
import csv, gzip, json, os, re, sys
from collections import Counter
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SKY_UNIV = ("서울대학교", "연세대학교", "고려대학교")
RULES = {   # 의치한약수: 학과명 기준 (한의/치의/수의가 의학과로 잡히지 않도록 앵커)
    "MED": (r"^(의예과|의학과|의학부|의과대학)$", r"한의|치의|수의"), "DENT": (r"^(치의예과|치의학과|치의학부)$", None), "KMED": (r"^(한의예과|한의학과|한의학부)$", None),
    "PHARM": (r"^(약학과|약학부)$", None), "VET": (r"^(수의예과|수의학과|수의학부)$", None)}
INSEOUL_EXCLUDE_NAME = ("사이버", "방송통신", "원격", "디지털")

def g(d, *keys):
    for k in keys:
        if d.get(k) not in (None, ""): return str(d[k]).strip()
    return ""

def classify_major(m, univ_kind):
    name = g(m, "korMjrNm"); school = g(m, "schlNm"); area = g(m, "mjrAreaNm"); degree = g(m, "pbnfDgriCrseDivNm"); status = g(m, "schlMjrStatNm")
    flags = {}
    for cat, (inc, exc) in RULES.items(): flags[cat] = bool(re.search(inc, name)) and not (exc and re.search(exc, name))
    seoul = area.startswith("서울")
    flags["SEOUL_CAMPUS"] = seoul
    flags["SKY"] = any(school == u for u in SKY_UNIV) and seoul
    ok_kind = ("대학" in univ_kind) and not any(x in univ_kind for x in ("전문", "대학원")) and not any(x in school for x in INSEOUL_EXCLUDE_NAME)
    ok_degree = ("학사" in degree) or (degree == "")          # 학위과정 값은 실서버 확인 후 조정
    ok_status = not any(x in status for x in ("폐지", "폐과", "폐쇄"))
    flags["INSEOUL"] = seoul and ok_kind and ok_degree and ok_status
    return flags

def build(ref):
    kind = {g(u, "schlNm"): g(u, "schlKndNm") for u in ref["univ"]}
    um = [{"school_id": g(u, "schlId"), "name": g(u, "schlNm"), "kind": g(u, "schlKndNm"), "estb": g(u, "schlEstbDivNm"), "area": g(u, "pbnfAreaNm"), "address": g(u, "postNoAdrs"), "url": g(u, "schlUrlAdrs"), "survey_year": g(u, "svyYr")} for u in ref["univ"]]
    mm = []
    for x in ref["major"]:
        f = classify_major(x, kind.get(g(x, "schlNm"), ""))
        mm.append({"major_id": g(x, "kediMjrId"), "school": g(x, "schlNm"), "college": g(x, "clgNm"), "major": g(x, "korMjrNm"), "std_class_id": g(x, "stdClftMjrId"), "area": g(x, "mjrAreaNm"), "area_sigungu": g(x, "mjrAreaSignguNm"),
                   "degree": g(x, "pbnfDgriCrseDivNm"), "status": g(x, "schlMjrStatNm"), "day_night": g(x, "dghtDivNm"), "quota": g(x, "eschlPscpNum"), "survey_year": g(x, "svyYr"), **{k.lower(): int(v) for k, v in f.items()}})
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
    return {"대학 수": len(um), "학과 수": len(mm), "분류별 학과 수": dict(c), "대학 종류 값": dict(kinds), "학위과정 값": dict(degs), "학과 상태 값": dict(stat)}

if __name__ == "__main__":
    with gzip.open(os.path.join(ROOT, "pipeline", "out", "reference.json.gz"), "rt", encoding="utf8") as f: ref = json.load(f)
    um, mm = build(ref); write(um, mm); print(json.dumps(report(um, mm), ensure_ascii=False, indent=1))
