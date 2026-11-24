"""서울 전체 초·중·고 학교 기본정보(NEIS schoolInfo). NEIS_KEY 필요(페이지당 1000건). 결과: out/schools_all.json"""
import json, urllib.parse, urllib.request
KEEP = ["SD_SCHUL_CODE", "SCHUL_NM", "SCHUL_KND_SC_NM", "LCTN_SC_NM", "FOND_SC_NM", "COEDU_SC_NM", "HS_SC_NM", "HS_GNRL_BUSNS_SC_NM", "ORG_RDNMA", "ORG_RDNDA", "ORG_RDNZC", "HMPG_ADRES", "DGHT_SC_NM", "LOAD_DTM"]

def collect(key, office="B10"):
    rows, page = [], 1
    while True:
        q = urllib.parse.urlencode({"KEY": key, "Type": "json", "pIndex": page, "pSize": 1000, "ATPT_OFCDC_SC_CODE": office})
        d = json.load(urllib.request.urlopen("https://open.neis.go.kr/hub/schoolInfo?" + q, timeout=60))
        if "schoolInfo" not in d: break
        got = d["schoolInfo"][1]["row"]; rows += [{k: r.get(k) for k in KEEP} for r in got]
        if len(got) < 1000: break
        page += 1
    return rows
