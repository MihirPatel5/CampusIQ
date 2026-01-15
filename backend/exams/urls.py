from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExamViewSet, ExamResultViewSet, enter_results_bulk, student_report_card

router = DefaultRouter()
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'exams/results', ExamResultViewSet, basename='examresult')

urlpatterns = [
    path('exams/results/bulk-entry/', enter_results_bulk, name='bulk-result-entry'),
    path('exams/<int:exam_id>/report-card/<int:student_id>/', student_report_card, name='student-report-card'),
    path('', include(router.urls)),
]
