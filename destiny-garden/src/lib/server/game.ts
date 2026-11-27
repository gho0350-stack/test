import { C } from '../content';
import { tx, read, uid, now, kstDate, type DB } from './db';
import { HttpError } from './auth';
import { useSupabase, sbDeleteUser } from './supabase';
import { calcSaju, validateBirth, type BirthInput, type SajuChart } from '../saju/engine';
import { destinyCardOf, dayPillarInfo, matchRules, cycleGods, pastLifeOf } from '../rules';
import { compareCharts } from '../compat';
import { monthGanzhiList, yearGanzhi } from '../saju/engine';
import { spreadOrder, isReversed, interpretDraw } from '../tarot';
import { CARD_DEFS, generateCard, categoryOfKey, type CardContent } from '../cards';
import rooms from '@data/rooms.json';
import type { UserCard } from './db';
import { answerQuestion, detectTopic, makeReport, aiMode, model } from './ai';
import { confirmPayment, cancelPayment, payMode, tossClientKey } from './payments';

const TITLES = ['정원의 방문자', '운명의 탐험가', '별빛 수집가', '인연의 기록자', '운명의 기록자'];
export const levelOf = (exp: number) => { const lv = 1 + Math.floor(exp / 100); return { level: lv, title: TITLES[Math.min(TITLES.length - 1, lv - 1)], into: exp % 100, next: 100 }; };
const YEAR = () => Number(kstDate().slice(0, 4));

// ───────── 지갑/원장 ─────────
function ledger(db: DB, userId: string, delta: number, kind: string, ref: string | null): boolean {
  if (ref && db.credit_ledger.some((l) => l.ref === ref && l.user_id === userId)) return false; // 멱등
  const w = (db.credit_wallets[userId] ??= { user_id: userId, tickets: 0, coins: 0 });
  if (w.tickets + delta < 0) throw new HttpError(402, '질문권이 부족합니다.');
  w.tickets += delta;
  db.credit_ledger.push({ id: uid('l_'), user_id: userId, delta, kind, ref, created_at: now() });
  return true;
}

// ───────── 퀘스트 ─────────
const CLIENT_EVENTS = new Set(['enter_garden']);
function applyEvent(db: DB, userId: string, event: string) {
  const done = (db.quest_progress[userId] ??= {});
  const completed: any[] = [];
  const w = (db.credit_wallets[userId] ??= { user_id: userId, tickets: 0, coins: 0 });
  const prof = db.profiles[userId];
  const before = levelOf(prof?.exp ?? 0).level;
  const nCards = db.user_cards[userId]?.length ?? 0;
  for (const q of C.quests.filter((q) => q.event === event || (event === 'cards' && q.event.startsWith('cards:') && nCards >= Number(q.event.slice(6))))) {
    if (done[q.id]) continue;
    done[q.id] = { completed_at: now() };
    w.coins += q.reward.coins;
    if (prof) prof.exp += q.reward.exp;
    db.game_rewards.push({ id: uid('r_'), user_id: userId, quest_id: q.id, exp: q.reward.exp, coins: q.reward.coins, created_at: now() });
    completed.push({ id: q.id, title: q.title, reward: q.reward });
  }
  const after = levelOf(prof?.exp ?? 0).level;
  return { completed, levelUp: after > before ? after : null };
}
export async function gameEvent(userId: string, event: string) {
  if (!CLIENT_EVENTS.has(event)) throw new HttpError(400, '허용되지 않은 이벤트입니다.');
  return tx(userId, (db) => {
    if (!db.birth_profiles[userId] && event !== 'enter_garden') throw new HttpError(409, '캐릭터를 먼저 만들어 주세요.');
    return applyEvent(db, userId, event);
  });
}

