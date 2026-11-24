# -*- coding: utf-8 -*-
"""전체 아파트 마스터 구축.
모집단 = K-apt(단지 기본정보)  U  국토부 실거래(거래 있는 단지)  +  건축물대장(누락 단지 보완, 활용신청 시).
식별: 법정동 + 지번(lot). 복수 지번은 lots 로 관리하고, 이름 매칭은 같은 동 안에서만 보조로 사용한다.
출력: out/master.json (단지 목록 + 매칭 리포트). 실서버 미검증 코드이므로 실패는 기록하고 계속 진행한다."""
import json, os, re, time, urllib.parse
from collections import defaultdict
from datetime import date, timedelta
from statistics import median
import colab_molit as m

BLD = m.BASE + "BldRgstHubService/getBrTitleInfo"          # 건축HUB 건축물대장 표제부 (활용신청 필요)
BJD_RE = lambda dong: re.compile(re.escape(dong) + r"\s*(산)?\s*(\d+)(?:-(\d+))?")

def lot_of(text, dong=None):
    """주소/지번 문자열에서 (본번[-부번]) 문자열을 뽑는다. 예: '대치동 316 은마' -> '316', '316-1' -> '316-1'"""
    t = (text or "").strip()
    mm = (BJD_RE(dong).search(t) if dong else None) or re.match(r"^\s*(산)?\s*(\d+)(?:-(\d+))?\s*$", t)
    if not mm: return None
    san, main, sub = mm.group(1), mm.group(2), mm.group(3)
    return ("산" if san else "") + str(int(main)) + (f"-{int(sub)}" if sub and int(sub) else "")

def uid_of(lawd, dong, lot, taken):
    base = f"{lawd}-{dong}-{lot}"; u, i = base, 2
    while u in taken: u = f"{base}#{i}"; i += 1           # 같은 필지에 단지가 둘 이상이면 접미사
    return u

def _retry(fn, tries=5, base=2.0):
    """공공데이터포털 [04] HTTP 에러(일시 과부하/호출 제한)는 대기 후 재시도한다."""
    for t in range(tries):
        try: return fn()
        except m.ApiError as e:
            if "[04]" not in str(e) and "요청 실패" not in str(e): raise
            if t == tries - 1: raise
            time.sleep(base * (t + 1))

DEADLINE = [None]   # epoch 초. 넘으면 새 호출을 멈추고 지금까지의 결과를 돌려준다(워크플로 제한 시간 보호)
def over(): return DEADLINE[0] is not None and time.time() > DEADLINE[0]

def kapt_collect(key, targets, cache=None, log=print, max_calls=None, pause=0.15):
    """대상 구의 K-apt 단지 전체 + 기본정보. cache(이전 결과)에 있는 단지코드는 재조회하지 않는다.
    일 호출 한도(개발계정 10,000건)를 넘기지 않도록 max_calls 까지만 신규 조회하고, 못 한 단지는 다음 실행에서 이어서 받는다(부분 결과 반환)."""
    cache = cache or {}; out = {}; calls = 0; skipped = 0
    for gu, lawd in m.LAWD.items():
        if gu not in targets: continue
        lst, page = [], 1
        try:
            while True:
                h, body = _retry(lambda: m.kcall(m.KAPT_LIST, {"serviceKey": key, "sigunguCode": lawd, "pageNo": page, "numOfRows": 1000})); items = m.kitems(body); calls += 1
                lst += [{"code": str(i.get("kaptCode", "")).strip(), "name": str(i.get("kaptName", "")).strip(), "dong": str(i.get("as3", "")).strip(), "bjd": str(i.get("bjdCode", "")).strip()} for i in items]
                if len(items) < 1000: break
                page += 1
        except m.ApiError as e: log(gu, "K-apt 목록 실패(건너뜀)", str(e)[:60]); continue
        new = fail = 0
        for a in lst:
            if a["code"] in cache: out[a["code"]] = dict(cache[a["code"]], gu=gu); continue
            if (max_calls is not None and calls >= max_calls) or over(): skipped += 1; continue
            try:
                time.sleep(pause); calls += 1
                h, body = _retry(lambda: m.kcall(m.KAPT_INFO, {"serviceKey": key, "kaptCode": a["code"]})); it = body.get("item") if isinstance(body, dict) else None
                if isinstance(it, list): it = it[0] if it else None
                if not it: continue
                rec = dict(a, gu=gu, addr=str(it.get("kaptAddr", "")).strip(), road=str(it.get("doroJuso", "")).strip(), households=str(it.get("kaptdaCnt", "")).strip(), approved=str(it.get("kaptUsedate", "")).strip(), dongs=str(it.get("kaptDongCnt", "")).strip())
                out[a["code"]] = rec; new += 1
            except m.ApiError as e:
                fail += 1
                if fail <= 3: log("K-apt 기본정보 실패", a["code"], str(e)[:60])
        log(gu, "K-apt", len(lst), "단지 (신규 조회", new, "실패", fail, ")")
    if skipped: log(f"K-apt 호출 한도 보호: {skipped}개 단지는 다음 실행에서 이어서 조회")
    return out

