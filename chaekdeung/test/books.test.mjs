import assert from "node:assert/strict";
import { normalizeKakao, normalizeNaver, searchBooks, clean, BLOCK } from "../src/worker.js";

// 카카오 응답 정리
assert.deepEqual(
  normalizeKakao({ documents: [{ title: "어린 왕자", authors: ["앙투안 드 생텍쥐페리"] }, { title: "", authors: [] }] }),
  [{ title: "어린 왕자", authors: "앙투안 드 생텍쥐페리" }]
);

// 네이버 응답 정리 (태그, 엔티티, 저자 구분자 ^)
assert.deepEqual(
  normalizeNaver({ items: [{ title: "<b>데미안</b> &amp; 싱클레어", author: "헤르만 헤세^다른 저자" }] }),
  [{ title: "데미안 & 싱클레어", authors: "헤르만 헤세, 다른 저자" }]
);

// 키가 없으면 null
assert.equal(await searchBooks({}, "어린"), null);

// 카카오 우선, 호출 형식 확인
let called = null;
const kakaoFetch = async (url, opts) => {
  called = { url, auth: opts.headers.Authorization };
  return { ok: true, json: async () => ({ documents: [{ title: "모순", authors: ["양귀자"] }] }) };
};
assert.deepEqual(await searchBooks({ KAKAO_REST_API_KEY: "k" }, "모순", kakaoFetch), [{ title: "모순", authors: "양귀자" }]);
assert.equal(called.auth, "KakaoAK k");
assert.ok(called.url.startsWith("https://dapi.kakao.com/v3/search/book"));

// 카카오가 실패하면 네이버로 넘어감
const seq = [];
const mixedFetch = async (url) => {
  seq.push(new URL(url).host);
  if (url.includes("kakao")) return { ok: false };
  return { ok: true, json: async () => ({ items: [{ title: "아몬드", author: "손원평" }] }) };
};
assert.deepEqual(
  await searchBooks({ KAKAO_REST_API_KEY: "k", NAVER_CLIENT_ID: "i", NAVER_CLIENT_SECRET: "s" }, "아몬드", mixedFetch),
  [{ title: "아몬드", authors: "손원평" }]
);
assert.deepEqual(seq, ["dapi.kakao.com", "openapi.naver.com"]);

// 입력 정리와 연락처 필터
assert.equal(clean("  안녕\n\t하세요 <b> ", 100), "안녕 하세요 b");
assert.ok(BLOCK.test("제 번호는 010-1234-5678"));
assert.ok(BLOCK.test("카톡 주세요"));
assert.ok(!BLOCK.test("가장 중요한 것은 눈에 보이지 않아"));

console.log("books.test.mjs: all passed");

// 관리자 기본 문장: 10개, 길이 제한 안, 연락처 패턴 없음
import { DEFAULT_CURATED } from "../src/worker.js";
assert.equal(DEFAULT_CURATED.length, 10);
for (const s of DEFAULT_CURATED) {
  assert.ok(s.quote.length >= 2 && s.quote.length <= 100, s.quote);
  assert.ok(s.note.length <= 40, s.note);
  assert.ok(s.book && s.author);
  assert.ok(!BLOCK.test(s.quote + " " + s.note));
}
console.log("curated defaults: ok");
