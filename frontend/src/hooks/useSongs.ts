import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSongs, normalizeSongRow } from '../lib/songs'
import { supabase } from '../lib/supabase'
import type { Song, SongRow, RealtimeStatus } from '../types/song'

export function useSongs(onNewSong?: (s: Song) => void) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<RealtimeStatus>('CONNECTING')
  const cbRef = useRef(onNewSong)
  cbRef.current = onNewSong

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setSongs(await fetchSongs())
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const upsertSong = useCallback((song: Song) => {
    setSongs((prev) => {
      const exists = prev.some((x) => x.id === song.id)
      if (exists) return prev.map((x) => (x.id === song.id ? song : x))
      return [song, ...prev]
    })
  }, [])

  useEffect(() => {
    void refresh()
    const channel = supabase
      .channel('songs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'songs' }, (payload) => {
        const s = normalizeSongRow(payload.new as SongRow)
        setSongs((prev) => [s, ...prev.filter((x) => x.id !== s.id)])
        cbRef.current?.(s)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'songs' }, (payload) => {
        const s = normalizeSongRow(payload.new as SongRow)
        setSongs((prev) => prev.map((x) => (x.id === s.id ? s : x)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'songs' }, (payload) => {
        const old = payload.old as Partial<SongRow>
        if (old.id) setSongs((prev) => prev.filter((x) => x.id !== old.id))
      })
      .subscribe((s) => setStatus(s as RealtimeStatus))
    return () => { void supabase.removeChannel(channel) }
  }, [refresh])

  return { songs, loading, error, status, refresh, upsertSong }
}
