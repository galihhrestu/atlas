import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { SessionUser, UserRole } from '../types'

const DEMO_USERS: Record<UserRole, SessionUser> = {
  user: {
    id: 'session-user',
    name: 'Galih Restu',
    title: 'Authorized Monitoring User',
    department: 'Management',
    role: 'user',
    initials: 'GR',
  },
  admin: {
    id: 'session-admin',
    name: 'Rina Kusuma',
    title: 'Monitoring Assurance Administrator',
    department: 'SSL Department',
    role: 'admin',
    initials: 'RK',
  },
}

interface AuthContextValue {
  user: SessionUser | null
  login: (role: UserRole) => void
  logout: () => void
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    const stored = localStorage.getItem('sigma-session')
    if (!stored) return null
    try {
      return JSON.parse(stored) as SessionUser
    } catch {
      return null
    }
  })

  const saveUser = (next: SessionUser | null) => {
    setUser(next)
    if (next) localStorage.setItem('sigma-session', JSON.stringify(next))
    else localStorage.removeItem('sigma-session')
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login: (role) => saveUser(DEMO_USERS[role]),
    logout: () => saveUser(null),
    switchRole: (role) => saveUser(DEMO_USERS[role]),
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
