from rest_framework import serializers
from .models import Event, NotificationSubscription
from academic.serializers import ClassSerializer, SectionSerializer

class EventSerializer(serializers.ModelSerializer):
    target_class_name = serializers.ReadOnlyField(source='target_class.name')
    target_section_name = serializers.ReadOnlyField(source='target_section.name')
    created_by_name = serializers.ReadOnlyField(source='created_by.get_full_name')

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'audience',
            'target_class', 'target_class_name', 'target_section', 'target_section_name',
            'start_datetime', 'end_datetime', 'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Validate audience targets.
        """
        audience = data.get('audience', 'global')
        if audience == 'class' and not data.get('target_class'):
            raise serializers.ValidationError("Target class is required for class-specific audience.")
        
        # User role validation happens in the ViewSet (perform_create)
        return data

class NotificationSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSubscription
        fields = ['id', 'user', 'endpoint', 'p256dh', 'auth', 'browser', 'device_type']
        read_only_fields = ['user']
