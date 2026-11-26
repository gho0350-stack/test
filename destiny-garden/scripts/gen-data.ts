/**
 * 명리학/게임 초기 데이터(JSON) 생성기.
 * 모든 해석은 '자체 작성 초안'이며 review_status = "pending"(검토 대기)로 표기한다.
 * 실행: npx tsx scripts/gen-data.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { STEMS, STEMS_HANJA, BRANCHES, BRANCHES_HANJA, ANIMALS, STEM_ELEMENT, BRANCH_ELEMENT, HIDDEN_STEMS, ELEMENTS, TEN_GODS, TEN_GOD_GROUP, stemYang, ELEMENT_HANJA, type Element } from '../src/lib/saju/tables';

const OUT = path.join(__dirname, '..', 'data');
const SRC = '자체 작성 초안 (명리 일반 이론 기반, 전문가 검수 전)';
const meta = { source: SRC, review_status: 'pending' as const };
const write = (name: string, data: unknown) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2) + '\n');

// ───────── 천간 ─────────
const stemInfo = [
  ['큰 나무', '곧게 뻗는 리더십과 시작의 에너지', '고집이 세 보일 수 있음'],
  ['풀꽃과 덩굴', '유연한 적응력과 섬세한 생존력', '타인에게 기대려는 경향'],
  ['태양', '밝고 열정적이며 숨김없는 에너지', '성급하게 달아오를 수 있음'],
  ['등불', '따뜻하고 집중력 있는 섬세함', '감정 기복에 예민함'],
  ['큰 산', '믿음직하고 포용력 있는 중심', '움직임이 느리고 완고할 수 있음'],
  ['논밭', '실속 있고 돌봄에 능한 다재다능함', '걱정을 오래 품는 경향'],
  ['바위와 강철', '결단력과 의리, 추진력', '말과 행동이 날카로울 수 있음'],
  ['보석', '섬세한 미감과 완벽을 향한 집중', '자존심과 예민함'],
  ['큰 강과 바다', '깊은 지혜와 자유로운 포용력', '방향 없이 흘러가기 쉬움'],
  ['이슬과 봄비', '직관과 감수성, 스며드는 지혜', '소극적으로 숨는 경향'],
];
write('heavenly_stems.json', STEMS.map((n, i) => ({
  id: i, name: n, hanja: STEMS_HANJA[i], element: STEM_ELEMENT[i], yin_yang: stemYang(i) ? '양' : '음',
  image: stemInfo[i][0], strength: stemInfo[i][1], caution: stemInfo[i][2], ...meta,
})));

// ───────── 지지 ─────────
const branchInfo = [
  ['한밤의 샘가', '지혜롭고 민첩한 정보력', '23:00~01:00'], ['겨울 들판', '묵묵한 끈기와 축적', '01:00~03:00'],
  ['새벽 숲', '과감한 개척 정신', '03:00~05:00'], ['봄 꽃밭', '감각적이고 사교적인 섬세함', '05:00~07:00'],
  ['구름 낀 연못', '큰 야망과 변화의 에너지', '07:00~09:00'], ['한낮의 바위터', '깊은 통찰과 집중력', '09:00~11:00'],
  ['여름 초원', '뜨거운 열정과 자유로움', '11:00~13:00'], ['노을 진 목장', '온화함과 예술적 감성', '13:00~15:00'],
  ['가을 과수원', '재치와 임기응변', '15:00~17:00'], ['황금 들녘', '정확하고 미적인 완성도', '17:00~19:00'],
  ['저녁 성곽', '의리와 신념', '19:00~21:00'], ['겨울 바다', '낙천적이고 넉넉한 포용', '21:00~23:00'],
];
write('earthly_branches.json', BRANCHES.map((n, i) => ({
  id: i, name: n, hanja: BRANCHES_HANJA[i], animal: ANIMALS[i], element: BRANCH_ELEMENT[i], hour_range: branchInfo[i][2],
  hidden_stems: HIDDEN_STEMS[i].map((s) => STEMS[s]), setting: branchInfo[i][0], strength: branchInfo[i][1], ...meta,
})));

// ───────── 오행 ─────────
const elemInfo: Record<Element, any> = {
  목: { color: '#6dbb6a', direction: '동', season: '봄', region: ['서울', '경기', '강원'], attr: '성장·시작·기획', garden: '꽃나무와 숲', job: '교육·기획·콘텐츠·패션·식물', love: '상대를 키워 주고 싶어 하는 다정한 성장형', lack: '새로운 시작과 성장의 감각', tip: '아침 산책과 식물 가꾸기로 목 기운을 채우세요.' },
  화: { color: '#f2706b', direction: '남', season: '여름', region: ['부산', '제주', '경남'], attr: '열정·표현·확산', garden: '등불과 달빛', job: '방송·마케팅·IT·뷰티·에너지', love: '표현이 솔직하고 뜨겁게 다가가는 직진형', lack: '표현력과 열정의 불씨', tip: '사람들 앞에서 표현하는 기회를 의식적으로 늘려 보세요.' },
  토: { color: '#d9b25f', direction: '중앙', season: '환절기', region: ['대전', '충북', '세종'], attr: '중재·신뢰·축적', garden: '정원의 흙길과 건물', job: '부동산·중개·농업·상담·건설', love: '믿음과 안정을 먼저 쌓는 신중형', lack: '중심과 신뢰의 기반', tip: '규칙적인 생활 리듬이 토 기운을 단단히 해 줍니다.' },
  금: { color: '#cfd3e6', direction: '서', season: '가을', region: ['대구', '경북', '광주'], attr: '결단·정리·원칙', garden: '정자의 금빛 장식', job: '금융·법률·공학·의료기기·감정', love: '선이 분명하고 한 번 맺으면 의리를 지키는 원칙형', lack: '결단과 정리하는 힘', tip: '미루던 일을 하나씩 끊어 내는 정리가 금 기운을 살립니다.' },
  수: { color: '#5b8def', direction: '북', season: '겨울', region: ['인천', '전남', '충남'], attr: '지혜·흐름·유연', garden: '연못과 달', job: '유통·무역·연구·물류·서비스', love: '깊이 이해하며 천천히 스며드는 감성형', lack: '지혜와 유연한 흐름', tip: '충분한 휴식과 물가에서의 시간이 수 기운을 채웁니다.' },
};
write('five_elements.json', ELEMENTS.map((e) => ({ id: e, hanja: ELEMENT_HANJA[e], ...elemInfo[e], generates: { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }[e], controls: { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' }[e], ...meta })));

// ───────── 십성 ─────────
const godInfo: Record<string, any> = {
  비견: { kw: '자립·동료·주관', lack: '스스로 밀어붙이는 힘', talent: '주관이 뚜렷하고 독립적', wealth: '내 힘으로 버는 자수성가형입니다. 동업·보증은 신중히 하세요.', career: '독립적으로 일할 때 힘이 납니다. 1인 사업·전문직과 궁합이 좋습니다.', love: '대등한 관계를 원합니다. 서로의 영역을 존중할 때 오래갑니다.', cycle: '자립과 경쟁의 흐름이 강해집니다. 동료·경쟁자가 늘 수 있습니다.' },
  겁재: { kw: '승부욕·추진력', lack: '승부처에서의 추진력', talent: '승부욕과 추진력', wealth: '수입 기회는 많으나 지출·경쟁으로 새기 쉬운 구조입니다. 자동 저축이 보완책입니다.', career: '경쟁이 있는 환경에서 성과를 냅니다. 영업·스포츠·스타트업형입니다.', love: '열정적이지만 소유욕·경쟁심이 관계의 변수가 됩니다.', cycle: '재물이 분산되기 쉬운 시기입니다. 큰 지출·보증을 점검하세요.' },
  식신: { kw: '표현·여유·생산', lack: '여유 있게 표현하고 즐기는 힘', talent: '꾸준한 생산과 표현', wealth: '재주와 꾸준함이 수입으로 이어집니다. 작게 시작해 오래가는 수익원이 어울립니다.', career: '기술·요리·창작·교육 등 만들어 내는 일에서 만족이 큽니다.', love: '편안하고 다정한 분위기를 만듭니다. 함께 먹고 즐기는 교감이 중요합니다.', cycle: '표현과 결과물이 자연스럽게 쌓이는 시기입니다. 꾸준함이 보상받습니다.' },
  상관: { kw: '창의·언변·반골', lack: '틀을 깨는 표현력', talent: '창의와 언변', wealth: '아이디어·표현이 돈이 되는 유형입니다. 프리랜서·콘텐츠·기술 수익화에 유리합니다.', career: '규칙을 넘어서는 창의로 승부합니다. 조직에서는 상사와의 마찰을 조율하세요.', love: '솔직한 표현이 매력이지만 날 선 말이 상처가 될 수 있습니다.', cycle: '변화와 표현 욕구가 커지는 시기입니다. 이직·창작의 동기가 생깁니다.' },
  편재: { kw: '큰 돈·유동 자산·사업', lack: '큰 기회를 잡는 감각', talent: '사업 감각과 활동성', wealth: '큰 돈과 유동 자산에 감각이 있습니다. 사업·투자 기회에 반응이 빠릅니다.', career: '사람과 돈이 오가는 영업·유통·사업에서 능력이 드러납니다.', love: '활동적이고 넓게 사귑니다. 한 사람에게 집중하는 시간을 의식적으로 만드세요.', cycle: '돈의 움직임이 커지는 시기입니다. 기회와 함께 변동성도 커집니다.' },
  정재: { kw: '안정 수입·성실·저축', lack: '꾸준히 모으는 습관', talent: '성실함과 관리 능력', wealth: '성실하게 모으는 안정형입니다. 월급·정기 수익과 저축에서 힘이 납니다.', career: '체계적인 관리·회계·운영 업무에서 신뢰를 얻습니다.', love: '책임감 있고 안정적인 관계를 추구합니다.', cycle: '수입이 안정되고 살림이 정돈되는 시기입니다.' },
  편관: { kw: '도전·압박·카리스마', lack: '도전과 압박을 견디는 힘', talent: '위기 돌파력', wealth: '책임과 압박 속에서 수입이 커지는 구조입니다. 무리한 확장은 경계하세요.', career: '위기 대응·현장 책임·리더 역할에서 빛납니다. 스스로를 몰아붙이지 않도록 쉬는 법이 필요합니다.', love: '강한 끌림과 긴장이 공존하는 관계가 많습니다.', cycle: '책임과 압박이 커지는 시기입니다. 단단히 성장하지만 건강 관리가 필요합니다.' },
  정관: { kw: '규율·명예·조직', lack: '규율과 신뢰를 쌓는 힘', talent: '신뢰와 책임감', wealth: '조직·직함에서 오는 신뢰가 재물로 이어집니다. 안정적 기관·전문직에 유리합니다.', career: '조직 안에서 인정받는 승진형입니다. 공공·대기업·전문직과 궁합이 좋습니다.', love: '예의와 신뢰를 중시하며 진중하게 관계를 쌓습니다.', cycle: '인정·승진·책임이 따르는 시기입니다. 명예와 신뢰를 쌓기 좋습니다.' },
  편인: { kw: '직관·특이 재능', lack: '직관적인 영감', talent: '독특한 직관과 전문성', wealth: '독특한 전문성이 수입이 되지만 시작이 느릴 수 있습니다. 틈새 분야를 공략하세요.', career: '연구·예술·상담·IT 등 남다른 시각이 필요한 분야와 맞습니다.', love: '혼자만의 시간이 필요한 관계 스타일입니다. 마음을 말로 꺼내 보세요.', cycle: '생각이 깊어지고 새 분야에 눈을 뜨는 시기입니다. 고립감만 주의하세요.' },
  정인: { kw: '학습·보호·자격', lack: '배움과 보호받는 느낌', talent: '학습력과 포용', wealth: '학습·자격이 재물의 바탕입니다. 쌓은 자격과 신뢰가 수입을 보호합니다.', career: '배움을 쌓아 인정받는 교육·연구·행정 분야에서 안정됩니다.', love: '돌봄을 주고받는 따뜻한 관계를 원합니다.', cycle: '배움과 귀인의 도움이 들어오는 시기입니다. 자격·공부에 투자하기 좋습니다.' },
};
write('ten_gods.json', TEN_GODS.map((g) => ({ id: g, group: TEN_GOD_GROUP[g], keywords: godInfo[g].kw, talent: godInfo[g].talent, wealth: godInfo[g].wealth, career: godInfo[g].career, relationship: godInfo[g].love, ...meta })));

// ───────── 일주 60 / 운명 카드 60 ─────────
const dayPillars: any[] = [], cards: any[] = [];
for (let i = 0; i < 60; i++) {
  const s = i % 10, b = i % 12, name = STEMS[s] + BRANCHES[b];
  const title = `${branchInfo[b][0]}에 선 ${stemInfo[s][0]}`;
  const same = STEM_ELEMENT[s] === BRANCH_ELEMENT[b];
  const rarity = same ? 'epic' : i % 4 === 0 ? 'rare' : 'common';
  dayPillars.push({
    id: i, name, hanja: STEMS_HANJA[s] + BRANCHES_HANJA[b], stem: STEMS[s], branch: BRANCHES[b], animal: ANIMALS[b], title,
    summary: `${stemInfo[s][1]}을(를) 타고났고, ${branchInfo[b][1]}이 바탕에 깔려 있습니다.`,
    shadow: `${stemInfo[s][2]}. ${ELEMENTS.includes(BRANCH_ELEMENT[b]) && BRANCH_ELEMENT[b] === STEM_ELEMENT[s] ? '같은 기운이 겹쳐 장점도 단점도 선명합니다.' : '서로 다른 기운이 만나 균형을 찾는 과정이 중요합니다.'}`,
    wealth_hint: `${elemInfo[STEM_ELEMENT[s]].job.split('·').slice(0, 2).join('·')} 분야에서 재능이 재물로 이어지기 쉽습니다.`,
    love_hint: elemInfo[STEM_ELEMENT[s]].love, card_id: i, ...meta,
  });
  cards.push({
    id: i, day_pillar: name, name: `${title}`, subtitle: `${name}일주`, rarity, element: STEM_ELEMENT[s],
    flavor: `“${stemInfo[s][1]}.” 당신의 운명 카드입니다.`, image_key: `card_${name}`, ...meta,
  });
}
write('day_pillars.json', dayPillars);
write('destiny_cards.json', cards);

// ───────── 관계 설명 ─────────
write('branch_relations.json', [
  { type: '육합', kind: '합', meaning: '두 기운이 서로 끌려 결합합니다. 협력·인연·결속의 신호입니다.', ...meta },
  { type: '삼합', kind: '합', meaning: '세 기운이 하나의 오행으로 뭉쳐 강한 추진력을 만듭니다.', ...meta },
  { type: '반합', kind: '합', meaning: '삼합의 일부(왕지 포함)로 합의 기운이 부분적으로 형성됩니다.', ...meta },
  { type: '방합', kind: '합', meaning: '같은 계절의 기운이 모여 한 오행이 크게 강해집니다.', ...meta },
  { type: '충', kind: '충', meaning: '정면으로 부딪히는 기운입니다. 변동·이동·전환의 계기가 됩니다.', ...meta },
  { type: '형(무례지형)', kind: '형', meaning: '긴장과 갈등이 반복되기 쉬운 관계로, 다듬으면 단련이 됩니다.', ...meta },
  { type: '삼형', kind: '형', meaning: '세 기운이 얽혀 시련과 단련이 따릅니다. 법·건강·관계 갈등 관리가 필요합니다.', ...meta },
  { type: '자형', kind: '형', meaning: '같은 기운이 겹쳐 스스로를 몰아붙이는 경향이 있습니다.', ...meta },
  { type: '파', kind: '파', meaning: '이미 있던 것이 흩어지거나 계획이 틀어지는 작은 균열입니다.', ...meta },
  { type: '해', kind: '해', meaning: '서로 은근히 해를 끼치는 오해·서운함의 기운입니다.', ...meta },
]);
write('stem_relations.json', [
  { type: '천간합', kind: '합', meaning: '두 천간이 합하여 새로운 오행으로 변화하려는 결속입니다.', ...meta },
  { type: '천간충', kind: '충', meaning: '천간끼리 부딪히는 기운으로 생각·목표의 충돌을 뜻합니다.', ...meta },
]);

// ───────── 규칙 (wealth / career / relationship / fortune_cycle) ─────────
type Topic = 'wealth' | 'career' | 'relationship';
const topicKo: Record<Topic, string> = { wealth: '재물', career: '커리어', relationship: '관계' };
const rules: Record<Topic, any[]> = { wealth: [], career: [], relationship: [] };
const topicKey: Record<Topic, 'wealth' | 'career' | 'love'> = { wealth: 'wealth', career: 'career', relationship: 'love' };
const add = (t: Topic, id: string, when: any, text: string, basis: string) => rules[t].push({ id: `${t}_${rules[t].length + 1}_${id}`, topic: t, when, text, basis, ...meta });

const groupPhrase: Record<string, Record<Topic, string>> = {
  비겁: { wealth: '내 힘과 경쟁이 재물을 좌우합니다. 공유·동업 구조를 명확히 하세요.', career: '독립·경쟁 구도에서 강합니다. 협업 시 역할 분담을 분명히 하세요.', relationship: '자기 주관이 강해 대등한 상대와 조화롭습니다.' },
  식상: { wealth: '표현과 기술이 곧 수입원입니다. 재능을 상품화할수록 유리합니다.', career: '창작·기술·교육처럼 결과물을 만드는 직무가 맞습니다.', relationship: '말과 감정 표현이 풍부해 매력적이나 선을 넘는 말은 조심하세요.' },
  재성: { wealth: '재물에 대한 감각과 현실 감각이 뚜렷합니다. 돈의 흐름을 관리하는 습관이 큰 자산이 됩니다.', career: '실적·수익으로 평가받는 현실적인 분야에서 성과가 납니다.', relationship: '현실적인 배려로 관계를 챙깁니다. 계산 없이 마음을 여는 연습도 필요합니다.' },
  관성: { wealth: '책임과 직책이 수입을 만듭니다. 안정적 조직과 전문직이 재물의 터전입니다.', career: '조직·직급·규율 속에서 성장합니다. 압박 관리가 관건입니다.', relationship: '예의와 책임을 중시하지만 서로를 통제하려는 긴장을 경계하세요.' },
  인성: { wealth: '학습과 자격, 귀인이 재물을 지켜 줍니다. 서두른 투자는 피하세요.', career: '배움과 자격이 경력의 토대입니다. 전문성을 쌓을수록 유리합니다.', relationship: '돌봄과 이해를 주고받는 관계를 선호합니다. 의존과 간섭의 균형이 필요합니다.' },
};
for (const t of ['wealth', 'career', 'relationship'] as Topic[]) {
  for (const g of TEN_GODS) {
    add(t, `has_${g}`, { godGte: { [g]: 2 } }, `${g}이 두 개 이상으로 강합니다. ${godInfo[g][topicKey[t]]}`, `십성 ${g} ≥ 2`);
    add(t, `one_${g}`, { godGte: { [g]: 1 }, godLte: { [g]: 1 } }, `${g}이 하나 자리 잡고 있습니다. ${godInfo[g][topicKey[t]]}`, `십성 ${g} = 1`);
    add(t, `no_${g}`, { godLte: { [g]: 0 } }, `${g}이 드러나지 않아 '${godInfo[g].lack}'은 노력으로 채워 가는 영역입니다. 대운·세운에서 ${g}이 들어올 때 기회가 됩니다.`, `십성 ${g} = 0`);
  }
  for (const grp of ['비겁', '식상', '재성', '관성', '인성']) {
    add(t, `grp_${grp}_strong`, { groupGte: { [grp]: 3 } }, `${grp} 기운이 강합니다. ${groupPhrase[grp][t]}`, `${grp} ≥ 3`);
    add(t, `grp_${grp}_none`, { groupLte: { [grp]: 0 } }, `${grp} 기운이 없어 해당 영역은 후천적으로 보완해야 합니다.`, `${grp} = 0`);
  }
  const lv: Record<string, string> = { 극신강: '자기 기운이 매우 강해', 신강: '자기 기운이 충분해', 중화: '기운의 균형이 잡혀', 신약: '자기 기운이 다소 약해', 극신약: '자기 기운이 매우 약해' };
  const tip: Record<string, Record<Topic, string>> = {
    강: { wealth: '재물을 직접 움직이고 감당하는 힘이 있습니다. 베풀며 순환시킬 때 커집니다.', career: '주도적 역할을 맡을수록 유리합니다. 독단만 경계하세요.', relationship: '상대에게 맞추는 여유를 가지면 관계가 깊어집니다.' },
    중: { wealth: '무리하지 않아도 균형 있게 모을 수 있습니다.', career: '역할 전환이 유연해 다양한 환경에 적응합니다.', relationship: '상대와 비교적 균형 있게 소통합니다.' },
    약: { wealth: '큰 재물보다 안전한 구조·협력 속에서 지키는 편이 낫습니다.', career: '든든한 조직·멘토와 함께할 때 실력이 발휘됩니다.', relationship: '나를 채워 주는 따뜻한 관계가 큰 힘이 됩니다.' },
  };
  for (const level of Object.keys(lv)) {
    const k = level.includes('강') ? '강' : level === '중화' ? '중' : '약';
    add(t, `strength_${level}`, { strength: [level] }, `일간이 ${level}입니다. ${lv[level]} ${tip[k][t]}`, `신강신약 = ${level}`);
  }
  for (const e of ELEMENTS) {
    const txt: Record<Topic, string> = {
      wealth: `${e} 기운이 가장 두드러집니다. ${elemInfo[e].job.split('·').slice(0, 4).join('·')} 분야의 기회가 재물과 잘 연결됩니다.`,
      career: `${e} 기운이 두드러집니다(${elemInfo[e].attr}). ${elemInfo[e].job} 분야가 잘 맞습니다.`,
      relationship: `${e} 기운이 두드러져 ${elemInfo[e].love}에 가깝습니다.`,
    };
    add(t, `dom_${e}`, { dominant: [e] }, txt[t], `오행 최다 = ${e}`);
    add(t, `miss_${e}`, { missing: [e] }, `${e} 기운이 비어 있습니다. '${elemInfo[e].lack}'을 의식적으로 채우면 좋습니다. ${elemInfo[e].tip}`, `오행 결핍 = ${e}`);
  }
  const relTxt: Record<string, Record<Topic, string>> = {
    충: { wealth: '충이 있어 재물의 변동·이동이 잦을 수 있습니다. 큰 결정은 분산해서 하세요.', career: '충은 이직·전환의 계기가 됩니다. 변화를 준비된 전환으로 만드세요.', relationship: '충이 있어 관계에서 부딪힘과 이동이 있을 수 있으나, 조율하면 더 단단해집니다.' },
    합: { wealth: '합이 있어 협력과 연결을 통한 재물 기회가 열립니다.', career: '합이 있어 사람과 조직을 통한 기회가 열립니다.', relationship: '합이 있어 인연이 잘 맺히고 협력적인 관계를 만들기 쉽습니다.' },
    형: { wealth: '형이 있어 법·계약·문서 문제를 꼼꼼히 확인하세요.', career: '형이 있어 압박 속에서 단련되지만 번아웃을 조심하세요.', relationship: '형이 있어 작은 갈등이 반복될 수 있습니다. 대화로 매듭을 풀어 가세요.' },
  };
  for (const k of ['충', '합', '형']) add(t, `rel_${k}`, { relationHas: [k] }, relTxt[k][t], `원국에 ${k} 존재`);
}
write('wealth_rules.json', rules.wealth);
write('career_rules.json', rules.career);
write('relationship_rules.json', rules.relationship);

const cycle: any[] = [];
for (const g of TEN_GODS) {
  cycle.push({ id: `daewoon_${g}`, topic: 'fortune', when: { daewoonGod: g }, text: `현재 대운에서 ${g}의 기운이 들어옵니다. ${godInfo[g].cycle}`, basis: `대운 천간 십성 = ${g}`, ...meta });
  cycle.push({ id: `seun_${g}`, topic: 'fortune', when: { seunGod: g }, text: `올해 세운에서 ${g}의 기운이 들어옵니다. ${godInfo[g].cycle}`, basis: `세운 천간 십성 = ${g}`, ...meta });
}
write('fortune_cycle_rules.json', cycle);

// ───────── 타로 78 ─────────
const major: [string, string, string, string][] = [
  ['바보', '새로운 시작·모험·순수', '무모함·준비 부족·망설임', 'The Fool'], ['마법사', '의지·창조·실행력', '속임수·재능의 낭비', 'The Magician'],
  ['여사제', '직관·내면의 지혜·비밀', '억눌린 직관·숨겨진 의도', 'The High Priestess'], ['여황제', '풍요·돌봄·창조성', '과잉보호·정체된 풍요', 'The Empress'],
  ['황제', '안정·권위·체계', '독단·경직', 'The Emperor'], ['교황', '전통·가르침·신뢰', '낡은 관습·반발', 'The Hierophant'],
  ['연인', '사랑·선택·조화', '불균형·잘못된 선택', 'The Lovers'], ['전차', '의지·승리·전진', '방향 상실·통제력 부족', 'The Chariot'],
  ['힘', '용기·인내·부드러운 힘', '자신감 부족·충동', 'Strength'], ['은둔자', '성찰·탐구·고독 속 지혜', '고립·외면', 'The Hermit'],
  ['운명의 수레바퀴', '전환점·행운·순환', '정체·타이밍의 어긋남', 'Wheel of Fortune'], ['정의', '균형·공정·책임', '불공정·회피', 'Justice'],
  ['매달린 사람', '관점 전환·기다림·희생', '무의미한 지연·고집', 'The Hanged Man'], ['죽음', '끝과 새로운 시작·변환', '변화에 대한 저항·미련', 'Death'],
  ['절제', '조화·균형·치유', '과함·불균형', 'Temperance'], ['악마', '집착·유혹·속박을 직면함', '속박에서 벗어남·해방', 'The Devil'],
  ['탑', '급격한 변화·붕괴 후 재건', '변화를 피함·늦춰진 충격', 'The Tower'], ['별', '희망·치유·영감', '희망 상실·불안', 'The Star'],
  ['달', '불안·무의식·모호함', '혼란이 걷힘·진실이 드러남', 'The Moon'], ['태양', '성공·활력·기쁨', '일시적 낙담·과신', 'The Sun'],
  ['심판', '각성·부름·재평가', '자기 의심·망설임', 'Judgement'], ['세계', '완성·통합·성취', '마무리 부족·미완', 'The World'],
];
const suits: [string, string, Element, string][] = [
  ['완드', '열정·행동·일', '화', 'Wands'], ['컵', '감정·관계·직관', '수', 'Cups'], ['소드', '생각·결정·소통', '금', 'Swords'], ['펜타클', '재물·현실·건강', '토', 'Pentacles'],
];
const ranks: [string, string, string][] = [
  ['에이스', '새로운 가능성의 씨앗이 열립니다', '시작이 지연되거나 기회를 놓칠 수 있습니다'],
  ['2', '선택과 균형의 순간입니다', '결정을 미루며 흔들립니다'], ['3', '협력과 확장의 기운이 자랍니다', '엇박자와 소통 부족을 점검하세요'],
  ['4', '안정과 휴식을 다지는 시기입니다', '정체되거나 변화를 거부하고 있습니다'], ['5', '경쟁과 시련을 통해 배웁니다', '갈등이 가라앉고 회복이 시작됩니다'],
  ['6', '조화와 도움이 오가는 흐름입니다', '불균형한 주고받기를 바로잡아야 합니다'], ['7', '점검하고 버텨야 하는 도전의 구간입니다', '의욕 저하 또는 방향 재설정이 필요합니다'],
  ['8', '집중과 속도가 붙는 시기입니다', '서두름이나 산만함에 주의하세요'], ['9', '성취가 눈앞이나 마지막 고비입니다', '불안과 피로가 누적되어 있습니다'],
  ['10', '한 사이클의 완성과 부담이 함께 옵니다', '짐을 내려놓고 정리할 때입니다'],
  ['페이지', '배우고 탐색하는 새 소식이 옵니다', '미숙함과 산만함을 다잡으세요'], ['나이트', '목표를 향해 움직이는 추진력이 있습니다', '성급함이나 지나친 고집을 조심하세요'],
  ['퀸', '성숙하게 품고 이끄는 힘이 있습니다', '감정·기분에 휘둘리지 않도록 주의하세요'], ['킹', '책임지고 이끄는 통제력이 있습니다', '권위를 앞세우는 경직을 경계하세요'],
];
const tarot: any[] = major.map((m, i) => ({ id: i, arcana: 'major', name: `${m[0]}`, name_en: m[3], suit: null, number: i, upright: m[1], reversed: m[2], element: null, image_key: `tarot_major_${i}`, ...meta }));
for (const [sn, dom, el, en] of suits) ranks.forEach((r, ri) => tarot.push({
  id: tarot.length, arcana: 'minor', name: `${sn} ${r[0]}`, name_en: `${ri === 0 ? 'Ace' : ri < 10 ? ri + 1 : ['Page', 'Knight', 'Queen', 'King'][ri - 10]} of ${en}`, suit: sn, number: ri + 1,
  upright: `${dom}의 영역에서 ${r[1]}`, reversed: `${dom}의 영역에서 ${r[2]}`, element: el, image_key: `tarot_${en.toLowerCase()}_${ri + 1}`, ...meta,
}));
write('tarot_cards.json', tarot);

// ───────── 전생 캐릭터 30 ─────────
const pl: [string, Element, string, string][] = [
  ['약초 의원', '목', '고려 말 산골', '병든 이웃을 풀뿌리로 돌보던 사람'], ['서당 훈장', '목', '조선 중기 마을', '아이들에게 글과 도리를 가르치던 사람'], ['숲의 사냥꾼', '목', '삼국시대 숲', '산의 길을 누구보다 잘 읽던 사람'],
  ['궁중 화원', '목', '조선 궁궐', '꽃과 풍경을 그려 임금의 마음을 달래던 사람'], ['책방 주인', '목', '한양 저잣거리', '낯선 이야기들을 모아 두던 사람'], ['배 목수', '목', '남해 포구', '먼 바다로 나갈 배를 짜던 사람'],
  ['궁중 악사', '화', '신라 궁정', '가락 한 줄로 분위기를 바꾸던 사람'], ['봉화대 지기', '화', '국경 산성', '밤새 불을 지켜 위험을 알리던 사람'], ['대장간 장인', '화', '고구려 철기 마을', '불꽃 앞에서 칼과 쟁기를 벼리던 사람'],
  ['연등 장인', '화', '고려 사찰', '소원을 담은 등을 만들던 사람'], ['무희', '화', '가야의 축제', '춤으로 마을의 기쁨을 이끌던 사람'], ['등대 불지기', '화', '서해 섬', '길 잃은 배들의 불빛이 되어 주던 사람'],
  ['성곽 수문장', '토', '조선 한양 도성', '성문을 지키며 질서를 세우던 사람'], ['도공', '토', '고려 청자 가마', '흙으로 아름다움을 빚던 사람'], ['마을 이장', '토', '조선 시골', '모든 이의 다툼을 중재하던 사람'],
  ['농부 현자', '토', '삼한의 들판', '땅과 계절을 읽어 풍년을 이끌던 사람'], ['객주', '토', '조선 나루터', '길손에게 쉼터와 정보를 내주던 사람'], ['건축 도편수', '토', '신라 사찰', '탑과 전각을 세우던 사람'],
  ['검객', '금', '조선 변방', '의리를 위해 칼을 든 사람'], ['금속 세공사', '금', '백제 공방', '금관과 장신구를 다듬던 사람'], ['암행어사', '금', '조선 전국', '신분을 숨기고 정의를 바로잡던 사람'],
  ['종지기', '금', '고려 산사', '새벽을 알리는 종을 치던 사람'], ['판관', '금', '조선 관아', '냉정함과 공정함으로 판결하던 사람'], ['화폐 감정사', '금', '개성 상단', '진짜와 가짜를 가려내던 사람'],
  ['뱃사공', '수', '한강 나루', '강을 건너는 이들의 사연을 들어주던 사람'], ['점성관', '수', '신라 첨성대', '밤하늘의 별을 읽던 사람'], ['해녀', '수', '제주 바다', '깊은 물에서 숨을 모아 살아가던 사람'],
  ['보부상', '수', '조선 장터', '고개를 넘나들며 소식을 실어 나르던 사람'], ['이야기꾼', '수', '조선 사랑방', '밤마다 사람들을 울리고 웃기던 사람'], ['연못 정원사', '수', '궁궐 후원', '연못에 비친 달을 가꾸던 사람'],
];
write('past_life_archetypes.json', pl.map((p, i) => ({
  id: i, title: p[0], element: p[1], era: p[2], story: `${p[2]}의 ${p[0]}. ${p[3]}이었습니다.`,
  carryover: `그때의 ${elemInfo[p[1]].attr.split('·')[0]}의 기운이 이번 생에서도 ${elemInfo[p[1]].lack}으로 이어진다고 상상해 볼 수 있어요.`,
  disclaimer: '창작 콘텐츠입니다. 실제 전생을 의미하지 않으며 재미와 영감을 위한 이야기예요.', ...meta,
})));

console.log('data generated:', fs.readdirSync(OUT).length, 'files',
  `rules: wealth=${rules.wealth.length} career=${rules.career.length} relationship=${rules.relationship.length} cycle=${cycle.length} total=${rules.wealth.length + rules.career.length + rules.relationship.length + cycle.length}`);
