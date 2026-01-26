from rest_framework import serializers
from .models import StudentProfile, ParentProfile, AdmissionFormConfig
from academic.models import Class, Section
from accounts.models import User


class AdmissionFormConfigSerializer(serializers.ModelSerializer):
    """Serializer for AdmissionFormConfig"""
    
    class Meta:
        model = AdmissionFormConfig
        fields = [
            'id', 'field_name', 'field_label', 'field_type', 'section',
            'is_visible', 'is_required', 'display_order', 'help_text',
            'placeholder', 'options', 'validation_rules',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ParentProfileSerializer(serializers.ModelSerializer):
    """Serializer for ParentProfile"""
    
    class Meta:
        model = ParentProfile
        fields = ['id', 'relation', 'name', 'phone', 'email', 'occupation', 'address', 'is_primary']


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for StudentProfile"""
    parents = ParentProfileSerializer(many=True, read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentProfile
        fields = [
            'id', 'admission_number', 'first_name', 'middle_name', 'last_name', 'full_name',
            'date_of_birth', 'gender', 'blood_group', 'nationality', 'religion', 'category',
            'mother_tongue', 'caste', 'aadhaar_number',
            'email', 'phone', 'alternate_phone', 'address', 'city', 'state', 'pincode',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'height', 'weight', 'medical_conditions', 'allergies', 'vaccination_status',
            'admission_date', 'roll_number', 'class_obj', 'class_name', 'section', 'section_name',
            'previous_school', 'previous_class', 'previous_marks', 'tc_number', 'tc_date',
            'photo', 'birth_certificate', 'transfer_certificate', 'aadhar_card', 'caste_certificate',
            'transport_required', 'bus_route', 'pickup_point',
            'hostel_required', 'hostel_room_preference',
            'custom_fields', 'status', 'parents',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class StudentAdmissionSerializer(serializers.ModelSerializer):
    """Serializer for student admission with parent details and dynamic validation"""
    parents = ParentProfileSerializer(many=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = StudentProfile
        fields = [
            'id', 'admission_number', 'first_name', 'middle_name', 'last_name', 'date_of_birth',
            'gender', 'blood_group', 'nationality', 'religion', 'category', 'mother_tongue', 'caste',
            'aadhaar_number', 'email', 'phone', 'alternate_phone',
            'address', 'city', 'state', 'pincode',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'height', 'weight', 'medical_conditions', 'allergies', 'vaccination_status',
            'admission_date', 'roll_number', 'class_obj', 'section',
            'previous_school', 'previous_class', 'previous_marks', 'tc_number', 'tc_date',
            'photo', 'birth_certificate', 'transfer_certificate', 'aadhar_card', 'caste_certificate',
            'transport_required', 'bus_route', 'pickup_point',
            'hostel_required', 'hostel_room_preference',
            'hostel_required', 'hostel_room_preference',
            'custom_fields', 'parents', 'password', 'school'
        ]
        read_only_fields = ['id']
    
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
        
        # Dynamic validation based on school's form configuration
        request = self.context.get('request')
        school = attrs.get('school')
        
        if not school and request and request.user and hasattr(request.user, 'school'):
            school = request.user.school
            
        if school:
            required_fields = AdmissionFormConfig.objects.filter(
                school=school,
                is_required=True,
                is_visible=True
            ).values_list('field_name', flat=True)
            
            for field_name in required_fields:
                if field_name in ['class_obj', 'section']:  # These are ForeignKeys, handled differently
                    continue
                if field_name not in attrs or not attrs.get(field_name):
                    # Get field label for better error message
                    try:
                        config = AdmissionFormConfig.objects.get(school=school, field_name=field_name)
                        field_label = config.field_label
                    except AdmissionFormConfig.DoesNotExist:
                        field_label = field_name.replace('_', ' ').title()
                    
                    raise serializers.ValidationError({
                        field_name: f"{field_label} is required for this school"
                    })
        
        return attrs
    
    def create(self, validated_data):
        parents_data = validated_data.pop('parents', [])
        password = validated_data.pop('password', 'student123')
        
        # Extract created_by if passed from perform_create
        created_by = validated_data.pop('created_by', self.context.get('request').user if self.context.get('request') else None)

        # Create user account if email provided
        user = None
        email = validated_data.get('email')
        school = validated_data.get('school')
        
        # If no school in validated_data, try to get from context (Common for TenantAwareModel)
        if not school:
            from core.tenant import TenantContext
            school = TenantContext.get_current_tenant()

        if email:
            username = validated_data['admission_number']
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                role='student',
                school=school,
                created_by=created_by
            )
        
        # Create student profile
        student = StudentProfile.objects.create(
            user=user,
            created_by=created_by,
            **validated_data
        )
        
        # Create parent profiles
        for parent_data in parents_data:
            parent_user = None
            p_email = parent_data.get('email')
            p_phone = parent_data.get('phone')
            
            # Create parent user if email/phone exists
            if p_email or p_phone:
                p_username = p_email if p_email else f"P{p_phone}"
                try:
                    parent_user = User.objects.create_user(
                        username=p_username,
                        email=p_email if p_email else '',
                        password=password,
                        first_name=parent_data.get('name', '').split(' ')[0],
                        last_name=parent_data.get('name', '').split(' ')[-1] if ' ' in parent_data.get('name', '') else '',
                        role='parent',
                        school=school,
                        created_by=created_by
                    )
                except Exception as e:
                    print(f"Warning: Could not create parent user: {e}")
            
            ParentProfile.objects.create(
                student=student, 
                school=school, 
                user=parent_user,
                created_by=created_by,
                **parent_data
            )
        
        return student
