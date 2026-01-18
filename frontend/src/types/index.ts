// User & Auth Types
export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  school?: School | null
  is_active: boolean
  date_joined: string
  last_login?: string
  profile_picture?: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  access: string
  refresh: string
}

// School Types
export interface School {
  id: number
  name: string
  code: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  website?: string
  logo?: string
  school_verification_code: string
  established_year?: number
  affiliation?: string
  status: 'active' | 'inactive'
  created_at: string
}

// Academic Types
export interface Class {
  id: number
  name: string
  numeric_name: number
  description?: string
  is_active: boolean
  created_at: string
}

export interface Section {
  id: number
  name: string
  class_id: number
  class_name: string
  capacity: number
  current_strength: number
  is_active: boolean
}

export interface Subject {
  id: number
  name: string
  code: string
  description?: string
  is_active: boolean
}

export interface SubjectAssignment {
  id: number
  subject: Subject
  teacher: Teacher
  class_obj: Class
  section: Section
  academic_year: string
}

// Teacher Types
export type TeacherStatus = 'pending' | 'active' | 'inactive' | 'rejected' | 'resigned'

export interface Teacher {
  id: number
  user: UserProfile
  employee_id: string
  phone: string
  address: string
  qualification: string
  specialization?: string
  joining_date: string
  self_registered: boolean
  status: TeacherStatus
  rejection_reason?: string
  transfer_requested_to?: number
  transfer_request_date?: string
  created_at: string
}

export interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  school?: number
}

export interface TeacherRegistrationData {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  qualification: string
  specialization?: string
  address: string
  password: string
  password_confirm: string
  school_verification_code: string
}

// Student Types
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'transferred'

export interface Parent {
  id: number
  name: string
  relationship: 'father' | 'mother' | 'guardian'
  phone: string
  email?: string
  occupation?: string
  address?: string
}

export interface Student {
  id: number
  user: User
  admission_number: string
  class_obj: Class
  section: Section
  roll_number?: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  blood_group?: string
  address: string
  phone?: string
  admission_date: string
  status: StudentStatus
  parents: Parent[]
  photo?: string
  created_at: string
}

// Attendance Types
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface Attendance {
  id: number
  student: Student
  date: string
  status: AttendanceStatus
  remarks?: string
  marked_by: User
  created_at: string
}

export interface AttendanceStats {
  total_days: number
  present: number
  absent: number
  late: number
  excused: number
  percentage: number
}

// Fee Types
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue'
export type PaymentMode = 'cash' | 'online' | 'cheque' | 'upi'

export interface FeeItem {
  id: number
  name: string
  amount: number
}

export interface FeeStructure {
  id: number
  name: string
  class_obj: Class
  items: FeeItem[]
  total_amount: number
  academic_year: string
  is_active: boolean
}

export interface Invoice {
  id: number
  invoice_number: string
  student: Student
  fee_structure: FeeStructure
  amount: number
  paid_amount: number
  due_date: string
  status: PaymentStatus
  created_at: string
}

export interface Payment {
  id: number
  invoice: Invoice
  amount: number
  payment_mode: PaymentMode
  transaction_id?: string
  payment_date: string
  received_by: User
  remarks?: string
}

// Exam Types
export type ExamStatus = 'upcoming' | 'ongoing' | 'completed' | 'published'

export interface Exam {
  id: number
  name: string
  class_obj: Class
  start_date: string
  end_date: string
  status: ExamStatus
  description?: string
  created_at: string
}

export interface Result {
  id: number
  exam: Exam
  student: Student
  subject: Subject
  marks_obtained: number
  max_marks: number
  grade?: string
  remarks?: string
}

// Dashboard Types
export interface DashboardStats {
  total_students: number
  total_teachers: number
  pending_teachers: number
  total_classes: number
  today_attendance_percentage: number
  pending_fees: number
  total_fees_collected: number
  recent_admissions: number
}

export interface ChartData {
  name: string
  value: number
}

export interface MonthlyData {
  month: string
  admissions: number
  fees_collected: number
}

// API Response Types
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

