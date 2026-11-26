import { login, setSession } from '@/lib/server/auth';
import { handle, ok, body } from '@/lib/server/api';
export const POST = handle(async (req: Request) => { const b = await body(req); const id = await login(String(b.email ?? ''), String(b.password ?? '')); await setSession(id); return ok({ userId: id }); });
