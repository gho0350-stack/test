import { test } from 'node:test';
import assert from 'node:assert/strict';
import './setup-env';


import { signup } from '../src/lib/server/auth';
import * as G from '../src/lib/server/game';
import { C } from '../src/lib/content';
import { tx } from '../src/lib/server/db';

const RUN = Date.now().toString(36);
const em = (n: string) => `${n}.${RUN}@test.kr`;
const SB = !!process.env.SUPABASE_URL;
const birth = { year: 1995, month: 4, day: 17, calendar: 'solar', hour: 14, minute: 30, gender: 'female', region: '서울' };
let uid = '';
test('데이터 규모', () => {
  const total = Object.values(C.rules).reduce((a, r) => a + r.length, 0);
  assert.ok(total >= 100, `rules ${total}`);
  assert.equal(C.tarotCards.length, 78); assert.equal(C.dayPillars.length, 60); assert.equal(C.destinyCards.length, 60);
  assert.equal(C.pastLives.length, 30); assert.equal(C.heavenlyStems.length, 10); assert.equal(C.earthlyBranches.length, 12); assert.equal(C.quests.length, 10);
  for (const f of [...C.dayPillars, ...C.tarotCards, ...Object.values(C.rules).flat()]) { assert.ok(f.source); assert.equal(f.review_status, 'pending'); }
});

test('가입 → 환영 질문권 2개, 캐릭터 생성 → 퀘스트/코인/운명카드', async () => {
  uid = await signup(em('a'), 'password123', true);
  await assert.rejects(() => signup(em('a'), 'password123', true), /이미 가입/);
  await assert.rejects(() => signup(em('b'), 'password123', false), /동의/);
  let s = await G.getState(uid);
  assert.equal(s.wallet.tickets, 2);
  await assert.rejects(() => G.createCharacter(uid, { nickname: '', avatar: 0, ...birth }), /닉네임/);
  const r = await G.createCharacter(uid, { nickname: '하늘', avatar: 1, ...birth });
  assert.equal(r.state.chart!.pillars.day.name, '무인');
  assert.equal(r.state.wallet.coins, 20);
  assert.equal(r.state.card!.day_pillar, '무인');
  assert.ok(r.ev.completed.some((q: any) => q.id === 'q02'));
});

test('퀘스트 이벤트: 중복 지급 없음, 서버 전용 이벤트 차단', async () => {
  const a = await G.gameEvent(uid, 'visit:library');
  assert.equal(a.completed.length, 1);
  const b = await G.gameEvent(uid, 'visit:library');
  assert.equal(b.completed.length, 0);
  await assert.rejects(() => G.gameEvent(uid, 'first_consult'), /허용되지/);
  await assert.rejects(() => G.gameEvent(uid, 'draw_tarot'), /허용되지/);
});

test('NPC 상담: 질문권 차감·기록·요약·퀘스트, 이어 질문 시 이전 요약 참조', async () => {
  const r = await G.consult(uid, { npcId: 'merchant', question: '나는 사업가로 성공할 수 있을까?' });
  assert.equal(r.state.wallet.tickets, 1);
  assert.equal(r.answer.topic, 'wealth');
  assert.ok(r.answer.core.length > 10 && r.answer.basis.length >= 2 && r.answer.follow_ups.length === 3);
  assert.ok(r.ev.completed.some((q: any) => q.id === 'q10'));
  const r2 = await G.consult(uid, { npcId: 'merchant', question: '올해 재물운은 어떤가요?' });
  assert.match(r2.answer.detail, /이전 상담 기억/);
  const h = await G.consultHistory(uid, 'merchant');
  assert.equal(h.messages.length, 4); assert.equal(h.summaries.length, 2);
  await assert.rejects(() => G.consult(uid, { npcId: 'merchant', question: '또 질문' }), /질문권이 부족/);
  assert.equal((await G.getState(uid)).wallet.tickets, 0);
});

