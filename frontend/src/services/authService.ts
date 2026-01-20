import api from './api'
import { API_ENDPOINTS } from '@/config'
import type { LoginCredentials, LoginResponse, User } from '@/types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.LOGIN, credentials)
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.LOGOUT)
    } catch {
      // Ignore logout errors
    }
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>(API_ENDPOINTS.ME)
    return response.data
  },

  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    const response = await api.post<{ access: string }>(API_ENDPOINTS.REFRESH, {
      refresh: refreshToken,
    })
    return response.data
  },

  async registerAdmin(data: any): Promise<{ message: string; email: string }> {
    const response = await api.post(API_ENDPOINTS.REGISTER_ADMIN, data)
    return response.data
  },

  async verifyOTP(email: string, otp: string): Promise<LoginResponse> {
    const response = await api.post(API_ENDPOINTS.VERIFY_OTP, { email, otp })
    return response.data
  },
}

export default authService

