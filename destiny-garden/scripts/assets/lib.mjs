// 에셋 파이프라인 공용 유틸. 공식 API 만 사용하고, 존재하지 않는 URL 을 만들어 내지 않는다.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
export const CACHE = path.join(ROOT, '.cache', 'assets'); export const PUB = path.join(ROOT, 'public', 'assets');
export const UA = 'destiny-garden-asset-pipeline/1.0 (+https://github.com/gho0350-stack/test)';
export const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
export const writeJson = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const md5 = (buf) => crypto.createHash('md5').update(buf).digest('hex');
export const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
export async function http(url, { json = false, retries = 3 } = {}) {
  let last;
  for (let i = 0; i < retries; i++) {
    try { const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: json ? 'application/json' : '*/*' }, redirect: 'follow' }); if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`); return json ? await r.json() : Buffer.from(await r.arrayBuffer()); }
    catch (e) { last = e; await sleep(800 * (i + 1)); }
  }
  throw last;
}
export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
/** 키워드 점수: 이름·태그·카테고리에 키워드가 포함될수록 +, avoid 포함 시 제외 */
export function score(id, info, keywords, avoid) {
  const hay = [id, info.name, ...(info.tags ?? []), ...(info.categories ?? [])].join(' ').toLowerCase();
  if ((avoid ?? []).some((a) => hay.includes(a.toLowerCase()))) return -1;
  let s = 0; for (const k of keywords ?? []) if (hay.includes(k.toLowerCase())) s += 2;
  return s;
}
