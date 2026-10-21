/* 위례 학군지도 프로토타입 — 샘플 데이터. 데이터는 data/*.csv, *.geojson 에서 읽는다. */
(async function () {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ───────── 데이터 로딩 ───────── */
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
      else if (c !== '\r') f += c;
    }
    if (f.length || row.length) { row.push(f); rows.push(row); }
    const clean = rows.filter((r) => r.length > 1 || (r[0] ?? '') !== '');
    const [head, ...body] = clean;
    return body.map((r) => Object.fromEntries(head.map((k, i) => [k.trim(), (r[i] ?? '').trim()])));
  }
  const get = (p, json) => fetch('data/' + p).then((r) => { if (!r.ok) throw new Error(p + ' ' + r.status); return json ? r.json() : r.text(); });

  let D;
  try {
    const [zones, cx, sc, oc, cm, ln, st, rq, zg, lg, wg, rg, lrg, pg] = await Promise.all([
      get('zones.csv'), get('complexes.csv'), get('schools.csv'), get('school_outcomes.csv'), get('complex_school_map.csv'),
      get('lines.csv'), get('stations.csv'), get('change_requests_seed.csv'),
      get('zones.geojson', 1), get('lines.geojson', 1), get('base_waterways.geojson', 1), get('base_roads.geojson', 1),
      get('base_local_roads.geojson', 1), get('base_parks.geojson', 1),
    ]);
    D = { zones: parseCSV(zones), complexes: parseCSV(cx), schools: parseCSV(sc), outcomes: parseCSV(oc), cmap: parseCSV(cm),
      lines: parseCSV(ln), stations: parseCSV(st), seedReq: parseCSV(rq), zg, lg, wg, rg, lrg, pg };
  } catch (e) {
    document.body.insertAdjacentHTML('beforeend', `<div class="err"><div><b>데이터를 불러오지 못했습니다</b><br><span class="fine">${esc(e.message)}</span></div></div>`);
    return;
  }
  D.complexes.forEach((c) => { c.lat = +c.lat; c.lng = +c.lng; c.households = +c.households; c.built_year = +c.built_year; c.price_manwon = +c.price_manwon; });
  D.schools.forEach((s) => { s.lat = +s.lat; s.lng = +s.lng; s.students = +s.students; });
  D.zones.forEach((z) => { z.label_lat = +z.label_lat; z.label_lng = +z.label_lng; });
  const zoneIdx = Object.fromEntries(D.zones.map((z, i) => [z.zone_id, i]));
  const zoneBy = Object.fromEntries(D.zones.map((z) => [z.zone_id, z]));
  const cBy = Object.fromEntries(D.complexes.map((c) => [c.complex_id, c]));
  const sBy = Object.fromEntries(D.schools.map((s) => [s.school_id, s]));
  const lineBy = Object.fromEntries(D.lines.map((l) => [l.line_id, l]));
  D.zg.features.forEach((f) => { f.properties.z = zoneIdx[f.properties.zone_id] ?? 0; });
  D.lg.features.forEach((f) => {
    const m = lineBy[f.properties.line_id] || {};
    f.properties.color = m.color || '#888';
    f.properties.sgroup = m.status === '운행' ? 'open' : m.status === '공사중' ? 'build' : 'plan';
  });

  /* ───────── 포맷터 ───────── */
  const fmtEok = (m) => (Math.round(m / 1000) / 10).toFixed(1).replace(/\.0$/, '') + '억';
  const fmtFull = (m) => { const e = Math.floor(m / 10000), r = m % 10000; return `${e}억${r ? ' ' + r.toLocaleString('ko-KR') + '만' : ''}`; };
  const pct = (v) => (Math.round(v * 1000) / 10).toFixed(1) + '%';

  /* ───────── 점수 / 대장 / 학교 지표 ───────── */
  const W = { price: 0.30, hh: 0.25, fresh: 0.20, school: 0.25 };
  const prices = D.complexes.map((c) => c.price_manwon), years = D.complexes.map((c) => c.built_year);
  const pMin = Math.min(...prices), pMax = Math.max(...prices), yMin = Math.min(...years), yMax = Math.max(...years);
  const hhMax = Math.max(...D.complexes.map((c) => c.households));
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  function elemWalk(c) {
    const r = D.cmap.filter((m) => m.complex_id === c.complex_id && m.relation === '배정' && m.walk_min !== '')
      .map((m) => +m.walk_min);
    return r.length ? Math.min(...r) : null;
  }
  D.complexes.forEach((c) => {
    const w = elemWalk(c); c.walk = w;
    c.parts = {
      price: clamp01((c.price_manwon - pMin) / (pMax - pMin || 1)),
      hh: clamp01(c.households / hhMax),
      fresh: clamp01((c.built_year - yMin) / (yMax - yMin || 1)),
      school: w == null ? 0 : clamp01(1 - (w - 3) / 12),
    };
    c.score = 100 * (W.price * c.parts.price + W.hh * c.parts.hh + W.fresh * c.parts.fresh + W.school * c.parts.school);
  });

  function outcomeOf(s) {
    const rows = D.outcomes.filter((o) => o.school_id === s.school_id);
    if (!rows.length) return null;
    const year = Math.max(...rows.map((o) => +o.year));
    const v = (k) => { const r = rows.find((o) => +o.year === year && o.metric === k); return r ? +r.value : 0; };
    const grads = v('졸업생수');
    if (!grads) return null;
    if (s.level === '중') { const n = v('특목고_진학자수') + v('자사고_진학자수'); return { year, label: '특목·자사고', n, grads, rate: n / grads }; }
    if (s.level === '고') { const n = v('주요대_진학자수'); return { year, label: '주요대 진학', n, grads, rate: n / grads }; }
    return null;
  }
  D.schools.forEach((s) => { s.out = outcomeOf(s); });

  /* ───────── 반영 요청(투표) — 시연용, 브라우저에만 저장 ───────── */
  const LS = 'wirye_req_v1';
  const loadLS = () => { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { return null; } };
  const saveLS = () => { try { localStorage.setItem(LS, JSON.stringify(reqs)); } catch (e) { /* 저장 불가 환경에서는 메모리만 사용 */ } };
  let reqs = loadLS() || D.seedReq.map((r) => ({ ...r, votes_for: +r.votes_for, votes_needed: +r.votes_needed, mine: false, applied_at: 0 }));

  const leaderId = {}, leaderSrc = {};
  function computeLeaders() {
    D.zones.forEach((z) => {
      const cs = D.complexes.filter((c) => c.zone_id === z.zone_id);
      const applied = reqs.filter((r) => r.status === '반영됨' && r.field === 'is_leader' && cBy[r.target_id]?.zone_id === z.zone_id)
        .sort((a, b) => b.applied_at - a.applied_at)[0];
      const manual = cs.find((c) => c.is_leader_manual === '1');
      const top = cs.slice().sort((a, b) => b.score - a.score)[0];
      if (applied) { leaderId[z.zone_id] = applied.target_id; leaderSrc[z.zone_id] = 'vote'; }
      else if (manual) { leaderId[z.zone_id] = manual.complex_id; leaderSrc[z.zone_id] = 'manual'; }
      else { leaderId[z.zone_id] = top.complex_id; leaderSrc[z.zone_id] = 'score'; }
    });
  }
  computeLeaders();
  const isLeader = (c) => leaderId[c.zone_id] === c.complex_id;
  const srcText = { vote: '주민 투표 반영', manual: '운영자 직접 지정', score: '점수 1위(자동)' };

  /* ───────── 지도 스타일 ───────── */
  const css = () => getComputedStyle(document.documentElement);
  function mapColors() {
    const g = (n) => css().getPropertyValue(n).trim();
    return { land: g('--m-land'), hill: g('--m-hill'), park: g('--m-park'), water: g('--m-water'), road: g('--m-road'), roadcase: g('--m-roadcase'),
      major: g('--m-major'), majorcase: g('--m-majorcase'), block: g('--m-block'), linecase: g('--m-linecase'),
      leader: g('--leader'), z: [g('--north'), g('--south')] };
  }
  const zExpr = (c) => ['match', ['get', 'z'], 0, c.z[0], 1, c.z[1], c.z[0]];
  const widthZ = (...stops) => ['interpolate', ['exponential', 1.6], ['zoom'], ...stops];

  function blocksGj() {
    return { type: 'FeatureCollection', features: D.complexes.map((c) => {
      const w = 0.0006, h = 0.00045;
      return { type: 'Feature', properties: { id: c.complex_id, z: zoneIdx[c.zone_id], leader: isLeader(c) ? 1 : 0 },
        geometry: { type: 'Polygon', coordinates: [[[c.lng - w, c.lat - h], [c.lng + w, c.lat - h], [c.lng + w, c.lat + h], [c.lng - w, c.lat + h], [c.lng - w, c.lat - h]]] } };
    }) };
  }

  function buildStyle(c) {
    const rk = (n) => ['==', ['get', 'rank'], n];
    const cls = (n) => ['==', ['get', 'cls'], n];
    return {
      version: 8,
      sources: {
        parks: { type: 'geojson', data: D.pg }, water: { type: 'geojson', data: D.wg }, roads: { type: 'geojson', data: D.rg },
        local: { type: 'geojson', data: D.lrg }, zones: { type: 'geojson', data: D.zg }, lines: { type: 'geojson', data: D.lg },
        blocks: { type: 'geojson', data: blocksGj() },
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': c.land } },
        { id: 'hill', type: 'fill', source: 'parks', filter: ['==', ['get', 'kind'], 'hill'], paint: { 'fill-color': c.hill } },
        { id: 'park', type: 'fill', source: 'parks', filter: ['==', ['get', 'kind'], 'park'], paint: { 'fill-color': c.park } },
        { id: 'zone-fill', type: 'fill', source: 'zones', paint: { 'fill-color': zExpr(c), 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.14, 16, 0.05] } },
        { id: 'w3', type: 'line', source: 'water', minzoom: 14.2, filter: rk(3), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.water, 'line-width': widthZ(14, 1.2, 17, 6) } },
        { id: 'w2', type: 'line', source: 'water', minzoom: 11.5, filter: rk(2), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.water, 'line-width': widthZ(12, 1.4, 14, 3.6, 17, 14) } },
        { id: 'w1', type: 'line', source: 'water', filter: rk(1), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.water, 'line-width': widthZ(11, 2.2, 14, 8, 17, 30) } },
        { id: 'r-local-case', type: 'line', source: 'local', minzoom: 15, filter: cls('local'), paint: { 'line-color': c.roadcase, 'line-width': widthZ(15, 2.4, 18, 12) } },
        { id: 'r-local', type: 'line', source: 'local', minzoom: 15, filter: cls('local'), paint: { 'line-color': c.road, 'line-width': widthZ(15, 1.4, 18, 9) } },
        { id: 'r-sub-case', type: 'line', source: 'local', minzoom: 13.5, filter: cls('sub'), paint: { 'line-color': c.roadcase, 'line-width': widthZ(13.5, 2.2, 18, 15) } },
        { id: 'r-sub', type: 'line', source: 'local', minzoom: 13.5, filter: cls('sub'), paint: { 'line-color': c.road, 'line-width': widthZ(13.5, 1.2, 18, 12) } },
        { id: 'r-major-case', type: 'line', source: 'roads', paint: { 'line-color': c.majorcase, 'line-width': widthZ(11, 2.8, 14, 6.5, 18, 24) } },
        { id: 'r-major', type: 'line', source: 'roads', paint: { 'line-color': c.major, 'line-width': widthZ(11, 1.6, 14, 4.4, 18, 20) } },
        { id: 'zone-line', type: 'line', source: 'zones', paint: { 'line-color': zExpr(c), 'line-width': 2, 'line-opacity': 0.9 } },
        { id: 'tr-case', type: 'line', source: 'lines', filter: ['==', ['get', 'sgroup'], 'open'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.linecase, 'line-width': widthZ(11, 3.5, 17, 11) } },
        { id: 'tr-open', type: 'line', source: 'lines', filter: ['==', ['get', 'sgroup'], 'open'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': widthZ(11, 2, 17, 6) } },
        { id: 'tr-build', type: 'line', source: 'lines', filter: ['==', ['get', 'sgroup'], 'build'], layout: { 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': widthZ(11, 2.4, 17, 6), 'line-dasharray': [3, 1.4] } },
        { id: 'tr-plan', type: 'line', source: 'lines', filter: ['==', ['get', 'sgroup'], 'plan'], layout: { 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': widthZ(11, 2.4, 17, 6), 'line-dasharray': [1, 1.6], 'line-opacity': 0.9 } },
        { id: 'blk-fill', type: 'fill', source: 'blocks', minzoom: 14.8, paint: {
          'fill-color': ['case', ['==', ['get', 'leader'], 1], c.leader, zExpr(c)],
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14.8, 0, 16, 0.38] } },
        { id: 'blk-line', type: 'line', source: 'blocks', minzoom: 14.8, paint: {
          'line-color': ['case', ['==', ['get', 'leader'], 1], c.leader, zExpr(c)], 'line-width': 1.6,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 14.8, 0, 16, 1] } },
      ],
    };
  }
  const TR_LAYERS = ['tr-case', 'tr-open', 'tr-build', 'tr-plan'];
  const ZONE_LAYERS = ['zone-fill', 'zone-line'];

  /* ───────── 지도 / 마커 ───────── */
  const mapEl = $('#map');
  const map = new maplibregl.Map({
    container: 'map', style: buildStyle(mapColors()), center: [127.149, 37.4725], zoom: 13.4, minZoom: 11, maxZoom: 18.5,
    attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false,
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: '샘플 데이터 · 실제 지형 아님' }));
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  const state = { sel: null, gf: 'all', layers: { zones: true, pins: true, schools: true, lines: true } };
  let markers = [];

  function mk(el, lng, lat, anchor) {
    const m = new maplibregl.Marker({ element: el, anchor: anchor || 'center' }).setLngLat([lng, lat]).addTo(map);
    markers.push(m); return m;
  }
  const fixedMarkers = [];
  function addFixed(el, lng, lat, anchor) {
    const m = new maplibregl.Marker({ element: el, anchor: anchor || 'center' }).setLngLat([lng, lat]).addTo(map);
    fixedMarkers.push(m); return m;
  }

  function renderStatic() {
    // 영역 이름 (줌아웃 시)
    D.zones.forEach((z, i) => {
      const el = document.createElement('div'); el.className = 'zlabel zi' + i; el.dataset.zone = z.zone_id;
      addFixed(el, z.label_lng, z.label_lat);
    });
    // 하천 이름
    D.wg.features.forEach((f) => {
      const co = f.geometry.coordinates, p = co[Math.floor(co.length / 2)];
      const el = document.createElement('div'); el.className = 'wlabel ' + (f.properties.rank === 3 ? 'r3' : 'r12');
      el.textContent = f.properties.name.replace(/\(샘플\)/, '');
      addFixed(el, p[0], p[1]);
    });
    // 역 (이름이 같은 역은 한 점으로 합친다)
    const byName = {};
    D.stations.forEach((s) => { (byName[s.name] ||= []).push(s); });
    Object.values(byName).forEach((arr) => {
      const s = arr[0], first = lineBy[s.line_id];
      const el = document.createElement('div'); el.className = 'st'; el.style.setProperty('--c', first?.color || '#777');
      const names = arr.map((a) => lineBy[a.line_id]?.name).filter(Boolean).join(' · ');
      el.title = `${s.name}역 (${names})`;
      const nm = document.createElement('span'); nm.className = 'st-name'; nm.textContent = s.name; el.appendChild(nm);
      addFixed(el, +s.lng, +s.lat);
    });
    // 학교
    D.schools.forEach((s) => {
      const el = document.createElement('button'); el.className = 'school'; el.dataset.g = s.gender_type; el.dataset.id = s.school_id;
      el.setAttribute('aria-label', `${s.name} (${s.gender_type})`);
      el.innerHTML = `${esc(s.level)}<span class="school-name">${esc(s.name)}</span>`;
      el.addEventListener('click', (e) => { e.stopPropagation(); selectSchool(s.school_id); });
      addFixed(el, s.lng, s.lat);
    });
  }

  function renderDynamic() {
    markers.forEach((m) => m.remove()); markers = [];
    D.complexes.forEach((c) => {
      const lead = isLeader(c);
      const el = document.createElement('button');
      el.className = `pin ${zoneIdx[c.zone_id] === 1 ? 'south' : 'north'}${lead ? ' leader' : ''}${state.sel === 'c:' + c.complex_id ? ' sel' : ''}`;
      el.dataset.id = c.complex_id;
      el.setAttribute('aria-label', `${c.name} ${fmtFull(c.price_manwon)}${lead ? ' 대장' : ''}`);
      el.innerHTML = `<span class="pin-price">${lead ? '★ ' : ''}${fmtEok(c.price_manwon)}</span><span class="pin-name">${esc(c.name)}</span>`;
      el.addEventListener('click', (e) => { e.stopPropagation(); selectComplex(c.complex_id); });
      mk(el, c.lng, c.lat, 'bottom');
    });
    D.zones.forEach((z) => {
      const lead = cBy[leaderId[z.zone_id]];
      const el = $(`.zlabel[data-zone="${z.zone_id}"]`);
      if (el && lead) el.innerHTML = `<b>${esc(z.name)}</b><span>★ ${esc(lead.name.replace(/^.{3}\s?/, ''))} ${fmtEok(lead.price_manwon)}</span>`;
    });
    const src = map.getSource('blocks'); if (src) src.setData(blocksGj());
  }

  function syncZoomClasses() {
    const z = map.getZoom();
    [['g130', 13], ['g140', 14], ['g145', 14.5], ['g150', 15], ['g155', 15.5], ['g160', 16]].forEach(([k, t]) => mapEl.classList.toggle(k, z >= t));
    mapEl.classList.toggle('zout', z < 14);
    $('.app').classList.toggle('g150', z >= 15);
  }
  function syncToggles() {
    mapEl.classList.toggle('hide-pins', !state.layers.pins);
    mapEl.classList.toggle('hide-schools', !state.layers.schools);
    mapEl.classList.toggle('hide-lines', !state.layers.lines);
    mapEl.classList.toggle('hide-zones', !state.layers.zones);
    mapEl.dataset.gf = state.gf;
    if (!map.isStyleLoaded()) return;
    TR_LAYERS.forEach((id) => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', state.layers.lines ? 'visible' : 'none'));
    ZONE_LAYERS.forEach((id) => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', state.layers.zones ? 'visible' : 'none'));
  }

  renderStatic(); renderDynamic(); syncZoomClasses(); syncToggles();
  map.on('zoom', syncZoomClasses);
  map.on('styledata', () => { if (map.isStyleLoaded()) syncToggles(); });

  // 영역 클릭 / 커서
  map.on('click', 'zone-fill', (e) => {
    if (map.getZoom() >= 15) return;
    const f = e.features && e.features[0]; if (f) selectZone(f.properties.zone_id);
  });
  map.on('mouseenter', 'zone-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'zone-fill', () => { map.getCanvas().style.cursor = ''; });

  // 테마(라이트/다크) 변경 시 지도 색을 다시 입힌다
  let themeTimer = 0;
  function onTheme() { clearTimeout(themeTimer); themeTimer = setTimeout(() => map.setStyle(buildStyle(mapColors())), 60); }
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onTheme);

  /* ───────── 필터바 ───────── */
  function bindChip(id, key) {
    const b = $(id); b.addEventListener('click', () => {
      state.layers[key] = !state.layers[key]; b.setAttribute('aria-pressed', String(state.layers[key])); syncToggles();
    });
  }
  bindChip('#t-zones', 'zones'); bindChip('#t-pins', 'pins'); bindChip('#t-schools', 'schools'); bindChip('#t-lines', 'lines');
  document.querySelectorAll('#gf button').forEach((b) => b.addEventListener('click', () => {
    state.gf = b.dataset.v;
    document.querySelectorAll('#gf button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (!state.layers.schools) { state.layers.schools = true; $('#t-schools').setAttribute('aria-pressed', 'true'); }
    syncToggles();
  }));

  /* ───────── 상세 패널 ───────── */
  const panel = $('#panel'), pBody = $('#panel-body'), pTitle = $('#panel-title'), pEye = $('#panel-eyebrow');
  const app = $('.app');
  function openPanel() { panel.hidden = false; app.classList.add('has-panel'); setTimeout(() => map.resize(), 0); }
  function closePanel() { panel.hidden = true; app.classList.remove('has-panel'); state.sel = null; renderDynamic(); markSchoolSel(); }
  $('#panel-close').addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) closePanel(); });

  const zoneTag = (zid) => `<span class="tag ${zoneIdx[zid] === 1 ? 'south' : 'north'}">${esc(zoneBy[zid].name)}</span>`;
  const genderTag = (g) => `<span class="tag g-${esc(g)}">${esc(g === '공학' ? '남녀공학' : g + '학교')}</span>`;
  function markSchoolSel() { document.querySelectorAll('.school').forEach((el) => el.classList.toggle('sel', state.sel === 's:' + el.dataset.id)); }

  function selectComplex(id) {
    const c = cBy[id]; state.sel = 'c:' + id; renderDynamic(); markSchoolSel();
    map.easeTo({ center: [c.lng, c.lat], zoom: Math.max(map.getZoom(), 15.6), duration: 500, offset: window.innerWidth >= 720 ? [-190, 0] : [0, -120] });
    const lead = isLeader(c), mine = D.cmap.filter((m) => m.complex_id === id);
    const req = reqs.find((r) => r.target_id === id && r.field === 'is_leader' && r.status === '투표중');
    const rows = mine.map((m) => {
      const s = sBy[m.school_id];
      const sub = m.relation === '배정' ? `배정 초등학교 · 도보 ${m.walk_min}분` : `${esc(s.level)}학교 · ${esc(m.relation)}`;
      const oc = s.out ? `<div class="val num">${pct(s.out.rate)}<div class="fine">${esc(s.out.label)}</div></div>` : '';
      return `<button class="row" data-school="${esc(s.school_id)}"><span class="grow"><div class="nm">${esc(s.name)}</div><div class="sub">${sub}</div></span>${genderTag(s.gender_type)}${oc}</button>`;
    }).join('');
    const bars = [['가격', 'price'], ['세대수', 'hh'], ['신축', 'fresh'], ['초등 접근', 'school']].map(([l, k]) =>
      `<div class="score-row"><span>${l}</span><div class="bar"><i style="width:${Math.round(c.parts[k] * 100)}%"></i></div><span class="num">${Math.round(c.parts[k] * 100)}</span></div>`).join('');

    pEye.innerHTML = `${zoneTag(c.zone_id)}${lead ? '<span class="tag leader">★ 대장</span>' : ''}`;
    pTitle.textContent = c.name;
    pBody.innerHTML = `
      <div><div class="price-big num">${fmtFull(c.price_manwon)}<small>전용 ${c.main_area_m2}㎡ · ${esc(c.price_date)}</small></div>
        <div class="fine">샘플 가격입니다. 실제 서비스에서는 국토부 실거래가로 채웁니다.</div></div>
      <dl class="kv">
        <div><dt>세대수</dt><dd class="num">${c.households.toLocaleString('ko-KR')}세대</dd></div>
        <div><dt>준공</dt><dd class="num">${c.built_year}년</dd></div>
        <div><dt>초등학교 도보</dt><dd class="num">${c.walk == null ? '-' : c.walk + '분'}</dd></div>
        <div><dt>대장 점수</dt><dd class="num">${c.score.toFixed(1)}점</dd></div>
      </dl>
      <section><h3>대장 점수 구성 (영역 안에서 비교)</h3><div class="score">${bars}</div>
        <div class="fine" style="margin-top:6px">가격 ${W.price * 100}% · 세대수 ${W.hh * 100}% · 신축 ${W.fresh * 100}% · 초등 접근 ${W.school * 100}%</div></section>
      <section><h3>연결 학교</h3><div class="list">${rows}</div></section>
      ${voteBox(c, lead, req)}`;
    bindPanel(); openPanel();
  }

  function voteBox(c, lead, req) {
    const z = zoneBy[c.zone_id];
    const applied = reqs.filter((r) => r.status === '반영됨' && cBy[r.target_id]?.zone_id === c.zone_id);
    const log = applied.length ? `<ul class="log">${applied.map((r) => `<li>${esc(cBy[r.target_id].name)} 대장 반영 (찬성 ${r.votes_for}표)</li>`).join('')}</ul>` : '';
    let body;
    if (lead) body = `<p><b>${esc(z.name)} 현재 대장입니다.</b> <span class="fine">(${srcText[leaderSrc[c.zone_id]]})</span></p>`;
    else if (req) {
      const p = Math.min(100, Math.round(req.votes_for / req.votes_needed * 100));
      body = `<p><b>“${esc(c.name)}을(를) ${esc(z.name)} 대장으로 바꿔 주세요”</b></p>
        <p class="fine">${esc(req.reason)}</p>
        <div class="progress" role="progressbar" aria-valuenow="${req.votes_for}" aria-valuemin="0" aria-valuemax="${req.votes_needed}"><i style="width:${p}%"></i></div>
        <div class="fine num">찬성 ${req.votes_for} / ${req.votes_needed}표 · 채워지면 지도에 반영됩니다</div>
        <button class="btn" id="b-vote" data-req="${esc(req.request_id)}" ${req.mine ? 'disabled' : ''}>${req.mine ? '찬성했습니다' : '찬성하기'}</button>`;
    } else body = `<p>${esc(z.name)} 대장은 <b>${esc(cBy[leaderId[c.zone_id]].name)}</b>입니다. 이 단지가 더 맞다고 생각하면 반영을 요청하세요.</p>
        <button class="btn ghost" id="b-new">이 단지를 대장으로 제안하기</button>`;
    return `<section><h3>학부모 의견</h3><div class="vote">${body}${log}
      <div class="fine">시연용입니다. 로그인 없이 이 브라우저에만 저장되고, 실제 서비스에서는 로그인한 사용자의 표만 집계합니다.
      <button class="back" id="b-reset">시연 초기화</button></div></div></section>`;
  }

  function bindPanel() {
    pBody.querySelectorAll('[data-school]').forEach((b) => b.addEventListener('click', () => selectSchool(b.dataset.school)));
    pBody.querySelectorAll('[data-complex]').forEach((b) => b.addEventListener('click', () => selectComplex(b.dataset.complex)));
    pBody.querySelectorAll('[data-zone]').forEach((b) => b.addEventListener('click', () => selectZone(b.dataset.zone)));
    const nv = $('#b-new', pBody), vt = $('#b-vote', pBody), rs = $('#b-reset', pBody);
    const cur = state.sel && state.sel.startsWith('c:') ? state.sel.slice(2) : null;
    if (nv && cur) nv.addEventListener('click', () => {
      reqs.push({ request_id: 'r_' + Date.now(), target_type: 'complex', target_id: cur, field: 'is_leader', proposed_value: '1',
        reason: '학부모 제안으로 접수된 요청입니다.', votes_for: 1, votes_needed: 3, status: '투표중', mine: true, applied_at: 0 });
      saveLS(); toast('반영 요청이 접수되었습니다'); selectComplex(cur);
    });
    if (vt && cur) vt.addEventListener('click', () => {
      const r = reqs.find((x) => x.request_id === vt.dataset.req); if (!r || r.mine) return;
      r.votes_for += 1; r.mine = true;
      if (r.votes_for >= r.votes_needed) { r.status = '반영됨'; r.applied_at = Date.now(); computeLeaders(); renderDynamic(); toast(`${cBy[r.target_id].name}이(가) ${zoneBy[cBy[r.target_id].zone_id].name} 대장으로 반영되었습니다`); }
      else toast('찬성 1표가 접수되었습니다');
      saveLS(); selectComplex(cur);
    });
    if (rs) rs.addEventListener('click', () => {
      try { localStorage.removeItem(LS); } catch (e) { /* 무시 */ }
      reqs = D.seedReq.map((r) => ({ ...r, votes_for: +r.votes_for, votes_needed: +r.votes_needed, mine: false, applied_at: 0 }));
      computeLeaders(); renderDynamic(); toast('시연 데이터를 처음 상태로 되돌렸습니다');
      if (cur) selectComplex(cur); else closePanel();
    });
  }

  function selectSchool(id) {
    const s = sBy[id]; state.sel = 's:' + id; renderDynamic(); markSchoolSel();
    map.easeTo({ center: [s.lng, s.lat], zoom: Math.max(map.getZoom(), 15.4), duration: 500, offset: window.innerWidth >= 720 ? [-190, 0] : [0, -120] });
    const linked = D.cmap.filter((m) => m.school_id === id).map((m) => ({ m, c: cBy[m.complex_id] }));
    const o = s.out;
    pEye.innerHTML = `${zoneTag(s.zone_id)}${genderTag(s.gender_type)}<span class="tag plain">${esc(s.found_type)}</span>`;
    pTitle.textContent = s.name;
    pBody.innerHTML = `
      <dl class="kv">
        <div><dt>학교급</dt><dd>${esc(s.level)}등학교</dd></div>
        <div><dt>학생 수</dt><dd class="num">${s.students.toLocaleString('ko-KR')}명</dd></div>
      </dl>
      <section><h3>진학 지표 (샘플)</h3>${o ? `<div class="price-big num">${pct(o.rate)}<small>${esc(o.label)} · ${o.n}/${o.grads}명 · ${o.year}</small></div>
        <div class="fine">실제 서비스에서는 학교알리미 공시 값과 출처 링크를 붙입니다.</div>` : '<div class="fine">초등학교는 진학 지표를 표시하지 않습니다.</div>'}</section>
      <section><h3>이 학교와 연결된 단지</h3><div class="list">${linked.map(({ m, c }) =>
        `<button class="row" data-complex="${esc(c.complex_id)}"><span class="grow"><div class="nm">${esc(c.name)}</div><div class="sub">${esc(m.relation)}${m.walk_min ? ' · 도보 ' + m.walk_min + '분' : ''}</div></span><span class="val num">${fmtEok(c.price_manwon)}</span></button>`).join('')}</div></section>`;
    bindPanel(); openPanel();
  }

  function selectZone(zid) {
    const z = zoneBy[zid]; state.sel = 'z:' + zid; renderDynamic(); markSchoolSel();
    const cs = D.complexes.filter((c) => c.zone_id === zid).sort((a, b) => b.price_manwon - a.price_manwon);
    const lead = cBy[leaderId[zid]];
    const avg = Math.round(cs.reduce((a, c) => a + c.price_manwon, 0) / cs.length);
    const col = (g, title) => {
      const list = D.schools.filter((s) => s.zone_id === zid && s.level !== '초' && (s.gender_type === g || s.gender_type === '공학'))
        .sort((a, b) => (b.out?.rate ?? -1) - (a.out?.rate ?? -1));
      return `<div class="col"><h4>${title}</h4><div class="mini">${list.map((s) =>
        `<div class="it"><div class="nm">${esc(s.name)} ${genderTag(s.gender_type)}</div><div class="fine">${esc(s.level)} · ${s.out ? `${esc(s.out.label)} <span class="rate num">${pct(s.out.rate)}</span>` : '지표 없음'}</div></div>`).join('') || '<div class="fine">해당 학교 없음</div>'}</div></div>`;
    };
    pEye.innerHTML = zoneTag(zid);
    pTitle.textContent = z.name;
    pBody.innerHTML = `
      <p style="margin:0">${esc(z.description)}</p>
      <section><h3>대장 아파트 <span class="fine">(${srcText[leaderSrc[zid]]})</span></h3>
        <button class="row" data-complex="${esc(lead.complex_id)}"><span class="grow"><div class="nm">★ ${esc(lead.name)}</div><div class="sub">${lead.households.toLocaleString('ko-KR')}세대 · ${lead.built_year}년</div></span><span class="val num">${fmtFull(lead.price_manwon)}</span></button></section>
      <section><h3>학군 — 학생 성별로 보기</h3><div class="cols">${col('남', '남학생')}${col('여', '여학생')}</div>
        <div class="fine" style="margin-top:6px">각 열은 해당 성별 학교와 남녀공학 중·고교를 모았고, 진학 지표 순으로 정렬합니다.</div></section>
      <section><h3>단지 (${cs.length}) · 평균 ${fmtEok(avg)}</h3><div class="list">${cs.map((c) =>
        `<button class="row" data-complex="${esc(c.complex_id)}"><span class="grow"><div class="nm">${isLeader(c) ? '★ ' : ''}${esc(c.name)}</div><div class="sub">${c.households.toLocaleString('ko-KR')}세대 · ${c.built_year}년</div></span><span class="val num">${fmtEok(c.price_manwon)}</span></button>`).join('')}</div></section>`;
    bindPanel(); openPanel();
    const b = D.zg.features.find((f) => f.properties.zone_id === zid).geometry.coordinates[0];
    const xs = b.map((p) => p[0]), ys = b.map((p) => p[1]);
    map.fitBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], { padding: window.innerWidth >= 720 ? { top: 90, bottom: 60, left: 60, right: 440 } : { top: 130, bottom: 340, left: 30, right: 30 }, duration: 600, maxZoom: 15 });
  }

  let tt = 0;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600); }

  // 테스트와 디버깅용 훅
  window.__wirye = { map, selectComplex, selectSchool, selectZone, state };
})();
