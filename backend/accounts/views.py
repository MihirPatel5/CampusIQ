from rest_framework import status, generics, viewsets
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from .models import User, School, TeacherProfile
from .serializers import (
    UserSerializer, LoginSerializer, TeacherRegistrationSerializer,
    TeacherProfileSerializer, TeacherCreateSerializer, SchoolSerializer,
    PublicSchoolSerializer, SchoolAdminRegistrationSerializer, OTPVerifySerializer,
    SchoolOnboardingSerializer
)
from .permissions import IsAdmin, IsActiveTeacher, IsSuperAdmin
from students.models import StudentProfile
from .models import User, School, TeacherProfile, OTPVerification
from django.utils import timezone
from datetime import timedelta
import random
import string
from django.core.mail import send_mail
from django.conf import settings


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view with teacher status validation"""
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if teacher is approved
        if user.role == 'teacher':
            try:
                teacher_profile = user.teacher_profile
                if teacher_profile.status == 'pending':
                    return Response(
                        {'error': 'Your account is pending admin approval'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                elif teacher_profile.status == 'rejected':
                    return Response(
                        {
                            'error': 'Your registration was rejected',
                            'reason': teacher_profile.rejection_reason or 'No reason provided'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
                elif teacher_profile.status != 'active':
                    return Response(
                        {'error': 'Your account is not active'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except TeacherProfile.DoesNotExist:
                return Response(
                    {'error': 'Teacher profile not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def teacher_self_register(request):
    """
    API endpoint for teacher self-registration
    POST /api/v1/teachers/self-register/
    """
    serializer = TeacherRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        teacher_profile = serializer.save()
        return Response({
            'message': 'Registration successful. Your account is pending admin approval.',
            'teacher': TeacherProfileSerializer(teacher_profile).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_me(request):
    """
    Get current user profile
    GET /api/v1/auth/me/
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout user (optional: blacklist token)
    POST /api/v1/auth/logout/
    """
    try:
        refresh_token = request.data.get("refresh")
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"message": "Token is invalid or expired"}, status=status.HTTP_400_BAD_REQUEST)


class TeacherViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Teacher management
    - List all teachers (admin only)
    - Create teacher (admin only)
    - Approve/reject teachers (admin only)
    - View pending registrations (admin only)
    """
    queryset = TeacherProfile.objects.select_related('user').all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TeacherCreateSerializer
        return TeacherProfileSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy', 'pending', 'approve', 'reject']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = TeacherProfile.objects.select_related('user').all()
        
        # Super admin sees all teachers
        if user.is_super_admin():
            pass
        # School admin sees only their school's teachers
        elif user.is_school_admin():
            queryset = queryset.filter(user__school=user.school)
        else:
            queryset = queryset.none()
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by self_registered
        self_registered = self.request.query_params.get('self_registered', None)
        if self_registered is not None:
            queryset = queryset.filter(self_registered=self_registered.lower() == 'true')
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                user__first_name__icontains=search
            ) | queryset.filter(
                user__last_name__icontains=search
            ) | queryset.filter(
                user__email__icontains=search
            ) | queryset.filter(
                employee_id__icontains=search
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=False, methods=['get'], url_path='pending')
    def pending(self, request):
        """Get all pending teacher registrations"""
        pending_teachers = self.queryset.filter(status='pending')
        serializer = self.get_serializer(pending_teachers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        """Approve a pending teacher registration"""
        teacher = self.get_object()
        
        if teacher.status != 'pending':
            return Response(
                {'error': 'Only pending teachers can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update teacher status
        teacher.status = 'active'
        teacher.user.is_active = True
        teacher.updated_by = request.user
        teacher.save()
        teacher.user.save()
        
        return Response({
            'message': 'Teacher approved successfully',
            'teacher': TeacherProfileSerializer(teacher).data
        })
    
    @action(detail=True, methods=['patch'], url_path='reject')
    def reject(self, request, pk=None):
        """Reject a pending teacher registration"""
        teacher = self.get_object()
        
        if teacher.status != 'pending':
            return Response(
                {'error': 'Only pending teachers can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get rejection reason
        rejection_reason = request.data.get('rejection_reason', '')
        
        # Update teacher status
        teacher.status = 'rejected'
        teacher.rejection_reason = rejection_reason
        teacher.updated_by = request.user
        teacher.save()
        
        return Response({
            'message': 'Teacher registration rejected',
            'teacher': TeacherProfileSerializer(teacher).data
        })


class SchoolViewSet(viewsets.ModelViewSet):
    """
    ViewSet for School management (multi-tenant)
    Super admins can create and delete schools.
    School admins can update their own school.
    """
    queryset = School.objects.all()
    serializer_class = SchoolSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsSuperAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Super admin sees all schools
        if self.request.user.is_super_admin():
            return School.objects.all()
        # School admin sees only their school
        elif self.request.user.school:
            return School.objects.filter(id=self.request.user.school.id)
        return School.objects.none()
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class PublicSchoolListView(generics.ListAPIView):
    """
    API endpoint for public school listing
    GET /api/v1/schools/public/
    """
    queryset = School.objects.filter(status='active').order_by('name')
    serializer_class = PublicSchoolSerializer
    permission_classes = [AllowAny]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_verification_code(request):
    """
    Get the school verification code for user's school
    """
    if request.user.is_super_admin():
        return Response({"error": "Super admin doesn't have a specific school"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not request.user.school:
        return Response({"error": "User not associated with any school"}, status=status.HTTP_400_BAD_REQUEST)
    
    school = request.user.school
    
    return Response({
        'school_verification_code': school.school_verification_code
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_verification_code(request):
    """
    Regenerate the verification code for user's school (admin only)
    """
    if request.user.role not in ['super_admin', 'admin']:
        return Response({"error": "Only admins can regenerate verification codes"}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.is_super_admin():
        return Response({"error": "Super admin must specify school ID"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not request.user.school:
        return Response({"error": "User not associated with any school"}, status=status.HTTP_400_BAD_REQUEST)
    
    school = request.user.school
    school.school_verification_code = School.generate_verification_code()
    school.updated_by = request.user
    school.save()
    
    return Response({
        'message': 'Verification code regenerated successfully',
        'school_verification_code': school.school_verification_code
    })


class DashboardStatsView(APIView):
    """
    API View to provide dashboard statistics based on user role and school
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role == 'super_admin' or user.is_superuser:
            # System-wide stats for super admin
            total_schools = School.objects.count()
            total_students = StudentProfile.objects.count()
            total_teachers = TeacherProfile.objects.count()
            
            return Response({
                'stats': [
                    {'title': 'Total Schools', 'value': total_schools, 'icon': 'building', 'change': 5},
                    {'title': 'Total Students', 'value': total_students, 'icon': 'users', 'change': 12},
                    {'title': 'Total Teachers', 'value': total_teachers, 'icon': 'graduation-cap', 'change': 3},
                    {'title': 'System Status', 'value': 'Healthy', 'icon': 'activity'},
                ]
            })
        
        elif user.school:
            # School-specific stats for admin/teacher
            school = user.school
            total_students = StudentProfile.objects.filter(user__school=school).count()
            total_teachers = User.objects.filter(school=school, role='teacher').count()
            # Mocking attendance and fees for now until those modules are fully integrated
            attendance_rate = "94.2%" 
            
            return Response({
                'stats': [
                    {'title': 'Total Students', 'value': total_students, 'icon': 'users', 'change': 8},
                    {'title': 'Total Teachers', 'value': total_teachers, 'icon': 'graduation-cap', 'change': 2},
                    {'title': 'Today Attendance', 'value': attendance_rate, 'icon': 'clipboard-check', 'change': -1},
                    {'title': 'Active Classes', 'value': 12, 'icon': 'building'},
                ]
            })
        
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)


from core.services.email_service import send_otp_email


@api_view(['POST'])
@permission_classes([AllowAny])
def register_school_admin(request):
    """
    Step 1: Register new school admin (inactive) and send OTP
    """
    serializer = SchoolAdminRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate 6-digit OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        # Save OTP
        OTPVerification.objects.create(
            user=user,
            otp=otp_code,
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        # Send Email
        try:
            send_otp_email(user.email, otp_code, user.first_name)
        except Exception as e:
            # If email fails, shouldn't rollback user but might need handling
            print(f"Failed to send email: {e}")
        
        return Response({
            'message': 'Registration successful. Please verify your email.',
            'email': user.email
        }, status=status.HTTP_201_CREATED)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Step 2: Verify OTP and activate account
    """
    serializer = OTPVerifySerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        verification = serializer.validated_data['verification']
        
        # Mark Verification as used
        verification.is_verified = True
        verification.save()
        
        # Activate User
        user.is_email_verified = True
        user.is_active = True
        user.save()
        
        # Generate Token for auto-login
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Email verified successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_own_school(request):
    """
    Step 3: Verified admin creates their school
    """
    user = request.user
    
    # Security checks
    if user.role != 'admin':
        return Response({'error': 'Only admins can create schools through this flow'}, status=status.HTTP_403_FORBIDDEN)
        
    if user.school:
        return Response({'error': 'You are already associated with a school'}, status=status.HTTP_400_BAD_REQUEST)
        
    serializer = SchoolOnboardingSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        school = serializer.save()
        return Response({
            'message': 'School created successfully',
            'school': SchoolSerializer(school).data
        }, status=status.HTTP_201_CREATED)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
