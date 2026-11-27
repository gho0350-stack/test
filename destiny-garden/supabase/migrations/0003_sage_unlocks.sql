-- 0003: 현자 상담 해금(방의 카드를 모두 모으면 해금, 현자별 첫 상담 무료). Supabase SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전합니다.
create table if not exists public.user_sage_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  sage_id text not null,
  unlocked_at timestamptz not null default now(),
  free_remaining int not null default 1 check (free_remaining >= 0),
  primary key (user_id, sage_id)
);
alter table public.user_sage_unlocks enable row level security;
drop policy if exists user_sage_unlocks_read_own on public.user_sage_unlocks;
create policy user_sage_unlocks_read_own on public.user_sage_unlocks for select to authenticated using (user_id = auth.uid());
grant all on public.user_sage_unlocks to service_role;
grant select on public.user_sage_unlocks to authenticated;

-- dg_apply: 쓰기 허용 테이블 목록에 user_sage_unlocks 추가
create or replace function public.dg_apply(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  allowed text[] := array['profiles','birth_profiles','saju_charts','avatars','user_positions','user_destiny_cards','user_cards','user_sage_unlocks','quest_progress','game_rewards','tarot_draws','relationships','consultations','consultation_messages','consultation_summaries','ai_usage_logs','reports','consent_logs','credit_ledger','orders','payments'];
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
