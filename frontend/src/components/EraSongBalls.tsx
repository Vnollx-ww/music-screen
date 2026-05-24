import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Era, Song } from '../types/song'

import record1Svg from '../svg/center-records/Record1.svg?raw'
import record2Svg from '../svg/center-records/Record2.svg?raw'
import record3Svg from '../svg/center-records/Record3.svg?raw'
import record4Svg from '../svg/center-records/Record4.svg?raw'
import record5Svg from '../svg/center-records/Record5.svg?raw'
import record6Svg from '../svg/center-records/Record6.svg?raw'
import aiMusicBallEnterDiamondSvg from '../svg/center-records/AiMusicBallEnterDiamond.svg?raw'

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

interface BallArtwork {
  id: string
  svg: string
}

const BALL_SIZE = 49
const BALL_EDGE = BALL_SIZE / 2 + 6
const MIN_CENTER_DISTANCE = BALL_SIZE * 0.86
const RELAXED_CENTER_DISTANCES = [MIN_CENTER_DISTANCE, BALL_SIZE * 0.78, BALL_SIZE * 0.7, BALL_SIZE * 0.62]
const POSITION_ATTEMPTS = 90
const VOTE_EFFECT_MS = 1050

const ballArtworks: Record<Era, BallArtwork[]> = {
  vinyl: [
    { id: 'record-1', svg: createBallSvg(record1Svg, '694 182 214 214') },
    { id: 'record-3', svg: createBallSvg(record3Svg, '848 379 164 164') },
  ],
  cd: [
    { id: 'record-6', svg: createBallSvg(record6Svg, '444 303 178 178') },
  ],
  tape: [
    { id: 'record-5', svg: createBallSvg(record5Svg, '1084 487 162 162') },
  ],
  digital: [
    { id: 'record-2', svg: createBallSvg(record2Svg, '524 407 206 206') },
    { id: 'record-4', svg: createBallSvg(record4Svg, '935 287 194 194') },
  ],
  ai: [
    { id: 'ai-music-ball-enter-diamond', svg: createBallSvg(aiMusicBallEnterDiamondSvg, '49 110 388 388') },
  ],
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

function createBallSvg(svg: string, viewBox: string) {
  return svg.replace(
    /<svg\b[^>]*>/,
    `<svg width="${BALL_SIZE}" height="${BALL_SIZE}" viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">`,
  )
}

function getBallArtwork(song: Song) {
  const artworks = ballArtworks[song.era]
  const index = Math.floor(seededUnit(song.id + ':artwork') * artworks.length) % artworks.length
  return artworks[index]
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

function getCandidatePosition(song: Song, attempt: number): Position {
  const minY = targetDiamond.top.y + BALL_EDGE * 2
  const maxY = targetDiamond.bottom.y - BALL_EDGE * 2
  const seed = `${song.id}:target:${attempt}`
  const centerY = minY + seededUnit(seed + ':y') * (maxY - minY)
  const upperBounds = getDiamondHorizontalBounds(centerY - BALL_EDGE)
  const lowerBounds = getDiamondHorizontalBounds(centerY + BALL_EDGE)
  const minX = Math.max(upperBounds.left, lowerBounds.left) + BALL_EDGE
  const maxX = Math.min(upperBounds.right, lowerBounds.right) - BALL_EDGE
  const centerX = minX + seededUnit(seed + ':x') * Math.max(0, maxX - minX)

  return {
    x: Math.round(centerX - BALL_SIZE / 2),
    y: Math.round(centerY - BALL_SIZE / 2),
  }
}

function getSongCreatedTime(song: Song) {
  const time = Date.parse(song.created_at)
  return Number.isNaN(time) ? 0 : time
}

function compareSongsForPlacement(a: Song, b: Song) {
  const timeDiff = getSongCreatedTime(a) - getSongCreatedTime(b)
  if (timeDiff !== 0) return timeDiff
  return a.id.localeCompare(b.id)
}

function getCenterDistance(a: Position, b: Position) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function getNearestDistance(position: Position, placed: Position[]) {
  if (placed.length === 0) return Infinity
  return Math.min(...placed.map((placedPosition) => getCenterDistance(position, placedPosition)))
}

function createTargetPositions(songs: Song[]) {
  const positions = new Map<string, Position>()
  const placed: Position[] = []

  for (const song of [...songs].sort(compareSongsForPlacement)) {
    let selectedPosition: Position | null = null
    let bestPosition = getCandidatePosition(song, 0)
    let bestDistance = getNearestDistance(bestPosition, placed)

    for (const minDistance of RELAXED_CENTER_DISTANCES) {
      for (let attempt = 0; attempt < POSITION_ATTEMPTS; attempt += 1) {
        const candidate = getCandidatePosition(song, attempt)
        const candidateDistance = getNearestDistance(candidate, placed)

        if (candidateDistance > bestDistance) {
          bestPosition = candidate
          bestDistance = candidateDistance
        }

        if (candidateDistance >= minDistance) {
          selectedPosition = candidate
          break
        }
      }

      if (selectedPosition) break
    }

    const position = selectedPosition ?? bestPosition
    positions.set(song.id, position)
    placed.push(position)
  }

  return positions
}

function EraSongBalls({ songs, activeSong }: Props) {
  const [voteQueue, setVoteQueue] = useState<VoteQueueItem[]>([])
  const [activeVote, setActiveVote] = useState<VoteQueueItem | null>(null)
  const previousVotesRef = useRef<Map<string, number> | null>(null)
  const activeVoteRef = useRef<VoteQueueItem | null>(null)
  const sequenceRef = useRef(0)
  const flySong = activeSong
  const ballSongs = songs
  const layoutSongs = useMemo(() => {
    if (!flySong || ballSongs.some((song) => song.id === flySong.id)) return ballSongs
    return [...ballSongs, flySong]
  }, [ballSongs, flySong])
  const targetPositions = useMemo(() => createTargetPositions(layoutSongs), [layoutSongs])
  const staticSongs = flySong ? ballSongs.filter((song) => song.id !== flySong.id) : ballSongs
  const staticSongIds = new Set(staticSongs.map((song) => song.id))
  const detachedVoteSong = activeVote ? ballSongs.find((song) => song.id === activeVote.songId && !staticSongIds.has(song.id)) : null
  const getSongPosition = (song: Song) => targetPositions.get(song.id) ?? getCandidatePosition(song, 0)

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

    const timer = window.setTimeout(() => {
      const [next, ...rest] = voteQueue
      activeVoteRef.current = next
      setActiveVote(next)
      setVoteQueue(rest)
    }, 0)

    return () => window.clearTimeout(timer)
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
    const position = getSongPosition(song)
    const artwork = getBallArtwork(song)
    const floatDelay = `${(seededUnit(song.id + ':float') * -4).toFixed(2)}s`

    return (
      <div
        key={voteEffect ? `${song.id}:${voteEffect.sequence}` : song.id}
        className={'absolute h-[49px] w-[49px] ' + (voteEffect ? 'era-song-ball-vote-bounce' : '')}
        style={{ left: position.x, top: position.y }}
      >
        <span className="era-song-ball-float absolute inset-0" style={{ animationDelay: floatDelay }}>
          <span
            className="block h-full w-full select-none"
            dangerouslySetInnerHTML={{ __html: artwork.svg }}
          />
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
        <span
          key={flySong.id}
          className="era-song-ball-fly absolute h-[49px] w-[49px] select-none"
          style={getFlyStyle(flySong, getSongPosition(flySong))}
          dangerouslySetInnerHTML={{ __html: getBallArtwork(flySong).svg }}
        />
      ) : null}
    </div>
  )
}

export default memo(EraSongBalls)

function getFlyStyle(song: Song, target: Position): FlyStyle {
  const start = startPositions[song.era]

  return {
    left: start.x,
    top: start.y,
    '--ball-dx': `${target.x - start.x}px`,
    '--ball-dy': `${target.y - start.y}px`,
  }
}
