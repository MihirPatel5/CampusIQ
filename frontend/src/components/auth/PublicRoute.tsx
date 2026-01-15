import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { ROUTES } from '@/config'

export function PublicRoute() {
  const location = useLocation()
  const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore()

  // Show loading screen while hydrating from localStorage
  if (!_hasHydrated || isLoading) {
    return <LoadingScreen />
  }

  // Already authenticated - redirect to dashboard or intended page
  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname || ROUTES.DASHBOARD
    return <Navigate to={from} replace />
  }

  return <Outlet />
}

