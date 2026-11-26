"""진학 실적 CSV 검증 -> schoolmap/admissions-data.js.  사용: python3 pipeline/load_admissions.py"""
import csv, json, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CSV = os.path.join(ROOT, "data", "admissions.csv"); OUT = os.path.join(ROOT, "schoolmap", "admissions-data.js")
NUMS = ("graduate_count", "medical_count", "sky_count", "inseoul_count", "snu_count", "medgrp_count")
ENUM = {"count_type": {"합격건수", "등록인원"}, "student_scope": {"재학생만", "재학생+졸업생", "알수없음"}, "duplicate_included": {"포함", "제외", "알수없음"}, "source_type": {"학교발표", "공식공시", "언론", "기타"}, "verified_status": {"확인완료", "미확인"}}

def load():
    errs, data = [], {}
    for n, r in enumerate(csv.DictReader(open(CSV, encoding="utf-8-sig")), 2):
        r = {k: (v or "").strip() for k, v in r.items()}; tag = f"{n}행 {r['school_name']} {r['admission_year']}"
        vals = {}
        for k in NUMS:
            if r[k] == "": vals[k] = None; continue
            if not re.fullmatch(r"\d+", r[k]): errs.append(f"{tag}: {k} 는 0 이상의 정수 또는 빈 칸 ({r[k]!r})"); continue
            vals[k] = int(r[k])
        has_count = any(vals.get(k) is not None for k in ("medical_count", "sky_count", "inseoul_count", "snu_count", "medgrp_count"))
        if has_count:
            for k, allowed in ENUM.items():
                if r[k] not in allowed: errs.append(f"{tag}: 실적을 적었으면 {k} 필수 (허용: {', '.join(sorted(allowed))})")
            if not r["source_url"].startswith("http"): errs.append(f"{tag}: source_url 필수 (http로 시작)")
            if r["verified_status"] == "확인완료" and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r["verified_at"]): errs.append(f"{tag}: 확인완료면 verified_at(YYYY-MM-DD) 필수")
            g = vals.get("graduate_count")
            if r["count_type"] == "등록인원" and g is not None:
                for k in ("medical_count", "sky_count", "inseoul_count"):
                    if vals.get(k) is not None and vals[k] > g: errs.append(f"{tag}: 등록인원인데 {k}({vals[k]}) 가 졸업생 수({g})보다 큼")
        rec = dict(vals, **{k: r[k] or None for k in list(ENUM) + ["source_url", "verified_at", "note"]}); rec["has_count"] = has_count
        data.setdefault(r["school_id"], {})[int(r["admission_year"])] = rec
    return data, errs

if __name__ == "__main__":
    data, errs = load()
    if errs: print("검증 실패:\n - " + "\n - ".join(errs)); sys.exit(1)
    filled = sum(1 for s in data.values() for y in s.values() if y["has_count"])
    open(OUT, "w", encoding="utf8").write("window.SG_ADMISSIONS = " + json.dumps(data, ensure_ascii=False) + ";\n"); print(f"검증 통과: 학교 {len(data)}곳, 입력된 학교-연도 {filled}건 -> {os.path.abspath(OUT)}")
