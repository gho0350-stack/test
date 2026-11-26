import { requireUser } from '@/lib/server/auth';
import { insight } from '@/lib/server/game';
import { handle, ok } from '@/lib/server/api';
export const dynamic = 'force-dynamic';
export const GET = handle(async (req: Request) => { const id = await requireUser(); const t = new URL(req.url).searchParams.get('topic') === 'career' ? 'career' : 'wealth'; return ok(await insight(id, t)); });
