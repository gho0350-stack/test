import { C, type Npc } from '../content';
import type { SajuChart } from '../saju/engine';
import { matchRules, cycleGods, dayPillarInfo, destinyCardOf, pastLifeOf } from '../rules';
import { compareCharts, wealthCompare } from '../compat';
import { yearGanzhi } from '../saju/engine';
import { strictProd } from './env';

export type Topic = 'general' | 'wealth' | 'career' | 'relationship' | 'pastlife';
export interface Answer { core: string; detail: string; basis: string[]; follow_ups: string[]; summary: string }
export interface ReportContent { title: string; summary: string; sections: { title: string; body: string }[]; disclaimer: string; source: string }

export const aiMode = () => (process.env.OPENAI_API_KEY ? 'openai' : 'offline') as 'openai' | 'offline';
export const model = () => process.env.OPENAI_MODEL || 'gpt-4o';
const YEAR = () => Number(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 4));

export function detectTopic(q: string, npc: Npc): Topic {
  if (/전생|영혼|과거 ?생|같은 사주/.test(q)) return 'pastlife';
  if (/재물|돈|사업|투자|부자|수입|월급|재테크|창업/.test(q)) return 'wealth';
  if (/직장|이직|커리어|취업|직업|승진|적성|진로|회사/.test(q)) return 'career';
  if (/연애|궁합|인연|결혼|남편|아내|배우자|관계|사랑|이별|친구|그 사람|이 사람/.test(q)) return 'relationship';
  return (npc.topic as Topic) || 'general';
}

export function chartFacts(c: SajuChart) {
  const P = (p: any) => p && { ganzhi: p.name, stem_tengod: p.tenGodStem, branch_tengod: p.tenGodBranch, hidden: p.hidden.map((h: any) => `${h.stem}(${h.tenGod})`) };
  const cg = cycleGods(c, YEAR());
  return {
    day_master: `${c.dayMaster.stem}${c.dayMaster.element}(${c.dayMaster.yang ? '양' : '음'})`, day_pillar: c.pillars.day.name,
    pillars: { year: P(c.pillars.year), month: P(c.pillars.month), day: P(c.pillars.day), hour: P(c.pillars.hour) },
    five_elements: c.elements.withHidden, dominant: c.elements.dominant, missing: c.elements.missing,
    ten_gods: c.tenGods, strength: c.strength.level, relations: c.relations.map((r) => `${r.type}:${r.members.join('-')}`),
    daewoon: c.daewoon.list.slice(0, 8).map((d) => `${d.ganzhi}(${d.startAge}세~, ${d.tenGodStem})`),
    current_year: { year: YEAR(), seun: cg.seun.name, seun_tengod: cg.seunGod, current_daewoon: cg.daewoon?.ganzhi ?? '대운 시작 전' },
    hour_known: c.meta.hourKnown,
  };
}

const FOLLOW: Record<Topic, string[]> = {
  general: ['내 사주에서 가장 특별한 부분은 무엇일까요?', '올해 가장 조심할 점은 무엇인가요?', '내게 맞는 직업 방향이 궁금해요'],
  wealth: ['내 재물 형성 성향을 더 자세히 알려 주세요', '올해 돈이 새는 구멍은 어디일까요?', '사업과 직장 중 어느 쪽이 더 맞을까요?'],
  career: ['지금 이직하면 더 좋은 기회가 있을까요?', '내가 가장 빛날 수 있는 환경은 어디일까요?', '다음 대운에서 커리어는 어떻게 달라질까요?'],
  relationship: ['나는 어떤 연애 스타일인가요?', '인간관계에서 반복되는 패턴이 있을까요?', '좋은 인연을 만나는 시기가 있을까요?'],
  pastlife: ['내 전생 이야기를 더 들려주세요', '이번 생에서 이어지는 기운은 무엇일까요?', '내 사주에서 가장 특별한 부분은 무엇일까요?'],
};
const OPENERS: Record<string, string[]> = {
  sage: ['음, 그대의 명식을 찬찬히 살펴보았네.', '별의 움직임을 따라 읽어 보겠네.'],
  merchant: ['장부로 정리해 보겠습니다.', '숫자와 구조로 말씀드리죠.'],
  guardian: ['마음이 많이 쓰이셨겠어요. 함께 살펴볼게요.', '천천히, 편하게 들어 주세요.'],
  guide: ['물결 위에 이야기가 번지는군요…', '오래된 등불이 이렇게 말하고 있어요.'],
};

