/**
 * 탐험 카드: 오브젝트를 열면 '이미 계산된 사주 결과'를 상징적으로 풀어 낸 개인화 카드가 생성된다.
 * 새로운 사주 계산은 하지 않고, 엔진 결과 + 규칙 DB + 명리 데이터만 사용한다(AI 비사용, 결정론적).
 */
import stems from '@data/heavenly_stems.json';
import elements from '@data/five_elements.json';
import tenGods from '@data/ten_gods.json';
import type { SajuChart } from './saju/engine';
import { dayPillarByCount, monthGanzhiList, yearGanzhi } from './saju/engine';
import { ELEMENT_HANJA, TEN_GODS, tenGodOf, type TenGod } from './saju/tables';
import { dayPillarInfo, matchRules, cycleGods, pastLifeOf } from './rules';
import { compareCharts } from './compat';

import { CATEGORIES, type Category } from './cards-meta';
export { CATEGORIES };
export type { Category };
export interface CardContent { name: string; subtitle: string; keywords: string[]; body: string; basis: string[] }
export interface CardCtx { today: string; partner?: { id: string; name: string; chart: SajuChart } | null }
interface Def { key: string; category: Category; icon: string; gen: (c: SajuChart, x: CardCtx) => CardContent }

const godInfo = (g: string) => tenGods.find((t) => t.id === g)!;
const ranked = (c: SajuChart) => [...TEN_GODS].sort((a, b) => c.tenGods[b] - c.tenGods[a] || TEN_GODS.indexOf(a) - TEN_GODS.indexOf(b));
const topGroup = (c: SajuChart) => Object.entries(c.tenGodGroups).sort((a, b) => b[1] - a[1])[0][0] as '비겁' | '식상' | '재성' | '관성' | '인성';
const rules = (c: SajuChart, t: 'wealth' | 'career' | 'relationship', n: number, x: CardCtx) => matchRules(c, t, Number(x.today.slice(0, 4)), n);
const GROUP_TYPE: Record<string, string> = { 비겁: '독립 개척자', 식상: '표현하는 창작자', 재성: '현실 감각의 설계자', 관성: '책임지는 리더', 인성: '깊이 배우는 학자' };

