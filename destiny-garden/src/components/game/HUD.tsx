'use client';
import { useEffect, useRef } from 'react';
import { useGame } from '@/lib/client/store';
import { AVATARS, ROOMS, BUILDINGS } from '@/lib/game/world';
import { interactNear } from '@/lib/client/interact';
import { api } from '@/lib/client/api';

function Joystick() {
  const base = useRef<HTMLDivElement>(null), knob = useRef<HTMLElement>(null);
  const active = useRef<number | null>(null);
  const move = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    useGame.setState({ joy: { x: dx, y: dy }, target: null, pending: null });
    if (knob.current) knob.current.style.transform = `translate(${dx * 30}px, ${dy * 30}px)`;
  };
  const end = () => { active.current = null; useGame.setState({ joy: { x: 0, y: 0 } }); if (knob.current) knob.current.style.transform = ''; };
  return (
    <div ref={base} className="joy" role="application" aria-label="이동 조이스틱"
      onPointerDown={(e) => { active.current = e.pointerId; (e.target as Element).setPointerCapture?.(e.pointerId); move(e); }}
      onPointerMove={(e) => { if (active.current === e.pointerId) move(e); }} onPointerUp={end} onPointerCancel={end}>
      <i ref={knob as any} />
    </div>
  );
}

const SAGE_NAME: Record<string, string> = { sage: '운명의 현자', merchant: '재물의 현자', guardian: '인연의 현자', guide: '시간의 현자' };

