"""
Demo Data Creation Script for CampusIQ
Creates realistic demo data for client presentation
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import random

from accounts.models import School, TeacherProfile
from academic.models import Class, Section, Subject, SubjectAssignment
from students.models import StudentProfile, ParentProfile, AdmissionFormConfig
from attendance.models import Attendance
from fees.models import FeeStructure, FeeItem, Invoice, Payment
from exams.models import Exam, ExamResult

User = get_user_model()


class Command(BaseCommand):
    help = 'Create demo data for client presentation'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing demo data before creating new',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('Resetting demo data...'))
            self.reset_demo_data()

        self.stdout.write(self.style.SUCCESS('Creating demo data...'))
        
        # Create demo schools
        schools = self.create_schools()
        
        for school in schools:
            self.stdout.write(f'\nPopulating {school.name}...')
            
            # Setup admission form config
            self.setup_admission_form(school)
            
            # Create subjects
            subjects = self.create_subjects(school)
            
            # Create classes and sections
            classes_data = self.create_classes_and_sections(school)
            
            # Create teachers
            teachers = self.create_teachers(school, subjects)
            
            # Assign class teachers
            self.assign_class_teachers(classes_data, teachers)
            
            # Create students
            students = self.create_students(school, classes_data)
            
            # Create attendance records
            self.create_attendance(school, students, teachers)
            
            # Create fee structures and invoices
            self.create_fees(school, classes_data, students)
            
            # Create exams and results
            self.create_exams(school, classes_data, subjects, students)
        
        self.stdout.write(self.style.SUCCESS('\n✅ Demo data created successfully!'))
        self.print_summary(schools)

    def reset_demo_data(self):
        """Delete demo schools and related data"""
        demo_schools = School.objects.filter(name__startswith='Demo ')
        count = demo_schools.count()
        demo_schools.delete()
        self.stdout.write(f'Deleted {count} demo schools and related data')

    def create_schools(self):
        """Create 3 demo schools with different profiles"""
        schools_data = [
            {
                'name': 'Demo International School',
                'address': '123 Education Street, Mumbai',
                'phone': '022-12345678',
                'email': 'admin@demointernational.edu',
                'verification_code': 'DEMO001',
                'admin_email': 'admin1@demo.com',
                'admin_name': 'Rajesh Kumar',
            },
            {
                'name': 'Demo Public School',
                'address': '456 Learning Avenue, Delhi',
                'phone': '011-87654321',
                'email': 'admin@demopublic.edu',
                'verification_code': 'DEMO002',
                'admin_email': 'admin2@demo.com',
                'admin_name': 'Priya Sharma',
            },
            {
                'name': 'Demo Convent School',
                'address': '789 Knowledge Road, Bangalore',
                'phone': '080-11223344',
                'email': 'admin@democonvent.edu',
                'verification_code': 'DEMO003',
                'admin_email': 'admin3@demo.com',
                'admin_name': 'Michael D\'Souza',
            },
        ]
        
        schools = []
        for data in schools_data:
            # Create admin user
            admin_user, created = User.objects.get_or_create(
                username=data['admin_email'],
                defaults={
                    'email': data['admin_email'],
                    'first_name': data['admin_name'].split()[0],
                    'last_name': ' '.join(data['admin_name'].split()[1:]),
                    'role': 'school_admin',
                    'is_active': True,
                    'is_email_verified': True,
                }
            )
            if created:
                admin_user.set_password('demo123')
                admin_user.save()
            
            # Create school
            school, created = School.objects.get_or_create(
                name=data['name'],
                defaults={
                    'address': data['address'],
                    'phone': data['phone'],
                    'email': data['email'],
                    'school_verification_code': data['verification_code'],
                    'status': 'active',
                }
            )
            
            admin_user.school = school
            admin_user.save()
            
            schools.append(school)
            self.stdout.write(f'  ✓ Created {school.name}')
        
        return schools

    def setup_admission_form(self, school):
        """Setup admission form configuration"""
        from django.core.management import call_command
        call_command('setup_admission_form', school_id=school.id)
        self.stdout.write('  ✓ Configured admission form')

    def create_subjects(self, school):
        """Create subjects for the school"""
        subjects_data = [
            {'name': 'Mathematics', 'code': 'MATH', 'type': 'core', 'max_marks': 100},
            {'name': 'Science', 'code': 'SCI', 'type': 'core', 'max_marks': 100},
            {'name': 'English', 'code': 'ENG', 'type': 'core', 'max_marks': 100},
            {'name': 'Social Studies', 'code': 'SST', 'type': 'core', 'max_marks': 100},
            {'name': 'Hindi', 'code': 'HIN', 'type': 'core', 'max_marks': 100},
            {'name': 'Computer Science', 'code': 'CS', 'type': 'elective', 'max_marks': 100},
            {'name': 'Physical Education', 'code': 'PE', 'type': 'optional', 'max_marks': 50},
            {'name': 'Art', 'code': 'ART', 'type': 'optional', 'max_marks': 50},
        ]
        
        subjects = []
        for data in subjects_data:
            subject, _ = Subject.objects.get_or_create(
                school=school,
                code=data['code'],
                defaults=data
            )
            subjects.append(subject)
        
        self.stdout.write(f'  ✓ Created {len(subjects)} subjects')
        return subjects

    def create_classes_and_sections(self, school):
        """Create classes with sections"""
        current_year = timezone.now().year
        classes_data = []
        
        for grade in range(1, 11):  # Classes 1-10
            class_obj, _ = Class.objects.get_or_create(
                school=school,
                name=f'Class {grade}',
                defaults={
                    'code': f'CLS{grade}',
                    'academic_year': f'{current_year}-{current_year+1}',
                    'status': 'active',
                }
            )
            
            sections = []
            # Classes 1-5: 2 sections, 6-10: 3 sections
            num_sections = 2 if grade <= 5 else 3
            for section_name in ['A', 'B', 'C'][:num_sections]:
                section, _ = Section.objects.get_or_create(
                    school=school,
                    class_obj=class_obj,
                    name=section_name,
                    defaults={
                        'code': f'{class_obj.code}-{section_name}',
                        'capacity': 40,
                        'room_number': f'{grade}{ord(section_name)}',
                        'status': 'active',
                    }
                )
                sections.append(section)
            
            classes_data.append({
                'class': class_obj,
                'sections': sections
            })
        
        self.stdout.write(f'  ✓ Created {len(classes_data)} classes with sections')
        return classes_data

    def create_teachers(self, school, subjects):
        """Create teachers with subject assignments"""
        teachers_data = [
            {'name': 'Amit Patel', 'subjects': ['MATH', 'CS'], 'qualification': 'M.Sc Mathematics'},
            {'name': 'Sunita Reddy', 'subjects': ['SCI'], 'qualification': 'M.Sc Physics'},
            {'name': 'Rahul Verma', 'subjects': ['ENG'], 'qualification': 'M.A English'},
            {'name': 'Kavita Singh', 'subjects': ['SST'], 'qualification': 'M.A History'},
            {'name': 'Deepak Joshi', 'subjects': ['HIN'], 'qualification': 'M.A Hindi'},
            {'name': 'Neha Gupta', 'subjects': ['CS'], 'qualification': 'B.Tech Computer Science'},
            {'name': 'Vikram Rao', 'subjects': ['PE'], 'qualification': 'B.P.Ed'},
            {'name': 'Anjali Mehta', 'subjects': ['ART'], 'qualification': 'B.F.A'},
        ]
        
        teachers = []
        for i, data in enumerate(teachers_data, 1):
            # Create user
            username = f"teacher{i}_{school.id}@demo.com"
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': username,
                    'first_name': data['name'].split()[0],
                    'last_name': ' '.join(data['name'].split()[1:]),
                    'role': 'teacher',
                    'school': school,
                    'is_active': True,
                }
            )
            if created:
                user.set_password('demo123')
                user.save()
            
            # Create teacher profile
            teacher, created = TeacherProfile.objects.get_or_create(
                user=user,
                defaults={
                    'school': school,
                    'employee_id': f'T{school.id}{i:03d}',
                    'phone': f'98765{i:05d}',
                    'address': f'{i} Teacher Colony, City',
                    'qualification': data['qualification'],
                    'joining_date': timezone.now().date() - timedelta(days=random.randint(365, 1825)),
                    'status': 'active',
                    'self_registered': False,
                }
            )
            
            # Assign subjects
            if created:
                subject_objs = Subject.objects.filter(school=school, code__in=data['subjects'])
                teacher.subjects.set(subject_objs)
            
            teachers.append(teacher)
        
        self.stdout.write(f'  ✓ Created {len(teachers)} teachers')
        return teachers

    def assign_class_teachers(self, classes_data, teachers):
        """Assign class teachers to sections"""
        teacher_idx = 0
        for class_data in classes_data:
            for section in class_data['sections']:
                section.class_teacher = teachers[teacher_idx % len(teachers)]
                section.save()
                teacher_idx += 1
        
        self.stdout.write('  ✓ Assigned class teachers')

    def create_students(self, school, classes_data):
        """Create students with parents"""
        students = []
        first_names = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Aadhya', 'Ananya', 'Diya', 'Isha', 'Kavya']
        last_names = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Verma', 'Joshi', 'Mehta', 'Rao']
        
        student_count = 0
        for class_data in classes_data[:5]:  # Only populate first 5 classes for demo
            for section in class_data['sections']:
                # 10-15 students per section
                num_students = random.randint(10, 15)
                
                for i in range(num_students):
                    student_count += 1
                    first_name = random.choice(first_names)
                    last_name = random.choice(last_names)
                    
                    # Create user (optional)
                    email = f'student{student_count}_{school.id}@demo.com'
                    user, _ = User.objects.get_or_create(
                        username=email,
                        defaults={
                            'email': email,
                            'first_name': first_name,
                            'last_name': last_name,
                            'role': 'student',
                            'school': school,
                            'is_active': True,
                        }
                    )
                    user.set_password('demo123')
                    user.save()
                    
                    # Create student
                    student, created = StudentProfile.objects.get_or_create(
                        school=school,
                        admission_number=f'S{school.id}{student_count:04d}',
                        defaults={
                            'user': user,
                            'first_name': first_name,
                            'last_name': last_name,
                            'date_of_birth': datetime(2010 + random.randint(0, 5), random.randint(1, 12), random.randint(1, 28)),
                            'gender': random.choice(['male', 'female']),
                            'blood_group': random.choice(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']),
                            'email': email,
                            'phone': f'98765{student_count:05d}',
                            'address': f'{student_count} Student Street',
                            'city': 'Demo City',
                            'state': 'Demo State',
                            'pincode': '123456',
                            'admission_date': timezone.now().date() - timedelta(days=random.randint(30, 365)),
                            'class_obj': class_data['class'],
                            'section': section,
                            'status': 'active',
                        }
                    )
                    
                    # Create parents
                    if created:
                        for relation in ['father', 'mother']:
                            ParentProfile.objects.create(
                                school=school,
                                student=student,
                                relation=relation,
                                name=f'{last_name} {relation.title()}',
                                phone=f'98765{student_count:05d}',
                                email=f'{relation}_{student_count}_{school.id}@demo.com',
                                occupation=random.choice(['Engineer', 'Doctor', 'Teacher', 'Business']),
                                is_primary=(relation == 'father'),
                            )
                    
                    students.append(student)
        
        self.stdout.write(f'  ✓ Created {len(students)} students with parents')
        return students

    def create_attendance(self, school, students, teachers):
        """Create attendance records for last 30 days"""
        if not students:
            return
        
        teacher = teachers[0] if teachers else None
        today = timezone.now().date()
        
        # Create attendance for last 30 days
        for days_ago in range(30):
            date = today - timedelta(days=days_ago)
            
            for student in students[:50]:  # Limit to first 50 students
                status = random.choices(
                    ['present', 'absent', 'late'],
                    weights=[85, 10, 5]
                )[0]
                
                Attendance.objects.get_or_create(
                    school=school,
                    student=student,
                    date=date,
                    defaults={
                        'status': status,
                        'marked_by': teacher.user if teacher else None,
                    }
                )
        
        self.stdout.write('  ✓ Created attendance records')

    def create_fees(self, school, classes_data, students):
        """Create fee structures and invoices"""
        if not students:
            return
        
        current_year = timezone.now().year
        
        for class_data in classes_data[:5]:
            # Create fee structure
            fee_structure, created = FeeStructure.objects.get_or_create(
                school=school,
                name=f'{class_data["class"].name} Fee Structure',
                defaults={
                    'academic_year': f'{current_year}-{current_year+1}',
                    'class_obj': class_data['class'],
                    'total_amount': Decimal('50000.00'),
                    'status': 'active',
                }
            )
            
            if created:
                # Create fee items
                FeeItem.objects.create(
                    fee_structure=fee_structure,
                    name='Tuition Fee',
                    amount=Decimal('30000.00'),
                    due_date=timezone.now().date() + timedelta(days=30),
                )
                FeeItem.objects.create(
                    fee_structure=fee_structure,
                    name='Transport Fee',
                    amount=Decimal('10000.00'),
                    due_date=timezone.now().date() + timedelta(days=30),
                )
                FeeItem.objects.create(
                    fee_structure=fee_structure,
                    name='Library Fee',
                    amount=Decimal('5000.00'),
                    due_date=timezone.now().date() + timedelta(days=30),
                )
                FeeItem.objects.create(
                    fee_structure=fee_structure,
                    name='Lab Fee',
                    amount=Decimal('5000.00'),
                    due_date=timezone.now().date() + timedelta(days=30),
                )
            
            # Create invoices for students
            class_students = [s for s in students if s.class_obj == class_data['class']]
            for student in class_students[:10]:  # Limit to 10 per class
                invoice, created = Invoice.objects.get_or_create(
                    school=school,
                    student=student,
                    fee_structure=fee_structure,
                    defaults={
                        'invoice_number': f'INV{school.id}{student.id:04d}',
                        'total_amount': fee_structure.total_amount,
                        'paid_amount': Decimal('0.00'),
                        'due_date': timezone.now().date() + timedelta(days=30),
                        'status': 'pending',
                    }
                )
                
                # Some students have paid
                if created and random.random() > 0.5:
                    payment_amount = Decimal(random.choice(['50000.00', '25000.00', '10000.00']))
                    Payment.objects.create(
                        school=school,
                        invoice=invoice,
                        receipt_number=f'REC{school.id}{student.id:04d}',
                        amount=payment_amount,
                        payment_date=timezone.now().date(),
                        payment_mode=random.choice(['cash', 'online', 'upi']),
                    )
                    invoice.paid_amount = payment_amount
                    invoice.status = 'paid' if payment_amount >= fee_structure.total_amount else 'partial'
                    invoice.save()
        
        self.stdout.write('  ✓ Created fee structures and invoices')

    def create_exams(self, school, classes_data, subjects, students):
        """Create exams and results"""
        if not students:
            return
        
        current_year = timezone.now().year
        
        for class_data in classes_data[:5]:
            # Create exam
            exam, created = Exam.objects.get_or_create(
                school=school,
                name=f'{class_data["class"].name} Mid-term Exam',
                defaults={
                    'exam_type': 'mid_term',
                    'academic_year': f'{current_year}-{current_year+1}',
                    'class_obj': class_data['class'],
                    'start_date': timezone.now().date() - timedelta(days=15),
                    'end_date': timezone.now().date() - timedelta(days=10),
                    'status': 'completed',
                }
            )
            
            if created:
                # Create results for students
                class_students = [s for s in students if s.class_obj == class_data['class']]
                for student in class_students[:10]:
                    for subject in subjects[:5]:  # Core subjects only
                        ExamResult.objects.create(
                            school=school,
                            exam=exam,
                            student=student,
                            subject=subject,
                            marks_obtained=random.randint(60, 95),
                            max_marks=subject.max_marks,
                            grade=random.choice(['A', 'A+', 'B+', 'B']),
                        )
        
        self.stdout.write('  ✓ Created exams and results')

    def print_summary(self, schools):
        """Print summary of created data"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('DEMO DATA SUMMARY'))
        self.stdout.write('='*60)
        
        for school in schools:
            self.stdout.write(f'\n📚 {school.name}')
            self.stdout.write(f'   Admin: {school.admin.email} / demo123')
            self.stdout.write(f'   Verification Code: {school.verification_code}')
            self.stdout.write(f'   Teachers: {TeacherProfile.objects.filter(school=school).count()}')
            self.stdout.write(f'   Students: {StudentProfile.objects.filter(school=school).count()}')
            self.stdout.write(f'   Classes: {Class.objects.filter(school=school).count()}')
            self.stdout.write(f'   Subjects: {Subject.objects.filter(school=school).count()}')
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write('🎯 Login Credentials:')
        self.stdout.write('   All users: password = demo123')
        self.stdout.write('='*60 + '\n')
