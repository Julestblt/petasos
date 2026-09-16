import { resolveGatewayBaseUrl } from '@/lib/constants'
import { createHttpFetch } from '@/lib/http'
import { coalesceTranscript } from '@/lib/coalesceTranscript'
import { gatewayAuthHeaders } from '@/services/gatewayAuth'
import type {
  ApprovalChoice,
  Conversation,
  ConversationUpdateRequest,
  CreateConversationRequest,
  CreateRunRequest,
  CreateRunResponse,
  ChatMessage,
  GatewayModel,
  HealthSnapshot,
  HermesRun,
  ReasoningEffort,
  RunStatus,
  StreamEvent,
  StreamEventKind,
  StreamMessageRequest,
} from '@/types/hermes'

export class GatewayClientError extends Error {
  readonly status?: number
  readonly body?: string

  constructor(message: string, status?: number, body?: string) {
    super(message)
    this.name = 'GatewayClientError'
    this.status = status
    this.body = body
  }
}

export interface GatewayClientOptions {
  baseUrl?: string
  fetchImpl?: typeof fetch
}

type StreamHandler = (event: StreamEvent) => void

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function normalizeRun(payload: Record<string, unknown>): HermesRun {
  const runId =
    (typeof payload.run_id === 'string' && payload.run_id) ||
    (typeof payload.id === 'string' && payload.id) ||
    ''
  return {
    object: typeof payload.object === 'string' ? payload.object : undefined,
    run_id: runId,
    status: (payload.status as RunStatus | string) ?? 'queued',
    session_id: typeof payload.session_id === 'string' ? payload.session_id : undefined,
    model: typeof payload.model === 'string' ? payload.model : undefined,
    output: typeof payload.output === 'string' ? payload.output : undefined,
    error: typeof payload.error === 'string' ? payload.error : undefined,
    usage:
      payload.usage && typeof payload.usage === 'object'
        ? (payload.usage as HermesRun['usage'])
        : undefined,
  }
}

function normalizeConversation(raw: Record<string, unknown>): Conversation | null {
  const id =
    (typeof raw.id === 'string' && raw.id) ||
    (typeof raw.session_id === 'string' && raw.session_id) ||
    ''
  if (!id) return null

  const provider = typeof raw.provider === 'string' ? raw.provider : null
  const model = typeof raw.model === 'string' ? raw.model : null
  const modelId =
    (typeof raw.model_id === 'string' && raw.model_id) ||
    (provider && model ? `${provider}/${model}` : null)

  const startedAt =
    typeof raw.started_at === 'number'
      ? raw.started_at
      : typeof raw.started_at === 'string'
        ? Number(raw.started_at)
        : undefined
  const lastActive =
    typeof raw.last_active === 'number'
      ? raw.last_active
      : typeof raw.updated_at === 'number'
        ? raw.updated_at
        : undefined

  return {
    id,
    title: typeof raw.title === 'string' ? raw.title : null,
    model,
    provider,
    model_id: modelId,
    pinned: Boolean(raw.pinned),
    archived: Boolean(raw.archived),
    unread: Boolean(raw.unread),
    started_at: Number.isFinite(startedAt) ? startedAt : undefined,
    updated_at: Number.isFinite(lastActive)
      ? lastActive
      : Number.isFinite(startedAt)
        ? startedAt
        : undefined,
    message_count: typeof raw.message_count === 'number' ? raw.message_count : undefined,
  }
}

function mapStreamKind(type: string | undefined): StreamEventKind {
  switch (type) {
    case 'assistant.delta':
    case 'assistant.completed':
    case 'tool.progress':
    case 'tool.started':
    case 'tool.completed':
    case 'tool.failed':
    case 'approval.request':
    case 'run.completed':
    case 'run.failed':
    case 'run.cancelled':
      return type
    case 'token.delta':
      return 'assistant.delta'
    case 'approval.required':
      return 'approval.request'
    default:
      if (type?.startsWith('tool.')) return 'tool.progress'
      if (type?.includes('approval')) return 'approval.request'
      if (type?.includes('delta')) return 'assistant.delta'
      return 'unknown'
  }
}

