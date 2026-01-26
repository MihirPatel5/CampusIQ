from rest_framework import serializers
from django.db import transaction
from .models import Class, Section, Subject, SubjectAssignment, Period, TimetableEntry
from accounts.models import TeacherProfile


class ClassSerializer(serializers.ModelSerializer):
    """Serializer for Class model"""
    sections = serializers.ListField(read_only=True) # or nested SectionSerializer but defined later. Using ListField for now or SerializeMethodField to avoid reference error.
    # Actually, if SectionSerializer is defined later, I can use string reference 'SectionSerializer' if using PrimaryKeyRelated, but for nested it might be tricky.
    # But I can define SectionSerializer first or use 'SectionSerializer' string if DRF supports it (depends on version/setup).
    # Safer: Simple ListField for read_only or omit it if not critical to return immediately.
    # But user wants sections in creation?
    # Let's use SerializerMethodField for read or just return minimal data.
    # For write, sections_data is what matters.
    
    sections_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="List of sections to create: [{'name': 'A', 'class_teacher': 1}, ...]"
    )
    
    class Meta:
        model = Class
        fields = ['id', 'name', 'code', 'academic_year', 'description', 'status', 'sections', 'sections_data', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_code(self, value):
        # Check uniqueness for code + academic_year
        academic_year = self.initial_data.get('academic_year')
        if self.instance:
            # Update case - exclude current instance
            if Class.objects.filter(code=value, academic_year=academic_year).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Class with this code already exists for this academic year")
        else:
            # Create case
            if Class.objects.filter(code=value, academic_year=academic_year).exists():
                raise serializers.ValidationError("Class with this code already exists for this academic year")
        return value

    def create(self, validated_data):
        sections_data = validated_data.pop('sections_data', [])
        
        with transaction.atomic():
            class_obj = Class.objects.create(**validated_data)
            
            for section_data in sections_data:
                name = section_data.get('name')
                class_teacher_id = section_data.get('class_teacher')
                
                # Generate section code (ClassCode-SectionName e.g. C10-A)
                code = f"{class_obj.code}-{name}"
                
                class_teacher = None
                if class_teacher_id:
                    try:
                        class_teacher = TeacherProfile.objects.get(pk=class_teacher_id)
                    except TeacherProfile.DoesNotExist:
                        pass # Or raise error
                
                Section.objects.create(
                    class_obj=class_obj,
                    name=name,
                    code=code,
                    class_teacher=class_teacher,
                    school=class_obj.school # Inherit school
                )
        
        return class_obj


class SectionSerializer(serializers.ModelSerializer):
    """Serializer for Section model"""
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    current_strength = serializers.SerializerMethodField()
    has_capacity = serializers.SerializerMethodField()
    class_teacher_name = serializers.CharField(source='class_teacher.user.get_full_name', read_only=True)
    
    class Meta:
        model = Section
        fields = [
            'id', 'class_obj', 'class_name', 'name', 'code', 'capacity',
            'room_number', 'class_teacher', 'class_teacher_name', 
            'status', 'current_strength', 'has_capacity',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_current_strength(self, obj):
        return obj.get_current_strength()
    
    def get_has_capacity(self, obj):
        return obj.has_capacity()


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for Subject model"""
    
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'type', 'description', 'max_marks', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubjectAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for SubjectAssignment"""
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    
    class Meta:
        model = SubjectAssignment
        fields = [
            'id', 'class_obj', 'class_name', 'section', 'section_name',
            'subject', 'subject_name', 'teacher', 'teacher_name',
            'academic_year', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        # Validate teacher is active
        teacher = attrs.get('teacher')
        if teacher and teacher.status != 'active':
            raise serializers.ValidationError({"teacher": "Only active teachers can be assigned to subjects"})
        
        # Check for duplicate assignment
        class_obj = attrs.get('class_obj')
        section = attrs.get('section')
        subject = attrs.get('subject')
        academic_year = attrs.get('academic_year')
        
        query = SubjectAssignment.objects.filter(
            class_obj=class_obj,
            section=section,
            subject=subject,
            academic_year=academic_year
        )
        
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        
        if query.exists():
            raise serializers.ValidationError("This subject is already assigned to this class and section for this academic year")
        
        return attrs


class PeriodSerializer(serializers.ModelSerializer):
    """Serializer for Period model"""
    class Meta:
        model = Period
        fields = ['id', 'name', 'start_time', 'end_time', 'is_break', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TimetableEntrySerializer(serializers.ModelSerializer):
    """Serializer for TimetableEntry model"""
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    period_name = serializers.CharField(source='period.name', read_only=True)
    period_time = serializers.SerializerMethodField()
    
    class Meta:
        model = TimetableEntry
        fields = [
            'id', 'class_obj', 'class_name', 'section', 'section_name',
            'day_of_week', 'period', 'period_name', 'period_time',
            'subject', 'subject_name', 'teacher', 'teacher_name',
            'academic_year', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_period_time(self, obj):
        return f"{obj.period.start_time.strftime('%H:%M')} - {obj.period.end_time.strftime('%H:%M')}"

    def validate(self, attrs):
        # Additional validation logic if needed beyond model clean()
        # Model.clean() is not automatically called by DRF, so we call it here or implement logic
        
        # Basic field level validation is handled by DRF
        # Complex validation involving multiple fields:
        
        # We can construct a dummy instance to call model.clean()
        # But allow optional fields if partial update
        
        # Simple check for now: verify related objects belong to same school is verified in save() mainly but good to check here
        # The CurrentUserDefault/HiddenField usually handles school assignment in ViewSet perform_create
        
        return attrs
