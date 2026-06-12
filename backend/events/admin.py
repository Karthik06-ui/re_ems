from django.contrib import admin
from .models import Event, Registration, Waitlist, Speaker

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'status', 'start_time', 'end_time', 'capacity', 'deleted_at')
    list_filter = ('type', 'status', 'deleted_at')
    search_fields = ('title', 'venue')

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'status', 'ticket_type', 'registered_at', 'checked_in_at')
    list_filter = ('status', 'ticket_type')
    search_fields = ('user__email', 'event__title')

@admin.register(Waitlist)
class WaitlistAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'position', 'created_at')
    search_fields = ('user__email', 'event__title')

@admin.register(Speaker)
class SpeakerAdmin(admin.ModelAdmin):
    list_display = ('name', 'event')
    search_fields = ('name', 'event__title')
