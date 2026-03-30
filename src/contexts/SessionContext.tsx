import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

export type UserRole = 'ADMIN' | 'STAFF' | 'USER'

export interface SessionUser {
  id?: string
  name: string
  email: string
  role: UserRole
  phone?: string
}

interface SessionContextType {
  user: SessionUser | null
  loading: boolean
  setUser: (user: SessionUser | null) => void
  clearSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  clearSession: async () => {},
})

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/get-session', true)
      .then((session) => {
        if (session?.user?.role) {
          setUser({
            id: session.user.id,
            name: session.user.name || session.user.email || '',
            email: session.user.email || '',
            role: session.user.role as UserRole,
            phone: session.user.phone || '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function clearSession() {
    try {
      await api.post('/auth/sign-out', {}, true)
    } catch {}
    setUser(null)
  }

  return (
    <SessionContext.Provider value={{ user, loading, setUser, clearSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
