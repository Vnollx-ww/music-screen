import { memo } from 'react'
import type { CSSProperties } from 'react'
import type { Song } from '../types/song'
import aiMusicBallEnterDiamondSvg from '../svg/center-records/AiMusicBallEnterDiamond.svg?raw'

interface Props {
  song: Song | null
}

const AI_TOP_RECORD_SVG = aiMusicBallEnterDiamondSvg.replace(
  /<svg\b[^>]*>/,
  '<svg width="100%" height="100%" viewBox="138 195 214 214" fill="none" xmlns="http://www.w3.org/2000/svg">',
)
const PILL_WIDTH = 179
const PILL_HEIGHT = 42
const FLOAT_STYLE = {
  '--record-x': '0px',
  '--record-y': '0px',
  animationDelay: '-1.4s',
} as CSSProperties

function AiTopRecord({ song }: Props) {
  if (!song) return null

  return (
    <div
      key={song.id}
      className="relative h-full w-full select-none"
    >
      <span
        className="record-float absolute inset-0 block h-full w-full"
        style={FLOAT_STYLE}
        dangerouslySetInnerHTML={{ __html: AI_TOP_RECORD_SVG }}
      />
      <div
        className="absolute z-[1] flex items-center overflow-hidden rounded-full backdrop-blur-[2.5px]"
        style={{
          left: (214 - PILL_WIDTH) / 2,
          top: 184,
          width: PILL_WIDTH,
          height: PILL_HEIGHT,
          background: 'rgba(38, 37, 37, 0.67)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 -19px 47px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="w-full truncate px-4 text-center text-[16px] font-medium tracking-wide text-white">
          {song.title}
        </div>
      </div>
    </div>
  )
}

export default memo(AiTopRecord)
