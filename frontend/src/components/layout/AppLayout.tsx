import { Outlet, useLocation } from 'react-router-dom'

import { Navbar } from '@/components/layout/Navbar'

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet key={location.pathname} />
      </main>
    </div>
  )
}
