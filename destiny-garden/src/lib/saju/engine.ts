/**
 * 결정론적 사주 계산 엔진 (LLM 미사용).
 * 천문 계산(절기 시각·음양력 변환)은 lunar-javascript, 나머지 명리 규칙은 이 파일에서 직접 계산한다.
 * 기준 문서: docs/SAJU_STANDARDS.md
 */
import { Solar, Lunar } from 'lunar-javascript';
import {
  STEMS, BRANCHES, STEMS_HANJA, BRANCHES_HANJA, ANIMALS, STEM_ELEMENT, BRANCH_ELEMENT, HIDDEN_STEMS, ELEMENTS,
  TEN_GODS, TEN_GOD_GROUP, tenGodOf, stemYang, SIX_COMBINE, TRIPLE_COMBINE, DIRECTIONAL_COMBINE, CLASH, PUNISH_TRIPLE,
  PUNISH_PAIR, SELF_PUNISH, BREAK, HARM, STEM_COMBINE, STEM_CLASH, monthStemStart, fromSexagenary, toSexagenary,
  ganzhiName, REGION_LONGITUDE, type Element, type TenGod,
} from './tables';

export type Gender = 'female' | 'male';
export interface BirthInput {
  year: number; month: number; day: number;
  calendar: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  /** 출생 시각. null/undefined 이면 시주를 계산하지 않는다(임의 생성 금지). */
  hour?: number | null; minute?: number | null;
  gender: Gender;
  region?: string;
  /** 출생지 경도 기준 진태양시 보정(동경 135° 대비). 기본 false */
  longitudeCorrection?: boolean;
  /** 23:00~23:59(야자시) 일주 처리. 기본 same_day(일주는 자정 교체) */
  nightZi?: 'same_day' | 'next_day';
}

export interface Pillar {
  stem: number; branch: number;
  name: string; hanja: string;
  stemName: string; branchName: string;
  stemElement: Element; branchElement: Element;
  stemYang: boolean;
  /** 일주의 천간은 일간(나) 이므로 null */
  tenGodStem: TenGod | null;
  tenGodBranch: TenGod;
  hidden: { stem: string; element: Element; tenGod: TenGod; role: '여기' | '중기' | '정기' }[];
}
export interface Relation { type: string; kind: '합' | '충' | '형' | '파' | '해'; members: string[]; element?: Element; note?: string }
export interface DaewoonItem { ganzhi: string; stem: number; branch: number; startAge: number; startYear: number; endYear: number; tenGodStem: TenGod; tenGodBranch: TenGod }
export interface SajuChart {
  input: BirthInput;
  solar: { y: number; m: number; d: number; hour: number | null; minute: number | null };
  lunar: { y: number; m: number; d: number; leap: boolean; text: string };
  correctionMinutes: number;
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null };
  dayMaster: { stem: string; hanja: string; element: Element; yang: boolean };
  animal: string;
  elements: { visible: Record<Element, number>; withHidden: Record<Element, number>; dominant: Element; weakest: Element; missing: Element[] };
  tenGods: Record<TenGod, number>;
  tenGodGroups: Record<'비겁' | '식상' | '재성' | '관성' | '인성', number>;
  strength: { score: number; max: number; ratio: number; level: '극신강' | '신강' | '중화' | '신약' | '극신약'; deukryeong: boolean; deukji: boolean; deukse: boolean };
  relations: Relation[];
  daewoon: { forward: boolean; startYears: number; startMonths: number; startDays: number; list: DaewoonItem[] };
  boundaries: { prevJie: string; prevJieAt: string; nextJie: string; nextJieAt: string; warnings: string[] };
  meta: { engine: string; hourKnown: boolean; sect: number };
}

const pad = (n: number) => String(n).padStart(2, '0');
const stemIdx = (c: string) => (STEMS_HANJA as readonly string[]).indexOf(c);
const branchIdx = (c: string) => (BRANCHES_HANJA as readonly string[]).indexOf(c);

