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
def dump(p, d): json.dump(d, open(p, "w", encoding="utf8"), ensure_ascii=False)

ERRORS = []
def step(name, fn):
    """한 단계가 실패해도 다른 단계는 계속 진행한다. 실패 사유는 마지막에 모아서 출력하고 종료 코드로 알린다."""
    try: fn()
    except Exception as e:
        ERRORS.append(f"{name}: {e}"); print(f"!! {name} 실패: {e}", flush=True)

def do_molit():
    print("== 국토부 실거래 + K-apt")
    dump("out/molit_result.json", m.run(os.environ["DATA_GO_KR_KEY"], load("out/sample_apts.json"), months=int(os.environ.get("MONTHS", "60"))))

def do_kakao():
    print("== 카카오 좌표·인프라")
    res = k.run_kakao(os.environ["KAKAO_REST_KEY"], load("out/school_addrs.json"), load("out/apts_for_kakao.json"))
    dump("out/kakao_neis_result.json", res)
    return res

def do_neis():
    print("== NEIS 학원 동 단위")
    T = {"강남구": ["대치동", "도곡동", "개포동", "역삼동"], "서초구": ["반포동", "잠원동"], "송파구": ["잠실동", "신천동", "방이동"], "양천구": ["목동"], "노원구": ["중계동", "상계동"], "강동구": ["고덕동", "상일동"]}
    p = "out/kakao_neis_result.json"; res = load(p) if os.path.exists(p) else {}
    res["neis_academy"] = k.run_neis(os.environ["NEIS_KEY"], list(T), T); dump(p, res)

def do_probe():
    import probe_apis, urllib.parse
    print("== API 응답 필드 점검"); dump("out/api_samples.json", probe_apis.probe(urllib.parse.unquote(os.environ["DATA_GO_KR_KEY"])))

def do_schools_all():
    import collect_schools_all as c
    print("== NEIS 서울 전체 학교"); rows = c.collect(os.environ["NEIS_KEY"]); dump("out/schools_all.json", rows); print(len(rows), "개교")

for key, name, fn in (("DATA_GO_KR_KEY", "API 점검", do_probe), ("NEIS_KEY", "서울 전체 학교", do_schools_all), ("DATA_GO_KR_KEY", "국토부 실거래", do_molit), ("KAKAO_REST_KEY", "카카오", do_kakao), ("NEIS_KEY", "NEIS", do_neis)):
    if os.environ.get(key): step(name, fn)
    else: print(f"{key} 없음: {name} 건너뜀")

subprocess.run([sys.executable, "build_data.py"], check=True)

if ERRORS:
    print("\n실패한 단계:\n - " + "\n - ".join(ERRORS)); sys.exit(1)
