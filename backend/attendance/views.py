from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin, IsActiveTeacher
from django.db.models import Count, Q
from datetime import date, timedelta
from academic.models import Section
from students.models import StudentProfile
from .models import Attendance, StaffAttendance
from .serializers import AttendanceSerializer, BulkAttendanceSerializer, AttendanceStatsSerializer, StaffAttendanceSerializer


@api_view(['POST'])
@permission_classes([IsActiveTeacher | IsAdmin])
def mark_attendance(request):
    """
    Mark attendance for multiple students
    POST /api/v1/attendance/mark/
    """
    serializer = BulkAttendanceSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    attendance_date = data['date']
    class_id = data['class_id']
    section_id = data['section_id']
    attendance_records = data['attendance']
    
    user = request.user
    
    # Security Check for Teachers
    if user.role == 'teacher':
        try:
            section = Section.objects.get(id=section_id, school=user.school)
            if section.class_teacher and section.class_teacher.user != user:
                return Response(
                    {'error': 'Security Alert: Only the assigned Class Teacher can mark attendance for this section.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except Section.DoesNotExist:
            return Response({'error': 'Section not found'}, status=status.HTTP_404_NOT_FOUND)
    
    created_count = 0
    updated_count = 0
    errors = []
    
    for record in attendance_records:
        student_id = record['student_id']
        attendance_status = record['status']
        remarks = record.get('remarks', '')
        
        try:
            # Filter student by school
            student = StudentProfile.objects.get(id=student_id, school=request.user.school)
            
            # Check if attendance already exists
            attendance, created = Attendance.objects.update_or_create(
                student=student,
                date=attendance_date,
                school=request.user.school,  # Ensure record belongs to same school
                defaults={
                    'class_obj_id': class_id,
                    'section_id': section_id,
                    'status': attendance_status,
                    'remarks': remarks,
                    'marked_by': request.user,
                    'updated_by': request.user
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
                
        except StudentProfile.DoesNotExist:
            errors.append(f"Student with ID {student_id} not found")
        except Exception as e:
            errors.append(f"Error for student {student_id}: {str(e)}")
    
    return Response({
        'message': 'Attendance marked successfully',
        'created': created_count,
        'updated': updated_count,
        'errors': errors
    }, status=status.HTTP_201_CREATED if created_count > 0 else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_students_for_marking(request):
    """
    Get list of students for marking attendance
    GET /api/v1/attendance/students/?class_id=1&section_id=1&date=2026-01-15
    """
    class_id = request.query_params.get('class_id')
    section_id = request.query_params.get('section_id')
    attendance_date = request.query_params.get('date', str(date.today()))
    
    if not class_id or not section_id:
        return Response(
            {'error': 'class_id and section_id are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    students = StudentProfile.objects.filter(
        class_obj_id=class_id,
        section_id=section_id,
        status='active',
        school=request.user.school
    ).select_related('user')
    
    # Get existing attendance for the date
    existing_attendance = Attendance.objects.filter(
        class_obj_id=class_id,
        section_id=section_id,
        date=attendance_date,
        school=request.user.school
    ).select_related('student')
    
    attendance_dict = {att.student_id: att for att in existing_attendance}
    
    result = []
    for student in students:
        att = attendance_dict.get(student.id)
        result.append({
            'student_id': student.id,
            'admission_number': student.admission_number,
            'name': student.get_full_name(),
            'status': att.status if att else None,
            'remarks': att.remarks if att else '',
            'already_marked': att is not None
        })
    
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_attendance_history(request, student_id):
    """
    Get attendance history for a student
    GET /api/v1/attendance/student/{id}/?date_from=2026-01-01&date_to=2026-01-31
    """
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to', str(date.today()))
    
    # Ensure student belongs to user's school
    queryset = Attendance.objects.filter(student_id=student_id, school=request.user.school)
    
    if date_from:
        queryset = queryset.filter(date__gte=date_from)
    if date_to:
        queryset = queryset.filter(date__lte=date_to)
    
    records = queryset.order_by('-date')
    
    # Calculate statistics
    total = records.count()
    present = records.filter(status='present').count()
    absent = records.filter(status='absent').count()
    late = records.filter(status='late').count()
    leave = records.filter(status='leave').count()
    
    percentage = (present / total * 100) if total > 0 else  0
    
    return Response({
        'records': AttendanceSerializer(records, many=True).data,
        'summary': {
            'total_days': total,
            'present_days': present,
            'absent_days': absent,
            'late_days': late,
            'leave_days': leave,
            'attendance_percentage': round(percentage, 2)
        }
    })


class AttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance management"""
    queryset = Attendance.objects.select_related('student', 'class_obj', 'section', 'marked_by').all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-date']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Attendance.objects.select_related('student', 'class_obj', 'section', 'marked_by').all()
        
        # Super admin sees all attendance
        if user.is_super_admin():
            pass
        # School admin/Teacher/Parent sees only their school's attendance
        elif user.school:
            queryset = queryset.filter(school=user.school)
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
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(marked_by=self.request.user)


@api_view(['POST'])
@permission_classes([IsAdmin])
def mark_staff_attendance(request):
    """
    Mark attendance for multiple staff members
    POST /api/v1/attendance/staff-mark/
    """
    attendance_date = request.data.get('date', str(date.today()))
    attendance_records = request.data.get('attendance', [])
    
    created_count = 0
    updated_count = 0
    errors = []
    
    from accounts.models import User
    
    for record in attendance_records:
        user_id = record.get('user_id')
        attendance_status = record.get('status')
        remarks = record.get('remarks', '')
        
        try:
            target_user = User.objects.get(id=user_id, school=request.user.school)
            
            attendance, created = StaffAttendance.objects.update_or_create(
                user=target_user,
                date=attendance_date,
                school=request.user.school,
                defaults={
                    'status': attendance_status,
                    'remarks': remarks,
                    'marked_by': request.user
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
                
        except User.DoesNotExist:
            errors.append(f"Staff member with ID {user_id} not found")
        except Exception as e:
            errors.append(f"Error for staff {user_id}: {str(e)}")
            
    return Response({
        'message': 'Staff attendance marked successfully',
        'created': created_count,
        'updated': updated_count,
        'errors': errors
    }, status=status.HTTP_201_CREATED if created_count > 0 else status.HTTP_200_OK)


class StaffAttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for Staff Attendance management"""
    queryset = StaffAttendance.objects.select_related('user', 'marked_by').all()
    serializer_class = StaffAttendanceSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-date']
    
    def get_queryset(self):
        user = self.request.user
        queryset = StaffAttendance.objects.select_related('user', 'marked_by').all()
        
        if user.is_super_admin():
            pass
        elif user.school:
            queryset = queryset.filter(school=user.school)
        else:
            queryset = queryset.none()
            
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(user__role=role)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(marked_by=self.request.user, school=self.request.user.school)
