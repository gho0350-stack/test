"""K-apt(공동주택관리정보시스템) 단지 목록 + 기본정보 수집 -> 세대수·사용승인일.
  단지 목록:  https://www.data.go.kr/data/15057332/openapi.do  (시군구 단지목록)
  기본 정보:  https://www.data.go.kr/data/15058453/openapi.do  (kaptCode 별 상세)
사용: DATA_GO_KR_KEY=... python3 collect_kapt.py   (엔드포인트/필드명은 활용신청 페이지의 최신 명세로 확인, 실서버 미검증)"""
import json, os, sys, time, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from collect_molit import LAWD
BASE = "https://apis.data.go.kr/1613000"
LIST_EP = BASE + "/AptListService3/getSigunguAptList3"
INFO_EP = BASE + "/AptBasisInfoServiceV4/getAphusBassInfoV4"

def get(url, **q):
    q["serviceKey"] = os.environ["DATA_GO_KR_KEY"]
    return ET.fromstring(urllib.request.urlopen(url + "?" + urllib.parse.urlencode(q), timeout=60).read())

def txt(it, *names):
    for n in names:
        v = it.findtext(n)
        if v: return v.strip()
    return ""

if __name__ == "__main__":
    if not os.environ.get("DATA_GO_KR_KEY"): sys.exit("DATA_GO_KR_KEY 환경변수가 필요합니다.")
    for gu, cd in LAWD.items():
        rows, page = [], 1
        while True:
            root = get(LIST_EP, sigunguCode=cd, pageNo=page, numOfRows=1000); items = root.findall(".//item")
            rows += [{"code": txt(i, "kaptCode"), "name": txt(i, "kaptName"), "dong": txt(i, "as3"), "addr": txt(i, "as4")} for i in items]
            if len(items) < 1000: break
            page += 1
        for r in rows:
            try:
                it = get(INFO_EP, kaptCode=r["code"]).find(".//item")
                if it is not None: r.update({"households": txt(it, "kaptdaCnt"), "approved": txt(it, "kaptUsedate"), "dongs": txt(it, "kaptDongCnt"), "road": txt(it, "doroJuso")})
            except Exception: pass
            time.sleep(0.05)
        json.dump(rows, open(f"out/kapt_{gu}.json", "w", encoding="utf8"), ensure_ascii=False)
        print(gu, len(rows), "단지", flush=True)
