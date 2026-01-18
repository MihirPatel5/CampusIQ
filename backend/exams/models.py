from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import TenantAwareModel,  TimeStampedModel
from decimal import Decimal


class Exam(TenantAwareModel):
    """
    Exam definitions - Multi-tenant
    """
    TYPE_CHOICES = [
        ('unit_test', 'Unit Test'),
        ('mid_term', 'Mid-Term'),
        ('final', 'Final'),
        ('annual', 'Annual'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('published', 'Published'),
    ]
    
    name = models.CharField(max_length=200, help_text="e.g., 'Mid-Term Exam 2024'")
    exam_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    academic_year = models.CharField(max_length=10)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    class Meta:
        db_table = 'exams'
        verbose_name = 'Exam'
        verbose_name_plural = 'Exams'
        indexes = [
            models.Index(fields=['school', 'academic_year']),
            models.Index(fields=['status']),
        ]
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.name} ({self.academic_year}) - {self.school.name}"


class ExamResult(TimeStampedModel):
    """
    Student exam marks - Multi-tenant (inherits from exam's school)
    """
    GRADE_CHOICES = [
        ('A+', 'A+'),
        ('A', 'A'),
        ('B+', 'B+'),
        ('B', 'B'),
        ('C+', 'C+'),
        ('C', 'C'),
        ('D', 'D'),
        ('F', 'F'),
    ]
    
    school = models.ForeignKey(
        'accounts.School',
        on_delete=models.CASCADE,
        null=True,  # Temporarily nullable for migration
        blank=True,
        related_name='exam_results',
        help_text="Auto-populated from exam's school"
    )
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='results'
    )
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='exam_results'
    )
    subject = models.ForeignKey(
        'academic.Subject',
        on_delete=models.CASCADE,
        related_name='exam_results'
    )
    marks_obtained = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    max_marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    grade = models.CharField(max_length=5, choices=GRADE_CHOICES, blank=True)
    remarks = models.TextField(blank=True)
    entered_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='exam_results_entered'
    )
    
    class Meta:
        db_table = 'exam_results'
        verbose_name = 'Exam Result'
        verbose_name_plural = 'Exam Results'
        unique_together = [('school', 'exam', 'student', 'subject')]
        indexes = [
            models.Index(fields=['school', 'exam']),
            models.Index(fields=['school', 'student']),
            models.Index(fields=['subject']),
        ]
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Auto-populate school from exam's school
        if not self.school_id and self.exam_id:
            self.school = self.exam.school
        
        # Auto-calculate grade if not provided
        if not self.grade:
            self.grade = self.calculate_grade()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.subject.name} ({self.exam.name}) - {self.school.name}"
    
    def get_percentage(self):
        """Calculate percentage"""
        if self.max_marks > 0:
            return (self.marks_obtained / self.max_marks) * 100
        return 0
    
    def calculate_grade(self):
        """Auto-calculate grade based on percentage"""
        percentage = self.get_percentage()
        if percentage >= 90:
            return 'A+'
        elif percentage >= 80:
            return 'A'
        elif percentage >= 70:
            return 'B+'
        elif percentage >= 60:
            return 'B'
        elif percentage >= 50:
            return 'C+'
        elif percentage >= 40:
            return 'C'
        elif percentage >= 33:
            return 'D'
        else:
            return 'F'
