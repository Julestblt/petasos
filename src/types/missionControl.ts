import type { GatewayModel, HermesSkill, HermesToolset } from '@/types/hermes'

export interface MissionControlSection<T> {
  available: boolean
  detail?: string
  items: T
}

export interface HermesCapabilitiesSummary {
  platform?: string
  model?: string
  features: Record<string, boolean>
  raw: Record<string, unknown>
}

export interface MissionControlOverview {
  models: MissionControlSection<GatewayModel[]>
  capabilities: MissionControlSection<HermesCapabilitiesSummary | null>
  skills: MissionControlSection<HermesSkill[]>
  toolsets: MissionControlSection<HermesToolset[]>
  source: 'overview' | 'fallback'
  fetchedAt: string
}
