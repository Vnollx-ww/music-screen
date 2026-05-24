import { useState, useCallback, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import RankingPanel from '../components/RankingPanel'
import CenterRecords from '../components/CenterRecords'
import Toast from '../components/Toast'
import QRCode from '../components/QRCode'
import EraDiamondFocus from '../components/EraDiamondFocus'
import EraSongBalls from '../components/EraSongBalls'
import OverlayAboveCircles from '../components/OverlayAboveCircles'
import { useSongs } from '../hooks/useSongs'
import { useLeaderboards } from '../hooks/useLeaderboards'
import { useResponsiveScale } from '../hooks/useResponsiveScale'
import type { Song } from '../types/song'
import overlayBelow from '../svg/circles-overlay/OverlayBelow.svg'

const NEW_SONG_FOCUS_MS = 4500

export default function DashboardPage() {
  const [toastSong, setToastSong] = useState<Song | null>(null)
  const [focusSong, setFocusSong] = useState<Song | null>(null)
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onNewSong = useCallback((s: Song) => {
    setToastSong({ ...s })
    setFocusSong({ ...s })

    if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
    focusTimerRef.current = setTimeout(() => {
      setFocusSong(null)
      focusTimerRef.current = null
    }, NEW_SONG_FOCUS_MS)
  }, [])

  useEffect(() => () => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
  }, [])

  const { songs, loading, error, status } = useSongs(onNewSong)
  const { classic, ai } = useLeaderboards(songs)
  const scale = useResponsiveScale()
  const focusEra = focusSong?.era ?? null
  const isFocusActive = focusSong !== null

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      <div
        className="dashboard-canvas relative h-[1080px] w-[1920px] shrink-0 overflow-hidden"
        style={{ transform: `scale(${scale})` }}
      >
        <img
          src="/dashboard-background.png"
          className="absolute inset-0 z-0 h-full w-full object-cover"
          alt=""
        />
        <img
          src="/dashboard-frame.png"
          className="absolute inset-0 z-[1] h-full w-full object-cover opacity-20 mix-blend-overlay"
          alt=""
        />
        <img
          src={overlayBelow}
          className="absolute inset-0 z-[2] h-full w-full pointer-events-none"
          alt=""
          style={{ objectFit: 'contain' }}
        />
        <OverlayAboveCircles />
        <svg
          className="pointer-events-none absolute left-[80px] top-[76px] z-[6] h-[54px] w-[62px]"
          viewBox="80 76 62 54"
          fill="none"
          aria-hidden="true"
        >
          <path d="M100.595 81.883L110.657 110.516L106.117 112.615L95.912 83.5257L100.595 81.883Z" fill="#29E7E5" />
          <ellipse cx="115.452" cy="114.8" rx="13.0515" ry="12.8376" fill="#FCAFE4" />
          <ellipse cx="97.8376" cy="111.021" rx="12.8376" ry="12.6236" fill="#29E7E5" />
          <path fillRule="evenodd" clipRule="evenodd" d="M108.476 103.953C109.864 105.97 110.675 108.402 110.675 111.021C110.675 115.587 108.209 119.587 104.515 121.804C103.179 119.79 102.402 117.385 102.402 114.801C102.402 110.236 104.826 106.229 108.476 103.953Z" fill="#9770BF" />
          <path d="M93.8438 78H117.309L121.659 87.5569H97.3282L93.8438 78Z" fill="#29E7E5" />
          <path d="M117.865 83.1999L127.803 111.62L123.121 113.263L112.916 84.1732L117.865 83.1999Z" fill="#FCAFE4" />
          <path d="M111.816 81.5654C111.816 81.5654 116.711 81.5687 119.325 81.7915C123.427 82.1412 125.759 83.5187 129.995 83.8245C132.629 84.0147 135.832 83.8245 135.832 83.8245L139.417 92.8457C139.417 92.8457 133.712 94.5009 128.019 92.8457C122.326 91.1905 115.636 91.349 115.636 91.349L111.816 81.5654Z" fill="#FCAFE4" />
          <path fillRule="evenodd" clipRule="evenodd" d="M111.816 81.5654C111.832 81.5654 116.359 81.5698 119.024 81.7686L121.659 87.5566H114.155L111.816 81.5654Z" fill="#9770BF" />
        </svg>
        <EraDiamondFocus activeEra={focusEra} />
        <EraSongBalls songs={songs} activeSong={focusSong} />
        <StatusBar />
        <Toast song={toastSong} />

        <div className={'absolute z-[15] transition-opacity duration-500 ' + (isFocusActive ? 'opacity-50' : 'opacity-100')} style={{ left: 480, top: 180 }}>
          <CenterRecords songs={classic} />
        </div>

        <div className={'absolute z-20 transition-opacity duration-500 ' + (isFocusActive ? 'opacity-50' : 'opacity-100')} style={{ left: 46, top: 168 }}>
          <RankingPanel title="代际歌曲榜" subtitle="GENERATIONAL HITS" songs={classic} variant="classic" />
        </div>
        <div className={'absolute z-20 transition-opacity duration-500 ' + (isFocusActive ? 'opacity-50' : 'opacity-100')} style={{ left: 1350, top: 164 }}>
          <RankingPanel title="共创歌曲榜单" subtitle="AI CO-CREATION" songs={ai} variant="ai" />
        </div>

        <QRCode />
      </div>
    </div>
  )
}
