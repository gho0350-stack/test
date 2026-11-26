import { requireUser, currentUserId } from '@/lib/server/auth';
import { getState } from '@/lib/server/game';
import { handle, ok } from '@/lib/server/api';
export const dynamic = 'force-dynamic';
export const GET = handle(async () => { const id = await currentUserId(); if (!id) return ok({ state: null }); await requireUser(); return ok({ state: await getState(id) }); });
