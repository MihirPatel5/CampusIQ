import api from './api'
import { API_ENDPOINTS } from '@/config'
import { mockUsers, generateMockTokens } from './mockData'
import type { LoginCredentials, LoginResponse, User } from '@/types'

// Enable mock mode when API is unavailable (development/demo)
const USE_MOCK = true

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    if (USE_MOCK) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockUser = mockUsers[credentials.username]
      if (mockUser && mockUser.password === credentials.password) {
        const tokens = generateMockTokens()
        return {
          user: mockUser.user,
          access: tokens.access,
          refresh: tokens.refresh,
        }
      }
      throw new Error('Invalid username or password')
    }
    
    const response = await api.post<LoginResponse>(API_ENDPOINTS.LOGIN, credentials)
    return response.data
  },

  async logout(): Promise<void> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200))
      return
    }
    
    try {
      await api.post(API_ENDPOINTS.LOGOUT)
    } catch {
      // Ignore logout errors
    }
  },

  async getMe(): Promise<User> {
    if (USE_MOCK) {
      throw new Error('Not implemented in mock mode')
    }
    
    const response = await api.get<User>(API_ENDPOINTS.ME)
    return response.data
  },

  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    if (USE_MOCK) {
      return { access: 'mock_refreshed_' + Math.random().toString(36).substring(2) }
    }
    
    const response = await api.post<{ access: string }>(API_ENDPOINTS.REFRESH, {
      refresh: refreshToken,
    })
    return response.data
  },
}

export default authService