const DEFS: Def[] = [
  { key: 'essence_day', category: 'essence', icon: '🎴', gen: (c) => {
    const s: any = stems.find((x) => x.name === c.dayMaster.stem)!; const dp = dayPillarInfo(c.pillars.day.name);
    return { name: `나의 본질 : ${c.dayMaster.stem}${c.dayMaster.element}(${c.dayMaster.hanja}${ELEMENT_HANJA[c.dayMaster.element]})`, subtitle: `${dp.name}일주 · ${dp.title}`, keywords: [s.image, c.dayMaster.yang ? '양' : '음', c.animal + '띠'],
      body: `당신은 ‘${s.image}’의 기운을 타고났습니다.\n${dp.summary}\n주의할 점: ${s.caution}.`, basis: [`일간 ${c.dayMaster.stem}`, `일주 ${dp.name}`] }; } },
  { key: 'essence_element', category: 'essence', icon: '🌿', gen: (c) => {
    const e: any = elements.find((x) => x.id === c.elements.dominant)!; const w: any = elements.find((x) => x.id === c.elements.weakest)!;
    return { name: `${c.elements.dominant}(${ELEMENT_HANJA[c.elements.dominant]})의 기운`, subtitle: `가장 강한 오행 · ${e.attr}`, keywords: e.attr.split('·'),
      body: `당신의 사주에서는 ${c.elements.dominant} 기운이 가장 두드러집니다. 정원에서는 ‘${e.garden}’이 이 기운을 닮았어요.\n반대로 ${c.elements.weakest} 기운은 상대적으로 약해 '${w.lack}'을 의식적으로 채우면 균형이 좋아집니다. ${w.tip}`, basis: [`오행 분포 ${Object.entries(c.elements.withHidden).map(([k, v]) => k + v).join(' ')}`] }; } },
  { key: 'trait_tengod', category: 'essence', icon: '✨', gen: (c) => {
    const g = topGroup(c); const top = ranked(c)[0]; const t: any = godInfo(top);
    return { name: `성향 : ${GROUP_TYPE[g]}`, subtitle: `${g} 기운이 가장 강해요`, keywords: String(t.keywords).split('·'),
      body: `십성 중 ${g}(${Object.entries(c.tenGods).filter(([k]) => godInfo(k).group === g).map(([k, v]) => `${k}${v}`).join(' ')})이 가장 두텁습니다.\n${t.talent}을(를) 바탕으로 움직이는 편이고, 일간은 ${c.strength.level}입니다.`, basis: [`${g} ${c.tenGodGroups[g]}개`, `신강신약 ${c.strength.level}`] }; } },
  { key: 'talent_main', category: 'talent', icon: '📕', gen: (c) => {
    const t: any = godInfo(ranked(c)[0]); return { name: `타고난 재능 : ${t.id}`, subtitle: String(t.keywords), keywords: String(t.keywords).split('·'), body: `${t.talent}이(가) 당신의 가장 큰 재능입니다.\n일에서는 ${t.career}`, basis: [`십성 ${t.id} ${c.tenGods[t.id as TenGod]}개`] }; } },
  { key: 'talent_second', category: 'talent', icon: '📚', gen: (c) => {
    const t: any = godInfo(ranked(c)[1]); return { name: `또 하나의 재능 : ${t.id}`, subtitle: String(t.keywords), keywords: String(t.keywords).split('·'), body: `${t.talent}도 당신 안에 있어요.\n관계에서는 ${t.relationship}`, basis: [`십성 ${t.id} ${c.tenGods[t.id as TenGod]}개`] }; } },
  { key: 'hidden_story', category: 'essence', icon: '✉️', gen: (c) => {
    const dp = dayPillarInfo(c.pillars.day.name); const hid = c.pillars.day.hidden.map((h) => `${h.stem}(${h.tenGod})`).join(' · ');
    return { name: '나에게 숨겨진 이야기', subtitle: `일지 ${c.pillars.day.branchName} 속 지장간 ${hid}`, keywords: ['숨은 마음', '그림자', '성장'],
      body: `겉으로 드러나는 모습 아래에는 ${hid}의 기운이 숨어 있습니다.\n${dp.shadow}\n이 이야기를 알고 나면 스스로를 조금 더 너그럽게 볼 수 있어요.`, basis: [`일지 지장간 ${hid}`] }; } },

  { key: 'wealth_style', category: 'wealth', icon: '🔒', gen: (c, x) => { const r = rules(c, 'wealth', 3, x);
    return { name: '재물 형성 성향', subtitle: `재성 ${c.tenGodGroups.재성} · 식상 ${c.tenGodGroups.식상}`, keywords: ['재물을 만드는 방식', '강점'], body: r.map((x) => x.text).join('\n'), basis: r.map((x) => x.basis) }; } },
  { key: 'wealth_income', category: 'wealth', icon: '🧰', gen: (c) => {
    const e: any = elements.find((x) => x.id === c.elements.dominant)!; const t: any = godInfo(ranked(c)[0]);
    return { name: '수익을 만드는 방식', subtitle: `${t.id}의 재능 × ${c.elements.dominant} 기운`, keywords: String(e.job).split('·').slice(0, 3),
      body: `${t.wealth}\n${c.elements.dominant} 기운이 강해 ${e.job} 분야에서 기회가 재물과 연결되기 쉽습니다.`, basis: [`십성 ${t.id}`, `오행 최다 ${c.elements.dominant}`] }; } },
  { key: 'wealth_manage', category: 'wealth', icon: '📒', gen: (c, x) => { const r = rules(c, 'wealth', 8, x).filter((q) => q.id.includes('strength_') || q.id.includes('_miss_') || q.id.includes('_no_')).slice(0, 2);
    const keep = c.tenGods.겁재 >= 1 ? '지출·경쟁으로 새는 구멍을 막는 것이 핵심입니다.' : c.tenGods.정재 >= 1 ? '꾸준히 모으는 습관이 큰 자산입니다.' : '자동 저축처럼 시스템으로 지키는 방식이 잘 맞습니다.';
    return { name: '재물을 지키는 성향', subtitle: `일간 ${c.strength.level}`, keywords: ['관리', '유지'], body: `${keep}\n${r.map((q) => q.text).join('\n')}`, basis: [`신강신약 ${c.strength.level}`, ...r.map((q) => q.basis)] }; } },
  { key: 'wealth_type', category: 'wealth', icon: '🖼️', gen: (c, x) => {
    const biz = c.tenGods.편재 * 2 + c.tenGods.상관 + c.tenGods.겁재 + (c.strength.level.includes('강') ? 1 : 0);
    const exp = c.tenGods.정관 + c.tenGods.정인 + c.tenGods.편인 + c.tenGods.식신; const isBiz = biz >= exp; const r = rules(c, 'career', 2, x);
    return { name: isBiz ? '사업가형' : '전문가형', subtitle: isBiz ? '사람과 기회를 움직이는 유형' : '실력과 신뢰를 쌓는 유형', keywords: isBiz ? ['확장', '기회 포착', '실행'] : ['전문성', '신뢰', '깊이'],
      body: `${isBiz ? '변화를 만들고 사람과 돈의 흐름을 움직일 때 힘이 납니다.' : '한 분야에서 실력과 자격을 쌓아 인정받을 때 힘이 납니다.'}\n${r.map((q) => q.text).join('\n')}`, basis: [`사업 점수 ${biz} / 전문가 점수 ${exp}`] }; } },
  { key: 'wealth_key', category: 'wealth', icon: '🗝️', gen: (c, x) => { const cg = cycleGods(c, Number(x.today.slice(0, 4)));
    return { name: '황금 열쇠', subtitle: '재물 카드 3장을 모은 증표', keywords: ['해금', '심층 재물운'], body: `세 장의 재물 카드를 모아 황금 열쇠를 얻었어요.\n올해 세운은 ${cg.seun.name}(${cg.seunGod}). 이 열쇠로 현자의 집에서 재물에 대해 더 깊이 물어볼 수 있습니다. 심층 재물운 리포트는 재물의 방의 상점에서 열람할 수 있어요.`, basis: [`세운 ${cg.seun.name}`] }; } },

  { key: 'love_type', category: 'love', icon: '📮', gen: (c, x) => { const r = rules(c, 'relationship', 3, x); const dp = dayPillarInfo(c.pillars.day.name);
    return { name: '나에게 들어오는 인연의 유형', subtitle: dp.love_hint, keywords: ['인연', '끌림'], body: `${dp.love_hint}\n${r.map((q) => q.text).join('\n')}`, basis: r.map((q) => q.basis) }; } },
  { key: 'love_mirror', category: 'love', icon: '🪞', gen: (c, x) => { const r = rules(c, 'relationship', 8, x).filter((q) => q.id.includes('strength_') || q.id.includes('rel_') || q.id.includes('grp_')).slice(0, 2);
    return { name: '관계 속의 나', subtitle: `일간 ${c.strength.level}`, keywords: ['나의 모습', '관계 패턴'], body: `거울에 비친 나는 ${c.strength.level.includes('강') ? '주도적으로 이끄는' : c.strength.level === '중화' ? '균형을 맞추는' : '상대를 살피는'} 사람입니다.\n${r.map((q) => q.text).join('\n')}`, basis: r.map((q) => q.basis) }; } },
  { key: 'love_thread', category: 'love', icon: '🧵', gen: (c) => { const e: any = elements.find((x) => x.id === c.dayMaster.element)!;
    return { name: '붉은 실 · 인연 카드', subtitle: e.love, keywords: ['인연의 실', c.dayMaster.element + ' 기운'], body: `당신은 ${e.love}입니다.\n일지 ${c.pillars.day.branchName}(${c.pillars.day.tenGodBranch})은 가까운 관계에서의 모습을 비춥니다. 소중한 사람을 정자의 의자에 앉혀 두 사람의 실이 어떻게 얽히는지 볼 수 있어요.`, basis: [`일지 ${c.pillars.day.branchName}(${c.pillars.day.tenGodBranch})`] }; } },
  { key: 'love_secret', category: 'love', icon: '🚪', gen: (c) => ({ name: '비밀 정자의 약속', subtitle: '인연 카드 3장을 모은 증표', keywords: ['비밀', '약속'], body: `${c.dayMaster.stem}${c.dayMaster.element}의 당신에게 인연은 ‘천천히 깊어지는 것’입니다. 마음이 궁금한 사람이 있다면 현자의 집에서 그 사람을 선택해 물어보세요.`, basis: ['인연 카드 3장'] }) },

  { key: 'flow_daewoon', category: 'flow', icon: '⏳', gen: (c, x) => { const y = Number(x.today.slice(0, 4)); const cg = cycleGods(c, y); const d = cg.daewoon; const rl = matchRules(c, 'fortune', y, 6).filter((r) => r.id.startsWith('daewoon_'));
    const next = d ? c.daewoon.list[c.daewoon.list.indexOf(d) + 1] : c.daewoon.list[0];
    return { name: d ? `대운 : ${d.ganzhi}` : '대운 시작 전', subtitle: d ? `${d.startAge}세~ (${d.startYear}~${d.endYear}) · ${d.tenGodStem}` : `첫 대운은 ${c.daewoon.list[0].startAge}세 무렵 시작`, keywords: ['10년의 흐름', c.daewoon.forward ? '순행' : '역행'],
      body: `${rl.map((r) => r.text).join('\n') || '아직 첫 대운 시작 전의 시기예요.'}${next ? `\n다음 대운은 ${next.ganzhi}(${next.startAge}세~, ${next.tenGodStem})입니다.` : ''}`, basis: [`대운 ${d?.ganzhi ?? '-'}`] }; } },
  { key: 'flow_seun', category: 'flow', icon: '🕰️', gen: (c, x) => { const y = Number(x.today.slice(0, 4)); const cg = cycleGods(c, y); const rl = matchRules(c, 'fortune', y, 6).filter((r) => r.id.startsWith('seun_'));
    return { name: `${y}년 세운 : ${cg.seun.name}`, subtitle: `${cg.seun.animal}해 · 천간 ${cg.seunGod}`, keywords: ['올해의 흐름', cg.seunGod], body: rl.map((r) => r.text).join('\n'), basis: [`세운 ${cg.seun.name}(${cg.seunGod})`] }; } },
  { key: 'flow_wolun', category: 'flow', icon: '🗺️', gen: (c, x) => { const y = Number(x.today.slice(0, 4)); const ms = monthGanzhiList(y); const cur = [...ms].reverse().find((m) => m.begins.slice(0, 10) <= x.today) ?? ms[0];
    return { name: `이번 달의 흐름 : ${cur.ganzhi}월`, subtitle: `${cur.jie} 절기부터 · ${cur.begins.slice(0, 10)}`, keywords: ['월운', cur.ganzhi],
      body: `이번 달은 ${cur.ganzhi}의 기운입니다. 올해 전체는 ${yearGanzhi(y).name}년이에요.\n월운은 큰 흐름(대운·세운) 위에 얹히는 작은 파도로, 한 달 동안의 분위기를 읽는 참고로 삼으세요.`, basis: [`월운 ${cur.ganzhi} (${cur.jie})`] }; } },
  { key: 'flow_today', category: 'flow', icon: '🕯️', gen: (c, x) => { const [y, m, d] = x.today.split('-').map(Number); const dp = dayPillarByCount(y, m, d);
    const tg = tenGodOf(['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'].indexOf(c.dayMaster.stem), dp.index % 10);
    const t: any = godInfo(tg);
    return { name: `오늘의 운명 : ${tg}의 날`, subtitle: `${x.today} · 오늘의 일진 ${dp.name}일`, keywords: String(t.keywords).split('·'), body: `오늘의 일진은 ${dp.name}, 당신의 일간 ${c.dayMaster.stem}에게는 ${tg}의 기운입니다.\n${t.talent}이(가) 평소보다 도드라질 수 있는 날이에요. ${t.career}`, basis: [`오늘 일진 ${dp.name}`, `일간 대비 ${tg}`] }; } },
  { key: 'past_life', category: 'past', icon: '📖', gen: (c) => { const p = pastLifeOf(c);
    return { name: `전생의 기록 : ${p.era}의 ${p.title}`, subtitle: '창작 이야기', keywords: [p.title, p.era, p.element + ' 기운'], body: `${p.story}\n${p.carryover}\n\n※ ${p.disclaimer}`, basis: ['일간 오행과 월지로 매핑한 창작 데이터'] }; } },
];

