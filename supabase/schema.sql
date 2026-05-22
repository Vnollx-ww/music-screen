create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
set search_path = public, extensions, pg_temp;

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  era text not null default 'digital',
  votes integer not null default 0,
  play_count integer not null default 0,
  recommend_count integer not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.song_vote_ip_limits (
  ip_address inet primary key,
  vote_count integer not null default 0,
  first_voted_at timestamp with time zone not null default now(),
  last_voted_at timestamp with time zone not null default now()
);

alter table public.songs add column if not exists id uuid default gen_random_uuid();
alter table public.songs add column if not exists title text;
alter table public.songs add column if not exists artist text;
alter table public.songs add column if not exists era text default 'digital';
alter table public.songs add column if not exists votes integer default 0;
alter table public.songs add column if not exists play_count integer default 0;
alter table public.songs add column if not exists recommend_count integer default 0;
alter table public.songs add column if not exists created_at timestamp with time zone default now();

update public.songs set title = '未命名歌曲' where title is null or length(btrim(title)) = 0;
update public.songs set id = gen_random_uuid() where id is null;
update public.songs set era = 'digital' where era is null or era not in ('vinyl', 'tape', 'cd', 'digital', 'ai');
update public.songs set votes = 0 where votes is null;
update public.songs set play_count = 0 where play_count is null;
update public.songs set recommend_count = 0 where recommend_count is null;
update public.songs set created_at = now() where created_at is null;

alter table public.songs alter column id set default gen_random_uuid();
alter table public.songs alter column id set not null;
alter table public.songs alter column title set not null;
alter table public.songs alter column era set default 'digital';
alter table public.songs alter column era set not null;
alter table public.songs alter column votes set default 0;
alter table public.songs alter column votes set not null;
alter table public.songs alter column play_count set default 0;
alter table public.songs alter column play_count set not null;
alter table public.songs alter column recommend_count set default 0;
alter table public.songs alter column recommend_count set not null;
alter table public.songs alter column created_at set default now();
alter table public.songs alter column created_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.songs'::regclass
      and contype = 'p'
  ) then
    alter table public.songs add primary key (id);
  end if;
end;
$$;

create index if not exists songs_created_at_desc_idx on public.songs (created_at desc);
create index if not exists songs_votes_desc_idx on public.songs (votes desc);
create index if not exists song_vote_ip_limits_last_voted_at_desc_idx on public.song_vote_ip_limits (last_voted_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'songs_era_check'
      and conrelid = 'public.songs'::regclass
  ) then
    alter table public.songs
      add constraint songs_era_check check (era in ('vinyl', 'tape', 'cd', 'digital', 'ai'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'song_vote_ip_limits_vote_count_check'
      and conrelid = 'public.song_vote_ip_limits'::regclass
  ) then
    alter table public.song_vote_ip_limits
      add constraint song_vote_ip_limits_vote_count_check check (vote_count between 0 and 3);
  end if;
end;
$$;

alter table public.songs enable row level security;
alter table public.song_vote_ip_limits enable row level security;
alter table public.songs replica identity full;

revoke all on table public.songs from anon, authenticated;
revoke all on table public.song_vote_ip_limits from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert on table public.songs to anon, authenticated;

drop policy if exists songs_select_public on public.songs;
create policy songs_select_public
on public.songs
for select
to anon, authenticated
using (true);

drop policy if exists songs_insert_public on public.songs;
create policy songs_insert_public
on public.songs
for insert
to anon, authenticated
with check (
  title is not null
  and length(btrim(title)) > 0
  and era in ('vinyl', 'tape', 'cd', 'digital', 'ai')
  and votes = 1
  and play_count = 0
  and recommend_count = 1
);

do $$
begin
  alter publication supabase_realtime add table public.songs;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

create or replace function public.vote_song(song_id uuid)
returns public.songs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_song public.songs%rowtype;
  request_headers jsonb;
  ip_text text;
  voter_ip inet;
  new_vote_count integer;
begin
  request_headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  ip_text := nullif(btrim(split_part(coalesce(request_headers->>'x-forwarded-for', ''), ',', 1)), '');

  if ip_text is null then
    ip_text := nullif(btrim(coalesce(request_headers->>'cf-connecting-ip', '')), '');
  end if;

  if ip_text is null then
    ip_text := nullif(btrim(coalesce(request_headers->>'x-real-ip', '')), '');
  end if;

  if ip_text is null then
    raise exception '无法识别投票 IP，请稍后重试'
      using errcode = 'P0001',
            hint = 'vote_song 需要通过 Supabase API 调用以读取请求 IP。';
  end if;

  begin
    voter_ip := ip_text::inet;
  exception
    when invalid_text_representation then
      raise exception '无法识别投票 IP，请稍后重试'
        using errcode = 'P0001',
              detail = format('Invalid IP value: %s', ip_text);
  end;

  insert into public.song_vote_ip_limits (ip_address, vote_count, first_voted_at, last_voted_at)
  values (voter_ip, 1, now(), now())
  on conflict (ip_address) do update
  set vote_count = public.song_vote_ip_limits.vote_count + 1,
      last_voted_at = now()
  where public.song_vote_ip_limits.vote_count < 3
  returning vote_count into new_vote_count;

  if new_vote_count is null then
    raise exception '当前 IP 投票次数已达上限'
      using errcode = 'P0001',
            hint = '每个 IP 最多只能投票 3 次。';
  end if;

  update public.songs
  set votes = coalesce(votes, 0) + 1
  where id = song_id
  returning * into updated_song;

  if not found then
    raise exception 'Song % not found', song_id
      using errcode = 'P0002',
            hint = 'Check that the song exists and that the vote_song RPC argument uses the correct id.';
  end if;

  return updated_song;
end;
$$;

revoke all on function public.vote_song(uuid) from public;
grant execute on function public.vote_song(uuid) to anon, authenticated;
