import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { cookies } from 'next/headers';
import { tx, uid, now, type DB } from './db';
import { C } from '../content';
import { strictProd } from './env';

const COOKIE = 'dg_session';
function secret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (strictProd()) throw new Error('AUTH_SECRET 환경변수가 필요합니다.');
  const dir = process.env.DATA_DIR || path.join(process.cwd(), '.data');
  const f = path.join(dir, 'dev-secret');
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(32).toString('hex'));
  return fs.readFileSync(f, 'utf8');
}
const sign = (v: string) => crypto.createHmac('sha256', secret()).update(v).digest('base64url');
export const hashPw = (pw: string, salt: string) => crypto.scryptSync(pw, salt, 32).toString('hex');

export async function setSession(userId: string) {
  const v = `${userId}.${Date.now()}`;
  (await cookies()).set(COOKIE, `${v}.${sign(v)}`, { httpOnly: true, sameSite: 'lax', secure: strictProd(), path: '/', maxAge: 60 * 60 * 24 * 30 });
}
export async function clearSession() { (await cookies()).delete(COOKIE); }
export async function currentUserId(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf('.');
  const v = raw.slice(0, i), sig = raw.slice(i + 1);
  const exp = sign(v);
  if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null;
  return v.split('.')[0];
}

export async function signup(email: string, password: string, consent: boolean) {
  email = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, '이메일 형식이 올바르지 않습니다.');
  if (password.length < 8) throw new HttpError(400, '비밀번호는 8자 이상이어야 합니다.');
  if (!consent) throw new HttpError(400, '개인정보 수집·이용에 동의해야 가입할 수 있습니다.');
  return tx((db) => {
    if (Object.values(db.users).some((u) => u.email === email && !u.deleted_at)) throw new HttpError(409, '이미 가입된 이메일입니다.');
    const id = uid('u_'), salt = crypto.randomBytes(16).toString('hex');
    db.users[id] = { id, email, salt, pass_hash: hashPw(password, salt), created_at: now() };
    db.credit_wallets[id] = { user_id: id, tickets: 0, coins: 0 };
    const welcome = C.costs.welcome_tickets;
    if (welcome > 0) { db.credit_wallets[id].tickets = welcome; db.credit_ledger.push({ id: uid('l_'), user_id: id, delta: welcome, kind: 'signup_bonus', ref: `signup:${id}`, created_at: now() }); }
    db.consent_logs.push({ id: uid('c_'), user_id: id, kind: 'privacy_birth_data', version: '2026-11', created_at: now() });
    return id;
  });
}
export async function login(email: string, password: string) {
  email = email.trim().toLowerCase();
  return tx((db) => {
    const u = Object.values(db.users).find((x) => x.email === email && !x.deleted_at);
    if (!u || hashPw(password, u.salt) !== u.pass_hash) throw new HttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    return u.id;
  });
}

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function requireUser(): Promise<string> {
  const id = await currentUserId();
  if (!id) throw new HttpError(401, '로그인이 필요합니다.');
  const ok = await tx((db: DB) => !!db.users[id] && !db.users[id].deleted_at);
  if (!ok) throw new HttpError(401, '로그인이 필요합니다.');
  return id;
}
