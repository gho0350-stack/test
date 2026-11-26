'use client';
import { useState } from 'react';
import { api } from '@/lib/client/api';

export function AuthModal({ initial = 'signup', onDone, onClose }: { initial?: 'signup' | 'login'; onDone: () => void; onClose: () => void }) {
  const [mode, setMode] = useState(initial);
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [consent, setConsent] = useState(false);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api(mode === 'signup' ? '/api/auth/signup' : '/api/auth/login', { body: { email, password: pw, consent } }); onDone(); }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }
  return (
    <div className="overlay" style={{ alignItems: 'center' }} onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="sheet" style={{ borderRadius: 24, maxWidth: 400, margin: 16 }} onSubmit={submit}>
        <div className="sheet-head"><h2>{mode === 'signup' ? '회원가입' : '로그인'}</h2><button type="button" className="x" onClick={onClose}>✕</button></div>
        <div className="sheet-body">
          <div className="field"><label htmlFor="em">이메일</label><input id="em" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" /></div>
          <div className="field"><label htmlFor="pw">비밀번호 (8자 이상)</label><input id="pw" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} /></div>
          {mode === 'signup' && <label className="check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>[필수] 개인정보(이메일, 출생 정보, 상담 내용)를 서비스 제공 목적으로 수집·이용하는 데 동의합니다. 출생 정보는 사주 계산에만 사용하며 설정에서 언제든 삭제할 수 있어요.</span></label>}
          {err && <div className="err" role="alert">{err}</div>}
          <button className="btn block" style={{ marginTop: 12 }} disabled={busy}>{busy ? '처리 중…' : mode === 'signup' ? '가입하고 시작하기' : '로그인'}</button>
          <button type="button" className="link" style={{ color: '#6a5a8a', display: 'block', margin: '10px auto 0' }} onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErr(''); }}>{mode === 'signup' ? '이미 계정이 있어요 → 로그인' : '처음이에요 → 회원가입'}</button>
        </div>
      </form>
    </div>
  );
}
