from rest_framework import serializers
from django.utils import timezone
from .models import Event, Speaker, Session, EventAsset, Registration, Team
from sponsors.models import EventSponsor, Sponsor


def build_absolute_url(request, url_str):
    if not url_str:
        return None
    if url_str.startswith('http://') or url_str.startswith('https://'):
        return url_str
    if request:
        return request.build_absolute_uri(url_str)
    return url_str


class PublicSpeakerSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = Speaker
        fields = ('id', 'name', 'bio', 'avatar')

    def get_avatar(self, obj):
        request = self.context.get('request')
        return build_absolute_url(request, obj.avatar)


class PublicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ('id', 'title', 'duration', 'track', 'speaker', 'order')


class PublicSponsorSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Sponsor
        fields = ('id', 'name', 'logo', 'website', 'tier')

    def get_logo(self, obj):
        request = self.context.get('request')
        return build_absolute_url(request, obj.logo)


class PublicEventSponsorSerializer(serializers.ModelSerializer):
    sponsor = PublicSponsorSerializer(read_only=True)

    class Meta:
        model = EventSponsor
        fields = ('id', 'tier_override', 'sponsor')


class PublicGalleryAssetSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EventAsset
        fields = ('id', 'name', 'category', 'file_url')

    def get_file_url(self, obj):
        if not obj.file:
            return None
        try:
            url = obj.file.url
            request = self.context.get('request')
            return build_absolute_url(request, url)
        except Exception:
            return None


class PublicEventListSerializer(serializers.ModelSerializer):
    slug = serializers.CharField(read_only=True)
    mode = serializers.CharField(source='type', read_only=True)
    short_description = serializers.SerializerMethodField()
    full_description = serializers.CharField(source='description', read_only=True)
    cover_image = serializers.SerializerMethodField()
    organizer = serializers.SerializerMethodField()
    
    # Availability & Public Status Metrics
    remaining_seats = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    is_registration_open = serializers.SerializerMethodField()
    public_status = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            'id',
            'slug',
            'title',
            'short_description',
            'full_description',
            'mode',
            'category',
            'public_status',
            'start_time',
            'end_time',
            'timezone',
            'venue',
            'capacity',
            'remaining_seats',
            'is_full',
            'is_registration_open',
            'cover_image',
            'registration_mode',
            'organizer',
            'created_at',
        )

    def get_short_description(self, obj):
        desc = obj.description or ''
        if len(desc) > 160:
            return desc[:157] + '...'
        return desc

    def get_cover_image(self, obj):
        request = self.context.get('request')
        return build_absolute_url(request, obj.cover_image)

    def get_organizer(self, obj):
        if obj.created_by_profile and obj.created_by_profile.name:
            return obj.created_by_profile.name
        if obj.coordinated_by:
            full_name = obj.coordinated_by.get_full_name()
            if full_name.strip():
                return full_name
            return obj.coordinated_by.email.split('@')[0]
        return "Research and Exploration (RÉ)"

    def get_remaining_seats(self, obj):
        if obj.registration_mode == 'team':
            registered_count = obj.teams.filter(status=Team.RegistrationStatus.REGISTERED).count()
        else:
            registered_count = obj.registrations.filter(
                status__in=[Registration.Status.CONFIRMED, Registration.Status.CHECKED_IN]
            ).count()
        return max(0, obj.capacity - registered_count)

    def get_is_full(self, obj):
        return self.get_remaining_seats(obj) <= 0

    def get_public_status(self, obj):
        now = timezone.now()
        if obj.status == Event.EventStatus.CANCELLED:
            return 'cancelled'
        if obj.status in [
            Event.EventStatus.COMPLETED,
            Event.EventStatus.REPORT_IN_PROGRESS,
            Event.EventStatus.REPORT_COMPLETED,
            Event.EventStatus.ARCHIVED,
        ] or (obj.end_time and now > obj.end_time):
            return 'completed'
        if obj.status == Event.EventStatus.REGISTRATION_CLOSED:
            return 'closed'
        if obj.status == Event.EventStatus.REGISTRATION_OPEN:
            return 'open' if not self.get_is_full(obj) else 'closed'
        if obj.status == Event.EventStatus.PUBLISHED:
            return 'open'
        return 'upcoming'

    def get_is_registration_open(self, obj):
        status = self.get_public_status(obj)
        return status == 'open' and not self.get_is_full(obj)


class PublicEventDetailSerializer(PublicEventListSerializer):
    speakers = PublicSpeakerSerializer(many=True, read_only=True)
    sessions = PublicSessionSerializer(many=True, read_only=True)
    sponsors = PublicEventSponsorSerializer(source='event_sponsors', many=True, read_only=True)
    gallery = serializers.SerializerMethodField()
    faqs = serializers.SerializerMethodField()

    class Meta(PublicEventListSerializer.Meta):
        fields = PublicEventListSerializer.Meta.fields + (
            'min_team_size',
            'max_team_size',
            'speakers',
            'sessions',
            'sponsors',
            'gallery',
            'faqs',
        )

    def get_gallery(self, obj):
        request = self.context.get('request')
        assets = obj.assets.filter(category__in=['photo', 'invitation_poster'])
        return PublicGalleryAssetSerializer(assets, many=True, context={'request': request}).data

    def get_faqs(self, obj):
        # Explicit FAQ structure for public website consumption
        return []
