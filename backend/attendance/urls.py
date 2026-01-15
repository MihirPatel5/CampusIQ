from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, mark_attendance, get_students_for_marking, student_attendance_history

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('attendance/mark/', mark_attendance, name='mark-attendance'),
    path('attendance/students/', get_students_for_marking, name='students-for-marking'),
    path('attendance/student/<int:student_id>/', student_attendance_history, name='student-attendance-history'),
    path('', include(router.urls)),
]
