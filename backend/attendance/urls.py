from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AttendanceViewSet, mark_attendance, get_students_for_marking, 
    student_attendance_history, mark_staff_attendance, StaffAttendanceViewSet
)

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'staff-attendance', StaffAttendanceViewSet, basename='staff-attendance')

urlpatterns = [
    path('attendance/mark/', mark_attendance, name='mark-attendance'),
    path('attendance/students/', get_students_for_marking, name='students-for-marking'),
    path('attendance/student/<int:student_id>/', student_attendance_history, name='student-attendance-history'),
    path('attendance/staff-mark/', mark_staff_attendance, name='mark-staff-attendance'),
    path('', include(router.urls)),
]
