import { requireUser } from '@/lib/server/auth';
import { failOrder } from '@/lib/server/game';
import { handle, ok, body } from '@/lib/server/api';
export const POST = handle(async (req: Request) => { const id = await requireUser(); const b = await body(req); await failOrder(id, String(b.orderId ?? '')); return ok(); });
