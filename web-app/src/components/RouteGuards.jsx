import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <main className="page">Loading session...</main>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function AdminRoute() {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <Navigate to="/packs" replace />
  }

  return <Outlet />
}
