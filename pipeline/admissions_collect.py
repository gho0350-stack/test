# -*- coding: utf-8 -*-
"""진학 실적 자동 수집(검색 -> 출처 정책 확인 -> 본문 가져오기 -> AI 추출 -> 근거 문구 검증 -> 검토대기 행 추가).
  NAVER_CLIENT_ID/SECRET 과 AI 키(AI_PROVIDER 에 맞는 것)가 있어야 동작한다. 키가 없으면 아무것도 하지 않고 안내만 출력한다.
출처 정책(data/admission_sources.csv 의 auto_policy): 예 = 자동 수집 허용 / 보류·아니오 = 본문을 가져오지 않고 링크만 data/admissions_manual_links.csv 에 올려 관리자 확인 대상으로 분리.
이미 승인·대기 중인 (학교, 학년도, 범주)는 다시 검색하지 않는다(결측 중심). 같은 URL 은 한 번만 처리한다."""
import csv, datetime, html, os, re, sys, urllib.parse, urllib.request
import admissions_ai as ai
import admissions_sites as sites
import admissions_build as ab
D = ab.D

def policy_of(url, sources):
    host = urllib.parse.urlparse(url).netloc.lower()
    for s in sources:
        for d in filter(None, s.get("domains", "").split(";")):
            if d.split("/")[0] in host: return s
    return None

def fetch_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; school-map-pipeline)"})
    t = urllib.request.urlopen(req, timeout=30).read().decode("utf8", "ignore")
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", t, flags=re.S)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t))).strip()

def school_homepages():
    """NEIS 학교 목록(out/schools_all.json)에서 학교명 -> 홈페이지 주소."""
    import json
    p = os.path.join(ab.ROOT, "pipeline", "out", "schools_all.json")
    return {x["SCHUL_NM"]: x.get("HMPG_ADRES") for x in json.load(open(p, encoding="utf8"))} if os.path.exists(p) else {}

def collect_school_sites(schools, have, raw_rows, years, usage, extract=None, discover=sites.discover, max_schools=8, log=print):
    """auto_policy=예 로 허용된 '학교 공식 홈페이지'에서 아직 값이 없는 학교의 후보를 모은다."""
    homes = school_homepages(); added = []; stats = {"schools": 0, "pages": 0, "rows": 0, "rejected": 0}
    todo = [s for s in schools if any(not have.get((s["id"], y)) for y in years) and homes.get(s["name"])][:max_schools]
    for s in todo:
        stats["schools"] += 1; log("학교 홈페이지 탐색:", s["name"], homes[s["name"]])
        try: pages = discover(homes[s["name"]], log=log)
        except Exception as e: log("  탐색 실패:", type(e).__name__); continue
        for url, text in pages[:4]:                          # 학교당 AI 호출 상한
            for y in sorted({int("20" + m.group(1)) for m in sites.YEAR.finditer(text)} & set(years)):
                if have.get((s["id"], y)): continue
                try:
                    resp = (extract or ai.ask_ai)(ai.PROMPT.format(school=s["name"], year=y), text=text[:20000], usage=usage)
                    ok, bad = ai.parse_rows(resp, text); stats["rejected"] += len(bad); stats["pages"] += 1
                    for x in ok: added.append(ai.to_raw_row(x, s, y, "school_site", url, "텍스트", "school_site:" + urllib.parse.urlparse(url).netloc + urllib.parse.urlparse(url).path))
                except Exception as e: log("  추출 실패:", url[:80], str(e)[:80])
    existing = {r["record_id"] for r in raw_rows}; new = [r for r in added if r["record_id"] not in existing]
    stats["rows"] = len(new); log("학교 홈페이지 수집 결과:", stats); return new, stats

def in_season(today=None):
    """입시 시즌(12~4월)은 매주, 그 외는 월 1회(매월 첫 주)만 실행한다."""
    t = today or datetime.date.today(); return t.month in (12, 1, 2, 3, 4) or t.day <= 7

def seed_results(school_id, year):
    """검색 API 없이 쓰는 후보 링크 목록(data/admissions_seed_urls.csv: school_id,year,title,url). 사람이나 개발 도우미가 찾은 링크를 넣는다."""
    return [{"title": r.get("title") or f"{r['school_id']} {r['year']} 대입 실적 합격", "link": r["url"], "desc": "합격 진학 입시 대입 실적"} for r in ab.rd(D("admissions_seed_urls.csv")) if r["school_id"] == school_id and str(r["year"]) == str(year)]

