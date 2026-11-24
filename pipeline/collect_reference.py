# -*- coding: utf-8 -*-
"""참조 데이터 수집 (공공데이터포털, 같은 인증키):
 - 대학 및 전문대학정보  apis.data.go.kr/B340014/SchoolInfoService/getSchoolInfo       (한국대학교육협의회)
 - 대학별 학과정보      apis.data.go.kr/B340014/SchoolMajorInfoService/getSchoolMajorInfo
 - 학교학구도연계정보 표준데이터  api.data.go.kr/openapi/tn_pubr_public_schul_atndskl_zn_drw_lnkinfo_api
각 API 는 활용신청이 필요하다. 응답 필드는 페이지 명세 기준이며 실서버 응답은 처음 실행 때 확인한다(미확인 값은 리포트에 남김)."""
import json, urllib.parse, urllib.request
import colab_molit as m

BASE_B34 = "https://apis.data.go.kr/B340014/"
UNIV = BASE_B34 + "SchoolInfoService/getSchoolInfo"
MAJOR = BASE_B34 + "SchoolMajorInfoService/getSchoolMajorInfo"
ZONELINK = "https://api.data.go.kr/openapi/tn_pubr_public_schul_atndskl_zn_drw_lnkinfo_api"

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

def collect_university(key, log=print):
    univ = pages(UNIV, key); log("대학", len(univ))
    major = pages(MAJOR, key); log("학과", len(major))
    return {"univ": univ, "major": major}

def collect_zone_links(key, log=print):
    rows = pages(ZONELINK, key); log("학구도 연계정보", len(rows))
    return [r for r in rows if "서울" in json.dumps(r, ensure_ascii=False)]
