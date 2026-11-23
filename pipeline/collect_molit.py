"""국토교통부 아파트 매매/전월세 실거래가 수집 (공공데이터포털 data.go.kr).
준비: 활용신청 후 일반 인증키(Decoding) 를 환경변수 DATA_GO_KR_KEY 로 설정.
  매매:   https://www.data.go.kr/data/15126469/openapi.do
  전월세: https://www.data.go.kr/data/15126474/openapi.do
사용: DATA_GO_KR_KEY=... python3 collect_molit.py --months 12 --gu 강남구,서초구
주의: 엔드포인트/태그명은 활용신청 페이지의 최신 명세를 확인하세요. (영문/한글 태그 모두 허용하도록 작성, 실서버 미검증)"""
import argparse, json, os, sys, time, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from normalize import to_manwon

LAWD = {"강남구": "11680", "서초구": "11650", "송파구": "11710", "양천구": "11470", "노원구": "11350", "강동구": "11740"}
EP = {"trade": "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev",
      "rent": "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent"}
TAG = {"apt": ("aptNm", "아파트"), "dong": ("umdNm", "법정동"), "jibun": ("jibun", "지번"), "amount": ("dealAmount", "거래금액"),
       "year": ("dealYear", "년"), "month": ("dealMonth", "월"), "day": ("dealDay", "일"), "area": ("excluUseAr", "전용면적"),
       "floor": ("floor", "층"), "build": ("buildYear", "건축년도"), "deposit": ("deposit", "보증금액"), "monthly": ("monthlyRent", "월세금액")}

def pick(item, key):
    for t in TAG[key]:
        e = item.find(t)
        if e is not None and e.text is not None: return e.text.strip()
    return ""

def fetch(kind, lawd, ym, key, rows=1000):
    out, page = [], 1
    while True:
        q = urllib.parse.urlencode({"serviceKey": key, "LAWD_CD": lawd, "DEAL_YMD": ym, "pageNo": page, "numOfRows": rows})
        for t in range(4):
            try: root = ET.fromstring(urllib.request.urlopen(f"{EP[kind]}?{q}", timeout=60).read()); break
            except Exception as e: time.sleep(1 + t); root = None
        if root is None: raise RuntimeError(f"요청 실패 {kind} {lawd} {ym}")
        code = (root.findtext(".//resultCode") or "").strip()
        if code not in ("00", "000", ""): raise RuntimeError(f"API 오류 {code}: {root.findtext('.//resultMsg')}")
        items = root.findall(".//item")
        for it in items:
            d = f"{pick(it,'year')}-{int(pick(it,'month')):02d}-{int(pick(it,'day')):02d}"
            r = {"apt": pick(it, "apt"), "dong": pick(it, "dong"), "jibun": pick(it, "jibun"), "date": d, "area": float(pick(it, "area") or 0),
                 "floor": int(pick(it, "floor") or 0), "build": int(pick(it, "build") or 0)}
            if kind == "trade": r["amount"] = to_manwon(pick(it, "amount"))
            else: r["deposit"] = to_manwon(pick(it, "deposit")); r["monthly"] = to_manwon(pick(it, "monthly"))
            out.append(r)
        if len(items) < rows: return out
        page += 1

def months_back(n, today=None):
    t = today or date.today(); y, m = t.year, t.month; res = []
    for _ in range(n):
        res.append(f"{y}{m:02d}"); m -= 1
        if m == 0: y, m = y - 1, 12
    return res

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--months", type=int, default=12); ap.add_argument("--gu", default=",".join(LAWD))
    a = ap.parse_args(); key = os.environ.get("DATA_GO_KR_KEY")
    if not key: sys.exit("DATA_GO_KR_KEY 환경변수가 필요합니다 (data.go.kr 인증키).")
    for gu in a.gu.split(","):
        for kind in ("trade", "rent"):
            with open(f"out/{kind}s_{gu}.jsonl", "w", encoding="utf8") as f:
                for ym in months_back(a.months):
                    for r in fetch(kind, LAWD[gu], ym, key): f.write(json.dumps(r, ensure_ascii=False) + "\n")
            print(gu, kind, "완료", flush=True)
