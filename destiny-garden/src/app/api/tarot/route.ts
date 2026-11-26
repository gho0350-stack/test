import { requireUser } from '@/lib/server/auth';
import { tarotInfo, tarotPick } from '@/lib/server/game';
import { handle, ok, body } from '@/lib/server/api';
export const dynamic = 'force-dynamic';
export const GET = handle(async () => { const id = await requireUser(); return ok(await tarotInfo(id)); });
export const POST = handle(async (req: Request) => { const id = await requireUser(); const b = await body(req); return ok(await tarotPick(id, Number(b.position))); });