function parseSseChunk(chunk: string): StreamEvent | null {
  const lines = chunk.split('\n')
  let eventType: string | undefined
  let dataRaw = ''
  let id: string | undefined

  for (const line of lines) {
    if (line.startsWith('event:')) eventType = line.slice(6).trim()
    else if (line.startsWith('data:')) dataRaw += line.slice(5).trim()
    else if (line.startsWith('id:')) id = line.slice(3).trim()
  }

  if (!dataRaw || dataRaw === '[DONE]') return null

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
  const kind = mapStreamKind(type)
  const toolName =
    (payload.tool_name as string | undefined) ??
    (payload.name as string | undefined) ??
    (payload.tool as string | undefined)
  const delta =
    (payload.delta as string | undefined) ??
    (kind === 'assistant.delta'
      ? (payload.content as string | undefined) ?? (payload.text as string | undefined)
      : undefined)
  const detail =
    (payload.content as string | undefined) ??
    (payload.output as string | undefined) ??
    (payload.message as string | undefined) ??
    (payload.summary as string | undefined) ??
    (typeof payload.arguments === 'string' ? payload.arguments : undefined)

  return {
    kind,
    id: id ?? createId('evt'),
    delta,
    content: typeof payload.content === 'string' ? payload.content : undefined,
    title: toolName ? `Tool · ${toolName}` : type,
    detail,
    toolName,
    runId:
      (typeof payload.run_id === 'string' && payload.run_id) ||
      (typeof payload.runId === 'string' && payload.runId) ||
      undefined,
    raw: payload,
  }
}

