# 운명의 정원 — 프로젝트 구조와 개발 계획

## 서비스 구조 (v2: 발견 = 탐험, 해석 = 현자)
| 경험 | 역할 | 구현 |
|---|---|---|
| 탐험 | 새로운 운명 발견 | 5개 방(서고·재물의 방·인연의 정자·시간의 방·현자의 집)+타로 텐트, 방마다 서랍·금고·편지함 등 오브젝트(`data/explore_objects.json`) |
| 수집 | 나의 운명 기록 | 사주 계산 결과로 개인화 생성되는 카드(`src/lib/cards.ts`, 20종+관계 카드+상담 카드), 카테고리 도감, 운명 연대기 |
| 상담 | 발견한 운명에 대해 질문 | 현자의 집에서만 상담, 모은 카드(최대 3장)를 골라 질문, 상담 후 새 카드 + 다음 탐험 힌트 |

- 카드는 **이미 계산된 사주 데이터**를 상징적으로 풀어낸 결정론적 콘텐츠(AI 비사용). 상담 카드만 AI/규칙 답변에서 생성.
- 해금: 재물 카드 3장 → 황금 열쇠, 인연 카드 3장 → 비밀 정자의 문, 카드 6장 → 봉인된 책(전생). 오늘의 촛불은 매일 새 카드.
- 정원의 NPC는 안내만 하고 상담은 현자의 집으로 안내. 하단 ‘상담’ 버튼은 현자의 집으로 자동 이동.


## 구조
```
destiny-garden/
├─ data/                   명리·게임 데이터(JSON, 출처·검토상태 포함). scripts/gen-data.ts 로 해석 데이터 생성
├─ docs/                   PLAN.md, SAJU_STANDARDS.md
├─ scripts/                gen-data.ts · e2e.cjs(브라우저 E2E) · snap.cjs(스크린샷) · verify-kasi.ts
├─ supabase/migrations/    0001_init.sql (28개 테이블 + RLS + 원자적 질문권 차감 함수)
├─ tests/                  saju.test.ts(엔진) · game.test.ts(서버 로직·결제·AI 목 서버)
└─ src/
   ├─ app/                 Next.js App Router: / (입장) /create (캐릭터) /garden (게임) /pay/* , api/*
   ├─ components/game/     Garden3D(R3F 장면) · Character(아바타) · HUD · Preview3D
   ├─ components/panels/   서고·신전·정자·타로·NPC 상담·도감·가방·상점·설정 패널
   └─ lib/
      ├─ saju/             tables.ts · engine.ts(결정론적 계산) · kasi.ts
      ├─ rules.ts, compat.ts, tarot.ts   규칙 매칭 · 궁합 · 타로
      ├─ server/           db.ts · auth.ts · game.ts(서비스) · ai.ts · payments.ts
      └─ client/           store(zustand) · api
```

## 데이터 흐름
입력 → **사주 엔진(계산)** → 차트 저장(`saju_charts`) → 규칙 DB 매칭 → (OpenAI | 오프라인 규칙) **해석만** 생성.
게임 진행 데이터(퀘스트·위치·코인)와 사주 원본은 별도 컬렉션. 질문권(유료)과 코인(게임)은 별도 관리.

## 결제·질문권 원칙
서버가 주문 금액 결정 → 승인 후에만 지급 → `credit_ledger.ref` 유니크로 멱등 → AI 실패 시 선차감분 자동 복구 → 환불 시 미사용분 회수.

## 단계별 진행 (1~5주차 범위 구현 현황)
| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | Next.js + 디자인 시스템 | 완료 |
| 2~5 | 3D 정원·캐릭터 이동·건물/NPC 배치·상호작용 | 완료 (프리미티브 로우폴리, GLB 교체 지점 `Character.tsx`) |
| 6 | 회원가입·출생 정보 | 완료 (자체 이메일 인증; Supabase Auth 이관 필요) |
| 7~8 | 사주 엔진·운명 카드 60종 | 완료 (KASI/만세력 대조 미완) |
| 9 | NPC AI 상담 | 완료 (OpenAI Responses API, 목 서버로 검증. 실키 미검증) |
| 10~11 | 퀘스트 10개·타로 78장 | 완료 |
| 12 | 질문권·리포트 결제 | 테스트(mock) 결제 검증 완료, 토스 실결제 미검증 |
| 13 | 모바일 최적화·배포 | 기본 최적화(dpr 제한·무그림자). 실기기 성능 측정·배포는 남음 |

## 다음 작업 (우선순위)
1. 명리 전문가 검수(해석 데이터 `pending` → `approved`) 및 만세력 대조
2. Supabase 연결: `db.ts` 의 컬렉션 인터페이스를 Supabase 클라이언트 구현으로 교체 + Auth 이관 + `0001_init.sql` 적용·RLS 검증
3. 토스페이먼츠 키 발급 후 결제위젯 실결제/환불 테스트, 웹훅(가상계좌 등) 추가
4. OpenAI 키 설정 후 프롬프트 품질·비용 튜닝, 사용량 제한(레이트리밋)
5. GLB 캐릭터/건물 에셋 교체(라이선스 확인), 모바일 실기기 FPS 측정
6. 분석(PostHog/GA4), 친구 초대, 아바타 아이템(2차)
