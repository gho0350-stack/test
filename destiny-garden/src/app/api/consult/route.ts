import { requireUser } from '@/lib/server/auth';
import { consult, consultHistory, consultOverview } from '@/lib/server/game';
import { handle, ok, body } from '@/lib/server/api';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const GET = handle(async (req: Request) => { const id = await requireUser(); const n = new URL(req.url).searchParams.get('npcId'); return ok(n ? await consultHistory(id, n) : { overview: await consultOverview(id) }); });
export const POST = handle(async (req: Request) => { const id = await requireUser(); return ok(await consult(id, await body(req))); });
