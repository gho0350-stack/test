'use client';
import { useEffect, useState } from 'react';
import { Sheet, Tabs, PillarCell, EL_COLOR, won } from '../ui/kit';
import { NpcPortrait } from '../ui/NpcPortrait';
import { CardModal } from './CardView';
import { api } from '@/lib/client/api';
import { useGame } from '@/lib/client/store';
import { BUILDINGS } from '@/lib/game/world';
import products from '@data/products.json';
import tenGodData from '@data/ten_gods.json';
import { ELEMENTS } from '@/lib/saju/tables';

const close = () => useGame.getState().open(null);
export const prod = (id: string) => products.find((p) => p.id === id)!;

/** 구매/열람 버튼 */
export function ProductAction({ productId, partnerId, label }: { productId: string; partnerId?: string | null; label?: string }) {
  const st = useGame((s) => s.state)!;
  const p = prod(productId) as any;
  const owned = st.entitlements.some((e) => e.productId === productId && (!p.needs_partner || e.partnerId === partnerId));
  if (owned) return <button className="btn sm gold" onClick={() => useGame.getState().open({ type: 'report', kind: p.report, partnerId })}>📜 열람하기</button>;
  return <button className="btn sm" onClick={() => useGame.getState().open({ type: 'shop', focus: productId, partnerId })}>{label ?? '심층 리포트'} {won(p.price)}</button>;
}

function useInsight(topic: 'wealth' | 'career') {
  const [d, setD] = useState<any>(null);
  useEffect(() => { api(`/api/insight?topic=${topic}`).then(setD).catch(() => {}); }, [topic]);
  return d;
}

