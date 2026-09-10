import { create } from 'zustand'
import type { ChatMessage } from '@/types/hermes'

interface ChatStore {
  sessionId: string
  messages: ChatMessage[]
  activeRunId?: string
  isSending: boolean
  addMessage: (message: ChatMessage) => void
  appendAssistantDelta: (messageId: string, delta: string) => void
  finalizeAssistant: (messageId: string, content?: string) => void
  setActiveRunId: (runId?: string) => void
  setSending: (value: boolean) => void
  clear: () => void
}

function createSessionId(): string {
  return `petasos_${crypto.randomUUID()}`
}

export const useChatStore = create<ChatStore>((set) => ({
  sessionId: createSessionId(),
  messages: [],
  isSending: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  appendAssistantDelta: (messageId, delta) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? { ...message, content: `${message.content}${delta}`, streaming: true }
          : message,
      ),
    })),
  finalizeAssistant: (messageId, content) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: content ?? message.content,
              streaming: false,
            }
          : message,
      ),
    })),
  setActiveRunId: (runId) => set({ activeRunId: runId }),
  setSending: (value) => set({ isSending: value }),
  clear: () =>
    set({
      sessionId: createSessionId(),
      messages: [],
      activeRunId: undefined,
      isSending: false,
    }),
}))
