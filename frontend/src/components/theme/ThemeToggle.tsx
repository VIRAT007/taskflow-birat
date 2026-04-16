import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { resolveTheme, useThemeStore, type ThemeMode } from '@/store/useThemeStore'

function themeIcon(mode: ThemeMode) {
  if (mode === 'light') {
    return <SunIcon className="size-4" aria-hidden />
  }
  if (mode === 'dark') {
    return <MoonIcon className="size-4" aria-hidden />
  }
  return <MonitorIcon className="size-4" aria-hidden />
}

function themeLabel(mode: ThemeMode): string {
  if (mode === 'light') {
    return 'Light theme'
  }
  if (mode === 'dark') {
    return 'Dark theme'
  }
  const resolved = resolveTheme('system')
  return `System theme (${resolved === 'dark' ? 'dark' : 'light'} now)`
}

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode)
  const cycleMode = useThemeStore((s) => s.cycleMode)

  const next: Record<ThemeMode, string> = {
    light: 'Switch to dark mode',
    dark: 'Switch to system preference',
    system: 'Switch to light mode',
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => cycleMode()}
      aria-label={`${themeLabel(mode)}. ${next[mode]}.`}
      title={`${themeLabel(mode)} — ${next[mode]}`}
    >
      {themeIcon(mode)}
    </Button>
  )
}
