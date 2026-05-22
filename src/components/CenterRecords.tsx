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

interface RecordSlot {
  id: string
  src: string
  layer: number
  pill: { left: number; top: number }
}

const RECORD_SLOTS: Record<ClassicEra, RecordSlot[]> = {
  vinyl: [
    { id: 'record-1', src: record1, layer: 1, pill: { left: 227, top: 188 } },
    { id: 'record-3', src: record3, layer: 3, pill: { left: 360, top: 341 } },
  ],
  digital: [
    { id: 'record-2', src: record2, layer: 2, pill: { left: 54, top: 404 } },
    { id: 'record-4', src: record4, layer: 4, pill: { left: 469, top: 264 } },
  ],
  tape: [
    { id: 'record-5', src: record5, layer: 5, pill: { left: 592, top: 443 } },
  ],
  cd: [
    { id: 'record-6', src: record6, layer: 6, pill: { left: -37, top: 272 } },
  ],
}

const PILL_WIDTH = 179
const PILL_HEIGHT = 42

function isClassicEra(era: Era): era is ClassicEra {
  return era !== 'ai'
}

function getRecordItems(songs: Song[]) {
  const used: Record<ClassicEra, number> = {
    vinyl: 0,
    tape: 0,
    cd: 0,
    digital: 0,
  }

  return songs.flatMap((song) => {
    if (!isClassicEra(song.era)) return []

    const slot = RECORD_SLOTS[song.era][used[song.era]]
    used[song.era] += 1

    return slot ? [{ song, slot }] : []
  })
}

export default function CenterRecords({ songs }: Props) {
  const items = getRecordItems(songs.slice(0, 5)).sort((a, b) => a.slot.layer - b.slot.layer)

  return (
    <section
      className="pointer-events-none relative shrink-0"
      style={{ width: 820, height: 520 }}
    >
      {items.map(({ song, slot }) => (
        <img
          key={`r-${slot.id}-${song.id}`}
          src={slot.src}
          alt=""
          className="absolute inset-0 h-full w-full select-none"
        />
      ))}

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
