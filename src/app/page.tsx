'use client'

import { useEffect, useState } from 'react'
import { Loader2, GraduationCap } from 'lucide-react'
import { LoginScreen } from '@/components/study/login-screen'
import { AppShell } from '@/components/study/app-shell'
import { api } from '@/lib/client'

type User = { id: string; name: string; age: number }

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    api<{ user: User | null }>('/api/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setBooted(true))
  }, [])

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch {
      /* noop */
    }
    setUser(null)
  }

  if (!booted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <GraduationCap className="size-6" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading Smart Study Assistant…
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen onLogin={setUser} />
  return <AppShell user={user} onLogout={logout} />
}
