const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
const configuredWsUrl = (import.meta.env.VITE_WS_URL as string | undefined)?.trim()

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  if (configuredApiBaseUrl) return trimTrailingSlash(configuredApiBaseUrl)
  return '/api'
}

export function getWebSocketUrl(): string {
  if (configuredWsUrl) return configuredWsUrl

  if (configuredApiBaseUrl) {
    const apiUrl = new URL(configuredApiBaseUrl, window.location.origin)
    apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    apiUrl.pathname = `${trimTrailingSlash(apiUrl.pathname)}/ws`
    apiUrl.search = ''
    apiUrl.hash = ''
    return apiUrl.toString()
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/ws`
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (body && typeof body === 'object') {
      const detail = (body as Record<string, unknown>).detail
      if (typeof detail === 'string' && detail.trim()) return detail
      if (Array.isArray(detail) && detail.length > 0) return '请求参数不正确'
      const message = (body as Record<string, unknown>).message
      if (typeof message === 'string' && message.trim()) return message
    }
  } catch {
    const text = await response.text().catch(() => '')
    if (text.trim()) return text.trim()
  }

  return `请求失败（${response.status}）`
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) throw new Error(await getErrorMessage(response))
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function apiFormRequest<T>(path: string, body: FormData, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    method: init?.method ?? 'POST',
    body,
  })

  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json() as Promise<T>
}

