import { apiUrl } from '@/services/api'

export type ApiErrorBody = {
  requestId?: string
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown
  readonly requestId?: string

  constructor(status: number, code: string, message: string, details?: unknown, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }
}

function parseJsonSafe(text: string): unknown {
  if (!text.trim()) {
    return null
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export async function apiJson<TResponse>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<TResponse> {
  const url = apiUrl(path)
  const headers = new Headers(init.headers)
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (init.token) {
    headers.set('Authorization', `Bearer ${init.token}`)
  }

  let res: Response
  try {
    res = await fetch(url, { ...init, headers })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server. Check your connection and try again.')
  }

  const text = await res.text()
  const parsed = parseJsonSafe(text)

  if (!res.ok) {
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      const body = parsed as ApiErrorBody
      const err = body.error
      if (err && typeof err.code === 'string' && typeof err.message === 'string') {
        throw new ApiError(res.status, err.code, err.message, err.details, body.requestId)
      }
    }
    throw new ApiError(res.status, 'UNKNOWN_ERROR', res.statusText || 'Request failed')
  }

  return parsed as TResponse
}

export async function apiVoid(path: string, init: RequestInit & { token?: string | null } = {}): Promise<void> {
  const url = apiUrl(path)
  const headers = new Headers(init.headers)
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (init.token) {
    headers.set('Authorization', `Bearer ${init.token}`)
  }

  let res: Response
  try {
    res = await fetch(url, { ...init, headers })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server. Check your connection and try again.')
  }

  const text = await res.text()
  const parsed = parseJsonSafe(text)

  if (!res.ok) {
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      const body = parsed as ApiErrorBody
      const err = body.error
      if (err && typeof err.code === 'string' && typeof err.message === 'string') {
        throw new ApiError(res.status, err.code, err.message, err.details, body.requestId)
      }
    }
    throw new ApiError(res.status, 'UNKNOWN_ERROR', res.statusText || 'Request failed')
  }
}
