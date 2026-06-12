from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event, Registration, Waitlist, Speaker
from authentication.serializers import UserSerializer

User = get_user_model()

class SpeakerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Speaker
        fields = ('id', 'name', 'bio', 'avatar')

class EventSerializer(serializers.ModelSerializer):
    speakers = SpeakerSerializer(many=True, read_only=True)
    registration_count = serializers.SerializerMethodField()
    waitlist_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'type', 'status',
            'start_time', 'end_time', 'timezone', 'venue', 'capacity',
            'cover_image', 'created_at', 'speakers',
            'registration_count', 'waitlist_count'
        )
        read_only_fields = ('id', 'created_at')

    def get_registration_count(self, obj):
        return obj.registrations.filter(status=Registration.Status.CONFIRMED).count()

    def get_waitlist_count(self, obj):
        return obj.waitlists.count()

    def validate(self, attrs):
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("Event end time must be strictly after the start time.")
        return attrs

class RegistrationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Registration
        fields = ('id', 'event', 'user', 'status', 'ticket_type', 'registered_at', 'checked_in_at')
        read_only_fields = ('id', 'user', 'registered_at', 'checked_in_at')

class WaitlistSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Waitlist
        fields = ('id', 'event', 'user', 'position', 'created_at')
        read_only_fields = ('id', 'user', 'position', 'created_at')
