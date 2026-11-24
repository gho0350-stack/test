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
            for k, v in old.get(sec, {}).items(): res[sec].setdefault(k, v)
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

def do_master():
    import master as mm
    print("== 전체 아파트 마스터 (K-apt + 실거래 + 건축물대장)")
    p = "out/master.json.gz"; old = prev_gz(p)
    res = mm.run_master(os.environ["DATA_GO_KR_KEY"], months=int(os.environ.get("MONTHS", "60")), cache=old)
    if old and res["report"]["complexes"] < 0.8 * old["report"]["complexes"]:
        WARN.append(f"마스터 단지 수 {old['report']['complexes']} -> {res['report']['complexes']} 급감: 이전 결과 유지"); return
    if os.environ.get("KAKAO_REST_KEY"):
        gc = prev("out/geo_cache.json") or {}
        gc = mm.geocode_master(os.environ["KAKAO_REST_KEY"], res["apts"], gc); dump("out/geo_cache.json", gc)
        res["report"]["geocoded"] = sum(1 for a in res["apts"] if a.get("coord")); 
    dump_gz(p, res)

def do_reference():
    import collect_reference as cr, build_university as bu
    p = "out/reference.json.gz"; old = prev_gz(p)
    ref = cr.collect_university(os.environ["DATA_GO_KR_KEY"])
    if not ref["univ"] or not ref["major"]:
        WARN.append("대학/학과 API 응답 비어 있음(활용신청·승인 확인): 이전 결과 유지"); return
    if old and len(ref["major"]) < 0.8 * len(old["major"]):
        WARN.append("학과 수 급감: 이전 결과 유지"); return
    dump_gz(p, ref)
    um, mm = bu.build(ref); bu.write(um, mm); dump("out/university_report.json", bu.report(um, mm))

JOBS = [("DATA_GO_KR_KEY", "API 점검", do_probe), ("NEIS_KEY", "서울 전체 학교", do_schools_all), ("DATA_GO_KR_KEY", "국토부 실거래", do_molit),
        ("KAKAO_REST_KEY", "카카오", do_kakao), ("NEIS_KEY", "NEIS", do_neis)]
if os.environ.get("RUN_REFERENCE") == "1": JOBS.append(("DATA_GO_KR_KEY", "대학·학과 마스터", do_reference))   # 월 1회 수동
if os.environ.get("RUN_MASTER") == "1": JOBS.append(("DATA_GO_KR_KEY", "전체 아파트 마스터", do_master))   # 무거운 작업: 수동 실행 때만
for key, name, fn in JOBS:
    if os.environ.get(key): step(name, fn)
    else: print(f"{key} 없음: {name} 건너뜀")

subprocess.run([sys.executable, "build_data.py"], check=True)
import quality_report; quality_report.write(ERRORS, WARN)

if ERRORS:
    print("\n실패한 단계:\n - " + "\n - ".join(ERRORS)); sys.exit(1)
