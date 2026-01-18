import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicRoute } from './components/auth/PublicRoute'
import { MainLayout } from './components/layout/MainLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import { LoadingScreen } from './components/ui/loading-screen'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const TeacherRegistrationPage = lazy(() => import('./pages/auth/TeacherRegistrationPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const SchoolsPage = lazy(() => import('./pages/admin/SchoolsPage'))
const StudentsPage = lazy(() => import('./pages/students/StudentsPage'))
const StudentAdmissionPage = lazy(() => import('./pages/students/StudentAdmissionPage'))
const TeachersPage = lazy(() => import('./pages/teachers/TeachersPage'))

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/teacher" element={<TeacherRegistrationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Admin routes */}
            <Route path="/schools" element={<SchoolsPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/admission" element={<StudentAdmissionPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/classes" element={<ComingSoon title="Classes & Sections" />} />
            <Route path="/subjects" element={<ComingSoon title="Subjects" />} />
            <Route path="/attendance" element={<ComingSoon title="Attendance" />} />
            <Route path="/exams" element={<ComingSoon title="Exams & Results" />} />
            <Route path="/fees" element={<ComingSoon title="Fees & Payments" />} />
            <Route path="/timetable" element={<ComingSoon title="Timetable" />} />
            <Route path="/notices" element={<ComingSoon title="Notices" />} />
            <Route path="/library" element={<ComingSoon title="Library" />} />
            <Route path="/transport" element={<ComingSoon title="Transport" />} />
            <Route path="/settings" element={<ComingSoon title="Settings" />} />
          </Route>
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
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

