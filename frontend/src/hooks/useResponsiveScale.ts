import { useEffect, useState } from 'react'

const BASE_W = 1920
const BASE_H = 1080
const SCALE_EPSILON = 0.0005

function getScale() {
  return Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)
}

export function useResponsiveScale() {
  const [scale, setScale] = useState(getScale)

  useEffect(() => {
    let rafId = 0

    const update = () => {
      rafId = 0
      const next = getScale()
      setScale((prev) => (Math.abs(prev - next) < SCALE_EPSILON ? prev : next))
    }

    const onResize = () => {
      if (rafId !== 0) return
      rafId = window.requestAnimationFrame(update)
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (rafId !== 0) window.cancelAnimationFrame(rafId)
    }
  }, [])

  return scale
}
