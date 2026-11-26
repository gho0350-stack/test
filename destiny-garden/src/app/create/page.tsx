'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api';
import { useGame } from '@/lib/client/store';
import { AVATARS } from '@/lib/game/world';

const Preview3D = dynamic(() => import('@/components/game/Preview3D'), { ssr: false, loading: () => <div className="spin" style={{ margin: '80px auto' }} /> });
const REGIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '해외'];

export default function Create() {
  const router = useRouter();
  const { state, loaded, load } = useGame();
  const [f, setF] = useState({ nickname: '', date: '1995-04-17', calendar: 'solar', isLeapMonth: false, hour: '14', minute: '30', hourUnknown: false, gender: 'female', region: '서울', longitudeCorrection: false, avatar: 0 });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (loaded && !state) router.replace('/'); }, [loaded, state, router]);
  useEffect(() => {
    const b: any = state?.birth, p = state?.profile; if (!b || !p) return;
    setF((x) => ({ ...x, nickname: p.nickname, avatar: p.avatar, date: `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`, calendar: b.calendar, isLeapMonth: !!b.isLeapMonth, hourUnknown: b.hour == null, hour: String(b.hour ?? 12), minute: String(b.minute ?? 0), gender: b.gender, region: b.region ?? '서울', longitudeCorrection: !!b.longitudeCorrection }));
  }, [state?.birth, state?.profile]);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const [y, m, d] = f.date.split('-').map(Number);
    if (!y || !m || !d) return setErr('생년월일을 입력해 주세요.');
    setBusy(true);
    try {
      const j = await api('/api/character', { body: { nickname: f.nickname, avatar: f.avatar, year: y, month: m, day: d, calendar: f.calendar, isLeapMonth: f.isLeapMonth, hour: f.hourUnknown ? null : Number(f.hour), minute: f.hourUnknown ? null : Number(f.minute), hourUnknown: f.hourUnknown, gender: f.gender, region: f.region, longitudeCorrection: f.longitudeCorrection } });
      useGame.setState({ state: j.state }); useGame.getState().handleEvent(j.ev);
      router.push('/garden');
    } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }
  if (!loaded || !state) return <div className="loading"><div className="spin" />정원으로 가는 길을 찾는 중…</div>;
  return (
    <main className="screen form-screen">
      <form className="form-wrap" onSubmit={submit}>
        <h1>나를 알려주세요</h1>
        <p className="sub">생년월일시로 사주를 계산해 나만의 캐릭터와 운명 카드를 만들어요</p>
        <div className="card">
          <div className="preview3d"><Preview3D id={f.avatar} /></div>
          <div className="avatar-pick" role="radiogroup" aria-label="캐릭터 외형">
            {AVATARS.map((a) => <button type="button" key={a.id} className={f.avatar === a.id ? 'on' : ''} onClick={() => set('avatar', a.id)} role="radio" aria-checked={f.avatar === a.id}><div style={{ width: 28, height: 28, borderRadius: '50%', background: a.robe, margin: '0 auto 4px', border: '2px solid ' + a.trim }} />{a.name}</button>)}
          </div>
          <div className="field" style={{ marginTop: 12, marginBottom: 0 }}><label htmlFor="nk">이름 또는 닉네임</label><input id="nk" value={f.nickname} maxLength={12} onChange={(e) => set('nickname', e.target.value)} required placeholder="예) 하늘" /></div>
        </div>
        <div className="card">
          <div className="field"><label>달력 기준</label><div className="seg"><button type="button" className={f.calendar === 'solar' ? 'on' : ''} onClick={() => set('calendar', 'solar')}>양력</button><button type="button" className={f.calendar === 'lunar' ? 'on' : ''} onClick={() => set('calendar', 'lunar')}>음력</button></div></div>
          <div className="field"><label htmlFor="bd">생년월일{f.calendar === 'lunar' ? ' (음력)' : ''}</label><input id="bd" type="date" value={f.date} min="1900-01-01" max="2100-12-31" onChange={(e) => set('date', e.target.value)} required /></div>
          {f.calendar === 'lunar' && <label className="check" style={{ marginBottom: 12 }}><input type="checkbox" checked={f.isLeapMonth} onChange={(e) => set('isLeapMonth', e.target.checked)} /><span>윤달이에요</span></label>}
          <div className="field"><label>출생 시간 (선택)</label>
            <div className="row"><select aria-label="시" value={f.hour} disabled={f.hourUnknown} onChange={(e) => set('hour', e.target.value)}>{Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}시</option>)}</select>
              <select aria-label="분" value={f.minute} disabled={f.hourUnknown} onChange={(e) => set('minute', e.target.value)}>{Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}분</option>)}</select></div>
            <label className="check" style={{ marginTop: 6 }}><input type="checkbox" checked={f.hourUnknown} onChange={(e) => set('hourUnknown', e.target.checked)} /><span>태어난 시간을 몰라요 (시주는 임의로 만들지 않고 제외해요)</span></label></div>
          <div className="field"><label htmlFor="rg">출생 지역 (선택)</label><select id="rg" value={f.region} onChange={(e) => set('region', e.target.value)}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select>
            <label className="check" style={{ marginTop: 6 }}><input type="checkbox" checked={f.longitudeCorrection} disabled={f.hourUnknown} onChange={(e) => set('longitudeCorrection', e.target.checked)} /><span>출생지 경도 기준 시각 보정(진태양시) 적용 — 일반 만세력과 시주가 달라질 수 있어요</span></label></div>
          <div className="field" style={{ marginBottom: 0 }}><label>성별</label><div className="seg"><button type="button" className={f.gender === 'female' ? 'on' : ''} onClick={() => set('gender', 'female')}>여성</button><button type="button" className={f.gender === 'male' ? 'on' : ''} onClick={() => set('gender', 'male')}>남성</button></div></div>
        </div>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn gold block" style={{ fontSize: 17, padding: 16 }} disabled={busy}>{busy ? '운명을 계산하는 중…' : state.profile ? '다시 계산하고 저장하기' : '운명의 캐릭터 만들기 ★'}</button>
        {state.profile && <button type="button" className="btn line block" style={{ marginTop: 10 }} onClick={() => router.push('/garden')}>취소하고 정원으로</button>}
      </form>
    </main>
  );
}
