import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Era, Song } from '../types/song'

import vinylBall from '../svg/ranking-panel-left/icons/Vinyl.svg'
import cdBall from '../svg/ranking-panel-left/icons/Cd.svg'
import tapeBall from '../svg/ranking-panel-left/icons/Tape.svg'
import digitalBall from '../svg/ranking-panel-left/icons/Digital.svg'
import aiBall from '../svg/ranking-panel-right/icons/Ai.svg'

interface Props {
  songs: Song[]
  activeSong: Song | null
}

interface Position {
  x: number
  y: number
}

interface VoteQueueItem {
  songId: string
  amount: number
  sequence: number
}

type FlyStyle = CSSProperties & {
  '--ball-dx': string
  '--ball-dy': string
}

const BALL_SIZE = 49
const BALL_EDGE = BALL_SIZE / 2 + 6
const VOTE_EFFECT_MS = 1050

const ballIcons: Record<Era, string> = {
  vinyl: vinylBall,
  cd: cdBall,
  tape: tapeBall,
  digital: digitalBall,
  ai: aiBall,
}

const startPositions: Record<Era, Position> = {
  vinyl: { x: 338, y: 807 },
  cd: { x: 613, y: 890 },
  tape: { x: 910, y: 972 },
  digital: { x: 1230, y: 888 },
  ai: { x: 1495, y: 802 },
}

const targetDiamond = {
  top: { x: 935, y: 569 },
  right: { x: 1528, y: 758 },
  bottom: { x: 935, y: 944 },
  left: { x: 353, y: 758 },
}

function hashString(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededUnit(seed: string) {
  return hashString(seed) / 4294967295
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount
}

function getDiamondHorizontalBounds(y: number) {
  if (y <= targetDiamond.left.y) {
    const amount = (y - targetDiamond.top.y) / (targetDiamond.left.y - targetDiamond.top.y)

    return {
      left: lerp(targetDiamond.top.x, targetDiamond.left.x, amount),
      right: lerp(targetDiamond.top.x, targetDiamond.right.x, amount),
    }
  }

  const amount = (y - targetDiamond.left.y) / (targetDiamond.bottom.y - targetDiamond.left.y)

  return {
    left: lerp(targetDiamond.left.x, targetDiamond.bottom.x, amount),
    right: lerp(targetDiamond.right.x, targetDiamond.bottom.x, amount),
  }
}

function getTargetPosition(song: Song): Position {
  const minY = targetDiamond.top.y + BALL_EDGE * 2
  const maxY = targetDiamond.bottom.y - BALL_EDGE * 2
  const centerY = minY + seededUnit(song.id + ':y') * (maxY - minY)
  const upperBounds = getDiamondHorizontalBounds(centerY - BALL_EDGE)
  const lowerBounds = getDiamondHorizontalBounds(centerY + BALL_EDGE)
  const minX = Math.max(upperBounds.left, lowerBounds.left) + BALL_EDGE
  const maxX = Math.min(upperBounds.right, lowerBounds.right) - BALL_EDGE
  const centerX = minX + seededUnit(song.id + ':x') * (maxX - minX)

  return {
    x: Math.round(centerX - BALL_SIZE / 2),
    y: Math.round(centerY - BALL_SIZE / 2),
  }
}

export default function EraSongBalls({ songs, activeSong }: Props) {
  const [voteQueue, setVoteQueue] = useState<VoteQueueItem[]>([])
  const [activeVote, setActiveVote] = useState<VoteQueueItem | null>(null)
  const previousVotesRef = useRef<Map<string, number> | null>(null)
  const activeVoteRef = useRef<VoteQueueItem | null>(null)
  const sequenceRef = useRef(0)
  const flySong = activeSong && activeSong.era !== 'ai' ? activeSong : null
  const ballSongs = songs.filter((song) => song.era !== 'ai')
  const staticSongs = flySong ? ballSongs.filter((song) => song.id !== flySong.id) : ballSongs
  const staticSongIds = new Set(staticSongs.map((song) => song.id))
  const detachedVoteSong = activeVote ? ballSongs.find((song) => song.id === activeVote.songId && !staticSongIds.has(song.id)) : null

  const enqueueVoteIncrement = useCallback((songId: string, amount: number) => {
    const active = activeVoteRef.current

    if (active?.songId === songId) {
      const next = { ...active, amount: active.amount + amount }
      activeVoteRef.current = next
      setActiveVote(next)
      return
    }

    setVoteQueue((prev) => {
      const last = prev[prev.length - 1]

      if (last?.songId === songId) {
        return [...prev.slice(0, -1), { ...last, amount: last.amount + amount }]
      }

      sequenceRef.current += 1
      return [...prev, { songId, amount, sequence: sequenceRef.current }]
    })
  }, [])

  useEffect(() => {
    activeVoteRef.current = activeVote
  }, [activeVote])

  useEffect(() => {
    const nextVotes = new Map(songs.map((song) => [song.id, song.votes]))
    const previousVotes = previousVotesRef.current

    if (previousVotes) {
      songs.forEach((song) => {
        const previousVote = previousVotes.get(song.id)

        if (previousVote !== undefined && song.votes > previousVote) {
          enqueueVoteIncrement(song.id, song.votes - previousVote)
        }
      })
    }

    previousVotesRef.current = nextVotes
  }, [enqueueVoteIncrement, songs])

  useEffect(() => {
    if (activeVote || voteQueue.length === 0) return

    const [next, ...rest] = voteQueue
    activeVoteRef.current = next
    setActiveVote(next)
    setVoteQueue(rest)
  }, [activeVote, voteQueue])

  useEffect(() => {
    if (!activeVote) return

    const timer = setTimeout(() => {
      activeVoteRef.current = null
      setActiveVote(null)
    }, VOTE_EFFECT_MS)

    return () => clearTimeout(timer)
  }, [activeVote])

  const renderSongBall = (song: Song, voteEffect: VoteQueueItem | null) => {
    const position = getTargetPosition(song)
    const floatDelay = `${(seededUnit(song.id + ':float') * -4).toFixed(2)}s`

    return (
      <div
        key={voteEffect ? `${song.id}:${voteEffect.sequence}` : song.id}
        className={'absolute h-[49px] w-[49px] ' + (voteEffect ? 'era-song-ball-vote-bounce' : '')}
        style={{ left: position.x, top: position.y }}
      >
        <span className="era-song-ball-float absolute inset-0" style={{ animationDelay: floatDelay }}>
          <img src={ballIcons[song.era]} alt="" className="h-full w-full select-none" />
        </span>
        {voteEffect ? (
          <div className="era-song-ball-vote-plus absolute left-1/2 top-[-18px] rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[18px] font-black leading-none text-white shadow-[0_0_18px_rgba(255,255,255,0.45)]">
            +{voteEffect.amount}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[6]">
      {staticSongs.map((song) => {
        const voteEffect = activeVote?.songId === song.id ? activeVote : null

        return renderSongBall(song, voteEffect)
      })}

      {detachedVoteSong ? renderSongBall(detachedVoteSong, activeVote) : null}

      {flySong ? (
        <img
          key={flySong.id}
          src={ballIcons[flySong.era]}
          alt=""
          className="era-song-ball-fly absolute h-[49px] w-[49px] select-none"
          style={getFlyStyle(flySong)}
        />
      ) : null}
    </div>
  )
}

function getFlyStyle(song: Song): FlyStyle {
  const start = startPositions[song.era]
  const target = getTargetPosition(song)

  return {
    left: start.x,
    top: start.y,
    '--ball-dx': `${target.x - start.x}px`,
    '--ball-dy': `${target.y - start.y}px`,
  }
}
