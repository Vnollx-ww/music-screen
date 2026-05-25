export type Era = 'vinyl' | 'tape' | 'cd' | 'digital' | 'ai'

export interface Song {
  id: string
  music_id: string | null
  title: string
  artist: string
  era: Era
  votes: number
  play_count: number
  recommend_count: number
  created_at: string
}

export interface SongRow {
  id: string
  music_id: string | null
  title: string | null
  artist: string | null
  era: string | null
  votes: number | null
  play_count: number | null
  recommend_count: number | null
  created_at: string | null
}

export interface CreateSongInput {
  title: string
  music_id?: string
  artist?: string
  era: Era
}

export interface UpdateSongInput {
  title?: string
  music_id?: string | null
  artist?: string | null
  era?: Era
  votes?: number
  play_count?: number
  recommend_count?: number
}

export type RealtimeStatus = 'CONNECTING' | 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'
