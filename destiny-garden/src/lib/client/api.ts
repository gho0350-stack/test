export async function api<T = any>(path: string, opts: { method?: string; body?: any } = {}): Promise<T> {
  const res = await fetch(path, { method: opts.method ?? (opts.body ? 'POST' : 'GET'), headers: opts.body ? { 'content-type': 'application/json' } : undefined, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: 'no-store' });
  const j = await res.json().catch(() => ({ ok: false, error: '서버 응답을 읽을 수 없습니다.' }));
  if (!res.ok || j.ok === false) { const e: any = new Error(j.error || '요청에 실패했어요.'); e.status = res.status; throw e; }
  return j;
}
