# 운명의 정원 (Destiny Garden)

사주 × 3D 가상공간 탐험 모바일 웹 서비스 MVP. 작은 정원 하나(건물 4·NPC 4)에서 사주·재물운·궁합·타로·전생 콘텐츠를 탐험하고, NPC에게 질문(질문권)하거나 심층 리포트를 구매합니다.

## 실행
```bash
cd destiny-garden
npm install
npm run dev            # http://localhost:3000  (AI/결제 키 없이도 오프라인 규칙·가상결제로 전체 플로우 체험 가능)
npm test               # 사주 엔진 + 서버 로직 단위/통합 테스트 (23개)
npm run build && DG_STAGING=1 DATA_DIR=$PWD/.data-test npm start -- -p 3100 &
BASE=http://localhost:3100 node scripts/e2e.cjs   # 실제 Chromium E2E (26개 검증, 스크린샷 /tmp/shots)
```
환경변수는 `.env.example` 참고. 운영(`NODE_ENV=production`, `DG_STAGING` 미설정)에서는 `AUTH_SECRET`·`OPENAI_API_KEY`가 없으면 상담이 차단되고(질문권 차감 없음), 가상 결제는 비활성화됩니다.

## 조작
모바일: 가상 조이스틱 / 바닥 터치 / 건물·NPC 터치. PC: WASD·방향키 / 클릭 이동 / `E`·Enter 로 근처 건물·NPC 상호작용.

문서: `docs/PLAN.md`(구조·계획·남은 작업) · `docs/SAJU_STANDARDS.md`(계산 기준) · `supabase/migrations/0001_init.sql`(DB/RLS)
