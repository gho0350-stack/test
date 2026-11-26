import { requireUser } from '@/lib/server/auth';
import { savePosition } from '@/lib/server/game';
import { handle, ok, body } from '@/lib/server/api';
export const POST = handle(async (req: Request) => { const id = await requireUser(); const b = await body(req); await savePosition(id, Number(b.x), Number(b.z)); return ok(); });
