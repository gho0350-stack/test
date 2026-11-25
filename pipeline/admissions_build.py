# -*- coding: utf-8 -*-
"""진학 실적 원천(Long format) 검증 -> 검토 목록 -> 승인분만 집계해 admissions.csv 갱신.
  python3 pipeline/admissions_build.py            # 검증 + 검토 목록(data/admissions_review.csv, pipeline/out/admissions_review.md) 생성
  python3 pipeline/admissions_build.py --apply    # 검토 목록의 decision(승인/반려)을 원천에 반영하고, 승인분만 admissions.csv 로 집계
원칙: 승인(관리자 확인)된 행만 서비스에 반영한다. 검토대기·출처미확인·반려 행은 절대 반영하지 않으며, 미확인 값으로 기존 확인완료 값을 덮어쓰지 않는다.
빈칸은 미공개/미확보이며 0 이 아니다. 합격건수와 졸업생 수를 '진학률'로 계산하지 않는다."""
import csv, datetime, json, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
D = lambda n: os.path.join(ROOT, "data", n)
CATS = {"MED": "의대", "DENT": "치대", "KMED": "한의대", "PHARM": "약대", "VET": "수의대", "MEDGRP": "의치한약수(의약학 계열) 합계", "SNU": "서울대", "SNU_MED": "서울대 의대",
        "YONSEI": "연세대", "KOREA": "고려대", "SKY": "SKY 합계", "INSEOUL": "인서울", "GRAD": "졸업생 수"}
COUNT_TYPES = {"합격건수", "등록인원"}; SCOPES = {"재학생만", "재학생+졸업생", "알수없음"}; DUPS = {"포함", "제외", "알수없음"}
STATUS = {"검토대기", "승인", "반려", "출처미확인"}
RAW_F = ["record_id", "school_id", "school_name", "admission_year", "category", "count", "count_type", "phase", "student_scope", "duplicate_included", "source_id", "source_url", "publish_date", "collected_at", "evidence", "status", "reviewer", "reviewed_at", "note"]
ADM_F = ["school_id", "school_name", "admission_year", "graduate_count", "medical_count", "sky_count", "inseoul_count", "snu_count", "medgrp_count", "count_type", "student_scope", "duplicate_included", "source_type", "source_url", "verified_status", "verified_at", "note"]

def rd(p): return list(csv.DictReader(open(p, encoding="utf-8-sig"))) if os.path.exists(p) else []
def wr(p, rows, fields):
    with open(p, "w", newline="", encoding="utf-8-sig") as f: w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)

def validate(raw):
    errs = []; seen = set(); sources = {r["source_id"] for r in rd(D("admission_sources.csv"))}
    for n, r in enumerate(raw, 2):
        tag = f"{n}행 {r['school_name']} {r['admission_year']} {r['category']}"
        if r["category"] not in CATS: errs.append(f"{tag}: 알 수 없는 category")
        if not re.fullmatch(r"\d+", r["count"] or ""): errs.append(f"{tag}: count 는 0 이상의 정수 (미확보는 행을 만들지 않음)")
        if r["count_type"] not in COUNT_TYPES: errs.append(f"{tag}: count_type")
        if r["student_scope"] not in SCOPES: errs.append(f"{tag}: student_scope")
        if r["duplicate_included"] not in DUPS: errs.append(f"{tag}: duplicate_included")
        if r["status"] not in STATUS: errs.append(f"{tag}: status")
        if r["source_id"] not in sources: errs.append(f"{tag}: source_id 가 admission_sources.csv 에 없음")
        if not (r["evidence"] or "").strip(): errs.append(f"{tag}: 근거 문구(evidence) 필수")
        if r["status"] == "승인":
            if not r["source_url"].startswith("http"): errs.append(f"{tag}: 승인하려면 source_url 필요")
            if not r["reviewer"] or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r["reviewed_at"] or ""): errs.append(f"{tag}: 승인이면 reviewer, reviewed_at(YYYY-MM-DD) 필요")
        key = (r["school_id"], r["admission_year"], r["category"], r["source_url"], r["phase"])
        if key in seen: errs.append(f"{tag}: 같은 출처의 중복 행")
        seen.add(key)
    return errs

def conflicts(raw):
    """같은 학교·연도·범주에서 승인/대기 행의 값이 서로 다르면 관리자 검토 대상."""
    g = {}
    for r in raw:
        if r["status"] in ("검토대기", "승인"): g.setdefault((r["school_id"], r["admission_year"], r["category"], r["phase"]), []).append(r)
    out = []
    for k, rs in g.items():
        if len({(x["count"], x["count_type"], x["student_scope"], x["duplicate_included"]) for x in rs}) > 1:
            out.append(f"{rs[0]['school_name']} {k[1]} {CATS[k[2]]}: " + " / ".join(f"{x['count']}({x['count_type']},{x['student_scope']},중복{x['duplicate_included']},{x['status']})" for x in rs))
    return out

def review_files(raw):
    pend = [r for r in raw if r["status"] in ("검토대기", "출처미확인")]
    old = {r["record_id"]: r for r in rd(D("admissions_review.csv"))}
    rows = [{"record_id": r["record_id"], "school_name": r["school_name"], "year": r["admission_year"], "category": CATS[r["category"]], "count": r["count"], "basis": f"{r['count_type']} · {r['student_scope']} · 중복{r['duplicate_included']}", "source_url": r["source_url"], "evidence": r["evidence"], "decision": old.get(r["record_id"], {}).get("decision", ""), "comment": old.get(r["record_id"], {}).get("comment", "")} for r in pend]
    wr(D("admissions_review.csv"), rows, ["record_id", "school_name", "year", "category", "count", "basis", "source_url", "evidence", "decision", "comment"])
    return rows

