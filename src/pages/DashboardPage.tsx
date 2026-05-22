import { useState, useCallback, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import RankingPanel from '../components/RankingPanel'
import CenterRecords from '../components/CenterRecords'
import Toast from '../components/Toast'
import QRCode from '../components/QRCode'
import EraDiamondFocus from '../components/EraDiamondFocus'
import { useSongs } from '../hooks/useSongs'
import { useLeaderboards } from '../hooks/useLeaderboards'
import { useResponsiveScale } from '../hooks/useResponsiveScale'
import type { Era, Song } from '../types/song'
import overlayBelow from '../svg/circles-overlay/OverlayBelow.svg'
import overlayAbove from '../svg/circles-overlay/OverlayAbove.svg'

const NEW_SONG_FOCUS_MS = 4500

export default function DashboardPage() {
  const [toastSong, setToastSong] = useState<Song | null>(null)
  const [focusEra, setFocusEra] = useState<Era | null>(null)
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onNewSong = useCallback((s: Song) => {
    setToastSong({ ...s })
    setFocusEra(s.era)

    if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
    focusTimerRef.current = setTimeout(() => {
      setFocusEra(null)
      focusTimerRef.current = null
    }, NEW_SONG_FOCUS_MS)
  }, [])

  useEffect(() => () => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
  }, [])

  const { songs, loading, error, status } = useSongs(onNewSong)
  const { classic, ai } = useLeaderboards(songs)
  const scale = useResponsiveScale()
  const isFocusActive = focusEra !== null

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
          style={{ objectFit: 'fill' }}
        />
        <img
          src={overlayAbove}
          className="absolute inset-0 z-[4] h-full w-full pointer-events-none"
          alt=""
          style={{ objectFit: 'fill' }}
        />
        <EraDiamondFocus activeEra={focusEra} />
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
