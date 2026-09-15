import {
  DEFAULT_MODEL,
  HERMES_API_KEY,
  OLLAMA_BASE_URL,
  PROBE_OLLAMA,
  resolveHermesBaseUrl,
} from '@/lib/constants'
import { createHttpFetch } from '@/lib/http'
import type {
  ApprovalDecision,
  CreateRunRequest,
  CreateRunResponse,
  HealthSnapshot,
  HermesCapabilities,
  HermesRun,
  TimelineEvent,
  TimelineEventKind,
} from '@/types/hermes'

export class HermesClientError extends Error {
  readonly status?: number
  readonly body?: string

  constructor(message: string, status?: number, body?: string) {
    super(message)
    this.name = 'HermesClientError'
    this.status = status
    this.body = body
  }
}

export interface HermesClientOptions {
  baseUrl?: string
  apiKey?: string
  ollamaBaseUrl?: string
  probeOllama?: boolean
  fetchImpl?: typeof fetch
}

type SseHandler = (event: TimelineEvent) => void

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

function authHeaders(apiKey: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  headers.set('Authorization', `Bearer ${apiKey}`)
  headers.set('Accept', 'application/json')
  return headers
}

function mapEventKind(type: string | undefined): TimelineEventKind {
  switch (type) {
    case 'run.started':
    case 'run.completed':
    case 'run.failed':
    case 'run.cancelled':
    case 'token.delta':
    case 'tool.started':
    case 'tool.completed':
    case 'tool.failed':
    case 'approval.required':
    case 'subagent.start':
    case 'subagent.complete':
      return type
    default:
      if (type?.startsWith('tool.')) return 'tool.started'
      if (type?.includes('approval')) return 'approval.required'
      if (type?.includes('subagent')) return 'subagent.start'
      return 'unknown'
  }
}

function titleForEvent(kind: TimelineEventKind, payload: Record<string, unknown>): string {
  const toolName =
    (payload.tool_name as string | undefined) ??
    (payload.name as string | undefined) ??
    (payload.tool as string | undefined)

  switch (kind) {
    case 'run.started':
      return 'Run started'
    case 'run.completed':
      return 'Run completed'
    case 'run.failed':
      return 'Run failed'
    case 'run.cancelled':
      return 'Run cancelled'
    case 'token.delta':
      return 'Token stream'
    case 'tool.started':
      return toolName ? `Tool · ${toolName}` : 'Tool started'
    case 'tool.completed':
      return toolName ? `Tool done · ${toolName}` : 'Tool completed'
    case 'tool.failed':
      return toolName ? `Tool failed · ${toolName}` : 'Tool failed'
    case 'approval.required':
      return 'Approval required'
    case 'subagent.start':
      return 'Sub-agent started'
    case 'subagent.complete':
      return 'Sub-agent completed'
    default:
      return (payload.type as string | undefined) ?? 'Event'
  }
}

function parseSseChunk(chunk: string, runId: string): TimelineEvent | null {
  const lines = chunk.split('\n')
  let eventType: string | undefined
  let dataRaw = ''
  let id: string | undefined

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataRaw += line.slice(5).trim()
    } else if (line.startsWith('id:')) {
      id = line.slice(3).trim()
    }
  }

  if (!dataRaw || dataRaw === '[DONE]') {
    return null
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(dataRaw) as Record<string, unknown>
  } catch {
    payload = { raw: dataRaw }
  }

  const type =
    eventType ??
    (payload.type as string | undefined) ??
    (payload.event as string | undefined)

  const kind = mapEventKind(type)
  const toolName =
    (payload.tool_name as string | undefined) ??
    (payload.name as string | undefined) ??
    (payload.tool as string | undefined)

  const detail =
    (payload.content as string | undefined) ??
    (payload.delta as string | undefined) ??
    (payload.output as string | undefined) ??
    (payload.message as string | undefined) ??
    (payload.summary as string | undefined) ??
    (typeof payload.arguments === 'string' ? payload.arguments : undefined)

  return {
    id: id ?? createId('evt'),
    seq: typeof payload.seq === 'number' ? payload.seq : id ? Number(id) : undefined,
    kind,
    title: titleForEvent(kind, { ...payload, type }),
    detail,
    toolName,
    runId,
    createdAt: new Date().toISOString(),
    raw: payload,
  }
}

