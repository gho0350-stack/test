import { NextResponse } from 'next/server';
import { HttpError } from './auth';

export const ok = (data: any = {}, init?: ResponseInit) => NextResponse.json({ ok: true, ...data }, init);
export function handle<A extends any[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A) => {
    try { return await fn(...a); }
    catch (e: any) {
      if (e instanceof HttpError) return NextResponse.json({ ok: false, error: e.message }, { status: e.status });
      console.error('[api]', e);
      return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
  };
}
export async function body(req: Request): Promise<any> { try { return await req.json(); } catch { throw new HttpError(400, '잘못된 요청입니다.'); } }
