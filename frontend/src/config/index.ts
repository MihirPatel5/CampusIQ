export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  appName: import.meta.env.VITE_APP_NAME || 'School ERP',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
} as const

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Main
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  TEACHERS: '/teachers',
  CLASSES: '/classes',
  SUBJECTS: '/subjects',
  ATTENDANCE: '/attendance',
  EXAMS: '/exams',
  FEES: '/fees',
  TIMETABLE: '/timetable',
  NOTICES: '/notices',
  LIBRARY: '/library',
  TRANSPORT: '/transport',
  SETTINGS: '/settings',
} as const

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login/',
  LOGOUT: '/auth/logout/',
  REFRESH: '/auth/token/refresh/',
  ME: '/auth/me/',
  
  // Teachers
  TEACHERS: '/teachers/',
  TEACHER_REGISTER: '/teachers/register/',
  TEACHER_APPROVE: (id: number) => `/teachers/${id}/approve/`,
  TEACHER_REJECT: (id: number) => `/teachers/${id}/reject/`,
  
  // Students
  STUDENTS: '/students/',
  
  // Academic
  CLASSES: '/classes/',
  SECTIONS: '/sections/',
  SUBJECTS: '/subjects/',
  SUBJECT_ASSIGNMENTS: '/subject-assignments/',
  
  // Attendance
  ATTENDANCE: '/attendance/',
  ATTENDANCE_STATS: '/attendance/statistics/',
  
  // Fees
  FEE_STRUCTURES: '/fee-structures/',
  INVOICES: '/invoices/',
  PAYMENTS: '/payments/',
  
  // Exams
  EXAMS: '/exams/',
  RESULTS: '/results/',
  
  // School
  SCHOOL_PROFILE: '/schools/profile/',
} as const

