# -*- coding: utf-8 -*-
"""어디살지: 국토부 실거래가 + K-apt 수집/집계 (구글 코랩·로컬 공용, 외부 패키지 불필요)
run(KEY) 호출 -> 결과 dict 반환 (molit_result.json 으로 저장)"""
import json, re, time, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import date, timedelta
from statistics import median

ALIAS = {"강남구|한보미도맨션": "한보미도맨션1", "강남구|대치쌍용2차": "쌍용대치2", "송파구|엘스": "잠실엘스", "송파구|송파헬리오시티": "헬리오시티", "송파구|올림픽선수기자촌": "올림픽선수기자촌1단지",
         "양천구|목동센트럴아이파크위브": "목동센트럴아이파크위브2단지", "양천구|목동현대하이페리온": "현대하이페리온", "양천구|목동래미안": "목동2삼성래미안",
         "노원구|중계그린": "중계그린1단지", "노원구|중계건영2차": "건영2", "노원구|중계롯데우성": "롯데우성",
         "강동구|고덕래미안힐스테이트": "래미안힐스테이트고덕", "강동구|고덕센트럴아이파크": "고덕센트럴IPARK", "강동구|상일동 고덕리엔파크": "고덕리엔파크3단지"}
# MOLIT 단지명 -> K-apt 등록 단지명 (K-apt 에 다른 이름으로 등록된 경우, 이름 목록으로 확인한 것만)
KAPT_ALIAS = {"양천구|목동신시가지5": "목동5단지", "양천구|목동신시가지7": "목동7단지", "양천구|목동신시가지11": "목동11단지", "양천구|목동신시가지12": "목동12단지",
              "강남구|쌍용대치2": "대치쌍용2차", "양천구|목동2삼성래미안": "목동2차삼성래미안", "강동구|고덕센트럴IPARK": "고덕센트럴아이파크"}
LAWD = {"강남구": "11680", "서초구": "11650", "송파구": "11710", "양천구": "11470", "노원구": "11350", "강동구": "11740"}
BASE = "https://apis.data.go.kr/1613000/"
EP = {"trade": ["RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev", "RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade"],
      "rent": ["RTMSDataSvcAptRent/getRTMSDataSvcAptRent"]}
KAPT_LIST = BASE + "AptListService4/getSigunguAptList4"
KAPT_INFO = BASE + "AptBasisInfoServiceV5/getAphusBassInfoV5"
TAG = {"apt": ("aptNm", "아파트"), "dong": ("umdNm", "법정동"), "amount": ("dealAmount", "거래금액"), "year": ("dealYear", "년"), "month": ("dealMonth", "월"),
       "day": ("dealDay", "일"), "jibun": ("jibun", "지번"), "area": ("excluUseAr", "전용면적"), "floor": ("floor", "층"), "build": ("buildYear", "건축년도"),
       "deposit": ("deposit", "보증금액"), "monthly": ("monthlyRent", "월세금액"),
       "cancel": ("cdealType", "해제여부"), "cancel_day": ("cdealDay", "해제사유발생일"), "gbn": ("dealingGbn", "거래유형"), "ctype": ("contractType", "계약구분")}
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
def kcall(url, params, tries=3):
    """K-apt V4/V5 는 기본 응답이 JSON 이다. JSON/XML 모두 받아 (header, body) 딕셔너리로 반환."""
    last = None
    for t in range(tries):
        try: raw = urllib.request.urlopen(url + "?" + urllib.parse.urlencode(params), timeout=60).read(); break
        except urllib.error.HTTPError as e: raw = e.read(); break
        except Exception as e: last = e; time.sleep(1 + t)
    else: raise ApiError(f"요청 실패: {last}")
    if raw.lstrip()[:1] in (b"{", b"["):
        d = json.loads(raw)
        if "OpenAPI_ServiceResponse" in d:
            h = d["OpenAPI_ServiceResponse"]["cmmMsgHeader"]; code = str(h.get("returnReasonCode", "")); raise ApiError(f"[{code}] {h.get('returnAuthMsg') or h.get('errMsg')} - {HINT.get(code, '')}")
        r = d.get("response", d); return r.get("header", {}), r.get("body", {})
    try: root = ET.fromstring(raw)
    except ET.ParseError: raise ApiError(f"응답 형식 오류: {raw[:120]!r}")
    code = (root.findtext(".//returnReasonCode") or "").strip()
    if code: raise ApiError(f"[{code}] {root.findtext('.//returnAuthMsg') or root.findtext('.//errMsg')} - {HINT.get(code, '')}")
    def d2(e): return {c.tag: (d2(c) if len(c) else (c.text or "").strip()) for c in e}
    return {"resultCode": (root.findtext(".//resultCode") or "")}, d2(root.find("body")) if root.find("body") is not None else {}
