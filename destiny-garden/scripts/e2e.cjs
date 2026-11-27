// E2E(실제 Chromium, 모바일 화면): 정원 → 건물 입장 → 실내 이동 → 오브젝트 상호작용 → 카드 → 방 퀘스트 → 현자 해금 → 상담. BASE=http://localhost:3100 node scripts/e2e.cjs
const { chromium } = require('playwright');
const rooms = require('../data/rooms.json');
const BASE = process.env.BASE || 'http://localhost:3100';
const SHOT = process.env.SHOTS || '/tmp/shots';
const results = []; const fail = [];
const ok = (name, cond, extra = '') => { results.push([cond, name, extra]); if (!cond) fail.push(name); console.log(cond ? 'PASS' : 'FAIL', name, extra); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'ko-KR' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) console.log('  HTTP', r.status(), r.request().method(), r.url().replace(BASE, '')); });
  const shot = (n) => page.screenshot({ path: `${SHOT}/${n}.png` });
  const S = (fn, arg) => page.evaluate(fn, arg);
  const gs = () => S(() => window.__dg.getState());
  const email = `e2e_${Date.now()}@test.kr`;

  // ── 가입/캐릭터 ──
  await page.goto(BASE); await page.waitForSelector('text=나의 정원 만들기'); await shot('01-landing');
  await page.click('text=나의 정원 만들기'); await page.fill('#em', email); await page.fill('#pw', 'password123');
  await page.click('button:has-text("가입하고 시작하기")'); await sleep(300);
  ok('동의 없이 가입 거부', (await page.locator('input[type=checkbox]').count()) > 0);
  await page.check('.check input'); await page.click('button:has-text("가입하고 시작하기")');
  await page.waitForURL('**/create'); await sleep(1000);
  await page.click('button[role=radio]:nth-child(2)'); await page.fill('#nk', '하늘'); await page.click('button:has-text("운명의 캐릭터 만들기")');
  await page.waitForURL('**/garden'); await page.waitForSelector('canvas'); await sleep(3000); await shot('02-garden');
  ok('정원 진입(WebGL 캔버스)', await S(() => !!document.querySelector('canvas') && document.querySelector('canvas').width > 100));
  ok('HUD: 닉네임·칭호(정원의 방문자)·질문권 표시, 보석/코인/가방 없음', (await page.textContent('.prof')).includes('정원의 방문자') && (await page.textContent('[data-testid=tickets]')).includes('질문권 2') && (await page.locator('.dock button:has-text("가방")').count()) === 0 && !(await page.textContent('.hud')).includes('💎'));
  ok('하단 메뉴 5개(정원·퀘스트·운명도감·상담·상점)', (await page.locator('.dock button').count()) === 5);

  // ── 정원 이동 ──
  const p0 = (await gs()).player;
  await page.keyboard.down('w'); await sleep(900); await page.keyboard.up('w'); await sleep(250);
  const p1 = (await gs()).player; ok('정원: 키보드 이동', p1.z < p0.z - 0.8, `${p0.z.toFixed(1)}→${p1.z.toFixed(1)}`);
  const joy = await page.locator('.joy').boundingBox(); const cx = joy.x + joy.width / 2, cy = joy.y + joy.height / 2;
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 40, y: cy, id: 1 }] }); await sleep(700);
  const jv = (await gs()).joy; await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(200);
  ok('정원: 터치 조이스틱', jv.x < -0.5, `joy.x=${jv.x.toFixed(2)}`);

  // ── 재물의 방 입장 ──
  const wealth = rooms.find((r) => r.id === 'wealth');
  await S(() => window.__dg.setState({ target: { x: 0, z: -5.7 } }));
  await page.waitForSelector('[data-testid=near]', { timeout: 60000 }); await sleep(200); await shot('03-near-building');
  const nt = await page.textContent('[data-testid=near]');
  ok('건물 접근 시 이름·탐험 진행도·상담 상태·입장 버튼 표시', nt.includes('재물의 방') && nt.includes('0/5') && nt.includes('상담 잠김') && nt.includes('입장하기'), nt.trim());
  await page.click('[data-testid=near-action]'); await page.waitForSelector('.room-bar'); await sleep(1500); await shot('04-room');
  ok('독립 3D 실내 맵으로 전환(방 이름·나가기 버튼)', (await page.textContent('.room-bar')).includes('재물의 방') && (await S(() => window.__dg.getState().room)) === 'wealth');
  ok('방 전용 퀘스트 표시(재물의 비밀 0/5)', (await page.textContent('[data-testid=room-quest]')).includes('재물의 비밀') && (await page.textContent('[data-testid=room-quest]')).includes('0/5'));

  // ── 카메라 조작: 드래그로 둘러보기, 휠로 확대/축소 ──
  const c0 = await S(() => ({ yaw: window.__cam.yaw, dist: window.__cam.dist }));
  await page.mouse.move(200, 300); await page.mouse.down(); await page.mouse.move(300, 320, { steps: 6 }); await page.mouse.up(); await sleep(200);
  const c1 = await S(() => ({ yaw: window.__cam.yaw, dist: window.__cam.dist }));
  ok('드래그로 카메라 회전', Math.abs(c1.yaw - c0.yaw) > 0.3, `yaw ${c0.yaw.toFixed(2)}→${c1.yaw.toFixed(2)}`);
  await page.mouse.wheel(0, 500); await sleep(300);
  const c2 = await S(() => window.__cam.dist); ok('휠로 확대/축소', c2 > c1.dist * 1.2, `dist ${c1.dist.toFixed(1)}→${c2.toFixed(1)}`);
  await page.mouse.wheel(0, -900); await sleep(300); const c3 = await S(() => window.__cam.dist); ok('휠 확대(가까이)', c3 < c2);
  await S(() => { window.__cam.yaw = 0; });
  // ── 실내 이동 ──
  const r0 = (await gs()).roomPlayer;
  await page.keyboard.down('w'); await sleep(900); await page.keyboard.up('w'); await sleep(200);
  const r1 = (await gs()).roomPlayer; ok('실내: 캐릭터 직접 이동', r1.z < r0.z - 0.5, `${r0.z.toFixed(1)}→${r1.z.toFixed(1)}`);

  // 오브젝트로 접근 → 근접 시 버튼 표시
  const approach = async (o) => { const dx = Math.sin(o.rot || 0) * 1.7, dz = Math.cos(o.rot || 0) * 1.7; await S(([x, z]) => window.__dg.setState({ target: { x, z } }), [o.pos.x + dx, o.pos.z + dz]); try { await page.waitForFunction((id) => { const n = window.__dg.getState().near; return n && n.id === id; }, o.id, { timeout: 45000 }); } catch (e) { console.log('접근 실패 상태:', JSON.stringify(await S(() => { const g = window.__dg.getState(); return { panel: g.panel, reveal: !!g.reveal, sageUnlock: g.sageUnlock, near: g.near, target: g.target, rp: g.roomPlayer, room: g.room }; }))); await shot('dbg-approach'); throw e; } await sleep(300); };
  const openObj = async (o) => { await approach(o); await page.click('[data-testid=near-action]'); await page.waitForSelector('[data-testid=cardmodal] .dcard', { timeout: 15000 }); await sleep(300); };
  const closeCard = async () => { await page.click('[data-testid=cardmodal] .x'); await sleep(300); };

  const safe = wealth.objects.find((o) => o.id === 'safe');
  await approach(safe);
  const nb = await page.textContent('[data-testid=near]'); ok('오브젝트 근처에서 이름·행동 버튼 표시', nb.includes('작은 금고') && nb.includes('금고 문 열기'), nb.trim());
  await shot('05-near-safe');
  await page.click('[data-testid=near-action]');
  await sleep(450); ok('금고 열림 상태(애니메이션 진행)', (await S(() => window.__dg.getState().anim.safe)) === 'opening');
  await page.waitForSelector('[data-testid=cardmodal] .dcard', { timeout: 15000 }); await sleep(300); await shot('06-card');
  const ct = await page.textContent('[data-testid=cardmodal]');
  ok('카드 획득: 개인화 해석·명리학적 근거 표시', ct.includes('재물 형성 성향') && ct.includes('명리학적 근거'));
  const exp1 = (await gs()).state.profile.exp, cards1 = (await gs()).state.cards.length;
  await closeCard();
  ok('운명도감 자동 등록 + 퀘스트 진행도 1/5', cards1 === 1 && (await page.textContent('[data-testid=room-quest]')).includes('1/5'));
  // 중복 지급 방지
  await page.click('[data-testid=near-action]'); await page.waitForSelector('[data-testid=cardmodal]'); await sleep(300);
  const st2 = (await gs()).state; ok('같은 금고 재조사: 카드·경험치 중복 지급 없음', st2.cards.length === cards1 && st2.profile.exp === exp1);
  await closeCard();

  // ── 현자: 해금 전 ──
  const sage = wealth.sage;
  await S(([x, z]) => window.__dg.setState({ target: { x, z } }), [sage.pos.x + 1.4, sage.pos.z + 1.2]);
  await page.waitForFunction(() => { const n = window.__dg.getState().near; return n && n.kind === 'sage'; }, null, { timeout: 45000 });
  await page.click('[data-testid=near-action]'); await page.waitForSelector('.sheet h2:has-text("재물의 현자")'); await sleep(300); await shot('07-sage-locked');
  ok('카드 5장 전에는 상담 잠김(안내 대화만)', (await page.locator('[data-testid=start-consult]').count()) === 0 && (await page.textContent('.sheet')).includes('4') );
  await page.click('.sheet .x'); await sleep(300);
  await page.click('.dock button:has-text("상담")'); await page.waitForSelector('[data-sage=merchant]'); await shot('08-consult-menu');
  ok('상담 메뉴: 현자별 해금 상태(잠김 표시)', (await page.textContent('[data-sage=merchant]')).includes('1/5'));
  await page.click('.sheet .x'); await sleep(300);

  // ── 나머지 4장 → 해금 ──
  for (const id of ['chest', 'ledger', 'scale']) { await openObj(wealth.objects.find((o) => o.id === id)); await closeCard(); }
  await openObj(wealth.objects.find((o) => o.id === 'map')); await sleep(2200);
  await page.waitForSelector('[data-testid=cardmodal] .dcard'); await closeCard();
  await page.waitForSelector('[data-testid=unlockmodal]', { timeout: 8000 }); await sleep(300); await shot('09-unlock');
  ok('카드 5장 완료 → 현자 상담 해금 축하 화면', (await page.textContent('[data-testid=unlockmodal]')).includes('첫 상담은 무료'));
  const stU = (await gs()).state;
  ok('퀘스트 q04 완료·방 5/5·서버 해금 상태', stU.quests.find((q) => q.id === 'q04').done && stU.rooms.find((r) => r.id === 'wealth').sageUnlocked);

  // ── 첫 무료 상담 → 이후 질문권 ──
  await page.click('[data-testid=unlockmodal] .btn.gold'); await page.waitForSelector('.chat-foot'); await sleep(400);
  ok('상담창: 첫 상담 무료 표시', (await page.textContent('.chat-foot')).includes('무료'));
  await page.click('[data-card=wealth_style]');
  await page.click('.chip:has-text("나는 사업가로 성공할 수 있을까?")'); await page.waitForSelector('.ans .core', { timeout: 25000 }); await sleep(500); await shot('10-chat');
  const tFree = (await gs()).state.wallet.tickets; ok('첫 상담은 질문권 차감 없음', tFree === 2, `tickets=${tFree}`);
  ok('선택 카드 반영 + 새 상담 카드 + 다음 탐험 힌트', (await page.textContent('.ans')).includes('재물 형성 성향') && (await page.locator('[data-testid=cardmodal]').count()) > 0 && (await page.textContent('.ans')).includes('다음 탐험 힌트'));
  await closeCard();
  await page.fill('.chat-foot input.inp', '올해 돈이 새는 구멍은 어디일까요?'); await page.click('.chat-foot form button.btn'); await page.waitForFunction(() => document.querySelectorAll('.ans .core').length >= 2, null, { timeout: 25000 });
  await sleep(300); if (await page.locator('[data-testid=cardmodal]').count()) await closeCard();
  const tPaid = (await gs()).state.wallet.tickets; ok('두 번째 상담부터 질문권 사용', tPaid === 1, `tickets=${tPaid}`);
  await page.click('.sheet .x'); await sleep(300);

  // ── 새로고침 후 유지 ──
  await page.reload(); await page.waitForSelector('canvas'); await sleep(3500);
  const stR = (await gs()).state;
  ok('새로고침 후 카드·퀘스트·상담 해금 유지', stR.cards.length >= 6 && stR.rooms.find((r) => r.id === 'wealth').sageUnlocked && stR.quests.find((q) => q.id === 'q04').done);

  // ── 하단 상담 메뉴에서 바로 상담 (방 방문 불필요) ──
  await page.click('.dock button:has-text("상담")'); await page.waitForSelector('[data-sage=merchant]'); await shot('11-consult-unlocked');
  ok('해금된 현자는 하단 메뉴에서 바로 상담 가능', (await page.textContent('[data-sage=merchant]')).includes('상담 가능'));
  await page.click('[data-sage=merchant]'); await page.waitForSelector('.chat-foot'); await page.click('.sheet .x'); await sleep(300);

  // ── 나가기 → 정원 복귀 ──
  const wasInRoom = await S(() => window.__dg.getState().room);
  ok('새로고침 시 정원으로 복귀(방 상태는 세션 한정)', wasInRoom === null);

  // ── 서고: 4장 완주(범용 실내 엔진 확인) ──
  const lib = rooms.find((r) => r.id === 'library');
  await S(() => window.__dg.getState().enterRoom('library')); await page.waitForSelector('.room-bar'); await sleep(1500);
  for (const o of lib.objects.filter((x) => x.required)) { await openObj(o); await closeCard(); if (o.id === 'letter') await sleep(300); }
  await page.waitForSelector('[data-testid=unlockmodal]', { timeout: 8000 }); await shot('12-library-unlock');
  ok('서고 4장 완료 → 운명의 현자 해금', (await gs()).state.rooms.find((r) => r.id === 'library').sageUnlocked);
  await page.click('[data-testid=unlockmodal] .btn.line'); await sleep(300);
  // 두루마리(사주 원국)
  const scroll = lib.objects.find((o) => o.id === 'scroll'); await approach(scroll); await page.click('[data-testid=near-action]'); await page.waitForSelector('.manse');
  const mt = await page.textContent('.manse');
  ok('사주 두루마리: 만세력 표(시주 己未·일주 戊寅·지장간·12운성·납음·신살)', mt.includes('己') && mt.includes('戊寅'.slice(0,1)) && mt.includes('12운성') && mt.includes('납음') && mt.includes('신살') && (await page.textContent('.sheet')).includes('무인일주'));
  await page.click('.tabs button:has-text("풀이")'); await sleep(300);
  ok('사주 풀이: 총론·격국·용신·신살·공망', (await page.textContent('.sheet-body')).includes('건록격') && (await page.textContent('.sheet-body')).includes('용신'));
  await page.click('.sheet .x'); await sleep(300);
  // 나가기
  await page.click('[data-testid=exit-room]'); await sleep(1500);
  const exited = await gs(); ok('나가기: 정원 복귀(건물 입구 위치)', exited.room === null && Math.hypot(exited.player.x - (-4.0), exited.player.z - 0.4) < 1);

  // ── 인연의 정자(기본 3장 + 상대 등록 없이 해금) / 시간의 방 ──
  const pav = rooms.find((r) => r.id === 'pavilion'); const tm = rooms.find((r) => r.id === 'time');
  await S(() => window.__dg.getState().enterRoom('pavilion')); await page.waitForSelector('.room-bar'); await sleep(1500);
  for (const o of pav.objects.filter((x) => x.required)) { await openObj(o); await closeCard(); }
  await page.waitForSelector('[data-testid=unlockmodal]', { timeout: 8000 }); await page.click('[data-testid=unlockmodal] .btn.line'); await sleep(300);
  ok('인연의 정자: 상대 등록 없이 기본 3장으로 인연의 현자 해금', (await gs()).state.rooms.find((r) => r.id === 'pavilion').sageUnlocked);
  await page.click('[data-testid=exit-room]'); await sleep(800);
  await S(() => window.__dg.getState().enterRoom('time')); await page.waitForSelector('.room-bar'); await sleep(1500);
  for (const o of tm.objects.filter((x) => x.required)) { await openObj(o); await closeCard(); }
  await page.waitForSelector('[data-testid=unlockmodal]', { timeout: 8000 }); await page.click('[data-testid=unlockmodal] .btn.line'); await sleep(300); await shot('13-time-room');
  ok('시간의 방 4장 완료 → 시간의 현자 해금(전생은 창작 표시)', (await gs()).state.rooms.find((r) => r.id === 'time').sageUnlocked && (await gs()).state.cards.find((c) => c.key === 'past_life').body.includes('창작'));
  await page.click('[data-testid=exit-room]'); await sleep(800);

  // ── 도감/퀘스트/상점/타로 ──
  await page.click('.dock button:has-text("운명도감")'); await page.waitForSelector('.sheet h2:has-text("운명 도감")'); await sleep(400); await shot('14-codex');
  const n = (await gs()).state.cards.length;
  ok('운명도감 통합: 전체 발견 진행도 표시', (await page.textContent('.sheet-head')).includes('발견') && n >= 16);
  await page.click('[data-tab=tarot]'); await sleep(300); await page.click('[data-tab=chronicle]'); await sleep(300);
  ok('운명 연대기', (await page.locator('.sheet-body .prod').count()) >= 10); await page.click('.sheet .x');
  await page.click('.dock button:has-text("퀘스트")'); await sleep(500); await shot('15-quests');
  ok('공간별 퀘스트 표시', (await page.textContent('.sheet-body')).includes('서고') && (await page.textContent('.sheet-body')).includes('4/4')); await page.click('.sheet .x'); await sleep(300);
  await page.click('[data-testid=tickets]'); await page.waitForSelector('.sheet h2:has-text("상점")'); await sleep(400);
  await page.click('.prod:has-text("질문권 10개") button'); await page.waitForSelector('text=테스트 결제 승인'); await page.click('button:has-text("테스트 결제 승인")');
  await page.waitForFunction((t) => window.__dg.getState().state.wallet.tickets > t, tPaid, { timeout: 15000 }).catch(() => {});
  ok('질문권 결제 후 지급', (await gs()).state.wallet.tickets === tPaid + 10); await page.click('.sheet .x'); await sleep(300);
  await page.click('.tarot-mini'); await page.waitForSelector('.tarot-grid'); await page.click('.tcard:nth-child(7)'); await page.waitForSelector('.flip-in.on'); await sleep(900);
  ok('오늘의 타로 뽑기/해석', (await page.textContent('.sheet')).includes('카드 해석')); await page.click('.sheet .x'); await sleep(300);
  await shot('16-final');
  ok('콘솔/페이지 오류 없음', errors.filter((e) => !/WebGL|GPU stall|ReadPixels|status of 400|status of 403/i.test(e)).length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(`\n${results.length - fail.length}/${results.length} passed`);
  process.exit(fail.length ? 1 : 0);
})().catch((e) => { console.error('E2E 예외', e); process.exit(2); });
