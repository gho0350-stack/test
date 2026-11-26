import { kasiSolarToLunar } from '../src/lib/saju/kasi';
import { solarToLunar } from '../src/lib/saju/engine';

// 윤달·연말연초·절기 경계 포함 표본으로 자체 변환과 KASI 결과를 대조한다.
const samples: [number, number, number][] = [[1995, 4, 17], [2020, 6, 1], [2000, 1, 1], [1984, 2, 2], [2023, 3, 22], [2033, 12, 31], [1900, 1, 31], [2024, 2, 10]];
(async () => {
  let bad = 0;
  for (const [y, m, d] of samples) {
    const mine = solarToLunar(y, m, d), k = await kasiSolarToLunar(y, m, d);
    const same = mine.y === k.lunYear && mine.m === k.lunMonth && mine.d === k.lunDay && mine.leap === k.leap;
    if (!same) bad++;
    console.log(same ? 'OK ' : 'DIFF', `${y}-${m}-${d}`, mine, k);
  }
  process.exit(bad ? 1 : 0);
})();
