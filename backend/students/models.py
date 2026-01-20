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
    
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('obc', 'OBC'),
        ('sc', 'SC'),
        ('st', 'ST'),
        ('other', 'Other'),
    ]
    
    # Basic Information
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='student_profile'
    )
    admission_number = models.CharField(max_length=50, help_text="e.g., 'ADM2024001'")
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=5, blank=True)
    
    # Personal Information
    nationality = models.CharField(max_length=50, default='Indian')
    religion = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, blank=True)
    mother_tongue = models.CharField(max_length=50, blank=True)
    caste = models.CharField(max_length=50, blank=True)
    aadhaar_number = models.CharField(max_length=12, null=True, blank=True)
    
    # Contact Information
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20)
    alternate_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    
    # Medical Information
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Height in cm")
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Weight in kg")
    medical_conditions = models.TextField(blank=True, help_text="Any chronic conditions or disabilities")
    allergies = models.TextField(blank=True)
    vaccination_status = models.TextField(blank=True)
    
    # Academic Information
    admission_date = models.DateField()
    roll_number = models.CharField(max_length=20, blank=True)
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
    previous_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Previous percentage")
    tc_number = models.CharField(max_length=50, blank=True, help_text="Transfer Certificate number")
    tc_date = models.DateField(null=True, blank=True)
    
    # Documents
    photo = models.ImageField(upload_to='students/photos/', null=True, blank=True)
    birth_certificate = models.FileField(upload_to='students/documents/', null=True, blank=True)
    transfer_certificate = models.FileField(upload_to='students/documents/', null=True, blank=True)
    aadhar_card = models.FileField(upload_to='students/documents/', null=True, blank=True)
    caste_certificate = models.FileField(upload_to='students/documents/', null=True, blank=True)
    
    # Transport
    transport_required = models.BooleanField(default=False)
    bus_route = models.CharField(max_length=100, blank=True)
    pickup_point = models.CharField(max_length=200, blank=True)
    
    # Hostel
    hostel_required = models.BooleanField(default=False)
    hostel_room_preference = models.CharField(max_length=100, blank=True)
    
    # Custom Fields (for school-specific data)
    custom_fields = models.JSONField(default=dict, blank=True)
    
    # Status
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


class AdmissionFormConfig(TenantAwareModel):
    """
    Configuration for student admission form fields per school.
    Allows schools to customize which fields are visible/required.
    """
    FIELD_TYPE_CHOICES = [
        ('text', 'Text'),
        ('email', 'Email'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('select', 'Select'),
        ('textarea', 'Textarea'),
        ('file', 'File'),
        ('image', 'Image'),
        ('checkbox', 'Checkbox'),
        ('decimal', 'Decimal'),
    ]
    
    SECTION_CHOICES = [
        ('basic', 'Basic Information'),
        ('personal', 'Personal Information'),
        ('contact', 'Contact Information'),
        ('emergency', 'Emergency Contact'),
        ('medical', 'Medical Information'),
        ('academic', 'Academic Information'),
        ('documents', 'Documents'),
        ('transport', 'Transport'),
        ('hostel', 'Hostel'),
        ('parent', 'Parent Information'),
    ]
    
    field_name = models.CharField(max_length=100, help_text="Internal field name (e.g., 'middle_name', 'religion')")
    field_label = models.CharField(max_length=200, help_text="Display label for the field")
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    section = models.CharField(max_length=50, choices=SECTION_CHOICES, default='basic')
    is_visible = models.BooleanField(default=True, help_text="Show this field in the form")
    is_required = models.BooleanField(default=False, help_text="Make this field mandatory")
    display_order = models.IntegerField(default=0, help_text="Order within section (lower = first)")
    help_text = models.CharField(max_length=500, blank=True)
    placeholder = models.CharField(max_length=200, blank=True)
    options = models.JSONField(default=list, blank=True, help_text="For select/radio fields: [{\"value\": \"male\", \"label\": \"Male\"}]")
    validation_rules = models.JSONField(default=dict, blank=True, help_text="Additional validation rules")
    
    class Meta:
        db_table = 'admission_form_configs'
        verbose_name = 'Admission Form Configuration'
        verbose_name_plural = 'Admission Form Configurations'
        unique_together = [('school', 'field_name')]
        ordering = ['section', 'display_order', 'field_name']
        indexes = [
            models.Index(fields=['school', 'section']),
            models.Index(fields=['school', 'is_visible']),
        ]
    
    def __str__(self):
        return f"{self.field_label} ({self.school.name})"
