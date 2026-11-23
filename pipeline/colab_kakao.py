# -*- coding: utf-8 -*-
"""어디살지: 카카오 로컬 API 로 좌표·주변 인프라 수집 + (선택) NEIS 학원 전체 목록으로 동 단위 집계.
외부 패키지 불필요. run_kakao(KAKAO_KEY, SCHOOLS, APTS) / run_neis(NEIS_KEY) 를 호출."""
import json, math, time, urllib.parse, urllib.request
from collections import Counter

KAKAO = "https://dapi.kakao.com/v2/local/"
CATS = {"SW8": ("지하철역", 1500), "HP8": ("병원", 1000), "PM9": ("약국", 1000), "MT1": ("대형마트", 1500), "PS3": ("어린이집·유치원", 800), "CT1": ("문화시설", 2000)}
HINT = {401: "카카오 REST API 키가 올바르지 않아요. 앱 키 메뉴의 'REST API 키'를 복사했는지 확인하세요.",
        403: "카카오맵(로컬) 사용 설정이 꺼져 있을 수 있어요. 카카오 개발자 콘솔 > 내 애플리케이션 > 제품 설정 에서 카카오맵(로컬)을 활성화하세요.",
        429: "호출 한도를 넘었어요. 잠시 후 다시 실행하세요."}

class KakaoError(Exception): pass
def kget(key, path, **q):
    req = urllib.request.Request(KAKAO + path + "?" + urllib.parse.urlencode(q), headers={"Authorization": "KakaoAK " + key.strip()})
    for t in range(3):
        try: return json.load(urllib.request.urlopen(req, timeout=30))
        except urllib.error.HTTPError as e:
            if e.code in (401, 403): raise KakaoError(f"[{e.code}] {HINT[e.code]} (응답: {e.read()[:200].decode('utf8','ignore')})")
            if e.code == 429: time.sleep(2 + t); continue
            raise KakaoError(f"[{e.code}] {e.read()[:200].decode('utf8','ignore')}")
        except Exception as e: time.sleep(1 + t); last = e
    raise KakaoError(f"요청 실패: {last}")

def hav(x1, y1, x2, y2):
    r = 6371000; p1, p2 = math.radians(y1), math.radians(y2); dp = p2 - p1; dl = math.radians(x2 - x1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))

def geocode_school(key, name, addr):
    d = kget(key, "search/address.json", query=addr)
    if d["documents"]: x = d["documents"][0]; return {"x": float(x["x"]), "y": float(x["y"]), "addr": addr, "by": "address"}
    d = kget(key, "search/keyword.json", query=name)
    if d["documents"]: x = d["documents"][0]; return {"x": float(x["x"]), "y": float(x["y"]), "addr": x.get("road_address_name") or x["address_name"], "by": "keyword"}
    return None

def geocode_apt(key, gu, name, dong):
    for q in (f"서울 {gu} {dong} {name}", f"서울 {gu} {name}", f"서울 {gu} {name}아파트"):
        d = kget(key, "search/keyword.json", query=q, size=5)
        for x in d["documents"]:
            if gu in x["address_name"] and (x.get("category_group_code") in ("", None, "AT4") or "아파트" in x.get("category_name", "") or "주거" in x.get("category_name", "")):
                return {"x": float(x["x"]), "y": float(x["y"]), "addr": x.get("road_address_name") or x["address_name"], "place": x["place_name"], "by": "keyword"}
    return None

def infra(key, x, y):
    out = {}
    for code, (label, rad) in CATS.items():
        d = kget(key, "search/category.json", category_group_code=code, x=x, y=y, radius=rad, sort="distance", size=5)
        out[code] = {"label": label, "radius": rad, "total": d["meta"]["total_count"], "items": [{"name": i["place_name"], "dist": int(i["distance"]), "x": float(i["x"]), "y": float(i["y"])} for i in d["documents"]]}
    d = kget(key, "search/keyword.json", query="공원", x=x, y=y, radius=1500, sort="distance", size=5)
    out["PARK"] = {"label": "공원", "radius": 1500, "total": d["meta"]["total_count"], "items": [{"name": i["place_name"], "dist": int(i["distance"]), "x": float(i["x"]), "y": float(i["y"])} for i in d["documents"]]}
    acad = {}
    for r in (500, 1000, 2000):
        acad[str(r)] = kget(key, "search/category.json", category_group_code="AC5", x=x, y=y, radius=r, size=1)["meta"]["total_count"]
    out["AC5"] = {"label": "학원", "counts": acad}
    return out

def run_kakao(key, schools, apts, log=print):
    """schools: {id:{name,addr}}  apts: [{id,gu,name,dong?,school}]"""
    res = {"schools": {}, "apts": {}, "failed": []}
    for sid, s in schools.items():
        g = geocode_school(key, s["name"], s["addr"])
        if not g: res["failed"].append("학교:" + sid); log("좌표 실패", s["name"]); continue
        g["infra"] = infra(key, g["x"], g["y"]); res["schools"][sid] = g; log("학교 완료", s["name"], "학원(1km)", g["infra"]["AC5"]["counts"]["1000"])
    for a in apts:
        g = geocode_apt(key, a["gu"], a["name"], a.get("dong", ""))
        if not g: res["failed"].append("단지:" + a["id"]); continue
        sc = res["schools"].get(a["school"])
        if sc:
            m = hav(g["x"], g["y"], sc["x"], sc["y"]); g["straight_m"] = int(m); g["walk_min_est"] = max(1, round(m * 1.3 / 80))
        res["apts"][a["id"]] = g
    log(f"단지 좌표 {len(res['apts'])}/{len(apts)} 완료")
    return res

# ---------- NEIS (선택): 키가 있으면 학원 전체 목록 -> 동 단위 집계 ----------
import re
def run_neis(key, gus, targets, log=print):
    out = {}
    for gu in gus:
        rows, page = [], 1
        while True:
            q = urllib.parse.urlencode({"KEY": key, "Type": "json", "pIndex": page, "pSize": 1000, "ATPT_OFCDC_SC_CODE": "B10", "ADMST_ZONE_NM": gu})
            d = json.load(urllib.request.urlopen("https://open.neis.go.kr/hub/acaInsTiInfo?" + q, timeout=60))
            if "acaInsTiInfo" not in d: break
            got = d["acaInsTiInfo"][1]["row"]; rows += got
            if len(got) < 1000: break
            page += 1
        op = [r for r in rows if r.get("REG_STTUS_NM") == "개원"]
        dongs = {}
        for r in op:
            m = re.search(r"\(([가-힣0-9]+동)", r.get("FA_RDNDA") or "")
            if m and m.group(1) in targets.get(gu, []):
                x = dongs.setdefault(m.group(1), {"total": 0, "boseup": 0, "hakwon": 0, "gyoseupso": 0, "capacity": 0})
                x["total"] += 1; x["boseup"] += r.get("REALM_SC_NM") == "입시.검정 및 보습"
                x["hakwon" if r["ACA_INSTI_SC_NM"] == "학원" else "gyoseupso"] += 1; x["capacity"] += int(r.get("TOFOR_SMTOT") or 0)
        out[gu] = {"registered": len(rows), "open": len(op), "dongs": dongs}; log(gu, "학원", len(rows), "건 중 개원", len(op))
    return out
