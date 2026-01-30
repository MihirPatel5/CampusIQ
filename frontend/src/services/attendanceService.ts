import api from './api'
import { API_ENDPOINTS } from '@/config'
import type { Attendance, AttendanceStats } from '@/types'

export interface AttendanceMarkData {
    date: string
    class_id: number
    section_id: number
    attendance: {
        student_id: number
        status: 'present' | 'absent' | 'late' | 'excused'
        remarks?: string
    }[]
}

export interface StudentForMarking {
    student_id: number
    admission_number: string
    name: string
    status: 'present' | 'absent' | 'late' | 'excused' | null
    remarks: string
    already_marked: boolean
}

export const attendanceService = {
    async markAttendance(data: AttendanceMarkData) {
        const response = await api.post(API_ENDPOINTS.ATTENDANCE_MARK, data)
        return response.data
    },

    async getStudentsForMarking(classId: number, sectionId: number, date: string): Promise<StudentForMarking[]> {
        const response = await api.get<StudentForMarking[]>(API_ENDPOINTS.ATTENDANCE_STUDENTS, {
            params: { class_id: classId, section_id: sectionId, date }
        })
        return response.data
    },

    async getStudentHistory(studentId: number, dateFrom?: string, dateTo?: string) {
        const response = await api.get(API_ENDPOINTS.STUDENT_ATTENDANCE_HISTORY(studentId), {
            params: { date_from: dateFrom, date_to: dateTo }
        })
        return response.data
    },

    async getAttendanceRecords(params: any): Promise<Attendance[]> {
        const response = await api.get<any>(API_ENDPOINTS.ATTENDANCE, { params })
        return Array.isArray(response.data) ? response.data : (response.data.results || [])
    },

    async getStats(): Promise<AttendanceStats> {
        const response = await api.get<AttendanceStats>(API_ENDPOINTS.ATTENDANCE_STATS)
        return response.data
    },

    async markStaffAttendance(data: any) {
        const response = await api.post(API_ENDPOINTS.STAFF_ATTENDANCE_MARK, data)
        return response.data
    },

    async getStaffAttendance(params?: any) {
        const response = await api.get(API_ENDPOINTS.STAFF_ATTENDANCE, { params })
        return Array.isArray(response.data) ? response.data : (response.data.results || [])
    },
}

export default attendanceService
