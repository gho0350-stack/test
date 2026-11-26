// 사주 기초 테이블 (결정론적 계산용 상수)
export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
export const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;
export const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'] as const;

export type Element = '목' | '화' | '토' | '금' | '수';
export const ELEMENTS: Element[] = ['목', '화', '토', '금', '수'];
export const ELEMENT_HANJA: Record<Element, string> = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };

export const STEM_ELEMENT: Element[] = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];
export const BRANCH_ELEMENT: Element[] = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'];
/** 천간 음양: 짝수 index = 양 */
export const stemYang = (i: number) => i % 2 === 0;

/** 지장간 [여기, 중기, 정기] (정기가 마지막). 값은 천간 index */
export const HIDDEN_STEMS: number[][] = [
  [8, 9], // 자: 임 계
  [9, 7, 5], // 축: 계 신 기
  [4, 2, 0], // 인: 무 병 갑
  [0, 1], // 묘: 갑 을
  [1, 9, 4], // 진: 을 계 무
  [4, 6, 2], // 사: 무 경 병
  [2, 5, 3], // 오: 병 기 정
  [3, 1, 5], // 미: 정 을 기
  [4, 8, 6], // 신: 무 임 경
  [6, 7], // 유: 경 신
  [7, 3, 4], // 술: 신 정 무
  [4, 0, 8], // 해: 무 갑 임
];

export const GENERATES: Record<Element, Element> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
export const CONTROLS: Record<Element, Element> = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };

export const TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'] as const;
export type TenGod = (typeof TEN_GODS)[number];

/** 일간(d) 기준 대상 천간(t)의 십성 */
export function tenGodOf(dayStem: number, target: number): TenGod {
  const de = STEM_ELEMENT[dayStem];
  const te = STEM_ELEMENT[target];
  const same = stemYang(dayStem) === stemYang(target);
  if (de === te) return same ? '비견' : '겁재';
  if (GENERATES[de] === te) return same ? '식신' : '상관';
  if (CONTROLS[de] === te) return same ? '편재' : '정재';
  if (CONTROLS[te] === de) return same ? '편관' : '정관';
  return same ? '편인' : '정인'; // te generates de
}

export const TEN_GOD_GROUP: Record<TenGod, '비겁' | '식상' | '재성' | '관성' | '인성'> = {
  비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성',
};

export const SIX_COMBINE: [number, number][] = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
export const TRIPLE_COMBINE: { branches: [number, number, number]; center: number; element: Element }[] = [
  { branches: [8, 0, 4], center: 0, element: '수' },
  { branches: [11, 3, 7], center: 3, element: '목' },
  { branches: [2, 6, 10], center: 6, element: '화' },
  { branches: [5, 9, 1], center: 9, element: '금' },
];
export const DIRECTIONAL_COMBINE: { branches: [number, number, number]; element: Element }[] = [
  { branches: [2, 3, 4], element: '목' },
  { branches: [5, 6, 7], element: '화' },
  { branches: [8, 9, 10], element: '금' },
  { branches: [11, 0, 1], element: '수' },
];
export const CLASH: [number, number][] = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
export const PUNISH_TRIPLE: number[][] = [[2, 5, 8], [1, 10, 7]];
export const PUNISH_PAIR: [number, number][] = [[0, 3]];
export const SELF_PUNISH = [4, 6, 9, 11];
export const BREAK: [number, number][] = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]];
export const HARM: [number, number][] = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];

export const STEM_COMBINE: { pair: [number, number]; element: Element }[] = [
  { pair: [0, 5], element: '토' },
  { pair: [1, 6], element: '금' },
  { pair: [2, 7], element: '수' },
  { pair: [3, 8], element: '목' },
  { pair: [4, 9], element: '화' },
];
export const STEM_CLASH: [number, number][] = [[0, 6], [1, 7], [2, 8], [3, 9]];

/** 오호둔: 연간 -> 인월(1월) 월간 시작 index */
export const monthStemStart = (yearStem: number) => ((yearStem % 5) * 2 + 2) % 10;
/** 오서둔: 일간 -> 자시 시간 시작 index */
export const hourStemStart = (dayStem: number) => ((dayStem % 5) * 2) % 10;

export const ganzhiName = (stem: number, branch: number) => STEMS[stem] + BRANCHES[branch];
export const ganzhiHanja = (stem: number, branch: number) => STEMS_HANJA[stem] + BRANCHES_HANJA[branch];
/** 60갑자 index -> [stem, branch] */
export const fromSexagenary = (i: number): [number, number] => [((i % 10) + 10) % 10, ((i % 12) + 12) % 12];
export const toSexagenary = (stem: number, branch: number) => {
  for (let i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === branch) return i;
  return -1;
};

/** 출생 지역 경도 (진태양시 보정용, 동경) */
export const REGION_LONGITUDE: Record<string, number> = {
  서울: 126.98, 부산: 129.08, 대구: 128.6, 인천: 126.7, 광주: 126.85, 대전: 127.38, 울산: 129.31, 세종: 127.29,
  경기: 127.2, 강원: 128.2, 충북: 127.7, 충남: 126.8, 전북: 127.1, 전남: 126.9, 경북: 128.9, 경남: 128.3, 제주: 126.53, 해외: 135,
};
