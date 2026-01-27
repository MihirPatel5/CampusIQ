from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """Permission class for super admin only"""
    message = "Only super admins can access this resource."
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_super_admin()


class HasSchool(permissions.BasePermission):
    """
    Permission class ensuring user is associated with a school.
    Super admins are exempt from this requirement.
    """
    message = "You must create or be associated with a school to access this resource."
    
    def has_permission(self, request, view):
        # Super admins don't need a school
        if request.user.is_super_admin():
            return True
        
        # All other users must have a school
        return request.user.school is not None


class IsAdmin(permissions.BasePermission):
    """Permission class for school-level admin access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['super_admin', 'admin']


class IsTeacher(permissions.BasePermission):
    """Permission class for teacher-only access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'teacher'


class IsStudent(permissions.BasePermission):
    """Permission class for student-only access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'student'


class IsParent(permissions.BasePermission):
    """Permission class for parent-only access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'parent'


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow admins to edit, others can only read"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsActiveTeacher(permissions.BasePermission):
    """Permission class for active and verified teachers only"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.role == 'teacher'):
            return False
        
        try:
            teacher_profile = request.user.teacher_profile
            return teacher_profile.status == 'active'
        except:
            return False
    
    message = "Only active and verified teachers can access this resource"


    def has_object_permission(self, request, view, obj):
        # Super admin can access anything
        if request.user.role == 'super_admin':
            return True
            
        # Admin can access data within their school
        if request.user.role == 'admin':
            if hasattr(obj, 'school'):
                return obj.school == request.user.school
            if hasattr(obj, 'user') and hasattr(obj.user, 'school'):
                return obj.user.school == request.user.school
            return True # Fallback for non-tenant objects or the user itself
        
        # Check if object has a user field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Check if object is the user itself
        return obj == request.user
