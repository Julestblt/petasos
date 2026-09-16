import { GatewayClientError, gatewayClient } from '@/services/gatewayClient'
import { useApprovalStore } from '@/stores/approvalStore'
import { useChatStore } from '@/stores/chatStore'
import { useConversationsStore } from '@/stores/conversationsStore'
import { useModelCatalogStore } from '@/stores/modelCatalogStore'
import type { ThinkingItem } from '@/types/hermes'

let activeStream: AbortController | undefined

export async function sendConversationMessage(input: string): Promise<string> {
  const assistantId = `msg_${crypto.randomUUID()}`
  const userId = `msg_${crypto.randomUUID()}`
  const catalog = useModelCatalogStore.getState()

  activeStream?.abort()
  activeStream = new AbortController()
  const signal = activeStream.signal

  useChatStore.getState().setSending(true)

  try {
    let conversationId =
      useConversationsStore.getState().activeId ??
      useChatStore.getState().conversationId

    if (!conversationId) {
      if (!catalog.modelId) {
        await catalog.refresh()
      }
      const created = await useConversationsStore
        .getState()
        .createNew(input.slice(0, 80))
      conversationId = created.id
    }

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
      thinking: [],
    })

    if (!useModelCatalogStore.getState().modelId) {
      await catalog.refresh()
    }

    const modelId = useModelCatalogStore.getState().modelId
    const reasoningEnabled = useModelCatalogStore.getState().reasoningEnabled()
    const reasoningEffort = useModelCatalogStore.getState().reasoningEffort

    await gatewayClient.streamConversationMessage(
      conversationId,
      {
        input,
        ...(modelId ? { model_id: modelId } : {}),
        ...(reasoningEnabled ? { reasoning_effort: reasoningEffort } : {}),
      },
      (event) => {
        if (event.runId) {
          useChatStore.getState().setActiveRunId(event.runId)
        }

        if (event.kind === 'assistant.delta' && event.delta) {
          useChatStore.getState().appendAssistantDelta(assistantId, event.delta)
          return
        }

        if (
          event.kind === 'tool.progress' ||
          event.kind === 'tool.started' ||
          event.kind === 'tool.completed' ||
          event.kind === 'tool.failed'
        ) {
          const item: ThinkingItem = {
            id: event.id,
            kind: event.kind,
            title: event.title ?? event.kind,
            detail: event.detail,
            toolName: event.toolName,
            createdAt: new Date().toISOString(),
          }
          useChatStore.getState().appendThinking(assistantId, item)
          return
        }

        if (event.kind === 'approval.request' && event.runId) {
          useApprovalStore.getState().setPending({
            id: event.id,
            runId: event.runId,
            title: event.title ?? 'Approval required',
            description:
              event.detail ??
              'Hermes is waiting for a manual decision before continuing.',
            toolName: event.toolName,
            payload: event.raw,
            createdAt: new Date().toISOString(),
          })
          return
        }

        if (
          event.kind === 'assistant.completed' ||
          event.kind === 'run.completed'
        ) {
          const content = event.content ?? event.detail
          useChatStore.getState().finalizeAssistant(assistantId, content)
        }

        if (event.kind === 'run.failed' || event.kind === 'run.cancelled') {
          useChatStore
            .getState()
            .finalizeAssistant(
              assistantId,
              event.detail ?? `Run ${event.kind.replace('run.', '')}`,
            )
        }
      },
      signal,
    )

    useChatStore.getState().finalizeAssistant(assistantId)
    void useConversationsStore
      .getState()
      .refresh({ preserveActive: true })
      .catch(() => undefined)
    return conversationId
  } catch (error) {
    if (signal.aborted) {
      useChatStore
        .getState()
        .finalizeAssistant(assistantId, 'Run stopped.')
      return (
        useConversationsStore.getState().activeId ??
        useChatStore.getState().conversationId ??
        ''
      )
    }
    if (error instanceof GatewayClientError && error.status === 422) {
      void useModelCatalogStore.getState().refresh().catch(() => undefined)
    }
    const message =
      error instanceof Error ? error.message : 'Failed to send message'
    useChatStore.getState().finalizeAssistant(assistantId, `Error: ${message}`)
    throw error
  } finally {
    if (activeStream?.signal === signal) {
      activeStream = undefined
    }
    useChatStore.getState().setSending(false)
    useChatStore.getState().setActiveRunId(undefined)
  }
}

export async function stopActiveRun(): Promise<void> {
  const runId = useChatStore.getState().activeRunId
  activeStream?.abort()
  if (runId) {
    await gatewayClient.stopRun(runId).catch(() => undefined)
  }
}

export async function steerActiveRun(input: string): Promise<void> {
  const runId = useChatStore.getState().activeRunId
  if (!runId) {
    throw new Error('No active run to steer')
  }
  await gatewayClient.steerRun(runId, input)
}
