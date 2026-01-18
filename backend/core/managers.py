"""
Tenant-aware database managers and querysets.
Automatically filters queries by current tenant (school) context.
"""
from django.db import models
from .tenant import TenantContext


class TenantQuerySet(models.QuerySet):
    """
    Custom queryset that automatically filters by current tenant.
    Provides methods for tenant-aware and cross-tenant queries.
    """
    
    def filter_by_tenant(self):
        """
        Filter queryset by current tenant.
        Returns all records if super admin context.
        """
        tenant = TenantContext.get_current_tenant()
        
        # Super admin sees all data
        if tenant is None:
            return self
        
        # Filter by current school
        return self.filter(school=tenant)
    
    def all_tenants(self):
        """
        Get records from all tenants.
        Only use this explicitly when cross-tenant access is needed.
        """
        return self.all()


class TenantManager(models.Manager):
    """
    Manager that automatically filters by current tenant.
    Override get_queryset to apply tenant filter by default.
    """
    
    def get_queryset(self):
        """
        Return queryset filtered by current tenant.
        Super admin context returns unfiltered queryset.
        """
        queryset = TenantQuerySet(self.model, using=self._db)
        tenant = TenantContext.get_current_tenant()
        
        # Super admin sees all data
        if tenant is None:
            return queryset
        
        # Filter by current school
        return queryset.filter(school=tenant)
    
    def all_tenants(self):
        """
        Explicitly get records from all tenants.
        Use this for super admin operations.
        """
        return TenantQuerySet(self.model, using=self._db)


class GlobalManager(models.Manager):
    """
    Manager that does NOT filter by tenant.
    Use this for models that are not tenant-specific.
    """
    
    def get_queryset(self):
        return models.QuerySet(self.model, using=self._db)
