import type { buildState } from '../server/game';
export type GameState = ReturnType<typeof buildState>;
export interface QuestDone { completed: { id: string; title: string; reward: { exp: number; coins: number } }[]; levelUp: number | null }
