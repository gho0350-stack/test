import { requireUser } from '@/lib/server/auth';
import { confirmOrder } from '@/lib/server/game';
import { handle, ok, body } from '@/lib/server/api';
export const POST = handle(async (req: Request) => { const id = await requireUser(); const b = await body(req); return ok(await confirmOrder(id, { paymentKey: String(b.paymentKey ?? ''), orderId: String(b.orderId ?? ''), amount: Number(b.amount) })); });