export class GatewayClient {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(options: GatewayClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? resolveGatewayBaseUrl()).replace(/\/$/, '')
    this.fetchImpl = options.fetchImpl ?? createHttpFetch()
  }

  async checkHealth(): Promise<HealthSnapshot> {
    const checkedAt = new Date().toISOString()
    const gateway = await this.probeGateway()
    const models = await this.probeModels()
    return {
      hermes: gateway.state,
      llm: models.state,
      hermesDetail: gateway.detail,
      llmDetail: models.detail,
      checkedAt,
    }
  }

  async listModels(): Promise<GatewayModel[]> {
    const payload = await this.requestJson<{ data?: GatewayModel[] }>('/v1/models')
    return payload.data ?? []
  }

  async listConversations(): Promise<Conversation[]> {
    const payload = await this.requestJson<unknown>('/v1/conversations')
    const record = asRecord(payload)
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(record?.sessions)
        ? record.sessions
        : Array.isArray(record?.data)
          ? record.data
          : Array.isArray(record?.conversations)
            ? record.conversations
            : []
    return list
      .map((item) => normalizeConversation(asRecord(item) ?? {}))
      .filter((item): item is Conversation => item != null)
  }

  async createConversation(body: CreateConversationRequest): Promise<Conversation> {
    const payload = await this.requestJson<unknown>('/v1/conversations', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const record = asRecord(payload)
    const nested = asRecord(record?.session) ?? asRecord(record?.conversation) ?? record
    const conversation = nested ? normalizeConversation(nested) : null
    if (!conversation) {
      throw new GatewayClientError('Gateway did not return a conversation id')
    }
    return conversation
  }

  async updateConversation(
    id: string,
    body: ConversationUpdateRequest,
  ): Promise<Conversation | null> {
    const payload = await this.requestJson<unknown>(
      `/v1/conversations/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    )
    const record = asRecord(payload)
    const nested = asRecord(record?.session) ?? asRecord(record?.conversation) ?? record
    return nested ? normalizeConversation(nested) : null
  }

  async deleteConversation(id: string): Promise<void> {
    await this.requestJson(`/v1/conversations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }

  async listMessages(conversationId: string): Promise<ChatMessage[]> {
    const payload = await this.requestJson<unknown>(
      `/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    )
    const record = asRecord(payload)
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(record?.messages)
        ? record.messages
        : Array.isArray(record?.data)
          ? record.data
          : []
    return coalesceTranscript(list)
  }

  async setConversationModel(
    conversationId: string,
    modelId: string,
    reasoningEffort?: ReasoningEffort,
  ): Promise<void> {
    await this.requestJson(`/v1/conversations/${encodeURIComponent(conversationId)}/model`, {
      method: 'POST',
      body: JSON.stringify({
        model_id: modelId,
        ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      }),
    })
  }

  async streamConversationMessage(
    conversationId: string,
    body: StreamMessageRequest,
    onEvent: StreamHandler,
    signal?: AbortSignal,
  ): Promise<void> {
    const headers = await gatewayAuthHeaders({
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    })
    const response = await this.fetchImpl(
      `${this.baseUrl}/v1/conversations/${encodeURIComponent(conversationId)}/messages/stream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      },
    )

    if (!response.ok) {
      const text = await response.text()
      throw new GatewayClientError(
        `Stream failed (${response.status})`,
        response.status,
        text,
      )
    }
    if (!response.body) {
      throw new GatewayClientError('Stream body is empty')
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
        const event = parseSseChunk(part.trim())
        if (event) onEvent(event)
      }
    }

    if (buffer.trim()) {
      const event = parseSseChunk(buffer.trim())
      if (event) onEvent(event)
    }
  }

  async createRun(body: CreateRunRequest): Promise<CreateRunResponse> {
    const payload = await this.requestJson<Record<string, unknown>>('/v1/runs', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    })
    const run = normalizeRun(payload)
    if (!run.run_id) {
      throw new GatewayClientError('Gateway did not return a run id')
    }
    return { run_id: run.run_id, status: String(run.status) }
  }

  async getRun(runId: string): Promise<HermesRun> {
    const payload = await this.requestJson<Record<string, unknown>>(
      `/v1/runs/${encodeURIComponent(runId)}`,
    )
    return normalizeRun(payload)
  }

  async resolveApproval(runId: string, choice: ApprovalChoice): Promise<unknown> {
    return this.requestJson(`/v1/runs/${encodeURIComponent(runId)}/approval`, {
      method: 'POST',
      body: JSON.stringify({ choice }),
    })
  }

  async stopRun(runId: string): Promise<unknown> {
    return this.requestJson(`/v1/runs/${encodeURIComponent(runId)}/stop`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  private async probeGateway(): Promise<{
    state: HealthSnapshot['hermes']
    detail: string
  }> {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        return { state: 'offline', detail: `HTTP ${response.status}` }
      }
      const payload = (await response.json()) as {
        status?: string
        modules?: string[]
      }
      const modules = payload.modules?.join(', ') ?? 'ok'
      if (payload.status && payload.status !== 'ok') {
        return { state: 'degraded', detail: `${payload.status} · ${modules}` }
      }
      return { state: 'online', detail: modules }
    } catch (error) {
      return {
        state: 'offline',
        detail: error instanceof Error ? error.message : 'unreachable',
      }
    }
  }

  private async probeModels(): Promise<{
    state: HealthSnapshot['llm']
    detail: string
  }> {
    try {
      const models = await this.listModels()
      if (models.length === 0) {
        return { state: 'degraded', detail: 'no models advertised' }
      }
      return {
        state: 'online',
        detail: models.map((model) => model.model).join(', '),
      }
    } catch (error) {
      if (error instanceof GatewayClientError && error.status === 401) {
        return { state: 'offline', detail: 'auth failed' }
      }
      return {
        state: 'offline',
        detail: error instanceof Error ? error.message : 'unreachable',
      }
    }
  }

  private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = await gatewayAuthHeaders(init?.headers)
    if (init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    })

    if (!response.ok) {
      const body = await response.text()
      throw new GatewayClientError(
        `Gateway request failed (${response.status}) for ${path}`,
        response.status,
        body,
      )
    }

    if (response.status === 204) {
      return undefined as T
    }

    const text = await response.text()
    if (!text) return undefined as T
    return JSON.parse(text) as T
  }
}

export const gatewayClient = new GatewayClient()
