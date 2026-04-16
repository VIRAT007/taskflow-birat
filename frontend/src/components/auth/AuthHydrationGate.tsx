import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Spinner } from '@/components/ui/spinner'
import { useAuthStore } from '@/store/useAuthStore'

export function AuthHydrationGate() {
  const [ready, setReady] = useState(() => useAuthStore.persist.hasHydrated())

  useEffect(() => {
    return useAuthStore.persist.onFinishHydration(() => {
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Spinner className="size-8" />
        <p className="text-sm">Loading session…</p>
      </div>
    )
  }

  return <Outlet />
}
