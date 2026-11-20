import { GIGS, TIME_OPTIONS, SKILL_OPTIONS } from '../data/gigs.js';
import { storage, openLink, track } from './platform.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = {
  time: storage.get('time', null),
  skills: new Set(storage.get('skills', [])),
  saved: new Set(storage.get('saved', [])),
  tab: 'home',
  cat: null,
};

// ── 추천 로직 ───────────────────────────────────────────
function score(g) {
  let s = 0; const why = [];
  if (state.time && g.time.includes(state.time)) { s += 2; why.push('지금 시간에 맞음'); }
  const hit = [...state.skills].filter((k) => g.skills.includes(k) || (k === 'phone' && g.skills.includes('phone')));
  hit.forEach((k) => { s += 2; why.push(SKILL_OPTIONS.find((o) => o.id === k).short); });
  if (g.difficulty === 1) s += 0.5;
  return { s, why };
}
const hasFilter = () => state.time || state.skills.size;

// ── 렌더링 ──────────────────────────────────────────────
function chip(o, active, kind) {
  return `<button class="chip${active ? ' on' : ''}" data-kind="${kind}" data-id="${o.id}" aria-pressed="${active}">
    ${esc(o.label)}</button>`;
}

function logo(g, big) {
  const c = `logo${big ? ' big' : ''}`;
  const tile = esc(g.name.replace(/[^A-Za-z0-9가-힣]/g, '')[0] || '?');
  return `<div class="${c}" style="--c:${g.color}">${g.logo ? `<img src="${esc(g.logo)}" alt="" loading="lazy" onerror="this.remove()">` : ''}<span>${tile}</span></div>`;
}

function timeLabel(g) {
  const m = Math.min(...g.time.map(Number));
  return m >= 60 ? '1시간 이상' : `${m}분 이상`;
}

function card(g, why = []) {
  const saved = state.saved.has(g.id);
  return `<article class="card" data-open="${g.id}" tabindex="0" role="button" aria-label="${esc(g.name)} 자세히 보기">
    ${logo(g)}
    <div class="card-body">
      <div class="card-top"><h3>${esc(g.name)}</h3><span class="tag">${esc(g.category)}</span></div>
      <p>${esc(g.doWhat)}</p>
      ${g.headline ? `<div class="hl">${esc(g.headline)}</div>` : ''}
      ${g.alert ? `<div class="warn">${esc(g.alert)}</div>` : ''}
      ${why.length ? `<div class="why">${why.map(esc).join(' · ')}</div>` : ''}
    </div>
    <button class="heart${saved ? ' on' : ''}" data-save="${g.id}" aria-label="${saved ? '저장 취소' : '저장'}">${saved ? '저장됨' : '저장'}</button>
  </article>`;
}

function renderHome() {
  const cats = [...new Set(GIGS.map((g) => g.category))];
  const ranked = GIGS.filter((g) => !state.cat || g.category === state.cat).map((g) => ({ g, ...score(g) })).sort((a, b) => b.s - a.s);
  const filtered = hasFilter();
  $('#view').innerHTML = `
    <section class="hero">
      <h1>시간 날 때 하는<br><em>온라인 부업</em> 모음</h1>
    </section>
    <section class="picker" aria-label="내 상황 선택">
      <h2>한 번에 얼마나 낼 수 있어요?</h2>
      <div class="chips">${TIME_OPTIONS.map((o) => chip(o, state.time === o.id, 'time')).join('')}</div>
      <h2>가진 게 있다면 <small>여러 개 골라도 돼요</small></h2>
      <div class="chips">${SKILL_OPTIONS.map((o) => chip(o, state.skills.has(o.id), 'skill')).join('')}</div>
    </section>
    <section>
      <div class="chips cats">${[{ id: 'all', label: '전체' }, ...cats.map((c) => ({ id: c, label: c }))].map((o) => chip(o, (state.cat || 'all') === o.id, 'cat')).join('')}</div>
      <div class="list-head"><h2>${filtered ? '내 조건에 맞는 순서' : '전체'} <b>${ranked.length}</b></h2>
        ${filtered ? '<button class="link" id="reset">초기화</button>' : ''}</div>
      <div class="list">${ranked.map(({ g, s, why }) => card(g, filtered && s > 0.5 ? why : [])).join('')}</div>
    </section>
    <p class="notice">수익은 사람마다 다르고 보장되지 않아요. 가입 전에 각 사이트의 최신 조건을 꼭 확인하세요.</p>`;
}