PARTIAL = []
def molit_collect(key, targets, months, today, ep, log=print):
    """대상 구의 실거래를 (구, 동, 정규화 단지명) 단위로 집계. 해제 거래 제외, 월별 시리즈 포함."""
    ents = {}; excluded = defaultdict(int); yms = m.months_back(months, today)
    for gu, lawd in m.LAWD.items():
        if gu not in targets: continue
        if over(): log(gu, "시간 제한으로 실거래 수집 중단"); PARTIAL.append(gu); continue
        for kind in ("trade", "rent"):
            for ym in yms:
                for r in m.fetch_month(kind, lawd, ym, key, ep[kind]):
                    if kind == "trade" and r.get("cancel"): excluded[gu] += 1; continue
                    k = (gu, r["dong"], m.norm_name(r["apt"])); e = ents.setdefault(k, {"gu": gu, "dong": r["dong"], "name": r["apt"], "lots": set(), "build": 0, "sale": [], "jeonse": []})
                    lot = lot_of(r.get("jibun")); e["build"] = r["build"] or e["build"]
                    if lot: e["lots"].add(lot)
                    if kind == "trade": e["sale"].append(r)
                    elif r["monthly"] == 0 and r["deposit"] > 0: e["jeonse"].append({**r, "amount": r["deposit"]})
            log(gu, kind, "수집 완료")
    return ents, dict(excluded)

def pack(e, today):
    """집계 결과: 면적대별 12개월 통계 + 월별 시리즈(최근 36개월) + 최근 거래."""
    out = {"sale": {}, "jeonse": {}, "series": {"sale": {}, "jeonse": {}}, "recent": {"sale": {}, "jeonse": {}}}
    cut = (today - timedelta(days=round(36 * 30.4))).isoformat()
    for kind in ("sale", "jeonse"):
        for k in m.AREA_BUCKETS:
            st = m.stats(e[kind], k, today, "amount")
            if st: out[kind][k] = st
            ser = [x for x in m.month_stats([r for r in e[kind] if r["date"] >= cut], k, "amount")]
            if ser: out["series"][kind][k] = ser
            rc = sorted((r for r in e[kind] if m.bucket(r["area"]) == k), key=lambda r: r["date"], reverse=True)[:3]
            if rc: out["recent"][kind][k] = [{"date": r["date"], "floor": r["floor"], "price": m.eok(r["amount"])} for r in rc]
    return out

def join(kapt, ents, today):
    """K-apt 와 실거래 단지를 법정동+지번으로 묶고, 안 되면 같은 동 이름 매칭, 그래도 안 되면 각각 단독 단지로 둔다."""
    master, taken, report = [], set(), {"by_lot": 0, "by_name": 0, "kapt_only": 0, "molit_only": 0, "multi_lot": 0, "lot_conflicts": []}
    by_lot = defaultdict(list)
    for code, a in kapt.items():
        lot = lot_of(a.get("addr"), a.get("dong"))
        if lot: by_lot[(a["gu"], a["dong"], lot)].append(code)
    used = set(); pending = []
    for k, e in ents.items():
        gu, dong, nk = k; codes = [c for lot in sorted(e["lots"]) for c in by_lot.get((gu, dong, lot), []) if c not in used]
        method = "lot"
        if len(set(codes)) > 1:   # 같은 지번에 K-apt 단지가 둘 이상: 이름이 가까운 쪽
            nm = [c for c in set(codes) if m.norm_name(kapt[c]["name"]) == nk or m.inside(m.norm_name(kapt[c]["name"]), nk) or m.inside(nk, m.norm_name(kapt[c]["name"]))]
            if len(nm) == 1: codes = nm
            else: report["lot_conflicts"].append(f"{gu}|{dong}|{e['name']}: 후보 {len(set(codes))}"); codes = []
        if not codes:
            cand = [c for c, a in kapt.items() if a["gu"] == gu and a["dong"] == dong and c not in used and (m.norm_name(a["name"]) == nk or m.inside(m.norm_name(a["name"]), nk) or m.inside(nk, m.norm_name(a["name"])))]
            codes = cand[:1]; method = "name"
        c = codes[0] if codes else None
        if c: used.add(c)
        pending.append((k, e, c, method if c else "none"))
    for k, e, c, method in pending:
        gu, dong, nk = k; a = kapt.get(c) if c else None
        lots = set(e["lots"]);
        if a and lot_of(a.get("addr"), dong): lots.add(lot_of(a["addr"], dong))
        lot = sorted(lots)[0] if lots else None
        uid = uid_of(m.LAWD[gu], dong, lot or nk, taken); taken.add(uid)
        rec = {"uid": uid, "name": (a or {}).get("name") or e["name"], "aliases": sorted({e["name"]} | ({a["name"]} if a else set())), "gu": gu, "dong": dong, "lots": sorted(lots), "multi_lot": len(lots) > 1,
               "kapt_code": c, "road": (a or {}).get("road", ""), "households": (a or {}).get("households"), "approved": (a or {}).get("approved"), "build_year": e["build"] or None,
               "sources": (["kapt"] if a else []) + ["molit"], "match": method, "boundary": "none"}
        rec.update(pack(e, today)); master.append(rec)
        report["multi_lot"] += len(lots) > 1; report["by_lot" if method == "lot" else "by_name" if method == "name" else "molit_only"] += 1
    for c, a in kapt.items():   # 거래가 없는 K-apt 단지
        if c in used: continue
        lot = lot_of(a.get("addr"), a.get("dong")); uid = uid_of(m.LAWD[a["gu"]], a["dong"], lot or m.norm_name(a["name"]), taken); taken.add(uid)
        master.append({"uid": uid, "name": a["name"], "aliases": [a["name"]], "gu": a["gu"], "dong": a["dong"], "lots": [lot] if lot else [], "multi_lot": False, "kapt_code": c, "road": a.get("road", ""),
                       "households": a.get("households"), "approved": a.get("approved"), "build_year": None, "sources": ["kapt"], "match": "none", "boundary": "none", "sale": {}, "jeonse": {}, "series": {"sale": {}, "jeonse": {}}, "recent": {"sale": {}, "jeonse": {}}})
        report["kapt_only"] += 1
    return master, report

