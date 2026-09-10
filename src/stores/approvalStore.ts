import { create } from 'zustand'
import type { ApprovalDecision, ApprovalRequest } from '@/types/hermes'

interface ApprovalStore {
  pending?: ApprovalRequest
  resolving: boolean
  setPending: (request?: ApprovalRequest) => void
  setResolving: (value: boolean) => void
  clear: () => void
}

export const useApprovalStore = create<ApprovalStore>((set) => ({
  resolving: false,
  setPending: (request) => set({ pending: request }),
  setResolving: (value) => set({ resolving: value }),
  clear: () => set({ pending: undefined, resolving: false }),
}))

export type { ApprovalDecision }