// ───────── 인연의 정자 ─────────
export function PartnersView({ onClose }: { onClose: () => void }) {
  const st = useGame((s) => s.state)!;
  const gotPair = (id: string) => st.cards.some((c) => c.key === `love_pair:${id}`);
  const [revealed, setRevealed] = useState<any>(null);
  async function pair(id: string) { try { const j = await api('/api/explore', { body: { objectId: 'chairs', partnerId: id } }); useGame.getState().setState(j.state); useGame.getState().handleEvent(j.ev); setRevealed(j.card); } catch (e: any) { useGame.getState().toast(e.message, 'error'); } }
  const [adding, setAdding] = useState(st.relationships.length === 0);
  const [f, setF] = useState({ name: '', relation: '연인', date: '1993-09-02', calendar: 'solar', isLeapMonth: false, hour: '12', hourUnknown: true, gender: 'male' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    const [y, m, d] = f.date.split('-').map(Number);
    try { const j = await api('/api/relationships', { body: { name: f.name, relation: f.relation, year: y, month: m, day: d, calendar: f.calendar, isLeapMonth: f.isLeapMonth, hour: f.hourUnknown ? null : Number(f.hour), minute: 0, hourUnknown: f.hourUnknown, gender: f.gender } }); useGame.getState().setState(j.state); setAdding(false); setF((x) => ({ ...x, name: '' })); }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }
  async function del(id: string) { if (!confirm('이 인물을 삭제할까요?')) return; const j = await api(`/api/relationships?id=${id}`, { method: 'DELETE' }); useGame.getState().setState(j.state); }
  return (
    <Sheet title="두 개의 의자" sub="소중한 사람과 나란히 앉아요" onClose={onClose}>
      {revealed && <CardModal card={revealed} onClose={() => setRevealed(null)} />}
      <div className="npc-head"><NpcPortrait id="guardian" size={60} /><div className="bubble" style={{ margin: 0, flex: 1 }}>소중한 사람의 생년월일을 알려 주세요. 두 사람의 사주를 나란히 놓고 살펴볼게요.</div></div>
      {st.relationships.map((r) => (
        <div className="card" key={r.id} style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><b style={{ fontSize: 16 }}>{r.name}</b><span className="tag" style={{ background: '#efe6fb', borderRadius: 8, padding: '2px 8px', fontSize: 11 }}>{r.relation}</span><span className="muted">{r.dayPillar}일주</span><button className="x" style={{ marginLeft: 'auto', width: 28, height: 28, fontSize: 13 }} onClick={() => del(r.id)} aria-label={`${r.name} 삭제`}>🗑</button></div>
          {r.compat && <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 6px' }}><div style={{ fontSize: 30, fontWeight: 900, color: '#c0568a' }}>{r.compat.score}<small style={{ fontSize: 13 }}>점</small></div><div><b>{r.compat.label}</b><div className="muted">일간 {r.compat.dayStemRelation} · 일지 {r.compat.dayBranchRelation}</div></div></div>
            <div className="bar"><i style={{ width: r.compat.score + '%', background: 'linear-gradient(90deg,#f3a6c7,#c0568a)' }} /></div>
            <ul className="bul" style={{ marginTop: 6 }}>{r.compat.highlights.slice(0, 2).map((h, i) => <li key={i}>{h}</li>)}{r.compat.cautions.slice(0, 1).map((h, i) => <li key={'c' + i} style={{ color: '#8a5a1f' }}>{h}</li>)}</ul>
          </>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}><button className="btn sm gold" onClick={() => pair(r.id)}>{gotPair(r.id) ? '🎴 관계 카드 다시 보기' : '🎴 관계 카드 받기'}</button><button className="btn sm line" onClick={() => useGame.getState().open({ type: 'chat', id: 'guardian', partnerId: r.id })}>{r.name}님에 대해 상담</button><ProductAction productId="report_compat" partnerId={r.id} label="📜 심층 궁합" /></div>
        </div>
      ))}
      {adding ? (
        <form className="card" onSubmit={add} style={{ marginTop: 10 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>인물 등록</div>
          <div className="row"><div className="field"><label htmlFor="pn">이름</label><input id="pn" value={f.name} maxLength={12} onChange={(e) => set('name', e.target.value)} required /></div><div className="field"><label htmlFor="pr">관계</label><select id="pr" value={f.relation} onChange={(e) => set('relation', e.target.value)}>{['연인', '배우자', '친구', '가족', '동료', '지인'].map((x) => <option key={x}>{x}</option>)}</select></div></div>
          <div className="seg" style={{ marginBottom: 10 }}><button type="button" className={f.calendar === 'solar' ? 'on' : ''} onClick={() => set('calendar', 'solar')}>양력</button><button type="button" className={f.calendar === 'lunar' ? 'on' : ''} onClick={() => set('calendar', 'lunar')}>음력</button></div>
          <div className="field"><label htmlFor="pd">생년월일</label><input id="pd" type="date" value={f.date} min="1900-01-01" max="2100-12-31" onChange={(e) => set('date', e.target.value)} required /></div>
          {f.calendar === 'lunar' && <label className="check" style={{ marginBottom: 10 }}><input type="checkbox" checked={f.isLeapMonth} onChange={(e) => set('isLeapMonth', e.target.checked)} /><span>윤달</span></label>}
          <div className="row" style={{ alignItems: 'center', marginBottom: 10 }}><select aria-label="출생 시" disabled={f.hourUnknown} value={f.hour} onChange={(e) => set('hour', e.target.value)} className="inp">{Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}시</option>)}</select><label className="check"><input type="checkbox" checked={f.hourUnknown} onChange={(e) => set('hourUnknown', e.target.checked)} /><span>시간 모름</span></label></div>
          <div className="seg" style={{ marginBottom: 10 }}><button type="button" className={f.gender === 'female' ? 'on' : ''} onClick={() => set('gender', 'female')}>여성</button><button type="button" className={f.gender === 'male' ? 'on' : ''} onClick={() => set('gender', 'male')}>남성</button></div>
          {err && <div className="err" role="alert">{err}</div>}
          <div className="row"><button className="btn sm" disabled={busy}>{busy ? '계산 중…' : '등록하고 궁합 보기'}</button>{st.relationships.length > 0 && <button type="button" className="btn sm line" onClick={() => setAdding(false)}>취소</button>}</div>
        </form>
      ) : st.relationships.length < 5 && <button className="btn line block" style={{ marginTop: 6 }} onClick={() => setAdding(true)}>＋ 인물 추가 ({st.relationships.length}/5)</button>}
      <div className="note">상대의 생년월일은 궁합 계산에만 쓰이며, 상대 동의 없이 민감한 정보를 입력하지 않도록 주의해 주세요. 궁합 점수는 재미와 참고를 위한 지표예요.</div>
    </Sheet>
  );
}

// ───────── 타로의 정원 ─────────
export function TarotPanel() {
  const [info, setInfo] = useState<any>(null);
  const [draw, setDraw] = useState<any>(null);
  const [flipped, setFlipped] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { api('/api/tarot').then((j) => { setInfo(j); if (j.drawn) { setDraw(j.drawn); setFlipped(true); } }).catch((e) => setErr(e.message)); }, []);
  async function pick(pos: number) {
    if (busy || draw) return; setBusy(true);
    try { const j = await api('/api/tarot', { body: { position: pos } }); setDraw(j.draw); setTimeout(() => setFlipped(true), 60); useGame.getState().setState(j.state); useGame.getState().handleEvent(j.ev); const t = await api('/api/tarot'); setInfo(t); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  const b = BUILDINGS.find((x) => x.id === 'tarot')!;
  return (
    <Sheet title={b.name} sub={`오늘의 타로 · ${info?.date ?? ''}`} onClose={close}>
      {err && <div className="err">{err}</div>}
      {!info ? <div className="spin" style={{ margin: '30px auto' }} /> : <>
        {!draw ? <>
          <p className="muted" style={{ textAlign: 'center' }}>마음을 가라앉히고 오늘의 한 장을 골라 보세요.<br />하루에 한 번, 78장 중 하나를 뽑을 수 있어요.</p>
          <div className="tarot-grid">{Array.from({ length: 78 }, (_, i) => <button key={i} className="tcard" onClick={() => pick(i)} aria-label={`카드 ${i + 1}`} disabled={busy}>✦</button>)}</div>
        </> : <>
          <div className="flip"><div className={'flip-in' + (flipped ? ' on' : '')}><div className="flip-back">🌙</div><div className={'flip-front' + (draw.reversed ? ' rev' : '')}><div className="sym" style={{ fontSize: 44 }}>🃏</div><b style={{ marginTop: 8 }}>{draw.name}</b><small className="muted">{draw.name_en}</small><span className="tag" style={{ marginTop: 6, background: draw.reversed ? '#ffe1e0' : '#e4f6e9', borderRadius: 8, padding: '2px 8px', fontSize: 11 }}>{draw.reversed ? '역방향' : '정방향'}</span></div></div></div>
          <div className="card"><div className="lbl">카드 해석</div><b>{draw.reading}</b><p className="pre" style={{ margin: '8px 0 0' }}>{draw.advice}</p></div>
          {draw.personal && <div className="card" style={{ background: '#f7f0ff' }}><div className="lbl">나의 사주와 함께 보면</div>{draw.personal}</div>}
          <div className="note">타로는 재미와 영감을 위한 콘텐츠예요. 내일 다시 새로운 카드를 뽑을 수 있어요.</div>
        </>}
        {info.history.length > 0 && <><div className="sec-title">과거 카드 기록</div><ul className="bul">{info.history.map((h: any, i: number) => <li key={i}><b>{h.date}</b> · {h.name} ({h.reversed ? '역' : '정'}) <span className="muted">{h.keywords}</span></li>)}</ul></>}
      </>}
    </Sheet>
  );
}