def bldrgst_fill(key, master, kapt, log=print):
    """K-apt 에 없는 실거래 단지를 건축물대장(표제부)으로 보완. 활용신청이 안 되어 있으면 사유만 기록."""
    bjd = {}   # (gu, dong) -> 법정동코드 10자리 (K-apt 단지에서 확보)
    for a in kapt.values():
        if a.get("bjd"): bjd[(a["gu"], a["dong"])] = a["bjd"]
    res = {"filled": 0, "failed": 0, "skipped_no_bjd": 0, "error": ""}
    for r in master:
        if "kapt" in r["sources"] or not r["lots"]: continue
        code = bjd.get((r["gu"], r["dong"]))
        if not code: res["skipped_no_bjd"] += 1; continue
        main, _, sub = r["lots"][0].replace("산", "").partition("-")
        try:
            root = m.call(BLD, {"serviceKey": key, "sigunguCd": code[:5], "bjdongCd": code[5:], "platGbCd": "0", "bun": main.zfill(4), "ji": (sub or "0").zfill(4), "numOfRows": 10, "pageNo": 1})
            items = root.findall(".//item"); apt = [i for i in items if "공동주택" in (i.findtext("mainPurpsCdNm") or "")]
            if apt:
                i = apt[0]; r["households"] = r["households"] or (i.findtext("hhldCnt") or "").strip(); r["approved"] = r["approved"] or (i.findtext("useAprDay") or "").strip(); r["sources"].append("bldrgst"); res["filled"] += 1
            else: res["failed"] += 1
        except m.ApiError as e: res["error"] = str(e)[:200]; res["failed"] += 1; break
    return res

def run_master(key, targets=None, months=60, today=None, cache=None, log=print, on_kapt=None, deadline=None):
    key = urllib.parse.unquote(key.strip()); today = today or date.today(); targets = targets or list(m.LAWD)
    ep = {k: m.find_endpoint(k, key, today) for k in m.EP}
    DEADLINE[0] = deadline; PARTIAL.clear()
    kapt = kapt_collect(key, targets, (cache or {}).get("kapt_cache"), log, max_calls=int(os.environ.get("KAPT_MAX_CALLS", "6000")))
    if on_kapt: on_kapt(kapt)                       # K-apt 조회분은 먼저 저장해 다음 실행에서 이어받는다
    ents, excluded = molit_collect(key, targets, months, today, ep, log)
    master, rep = join(kapt, ents, today)
    rep["bldrgst"] = bldrgst_fill(key, master, kapt, log); rep["cancelled_excluded"] = excluded
    rep.update({"complexes": len(master), "kapt_total": len(kapt), "molit_entities": len(ents), "endpoints": {k: m.EP[k][ep[k]] for k in ep}})
    return {"version": 1, "generatedAt": today.isoformat(), "months": months, "apts": master, "kapt_cache": kapt, "report": rep, "partial": list(PARTIAL)}

def geocode_master(kakao_key, master, cache=None, log=print, limit=None):
    """마스터 단지의 대표 좌표(첫 번째 지번 기준). 이미 변환한 단지(uid)는 cache 에서 재사용한다."""
    import colab_kakao as k
    cache = dict(cache or {}); done = fail = 0
    for r in master:
        if r["uid"] in cache: r["coord"] = cache[r["uid"]]; continue
        if not r["lots"]: fail += 1; continue
        if limit is not None and done >= limit: break
        try:
            d = k.kget(kakao_key, "search/address.json", query=f"서울특별시 {r['gu']} {r['dong']} {r['lots'][0].replace('산', '산 ')}")
            doc = (d.get("documents") or [None])[0]
            if doc: cache[r["uid"]] = r["coord"] = {"lat": float(doc["y"]), "lng": float(doc["x"]), "by": "address"}; done += 1
            else: fail += 1
        except k.KakaoError as e: log("카카오 좌표 오류:", str(e)[:100]); break
        time.sleep(0.03)
    log(f"좌표 신규 {done}건, 실패 {fail}건, 캐시 {len(cache)}건")
    return cache
