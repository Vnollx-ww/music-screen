import { useEffect, useState } from 'react'
import { eraConfig } from '../lib/eraConfig'
import type { Song } from '../types/song'

interface Props {
  song: Song | null
}

export default function Toast({ song }: Props) {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<Song | null>(null)

  useEffect(() => {
    if (song) {
      setCurrent(song)
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 4500)
      return () => clearTimeout(t)
    }
  }, [song])

  if (!visible || !current) return null

  const cfg = eraConfig[current.era]

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center">
      <div
        className="toast-drop flex min-w-[680px] items-center gap-10 rounded-3xl border border-white/30 bg-[#0d0a1a]/90 px-14 py-8 backdrop-blur-2xl"
        style={{ boxShadow: `0 0 80px ${cfg.color}55, 0 20px 90px rgba(0,0,0,0.7)` }}
      >
        <span className="text-7xl leading-none">{cfg.emoji}</span>
        <div className="flex flex-col gap-2">
          <p className="text-xl font-bold tracking-[0.18em] text-white/85">✨ 新曲上榜！</p>
          <p className="text-4xl font-black leading-tight text-white">{current.title}</p>
          <p className="text-xl leading-tight text-white/70">{current.artist} · <span style={{ color: cfg.color }}>{cfg.label}</span></p>
        </div>
      </div>
    </div>
  )
}
