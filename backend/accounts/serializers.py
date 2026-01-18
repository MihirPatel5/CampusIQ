from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from .models import User, School, TeacherProfile
from datetime import date


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class LoginSerializer(serializers.Serializer):
    """Serializer for login endpoint"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class TeacherRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for teacher self-registration"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    school_verification_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = TeacherProfile
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
            'qualification', 'specialization', 'address',
            'password', 'password_confirm', 'school_verification_code'
        ]
    
    def validate(self, attrs):
        # Check password match
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        
        # Verify school verification code if provided
        verification_code = attrs.get('school_verification_code')
        school = None
        
        if verification_code:
            try:
                school = School.objects.get(school_verification_code=verification_code)
            except School.DoesNotExist:
                raise serializers.ValidationError({"school_verification_code": "Invalid school verification code"})
            except School.MultipleObjectsReturned:
                raise serializers.ValidationError({"school_verification_code": "System error: duplicate verification codes"})
        
        # Store school for later use in create()
        attrs['_school'] = school
        
        # Check email/phone uniqueness
        # If school is present, check per school. If no school, check globally for users with no school.
        email = attrs['email']
        phone = attrs['phone']
        
        if school:
            if User.objects.filter(email=email, school=school).exists():
                raise serializers.ValidationError({"email": "Email already registered in this school"})
            if TeacherProfile.objects.filter(phone=phone, user__school=school).exists():
                raise serializers.ValidationError({"phone": "Phone number already registered in this school"})
        else:
            # Global uniqueness check for unassigned users
            if User.objects.filter(email=email, school__isnull=True).exists():
                raise serializers.ValidationError({"email": "Email already registered for an unassigned teacher"})
            # Also check if it exists in ANY school? Usually emails should be globally unique if they are for the same user.
            # But in multi-tenant, sometimes they are unique per school.
            # To be safe, let's just check globally if it exists at all.
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": "This email is already in use"})
        
        return attrs
    
    def create(self, validated_data):
        # Remove non-model fields
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')
        validated_data.pop('school_verification_code', None)
        school = validated_data.pop('_school')  # Get the school we found in validate()
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        
        # Create user account
        username = email.split('@')[0] + str(User.objects.count() + 1)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='teacher',
            school=school,  # Assign to the school (can be None)
            is_active=False  # Inactive until approved
        )
        
        # Create teacher profile
        teacher_profile = TeacherProfile.objects.create(
            user=user,
            joining_date=date.today(),
            status='pending',
            self_registered=True,
            **validated_data
        )
        
        return teacher_profile


class TeacherProfileSerializer(serializers.ModelSerializer):
    """Serializer for TeacherProfile"""
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'user', 'full_name', 'employee_id', 'phone', 'date_of_birth',
            'joining_date', 'qualification', 'specialization', 'address',
            'status', 'self_registered', 'rejection_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'self_registered', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()


class TeacherCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin creating teacher accounts"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = TeacherProfile
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
            'employee_id', 'joining_date', 'qualification', 'specialization',
            'address', 'password'
        ]
    
    def validate_email(self, value):
        # Check uniqueness within admin's school
        request = self.context.get('request')
        if request and request.user and request.user.school:
            if User.objects.filter(email=value, school=request.user.school).exists():
                raise serializers.ValidationError("Email already registered in your school")
        return value
    
    def validate_phone(self, value):
        # Check uniqueness within admin's school  
        request = self.context.get('request')
        if request and request.user and request.user.school:
            if TeacherProfile.objects.filter(phone=value, user__school=request.user.school).exists():
                raise serializers.ValidationError("Phone number already registered in your school")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        
        # Get admin's school
        request = self.context.get('request')
        admin_school = request.user.school if request and request.user else None
        
        # Create user account
        username = email.split('@')[0]
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='teacher',
            school=admin_school,  # Assign to admin's school
            is_active=True
        )
        
        # Set created_by from request
        if request and request.user:
            user.created_by = request.user
            user.save()
        
        # Create teacher profile
        teacher_profile = TeacherProfile.objects.create(
            user=user,
            status='active',  # Admin-created teachers are active immediately
            self_registered=False,
            created_by=request.user if request else None,
            **validated_data
        )
        
        return teacher_profile


class SchoolSerializer(serializers.ModelSerializer):
    """Serializer for School (multi-tenant)"""
    
    class Meta:
        model = School
        fields = [
            'id', 'name', 'code', 'logo', 'school_verification_code', 'address',
            'city', 'state', 'pincode', 'phone', 'email', 'website', 
            'established_year', 'affiliation', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'code', 'school_verification_code', 'created_at', 'updated_at']
