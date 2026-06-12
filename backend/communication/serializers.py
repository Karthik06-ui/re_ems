from rest_framework import serializers
from .models import EmailCampaign

class EmailCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailCampaign
        fields = ('id', 'subject', 'body', 'audience', 'status', 'scheduled_at', 'sent_at', 'created_at')
        read_only_fields = ('id', 'status', 'sent_at', 'created_at')
