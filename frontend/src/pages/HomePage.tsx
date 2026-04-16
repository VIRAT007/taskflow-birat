import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

export function HomePage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="container max-w-screen-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Welcome{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="mt-2 text-muted-foreground">
        You are signed in as <span className="font-medium text-foreground">{user?.email}</span>. Open your
        projects to manage work, or continue from the navbar.
      </p>
      <Link
        to="/projects"
        className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'mt-6 inline-flex')}
      >
        View projects
      </Link>
    </div>
  )
}
