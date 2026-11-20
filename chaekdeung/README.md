# 책등

책을 읽다가 마음에 남은 한 줄을 남기면, 같은 시간에 쉬는 낯선 독자에게 불빛으로 도착하는 조용한 독서 서비스입니다.

## 구조

| 경로 | 역할 |
|---|---|
| `public/index.html` | 화면 전체 (한 파일). 서버가 없으면 시뮬레이션 데모로 동작합니다. |
| `src/worker.js` | Cloudflare Worker. `/api/*` 와 정적 파일을 함께 제공합니다. |
| `schema.sql` | D1(SQLite) 테이블 정의 |
| `test/books.test.mjs` | 도서 검색 응답 정리와 입력 필터 테스트 |

### 문장이 전달되는 방식
1. 독자 A가 문장을 보내면 서버에 쌓입니다. (A가 접속해 있지 않아도 됩니다.)
2. 독자 B의 읽기 시간이 끝나는 순간 서버가 문장 하나를 무작위로 골라 B에게 줍니다.
3. 전달이 적게 된 문장을 먼저 고르고, 한 문장은 최대 3명에게 갑니다.
4. 자기 문장, 이미 받은 문장, 신고 2회 이상 쌓인 문장은 제외됩니다.
5. 줄 문장이 없으면 화면에 "예시 문장"이라고 표시하며 저작권이 만료된 작품의 구절을 보여 줍니다.

### 개인정보와 남용 방지
- 로그인이 없습니다. 브라우저가 만든 무작위 기기 ID만 씁니다.
- IP는 해시로만 보관하고, 하루 사용 횟수 제한에만 씁니다. (보내기 기기당 3회, IP당 12회 등)
- 문장 1줄은 100자, 받는 분께 한 줄은 40자까지. 링크와 연락처 패턴은 서버에서도 막습니다.
- 받은 문장만 신고할 수 있습니다.

## 로컬에서 실행

```bash
npm install
npm run db:init:local
npm run dev
```

http://localhost:8787 에서 열립니다. 브라우저 두 개(또는 시크릿 창)로 열어 한쪽에서 문장을 보내고 다른 쪽에서 읽기를 끝내 보세요.

테스트:

```bash
npm test
```

## 배포 (Cloudflare)

```bash
npx wrangler login
npx wrangler d1 create chaekdeung
```

출력된 `database_id`를 `wrangler.toml`에 넣고:

```bash
npm run db:init
npx wrangler secret put KAKAO_REST_API_KEY
npx wrangler secret put IP_SALT
npm run deploy
```

- `KAKAO_REST_API_KEY`: Kakao Developers에서 앱을 만들고 받은 REST API 키. 도서 검색은 카카오를 먼저 쓰고, 실패하면 네이버로 넘어갑니다.
- 네이버를 쓰려면 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`도 같은 방식으로 등록합니다. (둘 중 하나만 있어도 됩니다.)
- `IP_SALT`: 아무 긴 무작위 문자열. IP 해시에 섞여 들어갑니다.
- 키가 하나도 없으면 도서 검색은 Google Books, 그것도 안 되면 샘플 목록으로 대체됩니다.

각 API의 이용약관(출처 표기, 하루 호출 한도)은 배포 전에 확인하세요.

## 운영할 때

신고로 숨겨진 문장 확인:

```bash
npx wrangler d1 execute chaekdeung --remote --command "SELECT id, quote, book, reports FROM lights WHERE hidden = 1"
```

문장을 완전히 지우려면:

```bash
npx wrangler d1 execute chaekdeung --remote --command "DELETE FROM lights WHERE id = 123"
```

## 아직 하지 않은 것
- 사운드(빗소리, 바람소리 등)
- 공유 이미지 만들기
- 저작권 침해 신고 접수 창구와 이용약관 문서
- 관리자 화면 (지금은 SQL로 처리)
