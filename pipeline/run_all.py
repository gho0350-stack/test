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

if os.environ.get("DATA_GO_KR_KEY"):
    print("== 국토부 실거래 + K-apt")
    dump("out/molit_result.json", m.run(os.environ["DATA_GO_KR_KEY"], load("out/sample_apts.json"), months=int(os.environ.get("MONTHS", "60"))))
else: print("DATA_GO_KR_KEY 없음: 실거래 수집 건너뜀")

if os.environ.get("KAKAO_REST_KEY"):
    print("== 카카오 좌표·인프라")
    res = k.run_kakao(os.environ["KAKAO_REST_KEY"], load("out/school_addrs.json"), load("out/apts_for_kakao.json"))
    if os.environ.get("NEIS_KEY"):
        T = {"강남구": ["대치동", "도곡동", "개포동", "역삼동"], "서초구": ["반포동", "잠원동"], "송파구": ["잠실동", "신천동", "방이동"], "양천구": ["목동"], "노원구": ["중계동", "상계동"], "강동구": ["고덕동", "상일동"]}
        res["neis_academy"] = k.run_neis(os.environ["NEIS_KEY"], list(T), T)
    dump("out/kakao_neis_result.json", res)
else: print("KAKAO_REST_KEY 없음: 카카오 수집 건너뜀")

subprocess.run([sys.executable, "build_data.py"], check=True)
