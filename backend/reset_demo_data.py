#!/usr/bin/env python
"""
Reset demo data script for CampusIQ
Clears all data for the demo school to start fresh
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_erp.settings')
django.setup()

from accounts.models import School, User
from academic.models import Class, Section, Subject
from students.models import StudentProfile
from attendance.models import Attendance
from fees.models import FeeStructure, Invoice, Payment
from exams.models import Exam, ExamResult


def reset_demo_data():
    """Reset all data for demo school"""
    
    print("🔄 Resetting demo data...")
    
    demo_school_code = 'DEMO001'
    
    try:
        school = School.objects.get(code=demo_school_code)
        
        # Delete all related data
        print("  Deleting students...")
        StudentProfile.objects.filter(school=school).delete()
        
        print("  Deleting sections...")
        Section.objects.filter(school=school).delete()
        
        print("  Deleting classes...")
        Class.objects.filter(school=school).delete()
        
        print("  Deleting subjects...")
        Subject.objects.filter(school=school).delete()
        
        print("  Deleting attendance...")
        Attendance.objects.filter(school=school).delete()
        
        print("  Deleting fees...")
        FeeStructure.objects.filter(school=school).delete()
        Invoice.objects.filter(school=school).delete()
        
        print("  Deleting exams...")
        Exam.objects.filter(school=school).delete()
        
        print("  Deleting users (except admin)...")
        User.objects.filter(school=school).exclude(username='demo_admin').delete()
        
        print("\n✅ Demo data reset complete!")
        print("\nRun: python seed_demo_data.py to recreate fresh demo data")
        
    except School.DoesNotExist:
        print(f"❌ Demo school (code: {demo_school_code}) not found!")
        print("Run: python seed_demo_data.py first")


if __name__ == '__main__':
    reset_demo_data()
