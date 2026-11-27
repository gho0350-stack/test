'use client';
import { CATEGORIES } from '@/lib/cards-meta';
import { useGame } from '@/lib/client/store';

export interface CardData { key: string; category: string; name: string; subtitle: string; keywords: string[]; body: string; basis: string[]; source?: string; npc?: string }
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
      {card.basis?.length > 0 && <div className="muted" style={{ marginBottom: 8 }}>근거: {card.basis.join(' · ')}</div>}
      {onAsk && <button className="btn gold block" onClick={onAsk}>🧙 이 카드로 현자에게 묻기</button>}
    </div>
  );
}

/** 카드 발견 연출: 뒤집히며 나타남 */
export function CardModal({ card, isNew = true, onClose }: { card: CardData; isNew?: boolean; onClose: () => void }) {
  return (
    <div className="overlay" style={{ alignItems: 'center', zIndex: 70 }} onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" data-testid="cardmodal" style={{ borderRadius: 24, maxWidth: 420, margin: 14, maxHeight: '92dvh' }} role="dialog" aria-label={card.name}>
        <div className="sheet-head"><h2>{isNew ? '✨ 새 카드를 발견했어요!' : '이미 가진 카드예요'}<small>도감에 저장되었습니다</small></h2><button className="x" onClick={onClose} aria-label="닫기">✕</button></div>
        <div className="sheet-body"><CardFace card={card} onAsk={() => { onClose(); useGame.getState().open({ type: 'chat', id: 'sage', cardKeys: [card.key] }); }} /></div>
      </div>
    </div>
  );
}
