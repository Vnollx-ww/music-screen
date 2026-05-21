import { useEffect, useState } from 'react'

const BASE_W = 1920
const BASE_H = 1080

function getScale() {
  return Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)
}

export function useResponsiveScale() {
  const [scale, setScale] = useState(getScale)
  useEffect(() => {
    const h = () => setScale(getScale())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return scale
}
