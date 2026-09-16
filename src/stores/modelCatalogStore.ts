import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { gatewayClient } from '@/services/gatewayClient'
import type { GatewayModel, ReasoningEffort } from '@/types/hermes'

interface ModelCatalogStore {
  models: GatewayModel[]
  modelId?: string
  reasoningEffort: ReasoningEffort
  loading: boolean
  error?: string
  setModelId: (modelId: string) => void
  setReasoningEffort: (effort: ReasoningEffort) => void
  selectedModel: () => GatewayModel | undefined
  reasoningEnabled: () => boolean
  refresh: () => Promise<GatewayModel[]>
}

export const useModelCatalogStore = create<ModelCatalogStore>()(
  persist(
    (set, get) => ({
      models: [],
      reasoningEffort: 'medium',
      loading: false,
      setModelId: (modelId) => set({ modelId }),
      setReasoningEffort: (effort) => set({ reasoningEffort: effort }),
      selectedModel: () => get().models.find((model) => model.id === get().modelId),
      reasoningEnabled: () => Boolean(get().selectedModel()?.capabilities?.reasoning),
      refresh: async () => {
        set({ loading: true, error: undefined })
        try {
          const models = await gatewayClient.listModels()
          const current = get().modelId
          const nextId =
            (current && models.some((model) => model.id === current) && current) ||
            models[0]?.id
          set({ models, modelId: nextId, loading: false })
          return models
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to load models'
          set({ loading: false, error: message })
          throw error
        }
      },
    }),
    {
      name: 'petasos-model-catalog',
      partialize: (state) => ({
        modelId: state.modelId,
        reasoningEffort: state.reasoningEffort,
      }),
    },
  ),
)
