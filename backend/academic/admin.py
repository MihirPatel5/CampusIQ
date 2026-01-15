from django.contrib import admin
from .models import Class, Section, Subject, SubjectAssignment


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'academic_year', 'status', 'created_at')
    list_filter = ('academic_year', 'status')
    search_fields = ('name', 'code')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('class_obj', 'name', 'code', 'capacity', 'room_number', 'status')
    list_filter = ('class_obj', 'status')
    search_fields = ('name', 'code', 'room_number')
    ordering = ('class_obj', 'code')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'type', 'max_marks', 'status')
    list_filter = ('type', 'status')
    search_fields = ('name', 'code')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


@admin.register(SubjectAssignment)
class SubjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ('subject', 'class_obj', 'section', 'teacher', 'academic_year', 'status')
    list_filter = ('academic_year', 'status', 'subject')
    search_fields = ('subject__name', 'teacher__user__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "teacher":
            # Only show active teachers in dropdown
            kwargs["queryset"] = db_field.related_model.objects.filter(status='active')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
