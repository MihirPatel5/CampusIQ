import api from './api'

import type { Period, TimetableEntry } from '@/types'

// Ensure these endpoints exist in your config or define them here if not yet.
// Assuming API_ENDPOINTS is an object we can't easily extend without editing config.ts,
// we might hardcode strings or expect them to be added.
// For now, I'll use string literals if I can't see config.ts, but standard practice is updating simple string paths.

const ENDPOINTS = {
    PERIODS: 'academic/periods/',
    TIMETABLE: 'academic/timetable/',
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
