import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import { isTauriRuntime } from '@/lib/constants'

export function createHttpFetch(): typeof fetch {
  if (isTauriRuntime()) {
    return tauriFetch as unknown as typeof fetch
  }
  return globalThis.fetch.bind(globalThis)
}