def kitems(body):
    it = body.get("items") if isinstance(body, dict) else None
    if isinstance(it, dict): it = it.get("item", [])
    if isinstance(it, dict): it = [it]
    return it or []

def pick(it, key):
    for t in TAG[key]:
        e = it.find(t)
        if e is not None and e.text is not None: return e.text.strip()
    return ""
def parse_rows(root, kind):
    out = []
    for it in root.findall(".//item"):
        r = {"apt": pick(it, "apt"), "dong": pick(it, "dong"), "date": f"{pick(it,'year')}-{int(pick(it,'month') or 0):02d}-{int(pick(it,'day') or 0):02d}",
             "jibun": pick(it, "jibun"), "cancel": pick(it, "cancel"), "gbn": pick(it, "gbn"), "ctype": pick(it, "ctype"), "area": float(pick(it, "area") or 0), "floor": int(pick(it, "floor") or 0), "build": int(pick(it, "build") or 0)}
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

def inside(big, small):
    """small 이 big 안에 있으면 True. 숫자로 끝나면 바로 뒤에 숫자가 이어지는 경우(5 vs 15)는 제외."""
    if len(small) < 3: return False
    i = big.find(small)
    while i >= 0:
        j = i + len(small)
        if not small[-1].isdigit() or j == len(big) or not big[j].isdigit(): return True
        i = big.find(small, i + 1)
    return False

def month_stats(rows, k, key):
    by = defaultdict(list)
    for r in rows:
        if bucket(r["area"]) == k: by[r["date"][:7].replace("-", "")].append(r[key])
    return [[ym, eok(median(v)), len(v)] for ym, v in sorted(by.items())]

