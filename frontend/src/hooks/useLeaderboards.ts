import { useMemo } from 'react'
import { calcScore } from '../lib/songs'
import type { Song } from '../types/song'

function sorted(arr: Song[]) {
  return [...arr].sort((a, b) => calcScore(b) - calcScore(a))
}

export function useLeaderboards(songs: Song[]) {
  return useMemo(() => ({
    classic: sorted(songs.filter((s) => s.era !== 'ai')).slice(0, 5),
    ai: sorted(songs.filter((s) => s.era === 'ai')).slice(0, 5),
  }), [songs])
}
