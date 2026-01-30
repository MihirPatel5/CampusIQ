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
  REFRESH: '/auth/refresh/', // Backend uses /auth/refresh/ per test script
  ME: '/auth/me/',
  REGISTER_ADMIN: '/auth/register-admin/',
  VERIFY_OTP: '/auth/verify-otp/',
  ONBOARD_SCHOOL: '/schools/onboard/',
  DASHBOARD_STATS: '/dashboard/stats/',

  // Teachers
  TEACHERS: '/teachers/',
  TEACHER_SELF_REGISTER: '/teachers/self-register/',
  TEACHER_APPROVE: (id: number) => `/teachers/${id}/approve/`,
  TEACHER_REJECT: (id: number) => `/teachers/${id}/reject/`,
  PENDING_TEACHERS: '/teachers/pending/',

  // Students
  STUDENTS: '/students/',
  STUDENT_DETAIL: (id: number) => `/students/${id}/`,
  STUDENT_PARENTS: (id: number) => `/students/${id}/parents/`,

  // Academic
  CLASSES: '/classes/',
  SECTIONS: '/sections/',
  SUBJECTS: '/subjects/',
  SUBJECT_ASSIGNMENTS: '/assignments/',
  PERIODS: '/periods/',
  TIMETABLE: '/timetable/',
  CLASS_ROOMS: '/class-rooms/',

  // Attendance
  ATTENDANCE: '/attendance/',
  ATTENDANCE_MARK: '/attendance/mark/',
  ATTENDANCE_STUDENTS: '/attendance/students/',
  STUDENT_ATTENDANCE_HISTORY: (id: number) => `/attendance/student/${id}/`,
  ATTENDANCE_STATS: '/attendance/statistics/',
  STAFF_ATTENDANCE: '/staff-attendance/',
  STAFF_ATTENDANCE_MARK: '/attendance/staff-mark/',

  // Fees
  FEE_STRUCTURES: '/fees/structures/',
  INVOICES: '/fees/invoices/',
  INVOICES_FAMILY_PENDING: '/fees/invoices/family_pending/',
  PAYMENTS: '/fees/payments/',
  PAYMENTS_BULK_RECORD: '/fees/payments/bulk_record_payment/',

  // Exams
  EXAMS: '/exams/',
  EXAM_SCHEDULES: '/exam-schedules/',
  EXAM_RESULTS: '/exams/results/',
  BULK_RESULT_ENTRY: '/exams/results/bulk-entry/',
  STUDENT_REPORT_CARD: (examId: number, studentId: number) => `/exams/${examId}/report-card/${studentId}/`,
  CONSOLIDATED_RESULTS: (id: number) => `/exams/${id}/consolidated_results/`,

  // School
  SCHOOLS: '/schools/',
  SCHOOL_DETAIL: (id: number) => `/schools/${id}/`,
  VERIFICATION_CODE: '/school/verification-code/',
  REGENERATE_CODE: '/school/regenerate-code/',
} as const