export class HermesClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly ollamaBaseUrl: string
  private readonly probeOllama: boolean
  private readonly fetchImpl: typeof fetch

  constructor(options: HermesClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? resolveHermesBaseUrl()).replace(/\/$/, '')
    this.apiKey = options.apiKey ?? HERMES_API_KEY
    this.ollamaBaseUrl = (options.ollamaBaseUrl ?? OLLAMA_BASE_URL).replace(/\/$/, '')
    this.probeOllama = options.probeOllama ?? PROBE_OLLAMA
    this.fetchImpl = options.fetchImpl ?? createHttpFetch()
  }

  async checkHealth(): Promise<HealthSnapshot> {
    const checkedAt = new Date().toISOString()
    const hermes = await this.probeHermes()
    const llm = this.probeOllama
      ? await this.probeOllamaBackend()
      : await this.probeModelViaHermes()

    return {
      hermes: hermes.state,
      llm: llm.state,
      hermesDetail: hermes.detail,
      llmDetail: llm.detail,
      checkedAt,
    }
  }

  async getCapabilities(): Promise<HermesCapabilities> {
    return this.requestJson<HermesCapabilities>('/v1/capabilities')
  }

  async createRun(body: CreateRunRequest): Promise<CreateRunResponse> {
    return this.requestJson<CreateRunResponse>('/v1/runs', {
      method: 'POST',
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        ...body,
      }),
    })
  }

  async getRun(runId: string): Promise<HermesRun> {
    return this.requestJson<HermesRun>(`/v1/runs/${encodeURIComponent(runId)}`)
  }

  async stopRun(runId: string): Promise<{ status: string }> {
    return this.requestJson<{ status: string }>(
      `/v1/runs/${encodeURIComponent(runId)}/stop`,
      { method: 'POST' },
    )
  }

  async resolveApproval(
    runId: string,
    decision: ApprovalDecision,
    extra?: Record<string, unknown>,
  ): Promise<unknown> {
    return this.requestJson(`/v1/runs/${encodeURIComponent(runId)}/approval`, {
      method: 'POST',
      body: JSON.stringify({ decision, ...extra }),
    })
  }

  async streamRunEvents(
    runId: string,
    onEvent: SseHandler,
    signal?: AbortSignal,
  ): Promise<void> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/v1/runs/${encodeURIComponent(runId)}/events`,
      {
        method: 'GET',
        headers: authHeaders(this.apiKey, { Accept: 'text/event-stream' }),
        signal,
      },
    )

    if (!response.ok) {
      const body = await response.text()
      throw new HermesClientError(
        `Failed to open run event stream (${response.status})`,
        response.status,
        body,
      )
    }

    if (!response.body) {
      throw new HermesClientError('Run event stream body is empty')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''

      for (const part of parts) {
        const event = parseSseChunk(part.trim(), runId)
        if (event) onEvent(event)
      }
    }

    if (buffer.trim()) {
      const event = parseSseChunk(buffer.trim(), runId)
      if (event) onEvent(event)
    }
  }

  private async probeHermes(): Promise<{ state: HealthSnapshot['hermes']; detail: string }> {
    try {
      const live = await this.fetchImpl(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      if (!live.ok) {
        return { state: 'offline', detail: `HTTP ${live.status}` }
      }

      const livePayload = (await live.json()) as {
        status?: string
        version?: string
        platform?: string
      }
      const version = livePayload.version ? `v${livePayload.version}` : 'reachable'

      try {
        const detailed = await this.fetchImpl(`${this.baseUrl}/health/detailed`, {
          method: 'GET',
          headers: authHeaders(this.apiKey),
        })

        if (!detailed.ok) {
          return {
            state: detailed.status === 401 ? 'degraded' : 'online',
            detail:
              detailed.status === 401
                ? `${version} · auth failed`
                : `${version} · detailed HTTP ${detailed.status}`,
          }
        }

        const payload = (await detailed.json()) as {
          status?: string
          readiness?: { status?: string }
          gateway_state?: string
        }
        const readiness = payload.readiness?.status ?? payload.status
        if (readiness && readiness !== 'ok' && readiness !== 'healthy') {
          return { state: 'degraded', detail: `${version} · readiness: ${readiness}` }
        }

        return {
          state: 'online',
          detail: `${version} · gateway ${payload.gateway_state ?? 'ok'}`,
        }
      } catch {
        return { state: 'online', detail: `${version} · liveness ok` }
      }
    } catch (error) {
      return {
        state: 'offline',
        detail: error instanceof Error ? error.message : 'unreachable',
      }
    }
  }

  private async probeModelViaHermes(): Promise<{
    state: HealthSnapshot['llm']
    detail: string
  }> {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: authHeaders(this.apiKey),
      })

      if (!response.ok) {
        return {
          state: response.status === 401 ? 'offline' : 'degraded',
          detail: `HTTP ${response.status}`,
        }
      }

      const payload = (await response.json()) as {
        data?: Array<{ id?: string }>
      }
      const models = payload.data?.map((item) => item.id).filter(Boolean) ?? []
      if (models.length === 0) {
        return { state: 'degraded', detail: 'no models advertised' }
      }

      return {
        state: 'online',
        detail: models.join(', '),
      }
    } catch (error) {
      return {
        state: 'offline',
        detail: error instanceof Error ? error.message : 'unreachable',
      }
    }
  }

  private async probeOllamaBackend(): Promise<{
    state: HealthSnapshot['llm']
    detail: string
  }> {
    try {
      const response = await this.fetchImpl(`${this.ollamaBaseUrl}/api/tags`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        return { state: 'offline', detail: `HTTP ${response.status}` }
      }

      const payload = (await response.json()) as {
        models?: Array<{ name?: string }>
      }
      const count = payload.models?.length ?? 0
      return {
        state: count > 0 ? 'online' : 'degraded',
        detail: count > 0 ? `${count} model(s)` : 'no models pulled',
      }
    } catch (error) {
      return {
        state: 'offline',
        detail: error instanceof Error ? error.message : 'unreachable',
      }
    }
  }

  private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = authHeaders(this.apiKey, init?.headers)
    if (init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    })

    if (!response.ok) {
      const body = await response.text()
      throw new HermesClientError(
        `Hermes request failed (${response.status}) for ${path}`,
        response.status,
        body,
      )
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }
}

export const hermesClient = new HermesClient()
