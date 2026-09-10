import { create } from 'zustand'
import { hermesClient } from '@/services/hermesClient'
import type { ConnectionState, HealthSnapshot } from '@/types/hermes'

interface ConnectionStore {
  hermes: ConnectionState
  llm: ConnectionState
  hermesDetail?: string
  llmDetail?: string
  checkedAt?: string
  checking: boolean
  error?: string
  setSnapshot: (snapshot: HealthSnapshot) => void
  refresh: () => Promise<HealthSnapshot>
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  hermes: 'unknown',
  llm: 'unknown',
  checking: false,
  setSnapshot: (snapshot) =>
    set({
      hermes: snapshot.hermes,
      llm: snapshot.llm,
      hermesDetail: snapshot.hermesDetail,
      llmDetail: snapshot.llmDetail,
      checkedAt: snapshot.checkedAt,
      error: undefined,
    }),
  refresh: async () => {
    set({ checking: true, error: undefined })
    try {
      const snapshot = await hermesClient.checkHealth()
      set({
        hermes: snapshot.hermes,
        llm: snapshot.llm,
        hermesDetail: snapshot.hermesDetail,
        llmDetail: snapshot.llmDetail,
        checkedAt: snapshot.checkedAt,
        checking: false,
      })
      return snapshot
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Health check failed'
      set({
        hermes: 'offline',
        llm: 'offline',
        checking: false,
        error: message,
        checkedAt: new Date().toISOString(),
      })
      throw error
    }
  },
}))
