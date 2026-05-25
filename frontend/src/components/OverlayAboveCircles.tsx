import { memo } from 'react'
import overlayAboveSvg from '../svg/circles-overlay/OverlayAbove.svg?raw'

const OVERLAY_ABOVE_HTML = overlayAboveSvg
  .replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ')
  .replace('viewBox="0 0 1843 1213"', 'viewBox="-10.446 17 1843 1213"')
  .replace(/(<circle\b[^>]*\bfill-opacity=")([^"]+)(")/g, (_, prefix, value, suffix) => {
    const opacity = Number(value) * 0.5
    return `${prefix}${opacity}${suffix}`
  })

function OverlayAboveCircles() {
  return (
    <div
      className="overlay-above-svg absolute inset-0 z-[6] h-full w-full pointer-events-none"
      dangerouslySetInnerHTML={{ __html: OVERLAY_ABOVE_HTML }}
    />
  )
}

export default memo(OverlayAboveCircles)
