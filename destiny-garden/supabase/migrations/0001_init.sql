-- 운명의 정원 스키마 (Supabase PostgreSQL). Supabase SQL Editor 에 전체를 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.
-- 접근 모델: 브라우저는 DB에 직접 접근하지 않고, 서버(service_role)만 읽고 씁니다. RLS 는 직접 접근 차단/본인 행 제한용 안전장치입니다.
-- 컬럼 이름은 src/lib/server/db.ts 의 컬렉션과 1:1 대응합니다.

create extension if not exists pgcrypto;

-- ───────── 사용자 데이터 ─────────
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 12),
  avatar_id smallint not null default 0 check (avatar_id between 0 and 2),
  exp integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.birth_profiles (   -- 개인정보(최소 수집). 입력 원본은 data(jsonb)
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.saju_charts (      -- 게임 데이터와 분리된 사주 계산 원본(결정론적 엔진 결과)
  user_id uuid primary key references auth.users(id) on delete cascade,
  chart jsonb not null, engine text not null, created_at timestamptz not null default now()
);
create table if not exists public.avatars (user_id uuid primary key references auth.users(id) on delete cascade, body_type smallint not null default 0);
create table if not exists public.user_positions (user_id uuid primary key references auth.users(id) on delete cascade, x real not null, z real not null, updated_at timestamptz not null default now());
create table if not exists public.user_destiny_cards (user_id uuid references auth.users(id) on delete cascade, card_id int, acquired_at timestamptz not null default now(), primary key (user_id, card_id));
create table if not exists public.quest_progress (user_id uuid references auth.users(id) on delete cascade, quest_id text, completed_at timestamptz not null default now(), primary key (user_id, quest_id));
create table if not exists public.game_rewards (id text primary key, user_id uuid references auth.users(id) on delete cascade, quest_id text, exp int not null, coins int not null, created_at timestamptz not null default now());
create table if not exists public.tarot_draws (id text primary key, user_id uuid references auth.users(id) on delete cascade, draw_date date not null, position smallint not null, card_id int not null, reversed boolean not null, created_at timestamptz not null default now(), unique (user_id, draw_date));
create table if not exists public.relationships (id text primary key, user_id uuid references auth.users(id) on delete cascade, name text not null, relation text, birth jsonb not null, chart jsonb not null, created_at timestamptz not null default now());
create table if not exists public.consultations (id text primary key, user_id uuid references auth.users(id) on delete cascade, npc_id text not null, topic text, created_at timestamptz not null default now(), unique (user_id, npc_id));
create table if not exists public.consultation_messages (id text primary key, consultation_id text not null, user_id uuid references auth.users(id) on delete cascade, npc_id text not null, role text not null check (role in ('user','npc')), content jsonb not null, cost smallint not null default 0, created_at timestamptz not null default now());
create table if not exists public.consultation_summaries (id text primary key, user_id uuid references auth.users(id) on delete cascade, npc_id text not null, topic text, summary text not null, created_at timestamptz not null default now());
create table if not exists public.ai_usage_logs (id text primary key, user_id uuid references auth.users(id) on delete cascade, npc_id text, model text, ok boolean not null, ms int, tokens int, error text, created_at timestamptz not null default now());
create table if not exists public.reports (id text primary key, user_id uuid references auth.users(id) on delete cascade, product_id text not null, partner_id text, content jsonb not null, source text, created_at timestamptz not null default now());
create table if not exists public.consent_logs (id text primary key, user_id uuid references auth.users(id) on delete set null, kind text not null, version text not null, created_at timestamptz not null default now());

-- ───────── 결제/질문권: 계정 삭제 후에도 전자상거래 기록 보관을 위해 user_id 는 set null ─────────
create table if not exists public.credit_wallets (user_id uuid primary key references auth.users(id) on delete cascade, tickets integer not null default 0 check (tickets >= 0), coins integer not null default 0 check (coins >= 0));
create table if not exists public.credit_ledger (id text primary key, user_id uuid references auth.users(id) on delete set null, delta integer not null, kind text not null, ref text, created_at timestamptz not null default now());
create unique index if not exists credit_ledger_user_ref on public.credit_ledger (user_id, ref) where ref is not null;   -- 지급/환불 멱등성
create table if not exists public.orders (id text primary key, user_id uuid references auth.users(id) on delete set null, product_id text not null, amount integer not null, partner_id text, status text not null check (status in ('pending','paid','refunded','failed')), created_at timestamptz not null default now());
create table if not exists public.payments (id text primary key, order_id text not null references public.orders(id), user_id uuid references auth.users(id) on delete set null, payment_key text not null unique, amount integer not null, status text not null check (status in ('DONE','CANCELED')), provider text not null, raw jsonb, created_at timestamptz not null default now());

-- ───────── 관리자 편집용 카탈로그(현재 앱은 data/*.json 을 사용. 추후 관리자 화면에서 이 테이블로 이관) ─────────
create table if not exists public.game_maps (id text primary key, data jsonb not null);
create table if not exists public.game_buildings (id text primary key, data jsonb not null);
create table if not exists public.game_npcs (id text primary key, data jsonb not null);
create table if not exists public.quests (id text primary key, sort_order int not null default 0, active boolean not null default true, data jsonb not null);
create table if not exists public.products (id text primary key, active boolean not null default true, data jsonb not null);
create table if not exists public.destiny_cards (id int primary key, data jsonb not null, review_status text not null default 'pending');
create table if not exists public.tarot_cards (id int primary key, data jsonb not null, review_status text not null default 'pending');
create table if not exists public.avatar_items (id text primary key, data jsonb not null);
create table if not exists public.user_inventory (user_id uuid references auth.users(id) on delete cascade, item_id text, acquired_at timestamptz not null default now(), primary key (user_id, item_id));

-- ───────── RLS: 모든 테이블 활성화. 정책은 본인 행 '읽기'만 허용(쓰기는 서버 service_role 전용) ─────────
do $$
declare t text;
begin
  foreach t in array array['profiles','birth_profiles','saju_charts','avatars','user_positions','user_destiny_cards','quest_progress','game_rewards','tarot_draws','relationships','consultations','consultation_messages','consultation_summaries','ai_usage_logs','reports','consent_logs','credit_wallets','credit_ledger','orders','payments','user_inventory'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_read_own', t);
    execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid())', t || '_read_own', t);
  end loop;
  foreach t in array array['game_maps','game_buildings','game_npcs','quests','products','destiny_cards','tarot_cards','avatar_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_catalog', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_catalog', t);
  end loop;
end $$;

-- ───────── 서버 전용 권한 ─────────
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant select on all tables in schema public to authenticated;

-- ───────── 원자적 쓰기: 한 번의 호출 = 한 트랜잭션. 질문권 지갑은 낙관적 잠금(CAS)으로 이중 차감 방지 ─────────
create or replace function public.dg_apply(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  allowed text[] := array['profiles','birth_profiles','saju_charts','avatars','user_positions','user_destiny_cards','quest_progress','game_rewards','tarot_draws','relationships','consultations','consultation_messages','consultation_summaries','ai_usage_logs','reports','consent_logs','credit_ledger','orders','payments'];
  w jsonb := p->'wallet'; t text; rws jsonb; pk text[]; cols text; setl text; pkc text; cond text;
begin
  if w is not null and w <> 'null'::jsonb then
    if w->'old' is null or w->'old' = 'null'::jsonb then
      insert into credit_wallets(user_id, tickets, coins) values ((w->'new'->>'user_id')::uuid, (w->'new'->>'tickets')::int, (w->'new'->>'coins')::int);
    else
      update credit_wallets set tickets = (w->'new'->>'tickets')::int, coins = (w->'new'->>'coins')::int
       where user_id = (w->'new'->>'user_id')::uuid and tickets = (w->'old'->>'tickets')::int and coins = (w->'old'->>'coins')::int;
      if not found then raise exception 'DG_CONFLICT'; end if;
    end if;
  end if;

  for t, rws in select key, value from jsonb_each(coalesce(p->'deletes', '{}'::jsonb)) loop
    if not (t = any(allowed)) then raise exception 'bad table %', t; end if;
    select array_agg(a.attname::text order by a.attnum) into pk from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey) where i.indrelid = ('public.' || quote_ident(t))::regclass and i.indisprimary;
    select string_agg(format('x.%1$I = k.%1$I', c), ' and ') into cond from unnest(pk) c;
    execute format('delete from public.%I x using jsonb_populate_recordset(null::public.%I, $1) k where %s', t, t, cond) using rws;
  end loop;

  for t, rws in select key, value from jsonb_each(coalesce(p->'upserts', '{}'::jsonb)) loop
    if not (t = any(allowed)) then raise exception 'bad table %', t; end if;
    select array_agg(a.attname::text order by a.attnum) into pk from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey) where i.indrelid = ('public.' || quote_ident(t))::regclass and i.indisprimary;
    select string_agg(quote_ident(column_name), ',' order by ordinal_position) into cols from information_schema.columns where table_schema = 'public' and table_name = t;
    select string_agg(format('%1$I = excluded.%1$I', column_name), ',') into setl from information_schema.columns where table_schema = 'public' and table_name = t and column_name <> all(pk);
    select string_agg(quote_ident(c), ',') into pkc from unnest(pk) c;
    execute format('insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1) on conflict (%s) do update set %s', t, cols, cols, t, pkc, coalesce(setl, pkc || ' = excluded.' || split_part(pkc, ',', 1))) using rws;
  end loop;
end $$;
revoke all on function public.dg_apply(jsonb) from public, anon, authenticated;
grant execute on function public.dg_apply(jsonb) to service_role;
