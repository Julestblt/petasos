import { create } from 'zustand'

export type ThemeMode = 'dark' | 'light'

interface ThemeStore {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggle: () => void
}

function readInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  const saved = window.localStorage.getItem('petasos.theme')
  if (saved === 'light' || saved === 'dark') return saved
  return 'dark'
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  window.localStorage.setItem('petasos.theme', theme)

  const darkFav = document.querySelector<HTMLLinkElement>('link[data-theme-favicon="dark"]')
  const lightFav = document.querySelector<HTMLLinkElement>('link[data-theme-favicon="light"]')
  if (darkFav) darkFav.disabled = theme !== 'dark'
  if (lightFav) lightFav.disabled = theme !== 'light'
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },
}))

export function initTheme() {
  applyTheme(useThemeStore.getState().theme)
}
