from core.views import TenantMixin
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin
from .models import StudentProfile, ParentProfile, AdmissionFormConfig
from .serializers import (
    StudentProfileSerializer, StudentAdmissionSerializer, 
    ParentProfileSerializer, AdmissionFormConfigSerializer
)


class AdmissionFormConfigViewSet(TenantMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing admission form configuration.
    Allows school admins to customize which fields are visible/required.
    """
    queryset = AdmissionFormConfig.objects.all()
    serializer_class = AdmissionFormConfigSerializer
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        # TenantManager handles school filtering automatically
        return AdmissionFormConfig.objects.all().order_by('section', 'display_order')
    
    @action(detail=False, methods=['post'])
    def reset_to_defaults(self, request):
        """Reset form configuration to defaults"""
        from django.core.management import call_command
        
        school = request.user.school
        if not school:
            return Response(
                {'error': 'No school associated with user'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete existing config
        AdmissionFormConfig.objects.filter(school=school).delete()
        
        # Run management command for this school
        call_command('setup_admission_form', school_id=school.id)
        
        return Response({
            'message': 'Form configuration reset to defaults successfully',
            'count': AdmissionFormConfig.objects.filter(school=school).count()
        })
    
    @action(detail=False, methods=['get'])
    def by_section(self, request):
        """Get form configuration grouped by section"""
        configs = self.get_queryset()
        
        # Group by section
        sections = {}
        for config in configs:
            section_name = config.get_section_display()
            if section_name not in sections:
                sections[section_name] = []
            sections[section_name].append(AdmissionFormConfigSerializer(config).data)
        
        return Response(sections)


class StudentViewSet(TenantMixin, viewsets.ModelViewSet):
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
        queryset = StudentProfile.objects.select_related('user', 'class_obj', 'section').prefetch_related('parents').all()
        
        # Note: TenantManager handles school filtering automatically
        
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
