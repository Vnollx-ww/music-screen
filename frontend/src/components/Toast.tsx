import type { CSSProperties } from 'react'
import { eraConfig } from '../lib/eraConfig'
import EraIcon from './EraIcon'
import type { Song } from '../types/song'
import '../styles/toast.css'

interface Props {
  song: Song | null
}

export default function Toast({ song }: Props) {
  if (!song) return null

  const cfg = eraConfig[song.era]
  const toastStyle = {
    '--toast-era-color': cfg.color,
    '--toast-era-color-18': `${cfg.color}18`,
    '--toast-era-color-22': `${cfg.color}22`,
    '--toast-era-color-30': `${cfg.color}30`,
    '--toast-era-color-38': `${cfg.color}38`,
    '--toast-era-color-40': `${cfg.color}40`,
    '--toast-era-color-44': `${cfg.color}44`,
    '--toast-era-color-55': `${cfg.color}55`,
    '--toast-era-color-66': `${cfg.color}66`,
  } as CSSProperties

  return (
    <div className="toast-viewport">
      <div key={song.id} className="toast-drop" style={toastStyle}>
        <div className="toast-top-line" />
        <div className="toast-glow" />
        <div className="toast-era-icon">
          <EraIcon era={cfg.icon} size={64} />
        </div>
        <div className="toast-content">
          <div className="toast-heading">
            <span className="toast-kicker">
              NEW SONG
            </span>
            <span className="toast-heading-text">新曲上榜</span>
          </div>
          <p className="toast-title">
            {song.title}
          </p>
          <p className="toast-artist">{song.artist}</p>
        </div>
        <div className="toast-era-badge">
          <p className="toast-era-short">{cfg.shortLabel}</p>
          <p className="toast-era-label">{cfg.label}</p>
        </div>
      </div>
    </div>
  )
}
