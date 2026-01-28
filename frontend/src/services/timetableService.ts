import api from './api'

import { API_ENDPOINTS } from '@/config'
import type { Period, TimetableEntry } from '@/types'

const ENDPOINTS = {
    PERIODS: API_ENDPOINTS.PERIODS,
    TIMETABLE: API_ENDPOINTS.TIMETABLE,
}

export const timetableService = {
    // Periods
    async getPeriods(): Promise<Period[]> {
        const response = await api.get<any>(ENDPOINTS.PERIODS)
        return Array.isArray(response.data) ? response.data : (response.data.results || [])
    },
    async createPeriod(data: Partial<Period>): Promise<Period> {
        const response = await api.post<Period>(ENDPOINTS.PERIODS, data)
        return response.data
    },
    async updatePeriod(id: number, data: Partial<Period>): Promise<Period> {
        const response = await api.patch<Period>(`${ENDPOINTS.PERIODS}${id}/`, data)
        return response.data
    },
    async deletePeriod(id: number): Promise<void> {
        await api.delete(`${ENDPOINTS.PERIODS}${id}/`)
    },

    // Timetable Entries
    async getTimetable(params: {
        class_id?: number
        section_id?: number
        teacher_id?: number
        academic_year?: string
        day?: number
    }): Promise<TimetableEntry[]> {
        const response = await api.get<any>(ENDPOINTS.TIMETABLE, { params })
        return Array.isArray(response.data) ? response.data : (response.data.results || [])
    },

    async createEntry(data: Partial<TimetableEntry>): Promise<TimetableEntry> {
        const response = await api.post<TimetableEntry>(ENDPOINTS.TIMETABLE, data)
        return response.data
    },

    async updateEntry(id: number, data: Partial<TimetableEntry>): Promise<TimetableEntry> {
        const response = await api.patch<TimetableEntry>(`${ENDPOINTS.TIMETABLE}${id}/`, data)
        return response.data
    },

    async deleteEntry(id: number): Promise<void> {
        await api.delete(`${ENDPOINTS.TIMETABLE}${id}/`)
    },
}

export default timetableService
