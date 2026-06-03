from django.contrib import admin
from .models import Sponsor, EventSponsor

@admin.register(Sponsor)
class SponsorAdmin(admin.ModelAdmin):
    list_display = ('name', 'chapter', 'tier', 'created_at', 'deleted_at')
    list_filter = ('tier', 'chapter', 'deleted_at')
    search_fields = ('name', 'chapter__name')

@admin.register(EventSponsor)
class EventSponsorAdmin(admin.ModelAdmin):
    list_display = ('event', 'sponsor', 'tier_override')
    list_filter = ('event__chapter',)
    search_fields = ('event__title', 'sponsor__name')
