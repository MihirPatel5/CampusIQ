from rest_framework import serializers
from .models import Exam, ExamResult, ExamSchedule
from students.models import StudentProfile
from academic.models import Subject


class ExamSerializer(serializers.ModelSerializer):
    """Serializer for Exam"""
    
    class Meta:
        model = Exam
        fields = [
            'id', 'name', 'exam_type', 'academic_year', 'class_obj', 'start_date',
            'end_date', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExamScheduleSerializer(serializers.ModelSerializer):
    """Serializer for ExamSchedule"""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = ExamSchedule
        fields = [
            'id', 'exam', 'subject', 'subject_name', 'date', 
            'start_time', 'end_time', 'max_marks', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ExamResultSerializer(serializers.ModelSerializer):
    """Serializer for ExamResult"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = ExamResult
        fields = [
            'id', 'exam', 'student', 'student_name', 'student_admission_number',
            'subject', 'subject_name', 'marks_obtained', 'max_marks',
            'grade', 'percentage', 'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'grade', 'created_at', 'updated_at']
    
    def get_percentage(self, obj):
        return round(obj.get_percentage(), 2)
    
    def validate(self, attrs):
        # Validate marks
        marks_obtained = attrs.get('marks_obtained')
        max_marks = attrs.get('max_marks')
        
        if marks_obtained > max_marks:
            raise serializers.ValidationError({"marks_obtained": "Marks obtained cannot exceed maximum marks"})
        
        return attrs


class BulkResultEntrySerializer(serializers.Serializer):
    """Serializer for bulk result entry"""
    exam_id = serializers.IntegerField()
    subject_id = serializers.IntegerField()
    results = serializers.ListField(
        child=serializers.DictField()
    )
    
    def validate(self, attrs):
        # Validate each result record
        for record in attrs['results']:
            if 'student_id' not in record or 'marks_obtained' not in record or 'max_marks' not in record:
                raise serializers.ValidationError("Each result must have student_id, marks_obtained, and max_marks")
            
            if record['marks_obtained'] > record['max_marks']:
                raise serializers.ValidationError(f"Marks obtained cannot exceed max marks for student {record['student_id']}")
        
        return attrs


class StudentReportCardSerializer(serializers.Serializer):
    """Serializer for student report card"""
    exam = ExamSerializer()
    results = ExamResultSerializer(many=True)
    total_marks = serializers.IntegerField()
    marks_obtained = serializers.IntegerField()
    percentage = serializers.FloatField()
    overall_grade = serializers.CharField()
