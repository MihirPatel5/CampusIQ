from django.db import models
from django.conf import settings


class TimeStampedModel(models.Model):
    """
    Abstract base model with created_at and updated_at timestamps
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditModel(TimeStampedModel):
    """
    Abstract base model with audit fields (created_by, updated_by)
    """
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_created"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_updated"
    )

    class Meta:
        abstract = True


class TenantAwareModel(AuditModel):
    """
    Abstract base model for tenant-aware models.
    Automatically includes school field and tenant manager.
    """
    from .managers import TenantManager
    
    school = models.ForeignKey(
        'accounts.School',
        on_delete=models.CASCADE,
        null=True,  # Temporarily nullable for migration
        blank=True,
        related_name='%(app_label)s_%(class)s_set',
        help_text="School this record belongs to"
    )
    
    # Default manager with tenant filtering
    objects = TenantManager()
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['school']),
        ]
    
    def save(self, *args, **kwargs):
        """Auto-populate school from tenant context if not set"""
        from .tenant import TenantContext
        
        if not self.school_id and not TenantContext.is_super_admin_context():
            tenant = TenantContext.get_current_tenant()
            if tenant:
                self.school = tenant
        
        super().save(*args, **kwargs)
    
    def clean(self):
        """Validate school is set"""
        from django.core.exceptions import ValidationError
        
        if not self.school_id:
            raise ValidationError("School is required for this record")
        
        super().clean()


class Event(TenantAwareModel):
    """
    School events, holidays, and meetings.
    Supports targeted visibility for specific roles or classes.
    """
    AUDIENCE_CHOICES = [
        ('global', 'Global (Everyone)'),
        ('staff', 'Staff Only'),
        ('class', 'Specific Class/Section'),
    ]

    TYPE_CHOICES = [
        ('holiday', 'Holiday'),
        ('meeting', 'Meeting'),
        ('exam', 'Exam'),
        ('celebration', 'Celebration'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='other')
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default='global')
    
    # Target fields for CLASS_SPECIFIC audience
    target_class = models.ForeignKey(
        'academic.Class',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='events'
    )
    target_section = models.ForeignKey(
        'academic.Section',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='events'
    )

    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'events'
        ordering = ['-start_datetime']
        indexes = [
            models.Index(fields=['school', 'audience']),
            models.Index(fields=['start_datetime']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_event_type_display()}) - {self.school.name}"


class NotificationSubscription(TenantAwareModel):
    """
    Stores push notification tokens/subscriptions for users.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_subscriptions'
    )
    endpoint = models.TextField(help_text="Push service endpoint or FCM token")
    p256dh = models.CharField(max_length=255, null=True, blank=True, help_text="Web Push p256dh key")
    auth = models.CharField(max_length=255, null=True, blank=True, help_text="Web Push auth key")
    browser = models.CharField(max_length=50, blank=True)
    device_type = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'notification_subscriptions'
        unique_together = [('user', 'endpoint')]

    def __str__(self):
        return f"{self.user.username} - {self.browser or 'Device'}"
