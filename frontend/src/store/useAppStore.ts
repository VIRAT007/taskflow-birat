import { create } from 'zustand'

type AppState = {
  appName: string
}

export const useAppStore = create<AppState>(() => ({
  appName: 'Taskflow',
}))
