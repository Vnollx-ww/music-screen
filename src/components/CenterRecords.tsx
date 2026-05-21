import type { Song } from '../types/song'

import record1 from '../svg/center-records/Record1.svg'
import record2 from '../svg/center-records/Record2.svg'
import record3 from '../svg/center-records/Record3.svg'
import record4 from '../svg/center-records/Record4.svg'
import record5 from '../svg/center-records/Record5.svg'

interface Props {
  songs: Song[]
}

const RECORDS = [record1, record2, record3, record4, record5]

const PILL_POSITIONS: { left: number; top: number }[] = [
  { left: 227, top: 188 },
  { left: 54, top: 404 },
  { left: 360, top: 341 },
  { left: 469, top: 264 },
  { left: 592, top: 443 },
]

const PILL_WIDTH = 179
const PILL_HEIGHT = 42

export default function CenterRecords({ songs }: Props) {
  const visible = Math.min(songs.length, RECORDS.length)

  return (
    <section
      className="pointer-events-none relative shrink-0"
      style={{ width: 820, height: 520 }}
    >
      {RECORDS.slice(0, visible).map((src, i) => (
        <img
          key={`r-${i}`}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full select-none"
        />
      ))}

      {songs.slice(0, visible).map((song, i) => {
        const p = PILL_POSITIONS[i]
        return (
          <div
            key={`p-${i}`}
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
