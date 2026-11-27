/**
 * 만세력 풀이용 확장 분석 (결정론적, 클라이언트/서버 공용). lunar-javascript 비의존.
 * 12운성·공망·납음오행·신살·격국·용신(억부+조후)·세운표.
 * ※ 신살·격국·용신은 학파마다 기준이 다릅니다. 여기서는 널리 쓰이는 기준을 문서화(docs/SAJU_STANDARDS.md)하여 적용하며, 전문가 검수 전 상태입니다.
 */
import type { SajuChart } from './engine';
import { STEMS, BRANCHES, STEMS_HANJA, BRANCHES_HANJA, STEM_ELEMENT, BRANCH_ELEMENT, HIDDEN_STEMS, GENERATES, CONTROLS, ELEMENTS, TEN_GODS, TEN_GOD_GROUP, tenGodOf, toSexagenary, fromSexagenary, ganzhiName, ganzhiHanja, ANIMALS, type Element, type TenGod } from './tables';

export const STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'] as const;
const STAGE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3]; // 갑 해, 을 오, 병 인, 정 유, 무 인, 기 유, 경 사, 신 자, 임 신, 계 묘 (장생 지지)
export const stageOf = (stem: number, branch: number) => { const start = STAGE_START[stem]; const yang = stem % 2 === 0; const i = yang ? (branch - start + 12) % 12 : (start - branch + 12) % 12; return STAGES[i]; };
export const STAGE_MEANING: Record<string, string> = {
  장생: '새로 태어나 자라나는 기운. 시작과 성장의 힘', 목욕: '씻고 단장하는 시기. 감성·변화·유혹이 많음', 관대: '관을 쓰고 사회로 나아가는 기운. 자신감과 의욕',
  건록: '스스로 일어서 녹봉을 받는 기운. 자립과 실력', 제왕: '기운이 가장 왕성한 정점. 강한 주도력(과하면 독선)', 쇠: '정점을 지나 안정으로 접어드는 기운. 노련함',
  병: '힘이 약해지는 기운. 섬세함과 건강 관리 필요', 사: '활동이 멈추고 정리되는 기운. 사색과 마무리', 묘: '갈무리해 저장하는 기운. 축적과 보관',
  절: '끊어지고 새로 시작을 준비하는 기운. 극적인 전환', 태: '새 생명이 잉태되는 기운. 가능성과 준비', 양: '길러지는 기운. 보호받으며 성장 준비',
};

export const NAPEUM = ['해중금', '노중화', '대림목', '노방토', '검봉금', '산두화', '간하수', '성두토', '백랍금', '양류목', '천중수', '옥상토', '벽력화', '송백목', '장류수', '사중금', '산하화', '평지목', '벽상토', '금박금', '복등화', '천하수', '대역토', '차천금', '상자목', '대계수', '사중토', '천상화', '석류목', '대해수'];
export const napeum = (stem: number, branch: number) => NAPEUM[Math.floor(toSexagenary(stem, branch) / 2)];

/** 공망: 일주가 속한 순(旬)에서 비는 두 지지 */
export function gongmang(dayStem: number, dayBranch: number): number[] {
  const idx = toSexagenary(dayStem, dayBranch); const startBranch = (idx - (idx % 10) + 120) % 12;
  return [(startBranch + 10) % 12, (startBranch + 11) % 12];
}

