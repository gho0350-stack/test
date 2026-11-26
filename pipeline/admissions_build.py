# -*- coding: utf-8 -*-
"""진학 실적 원천(Long format) 검증 -> 검토 목록 -> 승인분만 집계해 admissions.csv 갱신.
  python3 pipeline/admissions_build.py            # 검증 + 검토 목록(data/admissions_review.csv, pipeline/out/admissions_review.md) 생성
  python3 pipeline/admissions_build.py --apply    # 검토 목록의 decision(승인/반려)을 원천에 반영하고, 승인분만 admissions.csv 로 집계
원칙: 승인(관리자 확인)된 행만 서비스에 반영한다. 검토대기·출처미확인·반려 행은 절대 반영하지 않으며, 미확인 값으로 기존 확인완료 값을 덮어쓰지 않는다.
빈칸은 미공개/미확보이며 0 이 아니다. 합격건수와 졸업생 수를 '진학률'로 계산하지 않는다."""
import csv, datetime, json, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
D = lambda n: os.path.join(ROOT, "data", n)
CATS = {"MED": "의대", "DENT": "치대", "KMED": "한의대", "PHARM": "약대", "VET": "수의대", "MEDGRP": "의치한약수 합계(수의대 포함 확인)", "MED4": "의치한약 합계(수의대 제외·미명시, 확인된 소계)", "MEDSCI_RAW": "의약학 계열(원문 범주, 구성 미확인)", "SNU": "서울대", "SNU_MED": "서울대 의대",
        "YONSEI": "연세대", "KOREA": "고려대", "SKY": "SKY 합계", "INSEOUL": "인서울", "GRAD": "졸업생 수"}
COUNT_TYPES = {"합격건수", "등록인원", "해당없음"}; SCOPES = {"재학생만", "재학생+졸업생", "알수없음"}; DUPS = {"포함", "제외", "알수없음"}
RANGE = {"확인", "불명확"}; METHODS = {"텍스트", "이미지", "PDF", "표(HTML)", "API"}
STATUS = {"검토대기", "승인", "반려", "출처미확인"}
RAW_F = ["record_id", "school_id", "school_name", "admission_year", "category", "count", "count_type", "phase", "student_scope", "duplicate_included", "source_id", "source_url", "publish_date", "collected_at", "evidence", "status", "reviewer", "reviewed_at", "campus_scope", "range_check", "extract_method", "origin_id", "range_note", "note"]
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
        if r.get("range_check") not in RANGE: errs.append(f"{tag}: range_check(확인/불명확) 필수")
        if r.get("extract_method") not in METHODS: errs.append(f"{tag}: extract_method")
        if r.get("range_check") == "불명확" and not (r.get("range_note") or "").strip(): errs.append(f"{tag}: 범위가 불명확하면 range_note 로 이유를 적어야 함")
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

def triage(r, raw):
    """자동 검증 결과 분류. 관리자는 '검토 필요' 이상만 보면 된다. (초기에는 모든 행을 사람이 승인한다)"""
    if r["range_check"] != "확인": return "승인 보류", "집계 범위가 불명확해 최종 지표에 반영하지 않음"
    same = [x for x in raw if x is not r and (x["school_id"], x["admission_year"], x["category"], x["phase"]) == (r["school_id"], r["admission_year"], r["category"], r["phase"]) and x["status"] in ("검토대기", "승인")]
    if any((x["count"], x["count_type"], x["student_scope"], x["duplicate_included"]) != (r["count"], r["count_type"], r["student_scope"], r["duplicate_included"]) for x in same): return "승인 보류", "다른 값의 행과 충돌"
    if r["extract_method"] == "이미지": return "원본 이미지 대조 필요", "이미지에서 추출한 숫자"
    if r["source_id"] in ("schoolinfo", "school_site"): return "우선 승인 후보", "공식 자료에서 확인"
    origins = {x["origin_id"] for x in same + [r] if (x["count"], x["count_type"], x["student_scope"], x["duplicate_included"]) == (r["count"], r["count_type"], r["student_scope"], r["duplicate_included"])}
    if len(origins) >= 2: return "우선 승인 후보", "독립된 둘 이상의 원자료에서 수치와 기준이 일치"
    return "검토 필요", "단일 언론 출처"

def review_files(raw):
    pend = [r for r in raw if r["status"] in ("검토대기", "출처미확인")]
    old = {r["record_id"]: r for r in rd(D("admissions_review.csv"))}
    rows = [{"record_id": r["record_id"], "school_name": r["school_name"], "year": r["admission_year"], "category": CATS[r["category"]], "count": r["count"], "basis": f"{r['count_type']} · {r['student_scope']} · 중복{r['duplicate_included']}", "source_url": r["source_url"], "triage": triage(r, raw)[0], "triage_reason": triage(r, raw)[1], "range_check": r["range_check"], "range_note": r["range_note"], "evidence": r["evidence"], "decision": old.get(r["record_id"], {}).get("decision", ""), "comment": old.get(r["record_id"], {}).get("comment", "")} for r in pend]
    wr(D("admissions_review.csv"), rows, ["record_id", "school_name", "year", "category", "count", "basis", "source_url", "triage", "triage_reason", "range_check", "range_note", "evidence", "decision", "comment"])
    html_review(rows); return rows

