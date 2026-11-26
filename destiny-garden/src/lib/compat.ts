import type { SajuChart } from './saju/engine';
import { ELEMENTS, GENERATES, CONTROLS, SIX_COMBINE, CLASH, BREAK, HARM, STEM_COMBINE, TRIPLE_COMBINE, tenGodOf, BRANCHES, type Element } from './saju/tables';

export interface Compat { score: number; label: string; highlights: string[]; cautions: string[]; dayStemRelation: string; dayBranchRelation: string }

const pairHas = (list: [number, number][], a: number, b: number) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** 두 사람 사주 비교 (결정론적 점수; 해석 보조용 지표이며 절대 판단이 아님) */
export function compareCharts(a: SajuChart, b: SajuChart): Compat {
  let score = 50;
  const hi: string[] = [], ca: string[] = [];
  const sa = a.pillars.day.stem, sb = b.pillars.day.stem, ba = a.pillars.day.branch, bb = b.pillars.day.branch;
  const ea = a.dayMaster.element, eb = b.dayMaster.element;

  let stemRel = '';
  if (STEM_COMBINE.some((s) => (s.pair[0] === sa && s.pair[1] === sb) || (s.pair[0] === sb && s.pair[1] === sa))) { score += 20; stemRel = '일간 천간합'; hi.push('두 사람의 일간이 합(合)을 이뤄 서로 끌리고 결속하기 쉬운 구조입니다.'); }
  else if (ea === eb) { score += 8; stemRel = '같은 오행'; hi.push('같은 오행의 일간이라 가치관과 감각이 닮았습니다.'); }
  else if (GENERATES[ea] === eb) { score += 12; stemRel = `${ea}이(가) ${eb}을(를) 생함`; hi.push(`${a.dayMaster.stem}이(가) 상대를 북돋아 주는 흐름(${ea}→${eb})입니다.`); }
  else if (GENERATES[eb] === ea) { score += 12; stemRel = `${eb}이(가) ${ea}을(를) 생함`; hi.push(`상대가 나를 북돋아 주는 흐름(${eb}→${ea})입니다.`); }
  else if (CONTROLS[ea] === eb || CONTROLS[eb] === ea) { score -= 4; stemRel = '오행 상극'; ca.push('일간 오행이 상극이라 의견 충돌이 있을 수 있습니다. 서로의 방식을 존중하는 연습이 필요합니다.'); }

  let branchRel = '특별한 관계 없음';
  if (pairHas(SIX_COMBINE, ba, bb)) { score += 20; branchRel = '일지 육합'; hi.push('일지가 육합이라 정서적 안정과 편안함이 큽니다.'); }
  else if (pairHas(CLASH, ba, bb)) { score -= 15; branchRel = '일지 충'; ca.push('일지가 충이라 생활 방식·감정 표현에서 부딪히기 쉽습니다. 속도를 맞추는 대화가 중요합니다.'); }
  else if (pairHas(BREAK, ba, bb)) { score -= 6; branchRel = '일지 파'; ca.push('일지가 파라서 작은 오해가 쌓이지 않게 자주 확인하세요.'); }
  else if (pairHas(HARM, ba, bb)) { score -= 6; branchRel = '일지 해'; ca.push('일지가 해라서 서운함이 은근히 쌓일 수 있습니다.'); }
  else if (TRIPLE_COMBINE.some((t) => t.branches.includes(ba as any) && t.branches.includes(bb as any) && ba !== bb)) { score += 10; branchRel = '일지 삼합 일부'; hi.push('일지가 삼합의 일부를 이뤄 함께할수록 힘이 커집니다.'); }

  // 오행 보완
  let comp = 0;
  for (const e of a.elements.missing) if (b.elements.withHidden[e as Element] >= 1.5) { comp += 6; hi.push(`내게 부족한 ${e} 기운을 상대가 채워 줍니다.`); }
  for (const e of b.elements.missing) if (a.elements.withHidden[e as Element] >= 1.5) { comp += 6; hi.push(`상대에게 부족한 ${e} 기운을 내가 채워 줍니다.`); }
  score += Math.min(comp, 12);

  // 십성: 상대 일간이 내게 어떤 존재인가
  const tg = tenGodOf(sa, sb);
  const tgNote: Record<string, [number, string]> = {
    정재: [6, '상대가 내게 정재(안정적 배우자궁)에 해당해 현실적으로 의지가 됩니다.'], 정관: [6, '상대가 내게 정관에 해당해 신뢰와 존중이 바탕이 됩니다.'],
    식신: [5, '상대가 내게 식신에 해당해 함께 있으면 편안하고 즐겁습니다.'], 정인: [5, '상대가 내게 정인에 해당해 돌봄과 지지를 받는 느낌이 큽니다.'],
    편재: [3, '상대가 내게 편재에 해당해 활력과 자극을 줍니다.'], 편관: [2, '상대가 내게 편관에 해당해 강한 끌림과 긴장이 공존합니다.'],
    편인: [1, '상대가 내게 편인에 해당해 이해받는 듯하면서도 거리감이 느껴질 수 있습니다.'], 비견: [2, '상대가 나와 대등한 친구 같은 관계입니다.'],
    겁재: [-2, '상대가 겁재에 해당해 경쟁심이 생기기 쉬우니 역할을 나눠 보세요.'], 상관: [-2, '상대가 상관에 해당해 말이 날카로워지지 않도록 조심하세요.'],
  };
  const [pts, note] = tgNote[tg]; score += pts; (pts >= 0 ? hi : ca).push(note);

  score = Math.max(20, Math.min(98, score));
  const label = score >= 85 ? '운명적인 인연' : score >= 70 ? '서로를 키우는 좋은 궁합' : score >= 55 ? '노력하면 깊어지는 인연' : score >= 40 ? '다름을 이해해야 하는 인연' : '조율이 많이 필요한 인연';
  return { score, label, highlights: hi.slice(0, 5), cautions: ca.slice(0, 4), dayStemRelation: stemRel || '큰 관계 없음', dayBranchRelation: branchRel };
}

export const wealthCompare = (a: SajuChart, b: SajuChart) => {
  const f = (c: SajuChart) => c.tenGodGroups.재성 * 2 + c.tenGodGroups.식상 + (c.strength.level === '중화' || c.strength.level === '신강' ? 1 : 0);
  return { a: f(a), b: f(b) };
};
void ELEMENTS; void BRANCHES;
