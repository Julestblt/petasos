import { create } from 'zustand'
import { gatewayClient } from '@/services/gatewayClient'
import { useModelCatalogStore } from '@/stores/modelCatalogStore'
import { useSkillsStore } from '@/stores/skillsStore'
import type { MissionControlOverview } from '@/types/missionControl'

interface MissionControlStore {
  overview?: MissionControlOverview
  loading: boolean
  error?: string
  refresh: () => Promise<MissionControlOverview>
}

function hydrateFromOverview(overview: MissionControlOverview) {
  if (overview.models.available && overview.models.items.length > 0) {
    const catalog = useModelCatalogStore.getState()
    const current = catalog.modelId
    const nextId =
      (current && overview.models.items.some((model) => model.id === current) && current) ||
      overview.models.items[0]?.id
    useModelCatalogStore.setState({
      models: overview.models.items,
      modelId: nextId,
      loading: false,
      error: overview.models.available ? undefined : overview.models.detail,
    })
  } else if (!overview.models.available) {
    useModelCatalogStore.setState({
      loading: false,
      error: overview.models.detail,
    })
  }

  if (overview.skills.available) {
    useSkillsStore.getState().setSkills(overview.skills.items)
    useSkillsStore.getState().setLoading(false)
    useSkillsStore.getState().setError(undefined)
  } else {
    useSkillsStore.getState().setError(overview.skills.detail)
    useSkillsStore.getState().setLoading(false)
  }
}

export const useMissionControlStore = create<MissionControlStore>((set) => ({
  loading: false,
  refresh: async () => {
    set({ loading: true, error: undefined })
    try {
      const overview = await gatewayClient.getMissionControlOverview()
      hydrateFromOverview(overview)
      set({ overview, loading: false })
      return overview
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Mission Control overview failed'
      set({ loading: false, error: message })
      throw error
    }
  },
}))
