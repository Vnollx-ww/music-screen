import { useEffect, useState } from 'react'

const SCALE_EPSILON = 0.0005

function getScale(designWidth: number, maxScale: number) {
  if (typeof window === 'undefined') return 1
  return Math.min(maxScale, window.innerWidth / designWidth)
}

export function useFitToWidth(designWidth: number, maxScale = 1.6) {
  const [scale, setScale] = useState(() => getScale(designWidth, maxScale))

  useEffect(() => {
    let rafId = 0

    const update = () => {
      rafId = 0
      const next = getScale(designWidth, maxScale)
      setScale((prev) => (Math.abs(prev - next) < SCALE_EPSILON ? prev : next))
    }

    const onResize = () => {
      if (rafId !== 0) return
      rafId = window.requestAnimationFrame(update)
    }

    onResize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (rafId !== 0) window.cancelAnimationFrame(rafId)
    }
  }, [designWidth, maxScale])

  return scale
}