// ───────── 상태 ─────────
function entitlements(db: DB, userId: string) {
  return db.orders.filter((o) => o.user_id === userId && o.status === 'paid').map((o) => ({ orderId: o.id, productId: o.product_id, partnerId: o.partner_id ?? null }));
}
/** 해금 행이 없어도(테이블 미적용 등) 방의 필수 카드를 모두 모았다면 해금된 것으로 복원. 무료 상담 사용 여부는 상담 기록에서 복원 */
function ensureUnlocks(db: DB, userId: string) {
  const owned = db.user_cards[userId] ?? []; const list = (db.user_sage_unlocks[userId] ??= []);
  for (const r of rooms) {
    if (list.some((u) => u.sage_id === r.sage.id) || !required(r as any).every((o) => hasCard(owned, o.card))) continue;
    const usedFree = db.consultation_messages.some((m) => m.user_id === userId && m.npc_id === r.sage.id && m.role === 'user' && m.content?.free);
    list.push({ user_id: userId, sage_id: r.sage.id, unlocked_at: now(), free_remaining: usedFree ? 0 : 1 });
  }
}
export function buildState(db: DB, userId: string) {
  ensureUnlocks(db, userId);
  const u = db.users[userId];
  const prof = db.profiles[userId];
  const w = db.credit_wallets[userId] ?? { tickets: 0, coins: 0 };
  const chart: SajuChart | null = db.saju_charts[userId]?.chart ?? null;
  const done = db.quest_progress[userId] ?? {};
  const today = kstDate();
  const draw = db.tarot_draws.find((d) => d.user_id === userId && d.draw_date === today);
  const lv = levelOf(prof?.exp ?? 0);
  return {
    user: { id: userId, email: u.email },
    profile: prof ? { nickname: prof.nickname, avatar: prof.avatar_id, exp: prof.exp, ...lv } : null,
    birth: db.birth_profiles[userId] ?? null,
    chart,
    dayPillar: chart ? dayPillarInfo(chart.pillars.day.name) : null,
    card: chart ? destinyCardOf(chart.pillars.day.name) : null,
    wallet: { tickets: w.tickets, coins: w.coins },
    quests: C.quests.map((q) => ({ ...q, done: !!done[q.id], completedAt: done[q.id]?.completed_at ?? null })),
    cards: (db.user_cards[userId] ?? []).map((c) => ({ key: c.card_key, category: c.category, name: c.name, source: c.source, at: c.acquired_at, ...c.data })),
    rooms: roomProgress(db.user_cards[userId] ?? [], db.user_sage_unlocks[userId] ?? []),
    sages: (db.user_sage_unlocks[userId] ?? []).map((u) => ({ id: u.sage_id, freeRemaining: u.free_remaining })),
    position: db.user_positions[userId] ?? null,
    todayTarot: draw ? { ...interpretDraw(draw.card_id, draw.reversed, chart), position: draw.position } : null,
    relationships: db.relationships.filter((r) => r.user_id === userId).map((r) => ({ id: r.id, name: r.name, relation: r.relation, birth: r.birth, dayPillar: r.chart.pillars.day.name, compat: chart ? compareCharts(chart, r.chart) : null })),
    entitlements: entitlements(db, userId),
    config: { aiMode: aiMode(), payMode: payMode(), costs: C.costs, today },
  };
}
export const getState = (userId: string) => read(userId, (db) => buildState(db, userId));

// ───────── 캐릭터 생성 ─────────
export async function createCharacter(userId: string, b: any) {
  const nickname = String(b.nickname ?? '').trim();
  if (nickname.length < 1 || nickname.length > 12) throw new HttpError(400, '닉네임은 1~12자로 입력해 주세요.');
  const avatar = Number(b.avatar);
  if (![0, 1, 2].includes(avatar)) throw new HttpError(400, '캐릭터 외형을 선택해 주세요.');
  const input = parseBirth(b);
  const chart = calcSaju(input);
  return tx(userId, (db) => {
    db.profiles[userId] = { user_id: userId, nickname, avatar_id: avatar, exp: db.profiles[userId]?.exp ?? 0, created_at: db.profiles[userId]?.created_at ?? now() };
    db.avatars[userId] = { user_id: userId, body_type: avatar };
    db.birth_profiles[userId] = { user_id: userId, ...input, hour: input.hour ?? null, minute: input.minute ?? null, hour_unknown: input.hour == null, created_at: now() };
    db.saju_charts[userId] = { user_id: userId, chart, engine: chart.meta.engine, created_at: now() };
    const card = destinyCardOf(chart.pillars.day.name);
    db.user_destiny_cards[userId] = [{ user_id: userId, card_id: card.id, acquired_at: now() }];
    const ev = applyEvent(db, userId, 'create_character');
    return { ev, state: buildState(db, userId) };
  });
}
export function parseBirth(b: any): BirthInput {
  const hourUnknown = !!b.hourUnknown || b.hour === '' || b.hour == null;
  const input: BirthInput = {
    year: Number(b.year), month: Number(b.month), day: Number(b.day), calendar: b.calendar === 'lunar' ? 'lunar' : 'solar', isLeapMonth: !!b.isLeapMonth && b.calendar === 'lunar',
    hour: hourUnknown ? null : Number(b.hour), minute: hourUnknown ? null : Number(b.minute ?? 0), gender: b.gender, region: b.region || '서울',
    longitudeCorrection: !!b.longitudeCorrection, nightZi: b.nightZi === 'next_day' ? 'next_day' : 'same_day',
  };
  const err = validateBirth(input);
  if (err) throw new HttpError(400, err);
  return input;
}
export async function previewChart(b: any) { return calcSaju(parseBirth(b)); }

