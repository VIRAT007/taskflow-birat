/** Backend origin, or empty string in dev to use same-origin `/api/*` (Vite proxy). */
export function getApiOrigin(): string {
  if (import.meta.env.VITE_SAME_ORIGIN_API === 'true') {
    return ''
  }
  const raw = import.meta.env.VITE_API_URL
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.replace(/\/$/, '')
  }
  if (import.meta.env.DEV) {
    return ''
  }
  return 'http://localhost:3000'
}

/** Absolute URL for an API path like `/auth/login`. */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const origin = getApiOrigin()
  if (origin === '') {
    return `/api${p}`
  }
  return `${origin}${p}`
}
