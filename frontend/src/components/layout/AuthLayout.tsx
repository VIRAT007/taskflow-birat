import { Outlet } from 'react-router-dom'

import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useAppStore } from '@/store/useAppStore'

export function AuthLayout() {
  const appName = useAppStore((s) => s.appName)

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="border-b border-border bg-background/80 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex max-w-lg items-center justify-between gap-3">
          <span className="text-lg font-semibold tracking-tight">{appName}</span>
          <ThemeToggle />
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