export function HUD() {
  const st = useGame((s) => s.state)!;
  const near = useGame((s) => s.near); const panel = useGame((s) => s.panel); const toasts = useGame((s) => s.toasts); const room = useGame((s) => s.room);
  const reveal = useGame((s) => s.reveal);
  const open = useGame((s) => s.open);
  const av = AVATARS[st.profile?.avatar ?? 0];
  const rdef = room ? ROOMS.find((r) => r.id === room) : null;
  const rp = room ? st.rooms.find((r) => r.id === room) : null;
  const nextObj = rp && rdef ? (rdef.objects as any[]).find((o) => o.required && !rp.objects.find((x) => x.id === o.id)?.done) : null;
  const totalCards = Object.keys(st.cards).length;

  useEffect(() => { useGame.getState().fire('enter_garden'); }, []);
  useEffect(() => {
    const save = () => { const p = useGame.getState().player; navigator.sendBeacon?.('/api/position', new Blob([JSON.stringify({ x: p.x, z: p.z })], { type: 'application/json' })); };
    const iv = setInterval(() => { const g = useGame.getState(); if (g.room) return; api('/api/position', { body: { x: g.player.x, z: g.player.z } }).catch(() => {}); }, 8000);
    window.addEventListener('pagehide', save);
    return () => { clearInterval(iv); window.removeEventListener('pagehide', save); };
  }, []);

  const busy = !!panel || !!reveal;
  const bProg = near?.kind === 'building' ? st.rooms.find((r) => r.id === near.id) : null;
  const action = () => { if (!near) return; if (near.kind === 'building') open({ type: 'building', id: near.id }); else interactNear(near); };
  return (
    <>
      <div className="hud">
        <div className="hud-top">
          <div className="prof" role="button" tabIndex={0} onClick={() => open({ type: 'settings' })}>
            <div className="ph" style={{ background: av.robe }}>{['👧', '👦', '🧒'][av.id]}</div>
            <div><div className="nm">{st.profile?.nickname}</div><div className="lv">Lv.{st.profile?.level} {st.profile?.title}</div><div className="xp"><i style={{ width: `${st.profile?.into ?? 0}%` }} /></div></div>
          </div>
          <div className="cur">
            <button onClick={() => open({ type: 'shop' })} aria-label="질문권 구매" data-testid="tickets">🎫 <span>질문권 {st.wallet.tickets}</span><b>+</b></button>
            <button className="round" style={{ width: 40, height: 40, padding: 0, justifyContent: 'center' }} onClick={() => open({ type: 'settings' })} aria-label="설정">⚙️</button>
          </div>
        </div>
        {room && rdef && rp && <div className="room-bar"><div className="rn">{rdef.name}</div><button className="btn sm line" data-testid="exit-room" onClick={() => useGame.getState().exitRoom()}>나가기 ↩</button></div>}
        {room && rdef && rp ? (
          <div className="quest-card" style={{ top: 'calc(112px + env(safe-area-inset-top))' }} data-testid="room-quest">
            <span className="tag">{rdef.quest.title}</span> <b style={{ fontSize: 12 }}>카드 {rp.got}/{rp.required}</b>
            <div className="tt">{rp.complete ? (rp.sageUnlocked ? '모든 카드를 모았어요!' : '현자에게 말을 걸어 보세요') : `다음 목표: ${nextObj?.name ?? ''}`}</div>
            <div className="rw" style={{ color: '#6a5a8a' }}>{rp.sageUnlocked ? `✨ ${SAGE_NAME[rp.sageId]} 상담 해금` : `🔒 ${SAGE_NAME[rp.sageId]} 상담 잠김`}</div>
            <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none', fontSize: 12 }}>{rp.objects.filter((o) => o.required).map((o) => <li key={o.id} style={{ opacity: o.done ? 0.55 : 1 }}>{o.done ? '✅' : '⬜'} {(rdef.objects as any[]).find((x) => x.id === o.id)?.name}</li>)}</ul>
          </div>
        ) : (
          <button className="quest-card" onClick={() => open({ type: 'quests' })} style={{ cursor: 'pointer' }}>
            <span className="tag">전체 탐험</span> <b style={{ fontSize: 12 }}>카드 {totalCards}장 수집</b>
            {(() => { const r = st.rooms.find((x) => !x.complete); return r ? <><div className="tt">다음 목표: {r.name}</div><div className="rw" style={{ color: '#6a5a8a' }}>{r.got}/{r.required} · 건물에 가까이 가서 입장하세요</div></> : <div className="tt">모든 방의 카드를 모았어요!</div>; })()}
          </button>
        )}
        {!room && <button className="tarot-mini" onClick={() => open({ type: 'tarot' })} aria-label="오늘의 타로">{!st.todayTarot && <span className="dotn">N</span>}오늘의 타로<div className="mc">{st.todayTarot ? '🃏' : '🌙'}</div></button>}
        {near && !busy && (
          <div className="near" data-testid="near">
            <span>{near.kind === 'building' ? '🏛' : near.kind === 'sage' ? '🧙' : '🔎'} {near.label}{bProg ? ` · 탐험 ${bProg.got}/${bProg.required}${bProg.sageUnlocked ? ' · 상담 해금' : ' · 상담 잠김'}` : ''}</span>
            <button className="btn gold sm" data-testid="near-action" onClick={action}>{near.kind === 'building' ? '입장하기' : near.action}</button>
          </div>
        )}
        <div className="hint">{room ? '조이스틱 · WASD · 바닥 터치로 이동 / 빛나는 오브젝트에 다가가 보세요' : '조이스틱 · WASD · 바닥 터치로 이동 / 건물에 다가가 입장하세요'}</div>
        <Joystick />
        <div className="hud-bottom"><div className="dock">
          <button data-testid="dock-garden" onClick={() => { if (useGame.getState().room) useGame.getState().exitRoom(); else open(null); }}><span>🌸</span>정원</button>
          <button onClick={() => open({ type: 'quests' })}><span>📜</span>퀘스트</button>
          <button onClick={() => open({ type: 'codex' })}><span>📖</span>운명도감</button>
          <button onClick={() => open({ type: 'consult' })}><span>💬</span>상담{st.rooms.some((r) => r.sageUnlocked) && <i className="dot" style={{ background: '#6dd58c' }} />}</button>
          <button onClick={() => open({ type: 'shop' })}><span>🛒</span>상점</button>
        </div></div>
      </div>
      <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={'toast ' + t.kind}>{t.text}</div>)}</div>
    </>
  );
}
void BUILDINGS;
