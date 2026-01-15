import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from core.models import AuditModel, TimeStampedModel


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser with role-based access
    """
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('parent', 'Parent'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users_created'
    )
    updated_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users_updated'
    )
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
            models.Index(fields=['role']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class SchoolProfile(TimeStampedModel):
    """
    School information and settings (singleton pattern)
    """
    name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='school/logos/', null=True, blank=True)
    school_verification_code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique code for teacher self-registration"
    )
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(max_length=255, blank=True)
    established_year = models.IntegerField(null=True, blank=True)
    affiliation = models.CharField(
        max_length=100,
        blank=True,
        help_text="Board affiliation (e.g., CBSE, ICSE)"
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='school_updates'
    )
    
    class Meta:
        db_table = 'school_profiles'
        verbose_name = 'School Profile'
        verbose_name_plural = 'School Profile'
    
    def save(self, *args, **kwargs):
        # Ensure only one school profile exists
        if not self.pk and SchoolProfile.objects.exists():
            raise ValueError("Only one school profile can exist")
        
        # Generate verification code if not exists
        if not self.school_verification_code:
            self.school_verification_code = self.generate_verification_code()
        
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_verification_code():
        """Generate a unique 12-character verification code"""
        return str(uuid.uuid4())[:12].upper()
    
    def __str__(self):
        return self.name


class TeacherProfile(AuditModel):
    """
    Extended teacher information with self-registration support
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('rejected', 'Rejected'),
        ('resigned', 'Resigned'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='teacher_profile'
    )
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, unique=True)
    date_of_birth = models.DateField(null=True, blank=True)
    joining_date = models.DateField()
    qualification = models.TextField(blank=True)
    specialization = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    self_registered = models.BooleanField(
        default=False,
        help_text="True if teacher registered themselves, False if admin-created"
    )
    rejection_reason = models.TextField(blank=True, help_text="Reason for rejection if status is rejected")
    
    class Meta:
        db_table = 'teacher_profiles'
        verbose_name = 'Teacher Profile'
        verbose_name_plural = 'Teacher Profiles'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['employee_id']),
            models.Index(fields=['status']),
            models.Index(fields=['self_registered']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.employee_id or 'No Employee ID'}"
    
    def is_verified(self):
        """Check if teacher is verified and can login"""
        return self.status == 'active'
