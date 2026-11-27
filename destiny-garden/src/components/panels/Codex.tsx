'use client';
import { useState } from 'react';
import { Sheet } from '../ui/kit';
import { CardFace, type CardData } from './CardView';
import { useGame } from '@/lib/client/store';
import { CATEGORIES, CARD_CATEGORY } from '@/lib/cards-meta';
import objects from '@data/explore_objects.json';
import buildings from '@data/game_buildings.json';

const close = () => useGame.getState().open(null);
type Tab = 'essence' | 'talent' | 'wealth' | 'love' | 'flow' | 'past' | 'consult' | 'chronicle';

export function Codex({ focus }: { focus?: string }) {
  const st = useGame((s) => s.state)!;
  const [tab, setTab] = useState<Tab>('essence');
  const [sel, setSel] = useState<CardData | null>(focus ? ((st.cards.find((c) => c.key === focus) as any) ?? null) : null);
  const owned = (k: string) => st.cards.find((c) => c.key === k || c.key.startsWith(k + ':'));
  const where = (key: string) => { const o: any = objects.find((x: any) => x.card === key); return o ? `${buildings.find((b) => b.id === o.building)?.name} · ${o.name}` : ''; };

  if (sel) return (
    <Sheet title={sel.name} sub={CATEGORIES.find((c) => c.id === sel.category)?.name} onClose={() => setSel(null)}>
      <CardFace card={sel} onAsk={() => useGame.getState().open({ type: 'chat', id: 'sage', cardKeys: [sel.key] })} />
    </Sheet>
  );

  const slots = Object.keys(CARD_CATEGORY).filter((k) => CARD_CATEGORY[k] === tab);
  const extra = st.cards.filter((c) => (tab === 'love' && c.key.startsWith('love_pair:')) || (tab === 'consult' && c.category === 'consult'));
  const chron = [...st.cards].sort((a, b) => a.at.localeCompare(b.at));
  const progress = (t: string) => { const all = Object.keys(CARD_CATEGORY).filter((k) => CARD_CATEGORY[k] === t); return `${all.filter((k) => owned(k)).length}/${all.length}`; };

  return (
    <Sheet title="운명 도감" sub={`수집한 카드 ${st.cards.length}장`} onClose={close}
      tabs={<div className="tabs">{CATEGORIES.map((c) => <button key={c.id} data-tab={c.id} className={tab === c.id ? 'on' : ''} onClick={() => setTab(c.id as Tab)}>{c.icon} {c.name}{c.id !== 'consult' && <small> {progress(c.id)}</small>}</button>)}<button data-tab="chronicle" className={tab === 'chronicle' ? 'on' : ''} onClick={() => setTab('chronicle')}>📜 운명 연대기</button></div>}>
      {tab === 'chronicle' ? (
        chron.length === 0 ? <div className="muted">아직 수집한 카드가 없어요. 정원의 서랍을 열어 보세요.</div> :
        <div style={{ borderLeft: '3px solid #d8c9f5', paddingLeft: 14 }}>{chron.map((c) => (
          <button key={c.key} className="prod" style={{ width: '100%', border: 0, textAlign: 'left', position: 'relative' }} onClick={() => setSel(c as any)}>
            <div className="ic">{CATEGORIES.find((x) => x.id === c.category)?.icon}</div>
            <div><div className="nm">{c.name}</div><div className="ds">{new Date(c.at).toLocaleString('ko-KR')} · {c.source === 'consult' ? `${(c as any).npc ?? '현자'}와의 상담` : '정원 탐험'}</div></div>
          </button>))}</div>
      ) : (
        <>
          {tab === 'essence' && st.card && <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div style={{ fontSize: 30 }}>🎴</div><div><b>{st.card.name}</b><div className="muted">{st.card.subtitle} · {st.card.rarity}</div></div><button className="btn sm line" style={{ marginLeft: 'auto' }} onClick={() => useGame.getState().open({ type: 'chartbook' })}>사주 보기</button></div>}
          <div className="grid2">
            {slots.map((k) => { const c = owned(k); return c
              ? <button key={k} className="cdx" onClick={() => setSel(c as any)}><div className="ic">{CATEGORIES.find((x) => x.id === tab)?.icon}</div><div className="nm">{c.name}</div><div className="st">{c.subtitle?.slice(0, 22)}</div></button>
              : <div key={k} className="cdx lock"><div className="ic">🔒</div><div className="nm">???</div><div className="st">{where(k)}</div></div>; })}
            {extra.map((c) => <button key={c.key} className="cdx" onClick={() => setSel(c as any)}><div className="ic">{CATEGORIES.find((x) => x.id === c.category)?.icon}</div><div className="nm">{c.name}</div><div className="st">{c.subtitle?.slice(0, 22)}</div></button>)}
          </div>
          {tab === 'consult' && extra.length === 0 && <div className="muted" style={{ marginTop: 10 }}>현자의 집에서 상담하면 이야기 속에서 발견한 카드가 여기에 쌓여요.</div>}
          {tab === 'love' && <div className="muted" style={{ marginTop: 10 }}>인연의 정자 ‘두 개의 의자’에서 소중한 사람을 등록하면 관계 카드가 생겨요.</div>}
        </>
      )}
    </Sheet>
  );
}
