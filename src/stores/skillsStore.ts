import { create } from 'zustand'
import type { HermesSkill } from '@/types/hermes'

interface SkillsStore {
  skills: HermesSkill[]
  loading: boolean
  error?: string
  setSkills: (skills: HermesSkill[]) => void
  setLoading: (value: boolean) => void
  setError: (error?: string) => void
}

export const useSkillsStore = create<SkillsStore>((set) => ({
  skills: [],
  loading: false,
  setSkills: (skills) => set({ skills, error: undefined }),
  setLoading: (value) => set({ loading: value }),
  setError: (error) => set({ error }),
}))
