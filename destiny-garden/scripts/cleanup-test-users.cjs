// 테스트로 만든 Supabase 계정(@test.kr) 삭제. 사용: SUPABASE_URL=... SUPABASE_SECRET_KEY=proxy-injected NODE_USE_ENV_PROXY=1 node scripts/cleanup-test-users.cjs
const U = process.env.SUPABASE_URL, K = process.env.SUPABASE_SECRET_KEY;
const h = { apikey: K };
(async () => {
  let n = 0;
  for (let page = 1; page < 50; page++) {
    const r = await (await fetch(`${U}/auth/v1/admin/users?page=${page}&per_page=100`, { headers: h })).json();
    const users = r.users || []; if (!users.length) break;
    for (const u of users) if (/@test\.kr$/.test(u.email || '')) { await fetch(`${U}/auth/v1/admin/users/${u.id}`, { method: 'DELETE', headers: h }); n++; }
    if (users.length < 100) break;
  }
  console.log('삭제한 테스트 계정:', n);
})();
