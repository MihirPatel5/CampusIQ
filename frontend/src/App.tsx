import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicRoute } from './components/auth/PublicRoute'
import { MainLayout } from './components/layout/MainLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import { LoadingScreen } from './components/ui/loading-screen'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { LoadingProvider } from './contexts/LoadingContext'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const TeacherRegistrationPage = lazy(() => import('./pages/auth/TeacherRegistrationPage'))
const RegisterAdminPage = lazy(() => import('./pages/auth/RegisterAdminPage'))
const OTPVerificationPage = lazy(() => import('./pages/auth/OTPVerificationPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const CreateSchoolFlow = lazy(() => import('./pages/onboarding/CreateSchoolFlow'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const SchoolsPage = lazy(() => import('./pages/admin/SchoolsPage'))
const StudentsPage = lazy(() => import('./pages/students/StudentsPage'))
const StudentAdmissionPage = lazy(() => import('./pages/students/StudentAdmissionPage'))
const TeachersPage = lazy(() => import('./pages/teachers/TeachersPage'))
const ClassesPage = lazy(() => import('./pages/academic/ClassesPage'))
const SubjectsPage = lazy(() => import('./pages/academic/SubjectsPage'))
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'))
const ExamsPage = lazy(() => import('./pages/exams/ExamsPage'))
const FeesPage = lazy(() => import('./pages/fees/FeesPage'))
const PeriodConfigurationPage = lazy(() => import('./pages/academic/PeriodConfigurationPage'))
const ClassTimetableManagerPage = lazy(() => import('./pages/academic/ClassTimetableManagerPage'))
const ClassSubjectManagerPage = lazy(() => import('./pages/academic/ClassSubjectManagerPage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))

function App() {
  return (
    <ErrorBoundary>
      <LoadingProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register/teacher" element={<TeacherRegistrationPage />} />
                <Route path="/register-admin" element={<RegisterAdminPage />} />
                <Route path="/verify-otp" element={<OTPVerificationPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/schools/onboard" element={<CreateSchoolFlow />} />
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Admin routes */}
                <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                  <Route path="/schools" element={<SchoolsPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
                  <Route path="/teachers" element={<TeachersPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
                  <Route path="/fees" element={<FeesPage />} />
                </Route>

                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/admission" element={<StudentAdmissionPage />} />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/academic/periods" element={<PeriodConfigurationPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/exams" element={<ExamsPage />} />
                <Route path="/timetable" element={<ClassTimetableManagerPage />} />
                <Route path="/classes/:classId/sections/:sectionId/subjects" element={<ClassSubjectManagerPage />} />
                <Route path="/notices" element={<ComingSoon title="Notices" />} />
                <Route path="/library" element={<ComingSoon title="Library" />} />
                <Route path="/transport" element={<ComingSoon title="Transport" />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </LoadingProvider>
    </ErrorBoundary>
  )
}

// Temporary component for modules not yet implemented
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <span className="text-4xl">🚧</span>
      </div>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="text-muted-foreground text-center max-w-md">
        This module is under construction. Check back soon for updates!
      </p>
    </div>
  )
}

export default App

