import { create } from 'zustand'
import type { AppView } from '@/types/hermes'

interface UiStore {
  view: AppView
  setView: (view: AppView) => void
}

export const useUiStore = create<UiStore>((set) => ({
  view: 'console',
  setView: (view) => set({ view }),
}))
