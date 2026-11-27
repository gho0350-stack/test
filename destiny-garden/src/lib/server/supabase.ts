/**
 * Supabase 드라이버 (REST/PostgREST + Auth Admin API, 서버 전용).
 * 사용자 단위로 필요한 행만 읽어 메모리 DB 형태로 만들고, 변경분을 diff 하여 dg_apply() 한 번(=한 트랜잭션)으로 반영한다.
 * 질문권 지갑은 CAS(이전 값 일치 조건)로 갱신하여 동시 요청의 이중 차감을 막고, 충돌 시 전체를 재시도한다.
 */
import type { DB } from './db';

export const useSupabase = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SECRET_KEY;
const base = () => process.env.SUPABASE_URL!.replace(/\/$/, '');

export class SbError extends Error { constructor(public status: number, message: string, public body?: any) { super(message); } }

export async function sb(path: string, init: { method?: string; body?: any; headers?: Record<string, string> } = {}) {
  const res = await fetch(base() + path, {
    method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
    // 신형 secret key 는 apikey 헤더로만 보낸다(Authorization Bearer 로 보내지 않음)
    headers: { apikey: process.env.SUPABASE_SECRET_KEY!, 'content-type': 'application/json', ...(init.headers ?? {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined, signal: AbortSignal.timeout(20000), cache: 'no-store',
  });
  const text = await res.text();
  let json: any = null; try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  if (!res.ok) throw new SbError(res.status, json?.message || json?.msg || json?.error_description || `Supabase ${res.status}`, json);
  return json;
}

// ───────── 테이블 정의 ─────────
const PK: Record<string, string[]> = {
  profiles: ['user_id'], birth_profiles: ['user_id'], saju_charts: ['user_id'], avatars: ['user_id'], user_positions: ['user_id'],
  user_destiny_cards: ['user_id', 'card_id'], user_cards: ['user_id', 'card_key'], user_sage_unlocks: ['user_id', 'sage_id'], quest_progress: ['user_id', 'quest_id'], game_rewards: ['id'], tarot_draws: ['id'], relationships: ['id'],
  consultations: ['id'], consultation_messages: ['id'], consultation_summaries: ['id'], ai_usage_logs: ['id'], reports: ['id'], consent_logs: ['id'],
  credit_ledger: ['id'], orders: ['id'], payments: ['id'],
};
/** 읽기 시 가져올 행 수 제한(최근 N개). 로그 계열은 읽지 않고 쓰기만 한다. */
const LIMITS: Record<string, number> = { consultation_messages: 200, consultation_summaries: 60, credit_ledger: 300 };
const WRITE_ONLY = new Set(['ai_usage_logs', 'consent_logs']);
const stable = (v: any): string => JSON.stringify(v, (_, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));
const pkOf = (t: string, r: any) => PK[t].map((k) => String(r[k])).join('|');

/** 메모리 DB → 테이블별 행 */
function flatten(db: DB, uid: string): Record<string, any[]> {
  const o: Record<string, any[]> = {};
  const one = (t: string, m: Record<string, any>) => { o[t] = m[uid] ? [m[uid]] : []; };
  one('profiles', db.profiles); one('saju_charts', db.saju_charts); one('avatars', db.avatars); one('user_positions', db.user_positions);
  o.birth_profiles = db.birth_profiles[uid] ? [{ user_id: uid, data: (({ user_id, created_at, ...rest }) => rest)(db.birth_profiles[uid]), created_at: db.birth_profiles[uid].created_at }] : [];
  o.user_destiny_cards = db.user_destiny_cards[uid] ?? [];
  o.user_cards = db.user_cards[uid] ?? [];
  o.user_sage_unlocks = db.user_sage_unlocks[uid] ?? [];
  o.quest_progress = Object.entries(db.quest_progress[uid] ?? {}).map(([quest_id, v]) => ({ user_id: uid, quest_id, completed_at: v.completed_at }));
  for (const t of ['game_rewards', 'tarot_draws', 'relationships', 'consultations', 'consultation_messages', 'consultation_summaries', 'ai_usage_logs', 'reports', 'consent_logs', 'credit_ledger', 'orders', 'payments'] as const) o[t] = (db as any)[t];
  return o;
}

function inflate(uid: string, rows: Record<string, any[]>, email: string): DB {
  const one = (t: string) => (rows[t]?.[0] ? { [uid]: rows[t][0] } : {});
  const bp = rows.birth_profiles?.[0];
  const qp: Record<string, { completed_at: string }> = {};
  for (const r of rows.quest_progress ?? []) qp[r.quest_id] = { completed_at: r.completed_at };
  return {
    users: { [uid]: { id: uid, email, pass_hash: '', salt: '', created_at: '' } },
    profiles: one('profiles'), saju_charts: one('saju_charts'), avatars: one('avatars'), user_positions: one('user_positions'),
    credit_wallets: one('credit_wallets'),
    birth_profiles: bp ? { [uid]: { user_id: uid, ...bp.data, created_at: bp.created_at } } : {},
    user_destiny_cards: { [uid]: rows.user_destiny_cards ?? [] },
    user_cards: { [uid]: rows.user_cards ?? [] },
    user_sage_unlocks: { [uid]: rows.user_sage_unlocks ?? [] },
    quest_progress: { [uid]: qp },
    game_rewards: rows.game_rewards ?? [], tarot_draws: rows.tarot_draws ?? [], relationships: rows.relationships ?? [], consultations: rows.consultations ?? [],
    consultation_messages: rows.consultation_messages ?? [], consultation_summaries: rows.consultation_summaries ?? [], orders: rows.orders ?? [], payments: rows.payments ?? [],
    reports: rows.reports ?? [], ai_usage_logs: [], consent_logs: [], credit_ledger: rows.credit_ledger ?? [],
  } as unknown as DB;
}

async function loadUser(uid: string): Promise<{ db: DB; email: string }> {
  const tables = Object.keys(PK).filter((t) => !WRITE_ONLY.has(t));
  const [user, wallet, ...res] = await Promise.all([
    sb(`/auth/v1/admin/users/${uid}`).catch((e) => { if (e instanceof SbError && (e.status === 404 || e.status === 400)) return null; throw e; }),
    sb(`/rest/v1/credit_wallets?user_id=eq.${uid}&select=*`),
    // user_cards 마이그레이션(0002) 적용 전에도 기존 기능이 동작하도록 테이블 없음(404)은 빈 목록으로 처리
    ...tables.map((t) => sb(`/rest/v1/${t}?user_id=eq.${uid}&select=*${LIMITS[t] ? `&order=created_at.desc&limit=${LIMITS[t]}` : ''}`).catch((e) => { if ((t === 'user_cards' || t === 'user_sage_unlocks') && e instanceof SbError && e.status === 404) return []; throw e; })),
  ]);
  if (!user?.id) { const e: any = new Error('USER_MISSING'); e.code = 'USER_MISSING'; throw e; }
  const rows: Record<string, any[]> = { credit_wallets: wallet };
  tables.forEach((t, i) => { rows[t] = LIMITS[t] ? [...res[i]].reverse() : res[i]; });
  return { db: inflate(uid, rows, user.email ?? ''), email: user.email ?? '' };
}

export async function sbTx<T>(uid: string | null, fn: (db: DB) => T | Promise<T>, readonly = false): Promise<T> {
  if (!uid) return fn({} as DB);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { db } = await loadUser(uid);
    const before = flatten(db, uid);
    const walletBefore = db.credit_wallets[uid] ? { ...db.credit_wallets[uid] } : null;
    const snap: Record<string, Map<string, string>> = {};
    for (const t of Object.keys(PK)) snap[t] = new Map(before[t].map((r) => [pkOf(t, r), stable(r)]));
    const out = await fn(db);
    if (readonly) return out;
    const after = flatten(db, uid);
    const upserts: Record<string, any[]> = {}, deletes: Record<string, any[]> = {};
    for (const t of Object.keys(PK)) {
      const seen = new Set<string>();
      for (const r of after[t]) { const k = pkOf(t, r); seen.add(k); if (snap[t].get(k) !== stable(r)) (upserts[t] ??= []).push(r); }
      if (!WRITE_ONLY.has(t)) for (const [k, s] of snap[t]) if (!seen.has(k)) (deletes[t] ??= []).push(Object.fromEntries(PK[t].map((c, i) => [c, JSON.parse(s)[c] ?? k.split('|')[i]])));
    }
    const walletAfter = db.credit_wallets[uid] ?? null;
    const walletChanged = stable(walletBefore) !== stable(walletAfter) && walletAfter;
    if (!Object.keys(upserts).length && !Object.keys(deletes).length && !walletChanged) return out;
    try {
      await sb('/rest/v1/rpc/dg_apply', { body: { p: { wallet: walletChanged ? { old: walletBefore, new: walletAfter } : null, upserts, deletes } } });
      return out;
    } catch (e: any) {
      if (e instanceof SbError && /DG_CONFLICT/.test(e.message + JSON.stringify(e.body ?? '')) && attempt < 4) continue; // 동시 수정: 다시 읽고 재시도
      if (e instanceof SbError && /duplicate key/.test(e.message) && attempt < 4) continue;
      throw e;
    }
  }
  throw new Error('동시 요청 충돌이 반복되었습니다.');
}

// ───────── Auth (Supabase Auth 관리 API) ─────────
export async function sbCreateUser(email: string, password: string): Promise<string> {
  try {
    const u = await sb('/auth/v1/admin/users', { body: { email, password, email_confirm: true } });
    return u.id;
  } catch (e: any) {
    if (e instanceof SbError && (e.status === 422 || /already|exists|registered/i.test(e.message))) { const x: any = new Error('EXISTS'); x.code = 'EXISTS'; throw x; }
    throw e;
  }
}
export async function sbLogin(email: string, password: string): Promise<string | null> {
  try { const j = await sb('/auth/v1/token?grant_type=password', { body: { email, password } }); return j.user?.id ?? null; }
  catch (e: any) { if (e instanceof SbError && (e.status === 400 || e.status === 401)) return null; throw e; }
}
export const sbDeleteUser = (uid: string) => sb(`/auth/v1/admin/users/${uid}`, { method: 'DELETE' });
