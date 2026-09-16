import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { gatewayClient } from '@/services/gatewayClient'
import { useChatStore } from '@/stores/chatStore'
import { useModelCatalogStore } from '@/stores/modelCatalogStore'
import type { Conversation } from '@/types/hermes'

interface ConversationsStore {
  conversations: Conversation[]
  activeId?: string
  loading: boolean
  error?: string
  filter: string
  setFilter: (value: string) => void
  refresh: (options?: { preserveActive?: boolean }) => Promise<Conversation[]>
  select: (id: string) => Promise<void>
  createNew: (title?: string) => Promise<Conversation>
  rename: (id: string, title: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  clearActive: () => void
}

export const useConversationsStore = create<ConversationsStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      loading: false,
      filter: '',
      setFilter: (value) => set({ filter: value }),
      refresh: async (options) => {
        const preserveActive = options?.preserveActive ?? false
        set({ loading: true, error: undefined })
        try {
          const conversations = await gatewayClient.listConversations()
          const sorted = [...conversations].sort((a, b) => {
            if (Boolean(a.pinned) !== Boolean(b.pinned)) {
              return a.pinned ? -1 : 1
            }
            return (
              (b.updated_at ?? b.started_at ?? 0) -
              (a.updated_at ?? a.started_at ?? 0)
            )
          })
          const activeId = get().activeId
          const chatConversationId = useChatStore.getState().conversationId
          const preferredId = activeId ?? chatConversationId
          const stillExists = preferredId
            ? sorted.some((item) => item.id === preferredId)
            : false

          set({
            conversations: sorted,
            activeId: preserveActive
              ? preferredId
              : stillExists
                ? preferredId
                : undefined,
            loading: false,
          })

          if (preserveActive && preferredId) {
            useChatStore.getState().setConversationId(preferredId)
          }

          return sorted
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to load conversations'
          set({ loading: false, error: message })
          throw error
        }
      },
      select: async (id) => {
        set({ activeId: id })
        useChatStore.getState().setConversationId(id)
        useChatStore.getState().setLoadingMessages(true)
        try {
          const messages = await gatewayClient.listMessages(id)
          useChatStore.getState().setMessages(messages)
          const conversation = get().conversations.find((item) => item.id === id)
          if (conversation?.model_id) {
            useModelCatalogStore.getState().setModelId(conversation.model_id)
          } else if (conversation?.model) {
            const match = useModelCatalogStore
              .getState()
              .models.find((model) => model.model === conversation.model)
            if (match) useModelCatalogStore.getState().setModelId(match.id)
          }
        } finally {
          useChatStore.getState().setLoadingMessages(false)
        }
      },
      createNew: async (title) => {
        const catalog = useModelCatalogStore.getState()
        if (!catalog.modelId) {
          await catalog.refresh()
        }
        const resolvedModelId = useModelCatalogStore.getState().modelId
        if (!resolvedModelId) {
          throw new Error('No gateway models available')
        }
        const reasoningEnabled = useModelCatalogStore.getState().reasoningEnabled()
        const conversation = await gatewayClient.createConversation({
          title: title?.slice(0, 80),
          model_id: resolvedModelId,
          ...(reasoningEnabled
            ? { reasoning_effort: useModelCatalogStore.getState().reasoningEffort }
            : {}),
        })
        set((state) => ({
          conversations: [
            conversation,
            ...state.conversations.filter((item) => item.id !== conversation.id),
          ],
          activeId: conversation.id,
        }))
        useChatStore.getState().setConversationId(conversation.id)
        return conversation
      },
      rename: async (id, title) => {
        const updated = await gatewayClient.updateConversation(id, { title })
        set((state) => ({
          conversations: state.conversations.map((item) =>
            item.id === id ? { ...item, ...(updated ?? {}), title } : item,
          ),
        }))
      },
      togglePin: async (id) => {
        const current = get().conversations.find((item) => item.id === id)
        const pinned = !current?.pinned
        const updated = await gatewayClient.updateConversation(id, { pinned })
        set((state) => ({
          conversations: state.conversations
            .map((item) =>
              item.id === id ? { ...item, ...(updated ?? {}), pinned } : item,
            )
            .sort((a, b) => {
              if (Boolean(a.pinned) !== Boolean(b.pinned)) {
                return a.pinned ? -1 : 1
              }
              return (b.updated_at ?? 0) - (a.updated_at ?? 0)
            }),
        }))
      },
      remove: async (id) => {
        await gatewayClient.deleteConversation(id)
        const activeId = get().activeId
        set((state) => ({
          conversations: state.conversations.filter((item) => item.id !== id),
          activeId: activeId === id ? undefined : activeId,
        }))
        if (activeId === id) {
          useChatStore.getState().clear()
        }
      },
      clearActive: () => {
        set({ activeId: undefined })
        useChatStore.getState().clear()
      },
    }),
    {
      name: 'petasos-conversations',
      partialize: (state) => ({ activeId: state.activeId }),
    },
  ),
)
