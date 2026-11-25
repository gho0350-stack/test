# -*- coding: utf-8 -*-
"""학교별 입학 방식(school_admission)을 data/school_admission.csv 와 schoolmap/admission-rules.js 로 만든다.
- 1차 분류: NEIS 학교유형(일반고/자율고 등). 고입정보포털·학교 요강으로 확인된 학교는 data/school_admission_verified.csv 의 값이 우선한다.
- general_school_group: 서울 일반학교군(교육지원청 단위 11개) = 학교군 SHP 경계에 학교 좌표를 넣어 자동 판정(zones-data.js 의 schoolZone).
- integrated_school_group(3단계 통합학교군)은 공식 구성 목록을 확인하기 전까지 비워 둔다(3단계는 지도에 표시하지 않음)."""
import csv, json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC_RULE = "https://www.sen.go.kr/www/eduinfo/jinhak/jinhakiphak/jinhakiphak_1.jsp"
FIELDS = ["school_id", "school_name", "school_type", "admission_type", "admission_year", "general_school_group", "integrated_school_group", "application_stage", "eligible_region", "admission_rule", "source_url", "verified_at", "verify_status", "note"]

def load_js(p, var):
    s = open(os.path.join(ROOT, p), encoding="utf8").read(); return json.loads(s[s.index("{"):s.rindex("}") + 1])

def main():
    real = load_js("schoolmap/real-data.js", "SG_REAL")["schools"]; Z = load_js("schoolmap/zones-data.js", "SG_ZONES")
    zname = {z["id"]: z["name"] for z in Z["zones"]}
    vp = os.path.join(ROOT, "data/school_admission_verified.csv"); ver = {r["school_id"]: r for r in csv.DictReader(open(vp, encoding="utf-8-sig"))} if os.path.exists(vp) else {}
    rows = []
    INTEG = [r["member_general_groups"].split("|") for r in csv.DictReader(open(os.path.join(ROOT, "data/integrated_school_group.csv"), encoding="utf-8-sig"))]
    for sid, r in real.items():
        t = r.get("hsType") or ""; zid = Z["schoolZone"].get(sid); v = ver.get(sid, {})
        t = "자율고" if v.get("school_type", "").startswith(("자율형", "외국어", "국제")) or v.get("school_type") == "기타 학교장 선발고" else ("일반고" if v.get("school_type", "").startswith("교육감 선발") else t)
        if t == "일반고":
            row = {"school_type": "일반고(평준화)", "admission_type": "교육감 선발 후기 일반고", "application_stage": "2단계(일반학교군)", "eligible_region": zname.get(zid, ""),
                   "admission_rule": "1단계 서울 전체 2개교, 2단계 거주지 일반학교군 2개교 지원 후 추첨, 3단계 통합학교군 전산배정 (배정비율은 학교별 모집정원 기준이며 개인 확률이 아님)", "source_url": SRC_RULE}
        else:
            row = {"school_type": t or "미확인", "admission_type": "학교장 선발 후기(자율고·자사고 등)", "application_stage": "학교별 전형", "eligible_region": "학교 모집요강 확인",
                   "admission_rule": "학교별 입학전형요강에 따라 선발하며 거주지 학교군 배정이 아님", "source_url": r.get("homepage") or ""}
        row.update({"school_id": sid, "school_name": r["officialName"], "admission_year": "", "general_school_group": zname.get(zid, ""), "integrated_school_group": "; ".join("·".join(p) for p in INTEG if zname.get(zid, "").replace("학교군", "") in p) if (t == "일반고") else "", "verified_at": "", "verify_status": "NEIS 학교유형 기준(미확인)", "note": ""})
        row.update({k: x for k, x in v.items() if x})
        if row["school_type"].startswith("교육감 선발"): row["school_type"] = "일반고(평준화)"
        rows.append(row)
    with open(os.path.join(ROOT, "data/school_admission.csv"), "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS); w.writeheader(); w.writerows(rows)
    js = "window.SG_RULES=" + json.dumps({r["school_id"]: {"kind": "general" if r["school_type"].startswith("일반고") else "jayul", "type": r["school_type"], "stage": r["application_stage"], "group": r["general_school_group"], "src": r["source_url"], "verified": r["verified_at"], "status": r["verify_status"], "note": r.get("note", "")} for r in rows}, ensure_ascii=False, separators=(",", ":")) + ";\n"
    ig = list(csv.DictReader(open(os.path.join(ROOT, "data/integrated_school_group.csv"), encoding="utf-8-sig")))
    meta = {"year": 2027, "source": ig[0]["source_url"] if ig else "", "integrated": [r["member_general_groups"].split("|") for r in ig]}
    js += "window.SG_RULES_META=" + json.dumps(meta, ensure_ascii=False, separators=(",", ":")) + ";\n"
    open(os.path.join(ROOT, "schoolmap/admission-rules.js"), "w", encoding="utf8").write(js); print(len(rows), "개교, 통합학교군", len(ig), "개")

if __name__ == "__main__": main()