export function makePillar(stem: number, branch: number, dayStem: number | null): Pillar {
  const ds = dayStem ?? stem;
  const hs = HIDDEN_STEMS[branch];
  const roles: ('여기' | '중기' | '정기')[] = hs.length === 3 ? ['여기', '중기', '정기'] : ['여기', '정기'];
  return {
    stem, branch,
    name: ganzhiName(stem, branch), hanja: STEMS_HANJA[stem] + BRANCHES_HANJA[branch],
    stemName: STEMS[stem], branchName: BRANCHES[branch],
    stemElement: STEM_ELEMENT[stem], branchElement: BRANCH_ELEMENT[branch],
    stemYang: stemYang(stem),
    tenGodStem: dayStem === null ? null : tenGodOf(ds, stem),
    tenGodBranch: tenGodOf(ds, hs[hs.length - 1]),
    hidden: hs.map((s, i) => ({ stem: STEMS[s], element: STEM_ELEMENT[s], tenGod: tenGodOf(ds, s), role: roles[i] })),
  };
}

/** 음력 입력 → 양력 변환 */
export function lunarToSolar(y: number, m: number, d: number, leap: boolean) {
  const lunar = Lunar.fromYmd(y, leap ? -m : m, d);
  const s = lunar.getSolar();
  return { y: s.getYear(), m: s.getMonth(), d: s.getDay() };
}

/** 양력 → 음력 */
export function solarToLunar(y: number, m: number, d: number) {
  const l = Solar.fromYmd(y, m, d).getLunar();
  return { y: l.getYear(), m: Math.abs(l.getMonth()), d: l.getDay(), leap: l.getMonth() < 0 };
}

export function validateBirth(i: BirthInput): string | null {
  if (!Number.isInteger(i.year) || i.year < 1900 || i.year > 2100) return '출생 연도는 1900~2100 사이여야 합니다.';
  if (!Number.isInteger(i.month) || i.month < 1 || i.month > 12) return '월이 올바르지 않습니다.';
  if (!Number.isInteger(i.day) || i.day < 1 || i.day > 31) return '일이 올바르지 않습니다.';
  if (i.hour != null && (!Number.isInteger(i.hour) || i.hour < 0 || i.hour > 23)) return '시(0~23)가 올바르지 않습니다.';
  if (i.minute != null && (!Number.isInteger(i.minute) || i.minute < 0 || i.minute > 59)) return '분(0~59)이 올바르지 않습니다.';
  if (i.gender !== 'female' && i.gender !== 'male') return '성별이 올바르지 않습니다.';
  try {
    if (i.calendar === 'solar') {
      const dt = new Date(Date.UTC(i.year, i.month - 1, i.day));
      if (dt.getUTCMonth() !== i.month - 1 || dt.getUTCDate() !== i.day) return '존재하지 않는 양력 날짜입니다.';
    } else {
      const s = lunarToSolar(i.year, i.month, i.day, !!i.isLeapMonth);
      const back = solarToLunar(s.y, s.m, s.d);
      if (back.y !== i.year || back.m !== i.month || back.d !== i.day || back.leap !== !!i.isLeapMonth) return '존재하지 않는 음력 날짜(또는 해당 해에 윤달이 없음)입니다.';
    }
  } catch {
    return '날짜를 해석할 수 없습니다.';
  }
  return null;
}

