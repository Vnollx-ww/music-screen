import { useState, useCallback, useEffect, useRef } from 'react'
import RankingPanel from '../components/RankingPanel'
import CenterRecords from '../components/CenterRecords'
import Toast from '../components/Toast'
import QRCode from '../components/QRCode'
import EraDiamondFocus from '../components/EraDiamondFocus'
import EraSongBalls from '../components/EraSongBalls'
import OverlayAboveCircles from '../components/OverlayAboveCircles'
import AiTopRecord from '../components/AiTopRecord'
import { useSongs } from '../hooks/useSongs'
import { useLeaderboards } from '../hooks/useLeaderboards'
import { useResponsiveScale } from '../hooks/useResponsiveScale'
import type { Song } from '../types/song'
import overlayBelow from '../svg/circles-overlay/OverlayBelow.svg'
import dashboardTitle from '../svg/dashboard/标题.svg'
import dashboardLogo from '../svg/dashboard/左上角logo.svg'

const NEW_SONG_FOCUS_MS = 4500
const DASHBOARD_BACKGROUND_URL = 'https://jonas-1387333607.cos.ap-shanghai.myqcloud.com/dashboard-background.png'
const FALLBACK_DASHBOARD_BACKGROUND_URL = '/dashboard-background.png'

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

  const { songs } = useSongs(onNewSong)
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
          src={DASHBOARD_BACKGROUND_URL}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          alt=""
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = FALLBACK_DASHBOARD_BACKGROUND_URL
          }}
        />
        <img
          src={overlayBelow}
          className="absolute inset-0 z-[2] h-full w-full pointer-events-none"
          alt=""
          style={{ objectFit: 'contain' }}
        />
        <OverlayAboveCircles />
        <img
          src={dashboardLogo}
          className="pointer-events-none absolute left-[100px] top-[68px] z-[6] h-[62px] w-[224px]"
          alt=""
          aria-hidden="true"
        />
        <img
          src={dashboardTitle}
          className="pointer-events-none absolute left-1/2 top-[-5px] z-[6] h-[178px] w-[771px] -translate-x-1/2"
          alt=""
          aria-hidden="true"
        />
        <EraDiamondFocus activeEra={focusEra} />
        <EraSongBalls songs={songs} activeSong={focusSong} />
        <Toast song={toastSong} />

        <div className={'absolute z-[15] transition-opacity duration-500 ' + (isFocusActive ? 'opacity-50' : 'opacity-100')} style={{ left: 480, top: 180 }}>
          <CenterRecords songs={classic} />
        </div>

        <div className={'pointer-events-none absolute z-[16] h-[214px] w-[214px] transition-opacity duration-500 ' + (isFocusActive ? 'opacity-50' : 'opacity-100')} style={{ left: 1136, top: 245 }}>
          <AiTopRecord song={ai[0] ?? null} />
        </div>

        <div className={'absolute z-20 transition-opacity duration-500 ' + (isFocusActive ? 'opacity-50' : 'opacity-100')} style={{ left: 46, top: 168 }}>
          <RankingPanel title="代际歌曲榜" subtitle="GENERATIONAL HITS" songs={classic} variant="classic" />
        </div>
        <div className={'absolute z-20 transition-opacity duration-500 ' + (isFocusActive ? 'opacity-50' : 'opacity-100')} style={{ left: 1350, top: 164 }}>
          <RankingPanel title="AI共创歌曲榜" subtitle="AI CO-CREATION" songs={ai} variant="ai" />
        </div>

        <QRCode />
      </div>
    </div>
  )
}
