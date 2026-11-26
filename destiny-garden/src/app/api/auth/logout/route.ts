import { clearSession } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/api';
export const POST = handle(async () => { await clearSession(); return ok(); });
