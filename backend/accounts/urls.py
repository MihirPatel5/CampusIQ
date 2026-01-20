from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, teacher_self_register, TeacherViewSet,
    SchoolViewSet, get_verification_code, regenerate_verification_code,
    DashboardStatsView, PublicSchoolListView, get_me, logout,
    register_school_admin, verify_otp, create_own_school
)

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet)

urlpatterns = [
    # JWT authentication
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', get_me, name='get-me'),
    path('auth/logout/', logout, name='logout'),
    
    # School Admin Registration Flow
    path('auth/register-admin/', register_school_admin, name='register-school-admin'),
    path('auth/verify-otp/', verify_otp, name='verify-otp'),
    path('schools/onboard/', create_own_school, name='create-own-school'),
    
    # Teacher self-registration
    path('teachers/self-register/', teacher_self_register, name='teacher-self-register'),
    
    # School profile
    # School management
    path('schools/public/', PublicSchoolListView.as_view(), name='public-school-list'),
    path('schools/', SchoolViewSet.as_view({'get': 'list', 'post': 'create'}), name='school-list'),
    path('schools/<int:pk>/', SchoolViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}), name='school-detail'),
    path('school/verification-code/', get_verification_code, name='get-verification-code'),
    path('school/regenerate-code/', regenerate_verification_code, name='regenerate-verification-code'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    
    # Router URLs
    path('', include(router.urls)),
]
