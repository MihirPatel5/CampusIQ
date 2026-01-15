from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin, IsActiveTeacher
from django.db.models import Sum, Avg
from .models import Exam, ExamResult
from students.models import StudentProfile
from .serializers import (
    ExamSerializer, ExamResultSerializer, BulkResultEntrySerializer, StudentReportCardSerializer
)


class ExamViewSet(viewsets.ModelViewSet):
    """ViewSet for Exam management"""
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    ordering = ['-start_date']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        
        # Filter by exam type
        exam_type = self.request.query_params.get('exam_type')
        if exam_type:
            queryset = queryset.filter(exam_type=exam_type)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def publish(self, request, pk=None):
        """Publish exam results"""
        exam = self.get_object()
        exam.status = 'published'
        exam.save()
        return Response({'message': 'Exam results published successfully'})


@api_view(['POST'])
@permission_classes([IsActiveTeacher | IsAdmin])
def enter_results_bulk(request):
    """
    Enter exam results in bulk
    POST /api/v1/exams/results/bulk-entry/
    """
    serializer = BulkResultEntrySerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    exam_id = data['exam_id']
    subject_id = data['subject_id']
    results = data['results']
    
    created_count = 0
    updated_count = 0
    errors = []
    
    for record in results:
        student_id = record['student_id']
        marks_obtained = record['marks_obtained']
        max_marks = record['max_marks']
        remarks = record.get('remarks', '')
        
        try:
            student = StudentProfile.objects.get(id=student_id)
            
            # Create or update result
            result, created = ExamResult.objects.update_or_create(
                exam_id=exam_id,
                student=student,
                subject_id=subject_id,
                defaults={
                    'marks_obtained': marks_obtained,
                    'max_marks': max_marks,
                    'remarks': remarks,
                    'entered_by': request.user
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
        'message': 'Results entered successfully',
        'created': created_count,
        'updated': updated_count,
        'errors': errors
    }, status=status.HTTP_201_CREATED if created_count > 0 else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_report_card(request, exam_id, student_id):
    """
    Get student report card for an exam
    GET /api/v1/exams/{exam_id}/report-card/{student_id}/
    """
    try:
        exam = Exam.objects.get(id=exam_id)
        student = StudentProfile.objects.get(id=student_id)
    except (Exam.DoesNotExist, StudentProfile.DoesNotExist) as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
    
    # Get all results for this student in this exam
    results = ExamResult.objects.filter(exam=exam, student=student).select_related('subject')
    
    if not results.exists():
        return Response({'error': 'No results found for this student'}, status=status.HTTP_404_NOT_FOUND)
    
    # Calculate totals
    total_marks = sum(r.max_marks for r in results)
    marks_obtained = sum(r.marks_obtained for r in results)
    percentage = (marks_obtained / total_marks * 100) if total_marks > 0 else 0
    
    # Determine overall grade
    if percentage >= 90:
        overall_grade = 'A+'
    elif percentage >= 80:
        overall_grade = 'A'
    elif percentage >= 70:
        overall_grade = 'B+'
    elif percentage >= 60:
        overall_grade = 'B'
    elif percentage >= 50:
        overall_grade = 'C+'
    elif percentage >= 40:
        overall_grade = 'C'
    elif percentage >= 33:
        overall_grade = 'D'
    else:
        overall_grade = 'F'
    
    report_data = {
        'exam': ExamSerializer(exam).data,
        'student': {
            'id': student.id,
            'admission_number': student.admission_number,
            'name': student.get_full_name(),
            'class': student.class_obj.name,
            'section': student.section.name
        },
        'results': ExamResultSerializer(results, many=True).data,
        'total_marks': total_marks,
        'marks_obtained': marks_obtained,
        'percentage': round(percentage, 2),
        'overall_grade': overall_grade
    }
    
    return Response(report_data)


class ExamResultViewSet(viewsets.ModelViewSet):
    """ViewSet for ExamResult management"""
    queryset = ExamResult.objects.select_related('exam', 'student', 'subject', 'entered_by').all()
    serializer_class = ExamResultSerializer
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsActiveTeacher | IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by exam
        exam_id = self.request.query_params.get('exam_id')
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)
        
        # Filter by student
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by subject
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(entered_by=self.request.user)
