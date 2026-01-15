from rest_framework import serializers
from .models import StudentProfile, ParentProfile
from academic.models import Class, Section
from accounts.models import User


class ParentProfileSerializer(serializers.ModelSerializer):
    """Serializer for ParentProfile"""
    
    class Meta:
        model = ParentProfile
        fields = ['id', 'relation', 'name', 'phone', 'email  ', 'occupation', 'address', 'is_primary']


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for StudentProfile"""
    parents = ParentProfileSerializer(many=True, read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentProfile
        fields = [
            'id', 'admission_number', 'first_name', 'last_name', 'full_name',
            'date_of_birth', 'gender', 'blood_group', 'aadhaar_number',
            'email', 'phone', 'address', 'city', 'state', 'pincode',
            'admission_date', 'class_obj', 'class_name', 'section', 'section_name',
            'previous_school', 'previous_class', 'status', 'parents',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class StudentAdmissionSerializer(serializers.ModelSerializer):
    """Serializer for student admission with parent details"""
    parents = ParentProfileSerializer(many=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = StudentProfile
        fields = [
            'admission_number', 'first_name', 'last_name', 'date_of_birth',
            'gender', 'blood_group', 'aadhaar_number', 'email', 'phone',
            'address', 'city', 'state', 'pincode', 'admission_date',
            'class_obj', 'section', 'previous_school', 'previous_class',
            'parents', 'password'
        ]
    
    def validate_admission_number(self, value):
        if StudentProfile.objects.filter(admission_number=value).exists():
            raise serializers.ValidationError("Admission number already exists")
        return value
    
    def validate_email(self, value):
        if value and StudentProfile.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value
    
    def validate_phone(self, value):
        if StudentProfile.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Phone number already registered")
        return value
    
    def validate(self, attrs):
        # Check section capacity
        section = attrs.get('section')
        if section and not section.has_capacity():
            raise serializers.ValidationError({"section": "Section has reached maximum capacity"})
        return attrs
    
    def create(self, validated_data):
        parents_data = validated_data.pop('parents', [])
        password = validated_data.pop('password', 'student123')
        
        # Create user account if email provided
        user = None
        email = validated_data.get('email')
        if email:
            username = validated_data['admission_number']
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                role='student'
            )
            
            request = self.context.get('request')
            if request and request.user:
                user.created_by = request.user
                user.save()
        
        # Create student profile
        student = StudentProfile.objects.create(
            user=user,
            **validated_data
        )
        
        # Create parent profiles
        for parent_data in parents_data:
            ParentProfile.objects.create(student=student, **parent_data)
        
        return student
