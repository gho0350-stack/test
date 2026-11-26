import { requireUser } from '@/lib/server/auth';
import { shopConfig, orderHistory } from '@/lib/server/game';
import { handle, ok } from '@/lib/server/api';
export const dynamic = 'force-dynamic';
export const GET = handle(async () => { const id = await requireUser(); return ok({ ...shopConfig(), orders: await orderHistory(id) }); });
