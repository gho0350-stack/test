'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, PillarCell, EL_COLOR, won } from '../ui/kit';
import { api } from '@/lib/client/api';
import { useGame } from '@/lib/client/store';
import products from '@data/products.json';
import { ProductAction } from './Buildings';

const close = () => useGame.getState().open(null);

// ───────── 퀘스트 (공간별) ─────────
export function Quests() {
  const st = useGame((s) => s.state)!;
  const done = st.quests.filter((q) => q.done).length;
  return (
    <Sheet title="퀘스트" sub={`${done} / ${st.quests.length} 완료`} onClose={close}>
      <div className="sec-title" style={{ marginTop: 0 }}>공간별 탐험</div>
      {st.rooms.map((r) => (
        <div key={r.id} className="q-item" style={{ display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="tt">{r.name}</div><div className="rw">{r.got}/{r.required}{r.sageUnlocked ? ' · 상담 해금' : ''}</div></div>
          <div className="bar" style={{ margin: '8px 0 6px' }}><i style={{ width: `${(r.got / r.required) * 100}%`, background: 'linear-gradient(90deg,#8a5fe0,#f5c451)' }} /></div>
          <button className="btn sm line" onClick={() => { useGame.getState().open(null); useGame.getState().goTo('building', r.id); }}>{useGame.getState().room === r.id ? '이 방에서 탐험 중' : '이 방으로 가기'}</button>
        </div>
      ))}
      <div className="sec-title">퀘스트</div>
      {st.quests.map((q) => <div key={q.id} className={'q-item' + (q.done ? ' done' : '')}><div className="ck">{q.done ? '✓' : ''}</div><div><div className="tt">{q.title}</div><div className="hh">{q.hint}</div></div><div className="rw">✦ {q.reward.exp}EXP</div></div>)}
      <p className="muted">경험치는 카드를 발견하거나 퀘스트를 완료하면 쌓여요. 레벨과 칭호는 탐험 성취를 나타내며 사주의 우열과는 무관해요.</p>
    </Sheet>
  );
}

// ───────── 상점/결제 ─────────
declare global { interface Window { TossPayments?: any } }
export function Shop({ focus, partnerId }: { focus?: string; partnerId?: string | null }) {
  const st = useGame((s) => s.state)!;
  const [cfg, setCfg] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [partner, setPartner] = useState(partnerId ?? st.relationships[0]?.id ?? '');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const load = () => api('/api/shop/config').then(setCfg).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const toss = useRef<any>(null);

  async function buy(p: any) {
    setErr(''); setBusy(true);
    try {
      const o = await api('/api/shop/order', { body: { productId: p.id, partnerId: p.needs_partner ? partner : null } });
      setOrder({ ...o, product: p });
      if (o.mode === 'toss') await mountToss(o);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  async function mountToss(o: any) {
    if (!window.TossPayments) await new Promise<void>((res, rej) => { const s = document.createElement('script'); s.src = 'https://js.tosspayments.com/v2/standard'; s.onload = () => res(); s.onerror = () => rej(new Error('결제 모듈을 불러오지 못했어요.')); document.head.appendChild(s); });
    const tp = window.TossPayments(o.clientKey);
    const widgets = tp.widgets({ customerKey: st.user.id.replace(/[^A-Za-z0-9\-_=.@]/g, '_').slice(0, 50) });
    await widgets.setAmount({ currency: 'KRW', value: o.amount });
    await Promise.all([widgets.renderPaymentMethods({ selector: '#toss-methods', variantKey: 'DEFAULT' }), widgets.renderAgreement({ selector: '#toss-agree', variantKey: 'AGREEMENT' })]);
    toss.current = widgets;
  }
  async function payToss() {
    try { await toss.current.requestPayment({ orderId: order.orderId, orderName: order.orderName, successUrl: location.origin + '/pay/success', failUrl: location.origin + '/pay/fail' }); } catch (e: any) { setErr(e.message); }
  }
  async function approveMock() {
    setBusy(true); setErr('');
    try { const j = await api('/api/shop/confirm', { body: { paymentKey: 'mock_' + order.orderId, orderId: order.orderId, amount: order.amount } }); useGame.getState().setState(j.state); useGame.getState().toast(`결제 완료! ${order.product.name}`, 'quest'); setOrder(null); load(); if (order.product.kind === 'report') useGame.getState().open({ type: 'report', kind: order.product.report, partnerId: order.product.needs_partner ? partner : null }); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  async function cancelOrder() { if (order) await api('/api/shop/fail', { body: { orderId: order.orderId } }).catch(() => {}); setOrder(null); load(); }
  async function refund(id: string) {
    if (!confirm('이 주문을 환불할까요? 질문권은 회수돼요.')) return;
    try { const j = await api('/api/shop/refund', { body: { orderId: id } }); useGame.getState().setState(j.state); useGame.getState().toast('환불이 완료되었어요'); load(); } catch (e: any) { setErr(e.message); }
  }
  if (order) return (
    <Sheet title="결제" sub={order.orderName} onClose={cancelOrder}>
      <div className="pay-mock"><div className="muted">주문번호 {order.orderId}</div><div className="amt">{won(order.amount)}</div></div>
      {order.mode === 'mock' ? <>
        <div className="note">🧪 테스트 결제입니다. 실제로 결제되지 않아요. (토스페이먼츠 키 설정 시 실제 결제창이 나타납니다)</div>
        {err && <div className="err" role="alert">{err}</div>}
        <div className="row"><button className="btn gold" onClick={approveMock} disabled={busy}>{busy ? '승인 중…' : '테스트 결제 승인'}</button><button className="btn line" onClick={cancelOrder}>취소</button></div>
      </> : <>
        <div id="toss-methods" /><div id="toss-agree" />
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn gold block" onClick={payToss}>{won(order.amount)} 결제하기</button>
      </>}
    </Sheet>
  );
  const items = (cfg?.products ?? products) as any[];
  const owned = (p: any) => st.entitlements.some((e) => e.productId === p.id && (!p.needs_partner || e.partnerId === partner));
  const group = (kind: string) => items.filter((p) => p.kind === kind);
  const row = (p: any) => (
    <div className="prod" key={p.id} style={p.id === focus ? { outline: '2.5px solid var(--gold)' } : undefined}>
      <div className="ic">{p.kind === 'ticket' ? '🎫' : '📜'}</div>
      <div><div className="nm">{p.name}{p.badge && <span className="badge">{p.badge}</span>}</div><div className="ds">{p.desc}</div></div>
      {owned(p) ? <button className="btn sm gold" style={{ marginLeft: 'auto' }} onClick={() => useGame.getState().open({ type: 'report', kind: p.report, partnerId: p.needs_partner ? partner : null })}>열람</button>
        : <button className="btn sm" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }} disabled={busy || cfg?.mode === 'disabled' || (p.needs_partner && !partner)} onClick={() => buy(p)}>{won(p.price)}</button>}
    </div>
  );
  return (
    <Sheet title="상점" sub={`보유 질문권 ${st.wallet.tickets}개`} onClose={close}>
      {cfg?.mode === 'mock' && <div className="note">🧪 테스트 결제 모드예요. 실제 결제가 일어나지 않아요.</div>}
      {cfg?.mode === 'disabled' && <div className="note">결제가 아직 열리지 않았어요.</div>}
      {err && <div className="err" role="alert">{err}</div>}
      <div className="sec-title" style={{ marginTop: 0 }}>🎫 질문권 <span className="muted">(NPC 상담 1회 = 1장, 심층 분석 = 2장)</span></div>{group('ticket').map(row)}
      <div className="sec-title">📜 심층 리포트 <span className="muted">(한 번 구매하면 계속 열람)</span></div>
      {st.relationships.length > 0 && <select className="inp" style={{ marginBottom: 8 }} aria-label="궁합 상대" value={partner} onChange={(e) => setPartner(e.target.value)}>{st.relationships.map((r) => <option key={r.id} value={r.id}>궁합 상대: {r.name}</option>)}</select>}
      {group('report').map(row)}
      {(cfg?.orders?.length ?? 0) > 0 && <><div className="sec-title">주문 내역</div>{cfg.orders.map((o: any) => <div className="q-item" key={o.id}><div><div className="tt">{o.name}</div><div className="hh">{new Date(o.at).toLocaleString('ko-KR')} · {won(o.amount)} · {({ paid: '결제완료', refunded: '환불됨', pending: '대기', failed: '실패' } as any)[o.status]}</div></div>{o.refundable && <button className="btn sm line" style={{ marginLeft: 'auto' }} onClick={() => refund(o.id)}>환불</button>}</div>)}</>}
      <div className="note">디지털 콘텐츠는 열람 전 미사용 상태에서 환불 가능하며, 사용한 질문권/열람한 리포트는 환불되지 않아요.</div>
    </Sheet>
  );
}

// ───────── 리포트 ─────────
export function ReportView({ kind, partnerId }: { kind: string; partnerId?: string | null }) {
  const [r, setR] = useState<any>(null); const [err, setErr] = useState('');
  useEffect(() => { api(`/api/reports/${kind}${partnerId ? `?partnerId=${partnerId}` : ''}`).then((j) => setR(j.report)).catch((e) => setErr(e.message)); }, [kind, partnerId]);
  return (
    <Sheet title={r?.title ?? '리포트'} sub={r?.summary} onClose={close}>
      {err && <div className="err" role="alert">{err}</div>}
      {!r && !err && <div style={{ textAlign: 'center', padding: 30 }}><div className="spin" style={{ margin: '0 auto 10px' }} /><div className="muted">리포트를 정성껏 쓰는 중이에요…</div></div>}
      {r && <>{r.sections.map((s: any, i: number) => <div key={i} className="card"><div className="sec-title" style={{ marginTop: 0 }}>{s.title}</div><div className="pre">{s.body}</div></div>)}<div className="note">{r.disclaimer}{r.source === 'offline' ? ' (개발·테스트 모드: 규칙 DB 기반 초안)' : ''}</div></>}
    </Sheet>
  );
}

// ───────── 설정/알림 ─────────
export function Settings() {
  const st = useGame((s) => s.state)!; const quality = useGame((s) => s.quality); const router = useRouter();
  const [busy, setBusy] = useState(false);
  const c = st.chart!;
  return (
    <Sheet title="설정" onClose={close}>
      <div className="card"><div className="lbl">계정</div><b>{st.user.email}</b><div className="muted">닉네임 {st.profile?.nickname} · Lv.{st.profile?.level}</div></div>
      <div className="card"><div className="lbl">출생 정보</div>{c.input.calendar === 'lunar' ? '음력' : '양력'} {c.input.year}.{c.input.month}.{c.input.day}{c.input.isLeapMonth ? '(윤달)' : ''} {c.meta.hourKnown ? `${c.input.hour}:${String(c.input.minute ?? 0).padStart(2, '0')}` : '시간 미상'} · {c.input.region}
        <div style={{ marginTop: 8 }}><button className="btn sm line" onClick={() => { close(); router.push('/create'); }}>출생 정보 수정</button></div></div>
      <div className="card"><div className="lbl">계산 기준</div><div className="muted">{c.meta.engine}<br />월주는 절기(節) 시각 기준, 일주는 자정 기준{c.input.nightZi === 'next_day' ? '(야자시 익일 처리)' : ''}. 상세 기준은 docs/SAJU_STANDARDS.md 에 있어요.{c.correctionMinutes ? ` 진태양시 보정 ${c.correctionMinutes}분 적용.` : ''}</div></div>
      <div className="card"><div className="lbl">그래픽 품질</div><div className="seg"><button className={quality === 'high' ? 'on' : ''} onClick={() => { useGame.getState().setQuality('high'); }}>높음 (그림자·빛 번짐)</button><button className={quality === 'low' ? 'on' : ''} onClick={() => { useGame.getState().setQuality('low'); }}>낮음 (성능 우선)</button></div><div className="muted" style={{ marginTop: 6 }}>화면이 끊기면 ‘낮음’을 선택하세요.</div></div>
      <div className="card"><div className="lbl">AI / 결제 모드</div><div className="muted">AI: {st.config.aiMode === 'openai' ? 'OpenAI 연결됨' : '오프라인(규칙 DB, 개발용)'} · 결제: {st.config.payMode === 'toss' ? '토스페이먼츠' : st.config.payMode === 'mock' ? '테스트(가상 결제)' : '비활성'}</div></div>
      <button className="btn line block" style={{ marginBottom: 10 }} disabled={busy} onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); useGame.setState({ state: null, panel: null }); router.push('/'); }}>로그아웃</button>
      <button className="btn block" style={{ background: '#d9534f' }} disabled={busy} onClick={async () => { if (!confirm('계정과 출생 정보·상담 기록이 모두 삭제돼요. 계속할까요?')) return; setBusy(true); await api('/api/account', { method: 'DELETE' }); useGame.setState({ state: null, panel: null }); router.push('/'); }}>계정 및 개인정보 삭제</button>
    </Sheet>
  );
}
void ProductAction;