export const CARD_DEFS = DEFS;
export const defOf = (key: string) => DEFS.find((d) => d.key === key || key.startsWith(d.key + ':'));
export const categoryOfKey = (key: string): Category => (key.startsWith('love_pair') ? 'love' : key.startsWith('consult:') ? 'consult' : (defOf(key)?.category ?? 'essence'));

export function generateCard(key: string, chart: SajuChart, ctx: CardCtx): CardContent {
  if (key.startsWith('love_pair:')) {
    const p = ctx.partner; if (!p) throw new Error('상대 정보가 필요합니다.'); const cmp = compareCharts(chart, p.chart);
    return { name: `나와 ${p.name}님의 관계 카드`, subtitle: `${cmp.label} · ${cmp.score}점`, keywords: [chart.dayMaster.stem + chart.dayMaster.element, p.chart.dayMaster.stem + p.chart.dayMaster.element, cmp.dayStemRelation],
      body: [...cmp.highlights.map((h) => '• ' + h), ...cmp.cautions.map((h) => '△ ' + h)].join('\n') || '두 사람의 관계 데이터를 읽었어요.', basis: [`일간 관계 ${cmp.dayStemRelation}`, `일지 관계 ${cmp.dayBranchRelation}`] };
  }
  const d = DEFS.find((x) => x.key === key.split(':')[0]); if (!d) throw new Error('알 수 없는 카드입니다.');
  return d.gen(chart, ctx);
}
/** 도감 슬롯 수(카테고리별): 상담 카드는 무제한이므로 제외 */
export const SLOTS = DEFS.reduce<Record<string, number>>((a, d) => ((a[d.category] = (a[d.category] ?? 0) + 1), a), {});
