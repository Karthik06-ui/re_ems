from django.db import models
from django.conf import settings
from chapters.models import Chapter

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

    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=50, choices=EventType.choices, default=EventType.PHYSICAL)
    status = models.CharField(max_length=50, choices=EventStatus.choices, default=EventStatus.DRAFT)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    timezone = models.CharField(max_length=100, default='UTC')
    venue = models.CharField(max_length=255, blank=True)
    capacity = models.PositiveIntegerField(default=100)
    cover_image = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

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

    class Meta:
        unique_together = ('event', 'user')

    def __str__(self):
        return f"{self.user.email} - {self.event.title} ({self.status})"

class Waitlist(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='waitlists')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='waitlists')
    position = models.PositiveIntegerField()
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

class EventCohost(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='cohosts')
    cohost_chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='cohosted_events')

    class Meta:
        unique_together = ('event', 'cohost_chapter')

    def __str__(self):
        return f"{self.event.title} cohosted by {self.cohost_chapter.name}"
