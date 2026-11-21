// 책등 서버. public/ 의 정적 파일과 /api/*, /go 를 한 Worker에서 제공합니다.
// 저장소는 Cloudflare D1, 도서 검색은 카카오(우선) 또는 네이버 API를 서버에서 대신 호출합니다.

const LIMITS = { sendsPerDevice: 3, sendsPerIp: 12, receivesPerDevice: 12, booksPerIp: 300, adminFailsPerIp: 20 };
const MAX_DELIVERIES = 3; // 독자가 남긴 문장 하나가 최대 몇 명에게 도착하는지
const HIDE_AT_REPORTS = 2; // 신고가 이만큼 쌓이면 숨김
const PRESENCE_WINDOW_MS = 90_000;

export const BLOCK = /(https?:\/\/|www\.|@[a-z0-9_.]+|\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}|카톡|오픈채팅|open\.kakao)/i;
const UUID = /^[0-9a-f-]{36}$/i;

// 서점 검색 주소. 제휴 링크를 받았다면 AFFILIATE_ALADIN 같은 환경 변수에 {q} 자리를 넣은 주소로 넣으면 이 값 대신 쓰입니다.
const STORE_URLS = {
  aladin: "https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&SearchWord={q}",
  kyobo: "https://search.kyobobook.co.kr/search?keyword={q}",
  yes24: "https://www.yes24.com/Product/Search?domain=BOOK&query={q}"
};
const EXTRA_STORES = ["coupang"]; // 기본 주소가 없고, 환경 변수가 있을 때만 켜지는 서점

// 관리자 화면의 "기본 10개 넣기"로 들어가는 문장. 모두 저작권이 만료된 작품의 구절입니다.
export const DEFAULT_CURATED = [
  { book: "하늘과 바람과 별과 시", author: "윤동주", quote: "죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를", note: "오늘은 그냥 버틴 것만으로도 충분해요." },
  { book: "하늘과 바람과 별과 시", author: "윤동주", quote: "잎새에 이는 바람에도 나는 괴로워했다", note: "작은 바람에도 흔들리는 날이 있죠." },
  { book: "하늘과 바람과 별과 시", author: "윤동주", quote: "별 하나에 추억과 별 하나에 사랑과 별 하나에 쓸쓸함과", note: "책 덮고 창밖을 한 번 보고 가요." },
  { book: "하늘과 바람과 별과 시", author: "윤동주", quote: "인생은 살기 어렵다는데 시가 이렇게 쉽게 씌어지는 것은 부끄러운 일이다", note: "힘든 날의 문장이 오래 남더라고요." },
  { book: "님의 침묵", author: "한용운", quote: "나는 나룻배 당신은 행인", note: "기다려 주는 사람이 되는 밤이길." },
  { book: "님의 침묵", author: "한용운", quote: "아아 님은 갔지마는 나는 님을 보내지 아니하였습니다", note: "보내지 못한 마음도 괜찮아요." },
  { book: "진달래꽃", author: "김소월", quote: "산에는 꽃 피네 꽃이 피네 갈 봄 여름 없이 꽃이 피네", note: "아무도 안 봐도 피는 꽃처럼, 천천히요." },
  { book: "진달래꽃", author: "김소월", quote: "엄마야 누나야 강변 살자", note: "지금 있는 곳이 강변이라고 생각해 봐요." },
  { book: "육사시집", author: "이육사", quote: "내 고장 칠월은 청포도가 익어 가는 시절", note: "오늘 하루도 조금씩 익고 있어요." },
  { book: "육사시집", author: "이육사", quote: "까마득한 날에 하늘이 처음 열리고", note: "시작은 늘 까마득해요. 그래도 한 페이지." }
];

/* ---------- 공통 ---------- */
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}
const bad = (message, status = 400) => json({ error: "bad_request", message }, status);

