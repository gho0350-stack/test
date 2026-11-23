# -*- coding: utf-8 -*-
"""어디살지: 국토부 실거래가 + K-apt 수집/집계 (구글 코랩·로컬 공용, 외부 패키지 불필요)
run(KEY) 호출 -> 결과 dict 반환 (molit_result.json 으로 저장)"""
import json, re, time, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import date, timedelta
from statistics import median

LAWD = {"강남구": "11680", "서초구": "11650", "송파구": "11710", "양천구": "11470", "노원구": "11350", "강동구": "11740"}
BASE = "https://apis.data.go.kr/1613000/"
EP = {"trade": ["RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev", "RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade"],
      "rent": ["RTMSDataSvcAptRent/getRTMSDataSvcAptRent"]}
KAPT_LIST = BASE + "AptListService3/getSigunguAptList3"
KAPT_INFO = BASE + "AptBasisInfoServiceV4/getAphusBassInfoV4"
TAG = {"apt": ("aptNm", "아파트"), "dong": ("umdNm", "법정동"), "amount": ("dealAmount", "거래금액"), "year": ("dealYear", "년"), "month": ("dealMonth", "월"),
       "day": ("dealDay", "일"), "area": ("excluUseAr", "전용면적"), "floor": ("floor", "층"), "build": ("buildYear", "건축년도"),
       "deposit": ("deposit", "보증금액"), "monthly": ("monthlyRent", "월세금액")}
HINT = {"20": "이 키로 해당 API 활용신청이 안 되었거나 아직 승인 전이에요. data.go.kr 에서 그 API 페이지의 '활용신청'을 했는지, 승인(마이페이지 > 활용신청 현황)을 확인하세요.",
        "30": "등록되지 않은 서비스키예요. 일반 인증키(Decoding)를 복사했는지 확인하고, 방금 신청했다면 1~2시간 뒤 다시 시도하세요.",
        "22": "일일 호출 한도를 넘었어요. 내일 다시 실행하세요.", "31": "키 사용 기간이 만료되었어요.", "12": "해당 API 주소가 없어요 (엔드포인트 확인 필요)."}

# ---------- 정규화 ----------
AREA_BUCKETS = {59: (55.0, 60.0), 84: (80.0, 85.0), 101: (95.0, 105.0)}
def bucket(a):
    for k, (lo, hi) in AREA_BUCKETS.items():
        if lo <= a <= hi: return k
def norm_name(n):
    n = re.sub(r"\(.*?\)", "", n or ""); n = re.sub(r"[\s·\-]", "", n); return re.sub(r"(아파트|단지)$", "", n)
def eok(m): return round(m / 10000, 2)
def to_man(t):
    t = str(t).replace(",", "").strip(); return int(t) if t else 0
def stats(rows, k, today, key, months=12):
    start = today - timedelta(days=round(months * 30.4))
    sel = [r for r in rows if bucket(r["area"]) == k and start <= date.fromisoformat(r["date"]) <= today]
    if not sel: return None
    v = [r[key] for r in sel]
    return {"min": eok(min(v)), "max": eok(max(v)), "median": eok(median(v)), "count": len(v), "last": max(r["date"] for r in sel)}

# ---------- 호출 ----------
class ApiError(Exception): pass
def call(url, params, tries=3):
    last = None
    for t in range(tries):
        try:
            root = ET.fromstring(urllib.request.urlopen(url + "?" + urllib.parse.urlencode(params), timeout=60).read()); break
        except urllib.error.HTTPError as e:   # 게이트웨이 오류도 본문에 XML 로 사유가 있다
            try: root = ET.fromstring(e.read()); break
            except Exception: last = e; time.sleep(1 + t)
        except Exception as e: last = e; time.sleep(1 + t)
    else: raise ApiError(f"요청 실패: {last}")
    code = (root.findtext(".//returnReasonCode") or "").strip()
    if code: raise ApiError(f"[{code}] {root.findtext('.//returnAuthMsg') or root.findtext('.//errMsg')} - {HINT.get(code, '')}")
    rc = (root.findtext(".//resultCode") or "").strip()
    if rc not in ("00", "000", ""): raise ApiError(f"[{rc}] {root.findtext('.//resultMsg')}")
    return root
def pick(it, key):
    for t in TAG[key]:
        e = it.find(t)
        if e is not None and e.text is not None: return e.text.strip()
    return ""
