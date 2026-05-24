import { useSyncExternalStore } from 'react'

type AppMode = 'dashboard' | 'home' | 'mobile' | 'vote' | 'create' | 'music-create' | 'standby'

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb)
  return () => window.removeEventListener('popstate', cb)
}

function getSnapshot(): AppMode {
  const mode = new URLSearchParams(window.location.search).get('mode')
  if (mode === 'home' || mode === 'mobile' || mode === 'vote' || mode === 'create' || mode === 'music-create' || mode === 'standby') return mode
  return 'dashboard'
}

export function useMobileMode(): AppMode {
  return useSyncExternalStore(subscribe, getSnapshot)
}
