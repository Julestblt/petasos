import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { gatewayClient } from '@/services/gatewayClient'
import type { ModelMode, ModelPolicy } from '@/types/hermes'

interface ModelModeStore {
  mode: ModelMode
  modes: ModelPolicy[]
  loading: boolean
  error?: string
  setMode: (mode: ModelMode) => void
  refresh: () => Promise<ModelPolicy[]>
}

const FALLBACK_MODES: ModelPolicy[] = [
  {
    id: 'auto',
    label: 'Auto',
    description: 'Homelab default: DeepSeek V4.1 Flash',
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'DeepSeek V4.1 Flash, low reasoning',
  },
  {
    id: 'dev',
    label: 'Dev',
    description: 'GPT-5.6 Terra, high reasoning',
  },
]

export const useModelModeStore = create<ModelModeStore>()(
  persist(
    (set, get) => ({
      mode: 'auto',
      modes: FALLBACK_MODES,
      loading: false,
      setMode: (mode) => set({ mode }),
      refresh: async () => {
        set({ loading: true, error: undefined })
        try {
          const policy = await gatewayClient.getModelPolicy()
          const modes = policy.modes?.length ? policy.modes : FALLBACK_MODES
          const current = get().mode
          const nextMode = modes.some((item) => item.id === current)
            ? current
            : modes[0]?.id ?? 'auto'
          set({ modes, mode: nextMode, loading: false })
          return modes
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Model policy failed'
          set({ modes: FALLBACK_MODES, loading: false, error: message })
          return FALLBACK_MODES
        }
      },
    }),
    {
      name: 'petasos-model-mode',
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
)
