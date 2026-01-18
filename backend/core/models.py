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

