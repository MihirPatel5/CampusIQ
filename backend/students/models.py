from django.db import models
from core.models import TenantAwareModel


class StudentProfile(TenantAwareModel):
    """
    Extended student information with multi-tenant support
    """
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('graduated', 'Graduated'),
        ('transferred', 'Transferred'),
    ]
    
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='student_profile'
    )
    admission_number = models.CharField(max_length=50, help_text="e.g., 'ADM2024001'")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=5, blank=True)
    aadhaar_number = models.CharField(max_length=12, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    admission_date = models.DateField()
    class_obj = models.ForeignKey(
        'academic.Class',
        on_delete=models.RESTRICT,
        related_name='students'
    )
    section = models.ForeignKey(
        'academic.Section',
        on_delete=models.RESTRICT,
        related_name='students'
    )
    previous_school = models.CharField(max_length=200, blank=True)
    previous_class = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Transfer tracking
    transfer_history = models.JSONField(
        default=list,
        blank=True,
        help_text="History of school transfers"
    )
    
    class Meta:
        db_table = 'student_profiles'
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'
        indexes = [
            models.Index(fields=['school']),
            models.Index(fields=['admission_number']),
            models.Index(fields=['class_obj', 'section']),
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['status']),
        ]
        # Unique constraints per school
        unique_together = [
            ('school', 'admission_number'),
            ('school', 'email'),
            ('school', 'phone'),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number}) - {self.school.name}"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"


class ParentProfile(TenantAwareModel):
    """
    Parent/Guardian information
    """
    RELATION_CHOICES = [
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('guardian', 'Guardian'),
    ]
    
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='parent_profile'
    )
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='parents'
    )
    relation = models.CharField(max_length=20, choices=RELATION_CHOICES)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    is_primary = models.BooleanField(default=False, help_text="Primary contact for communications")
    
    class Meta:
        db_table = 'parent_profiles'
        verbose_name = 'Parent Profile'
        verbose_name_plural = 'Parent Profiles'
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['relation']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_relation_display()} of {self.student.get_full_name()})"
