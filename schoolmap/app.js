/* 어디살지 - 샘플 앱 (바닐라 JS, 해시 라우팅). 앱화 시 data/store 부분만 API 로 교체하세요. */
(function () {
  'use strict';
  const D = window.SG;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hash = (str) => { let h = 5381; for (const c of String(str)) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return 'h' + (h >>> 0).toString(36); };
  const rng = (seed) => { let a = parseInt(hash(seed).slice(1), 36); return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = (x) => Math.round(x * 10) / 10;
  const avg = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
  const TODAY = '2026-11-22';
  const AREA_F = { 59: 0.74, 84: 1, 101: 1.3 };
  const AREA_RANGE = { 59: [55, 60], 84: [80, 85], 101: [95, 105] };
  const R = window.SG_REAL || {};
  const normName = (n) => String(n || '').replace(/\(.*?\)/g, '').replace(/[\s·\-]/g, '').replace(/(아파트|단지)$/, '');
  const METRIC = { med: ['의대', 0], sky: ['SKY', 1], seoul: ['인서울', 2] };
  const METRIC_ICON = { med: 'medical', sky: 'star', seoul: 'cap' };

  /* ---------- 아이콘 (선 아이콘, 이모지 사용 안 함) ---------- */
  const ICONS = {
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.6 9.2c-.5-.9-1.4-1.4-2.6-1.4-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.1-.5-2.6-1.4"/><path d="M12 6v1.8M12 16.2V18"/>',
    chevR: '<path d="M9 5l7 7-7 7"/>', chevL: '<path d="M15 5l-7 7 7 7"/>', chevD: '<path d="M5 9l7 7 7-7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    medical: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    star: '<path d="M12 3l2.8 5.9 6.2.8-4.6 4.3 1.2 6.4L12 17.3 6.4 20.4l1.2-6.4L3 9.7l6.2-.8z"/>',
    book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    bookopen: '<path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2z"/><path d="M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/>',
    bars: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
    chart: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    pencil: '<path d="M4 20l1-4.5L16.5 4a2 2 0 0 1 3 3L8 18.5z"/>',
    heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/><circle cx="9" cy="14" r=".6"/><circle cx="15" cy="14" r=".6"/>',
    backpack: '<path d="M9 7V5a3 3 0 0 1 6 0v2"/><rect x="5" y="7" width="14" height="14" rx="4"/><path d="M9 14h6"/>',
    tree: '<path d="M12 22v-6"/><path d="M12 3a5 5 0 0 0-4 8 4 4 0 0 0 4 5 4 4 0 0 0 4-5 5 5 0 0 0-4-8z"/>',
    cart: '<path d="M3 4h3l2.5 11h9L20 7H7"/><circle cx="9" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>',
    school: '<path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-6h4v6"/>',
    crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
    truck: '<path d="M2 6h12v10H2zM14 9h4l3 3v4h-7z"/><circle cx="6" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
    pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  const ic = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const icG = (n, x, y, s, color) => `<g transform="translate(${(x - s / 2).toFixed(1)} ${(y - s / 2).toFixed(1)}) scale(${(s / 24).toFixed(3)})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</g>`;
  const tri = (up) => `<span class="${up ? 'up' : 'down'}"><i class="tri"></i>`;

  /* ---------- 금액 포맷 ---------- */
  const eokS = (x) => (x == null || isNaN(x) ? '-' : (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, '') + '억');
  const eokL = (x) => { if (x == null || isNaN(x)) return '-'; const e = Math.floor(x + 1e-9); const m = Math.round((x - e) * 10) * 1000; return m ? `${e}억 ${m.toLocaleString()}만` : `${e}억`; };
  const range = (a, b) => (a == null || b == null ? '-' : a === b ? eokS(a) : `${eokS(a)} ~ ${eokS(b)}`);
  const nv = (v, d) => (v == null ? d : v);

  /* ---------- UI 상태 ---------- */
  const ui = {
    area: 59, metric: 'sky', region: 'all', sortKey: 'metric', preSel: null,
    layers: { zone: true, apt: true, edu: true, academy: true, life: true, culture: true, transit: true }, sel: null, vb: null, listKind: 'sale',
    budget: { kind: 'sale', sale: 15, jeonse: 6 }, cmp: ['sookmyung', 'sehwa', 'hwimun'],
    aptTab: 'chart', aptKind: 'both', aptRange: 3, aptCmp: [],
    cRegion: 'all', cCat: 'all', cQuery: '', mTab: 'in', mOpen: null
  };
  const view = $('#view');

  /* ---------- 데이터 모델 ---------- */
  const REG = Object.fromEntries(D.REGIONS.map((r) => [r.id, r]));
  const ADM = window.SG_ADMISSIONS || {};
  const admOf = (id) => { const ys = ADM[id] || {}, y = Object.keys(ys).map(Number).filter((k) => ys[k].has_count).sort((a, b) => b - a)[0]; return y ? Object.assign({ year: y }, ys[y]) : null; };
  const SCHOOLS = D.SCHOOLS.map((s) => Object.assign({}, s, {
    adm: admOf(s.id),
    statsRaw: admOf(s.id) ? [admOf(s.id).medical_count, admOf(s.id).sky_count, admOf(s.id).inseoul_count] : D.STATS[s.id],
    stats: (admOf(s.id) ? [admOf(s.id).medical_count, admOf(s.id).sky_count, admOf(s.id).inseoul_count] : D.STATS[s.id]).map((v) => (v == null ? 0 : v)),
    apts: s.apts.map((a, i) => ({ id: s.id + '-' + i, sid: s.id, letter: String.fromCharCode(65 + i), name: a[0], hh: a[1], year: a[2], sale: a[3], jeonse: a[4], elem: a[5], mid: a[6], hi: a[7] }))
  }));
  let APTS = SCHOOLS.flatMap((s) => s.apts);
  const Z = window.SG_ZONES || {};
  const zoneOf = (s) => (Z.zones || []).find((z) => z.id === (Z.schoolZone || {})[s.id]) || null;
  const sd = (s, k) => (s.statsRaw[k] == null ? '미공개' : s.statsRaw[k]);
  const anyAdm = () => SCHOOLS.some((x) => x.adm);
  const schoolById = (id) => SCHOOLS.find((s) => s.id === id);
  const realOf = (s) => (R.schools || {})[s.id] || null;
  const sexLabel = (c) => ({ '남': '남학교', '여': '여학교', '남여공학': '남녀공학' }[c] || c);
  const aptById = (id) => APTS.find((a) => a.id === id);
  const schoolOf = (a) => schoolById(a.sid);
  const realTrade = (a) => (a.master ? a.rt || {} : (R.trades || {})[`${REG[schoolById(a.sid).region].gu}|${normName(a.name)}`] || null);
  APTS.filter((a) => !a.master).forEach((a) => {
    const t = realTrade(a); if (t && t.build) { a.year = t.build; a.yearReal = true; }
    const ga = ((R.geo || {}).apts || {})[a.id]; if (ga && ga.walk_min_est) { a.hi = ga.walk_min_est; a.hiEst = true; a.straight = ga.straight_m; }
    const kp = (R.kapt || {})[`${REG[schoolById(a.sid).region].gu}|${normName(a.name)}`]; if (kp && +kp.households) { a.hh = +kp.households; a.hhReal = true; }
    if (kp && /^\d{8}$/.test(kp.approved || '')) { a.year = +kp.approved.slice(0, 4); a.yearReal = true; }
  });
  /* 전체 아파트 마스터(실데이터): 학교군 경계 안 단지 전체를 해당 학교군 학교들의 '배정 가능 단지'로 사용 */
  const MD = (window.SG_MASTER || {}).apts || [], MAPTS = [], ZAPTS = {}, ZSCH = {};
  const toStat = (o) => (o ? Object.fromEntries(Object.entries(o).map(([p, v]) => [p, { median: v[0], min: v[1], max: v[2], count: v[3], last: v[4] }])) : undefined);
  SCHOOLS.forEach((s) => { const z = (Z.schoolZone || {})[s.id]; if (z) (ZSCH[z] = ZSCH[z] || []).push(s); });
  MD.forEach((m, i) => {
    const sc = (ZSCH[m.z] || [])[0]; if (!sc) return;
    const a = { id: 'm' + i, master: true, sid: sc.id, zone: m.z, name: m.n, gu: m.gu, dong: m.d, hh: m.hh || 0, hhReal: !!m.hh, year: m.yr || 0, yearReal: !!m.yk, coord: { lat: m.la, lng: m.lo }, elem: null, mid: null, hi: null, zb: m.zb || 0,
      rt: m.sale || m.jeonse ? { sale: toStat(m.sale), jeonse: toStat(m.jeonse), series: m.ser, recent: m.rc } : null };
    MAPTS.push(a); (ZAPTS[m.z] = ZAPTS[m.z] || []).push(a);
  });
  if (MAPTS.length) { SCHOOLS.forEach((s) => { const l = ZAPTS[(Z.schoolZone || {})[s.id]]; if (l && l.length) { s.sampleApts = s.apts; s.apts = l; } }); APTS = MAPTS; }
  const walkTo = (a, s) => {
    if (!a.master) return a.hi;
    const g = ((R.geo || {}).schools || {})[s.id]; if (!g) return null;
    const k = Math.cos((g.y * Math.PI) / 180) * 111320, d = Math.hypot((a.coord.lng - g.x) * k, (a.coord.lat - g.y) * 110540);
    return Math.max(1, Math.round((d * 1.3) / 80));
  };
  const hasData = (a) => (a.master ? !!(a.rt && (a.rt.sale || a.rt.jeonse)) : linked(a));
  const wm = (v) => (v == null ? '-' : v + '분'), hhT = (a) => (a.hh ? a.hh.toLocaleString() : '-'), yrT = (a) => (a.year ? a.year + '년' : '-');
  const walkHi = (a, s) => (a.master ? (walkTo(a, s || schoolOf(a)) == null ? '-' : walkTo(a, s || schoolOf(a)) + '분 (추정)') : `${a.hi}분${a.hiEst ? ' (추정)' : ''}`);
  const realStat = (a, k) => { const t = realTrade(a); return t && t[k] && t[k][ui.area] ? t[k][ui.area] : null; };
  const pr = (a, k) => { const rs = realStat(a, k === 'jeonse' ? 'jeonse' : 'sale'); if (rs) return rs.median; if (realTrade(a)) return null; return r1((k === 'jeonse' ? a.jeonse : a.sale) * AREA_F[ui.area]); };
  const linked = (a) => !!realTrade(a);
  const ps = (a, k, p) => { if (linked(a)) { const st = (realTrade(a)[k] || {})[p]; return st ? st.median : null; } return r1((k === 'jeonse' ? a.jeonse : a.sale) * AREA_F[p]); };
  const ratio = (a, p) => { const sv = ps(a, 'sale', p), jv = ps(a, 'jeonse', p); return sv && jv ? Math.round((jv / sv) * 100) + '%' : '-'; };
  const srcTag = (a) => (a.master ? (hasData(a) ? '<span class="rt real">실거래</span>' : '<span class="rt">거래 없음</span>') : linked(a) ? '<span class="rt real">실거래</span>' : '<span class="rt">샘플</span>');
  const agg = (s) => { const sv = s.apts.map((a) => pr(a, 'sale')).filter((v) => v != null), jv = s.apts.map((a) => pr(a, 'jeonse')).filter((v) => v != null), mm = (v, f) => (v.length ? f(...v) : null); return { sMin: mm(sv, Math.min), sMax: mm(sv, Math.max), jMin: mm(jv, Math.min), jMax: mm(jv, Math.max), sAvg: sv.length ? avg(sv) : null, jAvg: jv.length ? avg(jv) : null }; };
  const regOf = (s) => REG[s.region];

  function tradesOf(a) {
    if (linked(a)) { const rc = (realTrade(a) || {}).recent || {}; return { sale: ((rc.sale || {})[ui.area] || []), jeonse: ((rc.jeonse || {})[ui.area] || []), real: true }; }
    const r = rng(a.id);
    const mk = (base, n, spread) => { let t = new Date(TODAY).getTime(); const out = []; for (let i = 0; i < n; i++) { t -= (r() * 22 + 6) * 864e5; out.push({ date: new Date(t).toISOString().slice(0, 10), floor: Math.floor(r() * 24) + 2, price: r1((base + (r() - 0.5) * spread) * AREA_F[ui.area]) }); } return out; };
    return { sale: mk(a.sale, 4, 1.6), jeonse: mk(a.jeonse, 3, 0.8) };
  }
  const facCache = {};
  function factors(a, kind) {
    const key = a.id + kind; if (facCache[key]) return facCache[key];
    const r = rng(key), start = kind === 'sale' ? 0.74 + r() * 0.14 : 0.82 + r() * 0.1, phase = r() * 6, f = [];
    for (let i = 0; i < 60; i++) {
      const v = start + (1 - start) * (i / 59), dip = (kind === 'sale' ? -0.09 : -0.04) * Math.exp(-Math.pow((i - 30) / 9, 2));
      f.push(v * (1 + dip + 0.012 * Math.sin(i / 3 + phase) + (r() - 0.5) * 0.012));
    }
    return (facCache[key] = f.map((x) => x / f[59]));
  }
  const realSeries = (a, kind) => {
    const t = realTrade(a), ser = t && t.series && t.series[kind] && t.series[kind][ui.area]; if (!ser || ser.length < 2) return null;
    const m = {}; ser.forEach(([ym, med]) => { m[ym] = med; }); const out = [];
    for (let i = 0; i < 60; i++) { const tt = 2026 * 12 + 10 - (59 - i), ym = `${Math.floor(tt / 12)}${String((tt % 12) + 1).padStart(2, '0')}`; out.push(m[ym] != null ? m[ym] : null); }
    return out;
  };
  const seriesOf = (a, kind) => { if (linked(a)) return realSeries(a, kind); return factors(a, kind).map((x) => x * pr(a, kind)); };
  const change1y = (a, kind) => { if (linked(a)) { const v = realSeries(a, kind); if (!v) return null; const win = (from, to) => { const x = v.slice(from, to).filter((q) => q != null); return x.length ? avg(x) : null; }, cur = win(57, 60), prev = win(45, 49); return cur != null && prev != null ? cur / prev - 1 : null; } const f = factors(a, kind); return f[59] / f[47] - 1; };
  const chgHtml = (c) => c == null ? '<small class="muted">추이 데이터 없음</small>' : `${tri(c >= 0)}${c >= 0 ? '+' : ''}${(c * 100).toFixed(1)}%</span> <small class="muted">(1년)</small>`;

  /* ---------- 저장소 ---------- */
  const KEY = 'schoolmap.v3';
  let db;
  function seed() {
    return { users: D.USERS_SEED.map((u) => ({ id: u.id, nick: u.nick, email: u.email, pw: hash(u.pw), region: u.region, verified: !!u.verified })), posts: JSON.parse(JSON.stringify(D.POSTS_SEED)), msgs: JSON.parse(JSON.stringify(D.MSGS_SEED)), session: null, favs: { s: [], a: [] }, recent: [] };
  }
  function load() { try { const v = localStorage.getItem(KEY); db = v ? JSON.parse(v) : seed(); } catch (e) { db = seed(); } db.favs = db.favs || { s: [], a: [] }; db.recent = db.recent || []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* 메모리만 */ } }
  const me = () => db.users.find((u) => u.id === db.session) || null;
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const unreadCount = () => { const u = me(); return u ? db.msgs.filter((m) => m.to === u.nick && !m.read).length : 0; };
  const nickHtml = (n) => { const u = db.users.find((x) => x.nick === n); return esc(n) + (u && u.verified ? `<span class="ver" title="실거주 인증">${ic('check')}</span>` : ''); };
  const isFav = (t, id) => db.favs[t].includes(id);
  const favBtn = (t, id) => `<button class="favbtn ${isFav(t, id) ? 'on' : ''}" data-act="fav" data-v="${t}:${id}" aria-label="관심 등록" aria-pressed="${isFav(t, id)}">${ic('heart')}</button>`;
  const pushRecent = (sid) => { db.recent = [sid].concat(db.recent.filter((x) => x !== sid)).slice(0, 5); save(); };

  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }
  const badge = (cat) => `<span class="badge b-${cat}">${D.CAT_LABEL[cat]}</span>`;
  const areaSeg = () => `<span class="seg" role="group" aria-label="평형">${[59, 84, 101].map((v) => `<button class="${ui.area === v ? 'on' : ''}" data-act="area" data-v="${v}" title="전용 ${AREA_RANGE[v][0]}~${AREA_RANGE[v][1]}㎡ (서비스 기준)">${v}㎡</button>`).join('')}</span>`;
  const backLink = (href, label) => `<a class="back" href="${href}">${ic('chevL')}${label}</a>`;

  /* ---------- 일러스트 / 차트 ---------- */
  function bldg() {
    const bs = [[14, 84, 52], [76, 40, 66], [152, 62, 58], [222, 92, 46], [276, 70, 56]];
    const g = bs.map(([x, y, w], i) => {
      let win = ''; for (let yy = y + 10; yy < 176; yy += 15) for (let xx = x + 9; xx < x + w - 9; xx += 13) win += `<rect x="${xx}" y="${yy}" width="7" height="9" rx="1" fill="#fff" opacity=".6"/>`;
      return `<rect x="${x}" y="${y}" width="${w}" height="${190 - y}" rx="3" fill="${i % 2 ? 'var(--accent)' : 'var(--c2)'}" opacity="${0.55 + i * 0.07}"/>${win}`;
    }).join('');
    const trees = [[48, 186, 18], [136, 188, 14], [210, 188, 16], [340, 186, 20]].map(([x, y, r]) => `<circle cx="${x}" cy="${y - r * 0.6}" r="${r}" fill="var(--accent)" opacity=".5"/>`).join('');
    return `<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" role="img" aria-label="단지 일러스트"><rect width="360" height="200" fill="var(--accent-soft)"/><circle cx="300" cy="38" r="22" fill="var(--gold)" opacity=".35"/>${g}${trees}<rect y="188" width="360" height="12" fill="var(--accent)" opacity=".3"/></svg>`;
  }
  const monthLabel = (idx59) => { const t = 2026 * 12 + 10 - (59 - idx59); return `${String(Math.floor(t / 12)).slice(2)}.${String((t % 12) + 1).padStart(2, '0')}`; };
  function lineChart(lines, N) {
    const W = 640, H = 250, L = 46, R = 64, T = 14, B = 26;
    const all = lines.flatMap((l) => l.vals.slice(-N).filter((q) => q != null)); let lo = Math.min(...all), hi = Math.max(...all); const pad = (hi - lo) * 0.14 || 1; lo -= pad; hi += pad;
    const x = (i) => L + ((W - L - R) * i) / (N - 1), y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    let g = '';
    for (let k = 0; k <= 4; k++) { const v = lo + ((hi - lo) * k) / 4; g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${eokS(v)}</text>`; }
    const step = N <= 12 ? 3 : N <= 36 ? 6 : 12;
    for (let i = N - 1; i >= 0; i -= step) g += `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="${i === N - 1 ? 'end' : 'middle'}">${monthLabel(59 - (N - 1 - i))}</text>`;
    lines.forEach((l) => {
      const v = l.vals.slice(-N), pts = v.map((p, i) => (p == null ? null : [i, p])).filter(Boolean); if (!pts.length) return;
      const d = pts.map(([i, p], j) => `${j ? 'L' : 'M'}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(''), last = pts[pts.length - 1];
      g += `<path d="${d}" fill="none" stroke="${l.color}" stroke-width="2.5" stroke-linejoin="round"/>${pts.length <= 36 ? pts.map(([i, p]) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p).toFixed(1)}" r="3.2" fill="${l.color}"/>`).join('') : ''}<circle cx="${x(last[0]).toFixed(1)}" cy="${y(last[1]).toFixed(1)}" r="4.5" fill="${l.color}"/><text x="${(x(last[0]) + 8).toFixed(1)}" y="${(y(last[1]) + 4).toFixed(1)}" style="fill:${l.color};font-weight:800;font-size:12px">${eokS(last[1])}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="실거래가 추이 차트">${g}</svg>`;
  }
  function spark(vals, color) {
    const v0 = vals.slice(-24).map((p, i) => (p == null ? null : [i, p])).filter(Boolean); if (v0.length < 2) return ''; const lo = Math.min(...v0.map((q) => q[1])), hi = Math.max(...v0.map((q) => q[1])), d = v0.map(([i, p], j) => `${j ? 'L' : 'M'}${((i / 23) * 200).toFixed(1)},${(40 - ((p - lo) / (hi - lo || 1)) * 34).toFixed(1)}`).join('');
    return `<svg viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" vector-effect="non-scaling-stroke"/></svg>`;
  }

  /* =====================================================================
   * 01 메인
   * ===================================================================== */
  function viewHome() {
    const regs = D.REGIONS.map((r) => { const ss = SCHOOLS.filter((s) => s.region === r.id); return { r, st: [0, 1, 2].map((k) => ss.reduce((n, s) => n + s.stats[k], 0)), avg: avg(ss.map((s) => agg(s).sAvg).filter((v) => v != null)) }; }).sort((a, b) => b.st[1] - a.st[1]);
    const mx = Math.max(...regs.map((x) => x.avg));
    const recent = db.recent.map(schoolById).filter(Boolean);
    view.innerHTML = `
      <section class="hero2">
        <div class="hero-txt">
          <h1>좋은 학교, 합리적인 주거비로 찾으세요</h1>
          <p class="lead">학교군 해당 아파트, 시세, 교육·생활정보까지 한 번에</p>
          <div class="cta2">
            <a class="cta green" href="#/schools"><span class="ci">${ic('cap')}</span><span><b>학교부터 찾기</b><small>원하는 학교의 학교군 아파트 보기</small></span></a>
            <a class="cta gold" href="#/budget"><span class="ci">${ic('coin')}</span><span><b>예산부터 찾기</b><small>예산 내에서 가장 좋은 학군 찾기</small></span></a>
          </div>
          <form id="sform" class="searchbar" role="search">${ic('search')}<input id="q" type="text" placeholder="학교명·지역·아파트명을 입력하세요" aria-label="검색"><button type="submit" aria-label="검색">${ic('search')}</button></form>
          <div class="quick">
            <a href="#/schools?metric=med">${ic('medical')}의대 진학 우수</a><a href="#/schools?metric=sky">${ic('star')}SKY 진학 우수</a><a href="#/schools?metric=seoul">${ic('cap')}인서울 진학 우수</a>
            <a href="#/schools">${ic('pin')}핵심 학군지</a><a href="#/search?new=1">${ic('building')}신축 아파트</a><a href="#/schools">${ic('search')}전체 찾기</a>
          </div>
        </div>
        <div class="hero-art">${bldg()}</div>
      </section>
      <div class="notice">${ic('info')}<span>샘플 화면입니다. 진학 실적·가격·세대수 등 모든 수치는 시연용 가상 데이터이며 실제와 다릅니다.</span></div>
      ${recent.length ? `<div class="recent"><h3>최근 본 학교</h3><div class="chips">${recent.map((s) => `<a class="chip" href="#/school/${s.id}">${esc(s.name)}</a>`).join('')}</div></div>` : ''}
      <div class="home-grid">
        <section class="card pad">
          <div class="sec-h"><span class="crown">${ic('crown')}</span><h2>주요 학군지 TOP ${regs.length}</h2><small>${anyAdm() ? '입력된 실적 포함 · 나머지는 샘플' : '샘플 진학 실적 합계 기준'}</small></div>
          <div style="margin-top:8px">${regs.map((x, i) => `<a class="toprow" href="#/schools?region=${x.r.id}"><span class="rk ${i === 0 ? 'r1' : ''}">${i + 1}</span><span><b>${x.r.dong}</b> <small class="muted">(${x.r.gu})</small></span><span class="st">의대 <b>${x.st[0]}</b> · SKY <b>${x.st[1]}</b> · 인서울 <b>${x.st[2]}</b></span>${ic('chevR')}</a>`).join('')}</div>
        </section>
        <section class="card pad bubble">
          <div class="sec-h"><span class="crown">${ic('bars')}</span><h2>학군 가격 비교</h2></div>
          <p>비슷한 교육환경의 지역 중 가장 합리적으로 들어갈 수 있는 곳은 어디일까요? 지역별 평균 59㎡ 매매가를 비교해 보세요.</p>
          <div class="mini" aria-hidden="true">${regs.map((x) => `<i style="height:${Math.round((x.avg / mx) * 100)}%"></i>`).join('')}</div>
          <a class="btn primary block lg" href="#/compare">지금 비교하기${ic('chevR')}</a>
        </section>
      </div>`;
    $('#sform').onsubmit = (e) => { e.preventDefault(); location.hash = '#/search?q=' + encodeURIComponent($('#q').value.trim()); };
  }

  /* =====================================================================
   * 02 학교 목록
   * ===================================================================== */
  function viewSchools(q) {
    if (q.has('metric') && METRIC[q.get('metric')]) { ui.metric = q.get('metric'); ui.sortKey = 'metric'; }
    if (q.has('region')) ui.region = q.get('region');
    const mk = METRIC[ui.metric][1];
    let list = SCHOOLS.filter((s) => ui.region === 'all' || s.region === ui.region);
    const sorters = { metric: (a, b) => (anyAdm() ? (b.adm ? 1 : 0) - (a.adm ? 1 : 0) : 0) || b.stats[mk] - a.stats[mk], sale_desc: (a, b) => nv(agg(b).sMax, -1) - nv(agg(a).sMax, -1), sale_asc: (a, b) => nv(agg(a).sMin, 1e9) - nv(agg(b).sMin, 1e9), jeonse_desc: (a, b) => nv(agg(b).jMax, -1) - nv(agg(a).jMax, -1), jeonse_asc: (a, b) => nv(agg(a).jMin, 1e9) - nv(agg(b).jMin, 1e9) };
    list = list.slice().sort(sorters[ui.sortKey]);
    const pre = list.find((s) => s.id === ui.preSel) || list[0];
    const hl = (k) => (mk === k ? 'hl' : '');
    const row = (s, i) => { const g = agg(s); return `
      <a class="srow ${pre && pre.id === s.id ? 'on' : ''}" href="#/school/${s.id}" data-act="pre" data-v="${s.id}">
        <span class="rk ${i === 0 ? 'r1' : ''}">${i + 1}</span>
        <span class="name"><b>${esc(s.name)}</b> ${badge(s.cat)}<span class="mreg muted">${regOf(s).gu}${realOf(s) ? ' · ' + esc(realOf(s).hsType) : ''}</span></span>
        <span class="reg">${regOf(s).gu}</span>
        <span class="stat">의대 <b>${sd(s, 0)}</b> · SKY <b>${sd(s, 1)}</b> · 인서울 <b>${sd(s, 2)}</b></span>
        <span class="m num ${hl(0)}">${sd(s, 0)}</span><span class="k num ${hl(1)}">${sd(s, 1)}</span><span class="si num ${hl(2)}">${sd(s, 2)}</span>
        <span class="ap num">${s.apts.length}개</span>
        <span class="sale num"><small>매매</small><b>${range(g.sMin, g.sMax)}</b></span><span class="jeo num"><small>전세</small>${range(g.jMin, g.jMax)}</span>
      </a>`; };
    const pg = pre ? agg(pre) : null;
    view.innerHTML = `
      <h2 class="page-title">학교 목록</h2><p class="sub">진학 실적 기준으로 학교를 비교하고 선택하세요 (진학 실적은 샘플 수치)</p>
      <div class="tabs" style="margin-top:14px">${Object.entries(METRIC).map(([k, [l]]) => `<button class="${ui.metric === k ? 'on' : ''}" data-act="metric" data-v="${k}">${ic(METRIC_ICON[k])}${l} 진학 우수</button>`).join('')}</div>
      <div class="toolbar">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <label class="sel"><span>지역</span><select id="fr" aria-label="지역"><option value="all">전체</option>${D.REGIONS.map((r) => `<option value="${r.id}" ${ui.region === r.id ? 'selected' : ''}>${r.gu} ${r.dong}</option>`).join('')}</select></label>
          <label class="sel"><span>정렬</span><select id="fs" aria-label="정렬">${[['metric', METRIC[ui.metric][0] + ' 진학자 수순'], ['sale_desc', '매매가 높은순'], ['sale_asc', '매매가 낮은순'], ['jeonse_desc', '전세가 높은순'], ['jeonse_asc', '전세가 낮은순']].map(([v, l]) => `<option value="${v}" ${ui.sortKey === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>${areaSeg()}
      </div>
      <p class="muted" style="font-size:12px;margin-bottom:8px">${ui.area}㎡형 = 전용 ${AREA_RANGE[ui.area][0]}~${AREA_RANGE[ui.area][1]}㎡ (서비스 기준) · 가격은 최근 12개월 거래 기준 · ${anyAdm() ? '진학 실적은 입력된 학교만 실제 값이고, 나머지는 샘플이라 아래쪽에 두었어요' : '진학 실적은 샘플'}</p>
      <div class="s-layout">
        <div class="card tcard">
          <div class="thead srow" aria-hidden="true"><span>순위</span><span class="name">학교명</span><span class="reg">지역</span><span class="m ${hl(0)}">의대</span><span class="k ${hl(1)}">SKY</span><span class="si ${hl(2)}">인서울</span><span class="ap">학교군 단지</span><span class="sale">${ui.area}㎡ 매매가</span><span class="jeo">${ui.area}㎡ 전세가</span></div>
          ${list.map(row).join('') || '<div class="empty">조건에 맞는 학교가 없어요.</div>'}
        </div>
        ${pre ? `<aside class="card pad preview pv" aria-label="선택한 학교">
          <div class="pv-img">${bldg()}</div>
          <div class="pvh"><div><h3>${esc(pre.name)}</h3><p class="muted">서울 ${regOf(pre).gu} · ${regOf(pre).dong}${realOf(pre) ? ' · ' + esc(realOf(pre).hsType) + ' · ' + esc(sexLabel(realOf(pre).coedu)) : ''}</p></div>${favBtn('s', pre.id)}</div>
          <p style="margin-top:12px;font-size:13px" class="muted">진학 실적 (샘플)</p>
          <div class="stats"><span>의대<b>${sd(pre, 0)}</b></span><span>SKY<b>${sd(pre, 1)}</b></span><span>인서울<b>${sd(pre, 2)}</b></span></div>
          <p style="font-size:14px">학교군 해당 아파트 <b>${pre.apts.length}단지</b></p>
          <p style="font-size:14px;margin:2px 0 14px">${ui.area}㎡ 매매 <b>${range(pg.sMin, pg.sMax)}</b><br>${ui.area}㎡ 전세 <b>${range(pg.jMin, pg.jMax)}</b></p>
          <a class="btn primary block lg" href="#/school/${pre.id}">학교 상세·지도 보기${ic('chevR')}</a></aside>` : ''}
      </div>`;
    $('#fr').onchange = (e) => { ui.region = e.target.value; viewSchools(new URLSearchParams()); };
    $('#fs').onchange = (e) => { ui.sortKey = e.target.value; viewSchools(new URLSearchParams()); };
  }

  /* =====================================================================
   * 03 지도 · 학교군 해당 아파트
   * ===================================================================== */
  const MW = 800, MH = 580, CX = 400, CY = 290, SX = 1.3;
  const LAYERS = [['zone', '학교군 경계'], ['apt', '주변 아파트'], ['edu', '학교/교육시설'], ['academy', '학원가'], ['life', '생활편의(마트·병원 등)'], ['culture', '공원·문화시설'], ['transit', '지하철역']];
  const LAYER_OF = { subway: 'transit', edu: 'edu', academy: 'academy', hospital: 'life', mart: 'life', park: 'culture', library: 'culture' };
  const layoutCache = {};
  function blobPath(cx, cy, r, rand) {
    const n = 12, pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = r * (0.82 + rand() * 0.3); pts.push([cx + Math.cos(a) * rr * 1.1, cy + Math.sin(a) * rr]); }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + 'Z';
  }
  function hull(points) {
    const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    p.forEach((pt) => { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], pt) <= 0) lo.pop(); lo.push(pt); });
    p.slice().reverse().forEach((pt) => { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], pt) <= 0) up.pop(); up.push(pt); });
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  const POI_TYPE = { SW8: 'subway', HP8: 'hospital', PM9: 'hospital', MT1: 'mart', PS3: 'edu', CT1: 'library', PARK: 'park' };
  function geoLayout(s, g) {
    const ga = (R.geo || {}).apts || {}, proj = (x, y) => [(x - g.x) * Math.cos((g.y * Math.PI) / 180) * 111320, (g.y - y) * 110540];
    const pos = {}; s.apts.forEach((a) => { const c = a.master ? { x: a.coord.lng, y: a.coord.lat } : ga[a.id]; if (c) pos[a.id] = proj(c.x, c.y); });
    const pts = [[0, 0]].concat(Object.values(pos)), xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys), w = Math.max(700, maxx - minx), h = Math.max(500, maxy - miny);
    const X0 = 200, X1 = MW - 50, Y0 = 70, Y1 = MH - 70, k = Math.min((X1 - X0) / w, (Y1 - Y0) / h, 0.45), mx = (minx + maxx) / 2, my = (miny + maxy) / 2;
    const P = (p) => [(X0 + X1) / 2 + (p[0] - mx) * k, (Y0 + Y1) / 2 + (p[1] - my) * k];
    const r = rng(s.id), hp = [], zones = [], [sx, sy] = P([0, 0]);
    s.apts.forEach((a) => { const p = pos[a.id]; if (!p) return; const [cx, cy] = P(p), zr = clamp(20 + Math.sqrt(a.hh) * 0.4, 28, 46);
      for (let q = 0; q < 10; q++) { const t = (q / 10) * Math.PI * 2; hp.push([cx + Math.cos(t) * (zr + 34) * 1.15, cy + Math.sin(t) * (zr + 34)]); }
      zones.push({ id: a.id, cx, cy, path: a.master ? '' : blobPath(cx, cy, zr, r) }); });
    const pois = [], poisLL = [], shown = [[sx, sy]];
    Object.entries(g.infra || {}).forEach(([code, v]) => { const type = POI_TYPE[code]; if (!type) return;
      (v.items || []).slice(0, 3).forEach((it) => { poisLL.push({ type, name: it.name, lat: it.y, lng: it.x, dist: it.dist }); });
      (v.items || []).slice(0, 2).forEach((it) => { const [px, py] = P(proj(it.x, it.y)); if (px < 30 || px > MW - 30 || py < 40 || py > MH - 40) return;
        const label = shown.every((q) => Math.hypot(q[0] - px, q[1] - py) > 60); shown.push([px, py]); pois.push({ type, name: it.name, x: px, y: py, dist: it.dist, label }); }); });
    const rings = [5, 10, 15].map((m) => { const rad = ((m * 80) / 1.3) * k; return { m, rx: rad, ry: rad }; });
    const inv = (p) => ({ lat: g.y - p[1] / 110540, lng: g.x + p[0] / (Math.cos((g.y * Math.PI) / 180) * 111320) }), hm = [];
    Object.values(pos).forEach((p) => { for (let q = 0; q < 8; q++) { const t = (q / 8) * Math.PI * 2; hm.push([p[0] + Math.cos(t) * 130, p[1] + Math.sin(t) * 130]); } });
    const ll = { school: { lat: g.y, lng: g.x }, apts: Object.fromEntries(Object.entries(pos).map(([id, p]) => [id, inv(p)])), hull: hm.length > 2 ? hull(hm).map(inv) : [], pois: poisLL };
    const zn = zoneOf(s), zonePx = zn ? zn.rings.map((ring) => ring.map(([lng, lat]) => P(proj(lng, lat)))) : null;
    if (zn) ll.zone = { id: zn.id, name: zn.name, rings: zn.rings.map((ring) => ring.map(([lng, lat]) => ({ lat, lng }))) };
    return { ll, zones, pois, roads: [], hull: hp.length > 2 ? hull(hp) : [], zonePx, rings, geo: true, sx, sy, scaleBar: { m: 500, px: 500 * k }, academy: ((g.infra || {}).AC5 || {}).counts };
  }
  function layoutOf(s) {
    if (layoutCache[s.id]) return layoutCache[s.id];
    const geo = ((R.geo || {}).schools || {})[s.id]; if (geo) return (layoutCache[s.id] = geoLayout(s, geo));
    const r = rng(s.id), n = s.apts.length, off = r() * Math.PI * 2, hp = [];
    const zones = s.apts.map((a, i) => {
      const ang = off + (i * 2 * Math.PI) / n + (r() - 0.5) * 0.35, rad = 70 + (clamp(a.hi, 5, 15) - 5) * 11;
      const cx = CX + Math.cos(ang) * rad * SX, cy = CY + Math.sin(ang) * rad, zr = clamp(20 + Math.sqrt(a.hh) * 0.4, 28, 46);
      for (let k = 0; k < 10; k++) { const t = (k / 10) * Math.PI * 2; hp.push([cx + Math.cos(t) * (zr + 34) * 1.15, cy + Math.sin(t) * (zr + 34)]); }
      return { id: a.id, cx, cy, path: blobPath(cx, cy, zr, r) };
    });
    const reg = regOf(s), pois = [], count = {}, a0 = r() * Math.PI * 2;
    const order = ['subway', 'edu', 'academy', 'subway', 'park', 'edu', 'academy', 'library', 'hospital', 'subway', 'mart', 'park'];
    order.forEach((t, i) => {
      const k = (count[t] = (count[t] || 0) + 1) - 1, pool = reg.infra[t], name = pool[(k + Math.floor(r() * 2)) % pool.length], ang = a0 + (i / order.length) * Math.PI * 2;
      pois.push({ type: t, name, x: CX + Math.cos(ang) * 360, y: CY + Math.sin(ang) * 255 });
    });
    const roads = [0, 1, 2].map(() => { const y1 = 80 + r() * 420, y2 = 80 + r() * 420; return `M0,${y1.toFixed(0)} Q${(300 + r() * 200).toFixed(0)},${((y1 + y2) / 2 + (r() - 0.5) * 160).toFixed(0)} ${MW},${y2.toFixed(0)}`; });
    roads.push(`M${(150 + r() * 100).toFixed(0)},0 Q${(CX + (r() - 0.5) * 200).toFixed(0)},${CY} ${(550 + r() * 100).toFixed(0)},${MH}`);
    return (layoutCache[s.id] = { zones, pois, roads, hull: hull(hp), rings: [[5, 70], [10, 125], [15, 180]].map(([m, rad]) => ({ m, rx: rad * SX, ry: rad })) });
  }

  /* ---------- 카카오맵 (키가 있고 공개 주소에서 열렸을 때만 사용, 아니면 약도로 대체) ---------- */
  const CFG = window.SG_CONFIG || {};
  const km = { map: null, items: [], active: false, fit: false };
  let kakaoP = null;
  function loadKakao() {
    if (kakaoP) return kakaoP;
    kakaoP = new Promise((res, rej) => {
      if (!CFG.kakaoJsKey || !/^https?:$/.test(location.protocol)) return rej(new Error('no-key'));
      if (window.kakao && window.kakao.maps && window.kakao.maps.Map) return res();
      const sc = document.createElement('script'), to = setTimeout(() => rej(new Error('timeout')), 8000);
      sc.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + encodeURIComponent(CFG.kakaoJsKey) + '&autoload=false';
      sc.onload = () => { clearTimeout(to); try { window.kakao.maps.load(() => res()); } catch (e) { rej(e); } };
      sc.onerror = () => { clearTimeout(to); rej(new Error('load')); };
      document.head.appendChild(sc);
    });
    kakaoP.catch(() => { kakaoP = null; });
    return kakaoP;
  }
  function kakaoReset() { km.items.forEach((o) => o.setMap(null)); km.items = []; km.map = null; km.active = false; km.fit = false; }
  function initKakao(s) {
    const L = layoutOf(s); if (!L.geo || !L.ll) return;
    loadKakao().then(() => {
      if (curSchool() !== s) return; const box = $('#kmap'); if (!box) return;
      box.hidden = false; $('#map').style.display = 'none'; const mc = $('.mapctl'); if (mc) mc.style.display = 'none';
      km.map = new kakao.maps.Map(box, { center: new kakao.maps.LatLng(L.ll.school.lat, L.ll.school.lng), level: 5 });
      km.map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
      km.active = true; km.fit = true; drawKakao(s);
      let zt = null; kakao.maps.event.addListener(km.map, 'zoom_changed', () => { clearTimeout(zt); zt = setTimeout(() => { if (curSchool() === s && km.active) drawKakao(s); }, 120); });
    }).catch(() => { /* 약도 유지 */ });
  }
  function ptIn(p, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const A = ring[i], B = ring[j]; if ((A.lat > p.lat) !== (B.lat > p.lat) && p.lng < ((B.lng - A.lng) * (p.lat - A.lat)) / (B.lat - A.lat) + A.lng) c = !c; } return c; }
  function drawKakao(s) {
    const L = layoutOf(s), ly = ui.layers, M = km.map, cs = getComputedStyle(document.documentElement), acc = cs.getPropertyValue('--accent').trim() || '#1c6b45';
    km.items.forEach((o) => o.setMap(null)); km.items = [];
    const ll = (p) => new kakao.maps.LatLng(p.lat, p.lng), keep = (o) => { o.setMap(M); km.items.push(o); return o; };
    const node = (cls, html, fn) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; if (fn) d.addEventListener('click', (e) => { e.stopPropagation(); fn(); }); return d; };
    const ov = (p, n, y, z) => keep(new kakao.maps.CustomOverlay({ position: ll(p), content: n, xAnchor: 0.5, yAnchor: y, zIndex: z || 1 }));
    // 학교군 해당 영역
    if (ly.zone && L.ll.zone) L.ll.zone.rings.forEach((ring) => keep(new kakao.maps.Polygon({ path: ring.map(ll), strokeWeight: 3, strokeColor: acc, strokeOpacity: 0.95, fillColor: acc, fillOpacity: 0.08 })));
    else if (ly.zone && L.ll.hull.length > 2) keep(new kakao.maps.Polygon({ path: L.ll.hull.map(ll), strokeWeight: 3, strokeColor: acc, strokeOpacity: 0.95, fillColor: acc, fillOpacity: 0.16 }));
    // 도보 5·10·15분(직선거리 기준 추정) 원
    [5, 10, 15].forEach((m) => keep(new kakao.maps.Circle({ center: ll(L.ll.school), radius: (m * 80) / 1.3, strokeWeight: 1.5, strokeColor: '#7a8a80', strokeOpacity: 0.7, strokeStyle: 'dash', fillOpacity: 0 })));
    // 주변 인프라
    L.ll.pois.filter((p) => ly[LAYER_OF[p.type]]).forEach((p) => ov(p, node('kp', ic(D.INFRA[p.type].icon) + `<span class="kpl">${esc(p.name.length > 9 ? p.name.slice(0, 9) + '…' : p.name)}</span>`), 0.5, 2));
    // 아파트 가격 말풍선: 확대 수준별 표시(이름+가격 / 가격만 / 점), 겹침 제거, 학교군 안·밖 구분, 선택 평형에 거래가 없으면 다른 평형 가격
    if (ly.apt) {
      const lv = M.getLevel(), tier = lv <= 5 ? 2 : lv <= 7 ? 1 : 0, kind = ui.listKind, proj = M.getProjection(), rings = L.ll.zone ? L.ll.zone.rings : null;
      const rows = s.apts.map((a) => { const p = L.ll.apts[a.id]; if (!p) return null;
        let v = pr(a, kind), alt = null; if (v == null) { const o = [59, 84, 101].filter((q) => q !== ui.area).find((q) => ps(a, kind === 'jeonse' ? 'jeonse' : 'sale', q) != null); if (o) { v = ps(a, kind === 'jeonse' ? 'jeonse' : 'sale', o); alt = o; } }
        return { a, p, v, alt, out: rings ? !rings.some((r) => ptIn(p, r)) : false, on: ui.sel === a.id, pt: proj.containerPointFromCoords(ll(p)) }; }).filter(Boolean);
      const sc = L.ll.school, kx = Math.cos((sc.lat * Math.PI) / 180) * 111320; rows.forEach((o) => { o.dist = Math.hypot((o.p.lng - sc.lng) * kx, (o.p.lat - sc.lat) * 110540); });
      rows.sort((x, y) => (y.on - x.on) || (x.out - y.out) || ((y.v != null) - (x.v != null)) || (x.dist - y.dist));   // 선택 > 학교군 안 > 거래 있는 단지 > 학교와 가까운 순으로 이름표를 우선 배치
      const placed = [], hit = (r) => placed.some((q) => r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y);
      rows.forEach((o) => {
        const w = tier === 2 ? 132 : tier === 1 ? 64 : 14, h = tier === 2 ? 44 : tier === 1 ? 30 : 14, box = { x: o.pt.x - w / 2, y: o.pt.y - h, w, h };
        const show = o.on || !hit(box); if (show) placed.push(box);
        const cls = 'kb' + (o.on ? ' on' : '') + (o.out ? ' out' : '') + (o.alt ? ' alt' : '') + (o.v == null ? ' na' : '');
        const price = o.v == null ? '거래없음' : eokS(o.v) + (o.alt ? `<small>${o.alt}㎡</small>` : '');
        const tip = `${o.a.name} · ${o.v == null ? '거래없음' : eokS(o.v) + (o.alt ? ' (' + o.alt + '㎡형)' : '')}${o.out ? ' · 학교군 밖' : ''}`;
        const n = show && (tier > 1 || (tier > 0 && o.v != null)) ? node(cls + (tier === 1 ? ' sm' : ''), `<b>${price}</b>${tier === 2 ? `<span>${esc(o.a.name)}${kind === 'jeonse' ? ' · 전세' : ''}</span>` : ''}`, () => pick(s, o.a.id))
          : node('kd' + (o.out ? ' out' : '') + (o.on ? ' on' : ''), '', () => pick(s, o.a.id));
        n.title = tip; ov(o.p, n, n.className.indexOf('kb') === 0 ? 1.15 : 0.5, o.on ? 9 : 5);
      });
    }
    // 학교
    ov(L.ll.school, node('ks', `${ic('cap')}<b>${esc(s.name)}</b>`), 1.1, 10);
    // 학원 반경 집계
    let info = $('#kinfo'); if (!info) { info = document.createElement('div'); info.id = 'kinfo'; info.className = 'kinfo'; $('#kmap').parentElement.appendChild(info); }
    const zname = L.ll.zone ? `<div class="kz">${esc(L.ll.zone.name)} 경계 (기준 ${esc((zoneOf(s) || {}).baseDt || '')})</div>` : '';
    info.innerHTML = zname + (ly.academy && L.academy ? `학원 반경 500m <b>${Number(L.academy['500']).toLocaleString()}</b> · 1km <b>${Number(L.academy['1000']).toLocaleString()}</b> · 2km <b>${Number(L.academy['2000']).toLocaleString()}</b>곳` : '');
    /* 처음에는 학교 반경 약 1.3km 안 단지가 보이게 맞춘다(전체 학교군은 축소해서 확인) */
    if (km.fit) { km.fit = false; const b = new kakao.maps.LatLngBounds(); b.extend(ll(L.ll.school)); const sc = L.ll.school, kx = Math.cos((sc.lat * Math.PI) / 180) * 111320; let nb = 0; Object.values(L.ll.apts).forEach((p) => { if (Math.hypot((p.lng - sc.lng) * kx, (p.lat - sc.lat) * 110540) <= 1300) { b.extend(ll(p)); nb++; } }); if (nb < 3) Object.values(L.ll.apts).forEach((p) => b.extend(ll(p)));  M.setBounds(b, 90, 60, 90, window.innerWidth >= 900 ? 210 : 60); }
  }
  function viewSchool(id) {
    const s = schoolById(id);
    if (!s) { view.innerHTML = '<div class="empty">학교를 찾을 수 없어요. <a href="#/schools" class="chip">학교 목록</a></div>'; return; }
    ui.sel = null; ui.aq = ''; ui.lim = 30; ui.vb = { x: 0, y: 0, w: MW, h: MH }; pushRecent(s.id);
    const reg = regOf(s);
    view.innerHTML = `
      ${backLink('#/schools', '학교 목록')}
      <div class="s-head">
        <div><h2>${esc(s.name)} ${badge(s.cat)} ${favBtn('s', s.id)}</h2><p class="sub">${reg.gu} ${reg.dong} · ${zoneOf(s) ? esc(zoneOf(s).name) + ' · ' : ''}${esc(reg.tag)} · 의대 ${sd(s, 0)} · SKY ${sd(s, 1)} · 인서울 ${sd(s, 2)}${s.adm ? ` (${s.adm.year}학년도 ${s.adm.count_type || ''})` : ' (샘플)'}</p></div>
        <a class="btn primary" href="#/community?region=${s.region}">${ic('chat')}${reg.gu} 커뮤니티</a>
      </div>
      <div class="m-layout">
        <section class="card mapcard" aria-label="${esc(s.name)} 주변 지도">
          <div class="mapbar"><div class="chips" id="layer-chips"></div></div>
          <div class="mapbox">
            <div id="kmap" hidden></div>
            <svg id="map" viewBox="0 0 ${MW} ${MH}" role="img" aria-label="${esc(s.name)} 학교군 해당 아파트 영역 지도"><g id="map-g"></g></svg>
            <div class="layerbox" id="layer-box"></div>
            <div class="mapctl"><button data-act="zoom" data-v="1" aria-label="확대">${ic('plus')}</button><button data-act="zoom" data-v="-1" aria-label="축소">${ic('minus')}</button><button data-act="zoom" data-v="0" aria-label="원래대로">${ic('reset')}</button></div>
          </div>
          <div class="legend"><span>색이 진할수록 매매가 높음</span><i class="grad"></i><span>점선 원: 학교까지 도보 5·10·15분</span><span>점선 말풍선: 선택 평형 거래 없음(다른 평형 가격)</span><span>회색: 학교군 밖 단지</span><span>확대하면 단지명이 보여요</span><span>영역을 누르면 상세 정보</span><span>${(R.geo && R.geo.schools && R.geo.schools[s.id]) ? '위치와 학교군 경계는 실제 데이터 (지도 타일은 카카오맵 연결 후)' : '위치·구역은 개념도 (지도·학구도 GIS 연동 전)'}</span></div>
        </section>
        <aside class="card" id="panel" aria-live="polite"></aside>
      </div>
      ${schoolInfoHtml(s)}`;
    drawLayers(s); drawMap(s); drawPanel(s); bindMap(s); initKakao(s);
  }
  function academyLine(s) {
    const reg = regOf(s), ac = (R.academy || {})[reg.gu]; if (!ac) return '';
    const dongs = Object.entries(ac.dongs || {}).sort((x, y) => y[1].total - x[1].total);
    return `<div class="srcrow"><span class="src real">공식 공시</span><div><b>학원·교습소</b> <small class="muted">NEIS 교육정보 개방포털 · 조회 ${esc(ac.fetched)}</small>
      <div class="dchips"><span class="dchip"><b>${esc(reg.gu)}</b> 등록 ${ac.registered.toLocaleString()}곳</span><span class="dchip">입시·검정·보습 ${ac.boseup.toLocaleString()}곳</span>${dongs.map(([d, v]) => `<span class="dchip"><b>${esc(d)}</b> ${v.total.toLocaleString()}곳</span>`).join('')}</div>
      <small class="muted">구 단위 등록 건수예요. 폐원·휴원 포함 여부와 동 단위 집계는 전체 목록 수집 후 제공할 예정이에요.</small></div></div>`;
  }
  function zoneRow(s) {
    const z = zoneOf(s); if (!z) return '';
    const r = realOf(s), auto = r && r.hsType === '자율고';
    return `<div class="srcrow"><span class="src real">공식 공시</span><div><b>고등학교 학교군</b> <small class="muted">한국교육시설안전원 · 기준 ${esc(z.baseDt)}</small>
      <div class="dchips"><span class="dchip"><b>${esc(z.name)}</b></span><span class="dchip">${esc(z.edu)}</span></div>
      <small class="muted">${auto ? '자율형 고등학교는 학교 모집요강에 따라 선발하므로 학교군 경계가 입학 자격을 뜻하지 않아요.' : '이 경계 안에 거주하면 이 학교군에서 지원·추첨 대상이 돼요. 특정 학교 배정이 확정된 것은 아니에요.'}</small></div></div>`;
  }
  function admRow(s) {
    const a = s.adm; if (!a) return '<div class="srcrow"><span class="src sample">샘플</span><div><b>진학 실적</b> <small class="muted">아직 입력된 실제 실적이 없어요 (화면의 수치는 샘플). 공식 공시·학교 발표·별도 집계로 출처를 구분해 입력할 예정이에요.</small></div></div>';
    const ok = a.verified_status === '확인완료';
    return `<div class="srcrow"><span class="src ${ok ? 'real' : 'sample'}">${esc(a.source_type || '출처 미기재')}</span><div><b>진학 실적 ${a.year}학년도</b> <small class="muted">${esc(a.count_type || '')} · ${esc(a.student_scope || '')} · 중복합격 ${esc(a.duplicate_included || '')} · ${ok ? '검증 ' + esc(a.verified_at || '') : '미확인'}</small>
      <div class="dchips">${[['의대', 0], ['SKY', 1], ['인서울', 2]].map(([l, k]) => `<span class="dchip"><b>${l}</b> ${sd(s, k)}</span>`).join('')}${a.graduate_count != null ? `<span class="dchip">졸업생 ${a.graduate_count}명</span>` : ''}</div>
      <small class="muted">의대·SKY·인서울은 서로 겹치는 집계라 합산하지 않아요.${a.source_url ? ` <a href="${esc(a.source_url)}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:underline">원문</a>` : ''}</small></div></div>`;
  }
  function infraLine(s) {
    const g = ((R.geo || {}).schools || {})[s.id]; if (!g || !g.infra) return '';
    const f = (code, label, unit) => { const v = g.infra[code]; if (!v || !v.items || !v.items.length) return ''; const n = v.items[0]; return `<span class="dchip"><b>${label}</b> ${esc(n.name)} ${n.dist}m${v.total > 1 ? ` · 반경 ${(v.radius / 1000).toFixed(1)}km ${v.total}곳` : ''}</span>`; };
    const ac = (g.infra.AC5 || {}).counts;
    return `<div class="srcrow"><span class="src real">공식 공시</span><div><b>주변 인프라</b> <small class="muted">카카오 로컬 API · 학교 좌표 기준</small>
      <div class="dchips">${f('SW8', '지하철')}${f('HP8', '병원')}${f('PM9', '약국')}${f('MT1', '대형마트')}${f('PS3', '어린이집·유치원')}${f('PARK', '공원')}${f('CT1', '문화시설')}</div>
      ${ac ? `<div class="dchips"><span class="dchip"><b>학원</b> 반경 500m ${Number(ac['500']).toLocaleString()}곳</span><span class="dchip">1km ${Number(ac['1000']).toLocaleString()}곳</span><span class="dchip">2km ${Number(ac['2000']).toLocaleString()}곳</span></div>` : ''}
      <small class="muted">거리는 직선거리예요. 도보 시간은 직선거리 기반 추정값이에요.</small></div></div>`;
  }
  function schoolInfoHtml(s) {
    const r = realOf(s), reg = regOf(s);
    const rule = !r ? '' : r.hsType === '자율고' ? '자율형 고등학교는 학교 모집요강에 따라 선발하므로 거주지 기준 배정이 아닐 수 있어요. 지원 자격과 일정은 학교와 교육청 공지로 확인하세요.' : r.hsType === '일반고' ? '일반고는 거주지 기준 학교군을 바탕으로 한 지원·추첨 방식으로 배정돼요. 아파트가 학교군에 속해도 특정 학교 배정이 확정된 것은 아니에요. 최신 배정 방식과 기준 학년도는 서울시교육청 고입 안내에서 확인하세요.' : '';
    const real = r ? `<div class="srcrow"><span class="src real">공식 공시</span><div><b>학교 기본정보</b> <small class="muted">NEIS 교육정보 개방포털 · 적재 ${esc(String(r.loaded || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))}</small>
        <div class="kvl"><span>정식 명칭</span><b>${esc(r.officialName)}</b><span>주소</span><b>${esc(r.addr)}${r.dong ? ' (' + esc(r.dong) + ')' : ''}</b><span>구분</span><b>${esc(r.founding)} · ${esc(sexLabel(r.coedu))} · ${esc(r.hsType || '')}${r.course ? ' · ' + esc(r.course) : ''}</b><span>학교 코드</span><b>${esc(r.code)}</b>${r.homepage ? `<span>홈페이지</span><b><a href="${esc(r.homepage)}" target="_blank" rel="noopener">${esc(r.homepage.replace(/^https?:\/\//, ''))}</a></b>` : ''}</div></div></div>` : '';
    const apt = s.apts.filter((a) => realTrade(a)).length;
    return `<section class="card srcbox" aria-label="데이터 출처">
      ${real}${zoneRow(s)}${academyLine(s)}${infraLine(s)}
      <div class="srcrow"><span class="src ${apt ? 'real' : 'sample'}">${apt ? '공식 공시' : '샘플'}</span><div><b>아파트 시세</b> <small class="muted">${apt ? `국토교통부 실거래가 · ${apt}개 단지 연결` : '국토교통부 실거래가 연동 전 (가상 수치)'}</small></div></div>
      ${admRow(s)}
      ${rule ? `<div class="srcrow"><span class="src info">안내</span><div>${esc(rule)}</div></div>` : ''}
    </section>`;
  }
  function drawLayers(s) {
    const L = layoutOf(s), cnt = {}; L.pois.forEach((p) => { const k = LAYER_OF[p.type]; cnt[k] = (cnt[k] || 0) + 1; });
    $('#layer-chips').innerHTML = LAYERS.map(([k, l]) => `<button class="chip ${ui.layers[k] ? 'on' : ''}" data-act="layer" data-v="${k}">${l.replace(/\(.*\)/, '')}${cnt[k] ? ' ' + cnt[k] : ''}</button>`).join('');
    $('#layer-box').innerHTML = LAYERS.map(([k, l]) => `<button class="${ui.layers[k] ? 'on' : ''}" data-act="layer" data-v="${k}"><span class="cb">${ic('check')}</span>${l}</button>`).join('');
  }
  function drawMap(s) {
    if (km.active && km.map) { drawKakao(s); return; }
    const L = layoutOf(s), r = rng(s.id + 'park'), ly = ui.layers;
    const parks = ly.culture ? L.pois.filter((p) => p.type === 'park').map((p) => `<ellipse cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" rx="${(48 + r() * 22).toFixed(0)}" ry="${(30 + r() * 14).toFixed(0)}" fill="var(--map-park)"/>`).join('') : '';
    const roads = L.roads.map((d) => `<path d="${d}" fill="none" stroke="var(--map-road)" stroke-width="9" stroke-linecap="round"/>`).join('');
    const rings = L.rings.map((q) => `<ellipse cx="${L.sx || CX}" cy="${L.sy || CY}" rx="${q.rx.toFixed(1)}" ry="${q.ry.toFixed(1)}" fill="none" stroke="var(--map-ring)" stroke-dasharray="4 5" opacity=".7"/><text x="${((L.sx || CX) + q.rx + 3).toFixed(0)}" y="${(L.sy || CY) - 3}" font-size="9" fill="var(--map-ring)">도보 ${q.m}분</text>`).join('');
    const zoneEl = ly.zone && L.zonePx ? L.zonePx.map((ring) => `<polygon points="${ring.map((p) => p[0].toFixed(0) + ',' + p[1].toFixed(0)).join(' ')}" fill="var(--map-zone)" fill-opacity=".08" stroke="var(--map-zone)" stroke-width="3" stroke-linejoin="round"/>`).join('') : '';
    const hullEl = zoneEl || (ly.zone && L.hull.length ? `<polygon points="${L.hull.map((p) => p[0].toFixed(0) + ',' + p[1].toFixed(0)).join(' ')}" fill="var(--map-zone)" fill-opacity=".12" stroke="var(--map-zone)" stroke-width="3" stroke-linejoin="round"/>` : '');
    const g = agg(s), span = (nv(g.sMax, 0) - nv(g.sMin, 0)) || 1;
    const zones = ly.apt ? s.apts.map((a) => {
      const z = L.zones.find((q) => q.id === a.id); if (!z) return '';
      const t = pr(a, 'sale') == null ? 0 : (pr(a, 'sale') - g.sMin) / span, on = ui.sel === a.id, w = a.name.length * 11 + 22;
      if (a.master) return `<g class="zone ${on ? 'sel' : ''}" data-apt="${a.id}" tabindex="0" role="button" aria-label="${esc(a.name)} 매매 ${eokS(pr(a, 'sale'))}"><circle cx="${z.cx.toFixed(0)}" cy="${z.cy.toFixed(0)}" r="${on ? 9 : 5}" style="fill:var(--accent);fill-opacity:${(0.35 + 0.6 * t).toFixed(2)};stroke:#fff;stroke-width:1.5"/>${on ? `<text class="pr" x="${z.cx.toFixed(0)}" y="${(z.cy - 14).toFixed(0)}" text-anchor="middle">${esc(a.name)} ${eokS(pr(a, 'sale'))}</text>` : ''}</g>`;
      return `<g class="zone ${on ? 'sel' : ''}" data-apt="${a.id}" tabindex="0" role="button" aria-label="${a.letter} ${esc(a.name)} 매매 ${eokS(pr(a, 'sale'))}">
        <path d="${z.path}" style="fill-opacity:${(0.2 + 0.55 * t).toFixed(2)}"/>
        <text class="ltr" x="${z.cx.toFixed(0)}" y="${(z.cy - 2).toFixed(0)}" text-anchor="middle">${a.letter}</text>
        <text class="pr" x="${z.cx.toFixed(0)}" y="${(z.cy + 13).toFixed(0)}" text-anchor="middle">${eokS(pr(a, 'sale'))}</text>
        <rect class="pill" x="${(z.cx - w / 2).toFixed(0)}" y="${(z.cy + 42).toFixed(0)}" width="${w}" height="20" rx="10"/>
        <text class="nm" x="${z.cx.toFixed(0)}" y="${(z.cy + 56).toFixed(0)}" text-anchor="middle">${esc(a.name)}</text></g>`;
    }).join('') : '';
    const pois = L.pois.filter((p) => ly[LAYER_OF[p.type]]).map((p) => `<g class="poi"><title>${esc(p.name)}</title><circle cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" r="15"/>${icG(D.INFRA[p.type].icon, p.x, p.y, 17, 'var(--accent)')}${p.label === false ? '' : `<text class="lb" x="${p.x.toFixed(0)}" y="${(p.y + 28).toFixed(0)}">${esc(p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name)}</text>`}</g>`).join('');
    const extra = (L.geo ? `<g><line x1="24" y1="${MH - 18}" x2="${(24 + L.scaleBar.px).toFixed(0)}" y2="${MH - 18}" stroke="var(--ink)" stroke-width="3"/><text x="24" y="${MH - 26}" font-size="11" fill="var(--ink)">500m</text></g>` : '') + (L.geo && ly.academy && L.academy ? `<text x="${MW - 14}" y="26" text-anchor="end" font-size="12" font-weight="700" fill="var(--ink)">학원 반경 500m ${Number(L.academy['500']).toLocaleString()} · 1km ${Number(L.academy['1000']).toLocaleString()} · 2km ${Number(L.academy['2000']).toLocaleString()}곳</text>` : '');
    const sw = s.name.length * 12 + 40;
    $('#map-g').innerHTML = `${parks}${roads}${hullEl}${rings}${zones}
      <g><circle cx="${L.sx || CX}" cy="${L.sy || CY}" r="22" fill="var(--accent)" stroke="#fff" stroke-width="3"/>${icG('cap', L.sx || CX, L.sy || CY, 24, '#fff')}<rect x="${(L.sx || CX) - sw / 2}" y="${(L.sy || CY) + 28}" width="${sw}" height="22" rx="11" fill="var(--ink)"/><text x="${L.sx || CX}" y="${(L.sy || CY) + 43}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--card)">${esc(s.name)}</text></g>${pois}${extra}`;
  }
  function drawPanel(s) {
    const k = ui.listKind, q = (ui.aq || '').trim(), all = s.apts.slice().sort((a, b) => nv(pr(b, k), -1) - nv(pr(a, k), -1)), matched = q ? all.filter((a) => (a.name + (a.dong || '')).includes(q)) : all;
    let list = matched.slice(0, ui.lim || 30); const sel = all.find((a) => a.id === ui.sel); if (sel && !list.includes(sel)) list = [sel].concat(list);
    const rows = list.map((a) => {
      const on = a.id === ui.sel, no = all.indexOf(a) + 1;
      return `<button class="arow ${on ? 'on' : ''}" data-act="pick" data-v="${a.id}"><span class="l">${no > 99 ? '·' : no}</span><span><b>${esc(a.name)}</b> ${srcTag(a)}${a.master ? `<small class="muted" style="display:block">${esc(a.dong)}</small>` : ''}</span><span class="p ${k === 'sale' ? 'em' : ''}"><small>매매</small><b>${eokS(pr(a, 'sale'))}</b></span><span class="p ${k === 'jeonse' ? 'em' : ''}"><small>전세</small><b>${eokS(pr(a, 'jeonse'))}</b></span></button>
        ${on ? `<div class="apick"><div class="kv"><div><span>세대수</span><b>${hhT(a)}</b></div><div><span>준공연도</span><b>${yrT(a)}</b></div><div><span>${esc(s.name)} 도보</span><b>${walkHi(a, s)}</b></div><div><span>초등 도보</span><b>${wm(a.elem)}</b></div><div><span>중등 도보</span><b>${wm(a.mid)}</b></div><div><span>전세가율</span><b>${ratio(a, ui.area)}</b></div></div><a class="btn primary block" href="#/apt/${a.id}">단지 상세·실거래가 보기${ic('chevR')}</a></div>` : ''}`;
    }).join('');
    const withData = all.filter((a) => pr(a, 'sale') != null || pr(a, 'jeonse') != null).length;
    $('#panel').innerHTML = `<div class="plist-h"><h3>학교군 해당 아파트 (${all.length}곳 · ${ui.area}㎡)</h3><span class="seg">${[['sale', '매매가'], ['jeonse', '전세가']].map(([v, l]) => `<button class="${k === v ? 'on' : ''}" data-act="list-kind" data-v="${v}">${l}</button>`).join('')}</span></div>
      <div style="padding:0 var(--gx) 10px;display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="muted" style="font-size:13px">매매 ${range(agg(s).sMin, agg(s).sMax)} · 전세 ${range(agg(s).jMin, agg(s).jMax)}</span>${areaSeg()}</div>
      ${all.length > 12 ? `<div style="padding:0 var(--gx) 10px"><input id="aq" class="aq" type="search" value="${esc(q)}" placeholder="단지명·동 검색" aria-label="단지 검색"><small class="muted" style="display:block;margin-top:6px">이 ${ui.area}㎡형은 ${withData}곳에 최근 12개월 거래가 있어요. 거래가 없는 단지는 가격이 '-'로 보여요.</small></div>` : ''}
      ${rows || '<div class="empty">조건에 맞는 단지가 없어요.</div>'}
      ${matched.length > list.length ? `<div style="padding:10px var(--gx) 16px"><button class="btn block" data-act="more">${matched.length - list.length}곳 더 보기</button></div>` : ''}`;
    const aq = $('#aq'); if (aq) aq.oninput = (e) => { const v = e.target.value, pos = e.target.selectionStart; ui.aq = v; ui.lim = 30; drawPanel(s); const n = $('#aq'); n.focus(); n.setSelectionRange(pos, pos); };
  }
  function pick(s, id) { ui.sel = ui.sel === id ? null : id; drawMap(s); drawPanel(s); if (km.active && ui.sel) { const p = layoutOf(s).ll.apts[id]; if (p) km.map.panTo(new kakao.maps.LatLng(p.lat, p.lng)); } }
  function setVB() { const v = ui.vb; $('#map').setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`); }
  function zoomBy(f, cx, cy) {
    const v = ui.vb, nw = clamp(v.w * f, MW / 4, MW), nh = nw * (MH / MW), px = cx == null ? v.x + v.w / 2 : cx, py = cy == null ? v.y + v.h / 2 : cy;
    v.x = clamp(px - ((px - v.x) * nw) / v.w, 0, MW - nw); v.y = clamp(py - ((py - v.y) * nh) / v.h, 0, MH - nh); v.w = nw; v.h = nh; setVB();
  }
  let cleanup = null;
  function bindMap(s) {
    const svg = $('#map'); let drag = null, moved = false;
    const kOf = (r) => Math.min(r.width / ui.vb.w, r.height / ui.vb.h);
    const toSvg = (e) => { const r = svg.getBoundingClientRect(), k = kOf(r); return [ui.vb.x + (e.clientX - r.left - (r.width - ui.vb.w * k) / 2) / k, ui.vb.y + (e.clientY - r.top - (r.height - ui.vb.h * k) / 2) / k]; };
    svg.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, vx: ui.vb.x, vy: ui.vb.y }; moved = false; });
    const onMove = (e) => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) { moved = true; svg.classList.add('drag'); } if (!moved) return; const k = kOf(svg.getBoundingClientRect()); ui.vb.x = clamp(drag.vx - dx / k, 0, MW - ui.vb.w); ui.vb.y = clamp(drag.vy - dy / k, 0, MH - ui.vb.h); setVB(); };
    const onUp = () => { drag = null; svg.classList.remove('drag'); };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
    svg.addEventListener('click', (e) => { if (moved) { moved = false; return; } const g = e.target.closest('.zone'); if (g) pick(s, g.dataset.apt); });
    svg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { const g = e.target.closest('.zone'); if (g) { e.preventDefault(); pick(s, g.dataset.apt); } } });
    svg.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = toSvg(e); zoomBy(e.deltaY < 0 ? 0.85 : 1.18, x, y); }, { passive: false });
    cleanup = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }

  /* =====================================================================
   * 04 아파트 상세 · 비교
   * ===================================================================== */
  function basisLine(a) {
    const rs = realStat(a, 'sale');
    if (rs) return `최근 12개월 매매 ${rs.count}건 (${eokS(rs.min)}~${eokS(rs.max)}) · 최근 거래일 ${rs.last} · 국토교통부 실거래가 · 전용 ${AREA_RANGE[ui.area][0]}~${AREA_RANGE[ui.area][1]}㎡ 기준${rs.count < 3 ? ' · 거래 건수가 적어요' : ''}`;
    if (linked(a)) {
      const other = [59, 84, 101].filter((p) => p !== ui.area && ps(a, 'sale', p) != null);
      return `이 면적대(전용 ${AREA_RANGE[ui.area][0]}~${AREA_RANGE[ui.area][1]}㎡)는 최근 12개월 매매 거래가 없어요.${other.length ? ' ' + other.map((p) => `<button class="chip sm" data-act="area" data-v="${p}">${p}㎡ 보기</button>`).join(' ') : ''}`;
    }
    const r = rng(a.id + 'cnt'), n = 3 + Math.floor(r() * 14);
    return `최근 12개월 매매 ${n}건 · 최근 거래일 ${tradesOf(a).sale[0].date} · 샘플 수치 · 전용 ${AREA_RANGE[ui.area][0]}~${AREA_RANGE[ui.area][1]}㎡ 기준`;
  }
  function bigP(a, k, t) { if (linked(a)) { const st = realStat(a, k); return st ? eokL(st.median) : '-'; } return t[k][0] ? eokL(t[k][0].price) : '-'; }
  function subP(a, k, chg) { if (linked(a)) { const st = realStat(a, k); return st ? `<small class="muted">${eokS(st.min)} ~ ${eokS(st.max)} · ${st.count}건${chg != null ? ' · ' : ''}</small>${chg != null ? chgHtml(chg) : ''}` : '<small class="muted">이 면적대 최근 12개월 거래 없음</small>'; } return chgHtml(chg); }
  function viewApt(id) {
    const a = aptById(id);
    if (!a) { view.innerHTML = '<div class="empty">단지를 찾을 수 없어요. <a href="#/schools" class="chip">학교 목록</a></div>'; return; }
    const s = schoolOf(a), reg = a.master ? { gu: a.gu, dong: a.dong, infra: { edu: ['초등학교', '중학교'] } } : regOf(s), t = tradesOf(a), edu = reg.infra.edu; pushRecent(s.id);
    const cSale = change1y(a, 'sale'), cJ = change1y(a, 'jeonse'), sv = seriesOf(a, 'sale'), jv = seriesOf(a, 'jeonse');
    const sims = a.master ? MAPTS.filter((x) => x.id !== a.id && x.zone === a.zone && x.dong === a.dong && ps(x, 'sale', ui.area) != null).sort((x, y) => Math.abs(ps(x, 'sale', ui.area) - nv(ps(a, 'sale', ui.area), 0)) - Math.abs(ps(y, 'sale', ui.area) - nv(ps(a, 'sale', ui.area), 0))).slice(0, 4) : APTS.filter((x) => x.id !== a.id && !x.master && schoolOf(x).region === s.region).sort((x, y) => Math.abs(x.sale - a.sale) - Math.abs(y.sale - a.sale)).slice(0, 4);
    ui.aptCmp = ui.aptCmp.filter((x) => sims.some((z) => z.id === x));
    const tabs = [['chart', '실거래가 추이'], ['price', '시세비교'], ['feat', '단지 특징'], ['review', '입주민 후기']];
    let main = '';
    if (ui.aptTab === 'chart') {
      const kind = ui.aptCmp.length && ui.aptKind === 'both' ? 'sale' : ui.aptKind, N = ui.aptRange * 12, lines = [];
      const add = (name, color, vals) => { if (vals) lines.push({ name, color, vals }); };
      if (kind === 'both') { add('매매', 'var(--c1)', sv); add('전세', 'var(--c2)', jv); }
      else {
        add(a.name, 'var(--c1)', kind === 'sale' ? sv : jv);
        ui.aptCmp.forEach((cid, i) => { const o = aptById(cid); add(o.name, `var(--c${i + 2})`, seriesOf(o, kind)); });
      }
      main = `<div class="ctl"><span class="seg">${[['both', '매매+전세'], ['sale', '매매가'], ['jeonse', '전세가']].map(([v, l]) => `<button class="${kind === v ? 'on' : ''}" data-act="apt-kind" data-v="${v}">${l}</button>`).join('')}</span>
        <span class="seg">${[1, 3, 5].map((y) => `<button class="${ui.aptRange === y ? 'on' : ''}" data-act="apt-range" data-v="${y}">${y}년</button>`).join('')}</span></div>
        <div class="chart">${lines.length ? lineChart(lines, N) : '<div class="empty">이 면적대의 월별 추이 데이터가 아직 없어요.<br>(실거래 월별 집계 연동 후 제공)</div>'}</div><div class="lg">${lines.map((l) => `<span><i style="background:${l.color}"></i>${esc(l.name)}</span>`).join('')}<span>${ui.area}㎡ 기준 · ${linked(a) ? '국토교통부 실거래 (거래가 있는 달만 표시, 월 중앙값)' : '샘플'}</span></div>
        <div class="tbox">${!t.sale.length && !t.jeonse.length ? '<p class="muted" style="font-size:13px;padding:8px 0">개별 거래 내역은 실거래 상세 연동 후 표시돼요.</p>' : ''}<table style="${!t.sale.length && !t.jeonse.length ? 'display:none' : ''}"><tr><th>구분</th><th>계약일</th><th>층</th><th>금액</th></tr>${t.sale.slice(0, 3).map((x) => `<tr><td>매매</td><td>${x.date}</td><td>${x.floor}층</td><td><b>${eokL(x.price)}</b></td></tr>`).join('')}${t.jeonse.slice(0, 2).map((x) => `<tr><td>전세</td><td>${x.date}</td><td>${x.floor}층</td><td><b>${eokL(x.price)}</b></td></tr>`).join('')}</table></div>`;
    } else if (ui.aptTab === 'price') {
      const reg_ = (a.master ? MAPTS.filter((x) => x.zone === a.zone && x.dong === a.dong) : APTS.filter((x) => schoolOf(x).region === s.region)).map((x) => ps(x, 'sale', ui.area)).filter((v) => v != null), me_ = ps(a, 'sale', ui.area), diff = me_ != null && reg_.length ? me_ / avg(reg_) - 1 : null;
      main = `<div class="tbox"><table style="margin-top:8px"><tr><th>평형</th><th>매매</th><th>전세</th><th>전세가율</th></tr>${[59, 84, 101].map((p) => `<tr><td>${p}㎡</td><td><b>${eokL(ps(a, 'sale', p))}</b></td><td>${eokL(ps(a, 'jeonse', p))}</td><td>${ratio(a, p)}</td></tr>`).join('')}</table>
        <p style="margin-top:14px;font-size:14px">${reg.dong} 지역 평균 대비 ${ui.area}㎡ 매매가 ${diff == null ? '-' : `<span class="${diff >= 0 ? 'up' : 'down'}"><i class="tri"></i>${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(1)}%</span>`}</p></div>`;
    } else if (ui.aptTab === 'feat') {
      const f = []; if (a.elem != null && a.elem <= 5) f.push('초품아'); if (a.hh >= 2000) f.push('대단지'); else if (a.hh >= 1000) f.push('1천세대 이상'); if (a.year && 2026 - a.year <= 10) f.push('준신축'); if (a.year && 2026 - a.year >= 30) f.push('재건축 기대'); { const hw = walkTo(a, s); if (hw != null && hw <= 8) f.push('고교 도보 8분 이내'); } if (!a.master) { f.push('학원가 접근 양호'); f.push(`${reg.infra.subway[0]} 이용`); }
      main = `<div class="feat">${f.map((x) => `<span>${x}</span>`).join('')}</div><p class="muted" style="padding:0 var(--gx) 16px;font-size:13px">${a.master ? '세대수·준공연도·학교까지 추정 도보 거리로 자동 생성했어요.' : '단지 특징은 입력된 정보로 자동 생성한 샘플입니다.'}</p>`;
    } else {
      const rv = db.posts.filter((p) => p.region === s.region && (p.cat === 'life' || p.cat === 'moving')).slice(0, 3);
      main = `<div style="padding:4px var(--gx) 16px">${rv.map((p) => `<a class="prow" href="#/post/${p.id}"><span class="tag">${catOf(p.cat).label}</span><h3>${esc(p.title)}</h3><span class="cnt">${ic('chat')}${p.comments.length}</span><span class="meta">${nickHtml(p.author)} · ${p.date}</span></a>`).join('') || '<div class="empty">아직 후기가 없어요.</div>'}<p class="muted" style="font-size:13px;margin-top:10px">실거주 인증 회원의 후기는 서비스 오픈 후 단지별로 모아 보여줍니다.</p></div>`;
    }
    view.innerHTML = `
      ${backLink('#/school/' + s.id, esc(s.name) + ' 지도')}
      <div class="a-top">
        <section class="card a-hero"><div class="pv-img">${bldg()}</div>
          <div><div style="display:flex;justify-content:space-between;gap:8px"><h2>${esc(a.name)}</h2>${favBtn('a', a.id)}</div><p class="muted">서울 ${reg.gu} ${reg.dong}</p>
            <p style="margin:10px 0">${a.master ? (ZSCH[a.zone] || []).map((x) => `<a href="#/school/${x.id}" class="tag">${esc(x.name)}</a>`).join(' ') + ` <span class="tag">${esc((Z.zones.find((z) => z.id === a.zone) || {}).name || '')}</span>` : `<a href="#/school/${s.id}" class="tag">학교군: ${esc(s.name)}</a>`} <span class="tag">${ui.area}㎡형</span> ${srcTag(a)}</p>${areaSeg()}
            <p class="muted" style="font-size:12px;margin-top:8px">${basisLine(a)}</p></div></section>
        <div class="a-metrics">
          <div class="card mc"><small>${linked(a) ? '최근 12개월 매매 (중앙값)' : '최근 매매 실거래가'}</small><div class="big">${bigP(a, 'sale', t)}</div>${subP(a, 'sale', cSale)}${sv ? spark(sv, 'var(--c1)') : ''}</div>
          <div class="card mc"><small>${linked(a) ? '최근 12개월 전세 (중앙값)' : '최근 전세 실거래가'}</small><div class="big">${bigP(a, 'jeonse', t)}</div>${subP(a, 'jeonse', cJ)}${jv ? spark(jv, 'var(--c2)') : ''}</div>
        </div>
      </div>
      <div class="facts">
        <div class="card fact">${ic('backpack')}${esc(edu[0])}<b>${a.master ? '정보 없음' : '도보 ' + a.elem + '분 (샘플)'}</b></div><div class="card fact">${ic('school')}${esc(edu[1])}<b>${a.master ? '정보 없음' : '도보 ' + a.mid + '분 (샘플)'}</b></div><div class="card fact">${ic('cap')}${esc(s.name)}<b>도보 ${walkHi(a, s)}</b></div>
        <div class="card fact">${ic('building')}세대수<b>${a.hh ? a.hh.toLocaleString() + '세대' : '정보 없음'}${a.hh && !a.hhReal ? ' (샘플)' : ''}</b></div><div class="card fact">${ic('calendar')}준공연도<b>${a.year ? a.year + '년 (' + (2026 - a.year) + '년차)' : '정보 없음'}${a.year && !a.yearReal ? (a.master ? ' (실거래 기준)' : ' (샘플)') : ''}</b></div><div class="card fact">${ic('pie')}전세가율<b>${ratio(a, ui.area)}</b></div>
      </div>
      <div class="a-low">
        <section class="card"><div class="subtabs">${tabs.map(([v, l]) => `<button class="${ui.aptTab === v ? 'on' : ''}" data-act="apt-tab" data-v="${v}">${l}</button>`).join('')}</div>${main}</section>
        <section class="card"><div class="plist-h"><h3>유사 단지 비교 <small class="muted">(${ui.area}㎡)</small></h3></div><div class="tbox"><table>
          <tr><th></th><th>단지명</th><th>매매</th><th>전세</th><th>도보(학교)</th></tr>
          <tr class="me"><td></td><td>${esc(a.name)}</td><td>${eokS(pr(a, 'sale'))}</td><td>${eokS(pr(a, 'jeonse'))}</td><td>${wm(walkTo(a, s))}</td></tr>
          ${sims.map((x) => `<tr><td><input type="checkbox" data-act="apt-cmp" data-v="${x.id}" aria-label="${esc(x.name)} 추이 비교" ${ui.aptCmp.includes(x.id) ? 'checked' : ''}></td><td><a href="#/apt/${x.id}">${esc(x.name)}</a></td><td>${eokS(pr(x, 'sale'))}</td><td>${eokS(pr(x, 'jeonse'))}</td><td>${wm(walkTo(x, s))}</td></tr>`).join('')}
        </table><p class="muted" style="font-size:12px;margin-top:10px">체크하면 추이 차트에 함께 표시돼요 (최대 3개)</p></div></section>
      </div>`;
  }

  /* =====================================================================
   * 예산탐색 / 학군비교 / 가이드 / 검색
   * ===================================================================== */
  function budCfg() { return ui.budget.kind === 'sale' ? { min: 4, max: 50, step: 0.5, quick: [10, 15, 20, 30] } : { min: 1.5, max: 16, step: 0.5, quick: [4, 6, 8, 10] }; }
  function viewBudget() {
    const b = ui.budget, cfg = budCfg();
    view.innerHTML = `
      <h2 class="page-title">예산이 얼마인가요?</h2><p class="sub">예산 안에서 들어갈 수 있는 학교군 해당 아파트와 학교를 찾아드려요</p>
      <section class="card bud">
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:center"><span class="seg">${[['sale', '매매'], ['jeonse', '전세']].map(([v, l]) => `<button class="${b.kind === v ? 'on' : ''}" data-act="bud-kind" data-v="${v}">${l}</button>`).join('')}</span>${areaSeg()}</div>
        <div><small class="muted">최대 예산 · ${ui.area}㎡ ${b.kind === 'sale' ? '매매' : '전세'} 기준</small>
          <div class="stepper"><button class="btn" data-act="bud-step" data-v="-1" aria-label="0.5억 줄이기">${ic('minus')}</button><div class="val num" id="bval" style="flex:1;text-align:center">${eokS(b[b.kind])}</div><button class="btn" data-act="bud-step" data-v="1" aria-label="0.5억 늘리기">${ic('plus')}</button></div>
          <input type="range" id="bud" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${b[b.kind]}" aria-label="최대 예산">
          <div class="qbtns" style="margin-top:10px">${cfg.quick.map((v) => `<button class="chip" data-act="bud-set" data-v="${v}">${v}억</button>`).join('')}</div></div>
        <div class="tabs">${Object.entries(METRIC).map(([k, [l]]) => `<button class="${ui.metric === k ? 'on' : ''}" data-act="bud-metric" data-v="${k}">${l} 우수순</button>`).join('')}</div>
      </section><div class="bres" id="bres"></div>`;
    drawBudget(); $('#bud').oninput = (e) => setBudget(+e.target.value);
  }
  function setBudget(v) { const b = ui.budget, cfg = budCfg(); b[b.kind] = clamp(v, cfg.min, cfg.max); $('#bud').value = b[b.kind]; $('#bval').textContent = eokS(b[b.kind]); drawBudget(); }
  function drawBudget() {
    const b = ui.budget, mk = METRIC[ui.metric][1], lim = b[b.kind];
    const rows = SCHOOLS.map((s) => ({ s, ok: s.apts.filter((a) => pr(a, b.kind) != null && pr(a, b.kind) <= lim).sort((x, y) => pr(x, b.kind) - pr(y, b.kind)) })).filter((x) => x.ok.length).sort((x, y) => y.s.stats[mk] - x.s.stats[mk]);
    $('#bres').innerHTML = (rows.length ? `<p class="muted" style="margin-top:6px">${eokS(lim)} 이하 단지가 있는 학교 <b>${rows.length}곳</b> · 단지 ${rows.reduce((n, x) => n + x.ok.length, 0)}곳</p>` : '') +
      (rows.map(({ s, ok }) => `<div class="card bcard"><div class="r1"><h3><a href="#/school/${s.id}">${esc(s.name)}</a> ${badge(s.cat)}</h3><a class="btn sm" href="#/school/${s.id}">지도${ic('chevR')}</a></div>
        <div class="stat">${regOf(s).gu} ${regOf(s).dong} · 의대 <b>${sd(s, 0)}</b> · SKY <b>${sd(s, 1)}</b> · 인서울 <b>${sd(s, 2)}</b> · 예산 내 ${ok.length}/${s.apts.length}단지</div>
        <div class="pills">${ok.map((a) => `<a class="pill" href="#/apt/${a.id}">${esc(a.name)} <b>${eokS(pr(a, b.kind))}</b></a>`).join('')}</div></div>`).join('') || '<div class="empty card">이 예산으로 들어갈 수 있는 배정 아파트가 없어요. 예산을 올려 보세요.</div>');
  }

  function viewCompare(q) {
    if (q.get('ids')) ui.cmp = q.get('ids').split(',').filter((id) => schoolById(id)).slice(0, 3);
    const ss = ui.cmp.map(schoolById).filter(Boolean);
    const idx = (s) => (agg(s).sAvg ? (s.stats[0] + s.stats[1]) / agg(s).sAvg : 0);
    const rows = [
      ['지역', (s) => `${regOf(s).gu} ${regOf(s).dong}`, null], ['의대 진학자', (s) => (s.statsRaw[0] == null ? '미공개' : s.statsRaw[0]), 'max'], ['SKY 진학자', (s) => (s.statsRaw[1] == null ? '미공개' : s.statsRaw[1]), 'max'], ['인서울 진학자', (s) => (s.statsRaw[2] == null ? '미공개' : s.statsRaw[2]), 'max'],
      ['학교군 해당 아파트', (s) => s.apts.length + '개', null], [`${ui.area}㎡ 평균 매매가`, (s) => agg(s).sAvg, 'min', eokS], [`${ui.area}㎡ 평균 전세가`, (s) => agg(s).jAvg, 'min', eokS],
      ['평균 고교 도보', (s) => avg(s.apts.map((a) => walkTo(a, s)).filter((v) => v != null)), 'min', (v) => v.toFixed(1) + '분'], ['평균 준공연도', (s) => avg(s.apts.filter((a) => a.year).map((a) => a.year)), 'max', (v) => Math.round(v) + '년'],
      ['총 세대수', (s) => s.apts.reduce((n, a) => n + a.hh, 0), 'max', (v) => v.toLocaleString()], ['억당 의대·SKY 진학자', idx, 'max', (v) => v.toFixed(1) + '명']
    ];
    const body = rows.map(([l, fn, best, fmt]) => { const vals = ss.map(fn), nums = vals.filter((v) => typeof v === 'number'), bv = best ? (best === 'max' ? Math.max(...nums) : Math.min(...nums)) : null; return `<tr><th scope="row">${l}</th>${vals.map((v) => `<td class="${best && v === bv && ss.length > 1 ? 'best' : ''}">${fmt ? fmt(v) : v}</td>`).join('')}</tr>`; }).join('');
    const all = SCHOOLS.slice().sort((a, b) => idx(b) - idx(a)), mx = idx(all[0]);
    view.innerHTML = `
      <h2 class="page-title">학군 비교</h2><p class="sub">학교를 최대 3곳까지 골라 진학 실적과 주거비를 비교하세요 (샘플 수치)</p>
      <div class="chips" style="margin-top:14px">${SCHOOLS.map((s) => `<button class="chip ${ui.cmp.includes(s.id) ? 'on' : ''}" data-act="cmp-toggle" data-v="${s.id}">${esc(s.name)}</button>`).join('')}</div>
      <div class="toolbar"><span class="muted" style="font-size:13px">초록색은 항목별로 가장 유리한 값</span>${areaSeg()}</div>
      ${ss.length ? `<div class="card cmp-wrap"><table><tr><th></th>${ss.map((s) => `<th><a href="#/school/${s.id}" style="font-size:15px;color:var(--ink)">${esc(s.name)}</a> ${badge(s.cat)}</th>`).join('')}</tr>${body}</table></div>` : '<div class="empty card">비교할 학교를 선택하세요.</div>'}
      <section class="card pad" style="margin-top:14px"><div class="sec-h"><h2>학군 가성비</h2><small>평균 ${ui.area}㎡ 매매가 1억 원당 의대·SKY 진학자 수 (샘플)</small></div>
        <div class="bars" style="margin-top:14px">${all.map((s) => `<div class="bar-row"><a href="#/school/${s.id}">${esc(s.name)}</a><div class="trk"><i style="width:${Math.round((idx(s) / mx) * 100)}%"></i></div><b class="num">${idx(s).toFixed(1)}</b></div>`).join('')}</div></section>`;
  }

  function viewGuide() {
    const G = [
      ['학군지로 이사할 때 체크리스트', '<ol><li>희망 학교의 학교군·평준화 여부·지원 방식을 교육지원청과 학교 모집요강에서 확인 (고등학교는 학교군에 속해도 특정 학교 배정이 확정된 것은 아닙니다)</li><li>잔금일과 전입신고 날짜, 학기 일정을 함께 맞추기</li><li>전입 후 배정 통지와 전학 서류 확인</li><li>학원 이동 동선과 하교 시간대 교통 확인</li></ol>'],
      ['실거래가 읽는 법', '<ul><li>같은 단지라도 평형·층·동에 따라 가격이 다릅니다</li><li>계약일과 신고일이 다를 수 있어 최근 거래가 늦게 보일 수 있어요</li><li>직거래·특수관계 거래는 시세와 차이가 날 수 있습니다</li></ul>'],
      ['전세가율이란?', '<p style="color:var(--muted);margin:0 0 14px">전세가율은 매매가 대비 전세가의 비율입니다. 높을수록 매매·전세 차이가 작아 갭 투자 위험과 보증금 안전성을 함께 살펴봐야 합니다.</p>'],
      ['진학 실적 출처 등급', '<ul><li><b>공식 공시</b>: 학교알리미 등 법정 공시 자료</li><li><b>학교 발표</b>: 학교가 자체 공개한 합격 실적</li><li><b>별도 집계</b>: 언론·공개자료를 모아 정리한 자료</li><li>재학생만 포함인지, 졸업생 포함인지, 중복합격 포함인지, 실제 등록 인원인지 기준이 다르면 순위가 왜곡될 수 있어 기준연도와 함께 표시합니다</li></ul>'],
      ['고등학교 배정, 이렇게 달라요', '<ul><li>초등학교: 지정된 통학구역에 따라 배정</li><li>중학교: 학구·학교군 안에서 추첨 등 시·도별 방식</li><li>일반고: 거주지 기준 학교군을 바탕으로 한 지원·추첨 (단계별 방식과 비율은 시·도교육청 안내로 확인)</li><li>자율고·특목고: 학교별 입학전형과 통학권</li><li>그래서 이 앱은 고등학교에 대해 ‘배정 확정’이 아니라 ‘학교군 해당 지역’으로 표시합니다</li></ul>'],
      ['진학 실적 데이터 볼 때 주의할 점', '<ul><li>졸업생 수가 다른 학교끼리는 비율로 비교하세요</li><li>해마다 편차가 있어 여러 해를 함께 보세요</li><li>이 앱의 수치는 샘플이며, 서비스에서는 공시 자료 출처를 함께 표시할 예정입니다</li></ul>']
    ];
    view.innerHTML = `<h2 class="page-title">정보·가이드</h2><p class="sub">학군지 이사와 입시 정보를 읽는 기본기</p><div class="guide">${G.map(([t, b], i) => `<details class="card" ${i === 0 ? 'open' : ''}><summary>${t}</summary>${b}</details>`).join('')}</div>`;
  }

  function viewSearch(q) {
    const kw = (q.get('q') || '').trim(), isNew = q.get('new') === '1';
    let ss = [], as = [];
    if (isNew) as = APTS.filter((a) => a.year >= 2015).sort((a, b) => b.year - a.year).slice(0, 80);
    else if (kw) { ss = SCHOOLS.filter((s) => (s.name + regOf(s).gu + regOf(s).dong).includes(kw)); as = APTS.filter((a) => a.name.includes(kw) || (a.master ? a.gu + a.dong : schoolOf(a).name + regOf(schoolOf(a)).gu + regOf(schoolOf(a)).dong).includes(kw)); }
    as = as.slice(0, 80);
    view.innerHTML = `<h2 class="page-title">${isNew ? '신축 아파트 (2015년 이후)' : `‘${esc(kw)}’ 검색 결과`}</h2>
      <form id="sf2" class="searchbar" style="margin-top:14px">${ic('search')}<input id="q2" type="text" value="${esc(kw)}" placeholder="학교명·지역·아파트명" aria-label="검색"><button type="submit" aria-label="검색">${ic('search')}</button></form>
      ${ss.length ? `<div class="sec-h" style="margin:18px 0 8px"><h2>학교 ${ss.length}곳</h2></div><div class="tlist">${ss.map((s) => `<a class="card pad" href="#/school/${s.id}"><b>${esc(s.name)}</b> ${badge(s.cat)} <span class="muted">${regOf(s).gu} ${regOf(s).dong}</span></a>`).join('')}</div>` : ''}
      ${as.length ? `<div class="sec-h" style="margin:18px 0 8px"><h2>아파트 ${as.length}곳</h2></div><div class="tlist">${as.map((a) => `<a class="card pad" href="#/apt/${a.id}"><b>${esc(a.name)}</b> <span class="muted">${a.master ? esc(a.gu + ' ' + a.dong) + ' · ' : ''}${yrT(a)} · ${hhT(a)}세대 · ${a.master ? esc((ZSCH[a.zone] || []).map((x) => x.name).join('·')) : esc(schoolOf(a).name)} 학교군 · ${ui.area}㎡ ${eokS(pr(a, 'sale'))}</span></a>`).join('')}</div>` : ''}
      ${!ss.length && !as.length ? '<div class="empty">검색 결과가 없어요. 학교명(예: 휘문고), 지역(예: 목동), 아파트명(예: 은마)으로 찾아보세요.</div>' : ''}`;
    $('#sf2').onsubmit = (e) => { e.preventDefault(); location.hash = '#/search?q=' + encodeURIComponent($('#q2').value.trim()); };
  }

  /* =====================================================================
   * 05 커뮤니티
   * ===================================================================== */
  const catOf = (id) => D.CATS.find((c) => c.id === id);
  function viewCommunity(q) {
    if (q.has('region')) ui.cRegion = q.get('region'); if (q.has('cat')) ui.cCat = q.get('cat');
    let posts = db.posts.filter((p) => (ui.cRegion === 'all' || p.region === ui.cRegion) && (ui.cCat === 'all' || p.cat === ui.cCat) && (!ui.cQuery || (p.title + p.body).includes(ui.cQuery)));
    posts = posts.slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
    const hot = db.posts.filter((p) => ui.cRegion === 'all' || p.region === ui.cRegion).sort((a, b) => b.views - a.views).slice(0, 4);
    const cats = [{ id: 'all', label: '전체 글', icon: 'menu' }].concat(D.CATS);
    const u = me(), name = ui.cRegion === 'all' ? '전체 지역' : REG[ui.cRegion].gu + ' ' + REG[ui.cRegion].dong;
    view.innerHTML = `
      <h2 class="page-title">지역 커뮤니티</h2><p class="sub">학교, 입주민, 학부모가 만들어가는 학군 이야기 · ${esc(name)}</p>
      <div class="chips catchips" style="margin-top:12px">${cats.map((c) => `<button class="chip ${ui.cCat === c.id ? 'on' : ''}" data-act="c-cat" data-v="${c.id}">${c.label}</button>`).join('')}</div>
      <div class="comm">
        <aside class="card side" aria-label="주제">${cats.map((c) => `<button class="${ui.cCat === c.id ? 'on' : ''}" data-act="c-cat" data-v="${c.id}">${ic(c.icon)}${c.label}</button>`).join('')}</aside>
        <section class="card" style="overflow:hidden">
          <div class="scopes"><button class="${ui.cRegion === 'all' ? 'on' : ''}" data-act="c-region" data-v="all">전체</button>${D.REGIONS.map((r) => `<button class="${ui.cRegion === r.id ? 'on' : ''}" data-act="c-region" data-v="${r.id}">${r.gu} 학군</button>`).join('')}</div>
          <div class="toolbar" style="padding:0 var(--gx)"><input type="text" id="cq" placeholder="글 검색" value="${esc(ui.cQuery)}" style="max-width:260px" aria-label="글 검색"><span class="muted">${posts.length}개의 글</span></div>
          <div class="plist" style="padding:0 var(--gx) 6px">${posts.map((p) => `
            <a class="prow" href="#/post/${p.id}"><span class="tag">${catOf(p.cat).label}</span><h3>${esc(p.title)}</h3><span class="cnt">${ic('chat')}${p.comments.length}</span><span class="meta">${nickHtml(p.author)} · ${REG[p.region].gu} · ${p.date} · 조회 ${p.views}</span></a>`).join('') || '<div class="empty">아직 글이 없어요. 첫 글을 남겨보세요.</div>'}</div>
        </section>
        <aside class="cright">
          <div class="two"><a class="btn primary" href="#/write${ui.cRegion !== 'all' ? '?region=' + ui.cRegion : ''}">${ic('pencil')}글쓰기</a><a class="btn" href="#/messages">${ic('mail')}쪽지함</a></div>
          <div class="card pop"><h3>지역 인기 정보</h3>${hot.map((p, i) => `<a href="#/post/${p.id}">${i + 1}. ${esc(p.title)}</a>`).join('')}</div>
          <div class="cta-v"><b>${u && u.verified ? '실거주 인증 완료' : '지금 가입하고 실거주 인증하면'}</b>${u && u.verified ? '인증 배지가 글과 댓글에 표시돼요.' : '더 많은 정보를 이용할 수 있어요.'}</div>
        </aside>
      </div>
      <a class="btn primary fab" href="#/write${ui.cRegion !== 'all' ? '?region=' + ui.cRegion : ''}">${ic('pencil')}글쓰기</a>`;
    $('#cq').onchange = (e) => { ui.cQuery = e.target.value.trim(); viewCommunity(new URLSearchParams()); };
  }

  function viewPost(id) {
    const p = db.posts.find((x) => x.id === id);
    if (!p) { view.innerHTML = '<div class="empty">글을 찾을 수 없어요. <a class="chip" href="#/community">목록으로</a></div>'; return; }
    p.views++; save(); const u = me(), mine = u && u.nick === p.author, liked = u && p.likes.includes(u.id);
    view.innerHTML = `
      ${backLink('#/community?region=' + p.region, REG[p.region].gu + ' 커뮤니티')}
      <article class="card post">
        <div style="display:flex;gap:8px;align-items:center"><span class="tag">${catOf(p.cat).label}</span><span class="muted">${REG[p.region].gu} ${REG[p.region].dong}</span></div>
        <h2>${esc(p.title)}</h2><div class="meta">${nickHtml(p.author)} · ${p.date} · 조회 ${p.views}</div>
        <div class="body">${esc(p.body)}</div>
        <div class="actions">
          <button class="btn sm ${liked ? 'primary' : ''}" data-act="like" data-v="${p.id}">${ic('heart')}공감 ${p.likes.length}</button>
          ${mine ? `<button class="btn sm danger" data-act="del-post" data-v="${p.id}">삭제</button>` : `<button class="btn sm" data-act="dm" data-v="${esc(p.author)}">${ic('mail')}${esc(p.author)}님께 쪽지</button>`}
        </div>
      </article>
      <h3 style="margin:20px 0 4px">댓글 ${p.comments.length}</h3>
      <div class="card" style="padding:4px var(--gx)">${p.comments.map((c) => `<div class="cmt"><b>${nickHtml(c.author)}</b><small>${c.date}</small><p>${esc(c.body)}</p></div>`).join('') || '<div class="empty">첫 댓글을 남겨보세요.</div>'}</div>
      <form id="cform" class="card" style="padding:16px var(--gx);margin-top:12px">
        <textarea id="ctext" rows="3" placeholder="${u ? '댓글을 입력하세요' : '로그인 후 댓글을 쓸 수 있어요'}" ${u ? '' : 'disabled'} maxlength="500"></textarea>
        <div class="actions" style="margin-top:10px;justify-content:flex-end">${u ? '<button class="btn primary" type="submit">등록</button>' : '<button class="btn primary" type="button" data-act="login">로그인 / 가입</button>'}</div>
      </form>`;
    $('#cform').onsubmit = (e) => { e.preventDefault(); const t = $('#ctext').value.trim(); if (!t || !u) return; p.comments.push({ id: uid('c'), author: u.nick, date: TODAY, body: t }); save(); viewPost(id); toast('댓글이 등록되었어요'); };
  }

  function viewWrite(q) {
    if (!me()) { view.innerHTML = '<div class="empty">글쓰기는 로그인 후 이용할 수 있어요.<br><br><button class="btn primary lg" data-act="login">로그인 / 회원가입</button></div>'; openAuth(); return; }
    const reg = q.get('region') || (ui.cRegion !== 'all' ? ui.cRegion : me().region || 'gangnam');
    view.innerHTML = `
      ${backLink('#/community', '취소')}<h2 class="page-title">글쓰기</h2>
      <form id="wform" class="card" style="padding:8px var(--gx) 20px;margin-top:12px">
        <div class="row2"><div><label class="f" for="wr">지역</label><select id="wr">${D.REGIONS.map((r) => `<option value="${r.id}" ${r.id === reg ? 'selected' : ''}>${r.gu} ${r.dong}</option>`).join('')}</select></div>
        <div><label class="f" for="wc">주제</label><select id="wc">${D.CATS.map((c) => `<option value="${c.id}" ${c.id === (q.get('cat') || '') ? 'selected' : ''}>${c.label}</option>`).join('')}</select></div></div>
        <label class="f" for="wt">제목</label><input type="text" id="wt" maxlength="60" required>
        <label class="f" for="wb">내용</label><textarea id="wb" rows="9" maxlength="3000" required></textarea>
        <div class="actions" style="margin-top:16px"><button class="btn primary block lg" type="submit">등록하기</button></div>
      </form>`;
    $('#wform').onsubmit = (e) => {
      e.preventDefault(); const title = $('#wt').value.trim(), body = $('#wb').value.trim(); if (!title || !body) return;
      const p = { id: uid('p'), region: $('#wr').value, cat: $('#wc').value, title, body, author: me().nick, date: TODAY, views: 0, likes: [], comments: [] };
      db.posts.unshift(p); save(); ui.cRegion = p.region; ui.cCat = 'all'; toast('글이 등록되었어요'); location.hash = '#/post/' + p.id;
    };
  }

  /* ---------- 쪽지 ---------- */
  function viewMessages(q) {
    const u = me();
    if (!u) { view.innerHTML = '<h2 class="page-title">쪽지함</h2><div class="empty">쪽지는 로그인 후 이용할 수 있어요.<br><br><button class="btn primary lg" data-act="login">로그인 / 회원가입</button></div>'; return; }
    if (q.has('to')) ui.mTab = 'new';
    const box = ui.mTab === 'out' ? db.msgs.filter((m) => m.from === u.nick) : db.msgs.filter((m) => m.to === u.nick);
    const list = box.slice().sort((a, b) => b.date.localeCompare(a.date));
    const body = ui.mTab === 'new' ? `
      <form id="mform" class="card" style="padding:8px var(--gx) 20px">
        <label class="f" for="mto">받는 사람 (닉네임)</label>
        <input type="text" id="mto" list="nicks" value="${esc(q.get('to') || '')}" required><datalist id="nicks">${db.users.filter((x) => x.id !== u.id).map((x) => `<option value="${esc(x.nick)}">`).join('')}</datalist>
        <label class="f" for="mb">내용</label><textarea id="mb" rows="6" maxlength="1000" required></textarea>
        <div class="actions" style="margin-top:14px"><button class="btn primary block lg" type="submit">보내기</button></div>
      </form>` : `<div>${list.map((m) => {
        const open = ui.mOpen === m.id, other = ui.mTab === 'out' ? '받는이 ' + m.to : m.from;
        return `<button class="card mrow ${!m.read && ui.mTab === 'in' ? 'unread' : ''} ${open ? '' : 'clip'}" data-act="open-msg" data-v="${m.id}"><div class="r1"><b style="color:var(--ink)">${esc(other)}</b><span>${m.date.slice(0, 16).replace('T', ' ')}</span></div><div class="t">${esc(m.body)}</div>${open && ui.mTab === 'in' ? `<div class="actions" style="margin-top:10px"><span class="btn sm" data-act="dm" data-v="${esc(m.from)}">답장</span></div>` : ''}</button>`;
      }).join('') || '<div class="empty">쪽지가 없어요.</div>'}</div>`;
    view.innerHTML = `<h2 class="page-title">쪽지함</h2>
      <div class="chips" style="margin:12px 0">${[['in', '받은 쪽지'], ['out', '보낸 쪽지'], ['new', '새 쪽지']].map(([v, l]) => `<button class="chip ${ui.mTab === v ? 'on' : ''}" data-act="m-tab" data-v="${v}">${l}</button>`).join('')}</div>${body}`;
    if (ui.mTab === 'new') $('#mform').onsubmit = (e) => {
      e.preventDefault(); const to = $('#mto').value.trim(), t = $('#mb').value.trim(), target = db.users.find((x) => x.nick === to);
      if (!target) return toast('존재하지 않는 닉네임이에요'); if (target.id === u.id) return toast('나에게는 보낼 수 없어요'); if (!t) return;
      db.msgs.push({ id: uid('m'), from: u.nick, to: target.nick, date: new Date().toISOString().slice(0, 19), read: false, body: t }); save(); ui.mTab = 'out'; toast('쪽지를 보냈어요'); viewMessages(new URLSearchParams()); refreshChrome();
    };
  }

  /* ---------- 내 정보 / 인증 ---------- */
  function viewMe() {
    const u = me(), n = unreadCount();
    const favS = db.favs.s.map(schoolById).filter(Boolean), favA = db.favs.a.map(aptById).filter(Boolean);
    const menu = `<div class="menu"><a class="card" href="#/compare"><span>${ic('bars')}학군비교</span>${ic('chevR')}</a><a class="card" href="#/guide"><span>${ic('doc')}정보·가이드</span>${ic('chevR')}</a><a class="card" href="#/messages"><span>${ic('mail')}쪽지함</span><span>${n ? `<span class="dot"></span>${n}` : ''}${ic('chevR')}</span></a></div>`;
    const favs = (favS.length || favA.length) ? `<div class="sec-h" style="margin:22px 0 6px"><h2>관심 목록</h2></div><div class="tlist">${favS.map((s) => `<a class="card pad" href="#/school/${s.id}"><b>${esc(s.name)}</b> ${badge(s.cat)} <span class="muted">${regOf(s).gu}</span></a>`).join('')}${favA.map((a) => `<a class="card pad" href="#/apt/${a.id}"><b>${esc(a.name)}</b> <span class="muted">${esc(schoolOf(a).name)} 학교군</span></a>`).join('')}</div>` : '';
    if (!u) { view.innerHTML = `<h2 class="page-title">전체</h2><div class="card pad" style="margin-top:12px"><p>로그인하면 글쓰기와 쪽지를 사용할 수 있어요.</p><div class="actions" style="margin-top:14px"><button class="btn primary lg" data-act="login">로그인</button><button class="btn lg" data-act="signup">회원가입</button></div></div>${menu}${favs}`; return; }
    view.innerHTML = `<h2 class="page-title">내 정보</h2>
      <div class="card pad" style="margin-top:12px"><h3 style="font-size:21px;letter-spacing:-.03em">${nickHtml(u.nick)}</h3><p class="muted">${esc(u.email)} · 관심지역 ${REG[u.region] ? REG[u.region].gu : '-'}</p>
        <div class="kv" style="grid-template-columns:repeat(2,1fr);margin-top:14px"><div style="background:var(--bg)"><span>내가 쓴 글</span><b>${db.posts.filter((p) => p.author === u.nick).length}개</b></div><div style="background:var(--bg)"><span>안 읽은 쪽지</span><b>${n}통</b></div></div>
        <div class="actions">${u.verified ? '<span class="tag">실거주 인증 완료 (샘플)</span>' : '<button class="btn primary" data-act="verify">실거주 인증하기 (샘플)</button>'}<button class="btn" data-act="logout">로그아웃</button><button class="btn danger" data-act="reset">샘플 데이터 초기화</button></div></div>${menu}${favs}
      <div class="notice">${ic('info')}<span>회원 정보·글·쪽지는 이 브라우저에만 저장되는 시연용입니다. 실제 서비스에서는 서버 인증과 실거주 인증(서류·위치 등)으로 교체해야 해요.</span></div>`;
  }

  function openAuth(mode) {
    mode = mode || 'login';
    $('#modal-root').innerHTML = `<div class="overlay" data-act="close-modal"><div class="card modal" role="dialog" aria-modal="true" aria-label="로그인">
      <h3>${mode === 'signup' ? '회원가입하고 시작해요' : '로그인'}</h3>
      <div class="tabs2"><button class="${mode === 'login' ? 'on' : ''}" data-act="auth-tab" data-v="login">로그인</button><button class="${mode === 'signup' ? 'on' : ''}" data-act="auth-tab" data-v="signup">회원가입</button></div>
      <form id="aform">
        ${mode === 'signup' ? '<label class="f" for="an">닉네임 (2~10자)</label><input type="text" id="an" maxlength="10" required>' : ''}
        <label class="f" for="ae">이메일</label><input type="email" id="ae" required autocomplete="email">
        <label class="f" for="ap">비밀번호 (6자 이상)</label><input type="password" id="ap" minlength="6" required autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}">
        ${mode === 'signup' ? `<label class="f" for="ar">관심 지역</label><select id="ar">${D.REGIONS.map((r) => `<option value="${r.id}">${r.gu} ${r.dong}</option>`).join('')}</select>` : ''}
        <div class="err" id="aerr"></div>
        <button class="btn primary block lg" type="submit" style="margin-top:6px">${mode === 'signup' ? '가입하기' : '로그인'}</button>
        ${mode === 'login' ? '<button class="btn block lg" type="button" data-act="demo" style="margin-top:8px">체험 계정으로 둘러보기</button>' : ''}
      </form><p class="muted" style="font-size:12px;margin-top:14px">시연용: 정보는 이 기기 브라우저에만 저장됩니다.</p></div></div>`;
    $('#aform').onsubmit = (e) => {
      e.preventDefault(); const err = $('#aerr'), email = $('#ae').value.trim().toLowerCase(), pw = $('#ap').value;
      if (mode === 'signup') {
        const nick = $('#an').value.trim();
        if (nick.length < 2) return (err.textContent = '닉네임은 2자 이상이어야 해요.');
        if (db.users.some((x) => x.nick === nick)) return (err.textContent = '이미 사용 중인 닉네임이에요.');
        if (db.users.some((x) => x.email === email)) return (err.textContent = '이미 가입된 이메일이에요.');
        const nu = { id: uid('u'), nick, email, pw: hash(pw), region: $('#ar').value, verified: false }; db.users.push(nu); db.session = nu.id;
        if (!db.users.some((x) => x.nick === '어디살지')) db.users.push({ id: 'sys', nick: '어디살지', email: 'noreply@sample.kr', pw: hash(uid('x')), region: 'gangnam', verified: true });
        db.msgs.push({ id: uid('m'), from: '어디살지', to: nick, date: new Date().toISOString().slice(0, 19), read: false, body: `${nick}님, 가입을 환영합니다. 지역 커뮤니티에서 이야기를 나눠보세요.` });
      } else {
        const found = db.users.find((x) => x.email === email && x.pw === hash(pw));
        if (!found) return (err.textContent = '이메일 또는 비밀번호가 올바르지 않아요.'); db.session = found.id;
      }
      save(); closeModal(); refreshChrome(); toast(`${me().nick}님 환영합니다`); route();
    };
  }
  const closeModal = () => { $('#modal-root').innerHTML = ''; };
  function refreshChrome() {
    const u = me(); $('#authbtn').textContent = u ? u.nick : '로그인'; $('#joinbtn').hidden = !!u;
    const n = unreadCount(); $$('.dot').forEach((d) => { d.hidden = !n; });
  }

  /* =====================================================================
   * 라우터 / 이벤트
   * ===================================================================== */
  const ROOT_PAGES = ['home', 'schools', 'budget', 'community', 'me'];
  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    kakaoReset();
    const h = location.hash.slice(1) || '/', [path, qs] = h.split('?'), q = new URLSearchParams(route.last === h ? '' : qs || ''), seg = path.split('/').filter(Boolean), page = seg[0] || 'home';
    const R = { school: () => viewSchool(seg[1]), schools: () => viewSchools(q), apt: () => viewApt(seg[1]), budget: viewBudget, compare: () => viewCompare(q), guide: viewGuide, search: () => viewSearch(q), community: () => viewCommunity(q), post: () => viewPost(seg[1]), write: () => viewWrite(q), messages: () => viewMessages(q), me: viewMe };
    route.last = h;
    (R[page] || viewHome)();
    const nav = { home: 'home', school: 'schools', schools: 'schools', apt: 'schools', search: 'schools', budget: 'budget', compare: 'compare', guide: 'guide', community: 'community', post: 'community', write: 'community', me: 'me', messages: 'me' }[page] || 'home';
    $$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === nav));
    document.body.classList.toggle('sub', !!R[page] && !ROOT_PAGES.includes(page));
    refreshChrome(); view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0);
  }
  const curSchool = () => schoolById((location.hash.match(/^#\/school\/([^?]+)/) || [])[1]);
  const rerender = () => { const y = window.scrollY; route(); window.scrollTo(0, y); };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, v = el.dataset.v;
    if (act === 'close-modal') { if (e.target === el) closeModal(); return; }
    if (act === 'apt-cmp') return;
    if (act === 'pre') { if (window.innerWidth >= 900) { e.preventDefault(); ui.preSel = v; const y = window.scrollY; viewSchools(new URLSearchParams()); window.scrollTo(0, y); } return; }
    const S = {
      area: () => { ui.area = +v; const s = curSchool(); if (s) { drawMap(s); drawPanel(s); } else rerender(); },
      metric: () => { ui.metric = v; ui.sortKey = 'metric'; rerender(); },
      'bud-kind': () => { ui.budget.kind = v; rerender(); }, 'bud-metric': () => { ui.metric = v; rerender(); },
      'bud-step': () => setBudget(ui.budget[ui.budget.kind] + 0.5 * +v), 'bud-set': () => setBudget(+v),
      'cmp-toggle': () => { const i = ui.cmp.indexOf(v); if (i >= 0) ui.cmp.splice(i, 1); else if (ui.cmp.length < 3) ui.cmp.push(v); else toast('최대 3개까지 비교할 수 있어요'); rerender(); },
      layer: () => { ui.layers[v] = !ui.layers[v]; const s = curSchool(); drawLayers(s); drawMap(s); },
      more: () => { ui.lim = (ui.lim || 30) + 40; drawPanel(curSchool()); }, pick: () => pick(curSchool(), v), 'list-kind': () => { ui.listKind = v; drawPanel(curSchool()); drawMap(curSchool()); },
      zoom: () => { if (km.active) { if (v === '0') { km.fit = true; drawKakao(curSchool()); } else km.map.setLevel(km.map.getLevel() + (v === '1' ? -1 : 1), { animate: true }); return; } if (v === '0') { ui.vb = { x: 0, y: 0, w: MW, h: MH }; setVB(); } else zoomBy(v === '1' ? 0.75 : 1.33); },
      'apt-tab': () => { ui.aptTab = v; rerender(); }, 'apt-kind': () => { ui.aptKind = v; rerender(); }, 'apt-range': () => { ui.aptRange = +v; rerender(); },
      fav: () => {
        e.preventDefault(); const [t, id] = v.split(':'), i = db.favs[t].indexOf(id);
        if (i < 0) { db.favs[t].push(id); toast('관심 목록에 담았어요'); } else db.favs[t].splice(i, 1); save();
        const b = el; b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', String(i < 0));
      },
      'c-region': () => { ui.cRegion = v; viewCommunity(new URLSearchParams()); }, 'c-cat': () => { ui.cCat = v; viewCommunity(new URLSearchParams()); },
      login: () => openAuth('login'), signup: () => openAuth('signup'), 'auth-tab': () => openAuth(v),
      demo: () => { db.session = 'demo'; save(); closeModal(); refreshChrome(); toast('체험 계정으로 로그인했어요'); route(); },
      logout: () => { db.session = null; save(); refreshChrome(); toast('로그아웃 했어요'); route(); },
      reset: () => { db = seed(); save(); refreshChrome(); toast('샘플 데이터를 초기화했어요'); route(); },
      verify: () => { me().verified = true; save(); toast('실거주 인증이 완료되었어요 (샘플)'); route(); },
      like: () => { const u = me(); if (!u) return openAuth('login'); const p = db.posts.find((x) => x.id === v), i = p.likes.indexOf(u.id); if (i < 0) p.likes.push(u.id); else p.likes.splice(i, 1); save(); p.views--; viewPost(v); },
      'del-post': () => { if (confirm('이 글을 삭제할까요?')) { db.posts = db.posts.filter((x) => x.id !== v); save(); toast('삭제했어요'); location.hash = '#/community'; } },
      dm: () => { if (!me()) return openAuth('login'); ui.mTab = 'new'; location.hash = '#/messages?to=' + encodeURIComponent(v); e.stopPropagation(); },
      'm-tab': () => { ui.mTab = v; viewMessages(new URLSearchParams()); },
      'open-msg': () => { const m = db.msgs.find((x) => x.id === v); ui.mOpen = ui.mOpen === v ? null : v; if (m && m.to === me().nick && !m.read) { m.read = true; save(); refreshChrome(); } viewMessages(new URLSearchParams()); }
    };
    if (S[act]) S[act]();
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-act="apt-cmp"]'); if (!el) return;
    const i = ui.aptCmp.indexOf(el.dataset.v); if (i >= 0) ui.aptCmp.splice(i, 1); else if (ui.aptCmp.length < 3) ui.aptCmp.push(el.dataset.v); else toast('최대 3개까지 비교할 수 있어요');
    rerender();
  });
  $('#authbtn').addEventListener('click', () => { if (me()) location.hash = '#/me'; else openAuth('login'); });
  $('#joinbtn').addEventListener('click', () => openAuth('signup'));
  $('#backbtn').addEventListener('click', () => { if (history.length > 1) history.back(); else location.hash = '#/'; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('hashchange', route);

  /* ---------- 부팅 (스플래시 - 홈) ---------- */
  $$('[data-ic]').forEach((el) => el.insertAdjacentHTML('afterbegin', ic(el.dataset.ic)));
  document.body.classList.add('desk-bg');
  load(); refreshChrome();
  setTimeout(() => { route(); $('#splash').classList.add('hide'); }, 1500);
})();
