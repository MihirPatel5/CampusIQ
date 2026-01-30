from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClassViewSet, SectionViewSet, SubjectViewSet, SubjectAssignmentViewSet, PeriodViewSet, TimetableEntryViewSet, ClassRoomViewSet

router = DefaultRouter()
router.register(r'classes', ClassViewSet, basename='class')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'assignments', SubjectAssignmentViewSet, basename='assignment')
router.register(r'periods', PeriodViewSet, basename='period')
router.register(r'timetable', TimetableEntryViewSet, basename='timetable')
router.register(r'class-rooms', ClassRoomViewSet, basename='class-room')

urlpatterns = [
    path('', include(router.urls)),
]
