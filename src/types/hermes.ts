export type ConnectionState = 'unknown' | 'online' | 'degraded' | 'offline'

export type ChatRole = 'user' | 'assistant' | 'system'

export type ModelMode = 'auto' | 'admin' | 'dev'

export interface ModelPolicy {
  id: ModelMode
  label: string
  description: string
}

export interface ModelPolicyResponse {
  modes: ModelPolicy[]
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  runId?: string
  streaming?: boolean
}

export type RunStatus =
  | 'started'
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'stopping'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface HermesRun {
  object?: string
  run_id: string
  status: RunStatus | string
  session_id?: string
  model?: string
  output?: string
  error?: string
  usage?: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
  }
}

export interface CreateRunRequest {
  input: string
  mode?: ModelMode
  session_id?: string
}

export interface CreateRunResponse {
  run_id: string
  status: string
}

export type TimelineEventKind =
  | 'run.started'
  | 'run.completed'
  | 'run.failed'
  | 'run.cancelled'
  | 'token.delta'
  | 'tool.started'
  | 'tool.completed'
  | 'tool.failed'
  | 'approval.required'
  | 'subagent.start'
  | 'subagent.complete'
  | 'system'
  | 'unknown'

export interface TimelineEvent {
  id: string
  seq?: number
  kind: TimelineEventKind
  title: string
  detail?: string
  toolName?: string
  runId: string
  createdAt: string
  raw: Record<string, unknown>
}

export interface ApprovalRequest {
  id: string
  runId: string
  title: string
  description: string
  toolName?: string
  payload: Record<string, unknown>
  createdAt: string
}

export type ApprovalDecision = 'approve' | 'deny'

export interface SkillFile {
  id: string
  name: string
  path: string
  content: string
  updatedAt: string
}

export interface HealthSnapshot {
  hermes: ConnectionState
  llm: ConnectionState
  hermesDetail?: string
  llmDetail?: string
  checkedAt: string
}

export type AppView = 'status' | 'console' | 'skills'
