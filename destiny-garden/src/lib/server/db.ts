/**
 * 서버 전용 영속 계층.
 * - 개발/테스트: DATA_DIR(기본 .data) 아래 JSON 파일 (원자적 쓰기 + 직렬화 큐)
 * - 운영: supabase/migrations/0001_init.sql 스키마(RLS 포함)로 이관. 컬렉션 이름은 테이블명과 동일.
 * 테스트 데이터와 실제 데이터 분리: DATA_DIR 로 경로를 분리한다 (e2e 는 .data-test).
 */
import fs from 'node:fs';
import path from 'node:path';
import { useSupabase, sbTx } from './supabase';

export interface UserCard { user_id: string; card_key: string; category: string; name: string; source: 'explore' | 'consult'; data: { subtitle: string; keywords: string[]; body: string; basis: string[]; [k: string]: any }; acquired_at: string }

export interface SageUnlock { user_id: string; sage_id: string; unlocked_at: string; free_remaining: number }

export interface DB {
  users: Record<string, { id: string; email: string; pass_hash: string; salt: string; created_at: string; deleted_at?: string }>;
  profiles: Record<string, { user_id: string; nickname: string; avatar_id: number; exp: number; created_at: string }>;
  birth_profiles: Record<string, any>;
  saju_charts: Record<string, any>;
  user_destiny_cards: Record<string, { user_id: string; card_id: number; acquired_at: string }[]>;
  avatars: Record<string, { user_id: string; body_type: number }>;
  user_positions: Record<string, { user_id: string; x: number; z: number; updated_at: string }>;
  user_cards: Record<string, UserCard[]>;
  user_sage_unlocks: Record<string, SageUnlock[]>;
  quest_progress: Record<string, Record<string, { completed_at: string }>>;
  game_rewards: { id: string; user_id: string; quest_id: string; exp: number; coins: number; created_at: string }[];
  credit_wallets: Record<string, { user_id: string; tickets: number; coins: number }>;
  credit_ledger: { id: string; user_id: string; delta: number; kind: string; ref: string | null; created_at: string }[];
  tarot_draws: { id: string; user_id: string; draw_date: string; position: number; card_id: number; reversed: boolean; created_at: string }[];
  relationships: { id: string; user_id: string; name: string; relation: string; birth: any; chart: any; created_at: string }[];
  consultations: { id: string; user_id: string; npc_id: string; topic: string; created_at: string }[];
  consultation_messages: { id: string; consultation_id: string; user_id: string; npc_id: string; role: 'user' | 'npc'; content: any; cost: number; created_at: string }[];
  consultation_summaries: { id: string; user_id: string; npc_id: string; topic: string; summary: string; created_at: string }[];
  orders: { id: string; user_id: string; product_id: string; amount: number; partner_id?: string | null; status: 'pending' | 'paid' | 'refunded' | 'failed'; created_at: string }[];
  payments: { id: string; order_id: string; user_id: string; payment_key: string; amount: number; status: 'DONE' | 'CANCELED'; provider: string; raw: any; created_at: string }[];
  reports: { id: string; user_id: string; product_id: string; partner_id: string | null; content: any; source: string; created_at: string }[];
  ai_usage_logs: { id: string; user_id: string; npc_id: string; model: string; ok: boolean; ms: number; tokens: number | null; error: string | null; created_at: string }[];
  consent_logs: { id: string; user_id: string; kind: string; version: string; created_at: string }[];
}

const empty = (): DB => ({
  users: {}, profiles: {}, birth_profiles: {}, saju_charts: {}, user_destiny_cards: {}, avatars: {}, user_positions: {}, user_cards: {}, user_sage_unlocks: {}, quest_progress: {},
  game_rewards: [], credit_wallets: {}, credit_ledger: [], tarot_draws: [], relationships: [], consultations: [], consultation_messages: [],
  consultation_summaries: [], orders: [], payments: [], reports: [], ai_usage_logs: [], consent_logs: [],
});

const dir = () => process.env.DATA_DIR || path.join(process.cwd(), '.data');
const file = () => path.join(dir(), 'db.json');

const g = globalThis as any;
g.__dg ??= { cache: null as DB | null, cachePath: '', queue: Promise.resolve() as Promise<any> };

function load(): DB {
  const s = g.__dg;
  if (s.cache && s.cachePath === file()) return s.cache;
  fs.mkdirSync(dir(), { recursive: true });
  let db = empty();
  if (fs.existsSync(file())) { try { db = { ...empty(), ...JSON.parse(fs.readFileSync(file(), 'utf8')) }; } catch { throw new Error('DB 파일이 손상되었습니다.'); } }
  s.cache = db; s.cachePath = file();
  return db;
}
function persist(db: DB) {
  fs.mkdirSync(dir(), { recursive: true });
  const tmp = file() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, file());
}

/** 파일 드라이버: 모든 쓰기는 직렬화된다. fn 이 throw 하면 변경은 저장되지 않는다(롤백). */
function fileTx<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const s = g.__dg;
  const run = s.queue.then(async () => {
    const db = load();
    const snapshot = JSON.stringify(db);
    try {
      const out = await fn(db);
      persist(db);
      return out;
    } catch (e) {
      s.cache = JSON.parse(snapshot); // rollback
      throw e;
    }
  });
  s.queue = run.catch(() => undefined);
  return run;
}

/**
 * 사용자 범위 트랜잭션. scope = 대상 사용자 ID (Supabase 모드는 이 사용자의 행만 읽고 변경분만 원자적으로 반영).
 * SUPABASE_URL + SUPABASE_SECRET_KEY 가 있으면 Supabase, 없으면 로컬 JSON 파일.
 */
export function tx<T>(scope: string | null, fn: (db: DB) => T | Promise<T>): Promise<T> {
  return useSupabase() ? sbTx(scope, fn) : fileTx(fn);
}
export function read<T>(scope: string | null, fn: (db: DB) => T): Promise<T> {
  return useSupabase() ? sbTx(scope, fn, true) : fileTx(fn);
}

export const uid = (p = '') => p + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
export const now = () => new Date().toISOString();
export const kstDate = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
