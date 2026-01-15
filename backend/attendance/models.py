from django.db import models
from core.models import TimeStampedModel


class Attendance(TimeStampedModel):
    """
    Daily attendance records
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
        unique_together = [('student', 'date')]
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['date']),
            models.Index(fields=['class_obj', 'section']),
            models.Index(fields=['date', 'class_obj', 'section']),
        ]
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.date} ({self.get_status_display()})"
