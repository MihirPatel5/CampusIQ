import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { config } from '@/config'
import { useAuthStore } from '@/stores/authStore'

// Create axios instance
export const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (requestConfig: InternalAxiosRequestConfig) => {
    const tokens = useAuthStore.getState().tokens
    if (tokens?.access) {
      requestConfig.headers.Authorization = `Bearer ${tokens.access}`
    }
    return requestConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const tokens = useAuthStore.getState().tokens
      
      if (tokens?.refresh) {
        try {
          const response = await axios.post(
            `${config.apiBaseUrl}/auth/token/refresh/`,
            { refresh: tokens.refresh }
          )
          
          const newTokens = {
            access: response.data.access,
            refresh: tokens.refresh,
          }
          
          useAuthStore.getState().setTokens(newTokens)
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`
          
          return api(originalRequest)
        } catch {
          // Refresh failed - logout user
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(error)
        }
      }
    }
    
    return Promise.reject(error)
  }
)

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; message?: string; error?: string }>
    
    if (axiosError.response?.data) {
      const data = axiosError.response.data
      return data.detail || data.message || data.error || 'An error occurred'
    }
    
    if (axiosError.message) {
      return axiosError.message
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

export default api

