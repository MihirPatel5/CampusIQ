import api from './api'
import { API_ENDPOINTS } from '@/config'
import type { Teacher, TeacherRegistrationData } from '@/types'

export const teacherService = {
  async registerTeacher(data: TeacherRegistrationData): Promise<{ message: string; teacher: Teacher }> {
    const response = await api.post(API_ENDPOINTS.TEACHER_SELF_REGISTER, data)
    return response.data
  },

  async getTeachers(params?: any): Promise<Teacher[]> {
    const response = await api.get<any>(API_ENDPOINTS.TEACHERS, { params })
    return Array.isArray(response.data) ? response.data : (response.data.results || [])
  },

  async getPendingTeachers(): Promise<Teacher[]> {
    const response = await api.get<any>(API_ENDPOINTS.PENDING_TEACHERS)
    return Array.isArray(response.data) ? response.data : (response.data.results || [])
  },

  async approveTeacher(id: number): Promise<{ message: string; teacher: Teacher }> {
    const response = await api.patch(API_ENDPOINTS.TEACHER_APPROVE(id))
    return response.data
  },

  async rejectTeacher(id: number, reason: string): Promise<{ message: string; teacher: Teacher }> {
    const response = await api.patch(API_ENDPOINTS.TEACHER_REJECT(id), {
      rejection_reason: reason,
    })
    return response.data
  },
}

export default teacherService
