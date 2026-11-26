# 어디살지 데이터 업데이트 가이드

> 한 줄 요약: 대부분은 GitHub Actions 가 알아서 갱신하고, 사람이 하는 일은 (1) 진학 실적 승인, (2) 연 1회 학구도·입학전형 자료 교체, (3) 키·약관 점검뿐입니다.

## 1. 자동으로 갱신되는 것 (사람이 할 일 없음)

| 데이터 | 워크플로 | 주기 | 확인 위치 |
|---|---|---|---|
| 서울 25개 구 아파트 마스터(단지·실거래 통계·좌표·초중 통학구역) | collect-master | 매일 02:30(KST). 30일 안에 받은 구는 건너뛰고 오래된 구만 갱신 | `pipeline/out/master.json.gz` 의 `report.gu_count`(25/25), `pending_gus` |
| 서울 초·중·고 학교 좌표 | collect-master | 변경이 있을 때만 | `pipeline/out/school_geo.json` |
| 학교 기본정보·학원·샘플 단지 실거래·K-apt | collect-data | 매주 월요일 03:00 | `pipeline/out/quality_report.md` |
| 학교 입학 방식(교육감배정/학교장선발) 대조 | collect-data | 매주 월요일 | `data/school_admission.csv` 의 `verify_status` ("불일치"가 나오면 확인) |
| 사이트 배포 | deploy-pages | 위 워크플로가 끝나면 자동 | https://gho0350-stack.github.io/test/ |

## 2. 사람이 가끔 눌러야 하는 것

| 작업 | 방법 | 주기 |
|---|---|---|
| 대학·학과 마스터 갱신 | Actions → collect-data → Run workflow → `reference` 체크 | 월 1회 |
| 진학 실적 후보 수집 | Actions → collect-admissions → Run workflow (`force` 체크하면 시즌 무관) | 자동(매주 화요일, 비시즌은 월 1회). 급할 때만 수동 |
| 진학 실적 승인 | 아래 3번 | 후보가 생길 때 |
| 실패한 워크플로 재실행 | 해당 실행 화면 → Re-run all jobs. 로그의 "실패한 단계"를 개발 도우미에게 전달 | 필요 시 |

## 3. 진학 실적 승인 방법
1. `pipeline/out/admissions_review.html` 을 내려받아 브라우저로 엽니다(학교·학년도·지표·값·기준·원문 근거·원문 링크가 한 화면).
2. 각 행의 결정(승인/반려)을 고르고 "결정 CSV 내려받기" → 받은 `admissions_decisions.csv` 를 `data/` 에 넣어 커밋하거나 개발 도우미에게 전달합니다.
3. `python3 pipeline/admissions_build.py --apply` (또는 개발 도우미에게 요청)로 반영 → `data/admissions.csv`, `schoolmap/admissions-data.js` 갱신 → 사이트 배포.
4. 규칙: 승인해도 `range_check=불명확`(캠퍼스·구성 불명확) 행은 화면 지표에 반영되지 않습니다. 이미지에서 읽은 값은 행의 note 에 있는 원본 이미지와 대조하세요. 미승인 값은 절대 화면에 나오지 않습니다.

## 4. 연 1회(또는 제도가 바뀔 때) 교체하는 자료

| 자료 | 언제 | 방법 |
|---|---|---|
| 고등학교 학교군 경계(SHP) | 학구도가 갱신될 때(공공데이터포털 15159263) | 파일을 내려받아 개발 도우미에게 전달 → `build_zones.py` 로 `zones-data.js` 재생성 |
| 초등 통학구역·중학교 학교군(SHP) | 위와 같이(15159265, 15159264) | `build_edu_zones.py` → `pipeline/data/edu_zones.json.gz` 교체. 이후 collect-master 가 단지를 다시 판정 |
| 통합학교군·입학 방식 규칙 | 매년 서울시교육청 고입 기본계획 발표(보통 봄) | 기본계획(HWP)의 붙임(학교군 표)을 확인해 `data/integrated_school_group.csv` 에 새 학년도 행 추가, `data/school_admission_verified.csv` 갱신 |
| 대입 진학 실적 | 매년 입시 결과(2~3월)·학교 설명회 시즌(10~11월) | collect-admissions 가 후보를 모으고 3번대로 승인 |

## 5. 새 학교를 추가하려면
1. `schoolmap/data.js` 의 학교 목록과 `pipeline/` 입력 파일(`make_inputs.js` 가 만드는 학교 목록)에 학교를 추가합니다(개발 도우미에게 학교명만 전달하면 됩니다).
2. collect-data(학교 기본정보·학원) → collect-master(좌표 기준 단지 판정) 순서로 한 번씩 실행하면 학교군·단지·입학 방식이 자동으로 붙습니다.
3. 진학 실적은 collect-admissions 가 후보를 찾고, 없으면 "샘플/미공개"로 표시됩니다.

## 6. 키·한도·비용 점검
- Secrets: `DATA_GO_KR_KEY`, `KAKAO_REST_KEY`, `NEIS_KEY`, `GEMINI_API_KEY`. Variables: `KAKAO_JS_KEY`, `GEMINI_MODEL`.
- 공공데이터포털 개발계정은 일 10,000건 한도입니다(K-apt 조회는 한 번에 6,000건으로 제한해 보호). 키 사용 기간이 만료되면 로그에 `[31]` 오류가 나옵니다.
- 카카오 지도 키는 도메인(`https://gho0350-stack.github.io`)에 묶여 있습니다. 도메인을 바꾸면 카카오 개발자 콘솔에 새 도메인을 등록해야 합니다.
- Gemini 사용량은 `pipeline/out/api_usage.json` 에 날짜별 호출 수·토큰으로 쌓입니다. 하루 호출 한도는 `AI_MAX_CALLS`(기본 40)입니다. 모델 이름이 바뀌어 호출이 실패하면 gemini-models 워크플로로 현재 모델 목록을 확인해 `GEMINI_MODEL` 변수를 고치세요.

## 7. 문제가 생겼을 때
| 증상 | 확인 | 조치 |
|---|---|---|
| 사이트에 새 데이터가 안 보임 | deploy-pages 가 성공했는지, 브라우저 강력 새로고침(Ctrl+Shift+R) | deploy-pages 수동 실행 |
| collect-master 실패 | 실행 로그의 "실패한 단계". 커밋 단계 실패면 로컬 변경 충돌 | 개발 도우미에게 로그 전달 |
| 단지가 일부 지역만 있음 | `master.json.gz` 의 `pending_gus` | collect-master 를 한 번 더 실행(구 단위로 이어받음) |
| 진학 실적이 샘플로 보임 | 그 학교의 승인된 행이 없다는 뜻 | 3번 승인 절차 또는 후보 수집 대기 |
| 학교 분류 "불일치" | `data/school_admission.csv` | 하이인포·기본계획 원문을 확인해 `school_admission_verified.csv` 수정 |

## 8. 아직 수동이거나 미완료인 것
- 단지 필지 영역(Polygon): 브이월드 키가 필요해 보류.
- 학교 범위: 지금은 12개교. 서울 일반고 212교·자사고 15교로 넓히는 작업은 진학 실적 자동 수집이 안정된 뒤.
- 인서울·SKY 합계: 원문이 캠퍼스·구성을 밝히는 자료만 반영(불명확한 값은 보류).
- 회원가입·쪽지·커뮤니티: 브라우저 저장 방식의 체험용. 실서비스 전환은 서버가 필요.
