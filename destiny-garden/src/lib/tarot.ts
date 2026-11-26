import crypto from 'node:crypto';
import { C } from './content';
import type { SajuChart } from './saju/engine';
import { GENERATES, CONTROLS } from './saju/tables';

const seedInt = (s: string) => crypto.createHash('sha256').update(s).digest().readUInt32BE(0);
function mulberry(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** 사용자·날짜 시드로 고정된 78장 섞기 순서 (새로고침해도 같은 배열) */
export function spreadOrder(userId: string, date: string): number[] {
  const rnd = mulberry(seedInt(`${userId}|${date}|spread`));
  const arr = Array.from({ length: 78 }, (_, i) => i);
  for (let i = 77; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}
export const isReversed = (userId: string, date: string, pos: number) => mulberry(seedInt(`${userId}|${date}|rev|${pos}`))() < 0.3;

export function interpretDraw(cardId: number, reversed: boolean, chart: SajuChart | null) {
  const card = C.tarotCards[cardId];
  const base = reversed ? card.reversed : card.upright;
  let personal = '';
  if (chart) {
    const dm = chart.dayMaster.element;
    const ce = card.element as any;
    if (ce) {
      if (ce === dm) personal = `카드의 ${ce} 기운이 당신의 일간(${dm})과 같아, 오늘은 본래의 색이 더 선명해집니다.`;
      else if (GENERATES[ce as keyof typeof GENERATES] === dm) personal = `카드의 ${ce} 기운이 당신의 ${dm} 기운을 북돋아 주는 날입니다.`;
      else if (CONTROLS[ce as keyof typeof CONTROLS] === dm) personal = `카드의 ${ce} 기운이 당신의 ${dm}을(를) 눌러 조심스럽게 움직일 날입니다.`;
      else personal = `카드의 ${ce} 기운이 당신의 ${dm} 기운과 어우러져 새로운 시각을 줍니다.`;
    } else personal = `대아르카나가 나왔습니다. 오늘은 ${chart.dayMaster.stem}일간인 당신의 큰 흐름을 비추는 카드예요. ${chart.elements.weakest} 기운을 의식적으로 챙겨 보세요.`;
  }
  return {
    cardId, name: card.name, name_en: card.name_en, reversed, keywords: base,
    reading: `${reversed ? '역방향' : '정방향'} · ${base}.`,
    advice: reversed ? '지금은 서두르기보다 점검하고 방향을 다시 잡아 보세요.' : '카드의 흐름을 믿고 한 걸음 내디뎌 보세요.',
    personal,
  };
}
