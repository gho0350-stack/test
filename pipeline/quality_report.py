"""수집 품질 리포트: out/quality_report.json, out/quality_report.md (GitHub Actions 요약에도 출력)."""
import json, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
def load(n):
    p = os.path.join(OUT, n); return json.load(open(p, encoding="utf8")) if os.path.exists(p) else None
def pct(a, b): return f"{a}/{b} ({a / b * 100:.1f}%)" if b else "-"

def build(errors=(), warns=()):
    mo, ka, sm, sa, ap = load("molit_result.json"), load("kakao_neis_result.json"), load("sample_apts.json"), load("schools_all.json"), load("api_samples.json")
    n = len(sm or []); rep = {"errors": list(errors), "warnings": list(warns), "metrics": {}}
    M = rep["metrics"]
    if mo:
        M["실거래 연결 단지"] = pct(len(mo["trades"]), n); M["K-apt 연결 단지"] = pct(len(mo["kapt"]), len(mo["trades"]))
        M["K-apt 이전값 유지(stale)"] = sum(1 for v in mo["kapt"].values() if v.get("stale"))
        M["해제(취소) 거래 제외"] = sum((mo.get("quality") or {}).get("cancelled", {}).values()) if mo.get("quality") else "미집계"
        M["K-apt 오류"] = mo.get("kaptError") or "없음"; M["실거래 기준일"] = mo.get("generatedAt")
        M["실거래 미연결 단지"] = mo.get("unmatched", [])
    if ka:
        M["카카오 학교 좌표"] = pct(len(ka["schools"]), len(set(s["school"] for s in load("apts_for_kakao.json") or [])) or len(ka["schools"]))
        M["카카오 단지 좌표"] = pct(len(ka["apts"]), n); M["카카오 좌표 실패"] = ka.get("failed", [])
        M["NEIS 학원 동 단위"] = "있음" if ka.get("neis_academy") else "없음"
    M["서울 전체 학교(NEIS)"] = len(sa) if sa else "미수집"
    if ap:
        M["API 점검 기준월"] = ap.get("dealYm"); M["엔드포인트 응답"] = {k: ("정상" if v.get("ok") else "실패: " + v.get("error", "")[:80]) for k, v in ap["endpoints"].items()}
        fields = sorted({f for v in ap["endpoints"].values() if v.get("ok") for f in v.get("fields", [])})
        M["거래 응답에 해제 필드 존재"] = any(f in ("cdealType", "해제여부") for f in fields)
        M["거래유형/계약구분 필드 존재"] = {"거래유형": any(f in ("dealingGbn", "거래유형") for f in fields), "계약구분": any(f in ("contractType", "계약구분") for f in fields)}
    M["학구도(학교군) 매칭"] = "미구현"; M["단지 폴리곤 확보율"] = "미구현"
    return rep

def write(errors=(), warns=()):
    rep = build(errors, warns)
    json.dump(rep, open(os.path.join(OUT, "quality_report.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    lines = ["## 수집 품질 리포트", ""] + [f"- **{k}**: {v}" for k, v in rep["metrics"].items()]
    if rep["warnings"]: lines += ["", "### 경고"] + [f"- {w}" for w in rep["warnings"]]
    if rep["errors"]: lines += ["", "### 실패한 단계"] + [f"- {e}" for e in rep["errors"]]
    md = "\n".join(lines) + "\n"; open(os.path.join(OUT, "quality_report.md"), "w", encoding="utf8").write(md)
    if os.environ.get("GITHUB_STEP_SUMMARY"): open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf8").write(md)
    print(md)

if __name__ == "__main__": write()
