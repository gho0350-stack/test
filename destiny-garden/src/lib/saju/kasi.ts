/**
 * 한국천문연구원 특일/음양력 API (공공데이터포털 15012679) 교차 검증 클라이언트.
 * 사주 계산 자체는 자체 엔진이 수행하고, 이 API 는 음양력 변환 결과의 '검증' 용도로만 쓴다.
 * 사용: KASI_SERVICE_KEY=... npx tsx scripts/verify-kasi.ts
 */
const BASE = 'https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService';
export interface KasiLunar { lunYear: number; lunMonth: number; lunDay: number; leap: boolean; ganzhi: string }

export async function kasiSolarToLunar(y: number, m: number, d: number, key = process.env.KASI_SERVICE_KEY): Promise<KasiLunar> {
  if (!key) throw new Error('KASI_SERVICE_KEY 가 필요합니다.');
  const url = `${BASE}/getLunCalInfo?serviceKey=${encodeURIComponent(key)}&solYear=${y}&solMonth=${String(m).padStart(2, '0')}&solDay=${String(d).padStart(2, '0')}&_type=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const j: any = await res.json();
  const it = j?.response?.body?.items?.item;
  if (!it) throw new Error('KASI 응답 오류: ' + JSON.stringify(j).slice(0, 200));
  return { lunYear: +it.lunYear, lunMonth: +it.lunMonth, lunDay: +it.lunDay, leap: it.lunLeapmonth === '윤', ganzhi: String(it.lunSecha ?? '') };
}
