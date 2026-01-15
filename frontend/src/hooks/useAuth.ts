import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/services/api'
import { ROUTES } from '@/config'
import type { LoginCredentials } from '@/types'

export function useLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      login(data.user, {
        access: data.access,
        refresh: data.refresh,
      })
      toast.success(`Welcome back, ${data.user.first_name}!`)
      navigate(ROUTES.DASHBOARD, { replace: true })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout()
      toast.success('Logged out successfully')
      navigate(ROUTES.LOGIN, { replace: true })
    },
  })
}

export function useCurrentUser() {
  const { tokens, setUser, logout } = useAuthStore()

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const user = await authService.getMe()
        setUser(user)
        return user
      } catch (error) {
        logout()
        throw error
      }
    },
    enabled: !!tokens?.access,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })
}

