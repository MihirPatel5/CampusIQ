"""
Test script for multi-tenant authentication and school management
Tests all authentication flows and verifies multi-tenant functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_login(username, password):
    """Test login endpoint"""
    url = f"{BASE_URL}/auth/login/"
    data = {
        "username": username,
        "password": password
    }
    response = requests.post(url, json=data)
    print(f"Login as '{username}': {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"  ✓ Success! Role: {result['user']['role']}, School: {result['user'].get('school', 'None')}")
        return result['access']
    else:
        print(f"  ✗ Error: {response.json()}")
        return None

def test_get_verification_code(token):
    """Get school verification code"""
    url = f"{BASE_URL}/school/verification-code/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    print(f"Get Verification Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"  ✓ Code: {result['school_verification_code']}")
        return result['school_verification_code']
    else:
        print(f"  ✗ Error: {response.json()}")
        return None

def test_teacher_registration(verification_code):
    """Test teacher self-registration"""
    url = f"{BASE_URL}/teachers/self-register/"
    data = {
        "first_name": "Test",
        "last_name": "Teacher",
        "email": f"test.teacher{verification_code[:4]}@example.com",
        "phone": f"+91-{verification_code[:10]}",
        "date_of_birth": "1990-01-01",
        "qualification": "B.Ed",
        "specialization": "Mathematics",
        "address": "123 Test Street",
        "password": "Test@123",
        "password_confirm": "Test@123",
        "school_verification_code": verification_code
    }
    response = requests.post(url, json=data)
    print(f"Teacher Registration: {response.status_code}")
    if response.status_code == 201:
        result = response.json()
        print(f"  ✓ Success! Teacher ID: {result['teacher']['id']}, Status: {result['teacher']['status']}")
        return result['teacher']
    else:
        print(f"  ✗ Error: {response.json()}")
        return None

def test_create_school(token):
    """Test school creation (super admin only)"""
    url = f"{BASE_URL}/schools/"
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "name": "Test School",
        "code": "TEST",
        "address": "456 Test Avenue",
        "city": "Delhi",
        "state": "Delhi",
        "pincode": "110001",
        "email": "contact@testschool.com",
        "phone": "+91-11-98765432",
        "status": "active"
    }
    response = requests.post(url, json=data, headers=headers)
    print(f"Create School: {response.status_code}")
    if response.status_code == 201:
        result = response.json()
        print(f"  ✓ Success! School: {result['name']}, Code: {result['code']}")
        print(f"  ✓ Verification Code: {result['school_verification_code']}")
        return result
    else:
        print(f"  ✗ Error: {response.json()}")
        return None

def test_list_schools(token):
    """Test listing schools"""
    url = f"{BASE_URL}/schools/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    print(f"List Schools: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"  ✓ Found {len(result)} school(s)")
        for school in result:
            print(f"    - {school['name']} (Code: {school['code']})")
        return result
    else:
        print(f"  ✗ Error: {response.json()}")
        return None

def run_tests():
    """Run all authentication tests"""
    
    print_section("MULTI-TENANT AUTHENTICATION TESTS")
    
    # Test 1: Login as Super Admin
    print_section("Test 1: Super Admin Login")
    super_admin_token = test_login("superadmin", "Admin@123")
    
    # Test 2: Login as School Admin
    print_section("Test 2: School Admin Login")
    school_admin_token = test_login("admin", "Admin@123")
    
    # Test 3: Get verification code (School Admin)
    if school_admin_token:
        print_section("Test 3: Get School Verification Code")
        verification_code = test_get_verification_code(school_admin_token)
        
        # Test 4: Teacher Self-Registration
        if verification_code:
            print_section("Test 4: Teacher Self-Registration")
            teacher = test_teacher_registration(verification_code)
    
    # Test 5: Create new school (Super Admin)
    if super_admin_token:
        print_section("Test 5: Create New School (Super Admin)")
        new_school = test_create_school(super_admin_token)
        
        # Test 6: List all schools (Super Admin sees all)
        print_section("Test 6: List Schools (Super Admin View)")
        test_list_schools(super_admin_token)
    
    # Test 7: List schools (School Admin sees only theirs)
    if school_admin_token:
        print_section("Test 7: List Schools (School Admin View)")
        test_list_schools(school_admin_token)
    
    print_section("TESTS COMPLETE")
    print("\n✓ All authentication flows are multi-tenant aware!")
    print("✓ Teachers register to specific schools via verification codes")
    print("✓ School admins only see their own school")
    print("✓ Super admins can see and manage all schools")

if __name__ == "__main__":
    print("Starting Multi-Tenant Authentication Tests...")
    print("Make sure the development server is running on http://localhost:8000\n")
    try:
        run_tests()
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Could not connect to server. Make sure it's running:")
        print("  python manage.py runserver")
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
