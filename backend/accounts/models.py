import uuid
from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models
from core.models import AuditModel, TimeStampedModel


class UserManager(DjangoUserManager):
    """
    Custom manager for User model to handle role assignment for superusers
    """
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('role', 'super_admin')
        return super().create_superuser(username, email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser with role-based access and multi-tenancy
    """
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),  # Cross-tenant access
        ('admin', 'School Admin'),       # School-specific admin
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('parent', 'Parent'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    school = models.ForeignKey(
        'School',
        on_delete=models.SET_NULL,
        null=True,  # Temporarily nullable for migration
        blank=True,
        related_name='users',
        help_text="School this user belongs to. NULL for super admins."
    )
    
    objects = UserManager()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_email_verified = models.BooleanField(default=False)
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
            models.Index(fields=['school']),
        ]
    
    def __str__(self):
        school_name = f" - {self.school.name}" if self.school else " - All Schools"
        return f"{self.get_full_name() or self.username} ({self.get_role_display()}){school_name}"
    
    def is_super_admin(self):
        """Check if user is a super admin with cross-tenant access"""
        return self.role == 'super_admin'
    
    def is_school_admin(self):
        """Check if user is a school admin"""
        return self.role == 'admin'
    
    def can_access_school(self, school):
        """Check if user can access data from the given school"""
        if self.is_super_admin():
            return True
        return self.school_id == school.id if school else False


class School(AuditModel):
    """
    School/Tenant model for multi-tenancy support.
    Replaces singleton SchoolProfile to support multiple schools.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]
    
    name = models.CharField(max_length=200)
    code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique school code (e.g., 'ABC', 'XYZ')"
    )
    logo = models.ImageField(upload_to='schools/logos/', null=True, blank=True)
    school_verification_code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique code for teacher self-registration"
    )
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(max_length=255, blank=True)
    established_year = models.IntegerField(null=True, blank=True)
    affiliation = models.CharField(
        max_length=100,
        blank=True,
        help_text="Board affiliation (e.g., CBSE, ICSE)"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    class Meta:
        db_table = 'schools'
        verbose_name = 'School'
        verbose_name_plural = 'Schools'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['status']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-generate code from name if not provided
        if not self.code:
            self.code = self.generate_school_code()
        
        # Generate verification code if not exists
        if not self.school_verification_code:
            self.school_verification_code = self.generate_verification_code()
        
        super().save(*args, **kwargs)
    
    def generate_school_code(self):
        """Generate school code from name (first 3-5 letters, uppercase)"""
        base_code = ''.join(filter(str.isalpha, self.name))[:5].upper()
        code = base_code
        counter = 1
        
        # Ensure uniqueness
        while School.objects.filter(code=code).exists():
            code = f"{base_code}{counter}"
            counter += 1
        
        return code
    
    @staticmethod
    def generate_verification_code():
        """Generate a unique 12-character verification code"""
        code = str(uuid.uuid4())[:12].upper()
        # Ensure uniqueness
        while School.objects.filter(school_verification_code=code).exists():
            code = str(uuid.uuid4())[:12].upper()
        return code
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    def is_active(self):
        """Check if school is active"""
        return self.status == 'active'


class TeacherProfile(AuditModel):
    """
    Extended teacher information with self-registration and school transfer support
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('rejected', 'Rejected'),
        ('resigned', 'Resigned'),
        ('transfer_requested', 'Transfer Requested'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='teacher_profile'
    )
    employee_id = models.CharField(max_length=50, null=True, blank=True)
    phone = models.CharField(max_length=20)
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
    
    # Academic
    subjects = models.ManyToManyField(
        'academic.Subject',
        blank=True,
        related_name='teachers',
        help_text="Subjects this teacher is qualified to teach"
    )
    
    # School transfer fields
    transfer_requested_to = models.ForeignKey(
        School,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incoming_transfer_requests',
        help_text="School teacher has requested to transfer to"
    )
    transfer_request_date = models.DateTimeField(null=True, blank=True)
    transfer_approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_transfers',
        help_text="Admin who approved the transfer"
    )
    transfer_history = models.JSONField(
        default=list,
        blank=True,
        help_text="History of school transfers [{school_id, school_name, from_date, to_date}]"
    )
    
    class Meta:
        db_table = 'teacher_profiles'
        verbose_name = 'Teacher Profile'
        verbose_name_plural = 'Teacher Profiles'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['employee_id']),
            models.Index(fields=['status']),
            models.Index(fields=['self_registered']),
            models.Index(fields=['transfer_requested_to']),
        ]
        # Remove unique constraint on employee_id and phone to allow per-school uniqueness
    
    def __str__(self):
        school_name = self.user.school.name if self.user.school else "No School"
        return f"{self.user.get_full_name()} - {school_name}"
    
    def is_verified(self):
        """Check if teacher is verified and can login"""
        return self.status == 'active'
    
    def request_transfer(self, to_school):
        """Request transfer to another school"""
        from django.utils import timezone
        
        if self.status == 'transfer_requested':
            raise ValueError("Transfer request already pending")
        
        self.transfer_requested_to = to_school
        self.transfer_request_date = timezone.now()
        self.status = 'transfer_requested'
        self.save()
    
    def approve_transfer(self, approved_by_user):
        """Approve school transfer and update user's school"""
        from django.utils import timezone
        
        if not self.transfer_requested_to:
            raise ValueError("No pending transfer request")
        
        # Record transfer history
        old_school = self.user.school
        new_school = self.transfer_requested_to
        
        if not isinstance(self.transfer_history, list):
            self.transfer_history = []
        
        self.transfer_history.append({
            'from_school_id': old_school.id if old_school else None,
            'from_school_name': old_school.name if old_school else None,
            'to_school_id': new_school.id,
            'to_school_name': new_school.name,
            'transfer_date': timezone.now().isoformat(),
            'approved_by': approved_by_user.get_full_name()
        })
        
        # Update user's school
        self.user.school = new_school
        self.user.save()
        
        # Reset transfer fields
        self.transfer_requested_to = None
        self.transfer_request_date = None
        self.transfer_approved_by = approved_by_user
        self.status = 'active'
        self.save()
    
    def reject_transfer(self, rejection_reason=""):
        """Reject school transfer request"""
        self.transfer_requested_to = None
        self.transfer_request_date = None
        self.rejection_reason = rejection_reason
        self.status = 'active'
        self.save()


class OTPVerification(models.Model):
    """
    Model to store OTP codes for user verification
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_codes')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'otp_verification'
        indexes = [
            models.Index(fields=['user', 'otp']),
            models.Index(fields=['expires_at']),
        ]
        
    def __str__(self):
        return f"OTP for {self.user.username}"
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
