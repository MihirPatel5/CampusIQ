from rest_framework import serializers
from .models import FeeStructure, FeeItem, Invoice, Payment
from students.models import StudentProfile


class FeeItemSerializer(serializers.ModelSerializer):
    """Serializer for FeeItem"""
    
    class Meta:
        model = FeeItem
        fields = ['id', 'name', 'amount', 'due_date', 'installment']


class FeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for FeeStructure"""
    fee_items = FeeItemSerializer(many=True, required=False)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = [
            'id', 'name', 'academic_year', 'class_obj', 'class_name',
            'total_amount', 'status', 'fee_items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        fee_items_data = validated_data.pop('fee_items', [])
        fee_structure = FeeStructure.objects.create(**validated_data)
        
        for item_data in fee_items_data:
            FeeItem.objects.create(fee_structure=fee_structure, **item_data)
        
        return fee_structure


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    fee_structure_name = serializers.CharField(source='fee_structure.name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'student', 'student_name',
            'fee_structure', 'fee_structure_name', 'total_amount',
            'paid_amount', 'remaining_amount', 'due_date', 'status',
            'installment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'paid_amount', 'remaining_amount', 'status', 'created_at', 'updated_at']


class GenerateInvoicesSerializer(serializers.Serializer):
    """Serializer for bulk invoice generation"""
    fee_structure_id = serializers.IntegerField()
    student_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    class_id = serializers.IntegerField(required=False)
    section_id = serializers.IntegerField(required=False)


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment"""
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    student_name = serializers.CharField(source='invoice.student.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'invoice_number', 'student_name', 'receipt_number',
            'amount', 'payment_date', 'payment_mode', 'transaction_reference',
            'remarks', 'created_at'
        ]
        read_only_fields = ['id', 'receipt_number', 'created_at']
