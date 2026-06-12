from django.contrib import admin
from .models import Sponsor, EventSponsor

@admin.register(Sponsor)
class SponsorAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier', 'created_at', 'deleted_at')
    list_filter = ('tier', 'deleted_at')
    search_fields = ('name',)

@admin.register(EventSponsor)
class EventSponsorAdmin(admin.ModelAdmin):
    list_display = ('event', 'sponsor', 'tier_override')
    search_fields = ('event__title', 'sponsor__name')
