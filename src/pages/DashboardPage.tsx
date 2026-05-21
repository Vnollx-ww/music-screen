import { useState, useCallback } from 'react'
import StatusBar from '../components/StatusBar'
import RankingPanel from '../components/RankingPanel'
import CenterRecords from '../components/CenterRecords'
import Toast from '../components/Toast'
import QRCode from '../components/QRCode'
import { useSongs } from '../hooks/useSongs'
import { useLeaderboards } from '../hooks/useLeaderboards'
import { useResponsiveScale } from '../hooks/useResponsiveScale'
import type { Song } from '../types/song'

export default function DashboardPage() {
  const [toastSong, setToastSong] = useState<Song | null>(null)
  const onNewSong = useCallback((s: Song) => setToastSong({ ...s }), [])
  const { songs, loading, error, status } = useSongs(onNewSong)
  const { classic, ai } = useLeaderboards(songs)
  const scale = useResponsiveScale()

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      <div
        className="dashboard-canvas relative h-[1080px] w-[1920px] shrink-0 overflow-hidden"
        style={{ transform: `scale(${scale})` }}
      >
        <img
          src={encodeURI('/大屏图片.png')}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          alt=""
        />
        <img
          src={encodeURI('/大屏图片2.png')}
          className="absolute inset-0 z-[1] h-full w-full object-cover opacity-20 mix-blend-overlay"
          alt=""
        />
        <img
          src="/circles-overlay.svg"
          className="absolute inset-0 z-[2] h-full w-full pointer-events-none"
          alt=""
          style={{ objectFit: 'fill' }}
        />
        <StatusBar />
        <Toast song={toastSong} />

        <div className="absolute z-[15]" style={{ left: 480, top: 180 }}>
          <CenterRecords songs={classic} />
        </div>

        <div className="absolute z-20" style={{ left: 46, top: 168 }}>
          <RankingPanel title="代际歌曲榜" subtitle="GENERATIONAL HITS" songs={classic} variant="classic" />
        </div>
        <div className="absolute z-20" style={{ left: 1350, top: 164 }}>
          <RankingPanel title="共创歌曲榜单" subtitle="AI CO-CREATION" songs={ai} variant="ai" />
        </div>

        <QRCode />
      </div>
    </div>
  )
}
