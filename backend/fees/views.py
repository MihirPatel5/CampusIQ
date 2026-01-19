from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin
from django.db.models import Sum
from .models import FeeStructure, Invoice, Payment
from students.models import StudentProfile
from .serializers import (
    FeeStructureSerializer, InvoiceSerializer, PaymentSerializer, GenerateInvoicesSerializer
)


class FeeStructureViewSet(viewsets.ModelViewSet):
    """ViewSet for FeeStructure management"""
    queryset = FeeStructure.objects.prefetch_related('fee_items').all()
    serializer_class = FeeStructureSerializer
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = FeeStructure.objects.prefetch_related('fee_items').all()
        
        # Super admin sees all fee structures
        if user.is_super_admin():
            pass
        # School admin/Teacher/Parent sees only their school's fee structures
        elif user.school:
            queryset = queryset.filter(school=user.school)
        else:
            queryset = queryset.none()
        
        # Filter by class
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


@api_view(['POST'])
@permission_classes([IsAdmin])
def generate_invoices(request):
    """
    Generate invoices for students
    POST /api/v1/fees/invoices/generate/
    """
    serializer = GenerateInvoicesSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    fee_structure_id = data['fee_structure_id']
    student_ids = data.get('student_ids')
    class_id = data.get('class_id')
    section_id = data.get('section_id')
    
    try:
        fee_structure = FeeStructure.objects.get(id=fee_structure_id, school=request.user.school)
    except FeeStructure.DoesNotExist:
        return Response({'error': 'Fee structure not found in your school'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get students list (filtered by school)
    if student_ids:
        students = StudentProfile.objects.filter(id__in=student_ids, status='active', user__school=request.user.school)
    elif class_id and section_id:
        students = StudentProfile.objects.filter(
            class_obj_id=class_id,
            section_id=section_id,
            status='active',
            user__school=request.user.school
        )
    elif class_id:
        students = StudentProfile.objects.filter(class_obj_id=class_id, status='active', user__school=request.user.school)
    else:
        return Response(
            {'error': 'Provide either student_ids or class_id/section_id'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    created_invoices = []
    errors = []
    
    for student in students:
        try:
            # Generate invoice number
            invoice_count = Invoice.objects.count() + 1
            invoice_number = f"INV-{fee_structure.academic_year.replace('-', '')}-{invoice_count:04d}"
            
            invoice = Invoice.objects.create(
                invoice_number=invoice_number,
                student=student,
                fee_structure=fee_structure,
                school=request.user.school,  # Set school explicitly
                total_amount=fee_structure.total_amount,
                remaining_amount=fee_structure.total_amount,
                due_date=fee_structure.fee_items.first().due_date if fee_structure.fee_items.exists() else None,
                created_by=request.user
            )
            created_invoices.append(invoice_number)
        except Exception as e:
            errors.append(f"Error for student {student.admission_number}: {str(e)}")
    
    return Response({
        'message': f'Generated {len(created_invoices)} invoices',
        'invoices': created_invoices,
        'errors': errors
    }, status=status.HTTP_201_CREATED)


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Invoice management"""
    queryset = Invoice.objects.select_related('student', 'fee_structure').all()
    serializer_class = InvoiceSerializer
    ordering = ['-created_at']
    
    def get_permissions(self):
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Invoice.objects.select_related('student', 'fee_structure').all()
        
        # Super admin sees all invoices
        if user.is_super_admin():
            pass
        # School admin/Teacher/Parent sees only their school's invoices
        elif user.school:
            queryset = queryset.filter(school=user.school)
        else:
            queryset = queryset.none()
        
        # Filter by student
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        return queryset


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment management"""
    queryset = Payment.objects.select_related('invoice', 'invoice__student').all()
    serializer_class = PaymentSerializer
    ordering = ['-payment_date']
    
    def get_permissions(self):
        if self.action in ['create']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.select_related('invoice', 'invoice__student').all()
        
        # Super admin sees all payments
        if user.is_super_admin():
            pass
        # School admin/Teacher/Parent sees only their school's payments
        elif user.school:
            queryset = queryset.filter(school=user.school)
        else:
            queryset = queryset.none()
        
        # Filter by invoice
        invoice_id = self.request.query_params.get('invoice_id')
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        
        return queryset
    
    def perform_create(self, serializer):
        # Generate receipt number
        payment_count = Payment.objects.count() + 1
        receipt_number = f"RCP-2026-{payment_count:05d}"
        serializer.save(receipt_number=receipt_number, created_by=self.request.user)
