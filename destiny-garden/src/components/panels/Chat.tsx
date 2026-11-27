'use client';
import { useEffect, useRef, useState } from 'react';
import { Sheet } from '../ui/kit';
import { CardModal } from './CardView';
import { NpcPortrait } from '../ui/NpcPortrait';
import { api } from '@/lib/client/api';
import { useGame } from '@/lib/client/store';
import { NPCS } from '@/lib/game/world';
import costs from '@data/consult_costs.json';

interface Ans { core: string; detail: string; basis: string[]; follow_ups: string[]; summary: string; source?: string; topic?: string; usedCards?: string[]; next_hint?: string; newCard?: any }
interface Msg { id: string; role: 'user' | 'npc'; content: any; cost: number }

export function NpcChat({ id, partnerId: initialPartner, cardKeys }: { id: string; partnerId?: string | null; cardKeys?: string[] }) {
  const npc = NPCS.find((n) => n.id === id)!;
  const st = useGame((s) => s.state)!;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [mem, setMem] = useState<string[]>([]);
  const [q, setQ] = useState(''); const [deep, setDeep] = useState(false); const [partnerId, setPartnerId] = useState(initialPartner ?? '');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [picked, setPicked] = useState<string[]>(cardKeys ?? []); const [newCard, setNewCard] = useState<any>(null);
  const toggle = (k: string) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : p.length >= 3 ? p : [...p, k]));
  const end = useRef<HTMLDivElement>(null);
  const close = () => useGame.getState().open(null);

  useEffect(() => { api(`/api/consult?npcId=${id}`).then((j) => { setMsgs(j.messages); setMem(j.summaries); }).catch(() => {}); }, [id]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs.length, busy]);

  const cost = deep ? costs.deep : costs.normal;
  const last = [...msgs].reverse().find((m) => m.role === 'npc');
  async function ask(text: string) {
    const question = text.trim(); if (!question || busy) return;
    if (st.wallet.tickets < cost) { setErr(`질문권이 부족해요 (필요 ${cost}개 / 보유 ${st.wallet.tickets}개)`); return; }
    setErr(''); setBusy(true); setQ('');
    const tmp: Msg = { id: 'tmp', role: 'user', content: { text: question, deep }, cost };
    setMsgs((m) => [...m, tmp]);
    try {
      const j = await api('/api/consult', { body: { npcId: id, question, deep, partnerId: partnerId || null, cardKeys: picked } });
      setMsgs((m) => [...m.filter((x) => x.id !== 'tmp'), { ...tmp, id: 'u' + Date.now() }, { id: 'n' + Date.now(), role: 'npc', content: j.answer, cost: 0 }]);
      useGame.getState().setState(j.state); useGame.getState().handleEvent(j.ev); if (j.newCard) setNewCard(j.newCard);
    } catch (e: any) { setMsgs((m) => m.filter((x) => x.id !== 'tmp')); setQ(question); setErr(e.message); } finally { setBusy(false); }
  }
  const follow = last ? (last.content as Ans).follow_ups : npc.suggested;

  return (
    <Sheet title={npc.name} sub={npc.title} onClose={close}
      foot={<div className="chat-foot">
        <div className="line" style={{ marginBottom: 8 }}>
          <button className="tix" onClick={() => useGame.getState().open({ type: 'shop' })}>🎫 질문권 {st.wallet.tickets}개 +</button>
          <label className="check" style={{ marginLeft: 'auto', alignItems: 'center' }}><input type="checkbox" checked={deep} onChange={(e) => setDeep(e.target.checked)} /><span>심층 분석 ({costs.deep}장)</span></label>
        </div>
        {st.relationships.length > 0 && <select className="inp" style={{ marginBottom: 8, padding: '8px 10px', fontSize: 14 }} aria-label="상대 선택" value={partnerId} onChange={(e) => setPartnerId(e.target.value)}><option value="">상대 없이 나에 대해 묻기</option>{st.relationships.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.relation})와 함께 보기</option>)}</select>}
        {st.cards.length > 0 && <div style={{ marginBottom: 8 }}><div className="muted" style={{ marginBottom: 4 }}>🎴 상담에 가져갈 카드 ({picked.length}/3)</div><div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>{st.cards.map((c) => <button key={c.key} type="button" data-card={c.key} className={'chip' + (picked.includes(c.key) ? ' on' : '')} style={{ flex: 'none', padding: '6px 12px', fontSize: 12.5 }} onClick={() => toggle(c.key)}>{c.name.length > 14 ? c.name.slice(0, 14) + '…' : c.name}</button>)}</div></div>}
        {err && <div className="err" role="alert">{err}</div>}
        <form className="line" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
          <input className="inp" value={q} maxLength={300} onChange={(e) => setQ(e.target.value)} placeholder="무엇이 궁금하신가요?" aria-label="질문 입력" />
          <button className="btn sm" disabled={busy || !q.trim()} style={{ padding: '12px 16px' }}>질문 ({cost})</button>
        </form>
      </div>}>
      <div className="npc-head"><NpcPortrait id={id} size={72} /><div className="bubble" style={{ margin: 0, flex: 1 }}>{npc.greeting}</div></div>
      {mem.length > 0 && <div className="note" style={{ background: '#efe6fb', borderColor: '#d8c9f5', color: '#3b1f78' }}>🧠 기억하고 있어요: {mem[mem.length - 1]}</div>}
      {msgs.map((m) => m.role === 'user'
        ? <div key={m.id} className="bubble me">{m.content.text}{m.content.deep && <span className="tag" style={{ background: '#fff3', color: '#fff', marginLeft: 6 }}>심층</span>}</div>
        : <div key={m.id} className="bubble ans">
            <div className="core">{(m.content as Ans).core}</div>
            {(m.content as Ans).usedCards?.length ? <div style={{ marginBottom: 6 }}>{(m.content as Ans).usedCards!.map((u) => <span key={u} className="tag" style={{ background: '#ffe9a8' }}>🎴 {u}</span>)}</div> : null}
            <h4>상세 해석</h4><div className="pre">{(m.content as Ans).detail}</div>
            <h4>명리학적 근거</h4><div>{(m.content as Ans).basis.map((b, i) => <span key={i} className="tag">{b}</span>)}</div>
            {(m.content as Ans).newCard && <div className="note" style={{ background: '#efe6fb', borderColor: '#d8c9f5', color: '#3b1f78' }}>🔮 새 카드가 도감에 추가되었어요: <b>{(m.content as Ans).newCard.name}</b></div>}
            {(m.content as Ans).next_hint && <div className="note" style={{ background: '#e8f6ec', borderColor: '#b8e0c4', color: '#1f5a3a' }}>🧭 다음 탐험 힌트: {(m.content as Ans).next_hint}</div>}
            {(m.content as Ans).source === 'offline' && <div className="note" style={{ marginTop: 10 }}>개발·테스트 모드: AI 연결 없이 규칙 DB로 만든 답변이에요. (운영에서는 OpenAI 해석이 적용됩니다)</div>}
          </div>)}
      {busy && <div className="bubble"><span className="typing"><i /><i /><i /></span> {npc.name}이(가) 사주를 살피는 중…</div>}
      {!busy && <><div className="sec-title">{last ? '이어서 물어볼까요?' : '추천 질문'} <span className="muted">(질문권 {costs.normal}장)</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{follow.map((f) => <button key={f} className="chip" onClick={() => ask(f)}>💬 {f}</button>)}</div></>}
      {newCard && <CardModal card={newCard} onClose={() => setNewCard(null)} />}
      <div ref={end} />
    </Sheet>
  );
}

export function ConsultList() {
  const st = useGame((s) => s.state)!;
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => { api('/api/consult').then((j) => setCounts(Object.fromEntries(j.overview.map((o: any) => [o.id, o.count])))).catch(() => {}); }, []);
  return (
    <Sheet title="NPC 상담" sub={`질문권 ${st.wallet.tickets}개`} onClose={() => useGame.getState().open(null)}>
      {NPCS.map((n) => (
        <button key={n.id} className="prod" style={{ width: '100%', border: 0, textAlign: 'left' }} onClick={() => useGame.getState().open({ type: 'npc', id: n.id })}>
          <NpcPortrait id={n.id} size={52} />
          <div><div className="nm">{n.name}</div><div className="ds">{n.title} · 지난 상담 {counts[n.id] ?? 0}회</div></div>
          <span className="price">›</span>
        </button>
      ))}
      <p className="muted">NPC를 정원에서 직접 눌러 대화할 수도 있어요. 질문권은 NPC 상담에 사용돼요.</p>
    </Sheet>
  );
}
