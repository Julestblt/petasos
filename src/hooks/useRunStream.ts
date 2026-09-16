import { gatewayClient } from '@/services/gatewayClient'
import { useChatStore } from '@/stores/chatStore'
import { useModelModeStore } from '@/stores/modelModeStore'
import { useTimelineStore } from '@/stores/timelineStore'

export async function startRunWithStream(input: string): Promise<string> {
  let sessionId = useChatStore.getState().sessionId
  const mode = useModelModeStore.getState().mode
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
    if (!sessionId) {
      sessionId = `session_${crypto.randomUUID()}`
      useChatStore.getState().setSessionId(sessionId)
    }

    const run = await gatewayClient.createRun({
      input,
      mode,
      session_id: sessionId,
    })

    useChatStore.getState().setActiveRunId(run.run_id)
    useChatStore.setState((state) => ({
      messages: state.messages.map((message) =>
        message.id === assistantId
          ? { ...message, runId: run.run_id, streaming: true }
          : message,
      ),
    }))

    let lastStatus = run.status
    useTimelineStore.getState().push({
      id: `evt_${crypto.randomUUID()}`,
      kind: 'run.started',
      title: 'Run started',
      detail: `${run.run_id} · mode ${mode}`,
      runId: run.run_id,
      createdAt: new Date().toISOString(),
      raw: run as unknown as Record<string, unknown>,
    })

    const finalRun = await gatewayClient.waitForRun(run.run_id, (current) => {
      if (current.status === lastStatus) return
      lastStatus = current.status
      if (
        current.status === 'completed' ||
        current.status === 'failed' ||
        current.status === 'cancelled'
      ) {
        return
      }
      useTimelineStore.getState().push({
        id: `evt_${crypto.randomUUID()}`,
        kind: 'system',
        title: `Run ${current.status}`,
        detail: current.model,
        runId: current.run_id,
        createdAt: new Date().toISOString(),
        raw: current as unknown as Record<string, unknown>,
      })
    })

    const terminalKind =
      finalRun.status === 'failed'
        ? 'run.failed'
        : finalRun.status === 'cancelled'
          ? 'run.cancelled'
          : 'run.completed'

    useTimelineStore.getState().push({
      id: `evt_${crypto.randomUUID()}`,
      kind: terminalKind,
      title:
        terminalKind === 'run.completed'
          ? 'Run completed'
          : terminalKind === 'run.failed'
            ? 'Run failed'
            : 'Run cancelled',
      detail: finalRun.error ?? finalRun.output?.slice(0, 160),
      runId: finalRun.run_id,
      createdAt: new Date().toISOString(),
      raw: finalRun as unknown as Record<string, unknown>,
    })

    const output =
      finalRun.output ??
      (finalRun.error ? `Error: ${finalRun.error}` : undefined) ??
      (finalRun.status === 'completed' ? '' : `Run ended with status ${finalRun.status}`)

    useChatStore.getState().finalizeAssistant(assistantId, output)
    return run.run_id
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to start gateway run'
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
