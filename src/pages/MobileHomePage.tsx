import { useEffect, useState } from 'react'
import homeBackgroundUrl from '../svg/mobile-home/HomeBackground.svg'
import homeBubblesUrl from '../svg/mobile-home/HomeBubbles.svg'
import '../styles/mobile-home.css'

function useFitToWidth(designWidth: number) {
  const [scale, setScale] = useState(() => {
    if (typeof window === 'undefined') return 1
    return Math.min(1.6, window.innerWidth / designWidth)
  })

  useEffect(() => {
    const update = () => setScale(Math.min(1.6, window.innerWidth / designWidth))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [designWidth])

  return scale
}

export default function MobileHomePage() {
  const scale = useFitToWidth(390)

  return (
    <main className="mh-page">
      <div className="mh-scaler" style={{ height: 844 * scale }}>
        <div className="mh-canvas" style={{ transform: `scale(${scale})` }}>
          <img src={homeBackgroundUrl} className="mh-background" alt="" aria-hidden />
          <img src={homeBubblesUrl} className="mh-bubbles" alt="" aria-hidden />

          <h1 className="mh-title">信义坊社区音乐共创</h1>

          <a href="?mode=mobile" className="mh-action mh-action-upload">
            <span className="mh-action-title">上传歌曲</span>
          </a>

          <a href="?mode=vote" className="mh-action mh-action-vote">
            <span className="mh-action-title">歌曲推榜</span>
          </a>

          <button type="button" className="mh-action mh-action-ai" disabled>
            <span className="mh-action-title">AI共创混曲</span>
            <span className="mh-action-note">敬请期待</span>
          </button>
        </div>
      </div>
    </main>
  )
}