// ── 신살 ──
const b = (...n: string[]) => n.map((x) => BRANCHES.indexOf(x as any));
const CHEONEUL: Record<number, number[]> = { 0: b('축', '미'), 4: b('축', '미'), 6: b('축', '미'), 1: b('자', '신'), 5: b('자', '신'), 2: b('해', '유'), 3: b('해', '유'), 7: b('인', '오'), 8: b('사', '묘'), 9: b('사', '묘') };
const MUNCHANG: Record<number, number> = { 0: 5, 1: 6, 2: 8, 3: 9, 4: 8, 5: 9, 6: 11, 7: 0, 8: 2, 9: 3 };
const YANGIN: Record<number, number> = { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 };
const group = (br: number) => (b('인', '오', '술').includes(br) ? 0 : b('신', '자', '진').includes(br) ? 1 : b('사', '유', '축').includes(br) ? 2 : 3);
const DOHWA = [3, 9, 6, 0], YEOKMA = [8, 2, 11, 5], HWAGAE = [10, 4, 1, 7];
const GOEGANG = ['경진', '경술', '임진', '무술'], BAEKHO = ['갑진', '을미', '병술', '정축', '무진', '임술', '계축'];
export interface Sinsal { name: string; where: string[]; meaning: string }
export const SINSAL_MEANING: Record<string, string> = {
  천을귀인: '어려울 때 귀인의 도움을 받는 대표적인 길신', 문창귀인: '학문·글·시험에 유리한 총명함의 길신', 양인살: '강한 추진력과 승부욕(과하면 날카로움)을 뜻하는 기운',
  도화살: '매력·인기·이성 인연이 두드러지는 기운', 역마살: '이동·여행·변화가 많고 활동 범위가 넓은 기운', 화개살: '예술·종교·학문에 끌리는 고독하고 깊은 기운',
  괴강살: '강인하고 결단력 있는 성정. 극단으로 치우치기 쉬움', 백호살: '급변과 돌발 상황에 단련되는 기운. 건강·안전 유의',
};
export function sinsal(c: SajuChart): Sinsal[] {
  const P = [['연', c.pillars.year], ['월', c.pillars.month], ['일', c.pillars.day], ['시', c.pillars.hour]] as const;
  const ds = c.pillars.day.stem, out: Sinsal[] = [];
  const push = (name: string, where: string[]) => { if (where.length) out.push({ name, where, meaning: SINSAL_MEANING[name] }); };
  const find = (pred: (br: number) => boolean) => P.filter(([, p]) => p && pred(p.branch)).map(([l, p]) => `${l}지 ${BRANCHES[p!.branch]}`);
  push('천을귀인', find((br) => (CHEONEUL[ds] ?? []).includes(br)));
  push('문창귀인', find((br) => br === MUNCHANG[ds]));
  if (YANGIN[ds] !== undefined) push('양인살', find((br) => br === YANGIN[ds]));
  const base = [c.pillars.day.branch, c.pillars.year.branch];
  const tri = (name: string, tbl: number[]) => { const hit = new Set<string>(); for (const bb of base) for (const [l, p] of P) if (p && p.branch === tbl[group(bb)] && !(bb === p.branch && false)) hit.add(`${l}지 ${BRANCHES[p.branch]}`); push(name, [...hit]); };
  tri('도화살', DOHWA); tri('역마살', YEOKMA); tri('화개살', HWAGAE);
  push('괴강살', P.filter(([, p]) => p && GOEGANG.includes(p.name)).map(([l, p]) => `${l}주 ${p!.name}`));
  push('백호살', P.filter(([, p]) => p && BAEKHO.includes(p.name)).map(([l, p]) => `${l}주 ${p!.name}`));
  return out;
}

// ── 격국 ──
export const GYEOKGUK_MEANING: Record<string, string> = {
  건록격: '스스로의 힘으로 일어서는 자수성가형. 독립·자립이 핵심', 양인격: '강한 추진력과 승부욕의 격. 절제하면 큰 힘, 지나치면 충돌',
  식신격: '재주와 표현, 여유와 먹거리·생산의 격', 상관격: '창의·언변·반골 기질의 격. 틀을 깨는 재능', 편재격: '큰 돈·사업·유동 자산의 격. 활동 반경이 넓음',
  정재격: '성실한 관리와 안정 수입의 격', 편관격: '압박 속에서 단련되는 도전·리더십의 격', 정관격: '질서·명예·조직 속 신뢰의 격', 편인격: '직관·특수 재능·독창적 사고의 격', 정인격: '학문·자격·보호와 귀인의 격',
};
export function gyeokguk(c: SajuChart) {
  const mb = c.pillars.month.branch, ds = c.pillars.day.stem; const main = HIDDEN_STEMS[mb][HIDDEN_STEMS[mb].length - 1];
  const god = tenGodOf(ds, main);
  const name = god === '비견' ? '건록격' : god === '겁재' ? '양인격' : `${god}격`;
  const visible = [c.pillars.year, c.pillars.hour, c.pillars.month].some((p) => p && p.stem === main);
  return { name, god, meaning: GYEOKGUK_MEANING[name], note: `월지 ${BRANCHES[mb]}의 정기 ${STEMS[main]}(${god})${visible ? '이(가) 천간에 드러나 격이 분명합니다' : ' 기준'}` };
}

