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

from rest_framework import viewsets, permissions
from .models import Event, NotificationSubscription
from .serializers import EventSerializer, NotificationSubscriptionSerializer
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied

class EventViewSet(TenantMixin, viewsets.ModelViewSet):
    """
    ViewSet for scheduling and viewing events.
    Enforces role-based visibility and creation logic.
    """
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        school = user.school
        
        if not school:
            return Event.objects.none()

        queryset = Event.objects.filter(school=school, is_active=True)

        if user.role in ['admin', 'super_admin']:
            return queryset
        
        elif user.role == 'teacher':
            # Teachers see: Global + Staff + Any class targeted events
            return queryset.filter(
                Q(audience='global') | 
                Q(audience='staff') | 
                Q(audience='class')
            )
        
        else:
            # Students/Parents see: Global + Class specific
            return queryset.filter(
                Q(audience='global') | 
                Q(audience='class')
            )

    def perform_create(self, serializer):
        user = self.request.user
        audience = serializer.validated_data.get('audience', 'global')
        
        if audience in ['global', 'staff'] and user.role not in ['admin', 'super_admin']:
            raise PermissionDenied("Only admins can create global or staff-only events.")
        
        serializer.save(created_by=user, school=user.school)


class NotificationSubscriptionViewSet(TenantMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing push notification tokens.
    """
    serializer_class = NotificationSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NotificationSubscription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, school=self.request.user.school)
