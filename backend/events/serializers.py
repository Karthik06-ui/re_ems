from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event, Registration, Waitlist, Speaker, Session, SurveyQuestion, Announcement, ChapterSetting
from authentication.serializers import UserSerializer

User = get_user_model()

class SpeakerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Speaker
        fields = ('id', 'event', 'name', 'bio', 'avatar')

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ('id', 'event', 'title', 'duration', 'track', 'speaker', 'order')

class SurveyQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyQuestion
        fields = ('id', 'event', 'text', 'type')

class AnnouncementSerializer(serializers.ModelSerializer):
    recipient_count = serializers.SerializerMethodField()
    sent_by = UserSerializer(read_only=True)

    class Meta:
        model = Announcement
        fields = ('id', 'event', 'subject', 'body', 'recipients', 'status', 'sent_by', 'sent_at', 'recipient_count', 'created_at')
        read_only_fields = ('id', 'status', 'sent_by', 'sent_at', 'created_at')

    def get_recipient_count(self, obj):
        if not obj.event:
            return 0
        if obj.recipients == 'Confirmed Attendees' or obj.recipients == 'Confirmed':
            return obj.event.registrations.filter(
                status__in=[Registration.Status.CONFIRMED, Registration.Status.CHECKED_IN]
            ).count()
        elif obj.recipients == 'Waitlist' or obj.recipients == 'Waitlisted Users':
            return obj.event.waitlists.count()
        return obj.event.registrations.filter(
            status__in=[Registration.Status.CONFIRMED, Registration.Status.CHECKED_IN]
        ).count()

class EventSerializer(serializers.ModelSerializer):
    speakers = SpeakerSerializer(many=True, read_only=True)
    sessions = SessionSerializer(many=True, read_only=True)
    survey_questions = SurveyQuestionSerializer(many=True, read_only=True)
    announcements = AnnouncementSerializer(many=True, read_only=True)
    registration_count = serializers.SerializerMethodField()
    waitlist_count = serializers.SerializerMethodField()
    user_status = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'type', 'status', 'category',
            'start_time', 'end_time', 'timezone', 'venue', 'capacity',
            'cover_image', 'created_at', 'speakers', 'sessions',
            'survey_questions', 'announcements',
            'registration_count', 'waitlist_count', 'user_status'
        )
        read_only_fields = ('id', 'created_at')

    def get_registration_count(self, obj):
        return obj.registrations.filter(status=Registration.Status.CONFIRMED).count()

    def get_waitlist_count(self, obj):
        return obj.waitlists.count()

    def get_user_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None
        
        reg = obj.registrations.filter(user=request.user).exclude(status=Registration.Status.CANCELLED).first()
        if reg:
            return {
                'type': 'registration',
                'status': reg.status,
                'ticket_type': reg.ticket_type
            }
            
        wl = obj.waitlists.filter(user=request.user).first()
        if wl:
            return {
                'type': 'waitlist',
                'position': wl.position
            }
            
        return None

    def validate(self, attrs):
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("Event end time must be strictly after the start time.")
        return attrs

class RegistrationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)

    class Meta:
        model = Registration
        fields = ('id', 'event', 'event_title', 'user', 'status', 'ticket_type', 'registered_at', 'checked_in_at')
        read_only_fields = ('id', 'user', 'registered_at', 'checked_in_at')

class WaitlistSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Waitlist
        fields = ('id', 'event', 'user', 'position', 'created_at')
        read_only_fields = ('id', 'user', 'position', 'created_at')


class ChapterSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChapterSetting
        fields = ('slug', 'name', 'location', 'description', 'logo', 'banner', 'theme_color', 'ga_tracking_id')

