from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, teacher_self_register, TeacherViewSet,
    SchoolProfileView, get_verification_code, regenerate_verification_code
)

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet, basename='teacher')

urlpatterns = [
    # Authentication
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Teacher self-registration
    path('teachers/self-register/', teacher_self_register, name='teacher-self-register'),
    
    # School profile
    path('school/profile/', SchoolProfileView.as_view(), name='school-profile'),
    path('school/verification-code/', get_verification_code, name='get-verification-code'),
    path('school/regenerate-code/', regenerate_verification_code, name='regenerate-verification-code'),
    
    # Router URLs
    path('', include(router.urls)),
]
