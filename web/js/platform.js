// 플랫폼 어댑터 — 웹/앱 차이를 이 파일 한 곳에 모읍니다.
// 앱 전환 시(Capacitor): storage → @capacitor/preferences, openLink → @capacitor/browser,
// track → Firebase/Meta SDK 로 교체하면 나머지 코드는 그대로 사용 가능.
const KEY = 'teumteum:v1';

export const storage = {
  get(k, fallback) {
    try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); return k in v ? v[k] : fallback; }
    catch { return fallback; }
  },
  set(k, val) {
    try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); v[k] = val; localStorage.setItem(KEY, JSON.stringify(v)); }
    catch { /* 시크릿 모드 등 */ }
  },
};

export function openLink(url) { window.open(url, '_blank', 'noopener'); }

// 광고 평가용 이벤트. Meta Pixel(fbq)이 있으면 전송, 없으면 콘솔/로컬에만 기록.
export function track(name, data = {}) {
  const payload = { ...data, ...utm() };
  try { if (window.fbq) window.fbq('trackCustom', name, payload); } catch {}
  console.debug('[track]', name, payload);
}

function utm() {
  const p = new URLSearchParams(location.search);
  const o = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach((k) => { if (p.get(k)) o[k] = p.get(k); });
  return o;
}
