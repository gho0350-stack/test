import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcSaju, dayPillarByCount, lunarToSolar, solarToLunar, validateBirth, yearGanzhi, monthGanzhiList } from '../src/lib/saju/engine';

const base = { calendar: 'solar' as const, gender: 'female' as const };

test('1995-04-17 14:30 여 → 을해 경진 무인 기미', () => {
  const c = calcSaju({ ...base, year: 1995, month: 4, day: 17, hour: 14, minute: 30 });
  assert.equal(c.pillars.year.name, '을해');
  assert.equal(c.pillars.month.name, '경진');
  assert.equal(c.pillars.day.name, '무인');
  assert.equal(c.pillars.hour?.name, '기미');
  assert.equal(c.daewoon.forward, true); // 음년 여자 = 순행
});

test('일주: 독립 계산식(일수 카운트)과 라이브러리 일치 (2000개 샘플)', () => {
  for (let i = 0; i < 2000; i++) {
    const t = new Date(Date.UTC(1930, 0, 1) + i * 13 * 86400000);
    const y = t.getUTCFullYear(), m = t.getUTCMonth() + 1, d = t.getUTCDate();
    const c = calcSaju({ ...base, year: y, month: m, day: d, hour: 12, minute: 0 });
    assert.equal(c.pillars.day.name, dayPillarByCount(y, m, d).name, `${y}-${m}-${d}`);
  }
  assert.equal(dayPillarByCount(2000, 1, 1).name, '무오');
});

test('입춘 경계: 입춘 직전은 전년도 연주, 직후는 새 연주', () => {
  // 2026 입춘 2026-02-04 04:02
  const before = calcSaju({ ...base, year: 2026, month: 2, day: 4, hour: 3, minute: 0 });
  const after = calcSaju({ ...base, year: 2026, month: 2, day: 4, hour: 5, minute: 0 });
  assert.equal(before.pillars.year.name, '을사');
  assert.equal(after.pillars.year.name, '병오');
  assert.equal(before.pillars.month.name, '기축');
  assert.equal(after.pillars.month.name, '경인');
});

test('월주: 절기 당일 교체 (청명 1995-04-05 14:08)', () => {
  const a = calcSaju({ ...base, year: 1995, month: 4, day: 5, hour: 14, minute: 0 });
  const b = calcSaju({ ...base, year: 1995, month: 4, day: 5, hour: 14, minute: 30 });
  assert.equal(a.pillars.month.branchName, '묘');
  assert.equal(b.pillars.month.branchName, '진');
});

test('생시 미상: 시주를 만들지 않는다', () => {
  const c = calcSaju({ ...base, year: 1990, month: 8, day: 8 });
  assert.equal(c.pillars.hour, null);
  assert.equal(c.meta.hourKnown, false);
  assert.ok(c.boundaries.warnings.some((w) => w.includes('시주는 계산하지 않았')));
});

test('자시 처리 옵션: 23:30 일주/시주', () => {
  const same = calcSaju({ ...base, year: 2000, month: 1, day: 1, hour: 23, minute: 30, nightZi: 'same_day' });
  const next = calcSaju({ ...base, year: 2000, month: 1, day: 1, hour: 23, minute: 30, nightZi: 'next_day' });
  assert.equal(same.pillars.day.name, '무오');
  assert.equal(next.pillars.day.name, '기미');
  assert.equal(same.pillars.hour?.branchName, '자');
});

test('음력 윤달 변환: 2020 윤4월 10일 = 2020-06-01', () => {
  assert.deepEqual(lunarToSolar(2020, 4, 10, true), { y: 2020, m: 6, d: 1 });
  assert.deepEqual(solarToLunar(2020, 6, 1), { y: 2020, m: 4, d: 10, leap: true });
  const c = calcSaju({ calendar: 'lunar', year: 2020, month: 4, day: 10, isLeapMonth: true, gender: 'male', hour: 10, minute: 0 });
  assert.deepEqual([c.solar.y, c.solar.m, c.solar.d], [2020, 6, 1]);
});

test('유효하지 않은 입력 거부', () => {
  assert.ok(validateBirth({ ...base, year: 1995, month: 2, day: 30 }));
  assert.ok(validateBirth({ ...base, calendar: 'lunar', year: 1995, month: 3, day: 18, isLeapMonth: true }));
  assert.ok(validateBirth({ ...base, year: 1800, month: 1, day: 1 }));
  assert.equal(validateBirth({ ...base, year: 1995, month: 4, day: 17 }), null);
});

test('십성/오행/지장간 구조', () => {
  const c = calcSaju({ ...base, year: 1995, month: 4, day: 17, hour: 14, minute: 30 });
  // 일간 무토: 연간 을(목,음) = 정관, 월간 경(금,양) = 식신
  assert.equal(c.pillars.year.tenGodStem, '정관');
  assert.equal(c.pillars.month.tenGodStem, '식신');
  assert.equal(c.pillars.day.tenGodStem, null);
  assert.equal(c.pillars.day.hidden.map((h) => h.stem).join(''), '무병갑');
  assert.equal(Object.values(c.elements.visible).reduce((a, b) => a + b, 0), 8);
  assert.equal(Object.values(c.tenGods).reduce((a, b) => a + b, 0), 7);
});

test('대운 10개, 연속 간지/순역행', () => {
  const m = calcSaju({ ...base, gender: 'male', year: 1995, month: 4, day: 17, hour: 14, minute: 30 });
  const f = calcSaju({ ...base, gender: 'female', year: 1995, month: 4, day: 17, hour: 14, minute: 30 });
  assert.equal(m.daewoon.list.length, 10);
  assert.equal(m.daewoon.forward, false);
  assert.equal(f.daewoon.forward, true);
  assert.equal(f.daewoon.list[0].ganzhi, '신사'); // 경진 다음 = 신사
});

test('세운·월운', () => {
  assert.equal(yearGanzhi(2026).name, '병오');
  const w = monthGanzhiList(2026);
  assert.equal(w.length, 12);
  assert.equal(w[0].ganzhi, '경인'); // 병년 인월 = 경인
});

test('진태양시 보정(서울 -32분)', () => {
  const c = calcSaju({ ...base, year: 1995, month: 4, day: 17, hour: 7, minute: 20, region: '서울', longitudeCorrection: true });
  assert.equal(c.correctionMinutes, -32);
  assert.equal(c.solar.hour, 6); assert.equal(c.solar.minute, 48);
});