export const savePosition = (userId: string, x: number, z: number) => tx(userId, (db) => {
  if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 60 || Math.abs(z) > 60) throw new HttpError(400, '좌표가 올바르지 않습니다.');
  db.user_positions[userId] = { user_id: userId, x, z, updated_at: now() };
});

// ───────── 인물(궁합) ─────────
export async function addRelationship(userId: string, b: any) {
  const name = String(b.name ?? '').trim();
  if (!name || name.length > 12) throw new HttpError(400, '이름은 1~12자로 입력해 주세요.');
  const input = parseBirth({ ...b, gender: b.gender });
  const chart = calcSaju(input);
  return tx(userId, (db) => {
    if (db.relationships.filter((r) => r.user_id === userId).length >= 5) throw new HttpError(400, '인물은 최대 5명까지 등록할 수 있어요.');
    const r = { id: uid('rel_'), user_id: userId, name, relation: String(b.relation || '지인').slice(0, 8), birth: { ...input }, chart, created_at: now() };
    db.relationships.push(r);
    return buildState(db, userId);
  });
}
export const removeRelationship = (userId: string, id: string) => tx(userId, (db) => {
  db.relationships = db.relationships.filter((r) => !(r.id === id && r.user_id === userId));
  return buildState(db, userId);
});

// ───────── 인사이트(무료 요약) ─────────
export async function insight(userId: string, topic: 'wealth' | 'career') {
  return read(userId, (db) => {
    const chart: SajuChart | null = db.saju_charts[userId]?.chart ?? null;
    if (!chart) throw new HttpError(409, '캐릭터를 먼저 만들어 주세요.');
    const y = YEAR();
    return { seun: yearGanzhi(y), wolun: monthGanzhiList(y).map((m) => ({ month: m.month, ganzhi: m.ganzhi, jie: m.jie, begins: m.begins.slice(0, 10) })), rules: matchRules(chart, topic, y, 4).map((r) => ({ text: r.text, basis: r.basis })), cycle: cycleGods(chart, y), cycleRules: matchRules(chart, 'fortune', y, 2).map((r) => r.text), pastLife: topic === 'wealth' ? undefined : pastLifeOf(chart) };
  });
}

// ───────── 타로 ─────────
export async function tarotInfo(userId: string) {
  return read(userId, (db) => {
    const chart: SajuChart | null = db.saju_charts[userId]?.chart ?? null;
    const today = kstDate();
    const draw = db.tarot_draws.find((d) => d.user_id === userId && d.draw_date === today);
    const history = db.tarot_draws.filter((d) => d.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20)
      .map((d) => ({ date: d.draw_date, ...interpretDraw(d.card_id, d.reversed, chart) }));
    return { date: today, drawn: draw ? { ...interpretDraw(draw.card_id, draw.reversed, chart), position: draw.position } : null, history };
  });
}
export async function tarotPick(userId: string, position: number) {
  if (!Number.isInteger(position) || position < 0 || position > 77) throw new HttpError(400, '카드 위치가 올바르지 않습니다.');
  return tx(userId, (db) => {
    const today = kstDate();
    const chart: SajuChart | null = db.saju_charts[userId]?.chart ?? null;
    let d = db.tarot_draws.find((x) => x.user_id === userId && x.draw_date === today);
    let ev: any = { completed: [], levelUp: null };
    if (!d) {
      const cardId = spreadOrder(userId, today)[position];
      d = { id: uid('t_'), user_id: userId, draw_date: today, position, card_id: cardId, reversed: isReversed(userId, today, position), created_at: now() };
      db.tarot_draws.push(d);
      ev = applyEvent(db, userId, 'draw_tarot');
    }
    return { draw: { ...interpretDraw(d.card_id, d.reversed, chart), position: d.position }, ev, state: buildState(db, userId) };
  });
}

