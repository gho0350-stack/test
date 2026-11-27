/** 클라이언트에서도 쓰는 가벼운 카드 메타데이터 (생성 로직은 서버 전용 cards.ts) */
export type Category = 'essence' | 'talent' | 'wealth' | 'love' | 'flow' | 'past' | 'tarot' | 'consult';
export const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: 'essence', name: '나의 본질', icon: '🌱' }, { id: 'talent', name: '재능과 성향', icon: '💎' }, { id: 'wealth', name: '재물과 성공', icon: '🪙' },
  { id: 'love', name: '사랑과 인연', icon: '💞' }, { id: 'flow', name: '인생의 흐름', icon: '⏳' }, { id: 'past', name: '전생의 기록', icon: '🌌' }, { id: 'tarot', name: '오늘의 타로', icon: '🃏' }, { id: 'consult', name: '상담 카드', icon: '🔮' },
];
/** 슬롯 카드 키 → 카테고리 (cards.ts 의 정의와 테스트로 일치 검증) */
export const CARD_CATEGORY: Record<string, Category> = {
  essence_day: 'essence', essence_element: 'essence', hidden_story: 'essence', talent_main: 'talent',
  wealth_style: 'wealth', wealth_income: 'wealth', wealth_manage: 'wealth', wealth_type: 'wealth', wealth_career: 'wealth',
  love_type: 'love', love_mirror: 'love', love_map: 'love', love_thread: 'love',
  flow_daewoon: 'flow', flow_seun: 'flow', flow_wolun: 'flow', flow_today: 'flow', past_life: 'past',
};
