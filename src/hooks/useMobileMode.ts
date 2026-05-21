import { useSyncExternalStore } from 'react'

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb)
  return () => window.removeEventListener('popstate', cb)
}

function getSnapshot() {
  return new URLSearchParams(window.location.search).get('mode') === 'mobile'
}

export function useMobileMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
