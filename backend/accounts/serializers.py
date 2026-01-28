from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from .models import User, School, TeacherProfile, OTPVerification
from datetime import date


class PublicSchoolSerializer(serializers.ModelSerializer):
    """Serializer for public school listing (limited fields)"""
    
    class Meta:
        model = School
        fields = ['id', 'name', 'logo', 'city', 'state']


class SchoolSerializer(serializers.ModelSerializer):
    """Serializer for School (multi-tenant)"""
    admin_email = serializers.EmailField(write_only=True, required=False)
    admin_username = serializers.CharField(write_only=True, required=False)
    admin_password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = School
        fields = [
            'id', 'name', 'code', 'logo', 'school_verification_code', 'address',
            'city', 'state', 'pincode', 'phone', 'email', 'website', 
            'established_year', 'affiliation', 'status',
            'created_at', 'updated_at',
            'admin_email', 'admin_username', 'admin_password'
        ]
        read_only_fields = ['id', 'code', 'school_verification_code', 'created_at', 'updated_at']

    def create(self, validated_data):
        admin_email = validated_data.pop('admin_email', None)
        admin_username = validated_data.pop('admin_username', None)
        admin_password = validated_data.pop('admin_password', None)
        
        school = super().create(validated_data)
        
        # Create school admin if details provided
        if admin_email and admin_username and admin_password:
            from .models import User
            User.objects.create_user(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                role='admin',
                school=school,
                is_active=True
            )
            
        return school


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    school = SchoolSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'school', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class LoginSerializer(serializers.Serializer):
    """Serializer for login endpoint"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class TeacherRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for teacher self-registration"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    school_id = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.filter(status='active'),
        source='school',
        write_only=True,
        required=True,
        help_text="The school the teacher is registering for"
    )
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = TeacherProfile
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
            'qualification', 'specialization', 'address',
            'password', 'password_confirm', 'school_id'
        ]
    
    def validate(self, attrs):
        # Check password match
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        
        # Check email/phone uniqueness within the school
        school = attrs.get('school')
        email = attrs['email']
        phone = attrs['phone']
        
        if User.objects.filter(email=email, school=school).exists():
            raise serializers.ValidationError({"email": "Email already registered in this school"})
        
        if TeacherProfile.objects.filter(phone=phone, user__school=school).exists():
            raise serializers.ValidationError({"phone": "Phone number already registered in this school"})
        
        return attrs
    
    def create(self, validated_data):
        # Remove non-model fields
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')
        school = validated_data.pop('school')
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
            school=school,
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
            'status', 'self_registered', 'rejection_reason', 'subjects',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'self_registered', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()


from academic.models import Subject

class TeacherCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin creating teacher accounts"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    subjects = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = TeacherProfile
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
            'employee_id', 'joining_date', 'qualification', 'specialization',
            'address', 'password', 'subjects'
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
        subjects = validated_data.pop('subjects', [])
        
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
        
        # Assign subjects
        if subjects:
            teacher_profile.subjects.set(subjects)
        
        return teacher_profile


class PublicSchoolSerializer(serializers.ModelSerializer):
    """Serializer for public school listing (limited fields)"""
    
    class Meta:
        model = School
        fields = ['id', 'name', 'logo', 'city', 'state']


class SchoolSerializer(serializers.ModelSerializer):
    """Serializer for School (multi-tenant)"""
    admin_email = serializers.EmailField(write_only=True, required=False)
    admin_username = serializers.CharField(write_only=True, required=False)
    admin_password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = School
        fields = [
            'id', 'name', 'code', 'logo', 'school_verification_code', 'address',
            'city', 'state', 'pincode', 'phone', 'email', 'website', 
            'established_year', 'affiliation', 'status',
            'created_at', 'updated_at',
            'admin_email', 'admin_username', 'admin_password'
        ]
        read_only_fields = ['id', 'code', 'school_verification_code', 'created_at', 'updated_at']

    def create(self, validated_data):
        admin_email = validated_data.pop('admin_email', None)
        admin_username = validated_data.pop('admin_username', None)
        admin_password = validated_data.pop('admin_password', None)
        
        school = super().create(validated_data)
        
        # Create school admin if details provided
        if admin_email and admin_username and admin_password:
            User.objects.create_user(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                role='admin',
                school=school,
                is_active=True
            )
            
        return school


class SchoolAdminRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for school admin self-registration"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(required=False, write_only=True)  # Optional phone, not saved to User
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'phone']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data.pop('phone', None)  # Remove phone if present, not on User model
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role='admin',
            school=None,  # No school initially
            is_active=False,  # Inactive until OTP verification
            is_email_verified=False
        )
        return user


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(min_length=6, max_length=6, required=True)

    def validate(self, attrs):
        email = attrs.get('email')
        otp = attrs.get('otp')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email address")

        if user.is_email_verified:
             raise serializers.ValidationError("Email already verified")

        try:
            verification = OTPVerification.objects.filter(user=user, is_verified=False).latest('created_at')
        except OTPVerification.DoesNotExist:
            raise serializers.ValidationError("No OTP found for this user")

        if verification.is_expired():
            raise serializers.ValidationError("OTP has expired")

        if verification.otp != otp:
             raise serializers.ValidationError("Invalid OTP")
             
        attrs['user'] = user
        attrs['verification'] = verification
        return attrs


class SchoolOnboardingSerializer(serializers.ModelSerializer):
    """Serializer for verified admin to create their own school"""
    
    class Meta:
        model = School
        fields = [
            'id', 'name', 'address', 'city', 'state', 'pincode', 
            'phone', 'email', 'website', 'established_year', 'affiliation'
        ]
        extra_kwargs = {
            'name': {'required': True},
            'city': {'required': True},
            'state': {'required': True},
        }

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        
        # Create school with current user as creator/updater
        school = School.objects.create(
            created_by=user,
            updated_by=user,
            **validated_data
        )
        
        # Link user to school
        user.school = school
        user.save()
        
        return school
