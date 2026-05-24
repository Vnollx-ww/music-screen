import InlineSvg from '../components/InlineSvg'
import standbySvg from '../svg/standby/ipad-standby.svg?raw'
import '../styles/ipad-standby.css'

const standbySvgLayer = standbySvg
  .replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ')
  .replace(/<rect width="1024" height="1366"[^>]*\/>\s*/, '')
  .replace(/<rect x="-53" y="5\.97098e-05" width="1455" height="1014" fill="url\(#pattern0_518_6133\)"\/>\s*/, '')
  .replace(/<path d="M618\.436 705\.832[\s\S]*?\/>\s*<\/g>/, '</g>')

export default function IpadStandbyPage() {
  return (
    <a className="ipad-standby-page" href="?mode=create" aria-label="点击屏幕，开始AI混曲体验">
      <div className="ipad-standby-canvas">
        <img src="/dashboard-background.png" className="ipad-standby-bg" alt="" aria-hidden="true" />
        <InlineSvg html={standbySvgLayer} className="ipad-standby-svg" />
        <div className="ipad-standby-copy" aria-hidden="true">
          <span>点击屏幕</span>
          <span>开始AI混曲体验~</span>
        </div>
      </div>
    </a>
  )
}
