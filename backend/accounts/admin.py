from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, SchoolProfile, TeacherProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
        ('Audit Information', {'fields': ('created_by', 'updated_by', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )


@admin.register(SchoolProfile)
class SchoolProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'affiliation', 'school_verification_code')
    search_fields = ('name', 'email')
    readonly_fields = ('created_at', 'updated_at', 'school_verification_code')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'logo', 'affiliation', 'established_year')
        }),
        ('Contact Information', {
            'fields': ('address', 'phone', 'email', 'website')
        }),
        ('Registration', {
            'fields': ('school_verification_code',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one school profile
        return not SchoolProfile.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of school profile
        return False


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'employee_id', 'phone', 'status', 'self_registered', 'joining_date')
    list_filter = ('status', 'self_registered', 'joining_date')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'employee_id', 'phone')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('User Account', {
            'fields': ('user', 'employee_id')
        }),
        ('Personal Information', {
            'fields': ('phone', 'date_of_birth', 'address')
        }),
        ('Professional Information', {
            'fields': ('joining_date', 'qualification', 'specialization')
        }),
        ('Status', {
            'fields': ('status', 'self_registered', 'rejection_reason')
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_teachers', 'reject_teachers']
    
    def approve_teachers(self, request, queryset):
        queryset.update(status='active')
        self.message_user(request, f'{queryset.count()} teachers approved successfully.')
    approve_teachers.short_description = 'Approve selected teachers'
    
    def reject_teachers(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, f'{queryset.count()} teachers rejected.')
    reject_teachers.short_description = 'Reject selected teachers'
