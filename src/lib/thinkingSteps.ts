import type { ThinkingItem } from '@/types/hermes'

export type ThinkingStepStatus = 'running' | 'done' | 'failed'

export interface ThinkingStep {
  id: string
  toolName: string
  status: ThinkingStepStatus
  command?: string
  fields?: Array<{ label: string; value: string }>
  output?: string
  error?: string
  exitCode?: number | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function parseJson(value?: string): unknown {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return undefined
  }
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function isShellTool(toolName: string): boolean {
  const name = toolName.toLowerCase()
  return (
    name === 'terminal' ||
    name === 'shell' ||
    name === 'bash' ||
    name === 'run_terminal_cmd' ||
    name === 'execute'
  )
}

function fieldsFromArgs(toolName: string, args: Record<string, unknown>): Array<{
  label: string
  value: string
}> {
  const preferred =
    toolName === 'search_files'
      ? ['path', 'pattern', 'target', 'limit']
      : Object.keys(args).filter((key) => key !== 'command')

  const fields: Array<{ label: string; value: string }> = []
  const seen = new Set<string>()

  for (const key of preferred) {
    if (!(key in args) || seen.has(key)) continue
    seen.add(key)
    const value = stringifyValue(args[key]).trim()
    if (!value) continue
    fields.push({ label: key, value })
  }

  for (const [key, raw] of Object.entries(args)) {
    if (seen.has(key) || key === 'command') continue
    const value = stringifyValue(raw).trim()
    if (!value) continue
    fields.push({ label: key, value })
  }

  return fields.slice(0, 8)
}

function applyStarted(step: ThinkingStep, detail?: string) {
  const parsed = parseJson(detail)
  const record = asRecord(parsed)

  if (record) {
    if (typeof record.command === 'string' && record.command.trim()) {
      step.command = record.command.trim()
    }
    step.fields = fieldsFromArgs(step.toolName, record)
    return
  }

  if (detail?.trim() && isShellTool(step.toolName)) {
    step.command = detail.trim()
  }
}

function applyResult(step: ThinkingStep, detail?: string, failed = false) {
  const parsed = parseJson(detail)
  const record = asRecord(parsed)

  if (record) {
    if (typeof record.command === 'string' && record.command.trim() && !step.command) {
      step.command = record.command.trim()
    }
    if (typeof record.output === 'string') {
      step.output = record.output
    } else if (typeof record.content === 'string') {
      step.output = record.content
    } else if (typeof record.result === 'string') {
      step.output = record.result
    } else if (!('output' in record) && !('error' in record)) {
      step.output = JSON.stringify(record, null, 2)
    }

    if (typeof record.error === 'string' && record.error.trim()) {
      step.error = record.error.trim()
    } else if (record.error != null && record.error !== false) {
      step.error = stringifyValue(record.error)
    }

    if (typeof record.exit_code === 'number') {
      step.exitCode = record.exit_code
    } else if (record.exit_code === null) {
      step.exitCode = null
    }

    if (!step.fields?.length) {
      const argKeys = ['path', 'pattern', 'target', 'limit', 'query', 'file', 'cwd']
      const argRecord: Record<string, unknown> = {}
      for (const key of argKeys) {
        if (key in record) argRecord[key] = record[key]
      }
      if (Object.keys(argRecord).length > 0) {
        step.fields = fieldsFromArgs(step.toolName, argRecord)
      }
    }
  } else if (detail?.trim()) {
    step.output = detail
  }

  if (failed || (typeof step.exitCode === 'number' && step.exitCode !== 0) || step.error) {
    step.status = 'failed'
  } else {
    step.status = 'done'
  }
}

export function buildThinkingSteps(items: ThinkingItem[]): ThinkingStep[] {
  const steps: ThinkingStep[] = []
  const byId = new Map<string, ThinkingStep>()

  const ensureStep = (item: ThinkingItem): ThinkingStep => {
    const existing = byId.get(item.id)
    if (existing) return existing

    const open = [...steps]
      .reverse()
      .find(
        (step) =>
          step.status === 'running' && step.toolName === (item.toolName ?? 'tool'),
      )
    if (
      open &&
      (item.kind === 'tool.completed' ||
        item.kind === 'tool.failed' ||
        item.kind === 'tool.progress')
    ) {
      byId.set(item.id, open)
      return open
    }

    const step: ThinkingStep = {
      id: item.id,
      toolName: item.toolName ?? 'tool',
      status: 'running',
    }
    steps.push(step)
    byId.set(item.id, step)
    return step
  }

  for (const item of items) {
    const step = ensureStep(item)

    if (item.toolName) step.toolName = item.toolName

    if (item.kind === 'tool.started' || item.kind === 'tool.progress') {
      applyStarted(step, item.detail)
      if (item.kind === 'tool.progress' && step.status === 'running') {
        const parsed = parseJson(item.detail)
        const record = asRecord(parsed)
        if (record && typeof record.output === 'string') {
          step.output = record.output
        } else if (item.detail && !step.command) {
          step.output = item.detail
        }
      }
      continue
    }

    if (item.kind === 'tool.completed') {
      applyResult(step, item.detail, false)
      continue
    }

    if (item.kind === 'tool.failed') {
      applyResult(step, item.detail, true)
    }
  }

  return steps
}

export function executedCommands(steps: ThinkingStep[]): string[] {
  return steps
    .map((step) => step.command?.trim())
    .filter((value): value is string => Boolean(value))
}

export function summarizeThinking(steps: ThinkingStep[]): string {
  const commands = executedCommands(steps)
  if (commands.length === 1) return commands[0]
  if (commands.length > 1) return `${commands.length} commands`
  if (steps.length === 1) return steps[0].toolName
  return `${steps.length} steps`
}