/** AI 키가 없는 개발/테스트 환경용 규칙 기반 해석 (결정론적, 사주 계산 결과와 규칙 DB만 사용) */
export function offlineAnswer(npc: Npc, q: string, topic: Topic, chart: SajuChart, partner?: { name: string; chart: SajuChart } | null, prevSummaries: string[] = []): Answer {
  const year = YEAR();
  const ruleTopic = topic === 'general' || topic === 'pastlife' ? 'fortune' : topic;
  const rules = topic === 'pastlife' ? [] : matchRules(chart, topic === 'general' ? 'career' : (topic as any), year, 5);
  const fortune = matchRules(chart, 'fortune', year, 2);
  const opener = (OPENERS[npc.id] ?? OPENERS.sage)[q.length % 2];
  const dp = dayPillarInfo(chart.pillars.day.name);
  const basis: string[] = [`일주 ${dp.name}(${dp.title})`, `일간 ${chart.dayMaster.stem}${chart.dayMaster.element}, 신강신약 ${chart.strength.level}`];
  let core = '', detail = '';

  if (topic === 'pastlife') {
    const pl = pastLifeOf(chart);
    core = `${opener} 상상 속의 당신은 ${pl.era}의 ${pl.title}이었는지도 모릅니다. (창작 이야기)`;
    detail = `${pl.story} ${pl.carryover}\n\n※ 전생·영혼 이야기는 재미와 영감을 위한 창작 콘텐츠이며 사실이 아닙니다.`;
    basis.push(`전생 원형 ‘${pl.title}’은 일간 오행(${chart.dayMaster.element})과 월지로 매핑한 창작 데이터`);
  } else if (partner) {
    const cmp = compareCharts(chart, partner.chart);
    const w = wealthCompare(chart, partner.chart);
    if (/재물|돈|누가/.test(q)) {
      const better = w.a === w.b ? '두 분의 재물 구조는 비슷합니다' : w.a > w.b ? '나의 재성·식상 구조가 조금 더 두터운 편입니다' : `${partner.name}님의 재성·식상 구조가 조금 더 두터운 편입니다`;
      core = `${opener} 원국 구조상 ${better}. 다만 재물운은 대운·세운과 실천에 따라 달라지므로 우열이 아닌 역할 분담의 관점이 좋습니다.`;
    } else core = `${opener} ${partner.name}님과의 인연은 ‘${cmp.label}’(궁합 지표 ${cmp.score}점)입니다. 점수보다 아래 근거를 참고해 주세요.`;
    detail = [...cmp.highlights.map((h) => '• ' + h), ...cmp.cautions.map((h) => '△ ' + h)].join('\n');
    basis.push(`일간 관계: ${cmp.dayStemRelation}`, `일지 관계: ${cmp.dayBranchRelation}`);
  } else {
    const first = rules[0];
    core = `${opener} ${first ? first.text : dp.summary}`;
    detail = [...rules.slice(1).map((r) => '• ' + r.text), ...fortune.map((r) => '• ' + r.text)].join('\n') || dp.summary;
    for (const r of [...rules, ...fortune]) basis.push(r.basis);
  }
  if (prevSummaries.length) detail += `\n\n(이전 상담 기억: ${prevSummaries[0]})`;
  if (!chart.meta.hourKnown) detail += '\n\n※ 출생 시간을 몰라 시주 없이 해석했어요. 시주가 있으면 더 정확해집니다.';
  void ruleTopic;
  return { core, detail, basis: Array.from(new Set(basis)).slice(0, 8), follow_ups: FOLLOW[topic], summary: `${q.slice(0, 40)} → ${core.replace(/^[^.!?]*[.!?]\s*/, '').slice(0, 70) || core.slice(0, 70)}` };
}

const ANSWER_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['core', 'detail', 'basis', 'follow_ups', 'summary'],
  properties: { core: { type: 'string' }, detail: { type: 'string' }, basis: { type: 'array', items: { type: 'string' } }, follow_ups: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' } },
};
const REPORT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['title', 'summary', 'sections'],
  properties: { title: { type: 'string' }, summary: { type: 'string' }, sections: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'body'], properties: { title: { type: 'string' }, body: { type: 'string' } } } } },
};
const GUARD = `당신은 한국어 사주 상담 서비스 '운명의 정원'의 NPC입니다. 규칙:
1) 사주 계산은 절대 직접 하지 마세요. 제공된 JSON(saju)과 rules(명리 규칙 DB)만 근거로 해석하세요. 없는 정보는 추측하지 마세요.
2) 단정적 예언·수익/합격 보장·의학/법률/투자 확정 조언 금지. '경향', '가능성' 표현을 쓰고 실천 조언을 포함하세요.
3) 해석의 근거(어떤 십성/오행/대운인지)를 basis 배열에 밝히세요.
4) 전생·영혼 이야기는 창작임을 분명히 하세요.
5) previous_context(이전 상담 요약)가 있으면 자연스럽게 이어서 답하세요.
6) 답변은 core(2~3문장 핵심), detail(문단 구분된 상세 해석), basis, follow_ups(후속 질문 3개), summary(다음 상담용 한 줄 요약)로 구성하세요.`;

