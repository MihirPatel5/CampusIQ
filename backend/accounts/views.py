from rest_framework import status, generics, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from .models import User, SchoolProfile, TeacherProfile
from .serializers import (
    UserSerializer, LoginSerializer, TeacherRegistrationSerializer,
    TeacherProfileSerializer, TeacherCreateSerializer, SchoolProfileSerializer
)
from .permissions import IsAdmin, IsActiveTeacher


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
        queryset = super().get_queryset()
        
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


class SchoolProfileView(generics.RetrieveUpdateAPIView):
    """
    View for SchoolProfile (singleton)
    GET /api/v1/school/profile/
    PATCH /api/v1/school/profile/
    """
    queryset = SchoolProfile.objects.all()
    serializer_class = SchoolProfileSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdmin()]
    
    def get_object(self):
        # Get or create the single school profile
        obj, created = SchoolProfile.objects.get_or_create(
            id=1,
            defaults={'name': 'My School', 'school_verification_code': SchoolProfile.generate_verification_code()}
        )
        return obj
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


@api_view(['GET'])
@permission_classes([IsAdmin])
def get_verification_code(request):
    """
    Get school verification code (admin only)
    GET /api/v1/school/verification-code/
    """
    try:
        school = SchoolProfile.objects.first()
        if not school:
            return Response(
                {'error': 'School profile not configured'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'school_verification_code': school.school_verification_code
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdmin])
def regenerate_verification_code(request):
    """
    Regenerate school verification code (admin only)
    POST /api/v1/school/regenerate-code/
    """
    try:
        school = SchoolProfile.objects.first()
        if not school:
            return Response(
                {'error': 'School profile not configured'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate new code
        school.school_verification_code = SchoolProfile.generate_verification_code()
        school.updated_by = request.user
        school.save()
        
        return Response({
            'message': 'Verification code regenerated successfully',
            'school_verification_code': school.school_verification_code
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
