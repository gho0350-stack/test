import { requireUser } from '@/lib/server/auth';
import { createOrder } from '@/lib/server/game';
import { handle, ok, body } from '@/lib/server/api';
export const POST = handle(async (req: Request) => { const id = await requireUser(); const b = await body(req); return ok(await createOrder(id, String(b.productId), b.partnerId ?? null)); });
