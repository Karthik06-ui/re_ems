from django.db import models
from django.conf import settings
import uuid


class Event(models.Model):
    class EventType(models.TextChoices):
        VIRTUAL = 'virtual', 'Virtual'
        PHYSICAL = 'physical', 'Physical'
        HYBRID = 'hybrid', 'Hybrid'

    class EventStatus(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        REGISTRATION_OPEN = 'registration open', 'Registration Open'
        REGISTRATION_CLOSED = 'registration closed', 'Registration Closed'
        COMPLETED = 'completed', 'Completed'
        ARCHIVED = 'archived', 'Archived'
        CANCELLED = 'cancelled', 'Cancelled'
        HIDDEN = 'hidden', 'Hidden'

    class EventCategory(models.TextChoices):
        WORKSHOP = 'workshop', 'Workshop'
        BOOTCAMP = 'bootcamp', 'Bootcamp'
        INTRODUCTION = 'introduction', 'Introduction'
        SPEAKER_SESSION = 'speaker_session', 'Speaker Session'
        HACKATHON = 'hackathon', 'Hackathon'
        OTHER = 'other', 'Other'

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=50, choices=EventType.choices, default=EventType.PHYSICAL)
    status = models.CharField(max_length=50, choices=EventStatus.choices, default=EventStatus.DRAFT)
    category = models.CharField(max_length=50, choices=EventCategory.choices, default=EventCategory.WORKSHOP)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    timezone = models.CharField(max_length=100, default='UTC')
    venue = models.CharField(max_length=255, blank=True)
    capacity = models.PositiveIntegerField(default=100)
    cover_image = models.URLField(max_length=500, blank=True, null=True)
    registration_mode = models.CharField(
        max_length=20,
        choices=[('individual', 'Individual'), ('team', 'Team')],
        default='individual'
    )
    min_team_size = models.PositiveIntegerField(default=1, null=True, blank=True)
    max_team_size = models.PositiveIntegerField(default=1, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='created_events'
    )
    created_by_profile = models.ForeignKey(
        'authentication.AdminProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='created_events'
    )

    def __str__(self):
        return self.title

class Registration(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = 'confirmed', 'Confirmed'
        CHECKED_IN = 'checked_in', 'Checked In'
        CANCELLED = 'cancelled', 'Cancelled'

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='registrations')
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.CONFIRMED)
    ticket_type = models.CharField(max_length=50, default='general')
    registered_at = models.DateTimeField(auto_now_add=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    team = models.ForeignKey(
        'Team',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registrations'
    )

    class Meta:
        unique_together = ('event', 'user')

    def __str__(self):
        return f"{self.user.email} - {self.event.title} ({self.status})"

class Waitlist(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='waitlists')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='waitlists')
    position = models.PositiveIntegerField()
    team = models.ForeignKey(
        'Team',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='waitlists'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'user')
        ordering = ['position']

    def __str__(self):
        return f"{self.user.email} - {self.event.title} (Pos {self.position})"

class Speaker(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='speakers')
    name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    avatar = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.name

class Session(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='sessions')
    title = models.CharField(max_length=255)
    duration = models.CharField(max_length=50, default='30m')
    track = models.CharField(max_length=100, blank=True)
    speaker = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.title} ({self.duration})"

class SurveyQuestion(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='survey_questions')
    text = models.CharField(max_length=500)
    type = models.CharField(max_length=100, default='Multiple Choice')

    def __str__(self):
        return self.text

class Announcement(models.Model):
    class AnnouncementStatus(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENDING = 'sending', 'Sending'
        SENT = 'sent', 'Sent'
        FAILED = 'failed', 'Failed'

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='announcements')
    subject = models.CharField(max_length=255)
    body = models.TextField()
    recipients = models.CharField(max_length=255, default='Confirmed Attendees')
    status = models.CharField(
        max_length=50,
        choices=AnnouncementStatus.choices,
        default=AnnouncementStatus.DRAFT
    )
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_announcements'
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.subject


class ChapterSetting(models.Model):
    slug = models.SlugField(max_length=100, unique=True, default='gdg-workspace')
    name = models.CharField(max_length=255, default='Research and Exploration (RÉ) Workspace')
    location = models.CharField(max_length=255, blank=True, default='Coimbatore, Tamil Nadu, India')
    description = models.TextField(blank=True, default='Kumaraguru Research and Exploration (RÉ) Chapter.')
    logo = models.URLField(max_length=500, blank=True, default='https://www.gstatic.com/devrel-devsite/prod/v559d28dbd68e4de88d1d8ef35b54203a7a97c27632669e46a782e46e8557ee7a/developers/images/touchicon-180.png')
    banner = models.URLField(max_length=500, blank=True, default='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80')
    theme_color = models.CharField(max_length=50, default='#1b2b4b')
    ga_tracking_id = models.CharField(max_length=50, default='G-XXXXXXXXXX')

    def __str__(self):
        return self.name


class Team(models.Model):
    class RegistrationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending (Draft)'
        REGISTERED = 'registered', 'Registered'
        WAITLISTED = 'waitlisted', 'Waitlisted'
        SUSPENDED = 'suspended_incomplete', 'Suspended (Incomplete)'
        CANCELLED = 'cancelled', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    leader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='led_teams')
    status = models.CharField(max_length=30, choices=RegistrationStatus.choices, default=RegistrationStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('event', 'leader')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.event.title})"


class TeamMember(models.Model):
    class Role(models.TextChoices):
        LEADER = 'leader', 'Leader'
        MEMBER = 'member', 'Member'

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='team_memberships')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('team', 'user')

    def __str__(self):
        return f"{self.user.email} in {self.team.name} ({self.role})"


class TeamInvitation(models.Model):
    class InvitationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        DECLINED = 'declined', 'Declined'
        EXPIRED = 'expired', 'Expired'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField(db_index=True)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations')
    status = models.CharField(max_length=20, choices=InvitationStatus.choices, default=InvitationStatus.PENDING)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('team', 'email')

    def __str__(self):
        return f"Invite for {self.email} to {self.team.name} ({self.status})"