export function clean(s, max) {
  return String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
function kstDay() {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}
async function sha256(s) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}
async function ipHash(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const d = await sha256(ip + (env.IP_SALT || "chaekdeung"));
  return [...d.slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function readBody(request) {
  if (Number(request.headers.get("content-length") || 0) > 4096) return null;
  try { return await request.json(); } catch (e) { return null; }
}
// 하루 사용 횟수를 1 올리고 올린 뒤의 값을 돌려줍니다.
async function bump(db, key, day) {
  const r = await db
    .prepare("INSERT INTO limits (k, day, n) VALUES (?1, ?2, 1) ON CONFLICT (k, day) DO UPDATE SET n = n + 1 RETURNING n")
    .bind(key, day)
    .first();
  return r ? r.n : 1;
}

/* ---------- 도서 검색 ---------- */
function decodeEntities(s) {
  return s.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
const stripTags = (s) => decodeEntities(String(s ?? "").replace(/<[^>]*>/g, ""));

export function normalizeKakao(j) {
  return (j.documents || [])
    .slice(0, 8)
    .map((d) => ({ title: clean(d.title, 100), authors: clean((d.authors || []).join(", "), 100) }))
    .filter((b) => b.title);
}
export function normalizeNaver(j) {
  return (j.items || [])
    .slice(0, 8)
    .map((d) => ({ title: clean(stripTags(d.title), 100), authors: clean(stripTags(d.author).replace(/\^/g, ", "), 100) }))
    .filter((b) => b.title);
}

// 설정된 검색 API가 없으면 null, 있으면 결과 배열(비어 있을 수 있음)을 돌려줍니다.
export async function searchBooks(env, q, fetchImpl = fetch) {
  const hasKakao = !!env.KAKAO_REST_API_KEY;
  const hasNaver = !!(env.NAVER_CLIENT_ID && env.NAVER_CLIENT_SECRET);
  if (!hasKakao && !hasNaver) return null;
  if (hasKakao) {
    try {
      const r = await fetchImpl("https://dapi.kakao.com/v3/search/book?size=8&query=" + encodeURIComponent(q), {
        headers: { Authorization: "KakaoAK " + env.KAKAO_REST_API_KEY },
        signal: AbortSignal.timeout(4000)
      });
      if (r.ok) { const items = normalizeKakao(await r.json()); if (items.length) return items; }
    } catch (e) { /* 다음 후보로 */ }
  }
  if (hasNaver) {
    try {
      const r = await fetchImpl("https://openapi.naver.com/v1/search/book.json?display=8&query=" + encodeURIComponent(q), {
        headers: { "X-Naver-Client-Id": env.NAVER_CLIENT_ID, "X-Naver-Client-Secret": env.NAVER_CLIENT_SECRET },
        signal: AbortSignal.timeout(4000)
      });
      if (r.ok) return normalizeNaver(await r.json());
    } catch (e) { /* 아래에서 빈 결과 */ }
  }
  return [];
}

async function handleBooks(request, env, ctx, url) {
  const q = clean(url.searchParams.get("q"), 50);
  if (!q) return json({ documents: [] });
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const cacheKey = new Request("https://cache.chaekdeung.invalid/books?q=" + encodeURIComponent(q.toLowerCase()));
  if (cache) { const hit = await cache.match(cacheKey); if (hit) return hit; }
  const n = await bump(env.DB, "book:" + (await ipHash(request, env)), kstDay());
  if (n > LIMITS.booksPerIp) return json({ error: "limit" }, 429);
  const items = await searchBooks(env, q);
  if (items === null) return json({ error: "not_configured" }, 503);
  const res = json({ documents: items }, 200, { "cache-control": "public, max-age=86400" });
  if (cache && items.length) ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

/* ---------- 서점 링크 (제휴 수익) ---------- */
function storeTemplate(env, id) {
  if (!/^[a-z0-9]{2,12}$/.test(id)) return null;
  return env["AFFILIATE_" + id.toUpperCase()] || STORE_URLS[id] || null;
}
function availableStores(env) {
  return [...Object.keys(STORE_URLS), ...EXTRA_STORES.filter((id) => env["AFFILIATE_" + id.toUpperCase()])];
}
// /go?s=aladin&t=제목&a=저자 → 클릭을 세고 서점으로 이동시킵니다.
async function handleGo(env, url) {
  const store = url.searchParams.get("s") || "";
  const tpl = storeTemplate(env, store);
  const title = clean(url.searchParams.get("t"), 100);
  const author = clean(url.searchParams.get("a"), 100).split(",")[0].trim();
  if (!tpl || !title) return json({ error: "not_found" }, 404);
  const q = encodeURIComponent((title + " " + author).trim());
  const dest = tpl.split("{q}").join(q);
  if (!/^https:\/\//.test(dest)) return json({ error: "bad_template" }, 500);
  await env.DB.prepare("INSERT INTO clicks (store, book, at) VALUES (?1, ?2, ?3)").bind(store, title, Date.now()).run();
  return new Response(null, { status: 302, headers: { location: dest, "cache-control": "no-store" } });
}

/* ---------- 문장 주고받기 ---------- */
async function handleSend(request, env) {
  const b = await readBody(request);
  if (!b || !UUID.test(String(b.device))) return bad("잘못된 요청이에요.");
  const book = clean(b.book, 100), author = clean(b.author, 100);
  const quote = clean(b.quote, 100), note = clean(b.note, 40);
  if (!book) return bad("책을 선택해 주세요.");
  if (quote.length < 4) return bad("문장은 4자 이상 적어 주세요.");
  if (BLOCK.test(quote + " " + note)) return bad("링크나 연락처는 보낼 수 없어요.");

  const day = kstDay();
  const used = await bump(env.DB, "send:" + b.device, day);
  const usedIp = await bump(env.DB, "sendip:" + (await ipHash(request, env)), day);
  if (used > LIMITS.sendsPerDevice || usedIp > LIMITS.sendsPerIp) {
    return json({ error: "limit", message: "오늘 보낼 수 있는 불빛을 모두 보냈어요. 내일 또 만나요." }, 429);
  }
  const ins = await env.DB
    .prepare("INSERT INTO lights (device, book, author, quote, note, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
    .bind(b.device, book, author, quote, note, Date.now())
    .run();
  return json({ ok: true, remaining: LIMITS.sendsPerDevice - used, id: ins.meta.last_row_id });
}

// 보낸 사람이 자기 문장을 거둬들입니다. 이미 누군가의 서랍에 담긴 복사본은 지울 수 없어요.
async function handleWithdraw(request, env) {
  const b = await readBody(request);
  const id = Number(b && b.id);
  if (!b || !UUID.test(String(b.device)) || !Number.isInteger(id)) return bad("잘못된 요청이에요.");
  const row = await env.DB.prepare("SELECT id FROM lights WHERE id = ?1 AND device = ?2 AND source = 'user'").bind(id, b.device).first();
  if (!row) return json({ ok: true }); // 이미 없거나 내 문장이 아님
  await env.DB.batch([
    env.DB.prepare("DELETE FROM lights WHERE id = ?1").bind(id),
    env.DB.prepare("DELETE FROM seen WHERE light_id = ?1").bind(id),
    env.DB.prepare("DELETE FROM thanks WHERE light_id = ?1").bind(id),
    env.DB.prepare("DELETE FROM reports WHERE light_id = ?1").bind(id)
  ]);
  return json({ ok: true });
}

const PICK = "SELECT id, source, book, author, quote, note FROM lights";
// 쉬는 시간에 들어온 사람에게 문장 하나를 줍니다.
// 1순위: 아직 많이 전달되지 않은 독자의 문장, 2순위: 아직 안 본 관리자 문장, 3순위: 관리자 문장 다시 보여 주기.
async function handleReceive(request, env) {
  const b = await readBody(request);
  if (!b || !UUID.test(String(b.device))) return bad("잘못된 요청이에요.");
  const n = await bump(env.DB, "recv:" + b.device, kstDay());
  if (n > LIMITS.receivesPerDevice) return json({ light: null });

  const unseen = "id NOT IN (SELECT light_id FROM seen WHERE device = ?1)";
  let row = await env.DB
    .prepare(`${PICK} WHERE hidden = 0 AND source = 'user' AND deliveries < ?2 AND device <> ?1 AND ${unseen} ORDER BY deliveries ASC, RANDOM() LIMIT 1`)
    .bind(b.device, MAX_DELIVERIES)
    .first();
  if (!row) {
    row = await env.DB.prepare(`${PICK} WHERE hidden = 0 AND source = 'admin' AND ${unseen} ORDER BY RANDOM() LIMIT 1`).bind(b.device).first();
  }
  if (!row) {
    row = await env.DB.prepare(`${PICK} WHERE hidden = 0 AND source = 'admin' ORDER BY RANDOM() LIMIT 1`).first();
  }
  if (!row) return json({ light: null });
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO seen (device, light_id, at) VALUES (?1, ?2, ?3)").bind(b.device, row.id, Date.now()),
    env.DB.prepare("UPDATE lights SET deliveries = deliveries + 1 WHERE id = ?1").bind(row.id)
  ]);
  return json({ light: row });
}

// 받은 문장에 "고마워요"를 보냅니다. 한 사람이 한 문장에 한 번만 셉니다.
async function handleThanks(request, env) {
  const b = await readBody(request);
  const id = Number(b && b.id);
  if (!b || !UUID.test(String(b.device)) || !Number.isInteger(id)) return bad("잘못된 요청이에요.");
  const seen = await env.DB.prepare("SELECT 1 AS x FROM seen WHERE device = ?1 AND light_id = ?2").bind(b.device, id).first();
  if (!seen) return bad("고마움을 전할 수 없는 문장이에요.", 403);
  const ins = await env.DB.prepare("INSERT OR IGNORE INTO thanks (device, light_id, at) VALUES (?1, ?2, ?3)").bind(b.device, id, Date.now()).run();
  if (ins.meta && ins.meta.changes) await env.DB.prepare("UPDATE lights SET thanks = thanks + 1 WHERE id = ?1").bind(id).run();
  return json({ ok: true });
}

// 내가 남긴 문장이 몇 명에게 닿았고 "고마워요"를 몇 개 받았는지.
async function handleMine(request, env) {
  const b = await readBody(request);
  if (!b || !UUID.test(String(b.device))) return bad("잘못된 요청이에요.");
  const rows = await env.DB
    .prepare("SELECT id, deliveries, thanks FROM lights WHERE device = ?1 AND source = 'user' ORDER BY id DESC LIMIT 100")
    .bind(b.device)
    .all();
  return json({ lights: rows.results });
}

async function handleReport(request, env) {
  const b = await readBody(request);
  const id = Number(b && b.id);
  if (!b || !UUID.test(String(b.device)) || !Number.isInteger(id)) return bad("잘못된 요청이에요.");
  // 받아 본 문장만 신고할 수 있습니다.
  const seen = await env.DB.prepare("SELECT 1 AS x FROM seen WHERE device = ?1 AND light_id = ?2").bind(b.device, id).first();
  if (!seen) return bad("신고할 수 없는 문장이에요.", 403);
  const ins = await env.DB.prepare("INSERT OR IGNORE INTO reports (device, light_id) VALUES (?1, ?2)").bind(b.device, id).run();
  if (ins.meta && ins.meta.changes) {
    await env.DB
      .prepare("UPDATE lights SET reports = reports + 1, hidden = CASE WHEN reports + 1 >= ?2 THEN 1 ELSE hidden END WHERE id = ?1")
      .bind(id, HIDE_AT_REPORTS)
      .run();
  }
  return json({ ok: true });
}

/* ---------- 읽는 사람 수 ---------- */
async function handleHeartbeat(request, env) {
  const b = await readBody(request);
  if (!b || !UUID.test(String(b.device))) return bad("잘못된 요청이에요.");
  const now = Date.now();
  await env.DB
    .prepare("INSERT INTO presence (device, last_seen) VALUES (?1, ?2) ON CONFLICT (device) DO UPDATE SET last_seen = ?2")
    .bind(b.device, now)
    .run();
  if (Math.random() < 0.02) { // 가끔 오래된 기록 정리
    await env.DB.prepare("DELETE FROM presence WHERE last_seen < ?1").bind(now - 3600_000).run();
    const old = new Date(Date.now() + 9 * 3600_000 - 3 * 86400_000).toISOString().slice(0, 10);
    await env.DB.prepare("DELETE FROM limits WHERE day < ?1").bind(old).run();
  }
  return json({ ok: true });
}
async function handlePresence(env) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS c FROM presence WHERE last_seen > ?1").bind(Date.now() - PRESENCE_WINDOW_MS).first();
  return json({ count: r ? r.c : 0 });
}

/* ---------- 관리자 ---------- */
// 관리자 요청은 Authorization: Bearer <ADMIN_TOKEN> 이어야 합니다. 틀린 시도는 IP별로 세고, 20번이 넘으면 그날은 잠급니다.
async function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return json({ error: "admin_disabled", message: "ADMIN_TOKEN이 설정되지 않았어요." }, 503);
  const key = "adminfail:" + (await ipHash(request, env)), day = kstDay();
  const row = await env.DB.prepare("SELECT n FROM limits WHERE k = ?1 AND day = ?2").bind(key, day).first();
  if (row && row.n >= LIMITS.adminFailsPerIp) return json({ error: "locked", message: "시도 횟수가 너무 많아요. 내일 다시 시도해 주세요." }, 429);
  const given = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const [a, b] = await Promise.all([sha256(given), sha256(env.ADMIN_TOKEN)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) {
    await bump(env.DB, key, day);
    return json({ error: "unauthorized", message: "관리자 비밀번호가 맞지 않아요." }, 401);
  }
  return null;
}

const ADMIN_FILTERS = {
  reported: "source = 'user' AND reports > 0 AND hidden = 0 ORDER BY reports DESC, id DESC",
  hidden: "hidden = 1 ORDER BY id DESC",
  curated: "source = 'admin' ORDER BY id DESC",
  recent: "source = 'user' ORDER BY id DESC"
};

async function adminStats(env) {
  const now = Date.now();
  const startToday = Date.parse(kstDay() + "T00:00:00+09:00");
  const one = (sql, ...args) => env.DB.prepare(sql).bind(...args).first();
  const [total, today, hidden, reported, deliveries, readers, clicks, curated, thanks] = await Promise.all([
    one("SELECT COUNT(*) AS c FROM lights WHERE source = 'user'"),
    one("SELECT COUNT(*) AS c FROM lights WHERE source = 'user' AND created_at >= ?1", startToday),
    one("SELECT COUNT(*) AS c FROM lights WHERE hidden = 1"),
    one("SELECT COUNT(*) AS c FROM lights WHERE source = 'user' AND reports > 0 AND hidden = 0"),
    one("SELECT COALESCE(SUM(deliveries), 0) AS c FROM lights"),
    one("SELECT COUNT(*) AS c FROM presence WHERE last_seen > ?1", now - PRESENCE_WINDOW_MS),
    one("SELECT COUNT(*) AS c FROM clicks"),
    one("SELECT COUNT(*) AS c FROM lights WHERE source = 'admin'"),
    one("SELECT COALESCE(SUM(thanks), 0) AS c FROM lights")
  ]);
  const byStore = await env.DB.prepare("SELECT store, COUNT(*) AS c FROM clicks WHERE at >= ?1 GROUP BY store ORDER BY c DESC").bind(startToday).all();
  const topBooks = await env.DB.prepare("SELECT book, COUNT(*) AS c FROM clicks GROUP BY book ORDER BY c DESC LIMIT 5").all();
  return json({
    readersNow: readers.c, lightsTotal: total.c, lightsToday: today.c, hidden: hidden.c, reported: reported.c,
    curated: curated.c, thanksTotal: thanks.c, deliveriesTotal: deliveries.c, clicksTotal: clicks.c,
    clicksTodayByStore: byStore.results, topBooks: topBooks.results
  });
}
async function adminLights(env, url) {
  const where = ADMIN_FILTERS[url.searchParams.get("filter")] || ADMIN_FILTERS.recent;
  const rows = await env.DB
    .prepare("SELECT id, source, book, author, quote, note, created_at, deliveries, thanks, reports, hidden FROM lights WHERE " + where + " LIMIT 100")
    .all();
  return json({ lights: rows.results });
}
async function adminAction(request, env) {
  const b = await readBody(request);
  const id = Number(b && b.id);
  if (!b || !Number.isInteger(id) || !["hide", "restore", "delete"].includes(b.action)) return bad("잘못된 요청이에요.");
  if (b.action === "hide") {
    await env.DB.prepare("UPDATE lights SET hidden = 1 WHERE id = ?1").bind(id).run();
  } else if (b.action === "restore") {
    await env.DB.batch([
      env.DB.prepare("UPDATE lights SET hidden = 0, reports = 0 WHERE id = ?1").bind(id),
      env.DB.prepare("DELETE FROM reports WHERE light_id = ?1").bind(id)
    ]);
  } else {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM lights WHERE id = ?1").bind(id),
      env.DB.prepare("DELETE FROM seen WHERE light_id = ?1").bind(id),
      env.DB.prepare("DELETE FROM thanks WHERE light_id = ?1").bind(id),
      env.DB.prepare("DELETE FROM reports WHERE light_id = ?1").bind(id)
    ]);
  }
  return json({ ok: true });
}
// 관리자가 고른 문장을 새로 넣거나(id 없음) 고칩니다(id 있음).
async function adminCurated(request, env) {
  const b = await readBody(request);
  if (!b) return bad("잘못된 요청이에요.");
  const book = clean(b.book, 100), author = clean(b.author, 100), quote = clean(b.quote, 100), note = clean(b.note, 40);
  if (!book) return bad("책 제목을 적어 주세요.");
  if (quote.length < 2) return bad("문장을 적어 주세요.");
  if (b.id != null) {
    const id = Number(b.id);
    if (!Number.isInteger(id)) return bad("잘못된 요청이에요.");
    await env.DB
      .prepare("UPDATE lights SET book = ?2, author = ?3, quote = ?4, note = ?5 WHERE id = ?1 AND source = 'admin'")
      .bind(id, book, author, quote, note)
      .run();
    return json({ ok: true, id });
  }
  const ins = await env.DB
    .prepare("INSERT INTO lights (device, source, book, author, quote, note, created_at) VALUES ('admin', 'admin', ?1, ?2, ?3, ?4, ?5)")
    .bind(book, author, quote, note, Date.now())
    .run();
  return json({ ok: true, id: ins.meta.last_row_id });
}
// 관리자 문장이 하나도 없을 때만 기본 10개를 넣습니다.
async function adminSeed(env) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS c FROM lights WHERE source = 'admin'").first();
  if (r && r.c > 0) return json({ ok: true, added: 0 });
  const now = Date.now();
  await env.DB.batch(
    DEFAULT_CURATED.map((s, i) =>
      env.DB
        .prepare("INSERT INTO lights (device, source, book, author, quote, note, created_at) VALUES ('admin', 'admin', ?1, ?2, ?3, ?4, ?5)")
        .bind(s.book, s.author, s.quote, s.note, now + i)
    )
  );
  return json({ ok: true, added: DEFAULT_CURATED.length });
}

