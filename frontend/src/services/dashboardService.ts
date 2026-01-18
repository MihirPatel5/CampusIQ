import api from './api'
import { API_ENDPOINTS } from '@/config'

export interface DashboardStat {
  title: string
  value: string | number
  icon: string
  change?: number
}

export interface DashboardStatsResponse {
  stats: DashboardStat[]
}

export const dashboardService = {
  async getStats(): Promise<DashboardStatsResponse> {
    const response = await api.get<DashboardStatsResponse>(API_ENDPOINTS.DASHBOARD_STATS)
    return response.data
  },
}

export default dashboardService
