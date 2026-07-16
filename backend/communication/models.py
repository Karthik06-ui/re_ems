from django.db import models
from django.conf import settings

class EmailCampaign(models.Model):
    class CampaignStatus(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SCHEDULED = 'scheduled', 'Scheduled'
        SENDING = 'sending', 'Sending'
        SENT = 'sent', 'Sent'
        FAILED = 'failed', 'Failed'
        CANCELLED = 'cancelled', 'Cancelled'

    event = models.ForeignKey('events.Event', on_delete=models.SET_NULL, null=True, blank=True, related_name='campaigns')
    subject = models.CharField(max_length=255)
    body = models.TextField()
    audience = models.CharField(max_length=50, default='all')  # e.g., 'all', 'registrants', 'waitlist'
    status = models.CharField(
        max_length=50, 
        choices=CampaignStatus.choices, 
        default=CampaignStatus.DRAFT
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_campaigns')
    created_by_profile = models.ForeignKey(
        'authentication.AdminProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='created_campaigns'
    )
    sent_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_campaigns')
    sent_by_profile = models.ForeignKey(
        'authentication.AdminProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sent_campaigns_profile'
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    actual_recipient_count = models.PositiveIntegerField(null=True, blank=True)
    delivery_result = models.TextField(null=True, blank=True)
    failure_reason = models.TextField(null=True, blank=True)

    @property
    def delivery_result_dict(self):
        import json
        try:
            return json.loads(self.delivery_result or '{}')
        except Exception:
            return {}

    class Meta:
        verbose_name = "Event Outreach"
        verbose_name_plural = "Event Outreach"

    def __str__(self):
        return self.subject