def report(raw, errs, conf):
    by = {}
    for r in raw: by.setdefault((r["school_name"], r["admission_year"]), []).append(r)
    L = ["# 진학 실적 검토 리포트", "", f"- 원천 행 {len(raw)}개 · 승인 {sum(r['status']=='승인' for r in raw)} · 검토대기 {sum(r['status']=='검토대기' for r in raw)} · 출처미확인 {sum(r['status']=='출처미확인' for r in raw)} · 반려 {sum(r['status']=='반려' for r in raw)}", "- 서비스에는 **승인된 행만** 반영돼요. `data/admissions_review.csv` 의 decision 칸에 승인/반려를 적고 `--apply` 를 실행하세요.", ""]
    if errs: L += ["## 검증 오류", *[f"- {e}" for e in errs], ""]
    if conf: L += ["## 값이 서로 다른 출처(관리자 판단 필요)", *[f"- {c}" for c in conf], ""]
    L += ["## 학교·학년도별 확보 현황", "", "| 학교 | 학년도 | 범주 | 상태 |", "|---|---|---|---|"]
    for (s, y), rs in sorted(by.items()): L.append(f"| {s} | {y} | {', '.join(sorted(CATS[r['category']] for r in rs))} | {'/'.join(sorted({r['status'] for r in rs}))} |")
    open(os.path.join(ROOT, "pipeline", "out", "admissions_review.md"), "w", encoding="utf8").write("\n".join(L) + "\n")

def apply_decisions(raw):
    dec = {r["record_id"]: r for r in rd(D("admissions_review.csv")) if r.get("decision") in ("승인", "반려")}
    today = datetime.date.today().isoformat(); n = 0
    for r in raw:
        d = dec.get(r["record_id"])
        if d and r["status"] in ("검토대기", "출처미확인"):
            if d["decision"] == "승인" and r["status"] == "출처미확인": continue   # 출처를 특정하기 전에는 승인할 수 없다
            r["status"] = d["decision"]; r["reviewer"] = r["reviewer"] or "admin"; r["reviewed_at"] = today; n += 1
    return n

def aggregate(raw):
    ok = [r for r in raw if r["status"] == "승인"]; g = {}
    for r in ok: g.setdefault((r["school_id"], int(r["admission_year"])), []).append(r)
    out = {}
    for (sid, y), rs in g.items():
        c = {r["category"]: r for r in rs if r["phase"] in ("전체", "")}
        basis = lambda r: (r["count_type"], r["student_scope"], r["duplicate_included"])
        row = {"school_id": sid, "school_name": rs[0]["school_name"], "admission_year": y}
        if "GRAD" in c: row["graduate_count"] = c["GRAD"]["count"]
        if "MED" in c: row["medical_count"] = c["MED"]["count"]
        if "MEDGRP" in c: row["medgrp_count"] = c["MEDGRP"]["count"]
        if "SNU" in c: row["snu_count"] = c["SNU"]["count"]
        if "INSEOUL" in c: row["inseoul_count"] = c["INSEOUL"]["count"]
        if "SKY" in c: row["sky_count"] = c["SKY"]["count"]
        elif all(k in c for k in ("SNU", "YONSEI", "KOREA")) and len({basis(c[k]) for k in ("SNU", "YONSEI", "KOREA")}) == 1:
            row["sky_count"] = str(sum(int(c[k]["count"]) for k in ("SNU", "YONSEI", "KOREA"))); row["note"] = "SKY = 서울대+연세대+고려대 합격건수 합(승인된 대학별 행 기준)"
        used = [c[k] for k in ("MED", "SNU", "SKY", "INSEOUL", "MEDGRP") if k in c]
        if used:
            b = {basis(r) for r in used}
            if len(b) == 1: row["count_type"], row["student_scope"], row["duplicate_included"] = next(iter(b))
            else: row["count_type"] = row["student_scope"] = row["duplicate_included"] = "알수없음"; row["note"] = (row.get("note", "") + " 집계 기준이 서로 다른 행이 섞여 있음(관리자 확인 필요)").strip()
        row["source_type"] = "언론(학교 제공 자료)"; row["source_url"] = rs[0]["source_url"]; row["verified_status"] = "확인완료"; row["verified_at"] = max(r["reviewed_at"] for r in rs)
        out[(sid, y)] = row
    return out

def main(apply=False):
    raw = rd(D("admissions_raw.csv")); errs = validate(raw)
    if apply: print(f"검토 결정 반영: {apply_decisions(raw)}건"); errs = validate(raw)
    conf = conflicts(raw); review_files(raw); report(raw, errs, conf)
    if errs: print("검증 오류:\n - " + "\n - ".join(errs)); return 1
    if apply:
        wr(D("admissions_raw.csv"), raw, RAW_F)
        cur = {(r["school_id"], int(r["admission_year"])): r for r in rd(D("admissions.csv"))}
        for k, v in aggregate(raw).items(): cur[k] = {f: v.get(f, "") for f in ADM_F}   # 승인분만 덮어쓴다
        wr(D("admissions.csv"), [{f: r.get(f, "") or "" for f in ADM_F} for _, r in sorted(cur.items())], ADM_F)
        print("admissions.csv 갱신 완료")
    print(f"원천 {len(raw)}행, 승인 {sum(r['status']=='승인' for r in raw)}행, 검토 대기 {sum(r['status']=='검토대기' for r in raw)}행, 충돌 {len(conf)}건")
    return 0

if __name__ == "__main__": sys.exit(main("--apply" in sys.argv))
