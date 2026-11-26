// 스크린샷 도구: node scripts/snap.cjs out.png [w h] [x z]
const { chromium } = require('playwright');
(async () => {
  const [out, w = 390, h = 844, x, z] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: +w < 700, hasTouch: +w < 700 });
  const BASE = process.env.BASE || 'http://localhost:3100';
  const email = `snap_${Date.now()}@test.kr`;
  await ctx.request.post(BASE + '/api/auth/signup', { data: { email, password: 'password123', consent: true } });
  await ctx.request.post(BASE + '/api/character', { data: { nickname: '하늘', avatar: 0, year: 1995, month: 4, day: 17, calendar: 'solar', hour: 14, minute: 30, gender: 'female', region: '서울' } });
  const p = await ctx.newPage(); await p.goto(BASE + '/garden'); await p.waitForSelector('canvas');
  if (x) await p.evaluate(([x, z]) => window.__dg.setState({ target: { x: +x, z: +z } }), [x, z]);
  await new Promise((r) => setTimeout(r, x ? 6000 : 4500));
  await p.addStyleTag({ content: '.toasts{display:none}' });
  await p.screenshot({ path: out }); await b.close();
})();