// ───────── NPC 상담 ─────────
export async function consultHistory(userId: string, npcId: string) {
  return read(userId, (db) => ({
    messages: db.consultation_messages.filter((m) => m.user_id === userId && m.npc_id === npcId).slice(-30).map((m) => ({ id: m.id, role: m.role, content: m.content, cost: m.cost, at: m.created_at })),
    summaries: db.consultation_summaries.filter((s) => s.user_id === userId && s.npc_id === npcId).slice(-5).map((s) => s.summary),
  }));
}
export async function consultOverview(userId: string) {
  return read(userId, (db) => C.npcs.map((n) => ({ id: n.id, count: db.consultation_messages.filter((m) => m.user_id === userId && m.npc_id === n.id && m.role === 'user').length })));
}

export async function consult(userId: string, b: any) {
  const npc = C.npcs.find((n) => n.id === b.npcId);
  if (!npc) throw new HttpError(404, 'NPC를 찾을 수 없습니다.');
  const question = String(b.question ?? '').trim();
  if (question.length < 2 || question.length > 300) throw new HttpError(400, '질문은 2~300자로 입력해 주세요.');
  const deep = !!b.deep;
  const cost = deep ? C.costs.deep : C.costs.normal;
  const topic = detectTopic(question, npc as any);

  // 1) 질문권 선차감(예약) + 컨텍스트 로드
  const pre = await tx(userId, (db) => {
    const chart: SajuChart | null = db.saju_charts[userId]?.chart ?? null;
    if (!chart) throw new HttpError(409, '캐릭터를 먼저 만들어 주세요.');
    let partner = null;
    if (b.partnerId) {
      const r = db.relationships.find((x) => x.id === b.partnerId && x.user_id === userId);
      if (!r) throw new HttpError(404, '선택한 인물을 찾을 수 없습니다.');
      partner = { name: r.name, chart: r.chart as SajuChart };
    }
    const picked = (Array.isArray(b.cardKeys) ? b.cardKeys.slice(0, 3) : []).map((k: string) => (db.user_cards[userId] ?? []).find((c) => c.card_key === String(k))).filter(Boolean) as UserCard[];
    const cards = picked.map((c) => ({ key: c.card_key, category: c.category, name: c.name, body: c.data.body }));
    let cons = db.consultations.find((c) => c.user_id === userId && c.npc_id === npc.id);
    if (!cons) { cons = { id: uid('cs_'), user_id: userId, npc_id: npc.id, topic, created_at: now() }; db.consultations.push(cons); }
    const requestId = uid('rq_');
    // 현자 상담은 방의 카드를 모두 찾아 해금한 뒤에만 가능. 각 현자의 첫 상담은 무료(실패 시 복구)
    ensureUnlocks(db, userId);
    const unl = (db.user_sage_unlocks[userId] ?? []).find((u) => u.sage_id === npc.id);
    if (!unl) throw new HttpError(403, '아직 이 현자와 상담할 수 없어요. 먼저 방의 운명 카드를 모두 찾아보세요.');
    const useFree = unl.free_remaining > 0 && !deep;
    if (useFree) unl.free_remaining -= 1; else ledger(db, userId, -cost, 'consult_reserve', `reserve:${requestId}`);
    const prev = db.consultation_summaries.filter((s) => s.user_id === userId && (s.topic === topic || s.npc_id === npc.id)).slice(-3).map((s) => s.summary).reverse();
    return { chart, partner, consultationId: cons.id, requestId, prev, cards, useFree };
  });

  // 2) AI 호출 (트랜잭션 밖)
  try {
    const r = await answerQuestion({ npc: npc as any, question, topic, chart: pre.chart, partner: pre.partner, prevSummaries: pre.prev, deep, cards: pre.cards });
    // 3) 성공: 저장 + 퀘스트
    return await tx(userId, (db) => {
      db.consultation_messages.push({ id: uid('m_'), consultation_id: pre.consultationId, user_id: userId, npc_id: npc.id, role: 'user', content: { text: question, deep, partnerId: b.partnerId ?? null, free: pre.useFree }, cost: pre.useFree ? 0 : cost, created_at: now() });
      const mid = uid('m_');
      const nc = r.answer.new_card;
      let newCard: any = null;
      if (nc?.name && nc?.body) {
        const row: UserCard = { user_id: userId, card_key: `consult:${mid}`, category: 'consult', name: String(nc.name).slice(0, 60), source: 'consult', acquired_at: now(), data: { subtitle: question.slice(0, 40), keywords: (nc.keywords ?? []).slice(0, 4).map(String), body: String(nc.body).slice(0, 1200), basis: r.answer.basis.slice(0, 4), npc: npc.name } };
        (db.user_cards[userId] ??= []).push(row);
        newCard = { key: row.card_key, category: 'consult', name: row.name, source: 'consult', at: row.acquired_at, ...row.data };
      }
      const hint = nextHint(db.user_cards[userId] ?? [], topic);
      r.answer.next_hint = hint ?? undefined;
      db.consultation_messages.push({ id: uid('m_'), consultation_id: pre.consultationId, user_id: userId, npc_id: npc.id, role: 'npc', content: { ...r.answer, source: r.source, topic, usedCards: pre.cards.map((c) => c.name), newCard }, cost: 0, created_at: now() });
      db.consultation_summaries.push({ id: uid('s_'), user_id: userId, npc_id: npc.id, topic, summary: String(r.answer.summary).slice(0, 240), created_at: now() });
      db.ai_usage_logs.push({ id: uid('a_'), user_id: userId, npc_id: npc.id, model: r.model, ok: true, ms: r.ms, tokens: r.tokens, error: null, created_at: now() });
      const ev1 = applyEvent(db, userId, 'first_consult');
      const ev2 = newCard ? applyEvent(db, userId, 'cards') : { completed: [], levelUp: null };
      return { answer: { ...r.answer, source: r.source, topic, usedCards: pre.cards.map((c) => c.name), newCard }, cost: pre.useFree ? 0 : cost, free: pre.useFree, newCard, ev: { completed: [...ev1.completed, ...ev2.completed], levelUp: ev1.levelUp ?? ev2.levelUp }, state: buildState(db, userId) };
    });
  } catch (e: any) {
    // 실패: 질문권 복구 (멱등)
    await tx(userId, (db) => {
      if (pre.useFree) { const u = (db.user_sage_unlocks[userId] ?? []).find((x) => x.sage_id === npc.id); if (u) u.free_remaining += 1; }
      else ledger(db, userId, cost, 'consult_refund', `refund:${pre.requestId}`);
      db.ai_usage_logs.push({ id: uid('a_'), user_id: userId, npc_id: npc.id, model: model(), ok: false, ms: 0, tokens: null, error: String(e?.message ?? e).slice(0, 300), created_at: now() });
    });
    throw new HttpError(502, 'AI 답변을 만들지 못했어요. 질문권은 차감되지 않았습니다. 잠시 후 다시 시도해 주세요.');
  }
}

