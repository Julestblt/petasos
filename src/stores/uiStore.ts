import { create } from 'zustand'
import type { AppView } from '@/types/hermes'

interface UiStore {
  view: AppView
  setView: (view: AppView) => void
}

export const useUiStore = create<UiStore>((set) => ({
  view: 'status',
  setView: (view) => set({ view }),
}))
