from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Event, Registration, Waitlist, Speaker, Session, SurveyQuestion, Announcement, ChapterSetting,
    Team, TeamMember, TeamInvitation, Report, EventAsset, ReportVersion
)
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
    created_by_user_email = serializers.SerializerMethodField()
    created_by_profile_name = serializers.SerializerMethodField()
    coordinated_by_email = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'type', 'status', 'category',
            'start_time', 'end_time', 'timezone', 'venue', 'capacity',
            'cover_image', 'created_at', 'speakers', 'sessions',
            'survey_questions', 'announcements',
            'registration_count', 'waitlist_count', 'user_status',
            'registration_mode', 'min_team_size', 'max_team_size',
            'created_by_user_email', 'created_by_profile_name',
            'rig_vertical', 'domain_team', 'coordinated_by', 'coordinated_by_email'
        )
        read_only_fields = ('id', 'created_at', 'created_by_user_email', 'created_by_profile_name', 'coordinated_by_email')

    def get_created_by_user_email(self, obj):
        return obj.created_by_user.email if obj.created_by_user else None

    def get_created_by_profile_name(self, obj):
        return obj.created_by_profile.name if obj.created_by_profile else None

    def get_coordinated_by_email(self, obj):
        return obj.coordinated_by.email if obj.coordinated_by else None

    def to_internal_value(self, data):
        # Convert incoming coordinated_by_email to coordinated_by user ID
        data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'coordinated_by_email' in data_copy:
            email = data_copy.get('coordinated_by_email')
            if email:
                try:
                    user = User.objects.get(email=email.strip().lower())
                    data_copy['coordinated_by'] = user.id
                except User.DoesNotExist:
                    raise serializers.ValidationError({
                        "coordinated_by_email": f"User with email {email} does not exist. They must register first."
                    })
            else:
                data_copy['coordinated_by'] = None
        return super().to_internal_value(data_copy)

    def get_registration_count(self, obj):
        if obj.registration_mode == 'team':
            return obj.teams.filter(status=Team.RegistrationStatus.REGISTERED).count()
        return obj.registrations.filter(status=Registration.Status.CONFIRMED).count()

    def get_waitlist_count(self, obj):
        if obj.registration_mode == 'team':
            return obj.teams.filter(status=Team.RegistrationStatus.WAITLISTED).count()
        return obj.waitlists.count()

    def get_user_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None
        
        if obj.registration_mode == 'team':
            # Check if the user is in a team for this event
            membership = TeamMember.objects.filter(team__event=obj, user=request.user).first()
            if membership:
                team = membership.team
                return {
                    'type': 'team',
                    'team_id': team.id,
                    'team_name': team.name,
                    'role': membership.role,
                    'status': team.status,
                }
            # Check if they have a pending invitation to a team for this event
            invitation = TeamInvitation.objects.filter(
                team__event=obj, 
                email=request.user.email.lower(), 
                status=TeamInvitation.InvitationStatus.PENDING
            ).first()
            if invitation:
                return {
                    'type': 'invited',
                    'team_id': invitation.team.id,
                    'team_name': invitation.team.name,
                    'invitation_id': invitation.id
                }
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
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = Registration
        fields = ('id', 'event', 'event_title', 'user', 'status', 'ticket_type', 'registered_at', 'checked_in_at', 'team', 'team_name')
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


class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TeamMember
        fields = ('id', 'team', 'user', 'role', 'joined_at')


class TeamInvitationSerializer(serializers.ModelSerializer):
    invited_by = UserSerializer(read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = TeamInvitation
        fields = ('id', 'team', 'team_name', 'email', 'invited_by', 'status', 'token', 'created_at')


class TeamSerializer(serializers.ModelSerializer):
    members = TeamMemberSerializer(many=True, read_only=True)
    invitations = TeamInvitationSerializer(many=True, read_only=True)
    leader = UserSerializer(read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)

    class Meta:
        model = Team
        fields = ('id', 'event', 'event_title', 'name', 'description', 'leader', 'status', 'members', 'invitations', 'created_at')
        read_only_fields = ('id', 'status', 'created_at')


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = (
            'id', 'event', 'summary', 'outcomes', 
            'sponsored_amount', 'amount_utilized', 'amount_returned',
            'prize_position', 'prize_details', 'is_locked', 'locked_at', 'locked_by'
        )
        read_only_fields = ('id', 'is_locked', 'locked_at', 'locked_by')


class EventAssetSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EventAsset
        fields = ('id', 'event', 'file', 'file_url', 'name', 'category', 'uploaded_at', 'uploaded_by', 'uploaded_by_email')
        read_only_fields = ('id', 'uploaded_at', 'uploaded_by', 'uploaded_by_email')

    def get_uploaded_by_email(self, obj):
        return obj.uploaded_by.email if obj.uploaded_by else None

    def get_file_url(self, obj):
        if not obj.file:
            return None
        try:
            url = obj.file.url
            # Cloudinary URLs are already absolute — return them directly
            if url.startswith('http'):
                return url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
            return url
        except Exception:
            return None


class ReportVersionSerializer(serializers.ModelSerializer):
    generated_by_email = serializers.SerializerMethodField()
    docx_file = serializers.SerializerMethodField()
    pdf_file = serializers.SerializerMethodField()

    class Meta:
        model = ReportVersion
        fields = ('id', 'event', 'version_number', 'docx_file', 'pdf_file', 'generated_at', 'generated_by', 'generated_by_email', 'is_active')
        read_only_fields = ('id', 'version_number', 'generated_at', 'generated_by', 'generated_by_email', 'is_active')

    def get_generated_by_email(self, obj):
        return obj.generated_by.email if obj.generated_by else None

    def get_docx_file(self, obj):
        if not obj.docx_file:
            return None
        url = obj.docx_file.url
        # Cloudinary URLs are already absolute, don't wrap them
        if url.startswith('http'):
            return url
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_pdf_file(self, obj):
        if not obj.pdf_file:
            return None
        url = obj.pdf_file.url
        # Cloudinary URLs are already absolute, don't wrap them
        if url.startswith('http'):
            return url
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url