def run(key, sample, months=60, test=False, today=None, log=print, workers=4):
    from concurrent.futures import ThreadPoolExecutor
    key = urllib.parse.unquote(key.strip()); today = today or date.today()
    ep = {k: find_endpoint(k, key, today) for k in EP}
    log("API 연결 확인 완료:", {k: EP[k][ep[k]] for k in EP})
    if test: return {"test": True}
    want = {}
    for s in sample:
        nm = ALIAS.get(f"{s['gu']}|{s['name']}", s["name"]); want.setdefault(s["gu"], {})[norm_name(nm)] = s
    yms = months_back(months, today); recent_from = today - timedelta(days=round(12 * 30.4))
    trades, seen, matched = {}, {}, set()
    quality = {"cancelled": {}}
    for gu, lawd in LAWD.items():
        by = defaultdict(lambda: {"sale": [], "jeonse": [], "dong": "", "build": 0, "name": "", "jibun": "", "n12": 0})
        jobs = [(kind, ym) for kind in ("trade", "rent") for ym in yms]
        def work(j): return j, fetch_month(j[0], lawd, j[1], key, ep[j[0]])
        with ThreadPoolExecutor(workers) as ex:
            for n, ((kind, ym), rows) in enumerate(ex.map(work, jobs), 1):
                for r in rows:
                    if kind == "trade" and r.get("cancel"): quality["cancelled"][gu] = quality["cancelled"].get(gu, 0) + 1; continue  # 해제(취소) 거래 제외
                    nk = norm_name(r["apt"]); b = by[nk]
                    if date.fromisoformat(r["date"]) >= recent_from and kind == "trade": b["n12"] += 1
                    if nk not in want.get(gu, {}) : 
                        b["name"] = r["apt"]; b["dong"] = r["dong"]; continue
                    b["name"] = r["apt"]; b["dong"] = r["dong"]; b["build"] = r["build"] or b["build"]; b["jibun"] = r["jibun"] or b["jibun"]
                    if kind == "trade": b["sale"].append(r)
                    elif r["monthly"] == 0 and r["deposit"] > 0: b["jeonse"].append({**r, "amount": r["deposit"]})
                if n % 24 == 0: log(f"  {gu} {n}/{len(jobs)}")
        log(gu, "수집 완료")
        seen[gu] = sorted(({"name": v["name"], "dong": v["dong"], "trades": v["n12"]} for v in by.values()), key=lambda x: -x["trades"])[:600]
        for nk, v in by.items():
            if nk not in want.get(gu, {}): continue
            rec = {"dong": v["dong"], "build": v["build"], "name": v["name"], "jibun": v["jibun"], "sale": {}, "jeonse": {}, "series": {"sale": {}, "jeonse": {}}, "recent": {"sale": {}, "jeonse": {}}}
            for kind, rows in (("sale", v["sale"]), ("jeonse", v["jeonse"])):
                for k in AREA_BUCKETS:
                    st = stats(rows, k, today, "amount")
                    if st: rec[kind][k] = st
                    ser = month_stats(rows, k, "amount")
                    if ser: rec["series"][kind][k] = ser
                    rc = sorted((r for r in rows if bucket(r["area"]) == k), key=lambda r: r["date"], reverse=True)[:4]
                    if rc: rec["recent"][kind][k] = [{"date": r["date"], "floor": r["floor"], "price": eok(r["amount"])} for r in rc]
            trades[f"{gu}|{nk}"] = rec; matched.add(f"{gu}|{nk}")
    unmatched = [f"{s['gu']}|{s['name']}" for s in sample if f"{s['gu']}|{norm_name(ALIAS.get(s['gu']+'|'+s['name'], s['name']))}" not in matched]
    kapt, kapt_error, klist = {}, "", {}
    try:
        for gu, lawd in LAWD.items():
            lst, page = [], 1
            while True:
                h, body = kcall(KAPT_LIST, {"serviceKey": key, "sigunguCode": lawd, "pageNo": page, "numOfRows": 1000})
                items = kitems(body); lst += [{"code": str(i.get("kaptCode", "")).strip(), "name": str(i.get("kaptName", "")).strip(), "dong": str(i.get("as3", "")).strip()} for i in items]
                if len(items) < 1000: break
                page += 1
            tdongs = {v["dong"] for k2, v in trades.items() if k2.startswith(gu + "|")}
            klist[gu] = [{"name": a["name"], "code": a["code"], "dong": a["dong"]} for a in lst if a["dong"] in tdongs]
            for wk, sm in want.get(gu, {}).items():
                kw = norm_name(KAPT_ALIAS.get(f"{gu}|{wk}", wk)); cand = [a for a in lst if norm_name(a["name"]) == kw]
                if not cand:
                    dong = (trades.get(f"{gu}|{wk}") or {}).get("dong", "")
                    cand = sorted((a for a in lst if a["dong"] == dong and (inside(norm_name(a["name"]), wk) or inside(wk, norm_name(a["name"])))), key=lambda a: abs(len(norm_name(a["name"])) - len(wk)))
                if not cand: continue
                a = cand[0]; h, body = kcall(KAPT_INFO, {"serviceKey": key, "kaptCode": a["code"]}); it = body.get("item") if isinstance(body, dict) else None
                if isinstance(it, list): it = it[0] if it else None
                if it: kapt[f"{gu}|{wk}"] = {"code": a["code"], "name": a["name"], "households": str(it.get("kaptdaCnt", "")).strip(), "approved": str(it.get("kaptUsedate", "")).strip(), "addr": str(it.get("kaptAddr", "")).strip(), "dongs": str(it.get("kaptDongCnt", "")).strip()}
            log(gu, "K-apt 완료", len([k for k in kapt if k.startswith(gu)]))
    except ApiError as e:
        kapt_error = str(e); log("K-apt 건너뜀:", e)
    return {"version": 2, "generatedAt": today.isoformat(), "months": months, "trades": trades, "kapt": kapt, "kaptError": kapt_error, "kaptList": klist, "unmatched": unmatched, "namesSeen": seen, "quality": quality}
