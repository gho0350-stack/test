# 틈틈 (샘플)
온라인 부업 모음 웹 샘플. 빌드 도구 없이 정적 파일로 동작합니다.

- 실행: `cd web && python3 -m http.server 8000` → http://localhost:8000
- 데이터: `data/gigs.js` (부업 추가/수정은 여기만)
- 앱 전환: `js/platform.js` 의 storage/openLink/track 만 교체 (Capacitor 권장)
- Meta 광고: `index.html` 의 Pixel 주석 해제 + ID 교체. 이벤트: PageView, SelectSituation, ViewGig, SaveGig, OutboundClick
