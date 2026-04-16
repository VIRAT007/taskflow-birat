import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'taskflow-theme'

type ThemeState = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  cycleMode: () => void
}

const cycleOrder: ThemeMode[] = ['light', 'dark', 'system']

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') {
    return mode
  }
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyThemeToDocument(mode: ThemeMode): void {
  const resolved = resolveTheme(mode)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
      cycleMode: () => {
        const current = get().mode
        const idx = cycleOrder.indexOf(current)
        const next = cycleOrder[(idx + 1) % cycleOrder.length] ?? 'system'
        set({ mode: next })
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
)
