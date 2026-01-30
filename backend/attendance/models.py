from django.db import models
from core.models import TenantAwareModel


class Attendance(TenantAwareModel):
    """
    Daily attendance records - Multi-tenant
    """
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('leave', 'Leave'),
    ]
    
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    class_obj = models.ForeignKey(
        'academic.Class',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    section = models.ForeignKey(
        'academic.Section',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    remarks = models.TextField(blank=True)
    marked_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='marked_attendance'
    )
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_attendance'
    )
    
    class Meta:
        db_table = 'attendance'
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance Records'
        unique_together = [('school', 'student', 'date')]
        indexes = [
            models.Index(fields=['school', 'student']),
            models.Index(fields=['school', 'date']),
            models.Index(fields=['school', 'class_obj', 'section']),
            models.Index(fields=['school', 'date', 'class_obj', 'section']),
        ]
        ordering = ['-date']
    
    def save(self, *args, **kwargs):
        """Auto-populate school from student's school"""
        if not self.school_id and self.student_id:
            self.school = self.student.school
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.date} ({self.get_status_display()}) - {self.school.name}"


class StaffAttendance(TenantAwareModel):
    """
    Daily attendance records for staff (Teachers, Admins) - Multi-tenant
    """
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('leave', 'Leave'),
    ]

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='staff_attendance_records'
    )
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    remarks = models.TextField(blank=True)
    marked_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='marked_staff_attendance'
    )

    class Meta:
        db_table = 'staff_attendance'
        verbose_name = 'Staff Attendance'
        verbose_name_plural = 'Staff Attendance Records'
        unique_together = [('school', 'user', 'date')]
        indexes = [
            models.Index(fields=['school', 'user']),
            models.Index(fields=['school', 'date']),
        ]
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.date} ({self.get_status_display()}) - {self.school.name}"
