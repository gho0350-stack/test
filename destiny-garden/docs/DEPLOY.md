# 배포 가이드 (Vercel + Supabase)

- Vercel 프로젝트: Root Directory = `destiny-garden`, Framework = Next.js
- 필수 환경변수: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `AUTH_SECRET`
- 스테이징(가상 결제·오프라인 AI 허용): `DG_STAGING=1`
- 운영 전환: `DG_STAGING` 제거, `OPENAI_API_KEY`, `OPENAI_MODEL`, `TOSS_SECRET_KEY`, `NEXT_PUBLIC_TOSS_CLIENT_KEY` 추가
- DB 스키마: `supabase/migrations/0001_init.sql` 을 Supabase SQL Editor 에서 실행
