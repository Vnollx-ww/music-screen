import { apiRequest } from './api'
import { normalizeEra } from './eraConfig'
import type { Song, SongRow, CreateSongInput, UpdateSongInput } from '../types/song'

export function normalizeSongRow(row: SongRow): Song {
  return {
    id: row.id,
    music_id: row.music_id?.trim() || null,
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
  const data = await apiRequest<SongRow[]>('/songs')
  return data.map((r) => normalizeSongRow(r))
}

export async function insertSong(input: CreateSongInput): Promise<Song> {
  const data = await apiRequest<SongRow>('/songs', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title.trim(),
      music_id: input.music_id?.trim() || undefined,
      artist: input.artist?.trim() || '匿名投稿',
      era: input.era,
    }),
  })
  return normalizeSongRow(data)
}

export async function voteSong(songId: string): Promise<Song> {
  const data = await apiRequest<SongRow>(`/songs/${encodeURIComponent(songId)}/vote`, {
    method: 'POST',
  })
  return normalizeSongRow(data)
}

export async function updateSong(songId: string, input: UpdateSongInput): Promise<Song> {
  const payload: Record<string, unknown> = {}
  if ('title' in input) payload.title = input.title?.trim()
  if ('music_id' in input) payload.music_id = input.music_id?.trim() || null
  if ('artist' in input) payload.artist = input.artist?.trim() || null
  if ('era' in input) payload.era = input.era
  if ('votes' in input) payload.votes = input.votes
  if ('play_count' in input) payload.play_count = input.play_count
  if ('recommend_count' in input) payload.recommend_count = input.recommend_count

  const data = await apiRequest<SongRow>(`/songs/${encodeURIComponent(songId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return normalizeSongRow(data)
}

export async function deleteSong(songId: string): Promise<void> {
  await apiRequest<void>(`/songs/${encodeURIComponent(songId)}`, {
    method: 'DELETE',
  })
}