// ───────── 탐험: 방 안의 오브젝트 조사 → 개인화 카드 ─────────
type RoomDef = (typeof rooms)[number];
const OBJECTS = rooms.flatMap((r) => r.objects.map((o: any) => ({ ...o, room: r.id })));
const CARD_EXP = 10;
const required = (r: RoomDef) => r.objects.filter((o: any) => o.required) as any[];
const hasCard = (owned: { card_key: string }[], key: string) => owned.some((c) => c.card_key === key || c.card_key.startsWith(key + ':'));
export function roomProgress(owned: { card_key: string }[], unlocks: { sage_id: string }[]) {
  return rooms.map((r) => { const req = required(r); const done = req.filter((o) => hasCard(owned, o.card)).length;
    return { id: r.id, name: r.name, required: req.length, got: done, complete: done === req.length, sageId: r.sage.id, sageUnlocked: unlocks.some((u) => u.sage_id === r.sage.id),
      objects: (r.objects as any[]).map((o) => ({ id: o.id, required: !!o.required, done: o.card ? (o.daily ? false : hasCard(owned, o.card)) : false })) }; });
}
/** 상담 후 다음 탐험을 이어 주는 힌트 */
const ROOM_BY_TOPIC: Record<string, string> = { wealth: 'wealth', career: 'wealth', general: 'library', relationship: 'pavilion', pastlife: 'time' };
function nextHint(owned: UserCard[], topic: string): string | null {
  const open = (o: any) => o.kind !== 'panel' && o.card && !o.daily && !hasCard(owned, o.card);
  const o: any = OBJECTS.find((x) => x.room === ROOM_BY_TOPIC[topic] && open(x)) ?? OBJECTS.find(open);
  return o ? `${rooms.find((r) => r.id === o.room)?.name}의 ‘${o.name}’을(를) 조사해 보세요.` : null;
}

