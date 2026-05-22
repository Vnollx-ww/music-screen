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

type FlyStyle = CSSProperties & {
  '--ball-dx': string
  '--ball-dy': string
}

const BALL_SIZE = 49
const BALL_EDGE = BALL_SIZE / 2 + 6

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
  const staticSongs = activeSong ? songs.filter((song) => song.id !== activeSong.id) : songs

  return (
    <div className="pointer-events-none absolute inset-0 z-[6]">
      {staticSongs.map((song) => {
        const position = getTargetPosition(song)

        return (
          <img
            key={song.id}
            src={ballIcons[song.era]}
            alt=""
            className="absolute h-[49px] w-[49px] select-none"
            style={{ left: position.x, top: position.y }}
          />
        )
      })}

      {activeSong ? (
        <img
          key={activeSong.id}
          src={ballIcons[activeSong.era]}
          alt=""
          className="era-song-ball-fly absolute h-[49px] w-[49px] select-none"
          style={getFlyStyle(activeSong)}
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
