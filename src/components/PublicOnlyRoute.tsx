import { Navigate, Outlet } from 'react-router-dom'
import { Spinner } from '@heroui/react'
import { useAuth } from '../auth/AuthContext'

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
