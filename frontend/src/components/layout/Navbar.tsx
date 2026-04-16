import { NavLink, useNavigate } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'

function navClassName({ isActive }: { isActive: boolean }) {
  return cn(
    buttonVariants({ variant: 'ghost', size: 'sm' }),
    isActive && 'bg-muted text-foreground',
  )
}

export function Navbar() {
  const appName = useAppStore((s) => s.appName)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center gap-4 px-4">
        <NavLink
          to="/"
          className="text-lg font-semibold tracking-tight text-foreground hover:text-foreground/90"
        >
          {appName}
        </NavLink>
        <nav className="flex flex-1 items-center gap-1" aria-label="Main">
          <NavLink to="/" className={navClassName}>
            Home
          </NavLink>
          <NavLink to="/projects" className={navClassName}>
            Projects
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden max-w-[200px] truncate text-sm text-muted-foreground sm:inline">
                {user.name}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  logout()
                  navigate('/login', { replace: true })
                }}
              >
                Log out
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
