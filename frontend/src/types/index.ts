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
  teacher_profile_id?: number
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
export interface PublicSchool {
  id: number
  name: string
  logo: string | null
  city: string
  state: string
}

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
  created_at?: string
  updated_at?: string
}

// Academic Types
export interface Class {
  id: number
  name: string
  code: string
  academic_year: string
  description?: string
  class_teacher?: number
  class_teacher_name?: string
  sections?: Section[]
  status: 'active' | 'inactive'
  created_at: string
}

export interface Section {
  id: number
  class_obj: number
  class_name: string
  name: string
  code: string
  capacity?: number
  room_number?: string
  class_teacher?: number  // Teacher ID
  class_teacher_name?: string  // Teacher full name
  current_strength: number
  has_capacity: boolean
  status: 'active' | 'inactive'
  created_at: string
}

export interface Subject {
  id: number
  name: string
  code: string
  type: 'core' | 'elective' | 'optional'
  description?: string
  max_marks: number
  status: 'active' | 'inactive'
  created_at: string
}

export interface SubjectAssignment {
  id: number
  class_obj: number
  class_name: string
  section: number
  section_name: string
  subject: number
  subject_name: string
  teacher: number
  teacher_name: string
  academic_year: string
  status: 'active' | 'inactive'
  created_at: string
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
  subjects?: number[]  // Array of subject IDs
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
  school_id: number
  subjects?: number[]
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
  user?: User

  // Basic Information
  admission_number: string
  first_name: string
  middle_name?: string
  last_name: string
  full_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  blood_group?: string
  photo?: string

  // Personal Information
  nationality?: string
  religion?: string
  category?: 'general' | 'obc' | 'sc' | 'st' | 'other'
  mother_tongue?: string
  caste?: string
  aadhaar_number?: string

  // Contact Information
  email?: string
  phone?: string
  alternate_phone?: string
  address: string
  city: string
  state: string
  pincode: string

  // Emergency Contact
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relation?: string

  // Medical Information
  height?: number
  weight?: number
  medical_conditions?: string
  allergies?: string
  vaccination_status?: string

  // Academic Information
  admission_date: string
  roll_number?: string
  class_obj: number
  class_name: string
  section: number
  section_name: string
  previous_school?: string
  previous_class?: string
  previous_marks?: number
  tc_number?: string
  tc_date?: string

  // Documents
  birth_certificate?: string
  transfer_certificate?: string
  aadhar_card?: string
  caste_certificate?: string

  // Transport
  transport_required?: boolean
  bus_route?: string
  pickup_point?: string

  // Hostel
  hostel_required?: boolean
  hostel_room_preference?: string

  // Custom Fields
  custom_fields?: Record<string, any>

  // Status & Relations
  status: StudentStatus
  parents?: Parent[]
  created_at: string
}

// Admission Form Configuration Types
export type FieldType = 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'image' | 'checkbox' | 'decimal'
export type FormSection = 'basic' | 'personal' | 'contact' | 'emergency' | 'medical' | 'academic' | 'documents' | 'transport' | 'hostel' | 'parent'

export interface FieldOption {
  value: string
  label: string
}

export interface AdmissionFormConfig {
  id: number
  field_name: string
  field_label: string
  field_type: FieldType
  section: FormSection
  is_visible: boolean
  is_required: boolean
  display_order: number
  help_text: string
  placeholder: string
  options: FieldOption[]
  validation_rules: Record<string, any>
  created_at: string
  updated_at: string
}

export interface GroupedFormConfig {
  [section: string]: AdmissionFormConfig[]
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
  due_date: string
  installment?: number
}

export interface FeeStructure {
  id: number
  name: string
  academic_year: string
  class_obj: number
  class_name: string
  total_amount: number
  status: 'active' | 'inactive'
  fee_items: FeeItem[]
  created_at: string
}

export interface Invoice {
  id: number
  invoice_number: string
  student: number
  student_name: string
  fee_structure: number
  fee_structure_name: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  due_date: string
  status: PaymentStatus
  installment?: number
  class_name?: string
  fee_items?: any[]
  created_at: string
}

export interface Payment {
  id: number
  invoice: number
  invoice_number: string
  student_name: string
  receipt_number: string
  amount: number
  payment_date: string
  payment_mode: PaymentMode
  transaction_reference?: string
  remarks?: string
  created_at: string
}

// Exam Types
export type ExamStatus = 'draft' | 'active' | 'completed' | 'published'

export interface Exam {
  id: number
  name: string
  title: string
  exam_type: string
  academic_year: string
  class_obj?: number
  start_date: string
  end_date: string
  status: ExamStatus
  description?: string
  created_at: string
}

export interface ExamSchedule {
  id: number
  exam: number
  subject: number
  subject_name: string
  date: string
  start_time: string
  end_time: string
  max_marks: number
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
// Timetable Types
export interface Period {
  id: number
  name: string
  start_time: string
  end_time: string
  is_break: boolean
  order: number
  created_at: string
}

export interface TimetableEntry {
  id: number
  class_obj: number
  class_name: string
  section: number
  section_name: string
  day_of_week: number
  period: number
  period_name: string
  period_time: string
  subject: number
  subject_name: string
  teacher: number
  teacher_name: string
  room?: number | null
  room_name?: string
  academic_year: string
  created_at: string
}

// Event & Notification Types
export type EventAudience = 'global' | 'staff' | 'class'
export type EventType = 'holiday' | 'meeting' | 'exam' | 'celebration' | 'other'

export interface Event {
  id: number
  title: string
  description: string
  event_type: EventType
  audience: EventAudience
  target_class?: number
  target_class_name?: string
  target_section?: number
  target_section_name?: string
  start_datetime: string
  end_datetime?: string
  is_active: boolean
  created_by: number
  created_by_name: string
  created_at: string
}

export interface NotificationSubscription {
  id: number
  endpoint: string
  p256dh?: string
  auth?: string
  browser?: string
  device_type?: string
}