test('AI 실패 시 질문권 복구', async () => {
  const u = await signup(em('c'), 'password123', true);
  await G.createCharacter(u, { nickname: '바다', avatar: 0, ...birth });
  process.env.OPENAI_API_KEY = 'sk-test'; process.env.OPENAI_BASE_URL = 'http://127.0.0.1:1/v1/responses';
  await assert.rejects(() => G.consult(u, { npcId: 'sage', question: '내 사주 전체가 궁금해요' }), /차감되지 않았/);
  delete process.env.OPENAI_API_KEY; delete process.env.OPENAI_BASE_URL;
  assert.equal((await G.getState(u)).wallet.tickets, 2);
});

test('타로: 하루 1회, 새로고침해도 동일, 퀘스트 지급', async () => {
  const a = await G.tarotPick(uid, 10);
  const b = await G.tarotPick(uid, 40);
  assert.equal(a.draw.cardId, b.draw.cardId);
  assert.ok(a.ev.completed.some((q: any) => q.id === 'q09'));
  const info = await G.tarotInfo(uid);
  assert.equal(info.history.length, 1);
  await assert.rejects(() => G.tarotPick(uid, 99), /위치/);
});

test('결제: 주문→승인→질문권 지급, 중복 승인 무시, 금액 위변조 거부', async () => {
  const o = await G.createOrder(uid, 'ticket_10');
  assert.equal(o.amount, 7900);
  await assert.rejects(() => G.confirmOrder(uid, { paymentKey: 'mock_x', orderId: o.orderId, amount: 100 }), /금액/);
  await assert.rejects(() => G.confirmOrder(uid, { paymentKey: 'real_key', orderId: o.orderId, amount: 7900 }), /테스트 결제 키/);
  const c1 = await G.confirmOrder(uid, { paymentKey: 'mock_1', orderId: o.orderId, amount: 7900 });
  assert.equal(c1.state.wallet.tickets, 10);
  const c2 = await G.confirmOrder(uid, { paymentKey: 'mock_1', orderId: o.orderId, amount: 7900 });
  assert.equal(c2.already, true);
  assert.equal((await G.getState(uid)).wallet.tickets, 10);
  // 다른 사용자의 주문 접근 불가
  const other = await signup(em('d'), 'password123', true);
  await assert.rejects(() => G.confirmOrder(other, { paymentKey: 'mock_2', orderId: o.orderId, amount: 7900 }), /주문을 찾을 수 없/);
});

test('환불: 미사용 질문권 회수, 사용 후에는 거부', async () => {
  const s0 = await G.getState(uid); // 10장
  const st = await G.refundOrder(uid, (await G.orderHistory(uid))[0].id);
  assert.equal(st.wallet.tickets, s0.wallet.tickets - 10);
  const o = await G.createOrder(uid, 'ticket_3');
  await G.confirmOrder(uid, { paymentKey: 'mock_3', orderId: o.orderId, amount: 2900 });
  await G.consult(uid, { npcId: 'sage', question: '내 사주에서 가장 특별한 부분은 무엇일까요?' });
  await G.consult(uid, { npcId: 'sage', question: '올해 조심할 점은 무엇인가요?' });
  await G.consult(uid, { npcId: 'sage', question: '지금 이직해도 괜찮을까요?' });
  await assert.rejects(() => G.refundOrder(uid, o.orderId), /이미 사용한 질문권/);
});

