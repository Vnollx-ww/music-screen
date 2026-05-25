import InlineSvg from '../components/InlineSvg'
import { useFitToWidth } from '../hooks/useFitToWidth'
import { decorateMobileHomeBackgroundSvg } from '../lib/mobileSvgFloat'
import homeBackgroundSvg from '../svg/mobile-home/HomeBackground.svg?raw'
import homeBubblesUrl from '../svg/mobile-home/HomeBubbles.svg'
import '../styles/mobile-home.css'

const floatingHomeBackgroundSvg = decorateMobileHomeBackgroundSvg(homeBackgroundSvg)

export default function MobileHomePage() {
  const scale = useFitToWidth(390)

  return (
    <main className="mh-page">
      <div className="mh-scaler" style={{ height: 844 * scale }}>
        <div className="mh-canvas" style={{ transform: `scale(${scale})` }}>
          <img src="/dashboard-background.png" className="mh-dashboard-bg" alt="" aria-hidden />
          <InlineSvg html={floatingHomeBackgroundSvg} className="mh-background mobile-floating-svg" />
          <img src={homeBubblesUrl} className="mh-bubbles" alt="" aria-hidden />

          <h1 className="mh-title">信义坊社区音乐共创</h1>

          <a href="?mode=mobile" className="mh-action mh-action-upload">
            <span className="mh-action-title">上传歌曲</span>
          </a>

          <a href="?mode=vote" className="mh-action mh-action-vote">
            <span className="mh-action-title">歌曲推榜</span>
          </a>

          <a href="?mode=standby" className="mh-action mh-action-ai">
            <span className="mh-action-title">AI共创混曲</span>
            <span className="mh-action-note">建议去Ipad端体验</span>
          </a>
        </div>
      </div>
    </main>
  )
}