def parse_rows(root, kind):
    out = []
    for it in root.findall(".//item"):
        r = {"apt": pick(it, "apt"), "dong": pick(it, "dong"), "date": f"{pick(it,'year')}-{int(pick(it,'month') or 0):02d}-{int(pick(it,'day') or 0):02d}",
             "area": float(pick(it, "area") or 0), "floor": int(pick(it, "floor") or 0), "build": int(pick(it, "build") or 0)}
        if kind == "trade": r["amount"] = to_man(pick(it, "amount"))
        else: r["deposit"] = to_man(pick(it, "deposit")); r["monthly"] = to_man(pick(it, "monthly"))
        out.append(r)
    return out
def fetch_month(kind, lawd, ym, key, ep_idx, rows=1000):
    out, page = [], 1
    while True:
        root = call(BASE + EP[kind][ep_idx], {"serviceKey": key, "LAWD_CD": lawd, "DEAL_YMD": ym, "pageNo": page, "numOfRows": rows})
        got = parse_rows(root, kind); out += got
        if len(got) < rows: return out
        page += 1
def months_back(n, today):
    y, m, res = today.year, today.month, []
    for _ in range(n):
        res.append(f"{y}{m:02d}"); m -= 1
        if m == 0: y, m = y - 1, 12
    return res

def find_endpoint(kind, key, today):
    errs = []
    for i in range(len(EP[kind])):
        try: fetch_month(kind, LAWD["강남구"], months_back(2, today)[1], key, i, rows=5); return i
        except ApiError as e: errs.append(f"{EP[kind][i]}: {e}")
    raise ApiError(" / ".join(errs))

def run(key, sample, months=12, test=False, today=None, log=print):
    key = urllib.parse.unquote(key.strip()); today = today or date.today()
    ep = {k: find_endpoint(k, key, today) for k in EP}
    log("API 연결 확인 완료:", {k: EP[k][ep[k]] for k in EP})
    if test: return {"test": True}
    want = {}
    for s in sample: want.setdefault(s["gu"], {})[norm_name(s["name"])] = s
    trades, seen, matched = {}, {}, set()
    for gu, lawd in LAWD.items():
        by = defaultdict(lambda: {"sale": [], "jeonse": [], "dong": "", "build": 0, "name": ""})
        for kind in ("trade", "rent"):
            for ym in months_back(months, today):
                for r in fetch_month(kind, lawd, ym, key, ep[kind]):
                    b = by[norm_name(r["apt"])]; b["name"] = r["apt"]; b["dong"] = r["dong"]; b["build"] = r["build"] or b["build"]
                    if kind == "trade": b["sale"].append(r)
                    elif r["monthly"] == 0 and r["deposit"] > 0: b["jeonse"].append({**r, "amount": r["deposit"]})
            log(gu, kind, "수집 완료")
        seen[gu] = sorted(({"name": v["name"], "dong": v["dong"], "trades": len(v["sale"])} for v in by.values()), key=lambda x: -x["trades"])[:600]
        for nk, v in by.items():
            if nk not in want.get(gu, {}): continue
            rec = {"dong": v["dong"], "build": v["build"], "name": v["name"], "sale": {}, "jeonse": {}}
            for k in AREA_BUCKETS:
                s = stats(v["sale"], k, today, "amount"); j = stats(v["jeonse"], k, today, "amount")
                if s: rec["sale"][k] = s
                if j: rec["jeonse"][k] = j
            trades[f"{gu}|{nk}"] = rec; matched.add(f"{gu}|{nk}")
    unmatched = [f"{s['gu']}|{s['name']}" for s in sample if f"{s['gu']}|{norm_name(s['name'])}" not in matched]
    kapt = {}
    try:
        for gu, lawd in LAWD.items():
            lst, page = [], 1
            while True:
                items = call(KAPT_LIST, {"serviceKey": key, "sigunguCode": lawd, "pageNo": page, "numOfRows": 1000}).findall(".//item")
                lst += [{"code": (i.findtext("kaptCode") or "").strip(), "name": (i.findtext("kaptName") or "").strip()} for i in items]
                if len(items) < 1000: break
                page += 1
            for a in lst:
                nk = norm_name(a["name"])
                if nk in want.get(gu, {}):
                    it = call(KAPT_INFO, {"serviceKey": key, "kaptCode": a["code"]}).find(".//item")
                    if it is not None: kapt[f"{gu}|{nk}"] = {"code": a["code"], "name": a["name"], "households": (it.findtext("kaptdaCnt") or "").strip(), "approved": (it.findtext("kaptUsedate") or "").strip()}
            log(gu, "K-apt 완료")
    except ApiError as e:
        log("K-apt 건너뜀:", e)
    return {"generatedAt": today.isoformat(), "months": months, "trades": trades, "kapt": kapt, "unmatched": unmatched, "namesSeen": seen}
