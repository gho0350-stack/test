"""자동 수집 진입점. 키는 환경변수(GitHub Secrets 등)로만 받는다. 없는 키의 단계는 건너뛴다.
  DATA_GO_KR_KEY  국토부 실거래 + K-apt        -> out/molit_result.json
  KAKAO_REST_KEY  좌표·주변 인프라             -> out/kakao_neis_result.json
  NEIS_KEY        학원 동 단위 집계(선택)       -> 위 파일의 neis_academy
  MONTHS          실거래 수집 개월 수 (기본 60)
마지막에 build_data.py 로 ../schoolmap/real-data.js 를 갱신한다."""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
import colab_molit as m, colab_kakao as k
load = lambda p: json.load(open(p, encoding="utf8"))
SECRETS = [v for v in (os.environ.get(k) for k in ("DATA_GO_KR_KEY", "KAKAO_REST_KEY", "NEIS_KEY")) if v and len(v) > 8]
def dump(p, d):
    text = json.dumps(d, ensure_ascii=False)
    if any(sec in text or sec.replace("%2B", "+") in text for sec in SECRETS): raise RuntimeError(f"{p}: 인증키가 결과에 포함되어 저장을 중단했습니다")
    open(p, "w", encoding="utf8").write(text)
WARN = []
def prev(p):
    return load(p) if os.path.exists(p) else None
import gzip
def dump_gz(p, d):
    text = json.dumps(d, ensure_ascii=False, separators=(",", ":"))
    if any(sec in text for sec in SECRETS): raise RuntimeError(f"{p}: 인증키가 결과에 포함되어 저장을 중단했습니다")
    with gzip.open(p, "wt", encoding="utf8", compresslevel=9) as f: f.write(text)
def prev_gz(p):
    if not os.path.exists(p): return None
    with gzip.open(p, "rt", encoding="utf8") as f: return json.load(f)

import time as _t
START = _t.time()
ERRORS = []
def step(name, fn):
    """한 단계가 실패해도 다른 단계는 계속 진행한다. 실패 사유는 마지막에 모아서 출력하고 종료 코드로 알린다."""
    try: fn()
    except Exception as e:
        ERRORS.append(f"{name}: {e}"); print(f"!! {name} 실패: {e}", flush=True)

def do_molit():
    print("== 국토부 실거래 + K-apt")
    p = "out/molit_result.json"; old = prev(p)
    new = m.run(os.environ["DATA_GO_KR_KEY"], load("out/sample_apts.json"), months=int(os.environ.get("MONTHS", "60")))
    if old:
        if len(new["trades"]) < 0.8 * len(old["trades"]):   # 실거래 연결이 급감하면 덮어쓰지 않는다
            WARN.append(f"실거래 연결 {len(old['trades'])} -> {len(new['trades'])} 급감: 이전 결과 유지"); return
        carried = [k for k in old.get("kapt", {}) if k not in new["kapt"]]   # K-apt 일시 실패/누락 시 이전 값 유지
        for k in carried: new["kapt"][k] = dict(old["kapt"][k], stale=True)
        if carried: WARN.append(f"K-apt {len(carried)}건은 이번 수집에서 못 받아 이전 값을 유지")
    dump(p, new)

def do_kakao():
    print("== 카카오 좌표·인프라")
    res = k.run_kakao(os.environ["KAKAO_REST_KEY"], load("out/school_addrs.json"), load("out/apts_for_kakao.json"))
    p = "out/kakao_neis_result.json"; old = prev(p)
    if old and (len(res["schools"]) < 0.8 * len(old.get("schools", {})) or len(res["apts"]) < 0.8 * len(old.get("apts", {}))):
        WARN.append("카카오 좌표 결과가 급감해 이전 결과 유지"); return res
    if old:  # 이번에 실패한 항목은 이전 좌표를 유지
        for sec in ("schools", "apts"):
            for kk, vv in old.get(sec, {}).items(): res[sec].setdefault(kk, vv)
        if old.get("neis_academy"): res.setdefault("neis_academy", old["neis_academy"])
    dump(p, res)
    return res

def do_neis():
    print("== NEIS 학원 동 단위")
    T = {"강남구": ["대치동", "도곡동", "개포동", "역삼동"], "서초구": ["반포동", "잠원동"], "송파구": ["잠실동", "신천동", "방이동"], "양천구": ["목동"], "노원구": ["중계동", "상계동"], "강동구": ["고덕동", "상일동"]}
    p = "out/kakao_neis_result.json"; res = load(p) if os.path.exists(p) else {}
    new = k.run_neis(os.environ["NEIS_KEY"], list(T), T)
    if res.get("neis_academy") and sum(v["registered"] for v in new.values()) < 0.8 * sum(v["registered"] for v in res["neis_academy"].values()):
        WARN.append("NEIS 학원 집계가 급감해 이전 결과 유지"); return
    res["neis_academy"] = new; dump(p, res)

