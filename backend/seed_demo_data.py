#!/usr/bin/env python
"""
Demo data seeding script for CampusIQ
Creates realistic test data for demos and development
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_erp.settings')
django.setup()

from accounts.models import School, User, TeacherProfile
from academic.models import Class, Section, Subject, SubjectAssignment
from students.models import StudentProfile
from datetime import date, timedelta
import random


def seed_demo_data():
    """Create comprehensive demo data for a school"""
    
    print("🌱 Seeding demo data...")
    
    # 1. Create Demo School
    school, created = School.objects.get_or_create(
        code='DEMO001',
        defaults={
            'name': 'Greenfield International School',
            'address': '123 Education Lane, Knowledge Park',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'pincode': '400001',
            'phone': '+91-22-12345678',
            'email': 'admin@greenfield.edu',
            'established_year': 2010,
            'affiliation': 'CBSE'
        }
    )
    
    if created:
        print(f"✓ Created school: {school.name}")
    else:
        print(f"✓ School already exists: {school.name}")
    
    # 2. Create Admin User
    admin, created = User.objects.get_or_create(
        username='demo_admin',
        defaults={
            'email': 'admin@greenfield.edu',
            'first_name': 'John',
            'last_name': 'Smith',
            'role': 'admin',
            'school': school,
            'is_active': True,
            'is_email_verified': True
        }
    )
    
    if created:
        admin.set_password('Demo@123')
        admin.save()
        print(f"✓ Created admin: {admin.username} (password: Demo@123)")
    else:
        print(f"✓ Admin already exists: {admin.username}")
    
    # 3. Create Classes (1-12)
    classes_created = 0
    for class_num in range(1, 13):
        class_obj, created = Class.objects.get_or_create(
            school=school,
            code=f'C{class_num}',
            academic_year='2024-25',
            defaults={
                'name': f'Class {class_num}',
                'status': 'active',
                'created_by': admin
            }
        )
        if created:
            classes_created += 1
    
    total_classes = Class.objects.filter(school=school).count()
    print(f"✓ Classes: {total_classes} total ({classes_created} newly created)")
    
    # 4. Create Sections (A, B for each class)
    sections_created = 0
    for class_obj in Class.objects.filter(school=school):
        for section_name in ['A', 'B']:
            section, created = Section.objects.get_or_create(
                school=school,
                class_obj=class_obj,
                code=f'{class_obj.code}-{section_name}',
                defaults={
                    'name': section_name,
                    'capacity': 40,
                    'room_number': f'{class_obj.code[-2:]}{section_name}',
                    'status': 'active',
                    'created_by': admin
                }
            )
            if created:
                sections_created += 1
    
    total_sections = Section.objects.filter(school=school).count()
    print(f"✓ Sections: {total_sections} total ({sections_created} newly created)")
    
    # 5. Create Subjects
    subjects_data = [
        ('MATH', 'Mathematics', 'core', 100),
        ('ENG', 'English', 'core', 100),
        ('SCI', 'Science', 'core', 100),
        ('SST', 'Social Studies', 'core', 100),
        ('COMP', 'Computer Science', 'elective', 100),
        ('ART', 'Art & Craft', 'optional', 50),
    ]
    
    subjects_created = 0
    for code, name, subject_type, max_marks in subjects_data:
        subject, created = Subject.objects.get_or_create(
            school=school,
            code=code,
            defaults={
                'name': name,
                'type': subject_type,
                'max_marks': max_marks,
                'status': 'active',
                'created_by': admin
            }
        )
        if created:
            subjects_created += 1
    
    total_subjects = Subject.objects.filter(school=school).count()
    print(f"✓ Subjects: {total_subjects} total ({subjects_created} newly created)")
    
    # 6. Create Teachers
    teachers_created = 0
    teacher_first_names = ['Rajesh', 'Suman', 'Vikram', 'Pooja', 'Amit', 'Neha', 'Sanjay', 'Meena', 'Deepak', 'Kavita']
    teacher_last_names = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Joshi', 'Reddy', 'Rao', 'Mehta', 'Kumar']
    
    teachers = []
    for i in range(10):
        username = f'teacher{i+1}'
        first_name = teacher_first_names[i]
        last_name = teacher_last_names[i]
        
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f'{username}@{school.code.lower()}.edu',
                'first_name': first_name,
                'last_name': last_name,
                'role': 'teacher',
                'school': school,
                'is_active': True,
                'is_email_verified': True
            }
        )
        
        if created:
            user.set_password('Teacher@123')
            user.save()
            
        teacher, created = TeacherProfile.objects.get_or_create(
            user=user,
            defaults={
                'phone': f'+91-987654321{i}',
                'joining_date': date(2023, 1, 1),
                'qualification': 'MA, B.Ed',
                'specialization': random.choice(['Mathematics', 'Science', 'English', 'Social Studies']),
                'status': 'active'
            }
        )
        if created:
            teachers_created += 1
        teachers.append(teacher)
        
    total_teachers = TeacherProfile.objects.filter(user__school=school).count()
    print(f"✓ Teachers: {total_teachers} total ({teachers_created} newly created)")

    # 7. Assign Class Teachers and Subject Assignments
    assignments_created = 0
    all_subjects = list(Subject.objects.filter(school=school))
    all_sections = list(Section.objects.filter(school=school))
    
    # Assign class teachers to some sections
    for i, section in enumerate(all_sections[:10]):
        if i < len(teachers):
            section.class_teacher = teachers[i]
            section.save()

    # Create Subject Assignments
    for section in all_sections[:5]: # Assign subjects for first 5 sections to keep it manageable
        for subject in all_subjects:
            teacher = random.choice(teachers)
            assignment, created = SubjectAssignment.objects.get_or_create(
                school=school,
                class_obj=section.class_obj,
                section=section,
                subject=subject,
                academic_year='2024-25',
                defaults={
                    'teacher': teacher,
                    'status': 'active'
                }
            )
            if created:
                assignments_created += 1
                
    print(f"✓ Subject Assignments: {assignments_created} newly created")

    # 8. Create Sample Students
    students_created = 0
    first_names = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Ananya', 'Diya', 'Isha', 'Priya', 'Riya']
    last_names = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Verma', 'Joshi', 'Rao', 'Mehta']
    
    # Create 5 students per section for first 5 classes
    student_counter = 0
    for class_obj in Class.objects.filter(school=school, code__in=['C1', 'C2', 'C3', 'C4', 'C5']):
        for section in class_obj.sections.filter(school=school):
            for i in range(5):
                student_counter += 1
                admission_num = f'{school.code}{class_obj.code}{section.code}{i+1:03d}'
                
                # Generate unique phone number
                phone_number = f'+91-{9000000000 + student_counter}'
                email = f'student{student_counter}@{school.code.lower()}.edu'
                
                student, created = StudentProfile.objects.get_or_create(
                    school=school,
                    admission_number=admission_num,
                    defaults={
                        'first_name': random.choice(first_names),
                        'last_name': random.choice(last_names),
                        'date_of_birth': date(2010 + int(class_obj.code[1:]), random.randint(1, 12), random.randint(1, 28)),
                        'gender': random.choice(['male', 'female']),
                        'admission_date': date(2024, 4, 1),
                        'class_obj': class_obj,
                        'section': section,
                        'phone': phone_number,
                        'email': email,
                        'address': f'{random.randint(1, 999)} Street, {school.city}',
                        'city': school.city,
                        'state': school.state,
                        'pincode': school.pincode,
                        'status': 'active',
                        'created_by': admin
                    }
                )
                if created:
                    students_created += 1
    
    total_students = StudentProfile.objects.filter(school=school).count()
    print(f"✓ Students: {total_students} total ({students_created} newly created)")
    
    print("\n✅ Demo data seeding complete!")
    print(f"\n📋 Demo Credentials:")
    print(f"   URL: http://localhost:3000/login")
    print(f"   Username: demo_admin")
    print(f"   Password: Demo@123")
    print(f"\n🏫 School: {school.name}")
    print(f"   Code: {school.code}")
    print(f"   Verification Code: {school.school_verification_code}")


if __name__ == '__main__':
    seed_demo_data()
