create or replace function public.vote_song(song_id uuid)
returns public.songs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_song public.songs%rowtype;
begin
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

drop table if exists public.song_vote_ip_limits;
