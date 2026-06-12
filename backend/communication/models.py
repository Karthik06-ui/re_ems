from django.db import models

class EmailCampaign(models.Model):
    class CampaignStatus(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SCHEDULED = 'scheduled', 'Scheduled'
        SENDING = 'sending', 'Sending'
        SENT = 'sent', 'Sent'

    subject = models.CharField(max_length=255)
    body = models.TextField()
    audience = models.CharField(max_length=50, default='all')  # e.g., 'all', 'registrants', 'waitlist'
    status = models.CharField(
        max_length=50, 
        choices=CampaignStatus.choices, 
        default=CampaignStatus.DRAFT
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.subject
