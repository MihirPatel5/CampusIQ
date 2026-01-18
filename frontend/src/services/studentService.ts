import api from './api'
import { API_ENDPOINTS } from '@/config'
import type { Student, PaginatedResponse } from '@/types'

export const studentService = {
  async getStudents(params?: any): Promise<PaginatedResponse<Student>> {
    const response = await api.get<PaginatedResponse<Student>>(API_ENDPOINTS.STUDENTS, { params })
    return response.data
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
}

export default studentService
