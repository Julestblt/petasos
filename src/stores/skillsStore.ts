import { create } from 'zustand'
import type { SkillFile } from '@/types/hermes'

interface SkillsStore {
  skills: SkillFile[]
  selectedId?: string
  loading: boolean
  dirty: boolean
  draftContent: string
  error?: string
  setSkills: (skills: SkillFile[]) => void
  select: (id?: string) => void
  setDraftContent: (content: string) => void
  setLoading: (value: boolean) => void
  setError: (error?: string) => void
  markSaved: (content: string) => void
}

export const useSkillsStore = create<SkillsStore>((set, get) => ({
  skills: [],
  loading: false,
  dirty: false,
  draftContent: '',
  setSkills: (skills) => set({ skills, error: undefined }),
  select: (id) => {
    const skill = get().skills.find((item) => item.id === id)
    set({
      selectedId: id,
      draftContent: skill?.content ?? '',
      dirty: false,
    })
  },
  setDraftContent: (content) => {
    const selected = get().skills.find((item) => item.id === get().selectedId)
    set({
      draftContent: content,
      dirty: content !== (selected?.content ?? ''),
    })
  },
  setLoading: (value) => set({ loading: value }),
  setError: (error) => set({ error }),
  markSaved: (content) =>
    set((state) => ({
      dirty: false,
      draftContent: content,
      skills: state.skills.map((skill) =>
        skill.id === state.selectedId
          ? { ...skill, content, updatedAt: new Date().toISOString() }
          : skill,
      ),
    })),
}))
