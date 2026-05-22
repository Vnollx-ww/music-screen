create table if not exists public.song_vote_ip_limits (
  ip_address inet primary key,
  vote_count integer not null default 0,
  first_voted_at timestamp with time zone not null default now(),
  last_voted_at timestamp with time zone not null default now()
);

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

create index if not exists song_vote_ip_limits_last_voted_at_desc_idx
on public.song_vote_ip_limits (last_voted_at desc);

alter table public.song_vote_ip_limits enable row level security;

revoke all on table public.song_vote_ip_limits from public, anon, authenticated;

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
