import { RUN_POLL_INTERVAL_MS, resolveGatewayBaseUrl } from '@/lib/constants'
import { createHttpFetch } from '@/lib/http'
import { gatewayAuthHeaders } from '@/services/gatewayAuth'
import type {
  CreateRunRequest,
  CreateRunResponse,
  HealthSnapshot,
  HermesRun,
  ModelPolicyResponse,
  RunStatus,
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

function isTerminalStatus(status: string): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
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
    const models = await this.probeModelPolicy()
    return {
      hermes: gateway.state,
      llm: models.state,
      hermesDetail: gateway.detail,
      llmDetail: models.detail,
      checkedAt,
    }
  }

  async getModelPolicy(): Promise<ModelPolicyResponse> {
    return this.requestJson<ModelPolicyResponse>('/v1/model-policy')
  }

  async createRun(body: CreateRunRequest): Promise<CreateRunResponse> {
    const payload = await this.requestJson<Record<string, unknown>>('/v1/runs', {
      method: 'POST',
      body: JSON.stringify({
        input: body.input,
        mode: body.mode ?? 'auto',
        ...(body.session_id ? { session_id: body.session_id } : {}),
      }),
      headers: {
        'Idempotency-Key': crypto.randomUUID(),
      },
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

  async waitForRun(
    runId: string,
    onUpdate?: (run: HermesRun) => void,
    signal?: AbortSignal,
  ): Promise<HermesRun> {
    while (true) {
      if (signal?.aborted) {
        throw new GatewayClientError('Run polling aborted')
      }
      const run = await this.getRun(runId)
      onUpdate?.(run)
      if (isTerminalStatus(String(run.status))) {
        return run
      }
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => resolve(), RUN_POLL_INTERVAL_MS)
        signal?.addEventListener(
          'abort',
          () => {
            window.clearTimeout(timer)
            reject(new GatewayClientError('Run polling aborted'))
          },
          { once: true },
        )
      })
    }
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

  private async probeModelPolicy(): Promise<{
    state: HealthSnapshot['llm']
    detail: string
  }> {
    try {
      const policy = await this.getModelPolicy()
      const modes = policy.modes?.map((mode) => mode.id) ?? []
      if (modes.length === 0) {
        return { state: 'degraded', detail: 'no modes advertised' }
      }
      return { state: 'online', detail: modes.join(', ') }
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

    return (await response.json()) as T
  }
}

export const gatewayClient = new GatewayClient()
