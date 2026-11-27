'use client';
import { useEffect, useState } from 'react';
import { Sheet, Tabs, EL_COLOR } from '../ui/kit';
import { api } from '@/lib/client/api';
import { useGame } from '@/lib/client/store';
import { ELEMENTS, STEMS, STEMS_HANJA, BRANCHES, BRANCHES_HANJA, ELEMENT_HANJA, type Element } from '@/lib/saju/tables';
import { stageOf, STAGE_MEANING, napeum, gongmang, sinsal, gyeokguk, yongsin, seunTable, percent, tuchul, overview } from '@/lib/saju/extra';
import type { SajuChart, Pillar } from '@/lib/saju/engine';
import branchRel from '@data/branch_relations.json';
import stemRel from '@data/stem_relations.json';

const close = () => useGame.getState().open(null);
const BG: Record<Element, string> = { 목: '#d8f0dc', 화: '#ffd9d6', 토: '#f6e7b8', 금: '#eceef6', 수: '#d6e4fb' };
const FG: Record<Element, string> = { 목: '#1f7a3a', 화: '#c0392b', 토: '#8a6a12', 금: '#4a4f6a', 수: '#1f4fa8' };
const hanjaStem = (n: string) => STEMS_HANJA[STEMS.indexOf(n as any)] ?? n;
const hanjaBranch = (n: string) => BRANCHES_HANJA[BRANCHES.indexOf(n as any)] ?? n;
const GROUP_EL = (c: SajuChart) => c.dayMaster.element;

/** 만세력 스타일 원국 표 (시·일·월·연) */
function ManseTable({ c }: { c: SajuChart }) {
  const cols: { label: string; p: Pillar | null; day?: boolean }[] = [{ label: '시주', p: c.pillars.hour }, { label: '일주', p: c.pillars.day, day: true }, { label: '월주', p: c.pillars.month }, { label: '연주', p: c.pillars.year }];
  const ds = c.pillars.day.stem; const gm = gongmang(ds, c.pillars.day.branch); const sin = sinsal(c);
  const tagsFor = (label: string) => sin.filter((s) => s.where.some((w) => w.startsWith(label[0] + '지') || w.startsWith(label[0] + '주'))).map((s) => s.name);
  const Row = ({ name, f }: { name: string; f: (x: (typeof cols)[number]) => React.ReactNode }) => <>{<div className="mrl">{name}</div>}{cols.map((x) => <div key={x.label + name} className={'mc' + (x.day ? ' day' : '')}>{x.p ? f(x) : <span style={{ opacity: 0.35 }}>?</span>}</div>)}</>;
  return (
    <div className="manse">
      <div className="mrl" />{cols.map((x) => <div key={x.label} className={'mh' + (x.day ? ' day' : '')}>{x.label}{x.day ? ' (나)' : ''}</div>)}
      <Row name="십성" f={(x) => x.p!.tenGodStem ?? '일간'} />
      <Row name="천간" f={(x) => <div className="big" style={{ background: BG[x.p!.stemElement], color: FG[x.p!.stemElement] }}>{STEMS_HANJA[x.p!.stem]}<small>{x.p!.stemName}·{x.p!.stemElement}{x.p!.stemYang ? '+' : '−'}</small></div>} />
      <Row name="지지" f={(x) => <div className="big" style={{ background: BG[x.p!.branchElement], color: FG[x.p!.branchElement] }}>{BRANCHES_HANJA[x.p!.branch]}<small>{x.p!.branchName}·{x.p!.branchElement}</small>{gm.includes(x.p!.branch) && !x.day && <i className="gm">공망</i>}</div>} />
      <Row name="십성" f={(x) => x.p!.tenGodBranch} />
      <Row name="지장간" f={(x) => <div className="hid">{x.p!.hidden.map((h) => <span key={h.stem + h.role} style={{ color: FG[h.element] }}>{hanjaStem(h.stem)}<small>{h.tenGod}</small></span>)}</div>} />
      <Row name="12운성" f={(x) => stageOf(ds, x.p!.branch)} />
      <Row name="납음" f={(x) => napeum(x.p!.stem, x.p!.branch)} />
      <Row name="신살" f={(x) => <span className="sin">{tagsFor(x.label).join(' ') || '–'}</span>} />
    </div>
  );
}

