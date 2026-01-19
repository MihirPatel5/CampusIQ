"""
Tenant middleware for automatic tenant context injection.
Sets the current tenant (school) based on the authenticated user.
"""
from .tenant import TenantContext


class TenantMiddleware:
    """
    Middleware to set tenant context for each request.
    Extracts school from authenticated user and sets in thread-local storage.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        """
        Process request and set tenant context.
        
        Flow:
        1. Check if user is authenticated
        2. If super admin, set tenant to None (access all schools)
        3. If regular user, set tenant to user's school
        4. Process request with tenant context
        5. Clear tenant context after response
        """
        # Clear any existing tenant context
        TenantContext.clear_tenant()
        
        # Set tenant from authenticated user
        print(f"DEBUG: TenantMiddleware - User: {request.user}, Authenticated: {request.user.is_authenticated}")
        if request.user and request.user.is_authenticated:
            # Check if super admin
            if hasattr(request.user, 'is_super_admin') and request.user.is_super_admin():
                # Super admin: no tenant restriction
                TenantContext.set_current_tenant(None)
            elif hasattr(request.user, 'school'):
                # Regular user: set their school as tenant
                TenantContext.set_current_tenant(request.user.school)
        
        # Process request
        response = self.get_response(request)
        
        # Clear tenant context after request
        TenantContext.clear_tenant()
        
        return response
