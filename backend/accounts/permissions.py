from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Permission class for admin-only access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


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


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow owners to access their own data, or admins to access any data"""
    
    def has_object_permission(self, request, view, obj):
        # Admin can access anything
        if request.user.role == 'admin':
            return True
        
        # Check if object has a user field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Check if object is the user itself
        return obj == request.user
