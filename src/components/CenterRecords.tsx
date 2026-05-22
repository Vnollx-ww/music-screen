import type { Era, Song } from '../types/song'

import record1 from '../svg/center-records/Record1.svg'
import record2 from '../svg/center-records/Record2.svg'
import record3 from '../svg/center-records/Record3.svg'
import record4 from '../svg/center-records/Record4.svg'
import record5 from '../svg/center-records/Record5.svg'
import record6 from '../svg/center-records/Record6.svg'

interface Props {
  songs: Song[]
}

type ClassicEra = Exclude<Era, 'ai'>

interface RecordArtwork {
  id: string
  src: string
  origin: { x: number; y: number }
}

interface DisplaySlot {
  id: string
  layer: number
  center: { x: number; y: number }
  pill: { left: number; top: number }
}

const RECORD_ARTWORKS: Record<ClassicEra, RecordArtwork[]> = {
  vinyl: [
    { id: 'record-1', src: record1, origin: { x: 320.753, y: 108.753 } },
    { id: 'record-3', src: record3, origin: { x: 449.5, y: 280.5 } },
  ],
  digital: [
    { id: 'record-2', src: record2, origin: { x: 147.088, y: 330.089 } },
    { id: 'record-4', src: record4, origin: { x: 552.02, y: 204.024 } },
  ],
  tape: [
    { id: 'record-5', src: record5, origin: { x: 684.79, y: 387.787 } },
  ],
  cd: [
    { id: 'record-6', src: record6, origin: { x: 93.209, y: 212.208 } },
  ],
}

const DISPLAY_SLOTS: DisplaySlot[] = [
  { id: 'record-1', layer: 1, center: { x: 320.753, y: 108.753 }, pill: { left: 227, top: 188 } },
  { id: 'record-2', layer: 2, center: { x: 147.088, y: 330.089 }, pill: { left: 54, top: 404 } },
  { id: 'record-3', layer: 3, center: { x: 449.5, y: 280.5 }, pill: { left: 360, top: 341 } },
  { id: 'record-4', layer: 4, center: { x: 552.02, y: 204.024 }, pill: { left: 469, top: 264 } },
  { id: 'record-5', layer: 5, center: { x: 684.79, y: 387.787 }, pill: { left: 592, top: 443 } },
  { id: 'record-6', layer: 6, center: { x: 53.209, y: 212.208 }, pill: { left: -37, top: 272 } },
]

const DISPLAY_SLOTS_BY_ID = Object.fromEntries(DISPLAY_SLOTS.map((slot) => [slot.id, slot])) as Record<string, DisplaySlot>

const PREFERRED_DISPLAY_SLOTS: Record<ClassicEra, DisplaySlot[]> = {
  vinyl: [
    DISPLAY_SLOTS_BY_ID['record-1'],
    DISPLAY_SLOTS_BY_ID['record-3'],
  ],
  digital: [
    DISPLAY_SLOTS_BY_ID['record-2'],
    DISPLAY_SLOTS_BY_ID['record-4'],
  ],
  tape: [
    DISPLAY_SLOTS_BY_ID['record-5'],
  ],
  cd: [
    DISPLAY_SLOTS_BY_ID['record-6'],
  ],
}

const PILL_WIDTH = 179
const PILL_HEIGHT = 42

function isClassicEra(era: Era): era is ClassicEra {
  return era !== 'ai'
}

function pickDisplaySlot(era: ClassicEra, usedSlotIds: Set<string>) {
  return (
    PREFERRED_DISPLAY_SLOTS[era].find((slot) => !usedSlotIds.has(slot.id)) ??
    DISPLAY_SLOTS.find((slot) => !usedSlotIds.has(slot.id))
  )
}

function getRecordItems(songs: Song[]) {
  const usedArtwork: Record<ClassicEra, number> = {
    vinyl: 0,
    tape: 0,
    cd: 0,
    digital: 0,
  }
  const usedSlotIds = new Set<string>()

  return songs.flatMap((song) => {
    if (!isClassicEra(song.era)) return []

    const artworks = RECORD_ARTWORKS[song.era]
    const artwork = artworks[usedArtwork[song.era] % artworks.length]
    const slot = pickDisplaySlot(song.era, usedSlotIds)
    usedArtwork[song.era] += 1
    if (!slot) return []

    usedSlotIds.add(slot.id)
    return [{ song, artwork, slot }]
  })
}

export default function CenterRecords({ songs }: Props) {
  const items = getRecordItems(songs.slice(0, 5)).sort((a, b) => a.slot.layer - b.slot.layer)

  return (
    <section
      className="pointer-events-none relative shrink-0"
      style={{ width: 820, height: 520 }}
    >
      {items.map(({ song, artwork, slot }) => {
        const dx = slot.center.x - artwork.origin.x
        const dy = slot.center.y - artwork.origin.y
        return (
          <img
            key={`r-${artwork.id}-${slot.id}-${song.id}`}
            src={artwork.src}
            alt=""
            className="absolute inset-0 h-full w-full select-none"
            style={{ transform: `translate(${dx}px, ${dy}px)` }}
          />
        )
      })}

      {items.map(({ song, slot }) => {
        const p = slot.pill
        return (
          <div
            key={`p-${slot.id}-${song.id}`}
            className="absolute flex items-center overflow-hidden rounded-full backdrop-blur-[2.5px]"
            style={{
              left: p.left,
              top: p.top,
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
        )
      })}
    </section>
  )
}
