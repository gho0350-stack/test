'use client';
import { useState } from 'react';
import { Sheet } from '../ui/kit';
import { NpcPortrait } from '../ui/NpcPortrait';
import { CardModal } from './CardView';
import { PartnersView } from './Buildings';
import { api } from '@/lib/client/api';
import { useGame } from '@/lib/client/store';
import { BUILDINGS, NPCS } from '@/lib/game/world';
import objects from '@data/explore_objects.json';

const close = () => useGame.getState().open(null);
const ROOM_BG: Record<string, string> = {
  library: 'linear-gradient(180deg,#5a3a22,#8a6a42 55%,#6e4a2e)', wealth: 'linear-gradient(180deg,#5a1f1f,#9a4a2a 55%,#7a3a1f)',
  pavilion: 'linear-gradient(180deg,#5a2a52,#c0568a 60%,#8a3a6a)', time: 'linear-gradient(180deg,#1f1f5a,#3f3f9a 60%,#2a2a6a)',
};

export function Room({ id }: { id: string }) {
  const st = useGame((s) => s.state)!;
  const b = BUILDINGS.find((x) => x.id === id)!;
  const objs = objects.filter((o: any) => o.building === id) as any[];
  const [card, setCard] = useState<{ card: any; isNew: boolean } | null>(null);
  const [view, setView] = useState<'room' | 'partners'>('room');
  const [busy, setBusy] = useState(false);
  const have = new Set(st.cards.map((c) => c.key));
  const unlocked = (o: any) => !o.unlock || ('category' in o.unlock ? st.cards.filter((c) => c.category === o.unlock.category).length >= o.unlock.count : st.cards.length >= o.unlock.total);
  const opened = (o: any) => o.kind === 'card' && (o.daily ? st.cards.some((c) => c.key === `${o.card}:${st.config.today}`) : have.has(o.card));
  const total = objs.filter((o) => o.kind === 'card' && !o.daily).length, got = objs.filter((o) => o.kind === 'card' && !o.daily && opened(o)).length;

  async function tap(o: any) {
    if (busy) return;
    if (!unlocked(o)) { useGame.getState().toast(`🔒 ${o.hint}`); return; }
    if (o.kind === 'panel') { if (o.panel === 'chart') useGame.getState().open({ type: 'chartbook' }); else setView('partners'); return; }
    setBusy(true);
    try {
      const j = await api('/api/explore', { body: { objectId: o.id } });
      useGame.getState().setState(j.state); useGame.getState().handleEvent(j.ev); setCard({ card: j.card, isNew: j.isNew });
    } catch (e: any) { useGame.getState().toast(e.message, 'error'); } finally { setBusy(false); }
  }
  if (view === 'partners') return <PartnersView onClose={() => setView('room')} />;
  return (
    <Sheet title={b.name} sub={`${b.subtitle} · 발견 ${got}/${total}`} onClose={close}>
      {card && <CardModal card={card.card} isNew={card.isNew} onClose={() => setCard(null)} />}
      <div style={{ background: ROOM_BG[id], borderRadius: 18, padding: 14, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.35)' }} data-testid="room">
        <div className="grid2" style={{ gap: 10 }}>
          {objs.map((o) => {
            const lock = !unlocked(o), done = opened(o);
            return (
              <button key={o.id} data-obj={o.id} onClick={() => tap(o)} aria-label={o.name}
                style={{ border: '2px solid ' + (done ? '#f5c451' : lock ? '#ffffff33' : '#ffffff66'), background: lock ? '#00000040' : '#ffffff1f', borderRadius: 16, padding: '14px 8px', color: '#fff', textAlign: 'center', opacity: lock ? 0.6 : 1, position: 'relative' }}>
                <div style={{ fontSize: 40, filter: lock ? 'grayscale(1)' : 'none' }}>{lock ? '🔒' : o.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 14, marginTop: 4 }}>{o.name}</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{done ? (o.daily ? '오늘 확인함 ✓' : '발견함 ✓') : o.kind === 'panel' ? '열어보기' : lock ? '잠겨 있어요' : '눌러서 열기'}</div>
                {!lock && !done && o.kind === 'card' && <span className="qmark" style={{ top: -10, left: 'auto', right: 6, transform: 'none', width: 20, height: 20, fontSize: 12 }}>!</span>}
              </button>
            );
          })}
        </div>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>카드는 나의 사주 계산 결과를 바탕으로 사람마다 다르게 만들어져요. 모은 카드는 도감에서 다시 볼 수 있어요.</p>
    </Sheet>
  );
}

