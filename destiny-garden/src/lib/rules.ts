import { C } from './content';
import type { SajuChart } from './saju/engine';
import { yearGanzhi } from './saju/engine';
import { tenGodOf, type TenGod } from './saju/tables';

export interface RuleCtx { year: number }
export interface Rule { id: string; topic: string; when: Record<string, any>; text: string; basis: string; review_status: string; source: string }

export function cycleGods(chart: SajuChart, year: number) {
  const ds = chart.pillars.day.stem;
  const dw = chart.daewoon.list.find((d) => year >= d.startYear && year <= d.endYear) ?? null;
  const seun = yearGanzhi(year);
  return { daewoon: dw, daewoonGod: dw?.tenGodStem ?? null, seun, seunGod: tenGodOf(ds, seun.stem) as TenGod };
}

export function ruleMatches(r: Rule, chart: SajuChart, ctx: RuleCtx): boolean {
  const w = r.when;
  const tg = chart.tenGods, grp = chart.tenGodGroups;
  if (w.godGte) for (const [g, n] of Object.entries<number>(w.godGte)) if ((tg as any)[g] < n) return false;
  if (w.godLte) for (const [g, n] of Object.entries<number>(w.godLte)) if ((tg as any)[g] > n) return false;
  if (w.groupGte) for (const [g, n] of Object.entries<number>(w.groupGte)) if ((grp as any)[g] < n) return false;
  if (w.groupLte) for (const [g, n] of Object.entries<number>(w.groupLte)) if ((grp as any)[g] > n) return false;
  if (w.strength && !w.strength.includes(chart.strength.level)) return false;
  if (w.dominant && !w.dominant.includes(chart.elements.dominant)) return false;
  if (w.missing && !w.missing.some((e: string) => (chart.elements.missing as string[]).includes(e))) return false;
  if (w.relationHas && !w.relationHas.some((k: string) => chart.relations.some((x) => x.kind === k))) return false;
  if (w.daewoonGod || w.seunGod) {
    const cg = cycleGods(chart, ctx.year);
    if (w.daewoonGod && cg.daewoonGod !== w.daewoonGod) return false;
    if (w.seunGod && cg.seunGod !== w.seunGod) return false;
  }
  return true;
}

/** 규칙 우선순위: 개수 조건이 구체적일수록(has_/no_) → 강한 신호 순 */
export function matchRules(chart: SajuChart, topic: 'wealth' | 'career' | 'relationship' | 'fortune', year: number, limit = 8): Rule[] {
  const list = (C.rules[topic] ?? []) as Rule[];
  const hits = list.filter((r) => ruleMatches(r, chart, { year }));
  const score = (r: Rule) => (r.id.includes('_has_') ? 5 : r.id.includes('_dom_') ? 4 : r.id.includes('strength_') ? 4 : r.id.includes('_miss_') ? 3 : r.id.includes('rel_') ? 3 : r.id.includes('grp_') ? 2 : r.id.includes('_one_') ? 1 : 0);
  return hits.sort((a, b) => score(b) - score(a)).slice(0, limit);
}

export const dayPillarInfo = (name: string) => C.dayPillars.find((d) => d.name === name)!;
export const destinyCardOf = (dayPillarName: string) => C.destinyCards.find((c) => c.day_pillar === dayPillarName)!;
export function pastLifeOf(chart: SajuChart) {
  const idx = (chart.pillars.day.stem * 12 + chart.pillars.day.branch + chart.pillars.month.branch) % 30;
  const el = chart.dayMaster.element;
  const pool = C.pastLives.filter((p) => p.element === el);
  return pool[(chart.pillars.day.branch + chart.pillars.month.branch) % pool.length] ?? C.pastLives[idx];
}
