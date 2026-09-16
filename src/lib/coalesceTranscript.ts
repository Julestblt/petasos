import type { ChatMessage, ThinkingItem } from '@/types/hermes'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function messageId(raw: Record<string, unknown>, index: number): string {
  if (typeof raw.id === 'string' && raw.id) return raw.id
  if (typeof raw.message_id === 'string' && raw.message_id) return raw.message_id
  return `msg_${index}`
}

function messageTimestamp(raw: Record<string, unknown>): string {
  if (typeof raw.created_at === 'string') return raw.created_at
  if (typeof raw.createdAt === 'string') return raw.createdAt
  if (typeof raw.timestamp === 'string') return raw.timestamp
  if (typeof raw.timestamp === 'number') {
    const ms = raw.timestamp < 1e12 ? raw.timestamp * 1000 : raw.timestamp
    return new Date(ms).toISOString()
  }
  return new Date().toISOString()
}

function textContent(raw: Record<string, unknown>): string {
  if (typeof raw.content === 'string') return raw.content
  if (typeof raw.text === 'string') return raw.text
  return ''
}

function toolCallsFrom(raw: Record<string, unknown>): ThinkingItem[] {
  if (!Array.isArray(raw.tool_calls)) return []
  const items: ThinkingItem[] = []
  for (const entry of raw.tool_calls) {
    const call = asRecord(entry)
    if (!call) continue
    const fn = asRecord(call.function)
    const toolName =
      (typeof fn?.name === 'string' && fn.name) ||
      (typeof call.name === 'string' && call.name) ||
      'tool'
    const args =
      (typeof fn?.arguments === 'string' && fn.arguments) ||
      (typeof call.arguments === 'string' && call.arguments) ||
      undefined
    items.push({
      id:
        (typeof call.id === 'string' && call.id) ||
        (typeof call.call_id === 'string' && call.call_id) ||
        `tool_start_${crypto.randomUUID()}`,
      kind: 'tool.started',
      title: `Tool · ${toolName}`,
      detail: args?.trim() || undefined,
      toolName,
      createdAt: messageTimestamp(raw),
    })
  }
  return items
}

function toolResultItem(raw: Record<string, unknown>, index: number): ThinkingItem {
  const toolName =
    (typeof raw.tool_name === 'string' && raw.tool_name) ||
    (typeof raw.name === 'string' && raw.name) ||
    'tool'
  const content = textContent(raw)
  return {
    id:
      (typeof raw.tool_call_id === 'string' && raw.tool_call_id) ||
      messageId(raw, index),
    kind: 'tool.completed',
    title: `Tool · ${toolName}`,
    detail: content.trim() || undefined,
    toolName,
    createdAt: messageTimestamp(raw),
  }
}

export function coalesceTranscript(rawMessages: unknown[]): ChatMessage[] {
  const result: ChatMessage[] = []
  let pendingThinking: ThinkingItem[] = []

  const flushThinkingOntoAssistant = (
    content: string,
    raw: Record<string, unknown>,
    index: number,
  ) => {
    result.push({
      id: messageId(raw, index),
      role: 'assistant',
      content,
      createdAt: messageTimestamp(raw),
      thinking: pendingThinking.length > 0 ? pendingThinking : undefined,
    })
    pendingThinking = []
  }

  rawMessages.forEach((entry, index) => {
    const raw = asRecord(entry)
    if (!raw) return
    const role = typeof raw.role === 'string' ? raw.role : 'assistant'
    const content = textContent(raw).trim()

    if (role === 'user') {
      if (pendingThinking.length > 0) {
        result.push({
          id: `thinking_${index}`,
          role: 'assistant',
          content: '',
          createdAt: messageTimestamp(raw),
          thinking: pendingThinking,
        })
        pendingThinking = []
      }
      result.push({
        id: messageId(raw, index),
        role: 'user',
        content: content || textContent(raw),
        createdAt: messageTimestamp(raw),
      })
      return
    }

    if (role === 'tool') {
      pendingThinking = [...pendingThinking, toolResultItem(raw, index)]
      return
    }

    if (role === 'system') {
      if (!content) return
      result.push({
        id: messageId(raw, index),
        role: 'system',
        content,
        createdAt: messageTimestamp(raw),
      })
      return
    }

    const started = toolCallsFrom(raw)
    if (started.length > 0) {
      pendingThinking = [...pendingThinking, ...started]
    }

    if (content) {
      flushThinkingOntoAssistant(content, raw, index)
      return
    }

    if (started.length === 0 && pendingThinking.length === 0) {
      return
    }
  })

  if (pendingThinking.length > 0) {
    result.push({
      id: `thinking_tail_${crypto.randomUUID()}`,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      thinking: pendingThinking,
    })
  }

  return result
}
