from django.core.management.base import BaseCommand
from accounts.models import School
from students.models import AdmissionFormConfig


class Command(BaseCommand):
    help = 'Setup default admission form configuration for all schools'

    def add_arguments(self, parser):
        parser.add_argument(
            '--school-id',
            type=int,
            help='Setup for specific school ID only',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset existing configurations',
        )

    def handle(self, *args, **options):
        school_id = options.get('school_id')
        reset = options.get('reset', False)

        if school_id:
            schools = School.objects.filter(id=school_id)
            if not schools.exists():
                self.stdout.write(self.style.ERROR(f'School with ID {school_id} not found'))
                return
        else:
            schools = School.objects.all()

        total_created = 0
        total_updated = 0

        for school in schools:
            self.stdout.write(f'Processing school: {school.name}...')
            
            if reset:
                deleted_count = AdmissionFormConfig.objects.filter(school=school).delete()[0]
                self.stdout.write(self.style.WARNING(f'  Deleted {deleted_count} existing configurations'))

            created, updated = self.create_default_config(school)
            total_created += created
            total_updated += updated
            
            self.stdout.write(self.style.SUCCESS(f'  Created: {created}, Updated: {updated}'))

        self.stdout.write(self.style.SUCCESS(
            f'\nCompleted! Total created: {total_created}, Total updated: {total_updated}'
        ))

    def create_default_config(self, school):
        """Create default form configuration for a school"""
        created_count = 0
        updated_count = 0

        # Define default field configurations
        # Format: (field_name, field_label, field_type, section, is_visible, is_required, display_order, help_text, placeholder, options)
        default_fields = [
            # Basic Information (Required fields)
            ('first_name', 'First Name', 'text', 'basic', True, True, 1, '', 'Enter first name', []),
            ('middle_name', 'Middle Name', 'text', 'basic', True, False, 2, '', 'Enter middle name', []),
            ('last_name', 'Last Name', 'text', 'basic', True, True, 3, '', 'Enter last name', []),
            ('date_of_birth', 'Date of Birth', 'date', 'basic', True, True, 4, '', '', []),
            ('gender', 'Gender', 'select', 'basic', True, True, 5, '', 'Select gender', [
                {'value': 'male', 'label': 'Male'},
                {'value': 'female', 'label': 'Female'},
                {'value': 'other', 'label': 'Other'}
            ]),
            ('blood_group', 'Blood Group', 'select', 'basic', True, False, 6, '', 'Select blood group', [
                {'value': 'A+', 'label': 'A+'},
                {'value': 'A-', 'label': 'A-'},
                {'value': 'B+', 'label': 'B+'},
                {'value': 'B-', 'label': 'B-'},
                {'value': 'O+', 'label': 'O+'},
                {'value': 'O-', 'label': 'O-'},
                {'value': 'AB+', 'label': 'AB+'},
                {'value': 'AB-', 'label': 'AB-'}
            ]),
            ('photo', 'Student Photo', 'image', 'basic', True, False, 7, 'Upload passport size photo', '', []),
            
            # Personal Information
            ('nationality', 'Nationality', 'text', 'personal', True, False, 1, '', 'Indian', []),
            ('religion', 'Religion', 'text', 'personal', False, False, 2, '', 'Enter religion', []),
            ('category', 'Category', 'select', 'personal', True, False, 3, '', 'Select category', [
                {'value': 'general', 'label': 'General'},
                {'value': 'obc', 'label': 'OBC'},
                {'value': 'sc', 'label': 'SC'},
                {'value': 'st', 'label': 'ST'},
                {'value': 'other', 'label': 'Other'}
            ]),
            ('mother_tongue', 'Mother Tongue', 'text', 'personal', False, False, 4, '', 'Enter mother tongue', []),
            ('caste', 'Caste', 'text', 'personal', False, False, 5, '', 'Enter caste', []),
            ('aadhaar_number', 'Aadhaar Number', 'text', 'personal', True, False, 6, '12-digit Aadhaar number', 'Enter Aadhaar number', []),
            
            # Contact Information
            ('email', 'Email Address', 'email', 'contact', True, False, 1, 'Student email for login', 'student@example.com', []),
            ('phone', 'Phone Number', 'text', 'contact', True, True, 2, 'Primary contact number', 'Enter phone number', []),
            ('alternate_phone', 'Alternate Phone', 'text', 'contact', True, False, 3, '', 'Enter alternate number', []),
            ('address', 'Address', 'textarea', 'contact', True, True, 4, 'Complete residential address', 'Enter full address', []),
            ('city', 'City', 'text', 'contact', True, True, 5, '', 'Enter city', []),
            ('state', 'State', 'text', 'contact', True, True, 6, '', 'Enter state', []),
            ('pincode', 'Pincode', 'text', 'contact', True, True, 7, '', 'Enter pincode', []),
            
            # Emergency Contact
            ('emergency_contact_name', 'Emergency Contact Name', 'text', 'emergency', True, False, 1, '', 'Enter name', []),
            ('emergency_contact_phone', 'Emergency Contact Phone', 'text', 'emergency', True, False, 2, '', 'Enter phone', []),
            ('emergency_contact_relation', 'Relation', 'text', 'emergency', True, False, 3, '', 'e.g., Uncle, Aunt', []),
            
            # Medical Information
            ('height', 'Height (cm)', 'decimal', 'medical', False, False, 1, 'Height in centimeters', 'Enter height', []),
            ('weight', 'Weight (kg)', 'decimal', 'medical', False, False, 2, 'Weight in kilograms', 'Enter weight', []),
            ('medical_conditions', 'Medical Conditions', 'textarea', 'medical', False, False, 3, 'Any chronic conditions or disabilities', 'Enter medical conditions', []),
            ('allergies', 'Allergies', 'textarea', 'medical', False, False, 4, 'Food or medicine allergies', 'Enter allergies', []),
            ('vaccination_status', 'Vaccination Status', 'textarea', 'medical', False, False, 5, 'COVID-19 and other vaccinations', 'Enter vaccination details', []),
            
            # Academic Information
            ('admission_number', 'Admission Number', 'text', 'academic', True, True, 1, 'Unique admission number', 'Auto-generated', []),
            ('admission_date', 'Admission Date', 'date', 'academic', True, True, 2, '', '', []),
            ('roll_number', 'Roll Number', 'text', 'academic', True, False, 3, 'Can be assigned later', 'Enter roll number', []),
            ('class_obj', 'Class', 'select', 'academic', True, True, 4, 'Select class for admission', '', []),
            ('section', 'Section', 'select', 'academic', True, True, 5, 'Select section', '', []),
            ('previous_school', 'Previous School', 'text', 'academic', True, False, 6, '', 'Enter previous school name', []),
            ('previous_class', 'Previous Class', 'text', 'academic', True, False, 7, '', 'Enter previous class', []),
            ('previous_marks', 'Previous Marks (%)', 'decimal', 'academic', False, False, 8, 'Percentage in previous class', 'Enter percentage', []),
            ('tc_number', 'Transfer Certificate Number', 'text', 'academic', False, False, 9, '', 'Enter TC number', []),
            ('tc_date', 'TC Issue Date', 'date', 'academic', False, False, 10, '', '', []),
            
            # Documents
            ('birth_certificate', 'Birth Certificate', 'file', 'documents', False, False, 1, 'Upload birth certificate', '', []),
            ('transfer_certificate', 'Transfer Certificate', 'file', 'documents', False, False, 2, 'Upload TC from previous school', '', []),
            ('aadhar_card', 'Aadhaar Card', 'file', 'documents', False, False, 3, 'Upload Aadhaar card copy', '', []),
            ('caste_certificate', 'Caste Certificate', 'file', 'documents', False, False, 4, 'Upload caste certificate if applicable', '', []),
            
            # Transport
            ('transport_required', 'Transport Required', 'checkbox', 'transport', True, False, 1, 'Check if school transport is needed', '', []),
            ('bus_route', 'Bus Route', 'text', 'transport', False, False, 2, '', 'Enter bus route', []),
            ('pickup_point', 'Pickup Point', 'text', 'transport', False, False, 3, '', 'Enter pickup location', []),
            
            # Hostel
            ('hostel_required', 'Hostel Required', 'checkbox', 'hostel', False, False, 1, 'Check if hostel accommodation is needed', '', []),
            ('hostel_room_preference', 'Room Preference', 'text', 'hostel', False, False, 2, '', 'Single/Shared', []),
        ]

        for field_data in default_fields:
            field_name, field_label, field_type, section, is_visible, is_required, display_order, help_text, placeholder, options = field_data
            
            config, created = AdmissionFormConfig.objects.update_or_create(
                school=school,
                field_name=field_name,
                defaults={
                    'field_label': field_label,
                    'field_type': field_type,
                    'section': section,
                    'is_visible': is_visible,
                    'is_required': is_required,
                    'display_order': display_order,
                    'help_text': help_text,
                    'placeholder': placeholder,
                    'options': options,
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1

        return created_count, updated_count
