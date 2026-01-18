"""
Multi-Tenant ERP Setup Script
Creates default school and super admin user for testing
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_erp.settings')
django.setup()

from accounts.models import School, User

def create_initial_data():
    """Create initial school and super admin"""
    
    # Create default school
    print("\n=== Creating Default School ===")
    school, created = School.objects.get_or_create(
        code='MAIN',
        defaults={
            'name': 'Main School',
            'address': 'Main Campus, City Center',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'pincode': '400001',
            'email': 'main@school.com',
            'phone': '+91-22-12345678',
            'status': 'active'
        }
    )
    
    if created:
        print(f"✓ School created: {school.name}")
        print(f"  Code: {school.code}")
        print(f"  Verification Code: {school.school_verification_code}")
    else:
        print(f"✓ School already exists: {school.name}")
        print(f"  Verification Code: {school.school_verification_code}")
    
    # Create super admin
    print("\n=== Creating Super Admin ===")
    try:
        superadmin = User.objects.get(username='superadmin')
        print(f"✓ Super admin already exists: {superadmin.username}")
    except User.DoesNotExist:
        superadmin = User.objects.create_superuser(
            username='superadmin',
            email='admin@school.com',
            password='Admin@123',
            first_name='Super',
            last_name='Admin'
        )
        superadmin.role = 'super_admin'
        superadmin.school = None  # Super admin not tied to any school
        superadmin.save()
        print(f"✓ Super admin created: {superadmin.username}")
        print(f"  Password: Admin@123")
    
    # Create a test school admin
    print("\n=== Creating School Admin ===")
    try:
        school_admin = User.objects.get(username='admin')
        print(f"✓ School admin already exists: {school_admin.username}")
    except User.DoesNotExist:
        school_admin = User.objects.create_user(
            username='admin',
            email='admin@mainschool.com',
            password='Admin@123',
            first_name='School',
            last_name='Admin'
        )
        school_admin.role = 'admin'
        school_admin.school = school
        school_admin.is_staff = True
        school_admin.save()
        print(f"✓ School admin created: {school_admin.username}")
        print(f"  School: {school.name}")
        print(f"  Password: Admin@123")
    
    print("\n=== Setup Complete! ===")
    print("\nLogin Credentials:")
    print("  Super Admin: username=superadmin, password=Admin@123")
    print("  School Admin: username=admin, password=Admin@123")
    print(f"  \nSchool Verification Code: {school.school_verification_code}")
    print("\n  Use the verification code for teacher self-registration")

if __name__ == '__main__':
    create_initial_data()