export async function exploreObject(userId: string, objectId: string, partnerId?: string | null) {
  const obj: any = OBJECTS.find((o) => o.id === objectId);
  if (!obj) throw new HttpError(404, '오브젝트를 찾을 수 없습니다.');
  const room = rooms.find((r) => r.id === obj.room)!;
  const today = kstDate();
  return tx(userId, (db) => {
    const chart: SajuChart | null = db.saju_charts[userId]?.chart ?? null;
    if (!chart) throw new HttpError(409, '캐릭터를 먼저 만들어 주세요.');
    const owned = (db.user_cards[userId] ??= []);
    if (obj.kind === 'panel' && !(obj.id === 'chairs' && partnerId)) throw new HttpError(400, '카드를 얻는 오브젝트가 아닙니다.');
    let key = obj.card as string, partner = null as null | { id: string; name: string; chart: SajuChart };
    if (obj.id === 'chairs') {
      const r = db.relationships.find((x) => x.id === partnerId && x.user_id === userId);
      if (!r) throw new HttpError(404, '선택한 인물을 찾을 수 없습니다.');
      key = `love_pair:${r.id}`; partner = { id: r.id, name: r.name, chart: r.chart as SajuChart };
    } else if (obj.daily) key = `${key}:${today}`;
    const view = (row: { card_key: string; category: string; name: string; source: string; acquired_at: string; data: any }) => ({ key: row.card_key, category: row.category, name: row.name, source: row.source, at: row.acquired_at, ...row.data });
    const unlockOf = () => (db.user_sage_unlocks[userId] ?? []).find((u) => u.sage_id === room.sage.id);
    const exist = owned.find((c) => c.card_key === key);
    if (exist) return { isNew: false, card: view(exist), ev: { completed: [], levelUp: null as number | null }, unlockedSage: null as string | null, state: buildState(db, userId) };
    const c: CardContent = generateCard(key, chart, { today, partner });
    const row: UserCard = { user_id: userId, card_key: key, category: categoryOfKey(key), name: c.name, source: 'explore', acquired_at: now(), data: { subtitle: c.subtitle, keywords: c.keywords, body: c.body, basis: c.basis, object: obj.id, room: room.id } };
    owned.push(row);
    const prof = db.profiles[userId]; const before = levelOf(prof?.exp ?? 0).level; if (prof) prof.exp += CARD_EXP;
    const evs = [applyEvent(db, userId, `open:${obj.id}`), applyEvent(db, userId, 'cards')];
    // 방 완료 → 현자 상담 해금 (서버에서만 판정, 한 번 해금되면 다시 잠기지 않음)
    let unlockedSage: string | null = null;
    const done = required(room).every((o) => hasCard(owned, o.card));
    if (done && !unlockOf()) {
      (db.user_sage_unlocks[userId] ??= []).push({ user_id: userId, sage_id: room.sage.id, unlocked_at: now(), free_remaining: 1 });
      unlockedSage = room.sage.id; evs.push(applyEvent(db, userId, `room:${room.id}`));
    }
    const after = levelOf(prof?.exp ?? 0).level;
    return { isNew: true, card: view(row), ev: { completed: evs.flatMap((e) => e.completed), levelUp: after > before ? after : (evs.find((e) => e.levelUp)?.levelUp ?? null) }, unlockedSage, state: buildState(db, userId) };
  });
}

// ───────── 상점/결제 ─────────
const pending = new Set<string>();
export function shopConfig() { return { mode: payMode(), clientKey: tossClientKey(), products: C.products }; }

