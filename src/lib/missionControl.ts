import type { GatewayModel, HermesSkill, HermesToolset } from '@/types/hermes'
import type {
  HermesCapabilitiesSummary,
  MissionControlOverview,
  MissionControlSection,
} from '@/types/missionControl'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function sectionItems(raw: unknown): unknown {
  const record = asRecord(raw)
  if (!record) return raw
  if (Array.isArray(record.data)) return record.data
  if (Array.isArray(record.items)) return record.items
  if (record.data && typeof record.data === 'object') return record.data
  if (record.payload && typeof record.payload === 'object') return record.payload
  return record
}

function sectionAvailable(raw: unknown, hasItems: boolean): boolean {
  const record = asRecord(raw)
  if (record && typeof record.available === 'boolean') return record.available
  return hasItems
}

function sectionDetail(raw: unknown): string | undefined {
  const record = asRecord(raw)
  if (typeof record?.detail === 'string') return record.detail
  if (typeof record?.error === 'string') return record.error
  if (typeof record?.message === 'string') return record.message
  return undefined
}

function normalizeGatewayModel(raw: Record<string, unknown>): GatewayModel | null {
  const id = typeof raw.id === 'string' ? raw.id : ''
  if (!id) return null
  const capabilities = asRecord(raw.capabilities) ?? {}
  return {
    id,
    provider: typeof raw.provider === 'string' ? raw.provider : '',
    model: typeof raw.model === 'string' ? raw.model : id,
    provider_label:
      typeof raw.provider_label === 'string' ? raw.provider_label : String(raw.provider ?? ''),
    capabilities: {
      fast: Boolean(capabilities.fast),
      reasoning: Boolean(capabilities.reasoning),
      can_disable_reasoning: Boolean(capabilities.can_disable_reasoning),
    },
  }
}

function normalizeSkill(raw: Record<string, unknown>): HermesSkill | null {
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null
  return {
    id: name,
    name,
    description: typeof raw.description === 'string' ? raw.description : '',
    category:
      typeof raw.category === 'string' && raw.category.trim()
        ? raw.category.trim()
        : 'uncategorized',
  }
}

function normalizeToolset(raw: Record<string, unknown>): HermesToolset | null {
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null
  const tools = Array.isArray(raw.tools)
    ? raw.tools.filter((item): item is string => typeof item === 'string')
    : []
  return {
    id: name,
    name,
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim() : name,
    description: typeof raw.description === 'string' ? raw.description : '',
    enabled: raw.enabled !== false,
    configured: raw.configured !== false,
    tools,
  }
}

function normalizeCapabilities(raw: unknown): HermesCapabilitiesSummary | null {
  const record = asRecord(raw)
  if (!record) return null
  const nested = asRecord(record.data) ?? record
  const featuresRaw = asRecord(nested.features) ?? {}
  const features: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(featuresRaw)) {
    if (typeof value === 'boolean') {
      features[key] = value
      continue
    }
    const nestedFeature = asRecord(value)
    if (nestedFeature && typeof nestedFeature.supported === 'boolean') {
      features[key] = nestedFeature.supported
      continue
    }
    if (nestedFeature && typeof nestedFeature.enabled === 'boolean') {
      features[key] = nestedFeature.enabled
      continue
    }
    features[key] = Boolean(value)
  }
  return {
    platform: typeof nested.platform === 'string' ? nested.platform : undefined,
    model: typeof nested.model === 'string' ? nested.model : undefined,
    features,
    raw: nested,
  }
}

function mapSection<T>(
  raw: unknown,
  mapItems: (value: unknown) => T,
  empty: T,
): MissionControlSection<T> {
  try {
    const items = mapItems(sectionItems(raw))
    const available = sectionAvailable(raw, true)
    return {
      available,
      detail: sectionDetail(raw),
      items: available ? items : empty,
    }
  } catch (error) {
    return {
      available: false,
      detail: error instanceof Error ? error.message : 'Unavailable',
      items: empty,
    }
  }
}

export function normalizeMissionControlOverview(
  payload: unknown,
  source: MissionControlOverview['source'] = 'overview',
): MissionControlOverview {
  const root = asRecord(payload) ?? {}

  return {
    models: mapSection(
      root.models,
      (value) => {
        const list = Array.isArray(value)
          ? value
          : Array.isArray(asRecord(value)?.data)
            ? (asRecord(value)?.data as unknown[])
            : []
        return list
          .map((item) => normalizeGatewayModel(asRecord(item) ?? {}))
          .filter((item): item is GatewayModel => item != null)
      },
      [],
    ),
    capabilities: mapSection(
      root.capabilities,
      (value) => normalizeCapabilities(value),
      null,
    ),
    skills: mapSection(
      root.skills,
      (value) => {
        const list = Array.isArray(value) ? value : []
        return list
          .map((item) => normalizeSkill(asRecord(item) ?? {}))
          .filter((item): item is HermesSkill => item != null)
      },
      [],
    ),
    toolsets: mapSection(
      root.toolsets,
      (value) => {
        const list = Array.isArray(value) ? value : []
        return list
          .map((item) => normalizeToolset(asRecord(item) ?? {}))
          .filter((item): item is HermesToolset => item != null)
      },
      [],
    ),
    source,
    fetchedAt: new Date().toISOString(),
  }
}

export function emptyMissionControlOverview(
  detail: string,
): MissionControlOverview {
  return {
    models: { available: false, detail, items: [] },
    capabilities: { available: false, detail, items: null },
    skills: { available: false, detail, items: [] },
    toolsets: { available: false, detail, items: [] },
    source: 'fallback',
    fetchedAt: new Date().toISOString(),
  }
}
