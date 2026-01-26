from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, AdmissionFormConfigViewSet

router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='student')
router.register(r'students/admission-form-config', AdmissionFormConfigViewSet, basename='admission-form-config')

urlpatterns = [
    path('', include(router.urls)),
]
