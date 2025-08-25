import { Navigate, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: ReactElement }) {
	const { user, loading } = useAuth()
	const loc = useLocation()
	if (loading) return null
	if (!user) return <Navigate to="/auth" state={{ from: loc.pathname }} replace />
	return children
}
