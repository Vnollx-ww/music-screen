import { memo } from 'react'
import { eraConfig } from '../lib/eraConfig'
import EraIcon from './EraIcon'
import type { Era, Song } from '../types/song'

import frameLeft from '../svg/ranking-panel-left/Frame.svg'
import frameRight from '../svg/ranking-panel-right/Frame.svg'
import vinylIcon from '../svg/ranking-panel-left/icons/Vinyl.svg'
import cdIcon from '../svg/ranking-panel-left/icons/Cd.svg'
import tapeIcon from '../svg/ranking-panel-left/icons/Tape.svg'
import digitalIcon from '../svg/ranking-panel-left/icons/Digital.svg'
import aiMusicBallOpaque from '../svg/ranking-panel-right/icons/AiMusicBallOpaque.svg'
import '../styles/ranking-panel.css'

interface Props {
  title: string
  subtitle: string
  songs: Song[]
  variant: 'classic' | 'ai'
}

interface PanelLayout {
  width: number
  height: number
  headerTop: number
  headerHeight: number
  rowCenters: number[]
  rowLeft: number
  rowWidth: number
  iconCx: number
  iconRadius: number
  badgeLeft: number
  badgeWidth: number
  badgeHeight: number
  badgeOffsetY: number
  badgeFontSize: number
  badgeText: 'light' | 'dark'
  badgeFill: string
  artistFontSize: number
  frame: string
  bottomFrameLeft: number
  bottomFrameTop: number
  bottomFrameWidth: number
  bottomFrameHeight: number
}

type ClassicEra = Exclude<Era, 'ai'>

const BIGSCREEN_TITLE_MAX_CHARS = 7
const AI_RANKING_ICON_SIZE = 90
const CLASSIC_RANKING_ICON_SIZE = 41

const classicEraIcons: Record<ClassicEra, string> = {
  vinyl: vinylIcon,
  cd: cdIcon,
  tape: tapeIcon,
  digital: digitalIcon,
}

const layouts: Record<'classic' | 'ai', PanelLayout> = {
  classic: {
    width: 508,
    height: 623,
    headerTop: 66,
    headerHeight: 83,
    rowCenters: [186.5, 272.5, 361.5, 442.5, 531.5],
    rowLeft: 87,
    rowWidth: 354,
    iconCx: 132,
    iconRadius: 40,
    badgeLeft: 335,
    badgeWidth: 86,
    badgeHeight: 26,
    badgeOffsetY: 19,
    badgeFontSize: 14,
    badgeText: 'light',
    badgeFill: 'black',
    artistFontSize: 15,
    frame: frameLeft,
    bottomFrameLeft: 48,
    bottomFrameTop: 66,
    bottomFrameWidth: 412,
    bottomFrameHeight: 529,
  },
  ai: {
    width: 495,
    height: 622,
    headerTop: 66,
    headerHeight: 84,
    rowCenters: [187.5, 272.5, 361.5, 446.5, 531.5],
    rowLeft: 69,
    rowWidth: 350,
    iconCx: 117,
    iconRadius: 40,
    badgeLeft: 324,
    badgeWidth: 74,
    badgeHeight: 23,
    badgeOffsetY: 18,
    badgeFontSize: 11,
    badgeText: 'dark',
    badgeFill: 'white',
    artistFontSize: 12,
    frame: frameRight,
    bottomFrameLeft: 48,
    bottomFrameTop: 66,
    bottomFrameWidth: 399,
    bottomFrameHeight: 528,
  },
}

function ClassicRankingIcon({ era, size }: { era: ClassicEra; size: number }) {
  return <img src={classicEraIcons[era]} alt="" className="h-full w-full object-contain" style={{ width: size, height: size }} />
}

function getDisplayTitle(title: string): string {
  const chars = Array.from(title)
  if (chars.length <= BIGSCREEN_TITLE_MAX_CHARS) return title
  return `${chars.slice(0, BIGSCREEN_TITLE_MAX_CHARS).join('')}…`
}

function isDisplayTitleTruncated(title: string): boolean {
  return Array.from(title).length > BIGSCREEN_TITLE_MAX_CHARS
}