test('리포트: 미구매 열람 거부 → 구매 후 열람/캐시, 열람 후 환불 불가, 궁합은 상대 필요', async () => {
  await assert.rejects(() => G.getReport(uid, 'wealth'), /구매 후/);
  const o = await G.createOrder(uid, 'report_wealth');
  await G.confirmOrder(uid, { paymentKey: 'mock_4', orderId: o.orderId, amount: 3900 });
  await assert.rejects(() => G.createOrder(uid, 'report_wealth'), /이미 구매/);
  const r = await G.getReport(uid, 'wealth');
  assert.ok(r.sections.length >= 3);
  assert.deepEqual(await G.getReport(uid, 'wealth'), r);
  await assert.rejects(() => G.refundOrder(uid, o.orderId), /이미 열람/);
  await assert.rejects(() => G.createOrder(uid, 'report_compat'), /상대를 먼저/);
  const st = await G.addRelationship(uid, { name: '민준', relation: '연인', year: 1993, month: 9, day: 2, calendar: 'solar', hourUnknown: true, gender: 'male' });
  const rel = st.relationships[0];
  assert.ok(rel.compat!.score >= 20 && rel.compat!.score <= 98);
  const oc = await G.createOrder(uid, 'report_compat', rel.id);
  await G.confirmOrder(uid, { paymentKey: 'mock_5', orderId: oc.orderId, amount: 3900 });
  const cr = await G.getReport(uid, 'compat', rel.id);
  assert.match(cr.title, /민준/);
});

test('계정 삭제: 개인 데이터 제거', async () => {
  await G.deleteAccount(uid);
  if (SB) { await assert.rejects(() => G.getState(uid), /USER_MISSING/); return; }
  const left = await tx(null, (db) => ({ chart: !!db.saju_charts[uid], msgs: db.consultation_messages.filter((m) => m.user_id === uid).length, rel: db.relationships.filter((r) => r.user_id === uid).length, email: db.users[uid].email }));
  assert.deepEqual([left.chart, left.msgs, left.rel], [false, 0, 0]);
  assert.match(left.email, /deleted/);
});

test('OpenAI Responses API 연동: 요청 형식·구조화 출력 파싱·질문권 차감 (로컬 목 서버)', async () => {
  const http = await import('node:http');
  let seen: any = null;
  const srv = http.createServer((req, res) => {
    let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
      seen = { auth: req.headers.authorization, body: JSON.parse(b) };
      const out = { core: '핵심 답변', detail: '상세 해석', basis: ['일주 무인'], follow_ups: ['a', 'b', 'c'], summary: '요약 한 줄' };
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(out) }] }], usage: { total_tokens: 321 } }));
    });
  });
  await new Promise<void>((r) => srv.listen(0, r));
  const port = (srv.address() as any).port;
  process.env.OPENAI_API_KEY = 'sk-mock'; process.env.OPENAI_BASE_URL = `http://127.0.0.1:${port}/v1/responses`; process.env.OPENAI_MODEL = 'model-from-env';
  try {
    const u = await signup(em('e'), 'password123', true);
    await G.createCharacter(u, { nickname: '구름', avatar: 2, ...birth });
    const r = await G.consult(u, { npcId: 'merchant', question: '나는 사업가로 성공할 수 있을까?' });
    assert.equal(r.answer.core, '핵심 답변'); assert.equal(r.answer.source, 'openai'); assert.equal(r.state.wallet.tickets, 1);
    assert.equal(seen.auth, 'Bearer sk-mock'); assert.equal(seen.body.model, 'model-from-env');
    assert.equal(seen.body.text.format.type, 'json_schema'); assert.equal(seen.body.text.format.strict, true);
    const payload = JSON.parse(seen.body.input);
    assert.equal(payload.saju.day_pillar, '무인'); assert.equal(payload.topic, 'wealth'); assert.ok(payload.rules.length > 0);
    assert.match(seen.body.instructions, /사주 계산은 절대 직접 하지 마세요/); assert.match(seen.body.instructions, /현실적이고 분석적인/);
    const log = await tx(u, (db) => db.ai_usage_logs.filter((l) => l.user_id === u));
    assert.equal(log[0].tokens, 321); assert.equal(log[0].ok, true);
  } finally { srv.close(); delete process.env.OPENAI_API_KEY; delete process.env.OPENAI_BASE_URL; delete process.env.OPENAI_MODEL; }
});
