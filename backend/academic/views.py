from core.views import TenantMixin
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin, IsAdminOrReadOnly
from .models import Class, Section, Subject, SubjectAssignment, Period, TimetableEntry, ClassRoom
from .serializers import ClassSerializer, SectionSerializer, SubjectSerializer, SubjectAssignmentSerializer, PeriodSerializer, TimetableEntrySerializer, ClassRoomSerializer
import logging

logger = logging.getLogger(__name__)


class ClassViewSet(TenantMixin, viewsets.ModelViewSet):
    """
    ViewSet for Class management
    List, Create, Retrieve, Update, Delete classes
    """
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'academic_year']
    ordering_fields = ['name', 'academic_year', 'created_at']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Class.objects.all()
        
        # Super admin sees all (TenantManager handles this via TenantContext)
        # Note: If TenantContext is set to None (Super Admin), we see all.
        # If set to school, we see school's data.
        
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        kwargs = {'created_by': user}
        if user.school:
            kwargs['school'] = user.school
        serializer.save(**kwargs)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class SectionViewSet(TenantMixin, viewsets.ModelViewSet):
    """
    ViewSet for Section management
    """
    queryset = Section.objects.select_related('class_obj').all()
    serializer_class = SectionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'room_number']
    ordering_fields = ['name', 'created_at']
    ordering = ['class_obj', 'name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Section.objects.select_related('class_obj').all()
        
        # Filter by class
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        kwargs = {'created_by': user}
        logger.debug(f"SectionViewSet - User: {user}, School: {user.school if hasattr(user, 'school') else 'No Attr'}")
        if user.school:
            kwargs['school'] = user.school
        serializer.save(**kwargs)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class SubjectViewSet(TenantMixin, viewsets.ModelViewSet):
    """
    ViewSet for Subject management
    """
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Subject.objects.all()
        
        # Filter by type
        subject_type = self.request.query_params.get('type')
        if subject_type:
            queryset = queryset.filter(type=subject_type)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        kwargs = {'created_by': user}
        if user.school:
            kwargs['school'] = user.school
        serializer.save(**kwargs)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class SubjectAssignmentViewSet(TenantMixin, viewsets.ModelViewSet):
    """
    ViewSet for SubjectAssignment management
    """
    queryset = SubjectAssignment.objects.select_related(
        'class_obj', 'section', 'subject', 'teacher', 'teacher__user'
    ).all()
    serializer_class = SubjectAssignmentSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = SubjectAssignment.objects.select_related(
            'class_obj', 'section', 'subject', 'teacher', 'teacher__user'
        ).all()
        
        # Filter by class
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        
        # Filter by section
        section_id = self.request.query_params.get('section_id')
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        
        # Filter by subject
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        
        # Filter by teacher
        teacher_id = self.request.query_params.get('teacher_id')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        kwargs = {'created_by': user}
        if user.school:
            kwargs['school'] = user.school
        serializer.save(**kwargs)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class PeriodViewSet(TenantMixin, viewsets.ModelViewSet):
    """
    ViewSet for Period management
    """
    queryset = Period.objects.all()
    serializer_class = PeriodSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['order']
    ordering = ['order']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # TenantMixin automatically filters by school
        return Period.objects.all()
    
    def perform_create(self, serializer):
        user = self.request.user
        kwargs = {'created_by': user}
        if user.school:
            kwargs['school'] = user.school
        serializer.save(**kwargs)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class ClassRoomViewSet(TenantMixin, viewsets.ModelViewSet):
    """
    ViewSet for ClassRoom management
    """
    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'location']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        user = self.request.user
        kwargs = {'created_by': user}
        if user.school:
            kwargs['school'] = user.school
        serializer.save(**kwargs)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class TimetableEntryViewSet(TenantMixin, viewsets.ModelViewSet):
    """
    ViewSet for Timetable management
    """
    queryset = TimetableEntry.objects.select_related(
        'class_obj', 'section', 'subject', 'teacher', 'teacher__user', 'period'
    ).all()
    serializer_class = TimetableEntrySerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['day_of_week', 'period__order']
    ordering = ['day_of_week', 'period__order']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = TimetableEntry.objects.select_related(
            'class_obj', 'section', 'subject', 'teacher', 'teacher__user', 'period'
        ).all()
        
        # Filter by class
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        
        # Filter by section
        section_id = self.request.query_params.get('section_id')
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        
        # Filter by teacher
        teacher_id = self.request.query_params.get('teacher_id')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
            
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
            
        # Filter by day
        day = self.request.query_params.get('day')
        if day:
            queryset = queryset.filter(day_of_week=day)
            
        # Filter by room
        room_id = self.request.query_params.get('room_id')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
            
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        kwargs = {'created_by': user}
        if user.school:
            kwargs['school'] = user.school
        serializer.save(**kwargs)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


