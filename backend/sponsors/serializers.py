from rest_framework import serializers
from .models import Sponsor, EventSponsor

class SponsorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sponsor
        fields = ('id', 'chapter', 'name', 'logo', 'website', 'tier', 'created_at')
        read_only_fields = ('id', 'created_at')

class EventSponsorSerializer(serializers.ModelSerializer):
    sponsor_details = SponsorSerializer(source='sponsor', read_only=True)

    class Meta:
        model = EventSponsor
        fields = ('id', 'event', 'sponsor', 'tier_override', 'sponsor_details')
