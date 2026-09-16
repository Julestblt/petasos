import { create } from 'zustand'
import type { ChatMessage, ThinkingItem } from '@/types/hermes'

interface ChatStore {
  conversationId?: string
  messages: ChatMessage[]
  activeRunId?: string
  isSending: boolean
  loadingMessages: boolean
  setConversationId: (id?: string) => void
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  appendAssistantDelta: (messageId: string, delta: string) => void
  appendThinking: (messageId: string, item: ThinkingItem) => void
  finalizeAssistant: (messageId: string, content?: string) => void
  setActiveRunId: (runId?: string) => void
  setSending: (value: boolean) => void
  setLoadingMessages: (value: boolean) => void
  clear: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isSending: false,
  loadingMessages: false,
  setConversationId: (id) => set({ conversationId: id }),
  setMessages: (messages) => set({ messages }),
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
  appendThinking: (messageId, item) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              thinking: [...(message.thinking ?? []), item],
              streaming: true,
            }
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
  setLoadingMessages: (value) => set({ loadingMessages: value }),
  clear: () =>
    set({
      conversationId: undefined,
      messages: [],
      activeRunId: undefined,
      isSending: false,
      loadingMessages: false,
    }),
}))
