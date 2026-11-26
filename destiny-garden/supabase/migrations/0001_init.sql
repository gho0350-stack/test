-- 운명의 정원 초기 스키마 (Supabase PostgreSQL). 컬렉션 이름은 src/lib/server/db.ts 와 1:1 대응.
-- 모든 사용자 데이터 테이블에 RLS 를 적용한다. 서버(service_role)만 결제·질문권·퀘스트 보상 테이블에 쓴다.

create extension if not exists pgcrypto;

-- ───────── 회원/출생 정보 ─────────
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 12),
  avatar_id smallint not null default 0 check (avatar_id between 0 and 2),
  exp integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.birth_profiles (  -- 개인정보: 최소 수집
  user_id uuid primary key references auth.users(id) on delete cascade,
  calendar text not null check (calendar in ('solar','lunar')),
  year smallint not null, month smallint not null, day smallint not null, is_leap_month boolean not null default false,
  hour smallint, minute smallint, hour_unknown boolean not null default false,
  gender text not null check (gender in ('female','male')),
  region text, longitude_correction boolean not null default false, night_zi text not null default 'same_day',
  created_at timestamptz not null default now()
);
create table public.saju_charts (     -- 게임 데이터와 분리된 사주 계산 원본 (결정론적 엔진 결과)
  user_id uuid primary key references auth.users(id) on delete cascade,
  chart jsonb not null, engine text not null, created_at timestamptz not null default now()
);
create table public.destiny_cards (id int primary key, day_pillar text not null, name text not null, rarity text not null, data jsonb not null, review_status text not null default 'pending');
create table public.user_destiny_cards (user_id uuid references auth.users(id) on delete cascade, card_id int references public.destiny_cards(id), acquired_at timestamptz not null default now(), primary key (user_id, card_id));

-- ───────── 게임 데이터 ─────────
create table public.game_maps (id text primary key, name text not null, background text, size jsonb not null);
create table public.game_buildings (id text primary key, map_id text references public.game_maps(id), name text not null, pos jsonb not null, door jsonb not null, content text not null, npc_id text);
create table public.game_npcs (id text primary key, name text not null, topic text not null, style text not null, greeting text, suggested jsonb not null default '[]');
create table public.avatars (user_id uuid primary key references auth.users(id) on delete cascade, body_type smallint not null default 0);
create table public.avatar_items (id text primary key, name text not null, kind text not null, price integer not null default 0);
create table public.user_inventory (user_id uuid references auth.users(id) on delete cascade, item_id text references public.avatar_items(id), acquired_at timestamptz not null default now(), primary key (user_id, item_id));
create table public.user_positions (user_id uuid primary key references auth.users(id) on delete cascade, x real not null, z real not null, updated_at timestamptz not null default now());
create table public.quests (id text primary key, sort_order int not null, title text not null, hint text, event text not null, reward_exp int not null default 0, reward_coins int not null default 0, active boolean not null default true);
create table public.quest_progress (user_id uuid references auth.users(id) on delete cascade, quest_id text references public.quests(id), completed_at timestamptz not null default now(), primary key (user_id, quest_id));
create table public.game_rewards (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, quest_id text, exp int not null, coins int not null, created_at timestamptz not null default now());
create table public.tarot_cards (id int primary key, arcana text not null, name text not null, name_en text, suit text, upright text, reversed text, review_status text not null default 'pending');
create table public.tarot_draws (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, draw_date date not null, position smallint not null, card_id int references public.tarot_cards(id), reversed boolean not null, created_at timestamptz not null default now(), unique (user_id, draw_date));
create table public.relationships (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, name text not null, relation text, birth jsonb not null, chart jsonb not null, created_at timestamptz not null default now());

-- ───────── 상담 ─────────
create table public.consultations (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, npc_id text references public.game_npcs(id), topic text, created_at timestamptz not null default now(), unique (user_id, npc_id));
create table public.consultation_messages (id uuid primary key default gen_random_uuid(), consultation_id uuid references public.consultations(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade, npc_id text, role text not null check (role in ('user','npc')), content jsonb not null, cost smallint not null default 0, created_at timestamptz not null default now());
create table public.consultation_summaries (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, npc_id text, topic text, summary text not null, created_at timestamptz not null default now());
create table public.ai_usage_logs (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, npc_id text, model text, ok boolean not null, ms int, tokens int, error text, created_at timestamptz not null default now());

-- ───────── 상품/결제/질문권 ─────────
create table public.products (id text primary key, kind text not null check (kind in ('ticket','report','item')), name text not null, price integer not null check (price >= 0), amount integer, active boolean not null default true);
create table public.orders (id text primary key, user_id uuid not null references auth.users(id), product_id text not null references public.products(id), amount integer not null, partner_id uuid, status text not null check (status in ('pending','paid','refunded','failed')), created_at timestamptz not null default now());
create table public.payments (id uuid primary key default gen_random_uuid(), order_id text not null references public.orders(id), user_id uuid not null references auth.users(id), payment_key text not null unique, amount integer not null, status text not null check (status in ('DONE','CANCELED')), provider text not null, raw jsonb, created_at timestamptz not null default now());
create table public.credit_wallets (user_id uuid primary key references auth.users(id) on delete cascade, tickets integer not null default 0 check (tickets >= 0), coins integer not null default 0 check (coins >= 0));
create table public.credit_ledger (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), delta integer not null, kind text not null, ref text, created_at timestamptz not null default now(), unique (user_id, ref));  -- ref 유니크 = 지급/환불 멱등성
create table public.reports (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, product_id text references public.products(id), partner_id uuid, content jsonb not null, source text, created_at timestamptz not null default now());
create table public.consent_logs (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), kind text not null, version text not null, created_at timestamptz not null default now());

-- ───────── RLS ─────────
do $$
declare t text;
begin
  -- 본인 행만 읽기/쓰기 가능한 테이블
  foreach t in array array['profiles','birth_profiles','avatars','user_positions','relationships','consultations','consultation_messages','consultation_summaries','tarot_draws'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_own', t);
  end loop;
  -- 본인 행 읽기만 가능 (쓰기는 서버 service_role 전용: 위변조 방지)
  foreach t in array array['saju_charts','user_destiny_cards','quest_progress','game_rewards','user_inventory','orders','payments','credit_wallets','credit_ledger','reports','ai_usage_logs','consent_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (user_id = auth.uid())', t || '_read_own', t);
  end loop;
  -- 공개 카탈로그: 로그인 사용자 읽기 전용
  foreach t in array array['destiny_cards','game_maps','game_buildings','game_npcs','avatar_items','quests','tarot_cards','products'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (auth.role() = ''authenticated'')', t || '_catalog', t);
  end loop;
end $$;

-- 질문권 차감은 반드시 원자적으로(서버 함수). 잔액 음수는 check 제약으로도 방지된다.
create or replace function public.spend_tickets(p_user uuid, p_cost int, p_ref text) returns int
language plpgsql security definer set search_path = public as $$
declare bal int;
begin
  insert into credit_ledger(user_id, delta, kind, ref) values (p_user, -p_cost, 'consult_reserve', p_ref) on conflict (user_id, ref) do nothing;
  update credit_wallets set tickets = tickets - p_cost where user_id = p_user and tickets >= p_cost returning tickets into bal;
  if bal is null then raise exception 'INSUFFICIENT_TICKETS'; end if;
  return bal;
end $$;
revoke all on function public.spend_tickets from public, anon, authenticated;
