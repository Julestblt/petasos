import { hermesClient } from '@/services/hermesClient'
import { useApprovalStore } from '@/stores/approvalStore'
import { useChatStore } from '@/stores/chatStore'
import { useTimelineStore } from '@/stores/timelineStore'
import type { TimelineEvent } from '@/types/hermes'

function extractDelta(event: TimelineEvent): string | undefined {
  if (event.kind !== 'token.delta') return undefined
  const raw = event.raw
  return (
    (raw.delta as string | undefined) ??
    (raw.content as string | undefined) ??
    (raw.text as string | undefined) ??
    event.detail
  )
}

export async function startRunWithStream(input: string): Promise<string> {
  const sessionId = useChatStore.getState().sessionId
  const assistantId = `msg_${crypto.randomUUID()}`
  const userId = `msg_${crypto.randomUUID()}`

  useChatStore.getState().addMessage({
    id: userId,
    role: 'user',
    content: input,
    createdAt: new Date().toISOString(),
  })

  useChatStore.getState().addMessage({
    id: assistantId,
    role: 'assistant',
    content: '',
    createdAt: new Date().toISOString(),
    streaming: true,
  })

  useChatStore.getState().setSending(true)

  try {
    const run = await hermesClient.createRun({
      input,
      session_id: sessionId,
    })

    useChatStore.getState().setActiveRunId(run.run_id)
    useChatStore.getState().finalizeAssistant(assistantId)
    useChatStore.setState((state) => ({
      messages: state.messages.map((message) =>
        message.id === assistantId
          ? { ...message, runId: run.run_id, streaming: true }
          : message,
      ),
    }))

    useTimelineStore.getState().push({
      id: `evt_${crypto.randomUUID()}`,
      kind: 'run.started',
      title: 'Run started',
      detail: run.run_id,
      runId: run.run_id,
      createdAt: new Date().toISOString(),
      raw: run as unknown as Record<string, unknown>,
    })

    await hermesClient.streamRunEvents(run.run_id, (event) => {
      useTimelineStore.getState().push(event)

      const delta = extractDelta(event)
      if (delta) {
        useChatStore.getState().appendAssistantDelta(assistantId, delta)
      }

      if (event.kind === 'approval.required') {
        useApprovalStore.getState().setPending({
          id: event.id,
          runId: run.run_id,
          title: event.title,
          description:
            event.detail ??
            'Hermes is waiting for a manual decision before continuing.',
          toolName: event.toolName,
          payload: event.raw,
          createdAt: event.createdAt,
        })
      }

      if (
        event.kind === 'run.completed' ||
        event.kind === 'run.failed' ||
        event.kind === 'run.cancelled'
      ) {
        const output =
          (event.raw.output as string | undefined) ??
          (event.raw.content as string | undefined)
        useChatStore.getState().finalizeAssistant(assistantId, output)
        useChatStore.getState().setSending(false)
        useChatStore.getState().setActiveRunId(undefined)
      }
    })

    const finalRun = await hermesClient.getRun(run.run_id)
    if (finalRun.output) {
      useChatStore.getState().finalizeAssistant(assistantId, finalRun.output)
    } else {
      useChatStore.getState().finalizeAssistant(assistantId)
    }

    return run.run_id
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to start Hermes run'
    useChatStore.getState().finalizeAssistant(assistantId, `Error: ${message}`)
    useTimelineStore.getState().push({
      id: `evt_${crypto.randomUUID()}`,
      kind: 'system',
      title: 'Run error',
      detail: message,
      runId: 'local',
      createdAt: new Date().toISOString(),
      raw: { error: message },
    })
    throw error
  } finally {
    useChatStore.getState().setSending(false)
    useChatStore.getState().setActiveRunId(undefined)
  }
}
