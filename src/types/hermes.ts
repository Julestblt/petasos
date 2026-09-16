export type ConnectionState = 'unknown' | 'online' | 'degraded' | 'offline'

export type ChatRole = 'user' | 'assistant' | 'system'

export type ReasoningEffort = 'low' | 'medium' | 'high'

export type ApprovalChoice = 'once' | 'session' | 'always' | 'deny'

export interface ModelCapabilities {
  fast?: boolean
  reasoning?: boolean
  can_disable_reasoning?: boolean
}

export interface GatewayModel {
  id: string
  provider: string
  model: string
  provider_label: string
  capabilities: ModelCapabilities
}

export interface ThinkingItem {
  id: string
  kind: 'tool.progress' | 'tool.started' | 'tool.completed' | 'tool.failed'
  title: string
  detail?: string
  toolName?: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  runId?: string
  streaming?: boolean
  thinking?: ThinkingItem[]
}

export interface Conversation {
  id: string
  title?: string | null
  model?: string | null
  provider?: string | null
  model_id?: string | null
  pinned?: boolean
  archived?: boolean
  unread?: boolean
  started_at?: number
  updated_at?: number
  message_count?: number
}

export interface StreamMessageRequest {
  input: string
  model_id?: string
  reasoning_effort?: ReasoningEffort
  system_message?: string
}

export interface CreateConversationRequest {
  title?: string
  system_prompt?: string
  model_id: string
  reasoning_effort?: ReasoningEffort
}

export interface ConversationUpdateRequest {
  title?: string
  pinned?: boolean
  archived?: boolean
  hidden?: boolean
  unread?: boolean
}

export type StreamEventKind =
  | 'assistant.delta'
  | 'assistant.completed'
  | 'tool.progress'
  | 'tool.started'
  | 'tool.completed'
  | 'tool.failed'
  | 'approval.request'
  | 'run.completed'
  | 'run.failed'
  | 'run.cancelled'
  | 'unknown'

export interface StreamEvent {
  kind: StreamEventKind
  id: string
  delta?: string
  content?: string
  title?: string
  detail?: string
  toolName?: string
  runId?: string
  raw: Record<string, unknown>
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
  model_id: string
  reasoning_effort?: ReasoningEffort
  session_id?: string
}

export interface CreateRunResponse {
  run_id: string
  status: string
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

export interface HermesSkill {
  id: string
  name: string
  description: string
  category: string
}

export interface HealthSnapshot {
  hermes: ConnectionState
  llm: ConnectionState
  hermesDetail?: string
  llmDetail?: string
  checkedAt: string
}
