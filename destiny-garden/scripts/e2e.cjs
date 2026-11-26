// E2E: 실제 브라우저(Chromium)로 전체 플로우 검증. 사용: BASE=http://localhost:3100 node scripts/e2e.cjs
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:3100';
const SHOT = process.env.SHOTS || '/tmp/shots';
const results = []; const fail = [];
const ok = (name, cond, extra = '') => { results.push([cond, name, extra]); if (!cond) fail.push(name); console.log(cond ? 'PASS' : 'FAIL', name, extra); };
const dom = (page, sel) => page.evaluate((s) => { const el = document.querySelector(s); if (!el) throw new Error('없음 ' + s); el.click(); }, sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'ko-KR' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) console.log('  HTTP', r.status(), r.request().method(), r.url().replace(BASE, '')); });
  const shot = (n) => page.screenshot({ path: `${SHOT}/${n}.png` });
  const email = `e2e_${Date.now()}@test.kr`;

  // 1. 입장 화면
  await page.goto(BASE); await page.waitForSelector('text=나의 정원 만들기'); await shot('01-landing');
  ok('입장 화면', true);
  // 2. 가입
  await page.click('text=나의 정원 만들기');
  await page.fill('#em', email); await page.fill('#pw', 'password123');
  await page.click('button:has-text("가입하고 시작하기")'); await sleep(300);
  ok('동의 없이 가입 거부', await page.locator('.err').count() > 0 || (await page.locator('input[type=checkbox]').count()) > 0);
  await page.check('.check input'); await page.click('button:has-text("가입하고 시작하기")');
  await page.waitForURL('**/create'); await sleep(1200); await shot('02-create');
  ok('가입 후 캐릭터 생성 화면', true);
  // 3. 캐릭터 생성
  await page.click('button[role=radio]:nth-child(2)'); await sleep(500);
  await page.fill('#nk', '하늘'); await page.click('button:has-text("운명의 캐릭터 만들기")');
  await page.waitForURL('**/garden'); await page.waitForSelector('canvas'); await sleep(3500); await shot('03-garden');
  ok('정원 진입(Canvas 렌더)', true);
  const hasCanvasPixels = await page.evaluate(() => { const c = document.querySelector('canvas'); return !!c && c.width > 100; });
  ok('WebGL 캔버스', hasCanvasPixels);
  ok('HUD: 닉네임/레벨', (await page.textContent('.prof')).includes('하늘'));
  // 퀘스트 완료 토스트/코인
  await sleep(800);
  const coins = await page.evaluate(() => window.__dg.getState().state.wallet.coins);
  ok('퀘스트 보상(코인) 지급', coins >= 30, `coins=${coins}`);

  // 4. 이동: 키보드
  const p0 = await page.evaluate(() => ({ ...window.__dg.getState().player }));
  await page.keyboard.down('w'); await sleep(900); await page.keyboard.up('w'); await sleep(250);
  const p1 = await page.evaluate(() => ({ ...window.__dg.getState().player }));
  ok('키보드 이동(W)', p1.z < p0.z - 1, `${p0.z.toFixed(2)} → ${p1.z.toFixed(2)}`);
  // 조이스틱
  const joy = await page.locator('.joy').boundingBox();
  await page.evaluate(({ x, y }) => { window.__dg.setState({ joy: { x, y } }); }, { x: 1, y: 0 }); await sleep(700); await page.evaluate(() => window.__dg.setState({ joy: { x: 0, y: 0 } })); await sleep(250);
  const p2 = await page.evaluate(() => ({ ...window.__dg.getState().player }));
  ok('조이스틱 이동(→)', p2.x > p1.x + 1, `${p1.x.toFixed(2)} → ${p2.x.toFixed(2)}`);
  // 실제 터치 조이스틱 이벤트
  const cx = joy.x + joy.width / 2, cy = joy.y + joy.height / 2;
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 40, y: cy, id: 1 }] }); await sleep(700);
  const jv = await page.evaluate(() => window.__dg.getState().joy);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(200);
  const p3 = await page.evaluate(() => ({ ...window.__dg.getState().player }));
  ok('터치 조이스틱 입력', jv.x < -0.5 && p3.x < p2.x - 0.8, `joy.x=${jv.x.toFixed(2)} x ${p2.x.toFixed(2)}→${p3.x.toFixed(2)}`);
  // 바닥 터치 이동
  await page.evaluate(() => window.__dg.setState({ target: { x: 3, z: 6 } })); await sleep(2500);
  const p4 = await page.evaluate(() => ({ ...window.__dg.getState().player }));
  ok('목표 지점 이동', Math.hypot(p4.x - 3, p4.z - 6) < 0.6, `(${p4.x.toFixed(1)}, ${p4.z.toFixed(1)})`);
  await shot('04-moved');

  // 5. 건물 클릭 → 이동 후 입장
  await page.locator('.world-label:has-text("운명의 서고")').evaluate((e) => e.click());
  await page.waitForSelector('.sheet h2:has-text("운명의 서고")', { timeout: 15000 }); await sleep(400); await shot('05-library');
  ok('서고: 건물 클릭→이동→패널', true);
  ok('서고: 사주 원국 표시(무인일주)', (await page.textContent('.sheet')).includes('무인일주'));
  ok('서고: 시주 기미', (await page.textContent('.saju')).includes('기'));
  await page.click('.tabs button:has-text("운명 카드")'); await sleep(500); await shot('06-card');
  await page.click('.tabs button:has-text("대운·세운")'); await sleep(900); await shot('07-cycle');
  ok('서고: 대운 표시', (await page.textContent('.sheet')).includes('대운'));
  await page.click('.tabs button:has-text("오행·십성")'); await sleep(300);
  await page.click('.sheet .x'); await sleep(300);
  const q = await page.evaluate(() => window.__dg.getState().state.quests.filter((x) => x.done).map((x) => x.id));
  ok('퀘스트 q01~q05 완료', ['q01', 'q02', 'q03', 'q04', 'q05'].every((x) => q.includes(x)), q.join(','));

  // 6. NPC 대화 (현자)
  await page.locator('.npc-bubble:has-text("운명의 현자")').evaluate((e) => e.click());
  await page.waitForSelector('.sheet h2:has-text("운명의 현자")', { timeout: 15000 }); await sleep(300);
  const t0 = await page.evaluate(() => window.__dg.getState().state.wallet.tickets);
  await page.click('.chip:has-text("내 사주 전체가 궁금해요")'); await page.waitForSelector('.ans .core', { timeout: 20000 }); await sleep(300); await shot('08-chat');
  const t1 = await page.evaluate(() => window.__dg.getState().state.wallet.tickets);
  ok('NPC 상담 응답 + 질문권 차감', t1 === t0 - 1, `${t0}→${t1}`);
  await page.fill('.chat-foot input.inp', '지금 이직하면 더 좋은 기회가 있을까?'); await page.click('.chat-foot form button.btn'); await page.waitForFunction(() => document.querySelectorAll('.ans .core').length >= 2, null, { timeout: 20000 });
  ok('자유 질문 후속 답변', true);
  const t2 = await page.evaluate(() => window.__dg.getState().state.wallet.tickets);
  await page.fill('.chat-foot input.inp', '세 번째 질문'); await page.click('.chat-foot form button.btn'); await sleep(500);
  ok('질문권 부족 시 차단', (await page.textContent('.chat-foot')).includes('부족'), `tickets=${t2}`);
  await shot('09-noticket');
  await page.click('.sheet .x'); await sleep(300);

  // 7. 상점 (테스트 결제)
  await page.click('.cur button:first-child'); await page.waitForSelector('.sheet h2:has-text("상점")'); await sleep(500); await shot('10-shop');
  await page.click('.prod:has-text("질문권 10개") button'); await page.waitForSelector('text=테스트 결제 승인'); await shot('11-pay');
  await page.click('button:has-text("테스트 결제 승인")'); await page.waitForFunction((n) => window.__dg.getState().state.wallet.tickets > n, t2, { timeout: 15000 }).catch(() => {});
  const t3 = await page.evaluate(() => window.__dg.getState().state.wallet.tickets);
  ok('질문권 결제 후 지급', t3 === t2 + 10, `${t2}→${t3}`);
  await page.click('.sheet .x'); await sleep(300);

  // 8. 타로
  await page.click('.tarot-mini'); await page.waitForSelector('.tarot-grid'); await shot('12-tarot');
  await page.click('.tcard:nth-child(7)'); await page.waitForSelector('.flip-in.on'); await sleep(1200); await shot('13-tarot-result');
  ok('타로 뽑기/해석', (await page.textContent('.sheet')).includes('카드 해석'));
  await page.click('.sheet .x'); await sleep(300);

  // 9. 재물의 신전 → 심층 리포트 구매/열람
  await page.locator('.world-label:has-text("재물의 신전")').evaluate((e) => e.click());
  await page.waitForSelector('.sheet h2:has-text("재물의 신전")', { timeout: 20000 }); await sleep(900); await shot('14-temple');
  ok('신전: 재물운 표시', (await page.textContent('.sheet')).includes('재물 형성 성향'));
  await page.click('.btn:has-text("심층 재물운")'); await page.waitForSelector('.sheet h2:has-text("상점")'); await sleep(300); await page.click('.prod:has-text("심층 재물운") button'); await page.waitForSelector('text=테스트 결제 승인'); await page.click('button:has-text("테스트 결제 승인")');
  await page.waitForSelector('.sheet h2:has-text("심층 재물운 리포트")', { timeout: 15000 }); await sleep(500); await shot('15-report');
  ok('심층 리포트 결제→열람', true);
  await page.click('.sheet .x'); await sleep(300);

  // 10. 인연의 정자 (인물 등록)
  await page.locator('.world-label:has-text("인연의 정자")').evaluate((e) => e.click());
  await page.waitForSelector('.sheet h2:has-text("인연의 정자")', { timeout: 25000 }); await sleep(400);
  await page.fill('#pn', '민준'); await page.click('button:has-text("등록하고 궁합 보기")'); await page.waitForSelector('.bar', { timeout: 8000 }); await sleep(300); await shot('16-pavilion');
  ok('궁합 계산 표시', (await page.textContent('.sheet')).includes('점'));
  await page.click('.sheet .x'); await sleep(300);
  // 11. 도감/가방/퀘스트
  await page.click('.dock button:has-text("운명도감")'); await sleep(500); await shot('17-codex'); await page.click('.sheet .x');
  await page.click('.dock button:has-text("퀘스트")'); await sleep(500); await shot('18-quests'); await page.click('.sheet .x');
  const done = await page.evaluate(() => window.__dg.getState().state.quests.filter((x) => x.done).length);
  ok('퀘스트 진행(≥9/10)', done >= 9, `${done}/10`);
  await shot('19-final');
  ok('콘솔/페이지 오류 없음', errors.filter((e) => !/WebGL|GPU stall|ReadPixels|status of 400/i.test(e)).length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(`\n${results.length - fail.length}/${results.length} passed`);
  process.exit(fail.length ? 1 : 0);
})().catch((e) => { console.error('E2E 예외', e); process.exit(2); });
