import api from './api'
import { API_ENDPOINTS } from '@/config'
import type { Teacher, TeacherRegistrationData, PaginatedResponse } from '@/types'

export const teacherService = {
  async registerTeacher(data: TeacherRegistrationData): Promise<{ message: string; teacher: Teacher }> {
    const response = await api.post(API_ENDPOINTS.TEACHER_SELF_REGISTER, data)
    return response.data
  },

  async getTeachers(params?: any): Promise<PaginatedResponse<Teacher> | Teacher[]> {
    const response = await api.get(API_ENDPOINTS.TEACHERS, { params })
    return response.data
  },

  async getPendingTeachers(): Promise<Teacher[]> {
    const response = await api.get<Teacher[]>(API_ENDPOINTS.PENDING_TEACHERS)
    return response.data
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
