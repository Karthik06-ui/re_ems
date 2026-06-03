from django.contrib import admin
from .models import EmailCampaign

@admin.register(EmailCampaign)
class EmailCampaignAdmin(admin.ModelAdmin):
    list_display = ('subject', 'chapter', 'audience', 'status', 'scheduled_at', 'sent_at', 'created_at')
    list_filter = ('status', 'audience', 'chapter')
    search_fields = ('subject', 'body')