def html_review(rows):
    """관리자용 단일 HTML 화면: 검토 대기 행을 한눈에 보고 승인/반려/보류를 고른 뒤 결정 CSV 를 내려받는다(서버 불필요)."""
    esc = lambda x: (str(x or "")).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    order = {"우선 승인 후보": 0, "검토 필요": 1, "원본 이미지 대조 필요": 2, "승인 보류": 3}
    rs = sorted(rows, key=lambda r: (order.get(r["triage"], 9), r["school_name"], r["year"], r["category"]))
    body = "".join(f"""<tr data-id="{esc(r['record_id'])}" class="t-{order.get(r['triage'], 9)}"><td><b>{esc(r['school_name'])}</b><br>{esc(r['year'])}학년도</td><td>{esc(r['category'])}<br><span class="n">{esc(r['count'])}</span></td><td>{esc(r['basis'])}</td>
<td><span class="tag">{esc(r['triage'])}</span><br><small>{esc(r['triage_reason'])}</small>{('<br><small class=warn>'+esc(r['range_note'])+'</small>') if r['range_check'] != '확인' or r['range_note'] else ''}</td>
<td class="ev">{esc(r['evidence'])}<br><a href="{esc(r['source_url'])}" target="_blank" rel="noopener">원문 열기</a></td>
<td><select><option value="">미결정</option><option value="승인">승인</option><option value="반려">반려</option></select></td></tr>""" for r in rs)
    page = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>진학 실적 검토</title>
<style>body{{font:14px/1.5 system-ui,sans-serif;margin:16px;color:#1c2b22}}table{{border-collapse:collapse;width:100%}}td,th{{border:1px solid #d9d4c4;padding:8px;vertical-align:top}}th{{background:#f4f1e8}}.n{{font-size:20px;font-weight:800;color:#1c6b45}}.tag{{display:inline-block;padding:2px 8px;border-radius:99px;background:#e8f1ec;font-weight:700}}.t-3 .tag{{background:#f7e3df}}.t-2 .tag{{background:#fdf1d6}}.warn{{color:#a4361e}}.ev{{max-width:420px}}button{{padding:8px 14px;border-radius:8px;border:0;background:#1c6b45;color:#fff;font-weight:700;cursor:pointer}}</style></head><body>
<h1>진학 실적 검토 ({len(rs)}건)</h1><p>승인한 행만 서비스에 반영됩니다. 범위가 불명확하거나 충돌하는 행은 승인해도 최종 지표에는 반영되지 않습니다. 결정을 고른 뒤 아래 버튼으로 CSV를 내려받아 <code>data/admissions_review.csv</code> 의 decision 칸에 반영하거나 개발 도우미에게 전달하세요.</p>
<p><button id="dl">결정 CSV 내려받기</button></p><table><tr><th>학교</th><th>지표</th><th>집계 기준</th><th>자동 검증 결과</th><th>원문 근거</th><th>결정</th></tr>{body}</table>
<script>document.getElementById('dl').onclick=function(){{var l=['record_id,decision'];document.querySelectorAll('tr[data-id]').forEach(function(tr){{var v=tr.querySelector('select').value;if(v)l.push(tr.dataset.id+','+v)}});var a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+l.join('\n')],{{type:'text/csv'}}));a.download='admissions_decisions.csv';a.click()}}</script></body></html>"""
    open(os.path.join(ROOT, "pipeline", "out", "admissions_review.html"), "w", encoding="utf8").write(page)

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
    extra = D("admissions_decisions.csv")
    if os.path.exists(extra): dec.update({r["record_id"]: r for r in rd(extra) if r.get("decision") in ("승인", "반려")})   # 검토 화면에서 내려받은 결정
    today = datetime.date.today().isoformat(); n = 0
    for r in raw:
        d = dec.get(r["record_id"])
        if d and r["status"] in ("검토대기", "출처미확인"):
            if d["decision"] == "승인" and r["status"] == "출처미확인": continue   # 출처를 특정하기 전에는 승인할 수 없다
            r["status"] = d["decision"]; r["reviewer"] = r["reviewer"] or "admin"; r["reviewed_at"] = today; n += 1
    return n

def aggregate(raw):
    ok = [r for r in raw if r["status"] == "승인" and r["range_check"] == "확인"]; g = {}   # 범위가 불명확한 행은 승인되어도 최종 지표에 쓰지 않는다
    for r in ok: g.setdefault((r["school_id"], int(r["admission_year"])), []).append(r)
    out = {}
    for (sid, y), rs in g.items():
        c = {r["category"]: r for r in rs if r["phase"] in ("전체", "")}
        basis = lambda r: (r["count_type"], r["student_scope"], r["duplicate_included"])
        row = {"school_id": sid, "school_name": rs[0]["school_name"], "admission_year": y}
        if "GRAD" in c: row["graduate_count"] = c["GRAD"]["count"]
        if "MED" in c: row["medical_count"] = c["MED"]["count"]
        if "MEDGRP" in c: row["medgrp_count"] = c["MEDGRP"]["count"]      # 수의대 포함이 확인된 의치한약수 합계만. MED4(소계)와 MEDSCI_RAW(원문 범주)는 반영하지 않음
        if "SNU" in c: row["snu_count"] = c["SNU"]["count"]
        if "INSEOUL" in c: row["inseoul_count"] = c["INSEOUL"]["count"]
        if "SKY" in c: row["sky_count"] = c["SKY"]["count"]
        elif all(k in c for k in ("SNU", "YONSEI", "KOREA")) and len({basis(c[k]) for k in ("SNU", "YONSEI", "KOREA")}) == 1:
            row["sky_count"] = str(sum(int(c[k]["count"]) for k in ("SNU", "YONSEI", "KOREA"))); row["note"] = "SKY = 서울대+연세대+고려대 합격건수 합(승인된 대학별 행 기준)"
        used = [c[k] for k in ("MED", "SNU", "SKY", "INSEOUL", "MEDGRP") if k in c]   # 기준 필드는 최종 지표에 쓰인 행에서만 가져온다
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
