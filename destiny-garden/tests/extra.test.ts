import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcSaju } from '../src/lib/saju/engine';
import { stageOf, gongmang, napeum, sinsal, gyeokguk, yongsin, seunTable, percent, STAGES } from '../src/lib/saju/extra';
import { STEMS, BRANCHES } from '../src/lib/saju/tables';

const S = (s: string) => STEMS.indexOf(s as any), Br = (s: string) => BRANCHES.indexOf(s as any);
test('12운성: 양간 순행·음간 역행 (교과서 값)', () => {
  assert.equal(stageOf(S('갑'), Br('해')), '장생'); assert.equal(stageOf(S('갑'), Br('인')), '건록'); assert.equal(stageOf(S('갑'), Br('묘')), '제왕'); assert.equal(stageOf(S('갑'), Br('신')), '절');
  assert.equal(stageOf(S('병'), Br('인')), '장생'); assert.equal(stageOf(S('병'), Br('오')), '제왕');
  assert.equal(stageOf(S('을'), Br('오')), '장생'); assert.equal(stageOf(S('을'), Br('묘')), '건록'); assert.equal(stageOf(S('을'), Br('인')), '제왕'); assert.equal(stageOf(S('을'), Br('해')), '사');
  assert.equal(stageOf(S('경'), Br('사')), '장생'); assert.equal(stageOf(S('신'), Br('자')), '장생'); assert.equal(stageOf(S('임'), Br('신')), '장생'); assert.equal(stageOf(S('계'), Br('묘')), '장생');
  for (let s = 0; s < 10; s++) assert.equal(new Set(Array.from({ length: 12 }, (_, b) => stageOf(s, b))).size, 12); // 12개 모두 한 번씩
  assert.equal(STAGES.length, 12);
});
test('공망: 갑자순=술해, 갑술순=신유, 갑신순=오미, 갑오순=진사, 갑진순=인묘, 갑인순=자축', () => {
  const cases: [string, string, string[]][] = [['갑', '자', ['술', '해']], ['을', '축', ['술', '해']], ['갑', '술', ['신', '유']], ['갑', '신', ['오', '미']], ['갑', '오', ['진', '사']], ['갑', '진', ['인', '묘']], ['갑', '인', ['자', '축']]];
  for (const [s, br, want] of cases) assert.deepEqual(gongmang(S(s), Br(br)).map((i) => BRANCHES[i]), want, s + br);
});
test('납음오행 (갑자·을축=해중금, 무인·기묘=성두토, 임술·계해=대해수)', () => {
  assert.equal(napeum(S('갑'), Br('자')), '해중금'); assert.equal(napeum(S('을'), Br('축')), '해중금'); assert.equal(napeum(S('무'), Br('인')), '성두토'); assert.equal(napeum(S('임'), Br('술')), '대해수');
});
test('신살·격국·용신·세운표: 1995-04-17 14:30 여', () => {
  const c = calcSaju({ calendar: 'solar', year: 1995, month: 4, day: 17, hour: 14, minute: 30, gender: 'female' }); // 을해 경진 무인 기미
  const g = gyeokguk(c); assert.equal(g.name, '건록격'); // 월지 진의 정기 무 = 일간과 같은 무(비견)
  const sin = sinsal(c).map((s) => s.name); assert.ok(sin.includes('역마살') || sin.includes('도화살') || sin.includes('화개살'), sin.join());
  const ys = yongsin(c); assert.equal(ys.mode.startsWith('억제'), true); assert.ok(['재성', '관성', '식상'].includes(ys.main));
  const t = seunTable(c, 2024, 2028); assert.equal(t[2].name, '병오'); assert.equal(t.length, 5);
  assert.equal(Object.values(percent(c)).reduce((a, b) => a + b, 0) >= 99, true);
});
