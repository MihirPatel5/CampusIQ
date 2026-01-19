from rest_framework import viewsets
from core.tenant import TenantContext


class TenantMixin:
    """
    Mixin to set tenant context for DRF views.
    Sets the context in initial() which runs after authentication.
    """
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        
        # Clear any existing context
        TenantContext.clear_tenant()
        
        # Set tenant from authenticated user
        user = request.user
        print(f"DEBUG: TenantMixin - User: {user}, Auth: {user.is_authenticated}")
        if user and user.is_authenticated:
            if hasattr(user, 'is_super_admin') and user.is_super_admin():
                print("DEBUG: TenantMixin - Super Admin (No Tenant)")
                TenantContext.set_current_tenant(None)
            elif hasattr(user, 'school'):
                print(f"DEBUG: TenantMixin - Setting Tenant: {user.school}")
                TenantContext.set_current_tenant(user.school)
    
    def finalize_response(self, request, response, *args, **kwargs):
        # Clear context after request is processed
        TenantContext.clear_tenant()
        return super().finalize_response(request, response, *args, **kwargs)
