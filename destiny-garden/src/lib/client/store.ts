'use client';
import { create } from 'zustand';
import type { GameState, QuestDone } from './types';
import { api } from './api';
import { interactWith } from '../game/world';

export type Panel =
  | { type: 'building'; id: string }
  | { type: 'npc'; id: string }
  | { type: 'chat'; id: string; partnerId?: string | null; cardKeys?: string[] }
  | { type: 'chartbook' }
  | { type: 'codex'; focus?: string } | { type: 'bag' } | { type: 'quests' } | { type: 'shop'; focus?: string; partnerId?: string | null } | { type: 'settings' } | { type: 'notifications' }
  | { type: 'report'; kind: string; partnerId?: string | null } | { type: 'tarot' } | { type: 'consult' };
export interface Toast { id: number; text: string; kind: 'quest' | 'level' | 'info' | 'error' }

interface G {
  state: GameState | null;
  loaded: boolean;
  panel: Panel | null;
  toasts: Toast[];
  joy: { x: number; y: number };
  target: { x: number; z: number } | null;
  pending: { kind: 'building' | 'npc'; id: string; x: number; z: number } | null;
  near: { kind: 'building' | 'npc'; id: string; label: string } | null;
  player: { x: number; z: number };
  load: () => Promise<GameState | null>;
  setState: (s: GameState) => void;
  open: (p: Panel | null) => void;
  toast: (text: string, kind?: Toast['kind']) => void;
  handleEvent: (ev?: QuestDone | null) => void;
  fire: (event: string) => Promise<void>;
  goTo: (kind: 'building' | 'npc', id: string) => void;
}
let tid = 1;
export const useGame = create<G>((set, get) => ({
  state: null, loaded: false, panel: null, toasts: [], joy: { x: 0, y: 0 }, target: null, pending: null, near: null, player: { x: 0, z: 9 },
  load: async () => { try { const j = await api('/api/state'); set({ state: j.state, loaded: true }); return j.state; } catch { set({ loaded: true }); return null; } },
  setState: (s) => set({ state: s }),
  open: (p) => set({ panel: p, joy: { x: 0, y: 0 } }),
  toast: (text, kind = 'info') => { const id = tid++; set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, kind }] })); setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200); },
  handleEvent: (ev) => {
    if (!ev) return;
    for (const q of ev.completed) get().toast(`퀘스트 완료! ${q.title}  ·  +${q.reward.coins}코인 +${q.reward.exp}EXP`, 'quest');
    if (ev.levelUp) get().toast(`레벨 업! Lv.${ev.levelUp}`, 'level');
  },
  goTo: (kind, id) => { set({ panel: null }); const g = get(); interactWith(kind, id, { player: g.player, open: g.open, set: (s) => set(s) }); },
  fire: async (event) => {
    const st = get().state; if (!st) return;
    const q = st.quests.find((x) => x.event === event);
    if (!q || q.done) return; // 해당 이벤트의 퀘스트가 없으면 서버 호출 안 함
    try { const j = await api('/api/event', { body: { event } }); get().handleEvent(j.ev); if (j.state) set({ state: j.state }); } catch { /* 무시 */ }
  },
}));