export async function createOrder(userId: string, productId: string, partnerId?: string | null) {
  const p = C.products.find((x) => x.id === productId);
  if (!p) throw new HttpError(404, '상품을 찾을 수 없습니다.');
  return tx(userId, (db) => {
    if ((p as any).needs_partner) {
      if (!partnerId || !db.relationships.some((r) => r.id === partnerId && r.user_id === userId)) throw new HttpError(400, '궁합 리포트는 상대를 먼저 등록하고 선택해야 해요.');
      if (db.orders.some((o) => o.user_id === userId && o.status === 'paid' && o.product_id === p.id && o.partner_id === partnerId)) throw new HttpError(409, '이미 구매한 리포트입니다.');
    } else if (p.kind === 'report' && db.orders.some((o) => o.user_id === userId && o.status === 'paid' && o.product_id === p.id)) throw new HttpError(409, '이미 구매한 리포트입니다.');
    const o = { id: 'DG' + Date.now().toString(36).toUpperCase() + uid().slice(0, 6).toUpperCase(), user_id: userId, product_id: p.id, amount: p.price, partner_id: partnerId ?? null, status: 'pending' as const, created_at: now() };
    db.orders.push(o);
    return { orderId: o.id, amount: o.amount, orderName: p.name, mode: payMode(), clientKey: tossClientKey() };
  });
}

export async function confirmOrder(userId: string, b: { paymentKey: string; orderId: string; amount: number }) {
  const key = b.orderId;
  if (pending.has(key)) throw new HttpError(409, '결제 승인 처리 중입니다.');
  pending.add(key);
  try {
    const pre = await read(userId, (db) => {
      const o = db.orders.find((x) => x.id === b.orderId && x.user_id === userId);
      if (!o) throw new HttpError(404, '주문을 찾을 수 없습니다.');
      return { ...o, paidPayment: db.payments.find((p) => p.order_id === o.id && p.status === 'DONE') };
    });
    if (pre.status === 'paid') return { already: true, state: await getState(userId) }; // 중복 승인/지급 방지
    if (pre.status !== 'pending') throw new HttpError(409, '결제할 수 없는 주문 상태입니다.');
    if (Number(b.amount) !== pre.amount) throw new HttpError(400, '결제 금액이 주문 금액과 다릅니다.');
    const conf = await confirmPayment({ paymentKey: String(b.paymentKey), orderId: pre.id, amount: pre.amount });
    return await tx(userId, (db) => {
      const o = db.orders.find((x) => x.id === pre.id)!;
      if (o.status === 'paid') return { already: true, state: buildState(db, userId) };
      const p = C.products.find((x) => x.id === o.product_id)!;
      o.status = 'paid';
      db.payments.push({ id: uid('p_'), order_id: o.id, user_id: userId, payment_key: conf.paymentKey, amount: o.amount, status: 'DONE', provider: conf.provider, raw: conf.raw, created_at: now() });
      if (p.kind === 'ticket') ledger(db, userId, (p as any).amount, 'purchase', `order:${o.id}`);
      return { already: false, product: p.name, state: buildState(db, userId) };
    });
  } finally { pending.delete(key); }
}

export async function failOrder(userId: string, orderId: string) {
  await tx(userId, (db) => { const o = db.orders.find((x) => x.id === orderId && x.user_id === userId); if (o && o.status === 'pending') o.status = 'failed'; });
}

export async function orderHistory(userId: string) {
  return read(userId, (db) => db.orders.filter((o) => o.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 30).map((o) => {
    const p = C.products.find((x) => x.id === o.product_id)!;
    const reportUsed = p.kind === 'report' && db.reports.some((r) => r.user_id === userId && r.product_id === p.id && (r.partner_id ?? null) === (o.partner_id ?? null));
    return { id: o.id, name: p.name, amount: o.amount, status: o.status, at: o.created_at, refundable: o.status === 'paid' && !reportUsed };
  }));
}

