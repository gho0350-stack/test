# -*- coding: utf-8 -*-
"""서울 초·중·고 학교 좌표: NEIS 학교 목록(out/schools_all.json)의 도로명 주소를 카카오 로컬 API 로 좌표 변환 -> out/school_geo.json.
이미 변환한 학교는 캐시에서 재사용하고, 주소가 바뀐 경우에만 다시 변환한다."""
import json, os, time
import colab_kakao as k
KINDS = ("초등학교", "중학교", "고등학교")

def run(key, schools, cache=None, log=print, limit=None):
    cache = dict(cache or {}); new = fail = 0
    for s in schools:
        if s.get("SCHUL_KND_SC_NM") not in KINDS: continue
        name, addr = s["SCHUL_NM"].strip(), (s.get("ORG_RDNMA") or "").strip()
        if not addr or name.startswith("(가칭)"): continue
        c = cache.get(name)
        if c and c.get("addr0") == addr: continue
        if limit is not None and new + fail >= limit: break
        try:
            g = k.geocode_school(key, name, addr)
        except k.KakaoError as e: log("학교 좌표 오류:", str(e)[:100]); break
        if g: cache[name] = {"lat": g["y"], "lng": g["x"], "by": g["by"], "kind": s["SCHUL_KND_SC_NM"], "addr0": addr}; new += 1
        else: fail += 1
        time.sleep(0.03)
    log(f"학교 좌표 신규 {new}건, 실패 {fail}건, 전체 {len(cache)}건")
    return cache
