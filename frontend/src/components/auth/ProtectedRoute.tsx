import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingState label="Validando sessão..." />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
