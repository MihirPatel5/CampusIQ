import api from './api'
import { API_ENDPOINTS } from '@/config'
import type { Class, Section, Subject, SubjectAssignment } from '@/types'

export const academicService = {
  async getClasses(): Promise<Class[]> {
    const response = await api.get<Class[]>(API_ENDPOINTS.CLASSES)
    return response.data
  },

  async getSections(classId?: number): Promise<Section[]> {
    const params = classId ? { class_id: classId } : {}
    const response = await api.get<Section[]>(API_ENDPOINTS.SECTIONS, { params })
    return response.data
  },

  async getSubjects(): Promise<Subject[]> {
    const response = await api.get<Subject[]>(API_ENDPOINTS.SUBJECTS)
    return response.data
  },

  async getSubjectAssignments(): Promise<SubjectAssignment[]> {
    const response = await api.get<SubjectAssignment[]>(API_ENDPOINTS.SUBJECT_ASSIGNMENTS)
    return response.data
  },
}

export default academicService
