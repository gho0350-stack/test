# -*- coding: utf-8 -*-
"""운영용 데이터 품질 리포트: 저장소에 있는 결과 파일만 읽어 pipeline/out/data_health.json / .md 를 만든다(네트워크 호출 없음).
- 마스터: 구별 수집 상태·최신성·스키마, 단지 수, 좌표·거래 확보율, 학구 판정, 경계 인접
- 학교: 입학 방식 확인 상태, 진학 실적 확보율(학교·학년도·지표)
- 출처: 이용 조건 확인 상태
실패한 수집이 기존 정상 데이터를 덮어쓰지 않도록 각 파이프라인에 안전장치가 있고, 이 리포트는 '지금 저장소에 있는 데이터'의 상태만 보고한다."""
import csv, datetime, gzip, json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
P = lambda *a: os.path.join(ROOT, *a)

def rd(p): return list(csv.DictReader(open(p, encoding="utf-8-sig"))) if os.path.exists(p) else []
def js_obj(p, var):
    if not os.path.exists(p): return {}
    s = open(p, encoding="utf8").read(); i = s.find("{"); return json.loads(s[i:s.rindex("}") + 1])

def master_health(today):
    out = {"gus": {}, "pending": [], "stale": []}
    from_order = ["강남구", "서초구", "송파구", "양천구", "노원구", "강동구", "성동구", "광진구", "동작구", "관악구", "종로구", "중구", "용산구", "강서구", "영등포구", "구로구", "금천구", "성북구", "강북구", "도봉구", "동대문구", "중랑구", "마포구", "서대문구", "은평구"]
    tot = geo = sale = both = 0
    for gu in from_order:
        p = P("pipeline", "out", "master_gu", gu + ".json.gz")
        if not os.path.exists(p): out["pending"].append(gu); continue
        d = json.load(gzip.open(p, "rt", encoding="utf8")); apts = d["apts"]; age = (today - datetime.date.fromisoformat(d["generatedAt"])).days
        n_sale = sum(1 for a in apts if any(v for v in (a.get("sale") or {}).values()))
        mean_ok = sum(1 for a in apts for v in (a.get("sale") or {}).values() if v.get("mean") is not None)
        any_sale = sum(1 for a in apts for v in (a.get("sale") or {}).values())
        out["gus"][gu] = {"단지": len(apts), "좌표": sum(1 for a in apts if a.get("coord")), "최근12개월 매매 거래 있는 단지": n_sale, "수집일": d["generatedAt"], "경과일": age, "스키마": d.get("schema", 1), "실제 평균 계산분": f"{mean_ok}/{any_sale}"}
        tot += len(apts); geo += out["gus"][gu]["좌표"]; sale += n_sale
        if age >= 30 or d.get("schema", 1) < 2: out["stale"].append(gu)
    out["합계"] = {"수집 구": f"{len(out['gus'])}/25", "단지": tot, "좌표 확보율": round(geo / tot * 100, 1) if tot else None, "매매 거래 확보율": round(sale / tot * 100, 1) if tot else None}
    return out

def app_health():
    m = js_obj(P("schoolmap", "master-data.js"), "SG_MASTER"); apts = m.get("apts", [])
    if not apts: return {}
    n = len(apts)
    return {"앱 탑재 단지": n, "초등 통학구역 판정": sum(1 for a in apts if a.get("es")), "중학교군 판정": sum(1 for a in apts if a.get("ms")), "경계 30m 이내(경계 인접)": sum(1 for a in apts if a.get("eb")),
            "세대수 확보": sum(1 for a in apts if a.get("hh")), "준공연도 확보": sum(1 for a in apts if a.get("yr")), "기준일": m.get("asOf")}

def adm_health():
    raw = rd(P("data", "admissions_raw.csv")); sch = rd(P("data", "school_admission.csv")); out = {"학교 수": len(sch), "원천 행": len(raw), "상태별": {}, "학교별": {}}
    for r in raw: out["상태별"][r["status"]] = out["상태별"].get(r["status"], 0) + 1
    for s in sch:
        sid = s["school_id"]; row = {"분류": s["school_type"], "분류 확인": s["verify_status"][:30], "연도별 승인 지표": {}}
        for y in (2024, 2025, 2026):
            cats = sorted({r["category"] for r in raw if r["school_id"] == sid and r["admission_year"] == str(y) and r["status"] == "승인" and r["range_check"] == "확인"})
            row["연도별 승인 지표"][str(y)] = cats
        out["학교별"][sid] = row
    cells = sum(1 for s in out["학교별"].values() for v in s["연도별 승인 지표"].values() if v)
    out["확보율"] = f"{cells}/{len(sch) * 3} (학교×연도 중 승인 지표가 1개 이상)"
    return out

def run():
    today = datetime.date.today(); h = {"기준일": today.isoformat(), "마스터": master_health(today), "앱 데이터": app_health(), "진학 실적": adm_health(),
         "출처 정책": [{k: r[k] for k in ("source_id", "auto_policy", "terms_checked")} for r in rd(P("data", "admission_sources.csv"))]}
    json.dump(h, open(P("pipeline", "out", "data_health.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    m = h["마스터"]; L = [f"# 데이터 품질 리포트 ({h['기준일']})", "", "## 마스터(아파트)", f"- 수집 구 {m['합계']['수집 구']}, 단지 {m['합계']['단지']}개, 좌표 확보율 {m['합계']['좌표 확보율']}%, 최근 12개월 매매 거래가 있는 단지 {m['합계']['매매 거래 확보율']}%",
         f"- 미수집 구: {', '.join(m['pending']) or '없음'}", f"- 재수집 필요(30일 경과 또는 이전 스키마): {', '.join(m['stale']) or '없음'}", "", "| 구 | 단지 | 좌표 | 매매 거래 있는 단지 | 수집일 | 스키마 | 실제 평균 |", "|---|---|---|---|---|---|---|"]
    for g, v in m["gus"].items(): L.append(f"| {g} | {v['단지']} | {v['좌표']} | {v['최근12개월 매매 거래 있는 단지']} | {v['수집일']} | {v['스키마']} | {v['실제 평균 계산분']} |")
    a = h["앱 데이터"]
    if a: L += ["", "## 앱 데이터", *[f"- {k}: {v}" for k, v in a.items()]]
    d = h["진학 실적"]; L += ["", "## 진학 실적", f"- 원천 {d['원천 행']}행: {d['상태별']}", f"- 확보율: {d['확보율']}", "", "| 학교 | 분류 | 2024 | 2025 | 2026 |", "|---|---|---|---|---|"]
    for sid, v in d["학교별"].items(): L.append(f"| {sid} | {v['분류']} | " + " | ".join(", ".join(v["연도별 승인 지표"][y]) or "-" for y in ("2024", "2025", "2026")) + " |")
    L += ["", "## 출처 이용 조건", *[f"- {r['source_id']}: 자동 수집 {r['auto_policy']} (확인 {r['terms_checked']})" for r in h["출처 정책"]]]
    open(P("pipeline", "out", "data_health.md"), "w", encoding="utf8").write("\n".join(L) + "\n"); return h

if __name__ == "__main__":
    h = run(); print(json.dumps({k: h[k] for k in ("마스터", "앱 데이터")}, ensure_ascii=False)[:600])
