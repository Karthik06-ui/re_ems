from django.contrib import admin
from .models import Event, Registration, Waitlist, Speaker, EventCohost

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'chapter', 'type', 'status', 'start_time', 'end_time', 'capacity', 'deleted_at')
    list_filter = ('type', 'status', 'chapter', 'deleted_at')
    search_fields = ('title', 'chapter__name', 'venue')

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'status', 'ticket_type', 'registered_at', 'checked_in_at')
    list_filter = ('status', 'ticket_type', 'event__chapter')
    search_fields = ('user__email', 'event__title')

@admin.register(Waitlist)
class WaitlistAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'position', 'created_at')
    list_filter = ('event__chapter',)
    search_fields = ('user__email', 'event__title')

@admin.register(Speaker)
class SpeakerAdmin(admin.ModelAdmin):
    list_display = ('name', 'event')
    search_fields = ('name', 'event__title')

@admin.register(EventCohost)
class EventCohostAdmin(admin.ModelAdmin):
    list_display = ('event', 'cohost_chapter')
    search_fields = ('event__title', 'cohost_chapter__name')
