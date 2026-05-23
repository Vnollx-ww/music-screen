import { useCallback, useEffect, useRef, useState } from 'react'
import { getWebSocketUrl } from '../lib/api'
import { fetchSongs, normalizeSongRow } from '../lib/songs'
import type { Song, SongRow, RealtimeStatus } from '../types/song'

type SongRealtimeEvent = {
  type: 'insert' | 'update' | 'delete'
  song?: SongRow | null
  song_id?: string | null
}

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

    let stopped = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof window.setTimeout> | null = null

    const connect = () => {
      setStatus('CONNECTING')
      socket = new WebSocket(getWebSocketUrl())

      socket.onopen = () => {
        setStatus('SUBSCRIBED')
      }

      socket.onmessage = (event) => {
        let payload: SongRealtimeEvent
        try {
          payload = JSON.parse(event.data) as SongRealtimeEvent
        } catch {
          return
        }

        if (payload.type === 'delete') {
          if (payload.song_id) setSongs((prev) => prev.filter((x) => x.id !== payload.song_id))
          return
        }

        if (!payload.song) return
        const song = normalizeSongRow(payload.song)

        if (payload.type === 'insert') {
          setSongs((prev) => [song, ...prev.filter((x) => x.id !== song.id)])
          cbRef.current?.(song)
          return
        }

        setSongs((prev) => {
          const exists = prev.some((x) => x.id === song.id)
          if (exists) return prev.map((x) => (x.id === song.id ? song : x))
          return [song, ...prev]
        })
      }

      socket.onerror = () => {
        setStatus('CHANNEL_ERROR')
      }

      socket.onclose = () => {
        if (stopped) return
        setStatus('CLOSED')
        reconnectTimer = window.setTimeout(connect, 2000)
      }
    }

    connect()

    return () => {
      stopped = true
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [refresh])

  return { songs, loading, error, status, refresh, upsertSong }
}
