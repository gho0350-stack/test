'use client';
import { useEffect, useRef } from 'react';
import { useGame } from '@/lib/client/store';
import { AVATARS } from '@/lib/game/world';
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

export function HUD() {
  const st = useGame((s) => s.state)!;
  const near = useGame((s) => s.near); const panel = useGame((s) => s.panel); const toasts = useGame((s) => s.toasts);
  const open = useGame((s) => s.open);
  const next = st.quests.find((q) => !q.done);
  const av = AVATARS[st.profile?.avatar ?? 0];

  // 입장 퀘스트 + 위치 저장
  useEffect(() => { useGame.getState().fire('enter_garden'); }, []);
  useEffect(() => {
    const save = () => { const p = useGame.getState().player; navigator.sendBeacon?.('/api/position', new Blob([JSON.stringify({ x: p.x, z: p.z })], { type: 'application/json' })) ?? api('/api/position', { body: p }); };
    const iv = setInterval(() => { const p = useGame.getState().player; api('/api/position', { body: { x: p.x, z: p.z } }).catch(() => {}); }, 8000);
    window.addEventListener('pagehide', save);
    return () => { clearInterval(iv); window.removeEventListener('pagehide', save); };
  }, []);

  const hasAlert = !st.todayTarot;
  return (
    <>
      <div className="hud">
        <div className="hud-top">
          <div className="prof" role="button" tabIndex={0} onClick={() => open({ type: 'settings' })}>
            <div className="ph" style={{ background: av.robe }}>{['👧', '👦', '🧒'][av.id]}</div>
            <div><div className="nm">{st.profile?.nickname}</div><div className="lv">Lv.{st.profile?.level} {st.profile?.title}</div><div className="xp"><i style={{ width: `${st.profile?.into ?? 0}%` }} /></div></div>
          </div>
          <div className="cur">
            <button onClick={() => open({ type: 'shop' })} aria-label="질문권 충전">💎 <span>{st.wallet.tickets}</span><b>+</b></button>
            <button onClick={() => open({ type: 'quests' })} aria-label="코인">🪙 <span>{st.wallet.coins}</span><b>+</b></button>
          </div>
        </div>
        <div className="hud-right" style={{ top: 'calc(66px + env(safe-area-inset-top))' }}>
          <button className="round" onClick={() => open({ type: 'notifications' })} aria-label="알림">🔔{hasAlert && <span className="dot" />}</button>
          <button className="round" onClick={() => open({ type: 'settings' })} aria-label="설정">⚙️</button>
        </div>
        {next && <button className="quest-card" onClick={() => open({ type: 'quests' })} style={{ cursor: 'pointer' }}><span className="tag">{next.order === 1 ? '첫 번째 퀘스트' : `퀘스트 ${next.order}`}</span><div className="tt">{next.title}</div><div className="rw">🪙 보상 +{next.reward.coins} 코인 · ✦ {next.reward.exp}EXP</div></button>}
        <button className="tarot-mini" onClick={() => open({ type: 'tarot' })} aria-label="오늘의 타로">{!st.todayTarot && <span className="dotn">N</span>}오늘의 타로<div className="mc">{st.todayTarot ? '🃏' : '🌙'}</div></button>
        {near && !panel && <div className="near"><span>{near.kind === 'npc' ? '💬' : '🏛'} {near.label}</span><button className="btn gold sm" onClick={() => open({ type: near.kind, id: near.id } as any)}>{near.kind === 'npc' ? '말 걸기' : '입장'}</button></div>}
        <div className="hint">조이스틱 · WASD · 바닥 터치로 이동 / 건물·NPC를 눌러 보세요</div>
        <Joystick />
        <div className="hud-bottom"><div className="dock">
          <button onClick={() => open({ type: 'quests' })}><span>📜</span>퀘스트{next && <i className="dot" />}</button>
          <button onClick={() => open({ type: 'bag' })}><span>👜</span>가방</button>
          <button onClick={() => open({ type: 'codex' })}><span>📖</span>운명도감</button>
          <button onClick={() => useGame.getState().goTo('building', 'sagehouse')}><span>💬</span>상담</button>
        </div></div>
      </div>
      <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={'toast ' + t.kind}>{t.text}</div>)}</div>
    </>
  );
}
