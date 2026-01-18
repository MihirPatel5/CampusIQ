from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, School, TeacherProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'school', 'is_active', 'is_staff')
    list_filter = ('role', 'school', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & School Information', {'fields': ('role', 'school')}),
        ('Audit Information', {'fields': ('created_by', 'updated_by', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role & School Information', {'fields': ('role', 'school')}),
    )


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'city', 'status', 'email', 'phone', 'school_verification_code')
    list_filter = ('status', 'city', 'state')
    search_fields = ('name', 'code', 'email', 'city')
    readonly_fields = ('created_at', 'updated_at', 'school_verification_code', 'code')
    ordering = ('name',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'logo', 'affiliation', 'established_year', 'status')
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'pincode')
        }),
        ('Contact Information', {
            'fields': ('phone', 'email', 'website')
        }),
        ('Registration', {
            'fields': ('school_verification_code',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_school', 'employee_id', 'phone', 'status', 'self_registered', 'joining_date')
    list_filter = ('status', 'self_registered', 'user__school', 'joining_date')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'employee_id', 'phone')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 'transfer_history')
    
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
        ('School Transfer', {
            'fields': ('transfer_requested_to', 'transfer_request_date', 'transfer_approved_by', 'transfer_history'),
            'classes': ('collapse',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def get_school(self, obj):
        return obj.user.school.name if obj.user.school else 'No School'
    get_school.short_description = 'School'
    get_school.admin_order_field = 'user__school'
    
    actions = ['approve_teachers', 'reject_teachers']
    
    def approve_teachers(self, request, queryset):
        queryset.update(status='active')
        self.message_user(request, f'{queryset.count()} teachers approved successfully.')
    approve_teachers.short_description = 'Approve selected teachers'
    
    def reject_teachers(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, f'{queryset.count()} teachers rejected.')
    reject_teachers.short_description = 'Reject selected teachers'
