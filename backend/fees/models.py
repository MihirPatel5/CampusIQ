from django.db import models
from django.core.validators import MinValueValidator
from core.models import AuditModel, TimeStampedModel
from decimal import Decimal


class FeeStructure(AuditModel):
    """
    Fee structure definitions
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    name = models.CharField(max_length=200, help_text="e.g., 'Class 10 Annual Fee 2024-25'")
    academic_year = models.CharField(max_length=10)
    class_obj = models.ForeignKey(
        'academic.Class',
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name='fee_structures',
        help_text="NULL = applicable to all classes"
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    class Meta:
        db_table = 'fee_structures'
        verbose_name = 'Fee Structure'
        verbose_name_plural = 'Fee Structures'
        indexes = [
            models.Index(fields=['class_obj']),
            models.Index(fields=['academic_year']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return self.name


class FeeItem(TimeStampedModel):
    """
    Individual fee items within a structure
    """
    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.CASCADE,
        related_name='fee_items'
    )
    name = models.CharField(max_length=200, help_text="e.g., 'Tuition Fee', 'Library Fee'")
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    due_date = models.DateField()
    installment = models.IntegerField(default=1, help_text="Installment number")
    
    class Meta:
        db_table = 'fee_items'
        verbose_name = 'Fee Item'
        verbose_name_plural = 'Fee Items'
        indexes = [
            models.Index(fields=['fee_structure']),
            models.Index(fields=['due_date']),
        ]
        ordering = ['installment', 'due_date']
    
    def __str__(self):
        return f"{self.name} - ₹{self.amount}"


class Invoice(AuditModel):
    """
    Fee invoices for students
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]
    
    invoice_number = models.CharField(max_length=50, unique=True, help_text="e.g., 'INV-2024-001'")
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='invoices'
    )
    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.RESTRICT,
        related_name='invoices'
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    installment = models.IntegerField(default=1)
    
    class Meta:
        db_table = 'invoices'
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['status']),
            models.Index(fields=['due_date']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.invoice_number} - {self.student.get_full_name()}"
    
    def update_status(self):
        """Auto-update invoice status based on payment"""
        if self.paid_amount >= self.total_amount:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partial'
        else:
            self.status = 'pending'
        self.save()


class Payment(TimeStampedModel):
    """
    Fee payment records
    """
    PAYMENT_MODE_CHOICES = [
        ('cash', 'Cash'),
        ('cheque', 'Cheque'),
        ('online', 'Online'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    receipt_number = models.CharField(max_length=50, unique=True, help_text="e.g., 'RCP-2024-001'")
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    payment_date = models.DateField()
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES)
    transaction_reference = models.CharField(max_length=100, blank=True)
    remarks = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='payments_created'
    )
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        indexes = [
            models.Index(fields=['invoice']),
            models.Index(fields=['receipt_number']),
            models.Index(fields=['payment_date']),
            models.Index(fields=['payment_mode']),
        ]
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"{self.receipt_number} - ₹{self.amount}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update invoice paid amount and status
        self.invoice.paid_amount = sum(p.amount for p in self.invoice.payments.all())
        self.invoice.remaining_amount = self.invoice.total_amount - self.invoice.paid_amount
        self.invoice.update_status()
