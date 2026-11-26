import { requireUser } from '@/lib/server/auth';
import { addRelationship, removeRelationship } from '@/lib/server/game';
import { handle, ok, body } from '@/lib/server/api';
export const POST = handle(async (req: Request) => { const id = await requireUser(); return ok({ state: await addRelationship(id, await body(req)) }); });
export const DELETE = handle(async (req: Request) => { const id = await requireUser(); return ok({ state: await removeRelationship(id, new URL(req.url).searchParams.get('id') ?? '') }); });
