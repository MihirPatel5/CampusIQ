from rest_framework import serializers
from .models import Attendance, StaffAttendance
from students.models import StudentProfile
from datetime import date


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'student_admission_number',
            'class_obj', 'section', 'date', 'status', 'remarks',
            'marked_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'marked_by', 'created_at', 'updated_at']
    
    def validate_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("Cannot mark attendance for future dates")
        return value


class BulkAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk attendance marking"""
    date = serializers.DateField()
    class_id = serializers.IntegerField()
    section_id = serializers.IntegerField()
    attendance = serializers.ListField(
        child=serializers.DictField()
    )
    
    def validate_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("Cannot mark attendance for future dates")
        return value
    
    def validate(self, attrs):
        # Validate each attendance record
        for record in attrs['attendance']:
            if 'student_id' not in record or 'status' not in record:
                raise serializers.ValidationError("Each attendance record must have student_id and status")
            
            if record['status'] not in ['present', 'absent', 'late', 'leave']:
                raise serializers.ValidationError("Invalid status value")
        
        return attrs


class AttendanceStatsSerializer(serializers.Serializer):
    """Serializer for attendance statistics"""
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    leave_days = serializers.IntegerField()
    attendance_percentage = serializers.FloatField()


class StaffAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for StaffAttendance"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_role = serializers.CharField(source='user.get_role_display', read_only=True)

    class Meta:
        model = StaffAttendance
        fields = [
            'id', 'user', 'user_name', 'user_role', 'date',
            'status', 'remarks', 'marked_by', 'created_at'
        ]
        read_only_fields = ['id', 'marked_by', 'created_at']
