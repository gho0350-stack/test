import { signup, setSession } from '@/lib/server/auth';
import { handle, ok, body } from '@/lib/server/api';
export const POST = handle(async (req: Request) => { const b = await body(req); const id = await signup(String(b.email ?? ''), String(b.password ?? ''), !!b.consent); await setSession(id); return ok({ userId: id }); });
