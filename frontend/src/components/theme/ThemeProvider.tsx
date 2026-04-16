import { useLayoutEffect, useEffect, type ReactNode } from 'react'

import { applyThemeToDocument, useThemeStore } from '@/store/useThemeStore'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode)

  useLayoutEffect(() => {
    applyThemeToDocument(mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') {
      return
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      applyThemeToDocument('system')
    }
    mq.addEventListener('change', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
    }
  }, [mode])

  return children
}
