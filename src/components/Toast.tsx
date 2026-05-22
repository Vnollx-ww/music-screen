import { useEffect, useState } from 'react'
import { eraConfig } from '../lib/eraConfig'
import EraIcon from './EraIcon'
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
    <div className="pointer-events-none fixed inset-x-0 top-14 z-50 flex justify-center px-10">
      <div
        className="toast-drop relative isolate flex w-[640px] max-w-full items-center gap-6 overflow-hidden rounded-[32px] border px-10 py-7 backdrop-blur-2xl"
        style={{
          borderColor: `${cfg.color}66`,
          background: `radial-gradient(circle at 16% 42%, ${cfg.color}38, transparent 34%), linear-gradient(135deg, rgba(16, 10, 33, 0.96), rgba(5, 4, 14, 0.88))`,
          boxShadow: `0 0 64px ${cfg.color}40, 0 24px 70px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.18)`,
        }}
      >
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
        <div
          className="absolute -right-16 -top-20 h-40 w-40 rounded-full blur-3xl"
          style={{ backgroundColor: `${cfg.color}44` }}
        />
        <div
          className="relative grid h-[86px] w-[86px] shrink-0 place-items-center rounded-[26px] border bg-white/[0.08]"
          style={{ borderColor: `${cfg.color}66`, boxShadow: `inset 0 0 26px ${cfg.color}22, 0 0 28px ${cfg.color}30` }}
        >
          <EraIcon era={cfg.icon} size={64} />
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-bold tracking-[0.22em] text-white/80">
              NEW SONG
            </span>
            <span className="text-[18px] font-bold text-white/90">新曲上榜</span>
          </div>
          <p className="truncate text-[34px] font-black leading-tight tracking-wide text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.22)]">
            {current.title}
          </p>
          <p className="mt-2 truncate text-[18px] font-medium leading-tight text-white/64">{current.artist}</p>
        </div>
        <div
          className="relative shrink-0 rounded-2xl border px-4 py-3 text-center"
          style={{ borderColor: `${cfg.color}55`, backgroundColor: `${cfg.color}18` }}
        >
          <p className="text-[12px] font-black tracking-[0.18em]" style={{ color: cfg.color }}>{cfg.shortLabel}</p>
          <p className="mt-1 whitespace-nowrap text-[15px] font-bold text-white/86">{cfg.label}</p>
        </div>
      </div>
    </div>
  )
}
