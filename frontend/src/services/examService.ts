import api from './api'
import { API_ENDPOINTS } from '@/config'
import type { Exam, Result } from '@/types'

export interface BulkResultData {
    exam_id: number
    subject_id: number
    results: {
        student_id: number
        marks_obtained: number
        max_marks: number
        remarks?: string
    }[]
}

export const examService = {
    // Exams
    async getExams(params?: any): Promise<Exam[]> {
        const response = await api.get<any>(API_ENDPOINTS.EXAMS, { params })
        return Array.isArray(response.data) ? response.data : (response.data.results || [])
    },
    async createExam(data: Partial<Exam>): Promise<Exam> {
        const response = await api.post<Exam>(API_ENDPOINTS.EXAMS, data)
        return response.data
    },
    async updateExam(id: number, data: Partial<Exam>): Promise<Exam> {
        const response = await api.patch<Exam>(`${API_ENDPOINTS.EXAMS}${id}/`, data)
        return response.data
    },
    async deleteExam(id: number): Promise<void> {
        await api.delete(`${API_ENDPOINTS.EXAMS}${id}/`)
    },
    async publishExam(id: number): Promise<void> {
        await api.patch(`${API_ENDPOINTS.EXAMS}${id}/publish/`)
    },

    // Results
    async getResults(params?: any): Promise<Result[]> {
        const response = await api.get<any>(API_ENDPOINTS.EXAM_RESULTS, { params })
        return Array.isArray(response.data) ? response.data : (response.data.results || [])
    },
    async enterResultsBulk(data: BulkResultData) {
        const response = await api.post(API_ENDPOINTS.BULK_RESULT_ENTRY, data)
        return response.data
    },
    async getStudentReportCard(examId: number, studentId: number) {
        const response = await api.get(API_ENDPOINTS.STUDENT_REPORT_CARD(examId, studentId))
        return response.data
    },
}

export default examService