def run(years=(2024, 2025, 2026), max_pages=30, log=print, search=None, extract=None, fetch=fetch_text, force=False):
    if not force and not in_season(): log("시즌 외 주기(월 1회)에 해당하지 않아 건너뜁니다"); return {}
    sources = ab.rd(D("admission_sources.csv")); raw = ab.rd(D("admissions_raw.csv")); usage = ai.Usage()
    schools = [{"id": r["school_id"], "name": r["school_name"]} for r in ab.rd(D("school_admission.csv"))]
    have = {}
    for r in raw:
        if r["status"] != "반려": have.setdefault((r["school_id"], int(r["admission_year"])), set()).add(r["category"])
    seen_urls = {r["source_url"] for r in raw} | {r["url"] for r in ab.rd(D("admissions_manual_links.csv"))}
    manual, added, pages = [], [], 0; stats = {"queries": 0, "auto_pages": 0, "manual_links": 0, "rows": 0, "rejected": 0}
    for plan in ai.plan_queries(schools, list(years), have):
        school = next(s for s in schools if s["id"] == plan["school_id"])
        batches = [(q, None) for q in plan["queries"][:3]] if search else [("seed", seed_results(plan["school_id"], plan["year"]))]
        for q, pre in batches:
            if pre is None:
                try: items = search(q, usage=usage)
                except Exception as e: log("검색 중단:", str(e)[:100]); items = []
                stats["queries"] += 1
            else: items = pre
            for it in items:
                url = it["link"]
                if url in seen_urls or not re.search(r"합격|진학|입시|대입|실적", it["title"] + it["desc"]) or (pre is None and school["name"][:2] not in it["title"] + it["desc"]): continue
                seen_urls.add(url); src = policy_of(url, sources)
                if not src or src["auto_policy"] != "예":   # 이용 조건이 불명확하거나 금지된 출처: 링크만 남겨 관리자 확인
                    manual.append({"school_id": school["id"], "school_name": school["name"], "year": plan["year"], "title": it["title"], "url": url, "source_id": src["source_id"] if src else "unknown", "policy": src["auto_policy"] if src else "미분류", "found_at": datetime.date.today().isoformat()}); stats["manual_links"] += 1; continue
                if pages >= max_pages: continue
                pages += 1; stats["auto_pages"] += 1
                try:
                    text = fetch(url); resp = (extract or ai.ask_ai)(ai.PROMPT.format(school=school["name"], year=plan["year"]), text=text[:20000], usage=usage)
                    ok, bad = ai.parse_rows(resp, text); stats["rejected"] += len(bad)
                    for x in ok: added.append(ai.to_raw_row(x, school, plan["year"], src["source_id"], url, "텍스트", f"{src['source_id']}:{urllib.parse.urlparse(url).path}"))
                except Exception as e: log("추출 실패:", url, str(e)[:100])
    existing = {r["record_id"] for r in raw}; new = [r for r in added if r["record_id"] not in existing]
    if next((s for s in sources if s["source_id"] == "school_site" and s["auto_policy"] == "예"), None):
        have_ok = {k: v for k, v in have.items() if v}
        extra, st2 = collect_school_sites(schools, have_ok, raw, list(years), usage, extract=extract)
        new += extra; stats["school_sites"] = st2
    if new: ab.wr(D("admissions_raw.csv"), raw + new, ab.RAW_F)
    if manual:
        old = ab.rd(D("admissions_manual_links.csv")); ab.wr(D("admissions_manual_links.csv"), old + manual, ["school_id", "school_name", "year", "title", "url", "source_id", "policy", "found_at"])
    usage.save(); stats["rows"] = len(new); log("수집 결과:", stats); return stats

if __name__ == "__main__":
    use_search = bool(os.environ.get("NAVER_CLIENT_ID") and os.environ.get("NAVER_CLIENT_SECRET"))   # 검색 API 는 선택. 없으면 seed 링크 목록만 처리한다
    prov = os.environ.get("AI_PROVIDER", "gemini"); key = {"gemini": "GEMINI_API_KEY", "anthropic": "ANTHROPIC_API_KEY", "openai": "OPENAI_API_KEY"}.get(prov)
    if not key or not os.environ.get(key): print(f"{key} 가 없어 AI 추출을 건너뜁니다(검색 링크만 관리자 확인 목록에 올리려면 키 없이도 가능하도록 이후 확장)"); sys.exit(0)
    run(force=os.environ.get("FORCE") == "1", search=ai.naver_search if use_search else None); ab.main()   # 새 후보를 검증·검토 목록/HTML 로 반영
