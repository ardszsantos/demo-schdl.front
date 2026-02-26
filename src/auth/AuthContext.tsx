import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe, type User } from '../api/auth'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setToken: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'schdl_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [token, setTokenState] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  )

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: () => getMe(token!),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  })

  // Token inválido/expirado — limpa localmente
  useEffect(() => {
    if (isError) {
      localStorage.removeItem(TOKEN_KEY)
      setTokenState(null)
    }
  }, [isError])

  function setToken(newToken: string) {
    localStorage.setItem(TOKEN_KEY, newToken)
    setTokenState(newToken)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setTokenState(null)
    qc.clear()
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        token,
        isAuthenticated: !!user,
        isLoading: !!token && isLoading,
        setToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