/* ---------- 라우팅 ---------- */
async function route(request, env, ctx, url) {
  if (url.pathname.startsWith("/api/admin/")) {
    const deny = await requireAdmin(request, env);
    if (deny) return deny;
  }
  const key = request.method + " " + url.pathname;
  switch (key) {
    case "GET /api/health": return json({ ok: true, stores: availableStores(env) });
    case "GET /api/books": return handleBooks(request, env, ctx, url);
    case "GET /api/presence": return handlePresence(env);
    case "POST /api/lights": return handleSend(request, env);
    case "POST /api/lights/delete": return handleWithdraw(request, env);
    case "POST /api/receive": return handleReceive(request, env);
    case "POST /api/thanks": return handleThanks(request, env);
    case "POST /api/mine": return handleMine(request, env);
    case "POST /api/report": return handleReport(request, env);
    case "POST /api/heartbeat": return handleHeartbeat(request, env);
    case "GET /api/admin/stats": return adminStats(env);
    case "GET /api/admin/lights": return adminLights(env, url);
    case "POST /api/admin/action": return adminAction(request, env);
    case "POST /api/admin/curated": return adminCurated(request, env);
    case "POST /api/admin/seed": return adminSeed(env);
    default: return json({ error: "not_found" }, 404);
  }
}

