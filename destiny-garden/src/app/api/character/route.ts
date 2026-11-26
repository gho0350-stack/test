import { requireUser } from '@/lib/server/auth';
import { createCharacter } from '@/lib/server/game';
import { handle, ok, body } from '@/lib/server/api';
export const POST = handle(async (req: Request) => { const id = await requireUser(); return ok(await createCharacter(id, await body(req))); });
