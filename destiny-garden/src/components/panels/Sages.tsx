'use client';
import { Sheet } from '../ui/kit';
import { NpcPortrait } from '../ui/NpcPortrait';
import { useGame } from '@/lib/client/store';
import { NPCS, ROOMS } from '@/lib/game/world';

const close = () => useGame.getState().open(null);
const objName = (id: string) => (ROOMS.flatMap((r) => r.objects as any[]).find((o) => o.id === id)?.name ?? id);

/** 방 안의 현자: 해금 전에는 안내만, 해금 후에는 상담 */
export function SagePanel({ id }: { id: string }) {
  const st = useGame((s) => s.state)!;
  const n: any = NPCS.find((x) => x.id === id)!;
  const pr = st.rooms.find((r) => r.sageId === id)!;
  const free = st.sages.find((s) => s.id === id)?.freeRemaining ?? 0;
  return (
    <Sheet title={n.name} sub={n.title} onClose={close}>
      <div className="npc-head"><NpcPortrait id={id} size={72} /><div className="bubble" style={{ margin: 0, flex: 1 }}>{pr.sageUnlocked ? n.greeting : n.locked_talk}</div></div>
      {pr.sageUnlocked ? <>
        <div className="note" style={{ background: '#efe6fb', borderColor: '#d8c9f5', color: '#3b1f78' }}>{free > 0 ? '🎁 첫 상담은 무료예요!' : `🎫 질문권 ${st.wallet.tickets}개`} · 모은 카드 {st.cards.length}장</div>
        <button className="btn gold block" data-testid="start-consult" onClick={() => useGame.getState().open({ type: 'chat', id })}>상담 시작하기</button>
      </> : <>
        <div className="sec-title">카드 수집 진행 {pr.got}/{pr.required}</div>
        <div className="bar"><i style={{ width: `${(pr.got / pr.required) * 100}%`, background: 'linear-gradient(90deg,#8a5fe0,#f5c451)' }} /></div>
        <ul className="bul" style={{ marginTop: 8 }}>{pr.objects.filter((o) => o.required).map((o) => <li key={o.id} style={{ opacity: o.done ? 0.6 : 1 }}>{o.done ? '✅' : '⬜'} {objName(o.id)}</li>)}</ul>
        <p className="muted">남은 카드 {pr.required - pr.got}장을 발견하면 상담이 열려요.</p>
      </>}
    </Sheet>
  );
}

/** 하단 ‘상담’ 메뉴: 현자별 해금 상태 */
export function SageList() {
  const st = useGame((s) => s.state)!;
  return (
    <Sheet title="상담" sub={`질문권 ${st.wallet.tickets}개`} onClose={close}>
      {st.rooms.map((r) => {
        const n: any = NPCS.find((x) => x.id === r.sageId)!;
        const free = st.sages.find((s) => s.id === r.sageId)?.freeRemaining ?? 0;
        return (
          <button key={r.id} data-sage={r.sageId} className="prod" style={{ width: '100%', border: 0, textAlign: 'left', opacity: r.sageUnlocked ? 1 : 0.8 }}
            onClick={() => { if (r.sageUnlocked) useGame.getState().open({ type: 'chat', id: r.sageId }); else { useGame.getState().open(null); useGame.getState().goTo('building', r.id); } }}>
            <NpcPortrait id={r.sageId} size={52} />
            <div><div className="nm">{n.name}</div><div className="ds">{r.sageUnlocked ? (free > 0 ? '상담 가능 · 첫 상담 무료' : '상담 가능') : `🔒 ${r.name} 카드 ${r.got}/${r.required}`}</div></div>
            <span className="price">{r.sageUnlocked ? '›' : '이동'}</span>
          </button>
        );
      })}
      <p className="muted">각 방의 핵심 카드를 모두 모으면 그 방의 현자와 상담할 수 있어요. 한 번 열린 상담은 다시 잠기지 않아요.</p>
    </Sheet>
  );
}
