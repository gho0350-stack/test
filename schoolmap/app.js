/* 학군맵 - 샘플 앱 (바닐라 JS, 해시 라우팅). 앱화 시 data/store 부분만 API 로 교체하세요. */
(function () {
  'use strict';
  const D = window.SG;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hash = (str) => { let h = 5381; for (const c of String(str)) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return 'h' + (h >>> 0).toString(36); };
  const rng = (seed) => { let a = typeof seed === 'string' ? parseInt(hash(seed).slice(1), 36) : seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const TODAY = '2026-11-22';

  /* ---------- 금액 포맷 ---------- */
  const eokS = (x) => (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, '') + '억';
  const eokL = (x) => { const e = Math.floor(x + 1e-9); const m = Math.round((x - e) * 10) * 1000; return m ? `${e}억 ${m.toLocaleString()}만` : `${e}억`; };
  const range = (a, b) => (a === b ? eokS(a) : `${eokS(a)} ~ ${eokS(b)}`);

  /* ---------- 데이터 모델 ---------- */
  const REG = Object.fromEntries(D.REGIONS.map((r) => [r.id, r]));
  const SCHOOLS = D.SCHOOLS.map((s) => {
    const apts = s.apts.map((a, i) => ({ id: s.id + '-' + i, letter: String.fromCharCode(65 + i), name: a[0], hh: a[1], year: a[2], sale: a[3], jeonse: a[4], elem: a[5], mid: a[6], hi: a[7] }));
    return Object.assign({}, s, {
      apts,
      saleMin: Math.min(...apts.map((a) => a.sale)), saleMax: Math.max(...apts.map((a) => a.sale)),
      jMin: Math.min(...apts.map((a) => a.jeonse)), jMax: Math.max(...apts.map((a) => a.jeonse))
    });
  });
  const schoolById = (id) => SCHOOLS.find((s) => s.id === id);

  function tradesOf(a) {
    const r = rng(a.id);
    const mk = (base, n, spread) => {
      let t = new Date(TODAY).getTime(); const out = [];
      for (let i = 0; i < n; i++) {
        t -= (r() * 22 + 6) * 864e5;
        out.push({ date: new Date(t).toISOString().slice(0, 10), floor: Math.floor(r() * 24) + 2, price: Math.round((base + (r() - 0.5) * spread) * 10) / 10 });
      }
      return out;
    };
    return { sale: mk(a.sale, 4, 1.6), jeonse: mk(a.jeonse, 3, 0.8) };
  }

  /* ---------- 저장소 (localStorage 실패 대비 메모리 폴백) ---------- */
  const KEY = 'schoolmap.v1';
  let db;
  function seed() {
    return {
      users: D.USERS_SEED.map((u) => ({ id: u.id, nick: u.nick, email: u.email, pw: hash(u.pw), region: u.region })),
      posts: JSON.parse(JSON.stringify(D.POSTS_SEED)), msgs: JSON.parse(JSON.stringify(D.MSGS_SEED)), session: null
    };
  }
  function load() { try { const v = localStorage.getItem(KEY); db = v ? JSON.parse(v) : seed(); } catch (e) { db = seed(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* 메모리만 사용 */ } }
  const me = () => db.users.find((u) => u.id === db.session) || null;
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const unreadCount = () => { const u = me(); return u ? db.msgs.filter((m) => m.to === u.nick && !m.read).length : 0; };

  /* ---------- UI 상태 ---------- */
  const ui = { homeCat: 'all', homeRegion: 'all', sort: 'cat', sel: null, infra: { subway: true, academy: true, park: true, library: true, hospital: true, mart: true }, vb: null, cRegion: 'all', cCat: 'all', cQuery: '', mTab: 'in', mOpen: null };
  const view = $('#view');

  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }
  const badge = (cat) => `<span class="badge b-${cat}">${D.CAT_LABEL[cat]}</span>`;

  /* =====================================================================
   * 홈: 의대 / SKY / 인서울 학교 리스트
   * ===================================================================== */
  function viewHome() {
    const aptCount = SCHOOLS.reduce((n, s) => n + s.apts.length, 0);
    let list = SCHOOLS.filter((s) => (ui.homeCat === 'all' || s.cat === ui.homeCat) && (ui.homeRegion === 'all' || s.region === ui.homeRegion));
    const order = { med: 0, sky: 1, seoul: 2 };
    const sorters = { cat: (a, b) => order[a.cat] - order[b.cat] || b.saleMax - a.saleMax, sale_desc: (a, b) => b.saleMax - a.saleMax, sale_asc: (a, b) => a.saleMin - b.saleMin, jeonse_desc: (a, b) => b.jMax - a.jMax, jeonse_asc: (a, b) => a.jMin - b.jMin };
    list = list.slice().sort(sorters[ui.sort]);
    const row = (s, i) => `
      <a class="trow" href="#/school/${s.id}" aria-label="${esc(s.name)} 선택">
        <span class="no">${i + 1}</span>
        <span class="cat">${badge(s.cat)}</span>
        <span class="name"><b>${esc(s.name)}</b></span>
        <span class="reg">${REG[s.region].gu} <small>${REG[s.region].dong}</small></span>
        <span class="sale"><small>매매</small><b>${range(s.saleMin, s.saleMax)}</b></span>
        <span class="jeonse"><small>전세</small><b>${range(s.jMin, s.jMax)}</b></span>
        <span class="go"><span class="btn primary sm">선택</span></span>
      </a>`;
    view.innerHTML = `
      <section class="hero">
        <h2>학군 한눈에</h2>
        <p>의대 · SKY · 인서울 고등학교와 배정 지역 아파트의 매매·전세 가격대를 비교하고, 마음에 드는 학교를 선택하세요.</p>
        <div class="stats">
          <div class="stat"><b>${D.REGIONS.length}</b><span>지역구</span></div>
          <div class="stat"><b>${SCHOOLS.length}</b><span>고등학교</span></div>
          <div class="stat"><b>${aptCount}</b><span>배정 아파트</span></div>
        </div>
      </section>
      <div class="notice">⚠️ 샘플 화면입니다. 모든 수치는 시연용 가상 데이터이며 실제와 다를 수 있어요.</div>
      <div class="chips" role="tablist" aria-label="학군 구분">
        ${[['all', '전체'], ['med', '의대'], ['sky', 'SKY'], ['seoul', '인서울']].map(([v, l]) => `<button class="chip ${ui.homeCat === v ? 'on' : ''}" data-act="home-cat" data-v="${v}">${l}</button>`).join('')}
      </div>
      <div class="chips" aria-label="지역">
        <button class="chip ${ui.homeRegion === 'all' ? 'on' : ''}" data-act="home-region" data-v="all">전체 지역</button>
        ${D.REGIONS.map((r) => `<button class="chip ${ui.homeRegion === r.id ? 'on' : ''}" data-act="home-region" data-v="${r.id}">${r.gu}</button>`).join('')}
      </div>
      <div class="toolbar"><span class="muted">${list.length}개 학교</span>
        <select class="inline" id="sort" aria-label="정렬">
          ${[['cat', '구분순 (의대·SKY·인서울)'], ['sale_desc', '매매가 높은순'], ['sale_asc', '매매가 낮은순'], ['jeonse_desc', '전세가 높은순'], ['jeonse_asc', '전세가 낮은순']].map(([v, l]) => `<option value="${v}" ${ui.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="thead trow" aria-hidden="true"><span class="no">#</span><span class="cat">구분</span><span class="name">학교</span><span class="reg">지역</span><span class="sale">매매 min~max</span><span class="jeonse">전세 min~max</span><span class="go"></span></div>
      <div class="tlist">${list.map(row).join('') || '<div class="empty">조건에 맞는 학교가 없어요.</div>'}</div>`;
    $('#sort').onchange = (e) => { ui.sort = e.target.value; viewHome(); };
  }

  /* =====================================================================
   * 학교 상세: 지도 + 배정 아파트
   * ===================================================================== */
  const MW = 800, MH = 580, CX = 400, CY = 290, SX = 1.3;
  const layoutCache = {};
  function blobPath(cx, cy, r, rand) {
    const n = 12, pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const rr = r * (0.82 + rand() * 0.3); pts.push([cx + Math.cos(a) * rr * 1.1, cy + Math.sin(a) * rr]); }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + 'Z';
  }
  function layoutOf(s) {
    if (layoutCache[s.id]) return layoutCache[s.id];
    const r = rng(s.id), n = s.apts.length, off = r() * Math.PI * 2;
    const zones = s.apts.map((a, i) => {
      const ang = off + (i * 2 * Math.PI) / n + (r() - 0.5) * 0.35;
      const rad = 70 + (clamp(a.hi, 5, 15) - 5) * 11;
      const cx = CX + Math.cos(ang) * rad * SX, cy = CY + Math.sin(ang) * rad;
      const zr = clamp(20 + Math.sqrt(a.hh) * 0.4, 28, 46);
      return { id: a.id, cx, cy, path: blobPath(cx, cy, zr, r) };
    });
    const reg = REG[s.region], pois = [];
    const order = ['subway', 'subway', 'academy', 'academy', 'park', 'park', 'library', 'hospital', 'mart', 'subway'];
    const count = {}; const a0 = r() * Math.PI * 2;
    order.forEach((t, i) => {
      const k = (count[t] = (count[t] || 0) + 1) - 1;
      const pool = reg.infra[t]; const name = pool[(k + Math.floor(r() * 2)) % pool.length];
      const ang = a0 + (i / order.length) * Math.PI * 2;
      pois.push({ type: t, name, x: CX + Math.cos(ang) * 360, y: CY + Math.sin(ang) * 255 });
    });
    const roads = [0, 1, 2].map((i) => { const y1 = 80 + r() * 420, y2 = 80 + r() * 420; return `M0,${y1.toFixed(0)} Q${(300 + r() * 200).toFixed(0)},${(y1 + y2) / 2 + (r() - 0.5) * 160} ${MW},${y2.toFixed(0)}`; });
    roads.push(`M${(150 + r() * 100).toFixed(0)},0 Q${(CX + (r() - 0.5) * 200).toFixed(0)},${CY} ${(550 + r() * 100).toFixed(0)},${MH}`);
    return (layoutCache[s.id] = { zones, pois, roads });
  }

  function viewSchool(id) {
    const s = schoolById(id);
    if (!s) { view.innerHTML = '<div class="empty">학교를 찾을 수 없어요. <a href="#/" class="chip">홈으로</a></div>'; return; }
    ui.sel = null; ui.vb = { x: 0, y: 0, w: MW, h: MH };
    const reg = REG[s.region];
    view.innerHTML = `
      <a class="back" href="#/">← 학교 목록</a>
      <div class="s-head">
        <div><h2>${esc(s.name)} ${badge(s.cat)}</h2><p class="sub">📍 ${reg.gu} ${reg.dong} · ${esc(reg.tag)} · 배정 아파트 ${s.apts.length}곳</p></div>
      </div>
      <section class="card mapcard" aria-label="${esc(s.name)} 주변 지도" style="margin-top:12px">
        <div class="mapbar"><div class="chips" id="infra-chips"></div></div>
        <div class="mapbox">
          <svg id="map" viewBox="0 0 ${MW} ${MH}" role="img" aria-label="${esc(s.name)} 배정 아파트 영역 지도"><g id="map-g"></g></svg>
          <div class="mapctl"><button data-act="zoom" data-v="1" aria-label="확대">+</button><button data-act="zoom" data-v="-1" aria-label="축소">−</button><button data-act="zoom" data-v="0" aria-label="원래대로">⤾</button></div>
        </div>
        <div class="legend"><span>🏫 학교</span><span>색이 진할수록 매매가 높음</span><i class="grad"></i><span>점선 = 학교까지 도보 5·10·15분</span><span>영역을 누르면 상세</span></div>
      </section>
      <section class="card" id="panel" aria-live="polite" style="margin-top:12px"></section>
      <a class="btn primary bigbtn" href="#/community?region=${s.region}">💬 ${reg.gu} ${reg.dong} 지역 커뮤니티 가기</a>`;
    drawChips(s); drawMap(s); drawPanel(s); bindMap(s);
  }

  function drawChips(s) {
    const L = layoutOf(s); const cnt = {}; L.pois.forEach((p) => { cnt[p.type] = (cnt[p.type] || 0) + 1; });
    $('#infra-chips').innerHTML = Object.entries(D.INFRA).map(([t, m]) => `<button class="chip ${ui.infra[t] ? 'on' : ''}" data-act="infra" data-v="${t}">${m.icon} ${m.label} ${cnt[t] || 0}</button>`).join('');
  }

  function drawMap(s) {
    const L = layoutOf(s), r = rng(s.id + 'park');
    const parks = L.pois.filter((p) => p.type === 'park').map((p) => `<ellipse cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" rx="${(48 + r() * 22).toFixed(0)}" ry="${(30 + r() * 14).toFixed(0)}" fill="var(--map-park)"/>`).join('');
    const roads = L.roads.map((d) => `<path d="${d}" fill="none" stroke="var(--map-road)" stroke-width="9" stroke-linecap="round"/>`).join('');
    const rings = [[5, 70], [10, 125], [15, 180]].map(([m, rad]) => `<ellipse cx="${CX}" cy="${CY}" rx="${rad * SX}" ry="${rad}" fill="none" stroke="var(--map-ring)" stroke-dasharray="4 5" opacity=".7"/><text x="${CX + rad * SX + 3}" y="${CY - 3}" font-size="9" fill="var(--map-ring)">도보 ${m}분</text>`).join('');
    const aptsMin = s.saleMin, span = s.saleMax - s.saleMin || 1;
    const zones = s.apts.map((a, i) => {
      const z = L.zones[i], t = (a.sale - aptsMin) / span, op = (0.2 + 0.55 * t).toFixed(2), on = ui.sel === a.id;
      return `<g class="zone ${on ? 'sel' : ''}" data-apt="${a.id}" tabindex="0" role="button" aria-label="${a.letter} ${esc(a.name)} 매매 ${eokS(a.sale)}">
        <path d="${z.path}" style="fill-opacity:${op}"/>
        <text class="ltr" x="${z.cx.toFixed(0)}" y="${(z.cy - 2).toFixed(0)}" text-anchor="middle">${a.letter}</text>
        <text class="pr" x="${z.cx.toFixed(0)}" y="${(z.cy + 13).toFixed(0)}" text-anchor="middle">${eokS(a.sale)}</text>
        <text class="nm" x="${z.cx.toFixed(0)}" y="${(z.cy + 56).toFixed(0)}" text-anchor="middle">${esc(a.name)}</text></g>`;
    }).join('');
    const pois = L.pois.filter((p) => ui.infra[p.type]).map((p) => `<g class="poi"><title>${esc(p.name)}</title><circle cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" r="15"/><text class="ic" x="${p.x.toFixed(0)}" y="${(p.y + 6).toFixed(0)}">${D.INFRA[p.type].icon}</text><text class="lb" x="${p.x.toFixed(0)}" y="${(p.y + 28).toFixed(0)}">${esc(p.name)}</text></g>`).join('');
    $('#map-g').innerHTML = `${parks}${roads}
      <ellipse cx="${CX}" cy="${CY}" rx="318" ry="240" fill="var(--map-zone)" fill-opacity=".05" stroke="var(--map-zone)" stroke-width="2" stroke-dasharray="10 6"/>
      <text x="14" y="24" font-size="12" font-weight="700" fill="var(--map-zone)">▭ ${esc(s.name)} 배정 권역 (샘플)</text>
      ${rings}${zones}
      <g><circle cx="${CX}" cy="${CY}" r="24" fill="var(--accent)" stroke="#fff" stroke-width="3"/><text x="${CX}" y="${CY + 8}" text-anchor="middle" font-size="22">🏫</text><text x="${CX}" y="${CY + 42}" text-anchor="middle" font-size="12" font-weight="800" fill="var(--ink)">${esc(s.name)}</text></g>
      ${pois}`;
  }

  function drawPanel(s) {
    const mins = (m) => (m <= 15 ? `<b>${m}분</b>` : '<span class="no">15분↑</span>');
    const rows = s.apts.map((a) => {
      const t = tradesOf(a), on = a.id === ui.sel;
      let detail = '';
      if (on) {
        const age = 2026 - a.year, ratio = Math.round((a.jeonse / a.sale) * 100);
        const tb = (arr) => `<table><tr><th>계약일</th><th>층</th><th>금액</th></tr>${arr.map((x) => `<tr><td>${x.date}</td><td>${x.floor}층</td><td><b>${eokL(x.price)}</b></td></tr>`).join('')}</table>`;
        detail = `<div class="detail">
          <div class="kv"><div><span>최근 실거래 (매매)</span><b>${eokL(t.sale[0].price)}</b></div><div><span>전세</span><b>${eokL(a.jeonse)}</b></div><div><span>전세가율</span><b>${ratio}%</b></div><div><span>세대수 · 준공</span><b>${a.hh.toLocaleString()}세대 · ${a.year}년 (${age}년차)</b></div></div>
          <h4 class="h4">초·중·고 도보 거리</h4>
          <table><tr><td>초등학교</td><td class="ok">✓ 도보 ${a.elem}분 <span class="muted">(약 ${(a.elem * 80).toLocaleString()}m)</span></td></tr><tr><td>중학교</td><td class="ok">✓ 도보 ${a.mid}분 <span class="muted">(약 ${(a.mid * 80).toLocaleString()}m)</span></td></tr><tr><td>${esc(s.name)}</td><td class="ok">✓ 도보 ${a.hi}분 <span class="muted">(약 ${(a.hi * 80).toLocaleString()}m)</span></td></tr></table>
          <div class="two"><div><h4 class="h4">최근 매매 실거래</h4>${tb(t.sale)}</div><div><h4 class="h4">최근 전세 실거래</h4>${tb(t.jeonse)}</div></div>
          <div class="actions" style="margin-top:12px"><a class="btn sm" href="#/community?region=${s.region}&cat=life">🏢 아파트생활</a><a class="btn sm" href="#/community?region=${s.region}&cat=moving">🚚 입주정보</a></div>
        </div>`;
      }
      return `<div class="arow2 ${on ? 'on' : ''}"><button class="ar" data-act="pick" data-v="${a.id}" aria-expanded="${on}">
        <span class="l">${a.letter}</span><span class="nm"><b>${esc(a.name)}</b></span>
        <span class="c sale"><small>실거래</small><b>${eokS(t.sale[0].price)}</b></span>
        <span class="c jeo"><small>전세</small><b>${eokS(a.jeonse)}</b></span>
        <span class="c hh"><small>세대수</small>${a.hh.toLocaleString()}</span>
        <span class="c yr"><small>준공</small>${a.year}</span>
        <span class="c sch"><small>도보</small>초 ${mins(a.elem)} · 중 ${mins(a.mid)} · 고 ${mins(a.hi)}</span>
      </button>${detail}</div>`;
    }).join('');
    $('#panel').innerHTML = `<div class="p-sec"><h3>배정 아파트 ${s.apts.length}곳</h3>
      <p class="muted" style="font-size:13px">매매 ${range(s.saleMin, s.saleMax)} · 전세 ${range(s.jMin, s.jMax)} · 전용 84㎡ 기준 · 눌러서 상세 보기</p></div>
      <div class="ahead arow2"><span class="ar"><span class="l"></span><span class="nm">단지</span><span class="c">매매 실거래</span><span class="c">전세</span><span class="c">세대수</span><span class="c">준공</span><span class="c sch">초·중·고 도보</span></span></div>
      ${rows}`;
  }

  function pick(s, id) {
    ui.sel = ui.sel === id ? null : id; drawMap(s); drawPanel(s);
    const el = $('.arow2.on'); if (el && window.innerWidth < 960) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setVB() { const v = ui.vb; $('#map').setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`); }
  function zoomBy(f, cx, cy) {
    const v = ui.vb; const nw = clamp(v.w * f, MW / 4, MW), nh = nw * (MH / MW);
    const px = cx == null ? v.x + v.w / 2 : cx, py = cy == null ? v.y + v.h / 2 : cy;
    v.x = clamp(px - ((px - v.x) * nw) / v.w, 0, MW - nw); v.y = clamp(py - ((py - v.y) * nh) / v.h, 0, MH - nh); v.w = nw; v.h = nh; setVB();
  }
  function bindMap(s) {
    const svg = $('#map'); let drag = null, moved = false;
    const kOf = (r) => Math.min(r.width / ui.vb.w, r.height / ui.vb.h);
    const toSvg = (e) => { const r = svg.getBoundingClientRect(), k = kOf(r); return [ui.vb.x + (e.clientX - r.left - (r.width - ui.vb.w * k) / 2) / k, ui.vb.y + (e.clientY - r.top - (r.height - ui.vb.h * k) / 2) / k]; };
    svg.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, vx: ui.vb.x, vy: ui.vb.y }; moved = false; });
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
    function onMove(e) {
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) { moved = true; svg.classList.add('drag'); }
      if (!moved) return; const k = kOf(svg.getBoundingClientRect());
      ui.vb.x = clamp(drag.vx - dx / k, 0, MW - ui.vb.w); ui.vb.y = clamp(drag.vy - dy / k, 0, MH - ui.vb.h); setVB();
    }
    function onUp() { drag = null; svg.classList.remove('drag'); }
    svg.addEventListener('click', (e) => { if (moved) { moved = false; return; } const g = e.target.closest('.zone'); if (g) pick(s, g.dataset.apt); });
    svg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { const g = e.target.closest('.zone'); if (g) { e.preventDefault(); pick(s, g.dataset.apt); } } });
    svg.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = toSvg(e); zoomBy(e.deltaY < 0 ? 0.85 : 1.18, x, y); }, { passive: false });
    cleanup = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }
  let cleanup = null;

  /* =====================================================================
   * 커뮤니티
   * ===================================================================== */
  const catOf = (id) => D.CATS.find((c) => c.id === id);
  function viewCommunity(q) {
    if (q.has('region')) ui.cRegion = q.get('region'); if (q.has('cat')) ui.cCat = q.get('cat');
    let posts = db.posts.filter((p) => (ui.cRegion === 'all' || p.region === ui.cRegion) && (ui.cCat === 'all' || p.cat === ui.cCat) && (!ui.cQuery || (p.title + p.body).includes(ui.cQuery)));
    posts = posts.slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
    const regName = ui.cRegion === 'all' ? '전체 지역' : REG[ui.cRegion].gu + ' ' + REG[ui.cRegion].dong;
    view.innerHTML = `
      <h2 class="page-title">지역 커뮤니티</h2><p class="sub">${esc(regName)} · 학교, 육아·교육, 학원, 아파트생활, 입주, 인프라 이야기</p>
      <div class="chips" style="margin-top:12px"><button class="chip ${ui.cRegion === 'all' ? 'on' : ''}" data-act="c-region" data-v="all">전체 지역</button>
        ${D.REGIONS.map((r) => `<button class="chip ${ui.cRegion === r.id ? 'on' : ''}" data-act="c-region" data-v="${r.id}">${r.gu}</button>`).join('')}</div>
      <div class="chips"><button class="chip ${ui.cCat === 'all' ? 'on' : ''}" data-act="c-cat" data-v="all">전체 주제</button>
        ${D.CATS.map((c) => `<button class="chip ${ui.cCat === c.id ? 'on' : ''}" data-act="c-cat" data-v="${c.id}">${c.icon} ${c.label}</button>`).join('')}</div>
      <div class="toolbar"><input type="text" id="cq" placeholder="글 검색" value="${esc(ui.cQuery)}" style="max-width:320px" aria-label="글 검색"><span class="muted">${posts.length}개의 글</span></div>
      <div class="plist">${posts.map((p) => `
        <a class="card prow" href="#/post/${p.id}">
          <div class="r1"><span class="tag">${catOf(p.cat).icon} ${catOf(p.cat).label}</span><span>${REG[p.region].gu}</span></div>
          <h3>${esc(p.title)}</h3><p>${esc(p.body)}</p>
          <div class="meta">${esc(p.author)} · ${p.date} · 👁 ${p.views} · ❤ ${p.likes.length} · 💬 ${p.comments.length}</div>
        </a>`).join('') || '<div class="empty">아직 글이 없어요. 첫 글을 남겨보세요!</div>'}</div>
      <a class="btn primary fab" href="#/write${ui.cRegion !== 'all' ? '?region=' + ui.cRegion : ''}">✏️ 글쓰기</a>`;
    $('#cq').onchange = (e) => { ui.cQuery = e.target.value.trim(); viewCommunity(new URLSearchParams()); };
  }

  function viewPost(id) {
    const p = db.posts.find((x) => x.id === id);
    if (!p) { view.innerHTML = '<div class="empty">글을 찾을 수 없어요. <a class="chip" href="#/community">목록으로</a></div>'; return; }
    p.views++; save(); const u = me(), mine = u && u.nick === p.author, liked = u && p.likes.includes(u.id);
    view.innerHTML = `
      <a class="back" href="#/community?region=${p.region}">← ${REG[p.region].gu} 커뮤니티</a>
      <article class="card post">
        <div class="r1" style="display:flex;gap:8px;align-items:center"><span class="tag">${catOf(p.cat).icon} ${catOf(p.cat).label}</span><span class="muted">${REG[p.region].gu} ${REG[p.region].dong}</span></div>
        <h2>${esc(p.title)}</h2>
        <div class="meta" style="margin:0">${esc(p.author)} · ${p.date} · 👁 ${p.views}</div>
        <div class="body">${esc(p.body)}</div>
        <div class="actions">
          <button class="btn sm ${liked ? 'primary' : ''}" data-act="like" data-v="${p.id}">❤ 공감 ${p.likes.length}</button>
          ${mine ? `<button class="btn sm danger" data-act="del-post" data-v="${p.id}">삭제</button>` : `<button class="btn sm" data-act="dm" data-v="${esc(p.author)}">✉️ ${esc(p.author)}님께 쪽지</button>`}
        </div>
      </article>
      <h3 style="margin:18px 0 4px">댓글 ${p.comments.length}</h3>
      <div class="card" style="padding:4px 16px">${p.comments.map((c) => `<div class="cmt"><b>${esc(c.author)}</b><small>${c.date}</small><p>${esc(c.body)}</p></div>`).join('') || '<div class="empty">첫 댓글을 남겨보세요.</div>'}</div>
      <form id="cform" class="card" style="padding:14px;margin-top:12px">
        <textarea id="ctext" rows="3" placeholder="${u ? '댓글을 입력하세요' : '로그인 후 댓글을 쓸 수 있어요'}" ${u ? '' : 'disabled'} maxlength="500"></textarea>
        <div class="actions" style="margin-top:8px;justify-content:flex-end">${u ? '<button class="btn primary sm" type="submit">등록</button>' : '<button class="btn primary sm" type="button" data-act="login">로그인 / 가입</button>'}</div>
      </form>`;
    $('#cform').onsubmit = (e) => { e.preventDefault(); const t = $('#ctext').value.trim(); if (!t || !u) return; p.comments.push({ id: uid('c'), author: u.nick, date: TODAY, body: t }); save(); viewPost(id); toast('댓글이 등록되었어요'); };
  }

  function viewWrite(q) {
    if (!me()) { view.innerHTML = '<div class="empty">글쓰기는 로그인 후 이용할 수 있어요.<br><br><button class="btn primary" data-act="login">로그인 / 회원가입</button></div>'; openAuth(); return; }
    const reg = q.get('region') || (ui.cRegion !== 'all' ? ui.cRegion : me().region || 'gangnam');
    view.innerHTML = `
      <a class="back" href="#/community">← 취소</a><h2 class="page-title">글쓰기</h2>
      <form id="wform" class="card" style="padding:16px;margin-top:12px">
        <div class="row2"><div><label class="f" for="wr">지역</label><select id="wr">${D.REGIONS.map((r) => `<option value="${r.id}" ${r.id === reg ? 'selected' : ''}>${r.gu} ${r.dong}</option>`).join('')}</select></div>
        <div><label class="f" for="wc">주제</label><select id="wc">${D.CATS.map((c) => `<option value="${c.id}" ${c.id === (q.get('cat') || '') ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join('')}</select></div></div>
        <label class="f" for="wt">제목</label><input type="text" id="wt" maxlength="60" required>
        <label class="f" for="wb">내용</label><textarea id="wb" rows="9" maxlength="3000" required></textarea>
        <div class="actions" style="margin-top:14px;justify-content:flex-end"><button class="btn primary" type="submit">등록</button></div>
      </form>`;
    $('#wform').onsubmit = (e) => {
      e.preventDefault(); const title = $('#wt').value.trim(), body = $('#wb').value.trim(); if (!title || !body) return;
      const p = { id: uid('p'), region: $('#wr').value, cat: $('#wc').value, title, body, author: me().nick, date: TODAY, views: 0, likes: [], comments: [] };
      db.posts.unshift(p); save(); ui.cRegion = p.region; ui.cCat = 'all'; toast('글이 등록되었어요'); location.hash = '#/post/' + p.id;
    };
  }

  /* =====================================================================
   * 쪽지
   * ===================================================================== */
  function viewMessages(q) {
    const u = me();
    if (!u) { view.innerHTML = '<h2 class="page-title">쪽지</h2><div class="empty">쪽지는 로그인 후 이용할 수 있어요.<br><br><button class="btn primary" data-act="login">로그인 / 회원가입</button></div>'; return; }
    if (q.has('to')) ui.mTab = 'new';
    const box = ui.mTab === 'out' ? db.msgs.filter((m) => m.from === u.nick) : db.msgs.filter((m) => m.to === u.nick);
    const list = box.slice().sort((a, b) => b.date.localeCompare(a.date));
    const body = ui.mTab === 'new' ? `
      <form id="mform" class="card" style="padding:16px">
        <label class="f" for="mto">받는 사람 (닉네임)</label>
        <input type="text" id="mto" list="nicks" value="${esc(q.get('to') || '')}" required><datalist id="nicks">${db.users.filter((x) => x.id !== u.id).map((x) => `<option value="${esc(x.nick)}">`).join('')}</datalist>
        <label class="f" for="mb">내용</label><textarea id="mb" rows="6" maxlength="1000" required></textarea>
        <div class="actions" style="margin-top:12px;justify-content:flex-end"><button class="btn primary" type="submit">보내기</button></div>
      </form>` : `<div class="plist">${list.map((m) => {
        const open = ui.mOpen === m.id, other = ui.mTab === 'out' ? '받는이 ' + m.to : m.from;
        return `<button class="card mrow ${!m.read && ui.mTab === 'in' ? 'unread' : ''} ${open ? '' : 'clip'}" data-act="open-msg" data-v="${m.id}"><div class="r1"><b style="color:var(--ink)">${esc(other)}</b><span>${m.date.slice(0, 16).replace('T', ' ')}</span></div><div class="t">${esc(m.body)}</div>${open && ui.mTab === 'in' ? `<div class="actions" style="margin-top:10px"><span class="btn sm" data-act="dm" data-v="${esc(m.from)}">↩ 답장</span></div>` : ''}</button>`;
      }).join('') || '<div class="empty">쪽지가 없어요.</div>'}</div>`;
    view.innerHTML = `<h2 class="page-title">쪽지</h2>
      <div class="chips" style="margin-top:10px">${[['in', '받은 쪽지'], ['out', '보낸 쪽지'], ['new', '✏️ 새 쪽지']].map(([v, l]) => `<button class="chip ${ui.mTab === v ? 'on' : ''}" data-act="m-tab" data-v="${v}">${l}</button>`).join('')}</div>${body}`;
    if (ui.mTab === 'new') $('#mform').onsubmit = (e) => {
      e.preventDefault(); const to = $('#mto').value.trim(), t = $('#mb').value.trim(); const target = db.users.find((x) => x.nick === to);
      if (!target) return toast('존재하지 않는 닉네임이에요'); if (target.id === u.id) return toast('나에게는 보낼 수 없어요'); if (!t) return;
      db.msgs.push({ id: uid('m'), from: u.nick, to: target.nick, date: new Date().toISOString().slice(0, 19), read: false, body: t }); save(); ui.mTab = 'out'; toast('쪽지를 보냈어요'); viewMessages(new URLSearchParams()); refreshChrome();
    };
  }

  /* =====================================================================
   * 내 정보 / 인증
   * ===================================================================== */
  function viewMe() {
    const u = me();
    if (!u) { view.innerHTML = '<h2 class="page-title">내 정보</h2><div class="empty">로그인하면 글쓰기와 쪽지를 사용할 수 있어요.<br><br><button class="btn primary" data-act="login">로그인 / 회원가입</button></div>'; return; }
    view.innerHTML = `<h2 class="page-title">내 정보</h2>
      <div class="card" style="padding:18px;margin-top:12px"><h3 style="font-size:20px">${esc(u.nick)}</h3><p class="muted">${esc(u.email)} · 관심지역 ${REG[u.region] ? REG[u.region].gu : '-'}</p>
        <div class="kv"><div><span>내가 쓴 글</span><b>${db.posts.filter((p) => p.author === u.nick).length}개</b></div><div><span>안 읽은 쪽지</span><b>${unreadCount()}통</b></div></div>
        <div class="actions"><button class="btn" data-act="logout">로그아웃</button><button class="btn danger" data-act="reset">샘플 데이터 초기화</button></div></div>
      <div class="notice">회원 정보·글·쪽지는 이 브라우저에만 저장되는 시연용입니다. 앱 출시 시 서버 인증/DB 로 교체해야 해요.</div>`;
  }

  function openAuth(mode) {
    mode = mode || 'login';
    const root = $('#modal-root');
    root.innerHTML = `<div class="overlay" data-act="close-modal"><div class="card modal" role="dialog" aria-modal="true" aria-label="로그인">
      <h3>학군맵 시작하기</h3>
      <div class="tabs2"><button class="${mode === 'login' ? 'on' : ''}" data-act="auth-tab" data-v="login">로그인</button><button class="${mode === 'signup' ? 'on' : ''}" data-act="auth-tab" data-v="signup">회원가입</button></div>
      <form id="aform">
        ${mode === 'signup' ? `<label class="f" for="an">닉네임 (2~10자)</label><input type="text" id="an" maxlength="10" required>` : ''}
        <label class="f" for="ae">이메일</label><input type="email" id="ae" required autocomplete="email">
        <label class="f" for="ap">비밀번호 (6자 이상)</label><input type="password" id="ap" minlength="6" required autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}">
        ${mode === 'signup' ? `<label class="f" for="ar">관심 지역</label><select id="ar">${D.REGIONS.map((r) => `<option value="${r.id}">${r.gu} ${r.dong}</option>`).join('')}</select>` : ''}
        <div class="err" id="aerr"></div>
        <button class="btn primary" type="submit" style="width:100%;margin-top:6px">${mode === 'signup' ? '가입하고 시작' : '로그인'}</button>
        ${mode === 'login' ? '<button class="btn" type="button" data-act="demo" style="width:100%;margin-top:8px">체험 계정으로 둘러보기</button>' : ''}
      </form>
      <p class="muted" style="font-size:12px;margin-top:12px">시연용: 정보는 이 기기 브라우저에만 저장됩니다.</p></div></div>`;
    $('#aform').onsubmit = (e) => {
      e.preventDefault(); const err = $('#aerr'), email = $('#ae').value.trim().toLowerCase(), pw = $('#ap').value;
      if (mode === 'signup') {
        const nick = $('#an').value.trim();
        if (nick.length < 2) return (err.textContent = '닉네임은 2자 이상이어야 해요.');
        if (db.users.some((x) => x.nick === nick)) return (err.textContent = '이미 사용 중인 닉네임이에요.');
        if (db.users.some((x) => x.email === email)) return (err.textContent = '이미 가입된 이메일이에요.');
        const nu = { id: uid('u'), nick, email, pw: hash(pw), region: $('#ar').value }; db.users.push(nu); db.session = nu.id;
        db.msgs.push({ id: uid('m'), from: '학군맵', to: nick, date: new Date().toISOString().slice(0, 19), read: false, body: `${nick}님, 가입을 환영합니다! 지역 커뮤니티에서 이야기를 나눠보세요.` });
        if (!db.users.some((x) => x.nick === '학군맵')) db.users.push({ id: 'sys', nick: '학군맵', email: 'noreply@sample.kr', pw: hash(uid('x')), region: 'gangnam' });
      } else {
        const found = db.users.find((x) => x.email === email && x.pw === hash(pw));
        if (!found) return (err.textContent = '이메일 또는 비밀번호가 올바르지 않아요.'); db.session = found.id;
      }
      save(); closeModal(); refreshChrome(); toast(`${me().nick}님 환영합니다`); route();
    };
  }
  const closeModal = () => { $('#modal-root').innerHTML = ''; };

  function refreshChrome() {
    const u = me(); $('#authbtn').textContent = u ? u.nick : '로그인';
    const n = unreadCount(); $$('.dot').forEach((d) => { d.hidden = !n; });
  }

  /* =====================================================================
   * 라우터 / 이벤트
   * ===================================================================== */
  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    const h = location.hash.slice(1) || '/'; const [path, qs] = h.split('?'); const q = new URLSearchParams(qs || ''); const seg = path.split('/').filter(Boolean);
    const page = seg[0] || 'home';
    if (page === 'school') viewSchool(seg[1]);
    else if (page === 'community') viewCommunity(q);
    else if (page === 'post') viewPost(seg[1]);
    else if (page === 'write') viewWrite(q);
    else if (page === 'messages') viewMessages(q);
    else if (page === 'me') viewMe();
    else viewHome();
    const nav = { home: 'home', school: 'home', community: 'community', post: 'community', write: 'community', messages: 'messages', me: 'me' }[page] || 'home';
    $$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === nav));
    refreshChrome(); if (page !== 'school' || !ui.sel) window.scrollTo(0, 0);
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, v = el.dataset.v, s = (location.hash.match(/^#\/school\/([^?]+)/) || [])[1];
    if (act === 'close-modal') { if (e.target === el) closeModal(); return; }
    if (act === 'home-cat') { ui.homeCat = v; viewHome(); }
    else if (act === 'home-region') { ui.homeRegion = v; viewHome(); }
    else if (act === 'infra') { ui.infra[v] = !ui.infra[v]; const sc = schoolById(s); drawChips(sc); drawMap(sc); }
    else if (act === 'pick') pick(schoolById(s), v);
    else if (act === 'zoom') { if (v === '0') { ui.vb = { x: 0, y: 0, w: MW, h: MH }; setVB(); } else zoomBy(v === '1' ? 0.75 : 1.33); }
    else if (act === 'c-region') { ui.cRegion = v; viewCommunity(new URLSearchParams()); }
    else if (act === 'c-cat') { ui.cCat = v; viewCommunity(new URLSearchParams()); }
    else if (act === 'login') openAuth('login');
    else if (act === 'auth-tab') openAuth(v);
    else if (act === 'demo') { db.session = 'demo'; save(); closeModal(); refreshChrome(); toast('체험 계정으로 로그인했어요'); route(); }
    else if (act === 'logout') { db.session = null; save(); refreshChrome(); toast('로그아웃 했어요'); route(); }
    else if (act === 'reset') { db = seed(); save(); refreshChrome(); toast('샘플 데이터를 초기화했어요'); route(); }
    else if (act === 'like') { const u = me(); if (!u) return openAuth('login'); const p = db.posts.find((x) => x.id === v); const i = p.likes.indexOf(u.id); if (i < 0) p.likes.push(u.id); else p.likes.splice(i, 1); save(); p.views--; viewPost(v); }
    else if (act === 'del-post') { if (confirm('이 글을 삭제할까요?')) { db.posts = db.posts.filter((x) => x.id !== v); save(); toast('삭제했어요'); location.hash = '#/community'; } }
    else if (act === 'dm') { if (!me()) return openAuth('login'); ui.mTab = 'new'; location.hash = '#/messages?to=' + encodeURIComponent(v); e.stopPropagation(); }
    else if (act === 'm-tab') { ui.mTab = v; viewMessages(new URLSearchParams()); }
    else if (act === 'open-msg') { const m = db.msgs.find((x) => x.id === v); ui.mOpen = ui.mOpen === v ? null : v; if (m && m.to === me().nick && !m.read) { m.read = true; save(); refreshChrome(); } viewMessages(new URLSearchParams()); }
  });
  $('#authbtn').addEventListener('click', () => { if (me()) location.hash = '#/me'; else openAuth('login'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('hashchange', route);

  /* ---------- 부팅 (스플래시 → 홈) ---------- */
  load(); refreshChrome();
  const steps = ['학교 데이터를 불러오는 중…', '배정 아파트 시세를 정리하는 중…', '지도 준비 중…'];
  steps.forEach((t, i) => setTimeout(() => { $('#splash-msg').textContent = t; }, i * 500));
  setTimeout(() => { route(); $('#splash').classList.add('hide'); }, 1600);
})();