def do_probe():
    import probe_apis, urllib.parse
    print("== API 응답 필드 점검"); dump("out/api_samples.json", probe_apis.probe(urllib.parse.unquote(os.environ["DATA_GO_KR_KEY"])))

def do_schools_all():
    import collect_schools_all as c
    print("== NEIS 서울 전체 학교"); rows = c.collect(os.environ["NEIS_KEY"]); dump("out/schools_all.json", rows); print(len(rows), "개교")

SCHEMA = 2   # 2: 단지 통계에 실제 평균(mean)·최근 거래(lastp, lastd)·전용면적별 분포(areas) 추가
GU_ORDER = ["강남구", "서초구", "송파구", "양천구", "노원구", "강동구", "성동구", "광진구", "동작구", "관악구", "종로구", "중구", "용산구",
            "강서구", "영등포구", "구로구", "금천구", "성북구", "강북구", "도봉구", "동대문구", "중랑구", "마포구", "서대문구", "은평구"]

def do_master():
    """25개 구를 구 단위로 나눠 이어서 수집한다. 구마다 out/master_gu/<구>.json.gz 에 저장하고, 신선한(기본 30일) 구는 건너뛴다.
    실행 예산(MASTER_BUDGET_MIN)이 끝나면 멈추고 다음 실행에서 이어간다. 끝나면 전체를 합쳐 master.json.gz 와 앱용 master-data.js 를 만든다."""
    import master as mm, datetime
    print("== 전체 아파트 마스터 (구 단위 이어받기)", flush=True)
    key = os.environ["DATA_GO_KR_KEY"]; months = int(os.environ.get("MONTHS", "60")); fresh_days = int(os.environ.get("MASTER_REFRESH_DAYS", "30"))
    deadline = START + float(os.environ.get("MASTER_BUDGET_MIN", "130")) * 60
    os.makedirs("out/master_gu", exist_ok=True)
    kc = prev_gz("out/kapt_cache.json.gz") or {}
    gc = prev("out/geo_cache.json") or {}
    today = datetime.date.today(); done, todo = [], []
    for gu in GU_ORDER:
        part = prev_gz(f"out/master_gu/{gu}.json.gz")
        if part and part.get("schema", 1) >= SCHEMA and (today - datetime.date.fromisoformat(part["generatedAt"])).days < fresh_days: done.append(gu)   # 스키마가 낮은 옛 결과는 오래된 것으로 보고 다시 수집
        else: todo.append(gu)
    print(f"최신 구 {len(done)}개, 수집할 구 {len(todo)}개: {', '.join(todo) or '-'}", flush=True)
    for gu in todo:
        if _t.time() > deadline - 20 * 60:       # 한 구에 약 20분 걸릴 수 있어, 남은 예산이 그보다 적으면 새 구를 시작하지 않는다
            print(f"{gu}부터는 시간 예산이 부족해 다음 실행으로 넘깁니다", flush=True); break
        res = mm.run_master(key, targets=[gu], months=months, cache={"kapt_cache": kc}, deadline=deadline,
                            on_kapt=lambda kp: (kc.update(kp), dump_gz("out/kapt_cache.json.gz", kc)))
        if res.get("partial"): WARN.append(f"{gu}: 시간 제한으로 실거래 수집이 미완료. 저장하지 않고 다음 실행에서 다시 시도"); break
        old = prev_gz(f"out/master_gu/{gu}.json.gz")
        if old and len(res["apts"]) < 0.8 * len(old["apts"]):
            WARN.append(f"{gu}: 단지 수 {len(old['apts'])} -> {len(res['apts'])} 급감, 이전 결과 유지"); continue
        if os.environ.get("KAKAO_REST_KEY"):
            gc = mm.geocode_master(os.environ["KAKAO_REST_KEY"], res["apts"], gc); dump("out/geo_cache.json", gc)
        for a in res["apts"]: a["asof"] = res["generatedAt"]
        dump_gz(f"out/master_gu/{gu}.json.gz", {"gu": gu, "schema": SCHEMA, "generatedAt": res["generatedAt"], "apts": res["apts"], "report": res["report"]})
        print(f"{gu} 저장: {len(res['apts'])}개 단지", flush=True)
    parts = [p for p in (prev_gz(f"out/master_gu/{g}.json.gz") for g in GU_ORDER) if p]
    if not parts: return
    apts = [a for p in parts for a in p["apts"]]
    rep = {"gus": [p["gu"] for p in parts], "gu_count": len(parts), "complexes": len(apts), "geocoded": sum(1 for a in apts if a.get("coord")), "by_gu": {p["gu"]: len(p["apts"]) for p in parts},
           "pending_gus": [g for g in GU_ORDER if g not in [p["gu"] for p in parts]]}
    dump_gz("out/master.json.gz", {"version": 2, "generatedAt": max(p["generatedAt"] for p in parts), "months": months, "apts": apts, "report": rep})
    print(f"마스터 통합: {len(parts)}/25개 구, {len(apts)}개 단지", flush=True)
    try:
        import build_master_data as bmd; bmd.run()   # 앱이 읽는 schoolmap/master-data.js 갱신(학교군 판정 포함)
    except Exception as e: WARN.append(f"master-data.js 생성 실패: {type(e).__name__}: {str(e)[:100]}")

