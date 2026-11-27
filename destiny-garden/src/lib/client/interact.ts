'use client';
import { api } from './api';
import { useGame } from './store';
import { ROOMS } from '../game/world';

let busy = false;
const objDef = (id: string) => ROOMS.flatMap((r) => r.objects as any[]).find((o) => o.id === id);

/** 실내 근접 상호작용: 오브젝트별 3D 애니메이션 → 서버에서 카드 지급 → 카드 획득 연출 */
export async function interactNear(n: { kind: string; id: string }) {
  const g = useGame.getState();
  if (n.kind === 'sage') { g.open({ type: 'sage', id: n.id }); return; }
  const o = objDef(n.id); if (!o || busy) return;
  const st = g.state!;
  if (o.kind === 'panel') { g.open(o.panel === 'chart' ? { type: 'chartbook' } : { type: 'partners' }); return; }
  const key = o.daily ? `${o.card}:${st.config.today}` : o.card;
  const owned = st.cards.find((c) => c.key === key);
  busy = true;
  try {
    if (owned) { useGame.setState({ reveal: { card: owned, isNew: false } }); return; }
    useGame.setState((s) => ({ anim: { ...s.anim, [o.id]: 'opening' } }));
    const [j] = await Promise.all([api('/api/explore', { body: { objectId: o.id } }), new Promise((r) => setTimeout(r, 900))]);
    useGame.setState((s) => ({ anim: { ...s.anim, [o.id]: 'open' } }));
    useGame.getState().setState(j.state); useGame.getState().handleEvent(j.ev);
    useGame.setState({ reveal: { card: j.card, isNew: j.isNew, unlockedSage: j.unlockedSage } });
  } catch (e: any) {
    useGame.setState((s) => { const a = { ...s.anim }; delete a[o.id]; return { anim: a }; });
    useGame.getState().toast(e.message, 'error');
  } finally { busy = false; }
}