export async function refundOrder(userId: string, orderId: string) {
  const info = await read(userId, (db) => {
    const o = db.orders.find((x) => x.id === orderId && x.user_id === userId);
    if (!o || o.status !== 'paid') throw new HttpError(400, '환불할 수 있는 주문이 아닙니다.');
    const p = C.products.find((x) => x.id === o.product_id)!;
    const pay = db.payments.find((x) => x.order_id === o.id && x.status === 'DONE');
    if (!pay) throw new HttpError(400, '결제 내역이 없습니다.');
    if (p.kind === 'ticket' && (db.credit_wallets[userId]?.tickets ?? 0) < (p as any).amount) throw new HttpError(409, '이미 사용한 질문권이 있어 전액 환불할 수 없습니다. 고객센터로 문의해 주세요.');
    if (p.kind === 'report' && db.reports.some((r) => r.user_id === userId && r.product_id === p.id && (r.partner_id ?? null) === (o.partner_id ?? null))) throw new HttpError(409, '이미 열람한 리포트는 환불할 수 없습니다.');
    return { p, pay: { ...pay } };
  });
  await cancelPayment(info.pay.payment_key, '사용자 환불 요청', info.pay.provider);
  return tx(userId, (db) => {
    const o = db.orders.find((x) => x.id === orderId)!;
    if (o.status === 'refunded') return buildState(db, userId);
    o.status = 'refunded';
    const pay = db.payments.find((x) => x.order_id === o.id && x.status === 'DONE'); if (pay) pay.status = 'CANCELED';
    if (info.p.kind === 'ticket') ledger(db, userId, -(info.p as any).amount, 'refund_clawback', `refund:${orderId}`);
    return buildState(db, userId);
  });
}

// ───────── 리포트 ─────────
export async function getReport(userId: string, kind: string, partnerId?: string | null) {
  const product = C.products.find((p) => (p as any).report === kind);
  if (!product) throw new HttpError(404, '리포트를 찾을 수 없습니다.');
  const pre = await read(userId, (db) => {
    const chart: SajuChart | null = db.saju_charts[userId]?.chart ?? null;
    if (!chart) throw new HttpError(409, '캐릭터를 먼저 만들어 주세요.');
    const owned = db.orders.some((o) => o.user_id === userId && o.status === 'paid' && o.product_id === product.id && ((product as any).needs_partner ? o.partner_id === partnerId : true));
    if (!owned) throw new HttpError(402, '구매 후 열람할 수 있는 리포트입니다.');
    const cached = db.reports.find((r) => r.user_id === userId && r.product_id === product.id && (r.partner_id ?? null) === (partnerId ?? null));
    let partner = null;
    if (partnerId) { const r = db.relationships.find((x) => x.id === partnerId && x.user_id === userId); if (r) partner = { name: r.name, chart: r.chart as SajuChart }; }
    if ((product as any).needs_partner && !partner) throw new HttpError(400, '상대 정보를 찾을 수 없습니다.');
    return { chart, cached: cached?.content ?? null, partner };
  });
  if (pre.cached) return pre.cached;
  const content = await makeReport(kind, pre.chart, pre.partner).catch(() => { throw new HttpError(502, '리포트를 생성하지 못했어요. 잠시 후 다시 시도해 주세요. (구매는 유지됩니다)'); });
  await tx(userId, (db) => { db.reports.push({ id: uid('rp_'), user_id: userId, product_id: product.id, partner_id: partnerId ?? null, content, source: content.source, created_at: now() }); });
  return content;
}

// ───────── 계정 ─────────
export async function deleteAccount(userId: string) {
  await deleteAccountData(userId);
  if (useSupabase()) await sbDeleteUser(userId);
}
const deleteAccountData = (userId: string) => tx(userId, (db) => {
  const strip = <T extends { user_id: string }>(a: T[]) => a.filter((x) => x.user_id !== userId);
  for (const k of ['profiles', 'birth_profiles', 'saju_charts', 'user_destiny_cards', 'user_cards', 'user_sage_unlocks', 'avatars', 'user_positions', 'quest_progress', 'credit_wallets'] as const) delete (db as any)[k][userId];
  db.game_rewards = strip(db.game_rewards); db.tarot_draws = strip(db.tarot_draws); db.relationships = strip(db.relationships);
  const csIds = new Set(db.consultations.filter((c) => c.user_id === userId).map((c) => c.id));
  db.consultations = strip(db.consultations); db.consultation_messages = db.consultation_messages.filter((m) => !csIds.has(m.consultation_id)); db.consultation_summaries = strip(db.consultation_summaries);
  db.reports = strip(db.reports); db.ai_usage_logs = strip(db.ai_usage_logs);
  // 결제·주문 기록은 전자상거래법상 보관 대상이므로 계정 식별정보만 비식별화
  db.users[userId] = { ...db.users[userId], email: `deleted_${userId}@deleted.invalid`, pass_hash: '', deleted_at: now() };
});
