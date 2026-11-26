import { requireUser } from '@/lib/server/auth';
import { gameEvent } from '@/lib/server/game';
import { getState } from '@/lib/server/game';
import { handle, ok, body } from '@/lib/server/api';
export const POST = handle(async (req: Request) => { const id = await requireUser(); const b = await body(req); const ev = await gameEvent(id, String(b.event)); return ok({ ev, state: ev.completed.length ? await getState(id) : undefined }); });
