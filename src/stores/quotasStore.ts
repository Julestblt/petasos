import { create } from 'zustand'
import { CODEX_USAGE_URL, OPENCODE_GO_API_KEY } from '@/lib/constants'
import { fetchCodexUsage } from '@/services/codexUsageService'
import { fetchOpenCodeGoUsage } from '@/services/openCodeGoUsageService'
import type { ProviderQuota } from '@/types/quotas'

interface QuotasStore {
  providers: ProviderQuota[]
  loading: boolean
  error?: string
  refresh: () => Promise<ProviderQuota[]>
}

export const useQuotasStore = create<QuotasStore>((set) => ({
  providers: [],
  loading: false,
  refresh: async () => {
    set({ loading: true, error: undefined })

    const tasks: Array<Promise<ProviderQuota | null>> = []

    if (CODEX_USAGE_URL) {
      tasks.push(
        fetchCodexUsage().catch((error: unknown) => ({
          id: 'codex',
          label: 'Codex',
          available: false,
          primary: null,
          detail: error instanceof Error ? error.message : 'Codex quotas failed',
          fetchedAt: new Date().toISOString(),
        })),
      )
    }

    if (OPENCODE_GO_API_KEY) {
      tasks.push(
        fetchOpenCodeGoUsage().catch((error: unknown) => ({
          id: 'opencode-go',
          label: 'OpenCode Go',
          available: false,
          primary: null,
          detail:
            error instanceof Error ? error.message : 'OpenCode Go quotas failed',
          fetchedAt: new Date().toISOString(),
        })),
      )
    }

    if (tasks.length === 0) {
      set({ providers: [], loading: false })
      return []
    }

    const results = await Promise.all(tasks)
    const providers = results.filter((item): item is ProviderQuota => item != null)
    const firstError = providers.find((item) => !item.available && item.detail)?.detail
    set({ providers, loading: false, error: firstError })
    return providers
  },
}))
