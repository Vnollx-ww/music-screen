import { supabase } from './supabase'
import { normalizeEra } from './eraConfig'
import type { Song, SongRow, CreateSongInput } from '../types/song'

export function normalizeSongRow(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title?.trim() || '未命名歌曲',
    artist: row.artist?.trim() || '匿名创作者',
    era: normalizeEra(row.era),
    votes: row.votes ?? 0,
    play_count: row.play_count ?? 0,
    recommend_count: row.recommend_count ?? 0,
    created_at: row.created_at ?? new Date().toISOString(),
  }
}

export function calcScore(s: Song): number {
  return s.play_count * 5 + s.recommend_count * 3 + s.votes
}

export async function fetchSongs(): Promise<Song[]> {
  const { data, error } = await supabase.from('songs').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => normalizeSongRow(r as unknown as SongRow))
}

export async function insertSong(input: CreateSongInput): Promise<Song> {
  const { data, error } = await supabase
    .from('songs')
    .insert({
      title: input.title.trim(),
      artist: input.artist?.trim() || '匿名投稿',
      era: input.era,
      votes: 1,
      play_count: 0,
      recommend_count: 1,
    })
    .select('*')
    .single()
  if (error) throw error
  return normalizeSongRow(data as unknown as SongRow)
}

export async function voteSong(songId: string): Promise<Song> {
  const { data: current, error: fetchError } = await supabase
    .from('songs')
    .select('*')
    .eq('id', songId)
    .single()

  if (fetchError) throw fetchError

  const row = normalizeSongRow(current as unknown as SongRow)
  const { data, error } = await supabase
    .from('songs')
    .update({ votes: row.votes + 1 })
    .eq('id', songId)
    .select('*')
    .single()

  if (error) throw error
  return normalizeSongRow(data as unknown as SongRow)
}
