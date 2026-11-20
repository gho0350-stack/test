import { GIGS, TIME_OPTIONS, SKILL_OPTIONS } from '../data/gigs.js';
import { storage, openLink, track } from './platform.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = {
  time: storage.get('time', null),
  skills: new Set(storage.get('skills', [])),
  saved: new Set(storage.get('saved', [])),
  tab: 'home',
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

function card(g, why = []) {
  const saved = state.saved.has(g.id);
  return `<article class="card" data-open="${g.id}" tabindex="0" role="button" aria-label="${esc(g.name)} 자세히 보기">
    <div class="logo" style="--c:${g.color}">${esc(g.name[0])}</div>
    <div class="card-body">
      <div class="card-top"><h3>${esc(g.name)}</h3><span class="tag">${esc(g.category)}</span></div>
      <p>${esc(g.tagline)}</p>
      <div class="meta"><span>💰 ${esc(g.earnType)}</span><span>${'●'.repeat(g.difficulty)}${'○'.repeat(3 - g.difficulty)} 난이도</span></div>
      ${why.length ? `<div class="why">✓ ${why.map(esc).join(' · ')}</div>` : ''}
    </div>
    <button class="heart${saved ? ' on' : ''}" data-save="${g.id}" aria-label="저장">${saved ? '♥' : '♡'}</button>
  </article>`;
}

function renderHome() {
  const ranked = GIGS.map((g) => ({ g, ...score(g) })).sort((a, b) => b.s - a.s);
  const filtered = hasFilter();
  $('#view').innerHTML = `
    <section class="hero">
      <h1>시간 날 때 하는<br><em>온라인 부업</em> 모음</h1>
      <p class="sub">플리토, 어도비 스톡, 소셜라우더 같은 부업을 한 번에 보고, 내 사정에 맞는 것만 골라 보세요.</p>
    </section>
    <section class="picker" aria-label="내 상황 선택">
      <h2>한 번에 얼마나 낼 수 있어요?</h2>
      <div class="chips">${TIME_OPTIONS.map((o) => chip(o, state.time === o.id, 'time')).join('')}</div>
      <h2>가진 게 있다면 <small>여러 개 골라도 돼요</small></h2>
      <div class="chips">${SKILL_OPTIONS.map((o) => chip(o, state.skills.has(o.id), 'skill')).join('')}</div>
    </section>
    <section>
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
  $('#sheet').innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true" aria-label="${esc(g.name)}">
    <button class="close" data-close aria-label="닫기">✕</button>
    <div class="sheet-head"><div class="logo big" style="--c:${g.color}">${esc(g.name[0])}</div>
      <div><span class="tag">${esc(g.category)}</span><h2>${esc(g.name)}</h2></div></div>
    <p class="lead">${esc(g.summary)}</p>
    <div class="facts">
      <div><small>수익 방식</small><b>${esc(g.earnType)}</b></div>
      <div><small>진행 주기</small><b>${esc(g.cadence)}</b></div>
      <div><small>난이도</small><b>${['쉬움', '보통', '어려움'][g.difficulty - 1]}</b></div>
    </div>
    <h3>이렇게 시작해요</h3>
    <ol class="steps">${g.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <h3>필요한 것</h3><ul class="plain">${g.needs.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    <div class="proscons">
      <div><h3>괜찮은 점</h3><ul class="plain">${g.pros.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div><h3>걸리는 점</h3><ul class="plain">${g.cons.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
    </div>
    ${g.verified ? '' : '<p class="notice">아직 직접 확인하지 못한 정보예요. 공식 사이트에서 다시 확인해 주세요.</p>'}
    <div class="cta-row">
      <button class="btn ghost" data-save="${g.id}">${saved ? '저장됨' : '저장'}</button>
      <a class="btn" data-go="${g.id}" href="${esc(g.url || 'https://www.google.com/search?q=' + encodeURIComponent(g.name + ' 부업'))}" target="_blank" rel="noopener noreferrer">${g.url ? '공식 사이트 가기' : '검색해서 찾기'}</a>
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
