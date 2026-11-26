import { requireUser } from '@/lib/server/auth';
import { getReport } from '@/lib/server/game';
import { handle, ok } from '@/lib/server/api';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const GET = handle(async (req: Request, ctx: { params: Promise<{ kind: string }> }) => { const id = await requireUser(); const { kind } = await ctx.params; return ok({ report: await getReport(id, kind, new URL(req.url).searchParams.get('partnerId')) }); });
