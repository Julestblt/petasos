import {
  HOST_METRICS_PASSWORD,
  HOST_METRICS_USERNAME,
  resolveHostMetricsUrl,
} from '@/lib/constants'
import { createHttpFetch } from '@/lib/http'

interface TokenCache {
  value: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null
let tokenPromise: Promise<string> | null = null

function glancesBaseUrl(): string {
  const url = resolveHostMetricsUrl()
  if (!url) {
    throw new Error('HOST_METRICS_URL is not configured')
  }
  return url.replace(/\/$/, '').replace(/\/(cpu|mem|fs|system|token)$/, '')
}

function decodeBasicAuth(username: string, password: string): string {
  const raw = `${username}:${password}`
  const bytes = new TextEncoder().encode(raw)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function extractToken(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim()
  }
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  for (const key of ['access_token', 'token', 'accessToken', 'jwt']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function extractExpiryMs(payload: unknown): number {
  const fallback = Date.now() + 50 * 60 * 1000
  if (!payload || typeof payload !== 'object') return fallback
  const record = payload as Record<string, unknown>
  if (typeof record.expires_in === 'number') {
    return Date.now() + Math.max(30, record.expires_in - 60) * 1000
  }
  if (typeof record.expiresIn === 'number') {
    return Date.now() + Math.max(30, record.expiresIn - 60) * 1000
  }
  return fallback
}

async function requestGlancesToken(): Promise<string> {
  if (!HOST_METRICS_USERNAME || !HOST_METRICS_PASSWORD) {
    throw new Error('Glances credentials are not configured')
  }

  const fetchImpl = createHttpFetch()
  const response = await fetchImpl(`${glancesBaseUrl()}/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: HOST_METRICS_USERNAME,
      password: HOST_METRICS_PASSWORD,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Glances token HTTP ${response.status}: ${body.slice(0, 160)}`)
  }

  const payload = (await response.json()) as unknown
  const token = extractToken(payload)
  if (!token) {
    throw new Error('Glances token response did not include a token')
  }

  tokenCache = {
    value: token,
    expiresAt: extractExpiryMs(payload),
  }
  return token
}

async function getGlancesToken(force = false): Promise<string> {
  if (!force && tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.value
  }
  if (!force && tokenPromise) return tokenPromise

  tokenPromise = requestGlancesToken().finally(() => {
    tokenPromise = null
  })
  return tokenPromise
}

export async function glancesFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const fetchImpl = createHttpFetch()
  const url = `${glancesBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  const hasCreds = Boolean(HOST_METRICS_USERNAME && HOST_METRICS_PASSWORD)

  if (hasCreds) {
    try {
      const token = await getGlancesToken()
      headers.set('Authorization', `Bearer ${token}`)
    } catch {
      headers.set(
        'Authorization',
        `Basic ${decodeBasicAuth(HOST_METRICS_USERNAME, HOST_METRICS_PASSWORD)}`,
      )
    }
  }

  let response = await fetchImpl(url, { ...init, headers })

  if (response.status === 401 && hasCreds) {
    try {
      const token = await getGlancesToken(true)
      headers.set('Authorization', `Bearer ${token}`)
      response = await fetchImpl(url, { ...init, headers })
    } catch {
      headers.set(
        'Authorization',
        `Basic ${decodeBasicAuth(HOST_METRICS_USERNAME, HOST_METRICS_PASSWORD)}`,
      )
      response = await fetchImpl(url, { ...init, headers })
    }
  }

  return response
}
