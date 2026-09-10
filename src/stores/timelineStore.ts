import { create } from 'zustand'
import type { TimelineEvent } from '@/types/hermes'

interface TimelineStore {
  events: TimelineEvent[]
  collapsed: boolean
  push: (event: TimelineEvent) => void
  clear: () => void
  setCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  events: [],
  collapsed: false,
  push: (event) =>
    set((state) => ({
      events: [...state.events, event].slice(-500),
    })),
  clear: () => set({ events: [] }),
  setCollapsed: (collapsed) => set({ collapsed }),
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
}))
