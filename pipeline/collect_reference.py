# -*- coding: utf-8 -*-
"""참조 데이터 수집 (공공데이터포털, 같은 인증키):
 - 대학 및 전문대학정보  apis.data.go.kr/B340014/SchoolInfoService/getSchoolInfo       (한국대학교육협의회)
 - 대학별 학과정보      apis.data.go.kr/B340014/SchoolMajorInfoService/getSchoolMajorInfo
 - 학교학구도연계정보 표준데이터  api.data.go.kr/openapi/tn_pubr_public_schul_atndskl_zn_drw_lnkinfo_api
각 API 는 활용신청이 필요하다. 응답 필드는 페이지 명세 기준이며 실서버 응답은 처음 실행 때 확인한다(미확인 값은 리포트에 남김)."""
import json, urllib.error, urllib.parse, urllib.request
import colab_molit as m

BASE_B34 = "https://apis.data.go.kr/B340014/"
UNIV = BASE_B34 + "SchoolInfoService/getSchoolInfo"
MAJOR = BASE_B34 + "SchoolMajorInfoService/getSchoolMajorInfo"
ZONELINK = "https://api.odcloud.kr/api/15159266/v1/uddi:0765351b-d4d6-4ca3-85fa-e4e01dbb7963"   # 학교학구도연계정보 20260920 (odcloud)

def pages(url, key, extra=None, rows=1000, limit_pages=400, log=print):
    out, page = [], 1
    while page <= limit_pages:
        q = {"serviceKey": key, "pageNo": page, "numOfRows": rows, "type": "json", "_type": "json"}; q.update(extra or {})
        h, body = m.kcall(url, q); items = m.kitems(body)
        out += items
        total = int(str((body or {}).get("totalCount") or 0) or 0)
        if len(items) < rows or (total and len(out) >= total): break
        page += 1
    return out

def _first_nonempty(url, key, log, label):
    """조사연도(svyYr) 파라미터가 필요할 수 있어 연도 없이 -> 최근 연도 순으로 시도한다. 빈 응답이면 원본 앞부분을 로그에 남긴다."""
    for extra in ({}, *({"svyYr": y} for y in (2025, 2024, 2023))):
        try: rows = pages(url, key, extra)
        except m.ApiError as e: log(label, "호출 실패", extra, str(e)[:100]); continue
        if rows: log(label, len(rows), "건", extra or "(기본)"); return rows
        log(label, "0건", extra or "(기본)")
    try:
        q = {"serviceKey": key, "pageNo": 1, "numOfRows": 3, "type": "json"}
        raw = urllib.request.urlopen(url + "?" + urllib.parse.urlencode(q), timeout=60).read()[:300]
        log(label, "원본 응답 앞부분:", raw.decode("utf8", "replace").replace(key, "***"))
    except Exception as e: log(label, "원본 확인 실패", type(e).__name__)
    return []

def collect_university(key, log=print):
    UK = ("schlId", "schlNm", "schlKndNm", "schlDivNm", "schlEstbDivNm", "psbsDivNm", "pbnfAreaNm", "postNoAdrs", "schlUrlAdrs", "svyYr")
    MK = ("kediMjrId", "schlNm", "schlKndNm", "clgNm", "korMjrNm", "stdClftMjrId", "mjrAreaNm", "mjrAreaSignguNm", "pbnfDgriCrseDivNm", "schlMjrStatNm", "schlMjrCharNm", "dghtDivNm", "lsnTrmNm", "onsfSrsClftNm", "eschlPscpNum", "svyYr")
    univ = _first_nonempty(UNIV, key, log, "대학"); major = _first_nonempty(MAJOR, key, log, "학과")   # 용량 절감: 쓰는 필드만 저장
    return {"univ": [{k: u.get(k) for k in UK} for u in univ], "major": [{k: x.get(k) for k in MK} for x in major]}

def collect_zone_links(key, log=print):
    """odcloud 형식: ?page=&perPage=&serviceKey= -> {data:[...], totalCount}. (kcall 은 data.go.kr 표준 형식 전용이라 직접 호출) 서울 행만 남긴다."""
    out, page = [], 1
    while page <= 100:
        q = urllib.parse.urlencode({"serviceKey": key, "page": page, "perPage": 1000, "returnType": "JSON"})
        try: raw = urllib.request.urlopen(ZONELINK + "?" + q, timeout=60).read()
        except urllib.error.HTTPError as e: raw = e.read()
        try: d = json.loads(raw)
        except ValueError: log("학구도 연계정보 응답 형식 오류:", raw[:150].decode("utf8", "replace").replace(key, "***")); break
        rows = d.get("data") or []
        if page == 1:
            log("학구도 연계정보 totalCount", d.get("totalCount"), "첫 행", json.dumps(rows[0], ensure_ascii=False)[:300] if rows else {k: v for k, v in d.items() if k != "data"})
        out += rows
        total = int(d.get("totalCount") or 0)
        if not rows or (total and len(out) >= total): break
        page += 1
    log("학구도 연계정보 전국", len(out))
    return [r for r in out if "서울" in json.dumps(r, ensure_ascii=False)]
