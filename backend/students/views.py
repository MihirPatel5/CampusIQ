from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin
from .models import StudentProfile, ParentProfile
from .serializers import StudentProfileSerializer, StudentAdmissionSerializer, ParentProfileSerializer


class StudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Student management
    """
    queryset = StudentProfile.objects.select_related('user', 'class_obj', 'section').prefetch_related('parents').all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'admission_number', 'email', 'phone']
    ordering_fields = ['admission_date', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StudentAdmissionSerializer
        return StudentProfileSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Super admin sees all students
        if user.is_super_admin():
            pass
        # School admin/Teacher/Parent sees only their school's students
        elif user.school:
            queryset = queryset.filter(user__school=user.school)
        else:
            queryset = queryset.none()
        
        # Filter by class
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        
        # Filter by section
        section_id = self.request.query_params.get('section_id')
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def parents(self, request, pk=None):
        """Get student's parents"""
        student = self.get_object()
        parents = student.parents.all()
        serializer = ParentProfileSerializer(parents, many=True)
        return Response(serializer.data)
