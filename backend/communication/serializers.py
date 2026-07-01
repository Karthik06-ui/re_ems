from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EmailCampaign
from authentication.serializers import UserSerializer
from events.models import Registration

User = get_user_model()

class EmailCampaignSerializer(serializers.ModelSerializer):
    recipient_count = serializers.SerializerMethodField()
    sent_by = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = EmailCampaign
        fields = (
            'id', 'event', 'subject', 'body', 'audience', 'status', 
            'scheduled_at', 'sent_at', 'created_at', 'sent_by', 'created_by',
            'recipient_count', 'actual_recipient_count', 'delivery_result', 'failure_reason'
        )
        read_only_fields = (
            'id', 'status', 'sent_at', 'created_at', 'sent_by', 'created_by',
            'actual_recipient_count', 'delivery_result', 'failure_reason'
        )

    def get_recipient_count(self, obj):
        # Return persisted count if already sent or failed
        if obj.actual_recipient_count is not None and obj.status in ['sent', 'failed']:
            return obj.actual_recipient_count

        if obj.audience == 'all':
            users = User.objects.filter(is_active=True)
            return len([u for u in users if u.notification_preferences_dict.get('outreach', True)])
        elif obj.audience == 'previous_participants':
            users = User.objects.filter(
                registrations__event__status='completed',
                registrations__status='confirmed'
            ).distinct()
            return len([u for u in users if u.notification_preferences_dict.get('outreach', True)])
        elif obj.audience == 'registrants':
            if obj.event:
                return obj.event.registrations.filter(
                    status__in=[Registration.Status.CONFIRMED, Registration.Status.CHECKED_IN]
                ).count()
            return 0
        elif obj.audience == 'waitlist':
            if obj.event:
                return obj.event.waitlists.count()
            return 0
        return 0

