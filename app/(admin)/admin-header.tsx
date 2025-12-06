'use client'

import { signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminHeaderProps {
  user: {
    name?: string | null
    email: string
    role: string
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h2 className="text-sm text-zinc-500 dark:text-zinc-400">
          Panel de administración
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <User className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {user.name || user.email}
            </p>
            <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  )
}
