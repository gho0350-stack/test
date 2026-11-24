# 진학 실적 입력 가이드 (`data/admissions.csv`)

엑셀 또는 구글 시트로 열어서 채운 뒤 저장(UTF-8 CSV)하면 됩니다. **빈 칸 = 미공개/아직 입력 안 함**이며, 0명이 아닙니다. 실제로 0명인 경우에만 0을 적습니다.

| 열 | 설명 | 허용 값 |
|---|---|---|
| school_id, school_name | 미리 채워져 있음 (수정 금지) | |
| admission_year | 대입 학년도 (2026 = 2026학년도 대입) | 2024, 2025, 2026 |
| graduate_count | 해당 연도 졸업생 수 | 정수 |
| medical_count | 의대 실적 | 정수 또는 빈 칸 |
| sky_count | SKY 실적 (서울대·연세대·고려대) | 정수 또는 빈 칸 |
| inseoul_count | 인서울 실적 | 정수 또는 빈 칸 |
| count_type | 무엇을 센 숫자인가 | `합격건수` / `등록인원` |
| student_scope | 누구를 포함했나 | `재학생만` / `재학생+졸업생` |
| duplicate_included | 중복합격 포함 여부 | `포함` / `제외` / `알수없음` |
| source_type | 출처 종류 | `학교발표` / `공식공시` / `언론` / `기타` |
| source_url | 원문 링크 (http로 시작) | URL |
| verified_status | 검증 상태 | `확인완료` / `미확인` |
| verified_at | 확인한 날짜 | YYYY-MM-DD |
| note | 메모 (정의가 다른 경우 등) | 자유 |

## 꼭 지켜야 할 규칙
1. **의대·SKY·인서울은 서로 겹치는 개념이라 합산하지 않습니다.** (서울대 의대는 의대와 SKY에 모두 해당)
2. 숫자를 하나라도 적으면 `count_type`, `student_scope`, `duplicate_included`, `source_type`, `source_url`, `verified_status`도 반드시 적어야 합니다. 검증기가 거부합니다.
3. `count_type`이 `등록인원`이면 각 숫자는 졸업생 수를 넘을 수 없습니다 (`합격건수`는 중복합격 때문에 넘을 수 있음).
4. 출처가 다른 해의 숫자끼리는 비교하지 않도록 연도별로 따로 기록합니다.

## 먼저 정해야 하는 정의 (현재 코드에는 임의 기준이 없음)
- **인서울**: 어느 대학들을 인서울로 볼지 목록. 정해 주시면 `data/inseoul_universities.csv`로 관리합니다.
- **의대**: 의예과만인지, 치의예·한의예·수의예·약대를 포함할지.
- **SKY**: 본교 3곳 기준, 의대 포함 여부.

## 반영 방법
`python3 pipeline/load_admissions.py` 가 검증한 뒤 `schoolmap/admissions-data.js`를 만듭니다. 검증에 실패하면 어떤 행의 어떤 칸이 문제인지 알려줍니다.

## 대학·학과 마스터와 진학 실적 파일 구조 (추가)

- `university_master.csv`, `major_master.csv`: 공공데이터포털 대학정보(15158665)·학과정보(15158666)에서 자동 생성 (collect-data 의 `reference` 옵션, 월 1회). 분류 플래그(med/dent/kmed/pharm/vet/sky/inseoul)는 `admission_category.csv` 의 서비스 자체 규칙이며 국가 공식 분류가 아님.
- 사람이 관리하는 파일(자동 덮어쓰기 금지): `university_alias.csv`, `admission_sources.csv`, `admissions_raw.csv`, `admissions.csv`, `school_graduates.csv`.
- 필수 필드: 학교코드, 연도, 범주/대학/학과, 수치 종류(합격건수 vs 등록인원), 재학생/졸업생 구분, 중복합격 처리, 발표 단계(수시/정시/최종), 출처 URL, 발표일, 수집일, 검증 상태(unverified/verified).
- 값이 없으면 빈칸(미공개). 0 은 실제 0명일 때만. 검증 완료(verified) 값은 미검증 값으로 덮어쓰지 않음.
- 합격건수나 졸업생 수를 "진학률"로 표시하지 않음. 베리타스알파·내일교육·아파트위키는 이용약관 확인 전까지 수집원으로 쓰지 않음.
