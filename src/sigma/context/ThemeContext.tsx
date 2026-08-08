import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ThemeMode } from '../types'

interface ThemeContextValue {
  theme: ThemeMode
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('sigma-theme') as ThemeMode | null
    return stored ?? 'dark'
  })

  useEffect(() => {
    const sigmaRoot = document.querySelector<HTMLElement>('.sigma-app')
    sigmaRoot?.setAttribute('data-theme', theme)
    localStorage.setItem('sigma-theme', theme)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
    setTheme,
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
