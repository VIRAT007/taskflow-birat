import { Outlet } from 'react-router-dom'

import { Navbar } from '@/components/layout/Navbar'

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