export function ChartBook() {
  const st = useGame((s) => s.state)!; const c = st.chart!;
  const [tab, setTab] = useState<'wongook' | 'analysis' | 'cycle' | 'elem'>('wongook');
  const [wolun, setWolun] = useState<any>(null);
  useEffect(() => { if (tab === 'cycle' && !wolun) api('/api/insight?topic=career').then(setWolun).catch(() => {}); }, [tab, wolun]);
  const year = Number(st.config.today.slice(0, 4)); const ds = c.pillars.day.stem;
  const pc = percent(c), gk = gyeokguk(c), ys = yongsin(c), ss = sinsal(c), gm = gongmang(ds, c.pillars.day.branch), tc = tuchul(c);
  const dp = st.dayPillar!; const age = year - c.solar.y + 1;
  const curDw = c.daewoon.list.find((d) => year >= d.startYear && year <= d.endYear);
  const relInfo = (t: string) => [...branchRel, ...stemRel].find((r: any) => t.startsWith(r.type.split('(')[0]))?.meaning;
  return (
    <Sheet title="나의 사주" sub={`${c.pillars.day.name}일주 · ${dp.title}`} onClose={close}
      tabs={<Tabs value={tab} onChange={setTab} items={[['wongook', '사주 원국'], ['analysis', '풀이'], ['cycle', '대운·세운'], ['elem', '오행·십성']]} />}>
      {tab === 'wongook' && <>
        <div className="muted" style={{ marginBottom: 8 }}>{c.input.calendar === 'lunar' ? `음력 ${c.input.year}.${c.input.month}.${c.input.day}${c.input.isLeapMonth ? '(윤)' : ''} → ` : ''}양력 {c.solar.y}.{c.solar.m}.{c.solar.d} {c.solar.hour != null ? `${String(c.solar.hour).padStart(2, '0')}:${String(c.solar.minute).padStart(2, '0')}` : '(시간 미상)'} · {c.animal}띠 · {c.input.gender === 'male' ? '남(乾)' : '여(坤)'} · 만 {year - c.solar.y}세 · 대운 {c.daewoon.forward ? '순행' : '역행'} {c.daewoon.startYears}세{c.daewoon.startMonths ? ` ${c.daewoon.startMonths}개월` : ''} 시작</div>
        <ManseTable c={c} />
        <div className="muted" style={{ marginTop: 6, fontSize: 11.5 }}>※ 12운성·십성은 일간 기준, 신살은 일간·일지·연지 기준이며 공망은 일주가 속한 순(旬)에서 비는 지지입니다({gm.map((i) => BRANCHES[i]).join('·')}).</div>
        {c.boundaries.warnings.map((w, i) => <div key={i} className="note">⚠ {w}</div>)}
        <div className="muted" style={{ fontSize: 11.5 }}>직전 절기 {c.boundaries.prevJie}({c.boundaries.prevJieAt}) · 다음 {c.boundaries.nextJie}({c.boundaries.nextJieAt})</div>
      </>}
      {tab === 'analysis' && <>
        <div className="card" style={{ background: '#f7f0ff' }}><div className="sec-title" style={{ marginTop: 0 }}>총론</div>{overview(c).map((l, i) => <p key={i} className="pre" style={{ margin: '0 0 8px' }}>{l}</p>)}</div>
        <div className="card"><div className="lbl">일주 해설 · {dp.name}({hanjaStem(dp.stem)}{hanjaBranch(dp.branch)}) {dp.title}</div><p className="pre" style={{ margin: '6px 0 0' }}>{dp.summary}{'\n'}{dp.shadow}</p></div>
        <div className="grid2">
          <div className="card"><div className="lbl">격국</div><b style={{ fontSize: 17 }}>{gk.name}</b><div className="muted">{gk.meaning}</div><div className="muted" style={{ fontSize: 11.5 }}>{gk.note}</div></div>
          <div className="card"><div className="lbl">신강신약</div><b style={{ fontSize: 17 }}>{c.strength.level}</b>
            <div className="bar" style={{ margin: '6px 0 2px', position: 'relative' }}><i style={{ width: `${c.strength.ratio * 100}%`, background: 'linear-gradient(90deg,#3f78e0,#d9a63a,#ee5b52)' }} /></div>
            <div className="muted" style={{ fontSize: 11.5 }}>점수 {c.strength.score}/{c.strength.max} · 득령 {c.strength.deukryeong ? '○' : '×'} 득지 {c.strength.deukji ? '○' : '×'} 득세 {c.strength.deukse ? '○' : '×'}</div></div>
        </div>
        <div className="card"><div className="lbl">용신(참고)</div><b>{ys.mode}</b>
          <div className="muted" style={{ marginTop: 4 }}>보완하면 좋은 기운: <b style={{ color: FG[ys.mainElement] }}>{ys.main}({ys.mainElement})</b> · 후보 {ys.candidates.map((x) => `${x.group}(${x.element}) ${x.count}개`).join(', ')}</div>
          <div className="muted">조심할 기운: {ys.avoid.join(', ')}</div><div className="muted">조후({ys.season}): {ys.johu}.</div></div>
        <div className="sec-title">오행 분포</div>
        {ELEMENTS.map((e) => <div key={e} className="barrow"><span className={'el-' + e}>{e}{ELEMENT_HANJA[e]}</span><div className="bar"><i style={{ width: `${pc[e]}%`, background: EL_COLOR[e] }} /></div><span>{pc[e]}%</span></div>)}
        <div className="sec-title">신살</div>
        {ss.length === 0 ? <div className="muted">두드러진 신살이 없습니다.</div> : <ul className="bul">{ss.map((s) => <li key={s.name}><b>{s.name}</b> <span className="muted">({s.where.join(', ')})</span><div className="muted">{s.meaning}</div></li>)}</ul>}
        <div className="sec-title">공망 · 투출</div>
        <div className="muted">일주 {c.pillars.day.name} 기준 공망 {gm.map((i) => `${BRANCHES[i]}(${BRANCHES_HANJA[i]})`).join(' · ')} — 해당 지지가 원국에 있으면 그 자리의 기운이 비어 있어 헛수고·허무함을 경계하라는 뜻으로 봅니다.</div>
        {tc.length > 0 && <ul className="bul" style={{ marginTop: 6 }}>{tc.map((t, i) => <li key={i}>{t}</li>)}</ul>}
        <div className="sec-title">합 · 충 · 형 · 파 · 해</div>
        {c.relations.length ? <ul className="bul">{c.relations.map((r, i) => <li key={i}><b>{r.type}</b> {r.members.join(' – ')}{r.element ? ` → ${r.element}` : ''}<div className="muted">{relInfo(r.type)}</div></li>)}</ul> : <div className="muted">원국에 뚜렷한 합충형파해가 없습니다.</div>}
        <div className="sec-title">12운성 해설 (일간 {c.dayMaster.stem} 기준)</div>
        <ul className="bul">{[['연지', c.pillars.year], ['월지', c.pillars.month], ['일지', c.pillars.day], ['시지', c.pillars.hour]].filter(([, p]) => p).map(([l, p]: any) => { const s = stageOf(ds, p.branch); return <li key={l}><b>{l} {p.branchName} · {s}</b><div className="muted">{STAGE_MEANING[s]}</div></li>; })}</ul>
        <div className="note">격국·용신·신살은 학파와 기준에 따라 해석이 달라질 수 있는 참고 풀이입니다. 해석 문장은 전문가 검수 전 초안이에요.</div>
      </>}
      {tab === 'cycle' && <>
        <div className="sec-title" style={{ marginTop: 0 }}>대운 <span className="muted">({c.daewoon.forward ? '순행' : '역행'} · {c.daewoon.startYears}세{c.daewoon.startMonths ? ` ${c.daewoon.startMonths}개월` : ''}부터)</span></div>
        <div className="tbl">
          <div className="th">나이</div><div className="th">간지</div><div className="th">십성</div><div className="th">12운성</div>
          {c.daewoon.list.map((d) => { const now = curDw?.startYear === d.startYear; return <div key={d.startYear} className={'tr' + (now ? ' now' : '')} style={{ display: 'contents' }}>
            <div>{d.startAge}~{d.startAge + 9}세<small>{d.startYear}~{d.endYear}</small></div>
            <div style={{ fontWeight: 800 }}><span style={{ color: FG[c.pillars.day.stemElement && (['목','목','화','화','토','토','금','금','수','수'] as Element[])[d.stem]] }}>{STEMS_HANJA[d.stem]}</span><span style={{ color: FG[(['수','토','목','목','토','화','화','토','금','금','토','수'] as Element[])[d.branch]] }}>{BRANCHES_HANJA[d.branch]}</span> <small>{d.ganzhi}{now ? ' · 현재' : ''}</small></div>
            <div>{d.tenGodStem}·{d.tenGodBranch}</div><div>{stageOf(ds, d.branch)}</div></div>; })}
        </div>
        <div className="sec-title">세운 ({year - 2}~{year + 7}년)</div>
        <div className="tbl">
          <div className="th">연도</div><div className="th">간지</div><div className="th">십성</div><div className="th">12운성·관계</div>
          {seunTable(c, year - 2, year + 7).map((y) => <div key={y.year} className={'tr' + (y.year === year ? ' now' : '')} style={{ display: 'contents' }}>
            <div>{y.year}<small>{y.age}세 · {y.animal}띠</small></div><div style={{ fontWeight: 800 }}>{y.hanja} <small>{y.name}{y.year === year ? ' · 올해' : ''}</small></div><div>{y.stemGod}·{y.branchGod}</div><div>{y.stage}{y.rel.length ? <small style={{ color: '#d9534f' }}>{y.rel.join(', ')}</small> : null}</div></div>)}
        </div>
        <div className="sec-title">월운 ({year}년)</div>
        {!wolun ? <div className="spin" style={{ margin: '14px auto' }} /> : <div className="grid2">{wolun.wolun.map((m: any) => <div key={m.month} className="card" style={{ marginBottom: 0, padding: '8px 12px' }}><b>{m.month}월</b> {m.ganzhi} <span className="muted">({m.jie} {m.begins.slice(5)})</span></div>)}</div>}
        {curDw && <p className="muted" style={{ marginTop: 10 }}>현재 만 {year - c.solar.y}세는 <b>{curDw.ganzhi} 대운</b>({curDw.tenGodStem}·{curDw.tenGodBranch}) 구간입니다.</p>}
      </>}
      {tab === 'elem' && <>
        <div className="sec-title" style={{ marginTop: 0 }}>오행 <span className="muted">(지장간 포함)</span></div>
        {ELEMENTS.map((e) => <div key={e} className="barrow"><span className={'el-' + e}>{e}</span><div className="bar"><i style={{ width: `${pc[e]}%`, background: EL_COLOR[e] }} /></div><span>{c.elements.withHidden[e]}</span></div>)}
        <div className="muted">가장 강한 오행 <b>{c.elements.dominant}</b> · 가장 약한 오행 <b>{c.elements.weakest}</b>{c.elements.missing.length ? ` · 비어 있는 오행 ${c.elements.missing.join(', ')}` : ''}</div>
        <div className="sec-title">십성</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{Object.entries(c.tenGods).map(([k, v]) => <span key={k} className="chip" style={{ opacity: v ? 1 : 0.4 }}>{k} {v}</span>)}</div>
        <div className="muted" style={{ marginTop: 8 }}>{Object.entries(c.tenGodGroups).map(([k, v]) => `${k}(${(({ 비겁: GROUP_EL(c), 식상: '', 재성: '', 관성: '', 인성: '' }) as any)[k] || ''}) ${v}`).join(' · ')}</div>
      </>}
    </Sheet>
  );
}
void branchRel;
