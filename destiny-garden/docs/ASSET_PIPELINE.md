# 3D 에셋 자동화 파이프라인

## 흐름
`assets-manifest.json` (필요한 에셋·고정 ID·목표 크기·폴리곤 예산) → **GitHub Actions `prepare-assets`** → 공급처 공식 API(Poly Haven, ambientCG; CC0만) 다운로드 → 가공(텍스처 webp 리사이즈, GLB 최적화·바닥 정렬·높이 정규화·폴리곤/용량 한도) → `public/assets/**` + `registry.json` + `ATTRIBUTIONS.md` + `assets-report.json` + 로그를 같은 브랜치에 커밋 → 앱이 레지스트리에 준비된 에셋만 로드(없으면 절차적 모델로 자동 대체).

## 사용법
1. `assets-manifest.json` 에 에셋 추가(검색 조건 또는 `{ "type": "polyhaven", "id": "..." }` 로 ID 고정). 카탈로그는 `assets-catalog/*.json`(파이프라인이 매 실행마다 덤프)에서 검색.
2. 변경을 푸시하면 워크플로가 자동 실행(수동 실행도 가능). 결과 커밋이 올라오면 pull.
3. `data/room-layouts.json` 에 방별 배치(asset_id, 좌표, 회전, 충돌 반경) 추가.
4. 상태 확인: `assets-report.json`(준비/실패와 원인), `assets-fetch.log`, `assets-process.log`, `assets-run.log`.

## 로컬 실행
`npm run assets:all` (공급처 접속 가능한 환경) · 처리 코드만: `node scripts/assets/process.mjs`

## 안전장치
- 라이선스 허용 목록(`allowed_licenses`)이 아니면 사용하지 않음. 체크섬(md5) 검증. 실패 시 다음 공급처/후보로 이동 후 원인 기록.
- 모델 용량 한도(기본 6MB)와 폴리곤 예산(`max_triangles`) 초과 시 자동 단순화, 그래도 크면 제외. 20MB 초과 파일은 커밋 전에 삭제.
- 존재하지 않는 API/URL 을 만들어 쓰지 않음(공식 API 응답에서만 URL 사용).

## 미구현(다음 단계)
Blender 헤드리스 자동 모델링(한옥 건축물), Meshy/Tripo AI 생성(유료, 사전 승인 필요), HDRI 환경광, 정원 나무 인스턴싱/LOD, KTX2/Draco 압축.
