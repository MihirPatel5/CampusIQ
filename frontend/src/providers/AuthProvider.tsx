import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { tokens, isAuthenticated, setUser, setHasHydrated } = useAuthStore()

    useEffect(() => {
        const initAuth = async () => {
            if (isAuthenticated && tokens?.access) {
                try {
                    const user = await authService.getMe()
                    setUser(user)
                } catch (error) {
                    console.error('Failed to fetch user profile:', error)
                    // If 401, the api interceptor will handle it or we logout
                    // logout() 
                }
            }
            setHasHydrated(true)
        }

        initAuth()
    }, [isAuthenticated, tokens?.access, setUser, setHasHydrated])

    return <>{children}</>
}
