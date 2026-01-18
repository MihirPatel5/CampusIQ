"""
Tenant context management for multi-tenant architecture.
Provides thread-local storage for current tenant (school) context.
"""
import threading
from typing import Optional


class TenantContext:
    """
    Thread-local tenant context storage.
    Stores the current school (tenant) for the active request.
    """
    _thread_local = threading.local()
    
    @classmethod
    def get_current_tenant(cls) -> Optional['School']:
        """
        Get the current tenant (school) from thread-local storage.
        
        Returns:
            School instance or None if not set or super admin
        """
        return getattr(cls._thread_local, 'tenant', None)
    
    @classmethod
    def set_current_tenant(cls, school: Optional['School']) -> None:
        """
        Set the current tenant (school) in thread-local storage.
        
        Args:
            school: School instance or None for super admin
        """
        cls._thread_local.tenant = school
    
    @classmethod
    def clear_tenant(cls) -> None:
        """Clear the current tenant from thread-local storage."""
        if hasattr(cls._thread_local, 'tenant'):
            delattr(cls._thread_local, 'tenant')
    
    @classmethod
    def is_super_admin_context(cls) -> bool:
        """
        Check if current context is super admin (no tenant set).
        
        Returns:
            True if super admin context, False otherwise
        """
        return not hasattr(cls._thread_local, 'tenant') or cls._thread_local.tenant is None


class tenant_context:
    """
    Context manager for temporarily setting tenant context.
    
    Usage:
        with tenant_context(school):
            # Code here runs in school's tenant context
            students = Student.objects.all()  # Auto-filtered by school
    """
    
    def __init__(self, school: Optional['School']):
        self.school = school
        self.previous_tenant = None
    
    def __enter__(self):
        self.previous_tenant = TenantContext.get_current_tenant()
        TenantContext.set_current_tenant(self.school)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        TenantContext.set_current_tenant(self.previous_tenant)
        return False
