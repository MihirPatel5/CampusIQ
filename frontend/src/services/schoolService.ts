import api from './api'
import { API_ENDPOINTS } from '@/config'
import type { School } from '@/types'

export const schoolService = {
  async getSchools(): Promise<School[]> {
    const response = await api.get<any>(API_ENDPOINTS.SCHOOLS)
    // Handle both direct array and paginated response
    return Array.isArray(response.data) ? response.data : response.data.results
  },

  async getSchool(id: number): Promise<School> {
    const response = await api.get<School>(API_ENDPOINTS.SCHOOL_DETAIL(id))
    return response.data
  },

  async createSchool(data: Partial<School>): Promise<School> {
    const response = await api.post<School>(API_ENDPOINTS.SCHOOLS, data)
    return response.data
  },

  async updateSchool(id: number, data: Partial<School>): Promise<School> {
    const response = await api.patch<School>(API_ENDPOINTS.SCHOOL_DETAIL(id), data)
    return response.data
  },

  async deleteSchool(id: number): Promise<void> {
    await api.delete(API_ENDPOINTS.SCHOOL_DETAIL(id))
  },

  async getVerificationCode(): Promise<{ school_verification_code: string }> {
    const response = await api.get(API_ENDPOINTS.VERIFICATION_CODE)
    return response.data
  },

  async regenerateCode(): Promise<{ school_verification_code: string }> {
    const response = await api.post(API_ENDPOINTS.REGENERATE_CODE)
    return response.data
  },
}

export default schoolService