async function callResponses(instructions: string, input: string, schemaName: string, schema: object, maxTokens: number) {
  const key = process.env.OPENAI_API_KEY!;
  const res = await fetch(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/responses', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(Number(process.env.OPENAI_TIMEOUT_MS || 45000)),
    body: JSON.stringify({ model: model(), instructions, input, max_output_tokens: maxTokens, text: { format: { type: 'json_schema', name: schemaName, strict: true, schema } } }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j: any = await res.json();
  if (j.status && j.status !== 'completed') throw new Error(`OpenAI status ${j.status}`);
  const text = (j.output ?? []).flatMap((o: any) => o.content ?? []).filter((c: any) => c.type === 'output_text').map((c: any) => c.text).join('');
  if (!text) throw new Error('OpenAI 응답이 비어 있습니다.');
  return { data: JSON.parse(text), tokens: j.usage?.total_tokens ?? null };
}

export async function answerQuestion(p: { npc: Npc; question: string; topic: Topic; chart: SajuChart; partner?: { name: string; chart: SajuChart } | null; prevSummaries: string[]; deep: boolean }) {
  const t0 = Date.now();
  if (aiMode() === 'offline') {
    if (strictProd()) throw new Error('AI 서비스가 설정되지 않았습니다(OPENAI_API_KEY).');
    return { answer: offlineAnswer(p.npc, p.question, p.topic, p.chart, p.partner, p.prevSummaries), model: 'offline-rules', ms: Date.now() - t0, tokens: null as number | null, source: 'offline' as const };
  }
  const rt = p.topic === 'general' ? 'career' : p.topic === 'pastlife' ? 'fortune' : p.topic;
  const payload = {
    npc: p.npc.name, topic: p.topic, question: p.question, deep_analysis: p.deep,
    saju: chartFacts(p.chart),
    partner: p.partner && { name: p.partner.name, saju: chartFacts(p.partner.chart), compat: compareCharts(p.chart, p.partner.chart) },
    rules: [...matchRules(p.chart, rt as any, YEAR(), 8), ...matchRules(p.chart, 'fortune', YEAR(), 3)].map((r) => ({ text: r.text, basis: r.basis })),
    past_life: p.topic === 'pastlife' ? pastLifeOf(p.chart) : undefined,
    previous_context: p.prevSummaries,
  };
  const { data, tokens } = await callResponses(`${GUARD}\n\n[NPC 말투]\n${p.npc.style}\n${p.deep ? '이번은 심층 분석입니다. detail을 풍부하게(6~10문단 이내) 작성하세요.' : ''}`, JSON.stringify(payload), 'consult_answer', ANSWER_SCHEMA, p.deep ? 2500 : 1400);
  return { answer: data as Answer, model: model(), ms: Date.now() - t0, tokens, source: 'openai' as const };
}

// ───────── 심층 리포트 ─────────
const DISCLAIMER = '이 리포트는 명리학 이론에 기반한 해석 참고 자료이며 미래를 확정하거나 결과를 보장하지 않습니다. 전생 콘텐츠는 창작입니다.';
export function offlineReport(kind: string, chart: SajuChart, partner?: { name: string; chart: SajuChart } | null): ReportContent {
  const year = YEAR();
  const dp = dayPillarInfo(chart.pillars.day.name);
  const cg = cycleGods(chart, year);
  const list = (t: any, n = 6) => matchRules(chart, t, year, n).map((r) => '• ' + r.text).join('\n');
  const dw = chart.daewoon.list.slice(0, 6).map((d) => `${d.startAge}세~ ${d.ganzhi} 대운(${d.tenGodStem})`).join(' / ');
  const cyc = matchRules(chart, 'fortune', year, 2).map((r) => '• ' + r.text).join('\n');
  const base = (title: string, summary: string, sections: { title: string; body: string }[]): ReportContent => ({ title, summary, sections, disclaimer: DISCLAIMER, source: 'offline' });
  if (kind === 'wealth') return base('심층 재물운 리포트', `${dp.name}일주 · ${chart.strength.level} · 재성 ${chart.tenGodGroups.재성}, 식상 ${chart.tenGodGroups.식상}`, [
    { title: '재물 형성 성향', body: list('wealth', 6) }, { title: '대운 흐름', body: `${dw}\n\n${cyc}` },
    { title: `${year}년 재물 전략`, body: `올해 세운은 ${cg.seun.name}(${cg.seunGod})입니다.\n${chart.elements.missing.length ? `부족한 오행(${chart.elements.missing.join('·')})을 생활에서 보완하세요.` : '오행 균형을 유지하며 무리한 확장은 피하세요.'}` },
  ]);
  if (kind === 'career') return base('심층 커리어운 리포트', `${dp.name}일주 · ${chart.strength.level} · 관성 ${chart.tenGodGroups.관성}, 인성 ${chart.tenGodGroups.인성}`, [
    { title: '적성과 직무 방향', body: list('career', 6) }, { title: '대운으로 보는 성장 시기', body: `${dw}\n\n${cyc}` },
    { title: `${year}년 이직·성장 포인트`, body: `세운 ${cg.seun.name}(${cg.seunGod}): ${matchRules(chart, 'fortune', year, 5).find((r) => r.id.startsWith('seun_'))?.text ?? ''}` },
  ]);
  if (kind === 'pastlife') { const pl = pastLifeOf(chart); return base('전생 스토리 (창작)', `${pl.era}의 ${pl.title}`, [{ title: '전설의 한 장면', body: pl.story }, { title: '이번 생으로 이어지는 기운', body: pl.carryover }, { title: '안내', body: pl.disclaimer }]); }
  if (kind === 'compat') {
    if (!partner) throw new Error('상대 정보가 필요합니다.');
    const c = compareCharts(chart, partner.chart);
    return base(`${partner.name}님과의 궁합 리포트`, `${c.label} · 궁합 지표 ${c.score}점`, [
      { title: '두 사람의 일주', body: `나 ${chart.pillars.day.name} · ${partner.name} ${partner.chart.pillars.day.name}\n일간 관계: ${c.dayStemRelation}\n일지 관계: ${c.dayBranchRelation}` },
      { title: '서로에게 힘이 되는 점', body: c.highlights.map((x) => '• ' + x).join('\n') || '뚜렷한 강점은 노력으로 만들어 가는 영역입니다.' },
      { title: '조심할 점과 조율 방법', body: c.cautions.map((x) => '• ' + x).join('\n') || '큰 충돌 요소는 보이지 않습니다.' },
      { title: '관계 규칙 참고', body: list('relationship', 4) },
    ]);
  }
  return base('종합 운명 리포트', `${dp.name}일주 ‘${dp.title}’`, [
    { title: '나의 일주', body: `${dp.summary}\n그림자: ${dp.shadow}` },
    { title: '오행과 십성', body: `오행: ${Object.entries(chart.elements.withHidden).map(([k, v]) => `${k} ${v}`).join(', ')}\n가장 강한 오행 ${chart.elements.dominant}, 가장 약한 오행 ${chart.elements.weakest}\n십성 분포: ${Object.entries(chart.tenGods).filter(([, v]) => v > 0).map(([k, v]) => `${k}${v}`).join(' ')}` },
    { title: '재물·커리어·관계 한눈에', body: `[재물]\n${list('wealth', 2)}\n[커리어]\n${list('career', 2)}\n[관계]\n${list('relationship', 2)}` },
    { title: '대운과 올해', body: `${dw}\n\n${cyc}` },
    { title: '합충형파해', body: chart.relations.length ? chart.relations.map((r) => `${r.type}(${r.members.join('-')})`).join(', ') : '원국에 뚜렷한 합충형파해가 없습니다.' },
  ]);
}

export async function makeReport(kind: string, chart: SajuChart, partner?: { name: string; chart: SajuChart } | null): Promise<ReportContent> {
  const draft = offlineReport(kind, chart, partner);
  if (aiMode() === 'offline') {
    if (strictProd()) throw new Error('AI 서비스가 설정되지 않았습니다(OPENAI_API_KEY).');
    return draft;
  }
  const { data } = await callResponses(`${GUARD}\n리포트 모드: 아래 draft(규칙 기반 초안)를 근거로 더 읽기 쉽고 따뜻한 문장으로 확장하세요. 섹션 4~6개, 각 섹션 2~4문단. 새로운 사주 계산 금지.`,
    JSON.stringify({ kind, saju: chartFacts(chart), partner: partner && { name: partner.name, saju: chartFacts(partner.chart), compat: compareCharts(chart, partner.chart) }, draft }), 'report', REPORT_SCHEMA, 3500);
  return { ...(data as any), disclaimer: DISCLAIMER, source: 'openai' };
}
void C; void destinyCardOf; void yearGanzhi;