def do_school_geo():
    import school_geo as sg
    print("== 서울 초·중·고 학교 좌표", flush=True)
    old = prev("out/school_geo.json") or {}
    new = sg.run(os.environ["KAKAO_REST_KEY"], load("out/schools_all.json"), old)
    if len(new) < 0.8 * len(old): WARN.append(f"학교 좌표 {len(old)} -> {len(new)} 급감: 이전 결과 유지"); return
    dump("out/school_geo.json", new)

def do_hinfo():
    import collect_hinfo as ch
    print("== 하이인포 학교목록(교육감배정교/학교장선발교)", flush=True)
    new = ch.run(); old = prev("out/hinfo_schools.json")
    if len(new["schools"]) < 200 or len(new["schools"]) < new["total"] * 0.95:
        WARN.append(f"하이인포 학교 {len(new['schools'])}/{new['total']}곳만 수집됨: 이전 결과 유지"); return
    if old and len(new["schools"]) < 0.9 * len(old["schools"]): WARN.append("하이인포 학교 수 급감: 이전 결과 유지"); return
    dump("out/hinfo_schools.json", new)

def do_reference():
    import collect_reference as cr, build_university as bu
    p = "out/reference.json.gz"; old = prev_gz(p)
    ref = cr.collect_university(os.environ["DATA_GO_KR_KEY"])
    if not ref["univ"] or not ref["major"]:
        WARN.append("대학/학과 API 응답 비어 있음(활용신청·승인 확인): 이전 결과 유지"); return
    if old and len(ref["major"]) < 0.8 * len(old["major"]):
        WARN.append("학과 수 급감: 이전 결과 유지"); return
    try: dump_gz("out/zone_links_seoul.json.gz", cr.collect_zone_links(os.environ["DATA_GO_KR_KEY"]))
    except Exception as e: WARN.append(f"학구도 연계정보 실패: {type(e).__name__}")
    dump_gz(p, ref)
    um, mm = bu.build(ref); bu.write(um, mm); dump("out/university_report.json", bu.report(um, mm))

JOBS = [("DATA_GO_KR_KEY", "API 점검", do_probe), ("NEIS_KEY", "서울 전체 학교", do_schools_all), ("DATA_GO_KR_KEY", "국토부 실거래", do_molit),
        ("KAKAO_REST_KEY", "카카오", do_kakao), ("NEIS_KEY", "NEIS", do_neis)]
if os.environ.get("RUN_REFERENCE") == "1": JOBS.append(("DATA_GO_KR_KEY", "대학·학과 마스터", do_reference))   # 월 1회 수동
JOBS.append(("PUBLIC", "하이인포 학교목록", do_hinfo))   # 키 불필요
JOBS.append(("KAKAO_REST_KEY", "서울 학교 좌표", do_school_geo))   # 캐시로 한 번만 변환, 이후엔 즉시 끝남
if os.environ.get("RUN_ONLY") == "master": JOBS = [("KAKAO_REST_KEY", "서울 학교 좌표", do_school_geo)]
if os.environ.get("RUN_MASTER") == "1" or os.environ.get("RUN_ONLY") == "master": JOBS.append(("DATA_GO_KR_KEY", "전체 아파트 마스터", do_master))   # 무거운 작업: 수동 실행 때만
for key, name, fn in JOBS:
    if key == "PUBLIC" or os.environ.get(key): step(name, fn)
    else: print(f"{key} 없음: {name} 건너뜀")

if os.environ.get("RUN_ONLY") != "master": subprocess.run([sys.executable, "build_data.py"], check=True)   # 마스터 전용 실행은 앱 데이터(real-data.js)를 건드리지 않는다
if os.environ.get("RUN_ONLY") != "master":
    try: import build_school_admission as bsa; bsa.main()   # 하이인포 명단과 대조해 학교 입학 방식 분류 갱신
    except Exception as e: WARN.append(f"학교 입학 방식 갱신 실패: {type(e).__name__}: {str(e)[:100]}")
import quality_report; quality_report.write(ERRORS, WARN)

if ERRORS:
    print("\n실패한 단계:\n - " + "\n - ".join(ERRORS)); sys.exit(1)
