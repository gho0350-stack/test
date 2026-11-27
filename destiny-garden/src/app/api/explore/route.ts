import { requireUser } from '@/lib/server/auth';
import { exploreObject } from '@/lib/server/game';
import { handle, ok, body } from '@/lib/server/api';
export const POST = handle(async (req: Request) => { const id = await requireUser(); const b = await body(req); return ok(await exploreObject(id, String(b.objectId ?? ''), b.partnerId ?? null)); });
