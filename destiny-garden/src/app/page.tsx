'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/client/store';
import { AuthModal } from '@/components/AuthModal';

export default function Landing() {
  const router = useRouter();
  const { state, loaded, load } = useGame();
  const [auth, setAuth] = useState<null | 'signup' | 'login'>(null);
  useEffect(() => { load(); }, [load]);

  async function after() { const s = await load(); setAuth(null); router.push(s?.profile ? '/garden' : '/create'); }
  function start() { if (!state) setAuth('signup'); else router.push(state.profile ? '/garden' : '/create'); }

  return (
    <main className="screen landing">
      <div className="stars" /><div className="moon" />
      <div style={{ position: 'relative' }}>
        <h1 className="logo">운명의 정원</h1>
        <p className="logo-sub">나만의 운명 세계로 떠나는<br />사주 탐험</p>
      </div>
      <svg className="gate" viewBox="0 0 320 190" aria-hidden>
        <defs><radialGradient id="gl" cx="50%" cy="50%"><stop offset="0" stopColor="#ffe6a0" stopOpacity=".9" /><stop offset="1" stopColor="#ffe6a0" stopOpacity="0" /></radialGradient></defs>
        {[[30, 60], [60, 40], [260, 50], [290, 80], [20, 110], [300, 120]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={20 + (i % 3) * 8} fill="#d681d8" opacity=".55" />)}
        <ellipse cx="160" cy="150" rx="150" ry="26" fill="#3b2a6a" /><path d="M120 190 L150 120 H170 L200 190Z" fill="#9a8fc0" opacity=".5" />
        <rect x="95" y="72" width="130" height="10" rx="4" fill="#a8402f" /><rect x="100" y="82" width="120" height="8" fill="#3a2a5a" />
        <path d="M70 66 Q160 38 250 66 L240 76 Q160 54 80 76Z" fill="#2e3560" /><path d="M64 66 Q58 60 54 56 M256 66 Q262 60 266 56" stroke="#4a527f" strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="104" y="82" width="11" height="70" fill="#a8402f" /><rect x="205" y="82" width="11" height="70" fill="#a8402f" />
        <circle cx="160" cy="128" r="50" fill="url(#gl)" />
        {[[80, 140], [240, 140]].map(([x, y], i) => <g key={i}><rect x={x - 8} y={y} width="16" height="22" fill="#8d8aa0" /><rect x={x - 6} y={y - 14} width="12" height="14" fill="#ffd27a" /><circle cx={x} cy={y - 7} r="22" fill="url(#gl)" /></g>)}
      </svg>
      <div className="landing-actions">
        {!loaded ? <div className="spin" /> : (
          <>
            <button className="btn gold block" style={{ fontSize: 18, padding: '16px' }} onClick={start}>{state?.profile ? '정원으로 들어가기' : '나의 정원 만들기'}</button>
            {!state ? <button className="link" onClick={() => setAuth('login')}>이미 정원이 있어요 · 로그인</button>
              : <button className="link" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); useGame.setState({ state: null }); }}>로그아웃 ({state.user.email})</button>}
          </>
        )}
        <p style={{ fontSize: 11.5, color: '#bba9e6', margin: '6px 0 0', lineHeight: 1.5 }}>사주 해석은 명리학 기반의 참고 콘텐츠이며 결과를 보장하지 않습니다.<br />전생·영혼 이야기는 창작 콘텐츠입니다.</p>
      </div>
      {auth && <AuthModal initial={auth} onDone={after} onClose={() => setAuth(null)} />}
    </main>
  );
}
