import api from './api'
import { API_ENDPOINTS } from '@/config'
import type { FeeStructure, Invoice, Payment } from '@/types'

export interface GenerateInvoicesData {
    fee_structure_id: number
    student_ids?: number[]
    class_id?: number
    section_id?: number
}

export const feeService = {
    // Fee Structures
    async getFeeStructures(params?: any): Promise<FeeStructure[]> {
        const response = await api.get<any>(API_ENDPOINTS.FEE_STRUCTURES, { params })
        return Array.isArray(response.data) ? response.data : (response.data.results || [])
    },
    async createFeeStructure(data: Partial<FeeStructure>): Promise<FeeStructure> {
        const response = await api.post<FeeStructure>(API_ENDPOINTS.FEE_STRUCTURES, data)
        return response.data
    },
    async updateFeeStructure(id: number, data: Partial<FeeStructure>): Promise<FeeStructure> {
        const response = await api.patch<FeeStructure>(`${API_ENDPOINTS.FEE_STRUCTURES}${id}/`, data)
        return response.data
    },
    async deleteFeeStructure(id: number): Promise<void> {
        await api.delete(`${API_ENDPOINTS.FEE_STRUCTURES}${id}/`)
    },

    // Invoices
    async getInvoices(params?: any): Promise<Invoice[]> {
        const response = await api.get<any>(API_ENDPOINTS.INVOICES, { params })
        return Array.isArray(response.data) ? response.data : (response.data.results || [])
    },
    async generateInvoices(data: GenerateInvoicesData) {
        const response = await api.post('/fees/invoices/generate/', data)
        return response.data
    },

    // Payments
    async getPayments(params?: any): Promise<Payment[]> {
        const response = await api.get<any>(API_ENDPOINTS.PAYMENTS, { params })
        return Array.isArray(response.data) ? response.data : (response.data.results || [])
    },
    async recordPayment(data: Partial<Payment>): Promise<Payment> {
        const response = await api.post<Payment>(API_ENDPOINTS.PAYMENTS, data)
        return response.data
    },
}

export default feeService
