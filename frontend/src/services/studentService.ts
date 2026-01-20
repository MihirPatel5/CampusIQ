import api from './api'
import { API_ENDPOINTS } from '@/config'
import type { Student } from '@/types'

export const studentService = {
  async getStudents(params?: any): Promise<Student[]> {
    const response = await api.get<any>(API_ENDPOINTS.STUDENTS, { params })
    return Array.isArray(response.data) ? response.data : (response.data.results || [])
  },

  async getStudent(id: number): Promise<Student> {
    const response = await api.get<Student>(API_ENDPOINTS.STUDENT_DETAIL(id))
    return response.data
  },

  async createStudent(data: any): Promise<Student> {
    const response = await api.post<Student>(API_ENDPOINTS.STUDENTS, data)
    return response.data
  },

  async updateStudent(id: number, data: any): Promise<Student> {
    const response = await api.patch<Student>(API_ENDPOINTS.STUDENT_DETAIL(id), data)
    return response.data
  },

  async deleteStudent(id: number): Promise<void> {
    await api.delete(API_ENDPOINTS.STUDENT_DETAIL(id))
  },

  async getStudentParents(id: number): Promise<any[]> {
    const response = await api.get(API_ENDPOINTS.STUDENT_PARENTS(id))
    return response.data
  },

  // Admission Form Configuration
  async getFormConfig(): Promise<any> {
    const response = await api.get('/students/admission-form-config/')
    return response.data
  },

  async getFormConfigBySection(): Promise<any> {
    const response = await api.get('/students/admission-form-config/by-section/')
    return response.data
  },

  async updateFormConfig(id: number, data: any): Promise<any> {
    const response = await api.patch(`/students/admission-form-config/${id}/`, data)
    return response.data
  },

  async resetFormConfigToDefaults(): Promise<any> {
    const response = await api.post('/students/admission-form-config/reset-to-defaults/')
    return response.data
  },
}

export default studentService