function renderSaved() {
  const list = GIGS.filter((g) => state.saved.has(g.id));
  $('#view').innerHTML = `<section class="hero small"><h1>저장한 부업</h1></section>
    ${list.length ? `<div class="list">${list.map((g) => card(g)).join('')}</div>`
      : `<div class="empty"><p>저장해 둔 부업이 없어요.</p><button class="btn" data-tab="home">둘러보러 가기</button></div>`}`;
}

function render() {
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
  state.tab === 'saved' ? renderSaved() : renderHome();
}

// ── 상세 (바텀시트) ─────────────────────────────────────
function openDetail(id, push = true) {
  const g = GIGS.find((x) => x.id === id); if (!g) return;
  track('ViewGig', { gig: id });
  const saved = state.saved.has(id);
  const href = g.url || 'https://www.google.com/search?q=' + encodeURIComponent(g.name + ' 부업');
  $('#sheet').innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true" aria-label="${esc(g.name)}">
    <button class="close" data-close aria-label="닫기">닫기</button>
    <div class="sheet-head">${logo(g, true)}
      <div><span class="tag">${esc(g.category)}</span><h2>${esc(g.name)}</h2></div></div>
    <p class="lead">${esc(g.doWhat)}</p>
    ${g.headline ? `<div class="hl big">${esc(g.headline)}</div>` : ''}
    ${g.alert ? `<div class="warn">${esc(g.alert)}</div>` : ''}
    <div class="rows">${g.rows.map((r) => `<section class="row"><h3>${esc(r.k)}</h3><p>${esc(r.v)}</p></section>`).join('')}</div>
    ${g.example ? `<div class="eg"><b>예를 들면</b>${esc(g.example)}</div>` : ''}
    ${g.note ? `<p class="notice">${esc(g.note)}</p>` : ''}
    <div class="srcs"><h3>출처 · ${esc(g.checked)} 확인</h3><ul class="plain">${g.sources.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)}</a></li>`).join('')}</ul>
      <p class="notice">조건은 바뀔 수 있어요. 가입 전에 공식 사이트를 한 번 더 확인하세요.</p></div>
    <div class="cta-row">
      <button class="btn ghost" data-save="${g.id}">${saved ? '저장됨' : '저장'}</button>
      <a class="btn" data-go="${g.id}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">공식 사이트 가기</a>
    </div></div>`;
  $('#sheet').classList.add('open');
  document.body.classList.add('lock');
  if (push) history.pushState({ gig: id }, '', `#/${id}`);
}
function closeDetail(back = true) {
  $('#sheet').classList.remove('open'); document.body.classList.remove('lock');
  if (back && location.hash.startsWith('#/')) history.back();
}

// ── 이벤트 ─────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const t = e.target;
  const chipEl = t.closest('.chip');
  if (chipEl) {
    const { kind, id } = chipEl.dataset;
    if (kind === 'cat') { state.cat = id === 'all' ? null : id; return render(); }
    if (kind === 'time') state.time = state.time === id ? null : id;
    else state.skills.has(id) ? state.skills.delete(id) : state.skills.add(id);
    storage.set('time', state.time); storage.set('skills', [...state.skills]);
    track('SelectSituation', { time: state.time, skills: [...state.skills].join(',') });
    return render();
  }
  if (t.closest('#reset')) { state.time = null; state.skills.clear(); storage.set('time', null); storage.set('skills', []); return render(); }
  const save = t.closest('[data-save]');
  if (save) {
    e.stopPropagation(); const id = save.dataset.save;
    state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
    storage.set('saved', [...state.saved]); track('SaveGig', { gig: id });
    render(); if ($('#sheet').classList.contains('open')) openDetail(id, false); return;
  }
  const go = t.closest('[data-go]');
  if (go) { track('OutboundClick', { gig: go.dataset.go }); return; }
  if (t.closest('[data-close]') || t.id === 'sheet') return closeDetail();
  const tab = t.closest('[data-tab]');
  if (tab) { state.tab = tab.dataset.tab; render(); return window.scrollTo(0, 0); }
  const open = t.closest('[data-open]');
  if (open) openDetail(open.dataset.open);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDetail();
  if (e.key === 'Enter' && e.target.matches('[data-open]')) openDetail(e.target.dataset.open);
});
window.addEventListener('popstate', () => {
  const id = location.hash.replace('#/', '');
  id ? openDetail(id, false) : closeDetail(false);
});

render();
track('PageView');
if (location.hash.startsWith('#/')) openDetail(location.hash.slice(2), false);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
