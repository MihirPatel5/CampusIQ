from rest_framework import serializers
from .models import Class, Section, Subject, SubjectAssignment


class ClassSerializer(serializers.ModelSerializer):
    """Serializer for Class model"""
    
    class Meta:
        model = Class
        fields = ['id', 'name', 'code', 'academic_year', 'description', 'status', 'created_at', 'updated_at']
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


class SectionSerializer(serializers.ModelSerializer):
    """Serializer for Section model"""
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    current_strength = serializers.SerializerMethodField()
    has_capacity = serializers.SerializerMethodField()
    
    class Meta:
        model = Section
        fields = [
            'id', 'class_obj', 'class_name', 'name', 'code', 'capacity',
            'room_number', 'status', 'current_strength', 'has_capacity',
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