function analyzeRelations(pillars: { label: string; stem: number; branch: number }[]): Relation[] {
  const rel: Relation[] = [];
  const label = (p: { label: string }, s: string) => `${p.label}${s}`;
  for (let a = 0; a < pillars.length; a++) {
    for (let b = a + 1; b < pillars.length; b++) {
      const A = pillars[a], B = pillars[b];
      for (const [x, y] of SIX_COMBINE) if ((A.branch === x && B.branch === y) || (A.branch === y && B.branch === x))
        rel.push({ type: '육합', kind: '합', members: [label(A, '지'), label(B, '지')] });
      for (const [x, y] of CLASH) if ((A.branch === x && B.branch === y) || (A.branch === y && B.branch === x))
        rel.push({ type: '충', kind: '충', members: [label(A, '지'), label(B, '지')] });
      for (const [x, y] of BREAK) if ((A.branch === x && B.branch === y) || (A.branch === y && B.branch === x))
        rel.push({ type: '파', kind: '파', members: [label(A, '지'), label(B, '지')] });
      for (const [x, y] of HARM) if ((A.branch === x && B.branch === y) || (A.branch === y && B.branch === x))
        rel.push({ type: '해', kind: '해', members: [label(A, '지'), label(B, '지')] });
      for (const [x, y] of PUNISH_PAIR) if ((A.branch === x && B.branch === y) || (A.branch === y && B.branch === x))
        rel.push({ type: '형(무례지형)', kind: '형', members: [label(A, '지'), label(B, '지')] });
      if (A.branch === B.branch && SELF_PUNISH.includes(A.branch))
        rel.push({ type: '자형', kind: '형', members: [label(A, '지'), label(B, '지')] });
      for (const { pair, element } of STEM_COMBINE) if ((A.stem === pair[0] && B.stem === pair[1]) || (A.stem === pair[1] && B.stem === pair[0]))
        rel.push({ type: '천간합', kind: '합', members: [label(A, '간'), label(B, '간')], element });
      for (const [x, y] of STEM_CLASH) if ((A.stem === x && B.stem === y) || (A.stem === y && B.stem === x))
        rel.push({ type: '천간충', kind: '충', members: [label(A, '간'), label(B, '간')] });
    }
  }
  // 삼합/방합/삼형 (3개 이상 요구, 삼합은 왕지 포함 반합도 기록)
  const branchSet = pillars.map((p) => p.branch);
  for (const t of TRIPLE_COMBINE) {
    const has = t.branches.filter((b) => branchSet.includes(b));
    if (has.length === 3) rel.push({ type: '삼합', kind: '합', members: has.map((b) => BRANCHES[b]), element: t.element });
    else if (has.length === 2 && has.includes(t.center)) rel.push({ type: '반합', kind: '합', members: has.map((b) => BRANCHES[b]), element: t.element, note: '왕지 포함 반합' });
  }
  for (const t of DIRECTIONAL_COMBINE) {
    if (t.branches.every((b) => branchSet.includes(b))) rel.push({ type: '방합', kind: '합', members: t.branches.map((b) => BRANCHES[b]), element: t.element });
  }
  for (const grp of PUNISH_TRIPLE) {
    if (grp.every((b) => branchSet.includes(b))) rel.push({ type: '삼형', kind: '형', members: grp.map((b) => BRANCHES[b]) });
  }
  return rel;
}

const STRENGTH_WEIGHTS = { yearStem: 8, monthStem: 12, hourStem: 12, yearBranch: 8, monthBranch: 30, dayBranch: 15, hourBranch: 12 };

