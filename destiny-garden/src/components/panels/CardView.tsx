'use client';
import { useEffect, useState } from 'react';
import { CATEGORIES } from '@/lib/cards-meta';
import { useGame } from '@/lib/client/store';
import { NpcPortrait } from '../ui/NpcPortrait';
import { NPCS, ROOMS } from '@/lib/game/world';

export interface CardData { key: string; category: string; name: string; subtitle: string; keywords: string[]; body: string; basis: string[]; source?: string; npc?: string; room?: string; at?: string }
const THEME: Record<string, string> = { essence: 'linear-gradient(160deg,#3b1f78,#6b3fb5)', talent: 'linear-gradient(160deg,#1f4a78,#3f78e0)', wealth: 'linear-gradient(160deg,#7a5a12,#d9a63a)', love: 'linear-gradient(160deg,#7a1f4a,#e86aa0)', flow: 'linear-gradient(160deg,#1f5a5a,#3fae9a)', past: 'linear-gradient(160deg,#2a2a5a,#6a6aa8)', consult: 'linear-gradient(160deg,#4a1f78,#c0568a)' };

export function CardFace({ card, onAsk }: { card: CardData; onAsk?: () => void }) {
  const cat = CATEGORIES.find((c) => c.id === card.category);
  return (
    <div>
      <div className="dcard" style={{ background: THEME[card.category] ?? THEME.essence, width: 'min(62vw, 230px)' }}>
        <span className="rar">{cat?.name ?? '카드'}</span>
        <div className="art" style={{ fontSize: 58 }}>{cat?.icon ?? '🎴'}</div>
        <div className="nm">{card.name}</div><div className="sb">{card.subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', margin: '12px 0 4px' }}>{card.keywords.map((k) => <span key={k} className="chip" style={{ padding: '4px 10px', fontSize: 12 }}>#{k}</span>)}</div>
      <div className="card pre" style={{ marginTop: 8 }}>{card.body}</div>
      {card.basis?.length > 0 && <div className="muted" style={{ marginBottom: 4 }}>명리학적 근거: {card.basis.join(' · ')}</div>}
      {(card.room || card.source === 'consult') && <div className="muted" style={{ marginBottom: 8 }}>📍 획득한 곳: {card.source === 'consult' ? `${card.npc ?? '현자'}와의 상담` : ROOMS.find((r) => r.id === card.room)?.name}</div>}
      {onAsk && <button className="btn gold block" onClick={onAsk}>🧙 이 카드로 현자에게 묻기</button>}
    </div>
  );
}

/** 카드 획득 연출: 빛 → 뒷면 등장 → 뒤집기 → 해석 */
export function CardModal({ card, isNew = true, onClose, ask }: { card: CardData; isNew?: boolean; onClose: () => void; ask?: () => void }) {
  const [stage, setStage] = useState(isNew ? 0 : 2);
  useEffect(() => { if (!isNew) return; const a = setTimeout(() => setStage(1), 650), b = setTimeout(() => setStage(2), 1500); return () => { clearTimeout(a); clearTimeout(b); }; }, [isNew]);
  return (
    <div className="overlay" style={{ alignItems: 'center', zIndex: 70 }} onPointerDown={(e) => { if (e.target === e.currentTarget && stage === 2) onClose(); }}>
      <div className="sheet" data-testid="cardmodal" style={{ borderRadius: 24, maxWidth: 420, margin: 14, maxHeight: '92dvh' }} role="dialog" aria-label={card.name}>
        <div className="sheet-head"><h2>{isNew ? '✨ 새로운 운명 카드 발견!' : '이미 획득한 카드예요'}<small>{stage === 2 ? '운명도감에 저장되었습니다' : '카드가 모습을 드러냅니다…'}</small></h2><button className="x" onClick={() => { setStage(2); onClose(); }} aria-label="닫기">✕</button></div>
        <div className="sheet-body">
          {stage < 2 ? (
            <div className="flip" style={{ margin: '24px auto' }}><div className={'flip-in' + (stage === 1 ? ' on' : '')} style={{ filter: 'drop-shadow(0 0 22px #ffd36b)' }}><div className="flip-back">🌙</div><div className="flip-front"><div style={{ fontSize: 44 }}>✨</div></div></div></div>
          ) : <CardFace card={card} onAsk={ask ?? (() => { onClose(); useGame.getState().open({ type: 'chat', id: 'sage', cardKeys: [card.key] }); })} />}
        </div>
      </div>
    </div>
  );
}

/** 현자 상담 해금 축하 */
export function UnlockModal({ sageId, onClose }: { sageId: string; onClose: () => void }) {
  const n: any = NPCS.find((x) => x.id === sageId)!;
  return (
    <div className="overlay" style={{ alignItems: 'center', zIndex: 75 }}>
      <div className="sheet" data-testid="unlockmodal" style={{ borderRadius: 24, maxWidth: 400, margin: 14, textAlign: 'center' }}>
        <div className="sheet-body" style={{ padding: '26px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 0 24px #ffd36b)' }}><NpcPortrait id={sageId} size={92} /></div>
          <h2 style={{ color: '#3b1f78', margin: '14px 0 6px' }}>✨ {n.name} 상담이 열렸어요!</h2>
          <p className="muted">모든 핵심 카드를 모았어요. 이제 {n.name}에게 카드를 들고 물어볼 수 있어요.<br /><b>첫 상담은 무료</b>예요. 이후에는 하단 ‘상담’ 메뉴에서 언제든 찾아갈 수 있어요.</p>
          <button className="btn gold block" onClick={() => { onClose(); useGame.getState().open({ type: 'chat', id: sageId }); }}>지금 바로 상담하기</button>
          <button className="btn line block" style={{ marginTop: 8 }} onClick={onClose}>나중에 하기</button>
        </div>
      </div>
    </div>
  );
}