// ── 용신(억부 + 조후, 참고) ──
const elementOfGroup = (dm: Element, g: '비겁' | '식상' | '재성' | '관성' | '인성'): Element => {
  if (g === '비겁') return dm; if (g === '식상') return GENERATES[dm]; if (g === '재성') return CONTROLS[dm];
  if (g === '관성') return (ELEMENTS.find((e) => CONTROLS[e] === dm) as Element); return ELEMENTS.find((e) => GENERATES[e] === dm) as Element;
};
export function yongsin(c: SajuChart) {
  const dm = c.dayMaster.element; const g = c.tenGodGroups;
  const strong = c.strength.ratio >= 0.5;
  const want: ('비겁' | '식상' | '재성' | '관성' | '인성')[] = strong ? ['재성', '관성', '식상'] : ['인성', '비겁'];
  const ranked = [...want].sort((a, bb) => g[a] - g[bb]); // 가장 부족한 것부터
  const main = ranked[0];
  const avoid = strong ? ['비겁', '인성'] : ['재성', '관성', '식상'];
  const mb = c.pillars.month.branch;
  const season = [2, 3, 4].includes(mb) ? '봄' : [5, 6, 7].includes(mb) ? '여름' : [8, 9, 10].includes(mb) ? '가을' : '겨울';
  const johu = season === '여름' ? '더운 계절 출생이라 수(水) 기운으로 식혀 주는 것이 좋습니다' : season === '겨울' ? '추운 계절 출생이라 화(火) 기운으로 데워 주는 것이 좋습니다' : season === '가을' ? '건조한 가을 출생이라 수·화의 균형이 도움이 됩니다' : '생동하는 봄 출생이라 큰 치우침은 없으나 균형 있는 보완이 좋습니다';
  return { mode: strong ? '억제(신강 → 기운을 덜어 내는 쪽)' : '부조(신약 → 기운을 북돋는 쪽)', main, mainElement: elementOfGroup(dm, main), candidates: ranked.map((x) => ({ group: x, element: elementOfGroup(dm, x), count: g[x] })), avoid: avoid.map((x) => `${x}(${elementOfGroup(dm, x as any)})`), season, johu };
}

// ── 세운/연도 간지 (lunar-javascript 없이) ──
export const yearPillar = (year: number) => { const [s, br] = fromSexagenary(((year - 4) % 60 + 60) % 60); return { stem: s, branch: br, name: ganzhiName(s, br), hanja: ganzhiHanja(s, br), animal: ANIMALS[br] }; };
export function seunTable(c: SajuChart, from: number, to: number) {
  const ds = c.pillars.day.stem, db = c.pillars.day.branch;
  return Array.from({ length: to - from + 1 }, (_, i) => {
    const y = from + i, p = yearPillar(y); const rel: string[] = [];
    if ((p.branch + 6) % 12 === db) rel.push('일지와 충'); if ((p.branch + 6) % 12 === c.pillars.year.branch) rel.push('연지와 충');
    return { year: y, ...p, age: y - c.solar.y + 1, stemGod: tenGodOf(ds, p.stem), branchGod: tenGodOf(ds, HIDDEN_STEMS[p.branch][HIDDEN_STEMS[p.branch].length - 1]), stage: stageOf(ds, p.branch), rel };
  });
}

export const percent = (c: SajuChart) => { const t = ELEMENTS.reduce((a, e) => a + c.elements.withHidden[e], 0) || 1; return Object.fromEntries(ELEMENTS.map((e) => [e, Math.round((c.elements.withHidden[e] / t) * 100)])) as Record<Element, number>; };

/** 투출: 지장간 중 천간에 같은 글자가 드러난 것 */
export function tuchul(c: SajuChart) {
  const stemsShown = [c.pillars.year.stem, c.pillars.month.stem, c.pillars.day.stem, c.pillars.hour?.stem].filter((x) => x !== undefined) as number[];
  const out: string[] = [];
  for (const [l, p] of [['연', c.pillars.year], ['월', c.pillars.month], ['일', c.pillars.day], ['시', c.pillars.hour]] as const) { if (!p) continue; for (const h of p.hidden) { const idx = STEMS.indexOf(h.stem as any); if (stemsShown.includes(idx) && h.role === '정기') out.push(`${l}지 ${BRANCHES[p.branch]}의 정기 ${h.stem}(${h.tenGod})이(가) 천간에 투출`); } }
  return out;
}

export function overview(c: SajuChart) {
  const gk = gyeokguk(c), ys = yongsin(c), ss = sinsal(c), pc = percent(c);
  const lines = [
    `${c.dayMaster.stem}${c.dayMaster.element}(${c.dayMaster.hanja}) 일간으로, ${c.strength.level}한 사주입니다. 월지 ${BRANCHES[c.pillars.month.branch]}에서 ${c.strength.deukryeong ? '힘을 얻었고(득령)' : '힘을 얻지 못했고(실령)'}, 오행은 ${c.elements.dominant}이 가장 강하며(${pc[c.elements.dominant]}%) ${c.elements.weakest}이 가장 약합니다(${pc[c.elements.weakest]}%).`,
    `격국은 ${gk.name}입니다. ${gk.meaning}.`,
    `${ys.mode} 관점에서 ${ys.main}(${ys.mainElement}) 기운을 보완하면 균형에 도움이 됩니다. ${ys.johu}.`,
    ss.length ? `주요 신살: ${ss.map((s) => s.name).join(', ')}.` : '두드러진 신살은 많지 않습니다.',
  ];
  return lines;
}
void BRANCH_ELEMENT; void STEM_ELEMENT; void STEMS_HANJA; void BRANCHES_HANJA; void TEN_GODS; void TEN_GOD_GROUP;
export type { TenGod };