export function calcSaju(input: BirthInput): SajuChart {
  const err = validateBirth(input);
  if (err) throw new Error(err);

  let sy = input.year, sm = input.month, sd = input.day;
  if (input.calendar === 'lunar') ({ y: sy, m: sm, d: sd } = lunarToSolar(input.year, input.month, input.day, !!input.isLeapMonth));

  const hourKnown = input.hour != null;
  let hour = hourKnown ? input.hour! : 12;
  let minute = hourKnown ? input.minute ?? 0 : 0;
  let correctionMinutes = 0;
  let sdate = new Date(Date.UTC(sy, sm - 1, sd, hour, minute));
  if (hourKnown && input.longitudeCorrection) {
    const lon = REGION_LONGITUDE[input.region ?? '서울'] ?? 127.5;
    correctionMinutes = Math.round((lon - 135) * 4);
    sdate = new Date(sdate.getTime() + correctionMinutes * 60000);
  }
  const Y = sdate.getUTCFullYear(), M = sdate.getUTCMonth() + 1, D = sdate.getUTCDate();
  hour = sdate.getUTCHours(); minute = sdate.getUTCMinutes();

  // lunar-javascript sect: 2 = 일주 자정 교체(야자시 시주만 익일 기준), 1 = 23시부터 익일 일주
  const sect = input.nightZi === 'next_day' ? 1 : 2;
  const solar = Solar.fromYmdHms(Y, M, D, hourKnown ? hour : 12, hourKnown ? minute : 0, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  ec.setSect(sect);

  const ys = stemIdx(ec.getYearGan()), yb = branchIdx(ec.getYearZhi());
  const ms = stemIdx(ec.getMonthGan()), mb = branchIdx(ec.getMonthZhi());
  const ds = stemIdx(ec.getDayGan()), db = branchIdx(ec.getDayZhi());
  let hs = -1, hb = -1;
  if (hourKnown) { hs = stemIdx(ec.getTimeGan()); hb = branchIdx(ec.getTimeZhi()); }

  const pillars = {
    year: makePillar(ys, yb, ds), month: makePillar(ms, mb, ds),
    day: { ...makePillar(ds, db, ds), tenGodStem: null as TenGod | null },
    hour: hourKnown ? makePillar(hs, hb, ds) : null,
  };

  // 오행 / 십성 집계
  const visible = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<Element, number>;
  const withHidden = { ...visible };
  const tg = Object.fromEntries(TEN_GODS.map((t) => [t, 0])) as Record<TenGod, number>;
  const list = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean) as Pillar[];
  for (const p of list) {
    visible[p.stemElement]++; visible[p.branchElement]++;
    withHidden[p.stemElement]++;
    for (const h of p.hidden) withHidden[h.element] += h.role === '정기' ? 1 : h.role === '중기' ? 0.5 : 0.3;
    if (p.tenGodStem) tg[p.tenGodStem]++;
    tg[p.tenGodBranch]++;
  }
  withHidden['목'] = round1(withHidden['목']); // 소수 정리
  for (const e of ELEMENTS) withHidden[e] = round1(withHidden[e]);
  const sorted = [...ELEMENTS].sort((a, b) => withHidden[b] - withHidden[a]);
  const groups = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  for (const t of TEN_GODS) groups[TEN_GOD_GROUP[t]] += tg[t];

  // 신강신약 (자체 가중 기준)
  const sup = (t: TenGod) => TEN_GOD_GROUP[t] === '비겁' || TEN_GOD_GROUP[t] === '인성';
  const W = STRENGTH_WEIGHTS;
  let score = 0, max = W.monthStem + W.yearStem + W.yearBranch + W.monthBranch + W.dayBranch;
  const add = (t: TenGod | null, w: number) => { if (t && sup(t)) score += w; };
  add(pillars.year.tenGodStem, W.yearStem); add(pillars.month.tenGodStem, W.monthStem);
  add(pillars.year.tenGodBranch, W.yearBranch); add(pillars.month.tenGodBranch, W.monthBranch); add(pillars.day.tenGodBranch, W.dayBranch);
  if (pillars.hour) { max += W.hourStem + W.hourBranch; add(pillars.hour.tenGodStem, W.hourStem); add(pillars.hour.tenGodBranch, W.hourBranch); }
  const ratio = score / max;
  const level = ratio >= 0.72 ? '극신강' : ratio >= 0.55 ? '신강' : ratio > 0.4 ? '중화' : ratio > 0.25 ? '신약' : '극신약';

  // 관계
  const relPillars = [
    { label: '연', stem: ys, branch: yb }, { label: '월', stem: ms, branch: mb }, { label: '일', stem: ds, branch: db },
    ...(hourKnown ? [{ label: '시', stem: hs, branch: hb }] : []),
  ];
  const relations = analyzeRelations(relPillars);

  // 대운
  const yun = ec.getYun(input.gender === 'male' ? 1 : 0);
  const dy = yun.getDaYun(11).slice(1, 11);
  const daewoonList: DaewoonItem[] = dy.map((d: any) => {
    const gz = d.getGanZhi() as string;
    const s = stemIdx(gz[0]), b = branchIdx(gz[1]);
    return {
      ganzhi: STEMS[s] + BRANCHES[b], stem: s, branch: b, startAge: d.getStartAge(), startYear: d.getStartYear(), endYear: d.getEndYear(),
      tenGodStem: tenGodOf(ds, s), tenGodBranch: tenGodOf(ds, HIDDEN_STEMS[b][HIDDEN_STEMS[b].length - 1]),
    };
  });

  const prev = lunar.getPrevJie(true), next = lunar.getNextJie(true);
  const warnings: string[] = [];
  const nearHrs = (a: any) => Math.abs(new Date(Date.UTC(Y, M - 1, D, hour, minute)).getTime() - Date.UTC(a.getYear(), a.getMonth() - 1, a.getDay(), a.getHour(), a.getMinute())) / 36e5;
  if (nearHrs(prev.getSolar()) < 24 || nearHrs(next.getSolar()) < 24) warnings.push('절기 경계 24시간 이내 출생: 월주(연주)가 바뀔 수 있어 정확한 출생 시각 확인이 필요합니다.');
  if (hourKnown && (hour === 23 || (hour === 0 && minute < 30))) warnings.push('자시(23~01시) 출생: 야자시 처리 기준에 따라 일주·시주가 달라질 수 있습니다.');
  if (!hourKnown) warnings.push('출생 시간을 몰라 시주는 계산하지 않았습니다(임의 생성 없음).');

  const lunarOut = lunar;
  return {
    input,
    solar: { y: Y, m: M, d: D, hour: hourKnown ? hour : null, minute: hourKnown ? minute : null },
    lunar: { y: lunarOut.getYear(), m: Math.abs(lunarOut.getMonth()), d: lunarOut.getDay(), leap: lunarOut.getMonth() < 0, text: lunarOut.toString() },
    correctionMinutes,
    pillars,
    dayMaster: { stem: STEMS[ds], hanja: STEMS_HANJA[ds], element: STEM_ELEMENT[ds], yang: stemYang(ds) },
    animal: ANIMALS[yb],
    elements: { visible, withHidden, dominant: sorted[0], weakest: sorted[4], missing: ELEMENTS.filter((e) => visible[e] === 0 && withHidden[e] < 0.5) },
    tenGods: tg, tenGodGroups: groups,
    strength: { score, max, ratio: round2(ratio), level, deukryeong: sup(pillars.month.tenGodBranch), deukji: sup(pillars.day.tenGodBranch), deukse: [pillars.year.tenGodStem, pillars.month.tenGodStem, pillars.hour?.tenGodStem ?? null].filter((t) => t && sup(t)).length >= 2 },
    relations,
    daewoon: { forward: yun.isForward(), startYears: yun.getStartYear(), startMonths: yun.getStartMonth(), startDays: yun.getStartDay(), list: daewoonList },
    boundaries: {
      prevJie: prev.getName(), prevJieAt: prev.getSolar().toYmdHms(), nextJie: next.getName(), nextJieAt: next.getSolar().toYmdHms(), warnings,
    },
    meta: { engine: 'destiny-garden-saju/1 (lunar-javascript 천문 + 자체 명리 규칙)', hourKnown, sect },
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** 세운: 해당 연도의 간지 (입춘 기준 연도) */
export function yearGanzhi(year: number) {
  const [s, b] = fromSexagenary(((year - 4) % 60 + 60) % 60);
  return { year, stem: s, branch: b, name: ganzhiName(s, b), animal: ANIMALS[b] };
}

/** 월운: 해당 연도(입춘~입춘)의 12개월 간지 (오호둔). 절기 시각은 lunar-javascript 값 */
export function monthGanzhiList(year: number) {
  const { stem } = yearGanzhi(year);
  const start = monthStemStart(stem);
  const table = Solar.fromYmd(year, 6, 1).getLunar().getJieQiTable();
  const next = Solar.fromYmd(year + 1, 6, 1).getLunar().getJieQiTable();
  const jie: [string, any][] = [
    ['입춘', table['立春']], ['경칩', table['惊蛰']], ['청명', table['清明']], ['입하', table['立夏']], ['망종', table['芒种']], ['소서', table['小暑']],
    ['입추', table['立秋']], ['백로', table['白露']], ['한로', table['寒露']], ['입동', table['立冬']], ['대설', table['大雪']], ['소한', next['小寒']],
  ];
  return jie.map(([name, s], i) => {
    const st = (start + i) % 10, br = (2 + i) % 12;
    return { month: i + 1, ganzhi: ganzhiName(st, br), stem: st, branch: br, jie: name, begins: s ? s.toYmdHms() : '' };
  });
}

/** 지정일의 일주 (연구 검증용: 1900-01-01 = 갑술일 기준 일수 계산) */
export function dayPillarByCount(y: number, m: number, d: number) {
  const days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 1)) / 86400000);
  const idx = (((10 + days) % 60) + 60) % 60; // 갑술 = 10
  const [s, b] = fromSexagenary(idx);
  return { index: idx, name: ganzhiName(s, b) };
}

export { toSexagenary };
