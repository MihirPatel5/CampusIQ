import type { User, DashboardStats } from '@/types'

// Mock users for development
export const mockUsers: Record<string, { user: User; password: string }> = {
  admin: {
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@school.com',
      first_name: 'John',
      last_name: 'Admin',
      role: 'admin',
      is_active: true,
      date_joined: '2024-01-01T00:00:00Z',
    },
    password: 'admin123',
  },
  teacher: {
    user: {
      id: 2,
      username: 'teacher',
      email: 'teacher@school.com',
      first_name: 'Jane',
      last_name: 'Teacher',
      role: 'teacher',
      is_active: true,
      date_joined: '2024-01-15T00:00:00Z',
    },
    password: 'teacher123',
  },
}

export const mockDashboardStats: DashboardStats = {
  total_students: 2547,
  total_teachers: 156,
  pending_teachers: 5,
  total_classes: 45,
  today_attendance_percentage: 94.2,
  pending_fees: 1250000,
  total_fees_collected: 4250000,
  recent_admissions: 12,
}

// Generate mock JWT tokens
export function generateMockTokens() {
  const accessToken = 'mock_access_' + Math.random().toString(36).substring(2)
  const refreshToken = 'mock_refresh_' + Math.random().toString(36).substring(2)
  return { access: accessToken, refresh: refreshToken }
}

