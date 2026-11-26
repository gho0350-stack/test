import { requireUser, clearSession } from '@/lib/server/auth';
import { deleteAccount } from '@/lib/server/game';
import { handle, ok } from '@/lib/server/api';
export const DELETE = handle(async () => { const id = await requireUser(); await deleteAccount(id); await clearSession(); return ok(); });
