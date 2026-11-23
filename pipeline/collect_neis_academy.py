"""NEIS 학원·교습소 정보(acaInsTiInfo) 수집.

- 키 없이: 요청이 항상 첫 5건만 반환하고 pIndex 가 무시되므로 목록 수집은 불가. 대신 필터별 list_total_count 로 '구 단위 집계'만 만든다.
- NEIS_KEY 가 있으면: pSize=1000 으로 전체 목록을 받아 동 단위 집계까지 만든다 (out/academy_<구>.jsonl).
출력: out/academy_counts.json (+ 키가 있으면 out/academy_<구>.jsonl)
"""
import json, math, os, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
KEY = os.environ.get("NEIS_KEY")
GUS = ["강남구", "서초구", "송파구", "양천구", "노원구", "강동구"]
KEEP = ["ACA_NM", "ACA_INSTI_SC_NM", "REG_STTUS_NM", "REALM_SC_NM", "LE_ORD_NM", "LE_CRSE_NM", "FA_RDNMA", "FA_RDNDA", "TOFOR_SMTOT"]

def call(tries=4, **kw):
    q = {"Type": "json", "ATPT_OFCDC_SC_CODE": "B10"}; q.update(kw)
    if KEY: q["KEY"] = KEY
    for t in range(tries):
        try: return json.load(urllib.request.urlopen("https://open.neis.go.kr/hub/acaInsTiInfo?" + urllib.parse.urlencode(q), timeout=60))
        except Exception: time.sleep(1 + t)
    return {}

def total(**kw):
    d = call(pSize=1, **kw)
    return d["acaInsTiInfo"][0]["head"][0]["list_total_count"] if "acaInsTiInfo" in d else 0

def counts():
    """키 없이 신뢰할 수 있는 필터는 ADMST_ZONE_NM(구), REALM_SC_NM(분야) 뿐이다.
    (REG_STTUS_NM, ACA_INSTI_SC_NM 필터는 키 없이 적용되지 않는 것을 확인 -> 개원/폐원, 학원/교습소 구분은 NEIS_KEY 로 전체 목록을 받아 계산)"""
    res = {}
    for gu in GUS:
        res[gu] = {"registered": total(ADMST_ZONE_NM=gu), "boseup": total(ADMST_ZONE_NM=gu, REALM_SC_NM="입시.검정 및 보습")}
        print(gu, res[gu], flush=True)
    json.dump({"fetched": time.strftime("%Y-%m-%d"), "keyless": not KEY, "gus": res}, open("out/academy_counts.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)

def crawl():  # NEIS_KEY 필요
    for gu in GUS:
        n = total(ADMST_ZONE_NM=gu); pages = math.ceil(n / 1000)
        def work(p):
            d = call(pSize=1000, pIndex=p, ADMST_ZONE_NM=gu)
            return [{k: r.get(k) for k in KEEP} for r in d["acaInsTiInfo"][1]["row"]] if "acaInsTiInfo" in d else []
        with ThreadPoolExecutor(4) as ex, open(f"out/academy_{gu}.jsonl", "w", encoding="utf8") as f:
            for rows in ex.map(work, range(1, pages + 1)):
                for r in rows: f.write(json.dumps(r, ensure_ascii=False) + "\n")
        print(gu, "saved", n, flush=True)

if __name__ == "__main__":
    counts()
    if KEY: crawl()
    else: print("NEIS_KEY 가 없어 동 단위 집계는 건너뜀 (README 참고)")