function RankItem({ song, layout }: { song: Song; layout: PanelLayout }) {
  const cfg = eraConfig[song.era]
  const iconLocalCx = layout.iconCx - layout.rowLeft
  const badgeLocalLeft = layout.badgeLeft - layout.rowLeft
  const iconSize = song.era === 'ai' ? AI_RANKING_ICON_SIZE : CLASSIC_RANKING_ICON_SIZE
  const contentLeft = iconLocalCx + layout.iconRadius + 14
  const contentRight = badgeLocalLeft - 8
  const badgeY = 37.5 - layout.badgeHeight / 2 + layout.badgeOffsetY
  const votesY = Math.max(8, badgeY - 28)
  const titleIsTruncated = isDisplayTitleTruncated(song.title)

  return (
    <>
      <div className="absolute inset-0 rounded-full bg-[#d9d9d9]/[0.22]" />
      <div
        className="absolute flex items-center justify-center"
        style={{ left: iconLocalCx - iconSize / 2, top: (75 - iconSize) / 2, width: iconSize, height: iconSize }}
      >
        {song.era === 'ai' ? (
          <img src={aiMusicBallOpaque} alt="" className="h-full w-full object-contain" />
        ) : (
          <ClassicRankingIcon era={song.era} size={iconSize} />
        )}
      </div>
      <div
        className="absolute flex flex-col justify-center gap-[4px]"
        style={{ left: contentLeft, width: contentRight - contentLeft, top: 0, bottom: 0 }}
      >
        <div className="ranking-title-shell">
          <h3 className={'ranking-title' + (titleIsTruncated ? ' is-truncated' : '')}>
            {getDisplayTitle(song.title)}
          </h3>
          {titleIsTruncated && (
            <div className="ranking-title-tooltip">
              {song.title}
            </div>
          )}
        </div>
        <p className="ranking-artist" style={{ fontSize: layout.artistFontSize }}>{song.artist}</p>
      </div>

      <div
        className="absolute flex items-center justify-center rounded-[6px]"
        style={{ left: badgeLocalLeft, top: badgeY, width: layout.badgeWidth, height: layout.badgeHeight, background: layout.badgeFill }}
      >
        <span className={'font-bold tracking-wide ' + (layout.badgeText === 'light' ? 'text-white' : 'text-black')} style={{ fontSize: layout.badgeFontSize }}>
          {cfg.label}
        </span>
      </div>

      <div
        className="absolute flex items-center justify-center rounded-full border border-white/15 bg-black/35 px-2"
        style={{ left: badgeLocalLeft, top: votesY, width: layout.badgeWidth, height: 22 }}
      >
        <span className="text-[13px] font-bold leading-none text-white">
          {song.votes}票
        </span>
      </div>
    </>
  )
}

function EmptyState({ variant, layout }: { variant: 'classic' | 'ai'; layout: PanelLayout }) {
  const isClassic = variant === 'classic'

  return (
    <div
      className="pointer-events-none absolute flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] text-center backdrop-blur-[2px]"
      style={{
        left: layout.rowLeft,
        top: layout.rowCenters[2] - 78,
        width: layout.rowWidth,
        height: 156,
      }}
    >
      {isClassic ? (
        <div className="mb-4 flex items-center justify-center gap-2">
          <ClassicRankingIcon era="vinyl" size={38} />
          <ClassicRankingIcon era="cd" size={38} />
          <ClassicRankingIcon era="tape" size={38} />
          <ClassicRankingIcon era="digital" size={38} />
        </div>
      ) : (
        <div className="mb-4">
          <EraIcon era="ai" size={72} />
        </div>
      )}
      <p className="text-[20px] font-bold tracking-wide text-white/85">
        {isClassic ? '暂无代际歌曲' : '暂无AI共创歌曲'}
      </p>
      <p className="mt-2 text-[13px] font-medium tracking-wide text-white/45">
        等待推荐歌曲上榜
      </p>
    </div>
  )
}

function RankingPanel({ title, songs, variant }: Props) {
  const layout = layouts[variant]
  const visibleSongs = songs.slice(0, 5)

  return (
    <section className="relative shrink-0" style={{ width: layout.width, height: layout.height }}>
      <img src={layout.frame} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none" />
      <div
        className="ranking-panel-bottom-frame"
        style={{
          left: layout.bottomFrameLeft,
          top: layout.bottomFrameTop,
          width: layout.bottomFrameWidth,
          height: layout.bottomFrameHeight,
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 flex items-center justify-center"
        style={{ top: layout.headerTop, height: layout.headerHeight }}
      >
        <h2 className="text-center text-[34px] font-medium tracking-wider text-white">{title}</h2>
      </div>

      {visibleSongs.length === 0 && <EmptyState variant={variant} layout={layout} />}

      {visibleSongs.map((song, i) => (
        <div
          key={song.id}
          className="pointer-events-none absolute"
          style={{
            left: layout.rowLeft,
            top: layout.rowCenters[i] - 37.5,
            width: layout.rowWidth,
            height: 75,
          }}
        >
          <RankItem song={song} layout={layout} />
        </div>
      ))}
    </section>
  )
}

export default memo(RankingPanel)
