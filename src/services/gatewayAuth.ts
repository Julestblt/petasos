import { invoke } from '@tauri-apps/api/core'
import { isTauriRuntime } from '@/lib/constants'

let cachedKey: string | null = null

export async function resolveGatewayApiKey(): Promise<string | null> {
  if (!isTauriRuntime()) {
    return null
  }
  if (cachedKey) return cachedKey
  try {
    const key = (await invoke<string>('gateway_api_key')).trim()
    cachedKey = key.length > 0 ? key : null
    return cachedKey
  } catch {
    return null
  }
}

export async function gatewayAuthHeaders(extra?: HeadersInit): Promise<Headers> {
  const headers = new Headers(extra)
  headers.set('Accept', 'application/json')
  const key = await resolveGatewayApiKey()
  if (key) {
    headers.set('Authorization', `Bearer ${key}`)
  }
  return headers
}
