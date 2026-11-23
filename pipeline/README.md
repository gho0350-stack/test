# 어디살지 데이터 파이프라인

공공 API를 수집해 통합하고, 앱이 읽는 `../schoolmap/real-data.js` 를 만듭니다.
앱은 `real-data.js` 에 있는 항목은 실데이터로, 없는 항목은 샘플로 표시하고 화면에 출처 배지(공식 공시 / 샘플)를 붙입니다.

## 현재 상태 (검증 여부)

| 데이터 | 상태 | 비고 |
|---|---|---|
| 학교 기본정보 (12개교) | 실데이터 수집 완료 | NEIS `schoolInfo`, 키 없이 호출 가능 |
| 학원·교습소 (6개 구 단위 등록 건수, 보습 분야 건수) | 실데이터 수집 | NEIS `acaInsTiInfo`. 키 없이는 `pIndex` 가 무시되어 첫 5건만 반환되고, `REG_STTUS_NM`·`ACA_INSTI_SC_NM` 필터도 적용되지 않음을 확인. 폐원 제외·학원/교습소 구분·동 단위 집계는 `NEIS_KEY` 로 전체 목록을 받아야 가능 |
| 매매·전월세 실거래가 (샘플 단지 46곳 중 29곳 연결) | 실데이터 수집 완료 (최근 12개월 통계) | 코랩 노트북 `eodisalji_collect.ipynb` 로 수집. v2 노트북은 월별 추이·개별 거래·지번·단지명 보정 포함 |
| 단지 세대수·준공연도 (K-apt) | 1차 실행에서 주소 오류(폐기된 V3/V4 주소)로 비어 있었음 -> 목록 `AptListService4`, 기본정보 `AptBasisInfoServiceV5` 로 수정 (다음 실행에서 확인) | 준공연도는 실거래 건축년도로 대체 반영 |
| 학교군/통학구역 GIS | 미구현 | 학구도안내서비스 파일 다운로드 후 GeoJSON 변환 필요 |
| 진학 실적 | 샘플 | 공식 통합 API 없음. 출처 등급(공식공시/학교발표/별도집계)별 수집 필요 |
| 학교·단지 좌표, 주변 인프라, 학원 반경 집계 | 실데이터 수집 완료 (학교 12/12, 단지 45/46) | 카카오 로컬 API. 도보 시간은 직선거리 x1.3 / 80m 분 추정값 (경로 API 미연동) |

## API 신청과 키

| 데이터 | 신청 / 문서 | 키 |
|---|---|---|
| NEIS 학교·학원 | https://open.neis.go.kr (정보공개 > 학교기본정보 / 학원교습소정보) | `NEIS_KEY` (선택) |
| 국토부 매매 실거래 | https://www.data.go.kr/data/15126469/openapi.do | `DATA_GO_KR_KEY` (일반 인증키, Decoding) |
| 국토부 전월세 실거래 | https://www.data.go.kr/data/15126474/openapi.do | 동일 |
| K-apt 단지 목록 / 기본정보 | https://www.data.go.kr/data/15057332/openapi.do , https://www.data.go.kr/data/15058453/openapi.do | 동일 |
| 학구도 (통학구역/학교군 SHP) | https://schoolzone.emac.kr (공공데이터 메뉴, 파일 다운로드) | 없음 |
| 학교알리미 공시 | https://www.schoolinfo.go.kr (Open API 메뉴, 항목별 이용조건 확인) | 별도 신청 |
| 지도·지오코딩·도보 경로 | https://developers.kakao.com | 카카오 REST 키 |

공공데이터포털은 활용신청 후 승인(대부분 자동)과 키 동기화에 수 시간이 걸릴 수 있습니다. 개발계정 기본 트래픽(일 10,000건)을 확인하세요.

## 실행 순서

```bash
cd pipeline
python3 collect_neis_schools.py            # 학교 기본정보 -> out/neis_schools.json
python3 collect_neis_academy.py            # 학원·교습소 -> out/academy_<구>.jsonl
DATA_GO_KR_KEY=... python3 collect_molit.py --months 12   # 실거래 -> out/trades_<구>.jsonl, rents_<구>.jsonl
DATA_GO_KR_KEY=... python3 collect_kapt.py                # 단지/세대수/사용승인일 -> out/kapt_<구>.json
python3 -m unittest test_normalize         # 정규화 규칙 테스트
python3 build_data.py                      # -> ../schoolmap/real-data.js
```

## 정규화 규칙 (`normalize.py`)

- 면적대: 59㎡형 = 전용 55~60㎡, 84㎡형 = 80~85㎡, 101㎡형 = 95~105㎡. 화면에 "서비스 기준"으로 명시.
- 가격 범위는 최근 12개월 거래 기준이며 최저·최고와 함께 거래 건수, 최근 거래일을 같이 표시. 건수가 3건 미만이면 경고.
- 전세 판별: 월세가 0이고 보증금이 있으면 전세. 보증금이 있는 월세는 전세로 보지 않음.
- 단지명 매칭: 괄호·공백·"아파트" 접미를 제거해 실거래 단지명과 K-apt 단지명을 연결. 최초 1회 수동 매칭표 검수 권장.

## 주의

- 고등학교는 학교군에 속해도 특정 학교 배정이 확정되지 않습니다 (평준화 추첨, 자율형 선발 등). 화면은 "학교군 해당"으로 표기하고 교육지원청 확인을 안내합니다.
- 진학 실적은 기준(재학생/졸업생, 중복합격, 등록 인원)을 통일하지 않으면 왜곡됩니다. `school_stats.source_tier`, `basis` 를 반드시 채우세요.
- 이용 조건: 일부 API는 상업적 이용 제한이 있을 수 있으므로 서비스 오픈 전 항목별 약관을 확인하세요.
- `schema.sql` 은 서버 DB 설계안입니다. 지금은 JSON 파일로 앱에 전달하며, 서비스 단계에서는 서버 API로 대체합니다.

## 자동 수집 (GitHub Actions)

`.github/workflows/collect-data.yml` 이 매주 월요일 03:00(KST)과 수동 실행(Run workflow)으로 `pipeline/run_all.py` 를 돌려
`schoolmap/real-data.js` 를 갱신하고 변경이 있으면 저장소에 커밋합니다. 키는 코드에 넣지 않고 저장소 설정에만 저장합니다.

1. GitHub 저장소 > Settings > Secrets and variables > Actions > New repository secret 에서 아래 이름으로 등록
   - `DATA_GO_KR_KEY` (공공데이터포털 일반 인증키 Decoding), `KAKAO_REST_KEY` (카카오 REST API 키), `NEIS_KEY` (선택)
2. 워크플로 파일이 기본 브랜치에 있어야 Actions 탭에 나타납니다 (이 브랜치를 기본 브랜치에 병합).
3. Actions > collect-data > Run workflow 로 즉시 실행하거나 일정에 맡깁니다. 없는 키의 단계는 건너뜁니다.

서비스 단계에서는 같은 수집 코드를 서버(스케줄러)로 옮기고, 앱은 서버 API 로 읽는 구조로 바꿉니다.
