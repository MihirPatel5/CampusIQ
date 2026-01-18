from django.db import models
from core.models import TenantAwareModel


class Class(TenantAwareModel):
    """
    Class definitions (Class 1, Class 10, etc.) - Multi-tenant
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    name = models.CharField(max_length=100, help_text="e.g., 'Class 10'")
    code = models.CharField(max_length=20, help_text="e.g., 'C10'")
    academic_year = models.CharField(max_length=10, help_text="e.g., '2024-25'")
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    class Meta:
        db_table = 'classes'
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
        indexes = [
            models.Index(fields=['school', 'code']),
            models.Index(fields=['school', 'academic_year']),
            models.Index(fields=['status']),
        ]
        unique_together = [('school', 'code', 'academic_year')]
    
    def __str__(self):
        return f"{self.name} ({self.academic_year}) - {self.school.name}"


class Section(TenantAwareModel):
    """
    Sections within classes (A, B, Science, etc.) - Multi-tenant
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    class_obj = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='sections'
    )
    name = models.CharField(max_length=50, help_text="e.g., 'A', 'B', 'Science'")
    code = models.CharField(max_length=20, help_text="e.g., '10-A', '10-B'")
    capacity = models.IntegerField(null=True, blank=True, help_text="Maximum students allowed")
    room_number = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    class Meta:
        db_table = 'sections'
        verbose_name = 'Section'
        verbose_name_plural = 'Sections'
        indexes = [
            models.Index(fields=['school', 'class_obj']),
            models.Index(fields=['school', 'code']),
            models.Index(fields=['status']),
        ]
        unique_together = [('school', 'class_obj', 'code')]
    
    def __str__(self):
        return f"{self.class_obj.name} - {self.name} - {self.school.name}"
    
    def get_current_strength(self):
        """Get current number of students in this section"""
        return self.students.filter(status='active').count()
    
    def has_capacity(self):
        """Check if section has capacity for more students"""
        if not self.capacity:
            return True
        return self.get_current_strength() < self.capacity


class Subject(TenantAwareModel):
    """
    Subject definitions (Mathematics, Physics, etc.) - Multi-tenant
    """
    TYPE_CHOICES = [
        ('core', 'Core'),
        ('elective', 'Elective'),
        ('optional', 'Optional'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    name = models.CharField(max_length=100, help_text="e.g., 'Mathematics'")
    code = models.CharField(max_length=20, help_text="e.g., 'MATH'")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, help_text="Subject type")
    description = models.TextField(blank=True)
    max_marks = models.IntegerField(default=100, help_text="Default maximum marks for exams")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    class Meta:
        db_table = 'subjects'
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'
        indexes = [
            models.Index(fields=['school', 'code']),
            models.Index(fields=['type']),
            models.Index(fields=['status']),
        ]
        unique_together = [('school', 'code')]
    
    def __str__(self):
        return f"{self.name} ({self.code}) - {self.school.name}"


class SubjectAssignment(TenantAwareModel):
    """
    Assign subjects to class+section with teacher - Multi-tenant
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    class_obj = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='subject_assignments'
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name='subject_assignments'
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    teacher = models.ForeignKey(
        'accounts.TeacherProfile',
        on_delete=models.RESTRICT,
        related_name='subject_assignments'
    )
    academic_year = models.CharField(max_length=10, help_text="e.g., '2024-25'")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    class Meta:
        db_table = 'subject_assignments'
        verbose_name = 'Subject Assignment'
        verbose_name_plural = 'Subject Assignments'
        indexes = [
            models.Index(fields=['school', 'class_obj', 'section']),
            models.Index(fields=['teacher']),
            models.Index(fields=['subject']),
            models.Index(fields=['academic_year']),
        ]
        unique_together = [('school', 'class_obj', 'section', 'subject', 'academic_year')]
    
    def __str__(self):
        return f"{self.subject.name} - {self.class_obj.name} {self.section.name} ({self.teacher.user.get_full_name()}) - {self.school.name}"
    
    def clean(self):
        """Validation to ensure teacher is active and verified"""
        from django.core.exceptions import ValidationError
        
        if self.teacher.status != 'active':
            raise ValidationError('Onlyactive and verified teachers can be assigned to subjects')
        
        # Ensure teacher, class, section, and subject belong to same school
        if self.teacher.user.school_id != self.school_id:
            raise ValidationError('Teacher must belong to the same school')
        if self.class_obj.school_id != self.school_id:
            raise ValidationError('Class must belong to the same school')
        if self.section.school_id != self.school_id:
            raise ValidationError('Section must belong to the same school')
        if self.subject.school_id != self.school_id:
            raise ValidationError('Subject must belong to the same school')
