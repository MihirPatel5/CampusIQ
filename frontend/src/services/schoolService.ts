import api from './api'
import type { School, PublicSchool } from '@/types'

export const schoolService = {
  getPublicSchools: async (): Promise<PublicSchool[]> => {
    const response = await api.get('/schools/public/')
    return Array.isArray(response.data) ? response.data : (response.data.results || [])
  },
  getSchools: async (): Promise<School[]> => {
    const response = await api.get('/schools/')
    return Array.isArray(response.data) ? response.data : (response.data.results || [])
  },
  createSchool: async (data: Partial<School>): Promise<School> => {
    const response = await api.post('/schools/', data)
    return response.data
  },
  createMySchool: async (data: Partial<School>): Promise<School> => {
    const response = await api.post('/schools/onboard/', data)
    return response.data
  },
  updateSchool: async (id: number, data: Partial<School>): Promise<School> => {
    const response = await api.patch(`/schools/${id}/`, data)
    return response.data
  },
  deleteSchool: async (id: number): Promise<void> => {
    await api.delete(`/schools/${id}/`)
  },
}
