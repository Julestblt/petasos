import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage } from '@/types/hermes'

interface ChatStore {
  sessionId?: string
  messages: ChatMessage[]
  activeRunId?: string
  isSending: boolean
  addMessage: (message: ChatMessage) => void
  appendAssistantDelta: (messageId: string, delta: string) => void
  finalizeAssistant: (messageId: string, content?: string) => void
  setActiveRunId: (runId?: string) => void
  setSessionId: (sessionId?: string) => void
  setSending: (value: boolean) => void
  clear: () => void
}

export const useChatStore = create<ChatStore>()(persist((set) => ({
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
  setSessionId: (sessionId) => set({ sessionId }),
  setSending: (value) => set({ isSending: value }),
  clear: () =>
    set({
      sessionId: undefined,
      messages: [],
      activeRunId: undefined,
      isSending: false,
    }),
}), {
  name: 'petasos-chat',
  partialize: (state) => ({
    sessionId: state.sessionId,
    messages: state.messages,
  }),
}))
