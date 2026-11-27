/**
 * 한국천문연구원 음양력 API 와 자체 엔진 교차 검증.
 *  - 음양력 변환(년·월·일·윤달) / 일주(일진) / 연주(세차, 입춘 이전 구간 제외) / 월주(월건)
 * 실행: KASI_SERVICE_KEY=... [KASI_BASE=http://apis.data.go.kr] npx tsx scripts/verify-kasi.ts [표본수]
 */
import { kasiSolarToLunar } from '../src/lib/saju/kasi';
import { calcSaju, solarToLunar } from '../src/lib/saju/engine';

const N = Number(process.argv[2] || 80);
const fixed: [number, number, number][] = [[1995, 4, 17], [2020, 6, 1], [2000, 1, 1], [1984, 2, 2], [2023, 3, 22], [2033, 12, 31], [1900, 1, 31], [2024, 2, 10], [2026, 2, 4], [2026, 2, 3], [1995, 4, 5], [1995, 4, 6]];
let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const samples = [...fixed];
while (samples.length < N) { const y = 1930 + Math.floor(rnd() * 100), m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28); samples.push([y, m, d]); }

(async () => {
  const diff: string[] = []; let lunOK = 0, dayOK = 0, yearOK = 0, yearN = 0, monOK = 0, n = 0;
  const monDiff: string[] = [];
  for (let i = 0; i < samples.length; i += 4) {
    await Promise.all(samples.slice(i, i + 4).map(async ([y, m, d]) => {
      let k; try { k = await kasiSolarToLunar(y, m, d); } catch (e: any) { diff.push(`${y}-${m}-${d} API오류 ${e.message}`); return; }
      n++;
      const mine = solarToLunar(y, m, d);
      const c = calcSaju({ calendar: 'solar', year: y, month: m, day: d, hour: 12, minute: 0, gender: 'female' });
      if (mine.y === k.lunYear && mine.m === k.lunMonth && mine.d === k.lunDay && mine.leap === k.leap) lunOK++; else diff.push(`음력 ${y}-${m}-${d}: 자체 ${mine.y}.${mine.m}.${mine.d}${mine.leap ? '윤' : ''} / KASI ${k.lunYear}.${k.lunMonth}.${k.lunDay}${k.leap ? '윤' : ''}`);
      if (c.pillars.day.name === k.day) dayOK++; else diff.push(`일주 ${y}-${m}-${d}: 자체 ${c.pillars.day.name} / KASI ${k.day}`);
      if (!(m === 1 || (m === 2 && d < 25))) { yearN++; if (c.pillars.year.name === k.year) yearOK++; else diff.push(`연주 ${y}-${m}-${d}: 자체 ${c.pillars.year.name} / KASI ${k.year}`); }
      if (c.pillars.month.name === k.month) monOK++; else monDiff.push(`${y}-${m}-${d}: 자체 ${c.pillars.month.name} / KASI ${k.month}`);
    }));
  }
  console.log(`표본 ${n}건 | 음양력 ${lunOK}/${n} | 일주 ${dayOK}/${n} | 연주 ${yearOK}/${yearN} (1~2월 중순 제외) | 월주 ${monOK}/${n}`);
  diff.forEach((x) => console.log('  불일치', x));
  if (monDiff.length) { console.log(`월주 불일치 ${monDiff.length}건(KASI 월건은 음력월 기준일 수 있음, 아래 일부)`); monDiff.slice(0, 8).forEach((x) => console.log('   ', x)); }
  process.exit(diff.length ? 1 : 0);
})();
