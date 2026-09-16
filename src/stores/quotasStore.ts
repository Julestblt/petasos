import { create } from 'zustand'
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

    const results = await Promise.all([
      fetchCodexUsage().catch((error: unknown) => ({
        id: 'codex',
        label: 'Codex',
        available: false,
        primary: null,
        detail: error instanceof Error ? error.message : 'Codex quotas failed',
        fetchedAt: new Date().toISOString(),
      })),
      fetchOpenCodeGoUsage().catch((error: unknown) => ({
        id: 'opencode-go',
        label: 'OpenCode Go',
        available: false,
        primary: null,
        detail:
          error instanceof Error ? error.message : 'OpenCode Go quotas failed',
        fetchedAt: new Date().toISOString(),
      })),
    ])

    const firstError = results.find((item) => !item.available && item.detail)?.detail
    set({ providers: results, loading: false, error: firstError })
    return results
  },
}))