/** 현자의 집: 상담은 이곳에서. 모은 카드를 들고 주제를 고릅니다. */
const TOPICS = [
  { id: 'sage', icon: '🌙', label: '나의 운명에 대해', sub: '사주 전체와 올해의 흐름' }, { id: 'merchant', icon: '🪙', label: '재물과 성공에 대해', sub: '재물·사업·커리어' },
  { id: 'guardian', icon: '💞', label: '사랑과 인간관계에 대해', sub: '인연과 궁합' }, { id: 'guide', icon: '⏳', label: '나의 미래와 전생에 대해', sub: '대운·세운·창작 전생' },
];
export function SageHall() {
  const st = useGame((s) => s.state)!;
  const b = BUILDINGS.find((x) => x.id === 'sagehouse')!;
  return (
    <Sheet title={b.name} sub={b.subtitle} onClose={close}>
      <div className="npc-head"><NpcPortrait id="sage" size={72} /><div className="bubble" style={{ margin: 0, flex: 1 }}>오늘은 어떤 이야기를 나누고 싶으신가요? 정원에서 모은 카드를 들고 오면 더 깊이 이야기할 수 있어요.</div></div>
      <div className="note" style={{ background: '#efe6fb', borderColor: '#d8c9f5', color: '#3b1f78' }}>🎴 내가 모은 카드 <b>{st.cards.length}장</b> · 🎫 질문권 <b>{st.wallet.tickets}개</b></div>
      {TOPICS.map((t) => {
        const n = NPCS.find((x) => x.id === t.id)!;
        return <button key={t.id} data-topic={t.id} className="prod" style={{ width: '100%', border: 0, textAlign: 'left' }} onClick={() => useGame.getState().open({ type: 'chat', id: t.id })}>
          <div className="ic">{t.icon}</div><div><div className="nm">{t.label}</div><div className="ds">{n.name} · {t.sub}</div></div><span className="price">›</span></button>;
      })}
      {st.relationships.length > 0 && <><div className="sec-title">궁금한 사람과의 인연에 대해</div>
        {st.relationships.map((r) => <button key={r.id} className="prod" style={{ width: '100%', border: 0, textAlign: 'left' }} onClick={() => useGame.getState().open({ type: 'chat', id: 'guardian', partnerId: r.id })}><div className="ic">💌</div><div><div className="nm">{r.name}님과의 인연</div><div className="ds">인연의 수호자 · 궁합 {r.compat?.score}점</div></div><span className="price">›</span></button>)}</>}
      <p className="muted">상담 후에는 이야기 속에서 발견한 새 카드가 도감에 추가되고, 다음에 탐험할 장소를 알려 드려요.</p>
    </Sheet>
  );
}

/** 정원의 NPC: 짧은 안내만 (상담은 현자의 집에서) */
export function NpcTalk({ id }: { id: string }) {
  const n: any = NPCS.find((x) => x.id === id)!;
  return (
    <Sheet title={n.name} sub={n.title} onClose={close}>
      <div className="npc-head"><NpcPortrait id={id} size={72} /><div className="bubble" style={{ margin: 0, flex: 1 }}>{n.talk}</div></div>
      <button className="btn gold block" style={{ marginTop: 12 }} onClick={() => useGame.getState().goTo('building', 'sagehouse')}>🧙 현자의 집으로 가기</button>
      <p className="muted" style={{ textAlign: 'center' }}>상담은 현자의 집에서 할 수 있어요.</p>
    </Sheet>
  );
}
