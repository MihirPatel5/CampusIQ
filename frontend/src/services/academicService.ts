import api from './api'
import { API_ENDPOINTS } from '@/config'
import type { Class, Section, Subject, SubjectAssignment } from '@/types'

export const academicService = {
  // Classes
  async getClasses(): Promise<Class[]> {
    const response = await api.get<any>(API_ENDPOINTS.CLASSES)
    return Array.isArray(response.data) ? response.data : (response.data.results || [])
  },
  async createClass(data: Partial<Class>): Promise<Class> {
    const response = await api.post<Class>(API_ENDPOINTS.CLASSES, data)
    return response.data
  },
  async updateClass(id: number, data: Partial<Class>): Promise<Class> {
    const response = await api.patch<Class>(`${API_ENDPOINTS.CLASSES}${id}/`, data)
    return response.data
  },
  async deleteClass(id: number): Promise<void> {
    await api.delete(`${API_ENDPOINTS.CLASSES}${id}/`)
  },

  // Sections
  async getSections(classId?: number): Promise<Section[]> {
    const params = classId ? { class_id: classId } : {}
    const response = await api.get<any>(API_ENDPOINTS.SECTIONS, { params })
    return Array.isArray(response.data) ? response.data : (response.data.results || [])
  },
  async createSection(data: Partial<Section>): Promise<Section> {
    const response = await api.post<Section>(API_ENDPOINTS.SECTIONS, data)
    return response.data
  },
  async updateSection(id: number, data: Partial<Section>): Promise<Section> {
    const response = await api.patch<Section>(`${API_ENDPOINTS.SECTIONS}${id}/`, data)
    return response.data
  },
  async deleteSection(id: number): Promise<void> {
    await api.delete(`${API_ENDPOINTS.SECTIONS}${id}/`)
  },

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    const response = await api.get<any>(API_ENDPOINTS.SUBJECTS)
    return Array.isArray(response.data) ? response.data : (response.data.results || [])
  },
  async createSubject(data: Partial<Subject>): Promise<Subject> {
    const response = await api.post<Subject>(API_ENDPOINTS.SUBJECTS, data)
    return response.data
  },
  async updateSubject(id: number, data: Partial<Subject>): Promise<Subject> {
    const response = await api.patch<Subject>(`${API_ENDPOINTS.SUBJECTS}${id}/`, data)
    return response.data
  },
  async deleteSubject(id: number): Promise<void> {
    await api.delete(`${API_ENDPOINTS.SUBJECTS}${id}/`)
  },

  // Subject Assignments
  async getSubjectAssignments(params?: {
    class_id?: number
    section_id?: number
    teacher_id?: number
    academic_year?: string
  }): Promise<SubjectAssignment[]> {
    const response = await api.get<any>(API_ENDPOINTS.SUBJECT_ASSIGNMENTS, { params })
    return Array.isArray(response.data) ? response.data : (response.data.results || [])
  },
  async createSubjectAssignment(data: Partial<SubjectAssignment>): Promise<SubjectAssignment> {
    const response = await api.post<SubjectAssignment>(API_ENDPOINTS.SUBJECT_ASSIGNMENTS, data)
    return response.data
  },
  async updateSubjectAssignment(id: number, data: Partial<SubjectAssignment>): Promise<SubjectAssignment> {
    const response = await api.patch<SubjectAssignment>(`${API_ENDPOINTS.SUBJECT_ASSIGNMENTS}${id}/`, data)
    return response.data
  },
  async deleteSubjectAssignment(id: number): Promise<void> {
    await api.delete(`${API_ENDPOINTS.SUBJECT_ASSIGNMENTS}${id}/`)
  },

  // Classrooms
  async getClassRooms(): Promise<any[]> {
    const response = await api.get<any>(API_ENDPOINTS.CLASS_ROOMS)
    return Array.isArray(response.data) ? response.data : (response.data.results || [])
  },
  async createClassRoom(data: any): Promise<any> {
    const response = await api.post(API_ENDPOINTS.CLASS_ROOMS, data)
    return response.data
  },
  async updateClassRoom(id: number, data: any): Promise<any> {
    const response = await api.patch(`${API_ENDPOINTS.CLASS_ROOMS}${id}/`, data)
    return response.data
  },
  async deleteClassRoom(id: number): Promise<void> {
    await api.delete(`${API_ENDPOINTS.CLASS_ROOMS}${id}/`)
  },
}

export default academicService