/* ---------- 정적 파일 ---------- */
// 기본은 wrangler.toml 의 [assets] 를 씁니다. 그게 없고 SITE(KV)가 있으면 KV에서 꺼내 줍니다. (wrangler.kv.toml)
const MIME = {
  html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", json: "application/json; charset=utf-8",
  md: "text/markdown; charset=utf-8", txt: "text/plain; charset=utf-8", mp3: "audio/mpeg", ogg: "audio/ogg", jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", svg: "image/svg+xml", ico: "image/x-icon", webp: "image/webp"
};
async function serveStatic(request, env) {
  if (env.ASSETS) return env.ASSETS.fetch(request);
  if (!env.SITE) return new Response("Not found", { status: 404 });
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  let key;
  try { key = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, ""); } catch (e) { return new Response("Bad request", { status: 400 }); }
  if (key === "") key = "index.html";
  if (key.includes("..")) return new Response("Not found", { status: 404 });
  const body = await env.SITE.get(key, "arrayBuffer");
  if (body === null) return new Response("Not found", { status: 404 });
  const ext = key.split(".").pop().toLowerCase();
  const isPage = ext === "html";
  return new Response(request.method === "HEAD" ? null : body, {
    headers: {
      "content-type": MIME[ext] || "application/octet-stream",
      "cache-control": isPage ? "no-cache" : "public, max-age=86400"
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isApi = url.pathname.startsWith("/api/");
    if (!isApi && url.pathname !== "/go") return serveStatic(request, env);
    try {
      if (url.pathname === "/go") return await handleGo(env, url);
      return await route(request, env, ctx, url);
    } catch (e) {
      console.error(e);
      return json({ error: "server", message: "잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요." }, 500);
    }
  }
};
