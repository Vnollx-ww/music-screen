import { eraConfig } from '../lib/eraConfig'
import type { Song } from '../types/song'

import frameLeft from '../svg/ranking-panel-left/Frame.svg'
import rowsLeft from '../svg/ranking-panel-left/Rows.svg'
import iconsLeft from '../svg/ranking-panel-left/Icons.svg'
import badgeSlotsLeft from '../svg/ranking-panel-left/BadgeSlots.svg'

import frameRight from '../svg/ranking-panel-right/Frame.svg'
import rowsRight from '../svg/ranking-panel-right/Rows.svg'
import iconsRight from '../svg/ranking-panel-right/Icons.svg'
import badgeSlotsRight from '../svg/ranking-panel-right/BadgeSlots.svg'

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
  badgeOffsetY: number
  badgeText: 'light' | 'dark'
  frame: string
  rows: string
  icons: string
  badgeSlots: string
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
    iconCx: 120,
    iconRadius: 24,
    badgeLeft: 345,
    badgeWidth: 74,
    badgeOffsetY: 19,
    badgeText: 'light',
    frame: frameLeft,
    rows: rowsLeft,
    icons: iconsLeft,
    badgeSlots: badgeSlotsLeft,
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
    badgeOffsetY: 18,
    badgeText: 'dark',
    frame: frameRight,
    rows: rowsRight,
    icons: iconsRight,
    badgeSlots: badgeSlotsRight,
  },
}

function RankItem({ song, layout }: { song: Song; layout: PanelLayout }) {
  const cfg = eraConfig[song.era]
  const iconLocalCx = layout.iconCx - layout.rowLeft
  const badgeLocalLeft = layout.badgeLeft - layout.rowLeft
  const contentLeft = iconLocalCx + layout.iconRadius + 14
  const contentRight = badgeLocalLeft - 8
  const badgeY = 37.5 - 11.5 + layout.badgeOffsetY

  return (
    <>
      <div
        className="absolute flex flex-col justify-center gap-[4px]"
        style={{ left: contentLeft, width: contentRight - contentLeft, top: 0, bottom: 0 }}
      >
        <h3 className="truncate text-[18px] font-bold leading-tight text-white">{song.title}</h3>
        <p className="truncate text-[12px] leading-tight text-white/55">{song.artist}</p>
      </div>

      <div
        className="absolute flex items-center justify-center"
        style={{ left: badgeLocalLeft, top: badgeY, width: layout.badgeWidth, height: 23 }}
      >
        <span className={`text-[11px] font-bold tracking-wide ${layout.badgeText === 'light' ? 'text-white' : 'text-black'}`}>
          {cfg.label}
        </span>
      </div>
    </>
  )
}

function EmptySlot({ layout }: { layout: PanelLayout }) {
  const iconLocalCx = layout.iconCx - layout.rowLeft
  const badgeLocalLeft = layout.badgeLeft - layout.rowLeft
  const contentLeft = iconLocalCx + layout.iconRadius + 14
  const contentRight = badgeLocalLeft - 8
  const badgeY = 37.5 - 11.5 + layout.badgeOffsetY

  return (
    <>
      <div
        className="absolute flex items-center"
        style={{ left: contentLeft, width: contentRight - contentLeft, top: 0, bottom: 0 }}
      >
        <p className="text-[14px] font-medium text-white/35">等待投票...</p>
      </div>
      <div
        className="absolute flex items-center justify-center"
        style={{ left: badgeLocalLeft, top: badgeY, width: layout.badgeWidth, height: 23 }}
      >
        <span className={`text-[10px] font-black tracking-wider ${layout.badgeText === 'light' ? 'text-white/40' : 'text-black/30'}`}>
          --
        </span>
      </div>
    </>
  )
}

export default function RankingPanel({ title, songs, variant }: Props) {
  const layout = layouts[variant]
  const slots = Array.from({ length: 5 }, (_, i) => songs[i] ?? null)

  return (
    <section className="relative shrink-0" style={{ width: layout.width, height: layout.height }}>
      <img src={layout.frame} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none" />
      <img src={layout.rows} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none" />
      <img src={layout.icons} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none" />
      <img src={layout.badgeSlots} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none" />

      <div
        className="pointer-events-none absolute inset-x-0 flex items-center justify-center"
        style={{ top: layout.headerTop, height: layout.headerHeight }}
      >
        <h2 className="text-center text-[34px] font-medium tracking-wider text-white">{title}</h2>
      </div>

      {slots.map((song, i) => (
        <div
          key={song?.id ?? `e-${variant}-${i}`}
          className="pointer-events-none absolute"
          style={{
            left: layout.rowLeft,
            top: layout.rowCenters[i] - 37.5,
            width: layout.rowWidth,
            height: 75,
          }}
        >
          {song
            ? <RankItem song={song} layout={layout} />
            : <EmptySlot layout={layout} />
          }
        </div>
      ))}
    </section>
  )
}
